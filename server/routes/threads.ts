import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { strictPathInt } from "../lib/pathParams";
import { apiError } from "../lib/apiError";
import { z } from "zod";
import { createLogger } from "../logger";
import { generateReplyDraft } from "../services/aiReply";
import { aiLimiter } from "../middleware/rateLimiter";
import type { Provider } from "@shared/schema";
import {
  getCanonicalProviderOwnerUserId,
  isPublicProvider,
  toPublicProvider,
} from "../lib/providerAccess";

const log = createLogger("threads");

const sendMessageSchema = z.object({
  body: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
});

const updateThreadStatusSchema = z.object({
  status: z.enum(["open", "enrolled", "not_a_fit"]),
});

const startThreadSchema = z.object({
  providerId: z.number().int().positive(),
  body: z.string().min(1, "Message cannot be empty").max(5000),
});

/**
 * Canonical messaging-owner resolver.
 * A claimed/imported listing has its verified owner in `ownerUserId`.
 * Fall back to `userId` for listings that were created directly and never claimed.
 * Returns null only when neither field is set (no in-platform recipient exists).
 */
const providerOwnerUserId = getCanonicalProviderOwnerUserId;

export function registerThreadRoutes(app: Express): void {
  /**
   * POST /api/threads
   * Parent starts a thread with a provider (or reuses an existing one).
   * Body: { providerId: number; body: string }
   */
  app.post("/api/threads", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub as string;
      const parsed = startThreadSchema.safeParse(req.body);
      if (!parsed.success) {
        return apiError(res, 400, "Invalid request", { errors: parsed.error.errors });
      }
      const { providerId, body } = parsed.data;

      // Messages can only be started for a currently family-visible listing.
      const provider = await storage.getProvider(providerId);
      if (!provider || !isPublicProvider(provider)) return apiError(res, 404, "Provider not found");

      const ownerUserId = providerOwnerUserId(provider);
      if (!ownerUserId) {
        return apiError(res, 422, "This provider has not yet joined HappiKid — messaging is unavailable for this listing.");
      }

      // A provider cannot message themselves
      if (userId === ownerUserId) {
        return apiError(res, 400, "You cannot message your own listing.");
      }

      // Get or create thread (idempotent)
      const thread = await storage.getOrCreateThread(userId, providerId);

      const providerUser = await storage.getUser(ownerUserId);
      const senderUser = providerUser?.email ? await storage.getUser(userId) : undefined;
      const notification = providerUser?.email ? {
        eventType: "thread_message" as const,
        payload: {
          type: "thread_message" as const,
          recipientEmail: providerUser.email,
          recipientName: `${providerUser.firstName ?? ""} ${providerUser.lastName ?? ""}`.trim() || "Provider",
          senderName: senderUser
            ? `${senderUser.firstName ?? ""} ${senderUser.lastName ?? ""}`.trim() || senderUser.email || "A parent"
            : "A parent",
          providerName: provider.name,
          messagePreview: body.slice(0, 200),
          threadId: thread.id,
        },
      } : undefined;

      // Persist the message and durable notification in one transaction.
      const message = await storage.createThreadMessageWithNotification(thread.id, userId, body, notification);

      res.status(201).json({ thread, message });
    } catch (error) {
      log.error({ err: error }, "Error creating thread");
      apiError(res, 500, "Failed to start conversation");
    }
  });

  /**
   * GET /api/threads
   * List the caller's threads with latest message and unread count.
   */
  app.get("/api/threads", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub as string;
      const threads = await storage.getThreadsForUser(userId);
      // Defense in depth: AI drafts are provider-side working state and must never
      // reach parents through the shared list endpoint. Storage already strips
      // these fields; redact again here in case a storage change reintroduces them.
      res.json(threads.map(({ aiDraftBody, aiDraftMessageId, ...t }: any) => t));
    } catch (error) {
      log.error({ err: error }, "Error listing threads");
      apiError(res, 500, "Failed to fetch conversations");
    }
  });

  /**
   * GET /api/threads/provider/list  ← MUST be registered BEFORE /api/threads/:id
   * List all threads across ALL canonically owned provider listings.
   * Uses ownership rule: ownerUserId wins; userId is only the owner when ownerUserId IS NULL.
   */
  app.get("/api/threads/provider/list", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub as string;
      const ownedProviders = await storage.getProvidersByCanonicalOwner(userId);
      if (ownedProviders.length === 0) return res.json([]);

      // Aggregate threads for every owned listing (not just the first)
      const allThreadArrays = await Promise.all(
        ownedProviders.map((p) => storage.getThreadsByProviderId(p.id, userId))
      );
      // Flatten and sort by latest message descending
      const combined = allThreadArrays.flat().sort(
        (a, b) =>
          (b.latestMessage?.createdAt ? new Date(b.latestMessage.createdAt).getTime() : 0) -
          (a.latestMessage?.createdAt ? new Date(a.latestMessage.createdAt).getTime() : 0)
      );
      // Redact AI draft fields from list responses (drafts are surfaced only in
      // the owner-gated thread detail endpoint)
      res.json(combined.map(({ aiDraftBody, aiDraftMessageId, ...t }: any) => t));
    } catch (error) {
      log.error({ err: error }, "Error listing provider threads");
      apiError(res, 500, "Failed to fetch conversations");
    }
  });

  /**
   * GET /api/threads/:id
   * Full thread with all messages (marks as read for caller).
   */
  app.get("/api/threads/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub as string;
      const threadId = strictPathInt(req.params.id);
      if (!threadId) return apiError(res, 400, "Invalid thread ID");

      const thread = await storage.getThread(threadId);
      if (!thread) return apiError(res, 404, "Conversation not found");

      // Access control: must be the parent or the canonical provider owner
      const provider = await storage.getProvider(thread.providerId);
      const ownerUserId = provider ? providerOwnerUserId(provider) : null;
      const isParent = thread.parentUserId === userId;
      const isProviderOwner = ownerUserId !== null && ownerUserId === userId;
      if (!isParent && !isProviderOwner) {
        return apiError(res, 403, "Access denied");
      }
      // A parent may only continue viewing a conversation while its provider
      // listing remains family-visible. The provider owner can still access
      // their own private listing to manage existing conversations.
      if (isParent && (!provider || !isPublicProvider(provider))) {
        return apiError(res, 404, "Provider not found");
      }

      const messages = await storage.getThreadMessages(threadId);
      // Mark messages as read for this user
      await storage.markThreadMessagesRead(threadId, userId);

      // AI draft replies are provider-side only — never expose them to the parent
      const responseThread = isProviderOwner
        ? thread
        : { ...thread, aiDraftBody: null, aiDraftMessageId: null };

      res.json({
        thread: responseThread,
        messages,
        provider: isProviderOwner ? provider : provider ? toPublicProvider(provider as any) : null,
      });
    } catch (error) {
      log.error({ err: error }, "Error fetching thread");
      apiError(res, 500, "Failed to fetch conversation");
    }
  });

  /**
   * PATCH /api/threads/:id
   * Provider updates thread status (enrolled / not_a_fit / open).
   */
  app.patch("/api/threads/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub as string;
      const threadId = strictPathInt(req.params.id);
      if (!threadId) return apiError(res, 400, "Invalid thread ID");

      const thread = await storage.getThread(threadId);
      if (!thread) return apiError(res, 404, "Conversation not found");

      const provider = await storage.getProvider(thread.providerId);
      const ownerUserId = provider ? providerOwnerUserId(provider) : null;
      if (!provider || ownerUserId !== userId) {
        return apiError(res, 403, "Only the provider can update conversation status");
      }

      const parsed = updateThreadStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return apiError(res, 400, "Invalid status", { errors: parsed.error.errors });
      }

      const updated = await storage.updateThreadStatus(threadId, parsed.data.status);
      res.json(updated);
    } catch (error) {
      log.error({ err: error }, "Error updating thread status");
      apiError(res, 500, "Failed to update conversation");
    }
  });

  /**
   * POST /api/threads/:id/messages
   * Send a message in a thread.
   */
  app.post("/api/threads/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub as string;
      const threadId = strictPathInt(req.params.id);
      if (!threadId) return apiError(res, 400, "Invalid thread ID");

      const thread = await storage.getThread(threadId);
      if (!thread) return apiError(res, 404, "Conversation not found");

      const provider = await storage.getProvider(thread.providerId);
      const ownerUserId = provider ? providerOwnerUserId(provider) : null;
      const isParent = thread.parentUserId === userId;
      const isProviderOwner = ownerUserId !== null && ownerUserId === userId;
      if (!isParent && !isProviderOwner) {
        return apiError(res, 403, "Access denied");
      }
      if (isParent && (!provider || !isPublicProvider(provider))) {
        return apiError(res, 404, "Provider not found");
      }

      const parsed = sendMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return apiError(res, 400, "Invalid message", { errors: parsed.error.errors });
      }

      // Resolve notification data before the domain write so it can share that
      // write's transaction. Do not put a notification in the outbox when no
      // recipient email exists — that preserves the existing recipient rule.
      const recipientUserId = isParent ? ownerUserId : thread.parentUserId;
      const recipientUser = recipientUserId ? await storage.getUser(recipientUserId) : undefined;
      const senderUser = recipientUser?.email ? await storage.getUser(userId) : undefined;
      const notification = recipientUser?.email ? {
        eventType: "thread_message" as const,
        payload: {
          type: "thread_message" as const,
          recipientEmail: recipientUser.email,
          recipientName: `${recipientUser.firstName ?? ""} ${recipientUser.lastName ?? ""}`.trim() || "there",
          senderName: senderUser
            ? `${senderUser.firstName ?? ""} ${senderUser.lastName ?? ""}`.trim() || senderUser.email || "Someone"
            : "Someone",
          providerName: provider?.name ?? "a provider",
          messagePreview: parsed.data.body.slice(0, 200),
          threadId,
        },
      } : undefined;
      const message = await storage.createThreadMessageWithNotification(threadId, userId, parsed.data.body, notification);

      // Once the provider replies, any pending AI draft is spent — clear it
      if (isProviderOwner && thread.aiDraftBody) {
        storage.clearThreadAiDraft(threadId).catch(() => {});
      }

      res.status(201).json(message);
    } catch (error) {
      log.error({ err: error }, "Error sending message");
      apiError(res, 500, "Failed to send message");
    }
  });

  /**
   * POST /api/threads/:id/ai-draft
   * Generate (or regenerate) an AI draft reply for the latest parent message.
   * Provider owner only; requires the provider's aiAutoReplyEnabled setting.
   * The draft is stored on the thread and returned — it is never auto-sent.
   */
  app.post("/api/threads/:id/ai-draft", isAuthenticated, aiLimiter, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub as string;
      const threadId = strictPathInt(req.params.id);
      if (!threadId) return apiError(res, 400, "Invalid thread ID");

      const thread = await storage.getThread(threadId);
      if (!thread) return apiError(res, 404, "Conversation not found");

      const provider = await storage.getProvider(thread.providerId);
      const ownerUserId = provider ? providerOwnerUserId(provider) : null;
      if (!provider || ownerUserId !== userId) {
        return apiError(res, 403, "Only the provider can generate AI draft replies");
      }
      if (!provider.aiAutoReplyEnabled || !provider.aiDataProcessingConsentAt) {
        return apiError(res, 400, "AI draft replies require an enabled setting and confirmed data-processing consent");
      }

      const messages = await storage.getThreadMessages(threadId);
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.senderUserId === userId) {
        return apiError(res, 400, "No parent message to reply to");
      }

      // Reuse a cached draft generated for this same parent message
      if (thread.aiDraftBody && thread.aiDraftMessageId === lastMessage.id) {
        return res.json({ draft: thread.aiDraftBody, forMessageId: thread.aiDraftMessageId });
      }

      const draft = await generateReplyDraft(provider, messages, ownerUserId);
      if (!draft) {
        return apiError(res, 502, "Could not generate a draft right now. Please try again or write your own reply.");
      }

      await storage.setThreadAiDraft(threadId, draft, lastMessage.id);
      res.json({ draft, forMessageId: lastMessage.id });
    } catch (error) {
      log.error({ err: error }, "Error generating AI draft");
      apiError(res, 500, "Failed to generate AI draft");
    }
  });

  /**
   * DELETE /api/threads/:id/ai-draft
   * Discard the stored AI draft (provider owner only).
   */
  app.delete("/api/threads/:id/ai-draft", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub as string;
      const threadId = strictPathInt(req.params.id);
      if (!threadId) return apiError(res, 400, "Invalid thread ID");

      const thread = await storage.getThread(threadId);
      if (!thread) return apiError(res, 404, "Conversation not found");

      const provider = await storage.getProvider(thread.providerId);
      const ownerUserId = provider ? providerOwnerUserId(provider) : null;
      if (!provider || ownerUserId !== userId) {
        return apiError(res, 403, "Only the provider can discard AI draft replies");
      }

      // Keep aiDraftMessageId as a discard marker so the client does not
      // immediately auto-regenerate a draft for the same parent message.
      await storage.clearThreadAiDraft(threadId, { keepMarker: true });
      res.json({ ok: true });
    } catch (error) {
      log.error({ err: error }, "Error discarding AI draft");
      apiError(res, 500, "Failed to discard AI draft");
    }
  });

  /**
   * POST /api/threads/:id/read
   * Mark all messages in the thread as read for the caller.
   */
  app.post("/api/threads/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub as string;
      const threadId = strictPathInt(req.params.id);
      if (!threadId) return apiError(res, 400, "Invalid thread ID");

      const thread = await storage.getThread(threadId);
      if (!thread) return apiError(res, 404, "Conversation not found");

      const provider = await storage.getProvider(thread.providerId);
      const ownerUserId = provider ? providerOwnerUserId(provider) : null;
      const isParent = thread.parentUserId === userId;
      const isProviderOwner = ownerUserId !== null && ownerUserId === userId;
      if (!isParent && !isProviderOwner) {
        return apiError(res, 403, "Access denied");
      }

      await storage.markThreadMessagesRead(threadId, userId);
      res.json({ ok: true });
    } catch (error) {
      log.error({ err: error }, "Error marking thread as read");
      apiError(res, 500, "Failed to mark as read");
    }
  });
}
