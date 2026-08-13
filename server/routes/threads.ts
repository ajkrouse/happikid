import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { strictPathInt } from "../lib/pathParams";
import { z } from "zod";
import { createLogger } from "../logger";
import { sendNewMessageNotification } from "../services/email";
import type { Provider } from "@shared/schema";

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
function providerOwnerUserId(provider: Provider): string | null {
  return provider.ownerUserId ?? provider.userId ?? null;
}

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
        return res.status(400).json({ message: "Invalid request", errors: parsed.error.errors });
      }
      const { providerId, body } = parsed.data;

      // Verify provider exists and has an in-platform recipient
      const provider = await storage.getProvider(providerId);
      if (!provider) return res.status(404).json({ message: "Provider not found" });

      const ownerUserId = providerOwnerUserId(provider);
      if (!ownerUserId) {
        return res.status(422).json({
          message: "This provider has not yet joined HappiKid — messaging is unavailable for this listing.",
        });
      }

      // A provider cannot message themselves
      if (userId === ownerUserId) {
        return res.status(400).json({ message: "You cannot message your own listing." });
      }

      // Get or create thread (idempotent)
      const thread = await storage.getOrCreateThread(userId, providerId);

      // Send the message
      const message = await storage.createThreadMessage(thread.id, userId, body);

      // Fire-and-forget email notification to provider owner (canonical)
      storage.getUser(ownerUserId).then(async (providerUser) => {
        if (!providerUser?.email) return;
        const senderUser = await storage.getUser(userId);
        const senderName = senderUser
          ? `${senderUser.firstName ?? ""} ${senderUser.lastName ?? ""}`.trim() || senderUser.email || "A parent"
          : "A parent";
        sendNewMessageNotification({
          recipientEmail: providerUser.email,
          recipientName: `${providerUser.firstName ?? ""} ${providerUser.lastName ?? ""}`.trim() || "Provider",
          senderName,
          providerName: provider.name,
          messagePreview: body.slice(0, 200),
          threadId: thread.id,
        }).catch(() => {});
      }).catch(() => {});

      res.status(201).json({ thread, message });
    } catch (error) {
      log.error({ err: error }, "Error creating thread");
      res.status(500).json({ message: "Failed to start conversation" });
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
      res.json(threads);
    } catch (error) {
      log.error({ err: error }, "Error listing threads");
      res.status(500).json({ message: "Failed to fetch conversations" });
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
      res.json(combined);
    } catch (error) {
      log.error({ err: error }, "Error listing provider threads");
      res.status(500).json({ message: "Failed to fetch conversations" });
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
      if (!threadId) return res.status(400).json({ message: "Invalid thread ID" });

      const thread = await storage.getThread(threadId);
      if (!thread) return res.status(404).json({ message: "Conversation not found" });

      // Access control: must be the parent or the canonical provider owner
      const provider = await storage.getProvider(thread.providerId);
      const ownerUserId = provider ? providerOwnerUserId(provider) : null;
      const isParent = thread.parentUserId === userId;
      const isProviderOwner = ownerUserId !== null && ownerUserId === userId;
      if (!isParent && !isProviderOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getThreadMessages(threadId);
      // Mark messages as read for this user
      await storage.markThreadMessagesRead(threadId, userId);

      res.json({ thread, messages, provider });
    } catch (error) {
      log.error({ err: error }, "Error fetching thread");
      res.status(500).json({ message: "Failed to fetch conversation" });
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
      if (!threadId) return res.status(400).json({ message: "Invalid thread ID" });

      const thread = await storage.getThread(threadId);
      if (!thread) return res.status(404).json({ message: "Conversation not found" });

      const provider = await storage.getProvider(thread.providerId);
      const ownerUserId = provider ? providerOwnerUserId(provider) : null;
      if (!provider || ownerUserId !== userId) {
        return res.status(403).json({ message: "Only the provider can update conversation status" });
      }

      const parsed = updateThreadStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid status", errors: parsed.error.errors });
      }

      const updated = await storage.updateThreadStatus(threadId, parsed.data.status);
      res.json(updated);
    } catch (error) {
      log.error({ err: error }, "Error updating thread status");
      res.status(500).json({ message: "Failed to update conversation" });
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
      if (!threadId) return res.status(400).json({ message: "Invalid thread ID" });

      const thread = await storage.getThread(threadId);
      if (!thread) return res.status(404).json({ message: "Conversation not found" });

      const provider = await storage.getProvider(thread.providerId);
      const ownerUserId = provider ? providerOwnerUserId(provider) : null;
      const isParent = thread.parentUserId === userId;
      const isProviderOwner = ownerUserId !== null && ownerUserId === userId;
      if (!isParent && !isProviderOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      const parsed = sendMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid message", errors: parsed.error.errors });
      }

      const message = await storage.createThreadMessage(threadId, userId, parsed.data.body);

      // Email the other party — use canonical owner for provider side
      const recipientUserId = isParent ? ownerUserId : thread.parentUserId;
      if (recipientUserId) {
        storage.getUser(recipientUserId).then(async (recipientUser) => {
          if (!recipientUser?.email) return;
          const senderUser = await storage.getUser(userId);
          const senderName = senderUser
            ? `${senderUser.firstName ?? ""} ${senderUser.lastName ?? ""}`.trim() || senderUser.email || "Someone"
            : "Someone";
          sendNewMessageNotification({
            recipientEmail: recipientUser.email,
            recipientName: `${recipientUser.firstName ?? ""} ${recipientUser.lastName ?? ""}`.trim() || "there",
            senderName,
            providerName: provider?.name ?? "a provider",
            messagePreview: parsed.data.body.slice(0, 200),
            threadId,
          }).catch(() => {});
        }).catch(() => {});
      }

      res.status(201).json(message);
    } catch (error) {
      log.error({ err: error }, "Error sending message");
      res.status(500).json({ message: "Failed to send message" });
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
      if (!threadId) return res.status(400).json({ message: "Invalid thread ID" });

      const thread = await storage.getThread(threadId);
      if (!thread) return res.status(404).json({ message: "Conversation not found" });

      const provider = await storage.getProvider(thread.providerId);
      const ownerUserId = provider ? providerOwnerUserId(provider) : null;
      const isParent = thread.parentUserId === userId;
      const isProviderOwner = ownerUserId !== null && ownerUserId === userId;
      if (!isParent && !isProviderOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.markThreadMessagesRead(threadId, userId);
      res.json({ ok: true });
    } catch (error) {
      log.error({ err: error }, "Error marking thread as read");
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });
}
