/**
 * Server-side tests — AI draft reply endpoints.
 *
 * Confirms that:
 * 1. POST /api/threads/:id/ai-draft requires authentication.
 * 2. Only the canonical provider owner can generate or discard drafts (parent gets 403).
 * 3. Generation is rejected when the provider has AI auto-reply disabled.
 * 4. Generation is rejected when the latest message is from the provider.
 * 5. A cached draft for the same parent message is reused without regenerating.
 * 6. A new draft is generated, stored, and returned for a fresh parent message.
 * 7. Generation failure returns 502 (no silent fallback).
 * 8. DELETE /api/threads/:id/ai-draft clears the draft for the provider owner.
 * 9. GET /api/threads/:id hides the draft from the parent but returns it to the owner.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../server/replitAuth", () => ({
  isAuthenticated: vi.fn((req: any, res: any, next: any) => {
    const user = req.headers["x-test-user"];
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    req.user = { claims: { sub: user } };
    next();
  }),
  setupAuth: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../server/storage", () => ({
  storage: {
    getThreadsForUser: vi.fn(),
    getProvidersByCanonicalOwner: vi.fn(),
    getThreadsByProviderId: vi.fn(),
    getProvider: vi.fn(),
    getThread: vi.fn(),
    getThreadMessages: vi.fn(),
    markThreadMessagesRead: vi.fn(),
    setThreadAiDraft: vi.fn(),
    clearThreadAiDraft: vi.fn(),
    getUser: vi.fn(),
    createThreadMessage: vi.fn(),
    createThreadMessageWithNotification: vi.fn(),
  },
}));

vi.mock("../server/services/email", () => ({
  sendNewMessageNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../server/services/aiReply", () => ({
  generateReplyDraft: vi.fn(),
}));

vi.mock("../server/logger", () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { storage } from "../server/storage";
import { generateReplyDraft } from "../server/services/aiReply";
import { registerThreadRoutes } from "../server/routes/threads";

function buildApp() {
  const app = express();
  app.use(express.json());
  registerThreadRoutes(app);
  return app;
}

const OWNER = "owner-1";
const PARENT = "parent-1";

const provider = {
  id: 10,
  name: "Sunny Days",
  ownerUserId: OWNER,
  userId: null,
  aiAutoReplyEnabled: true,
  aiDataProcessingConsentAt: new Date("2026-08-25T00:00:00.000Z"),
  isActive: true,
  licenseStatus: "confirmed",
  isProfileVisible: true,
  isProfilePublic: true,
};

const baseThread = {
  id: 5,
  parentUserId: PARENT,
  providerId: 10,
  status: "open",
  aiDraftBody: null,
  aiDraftMessageId: null,
};

const parentMsg = { id: 100, threadId: 5, senderUserId: PARENT, body: "Do you provide lunch?" };
const providerMsg = { id: 101, threadId: 5, senderUserId: OWNER, body: "Yes we do!" };

describe("AI draft endpoints", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
    (storage.getThread as any).mockResolvedValue({ ...baseThread });
    (storage.getProvider as any).mockResolvedValue({ ...provider });
    (storage.getThreadMessages as any).mockResolvedValue([parentMsg]);
    (storage.markThreadMessagesRead as any).mockResolvedValue(undefined);
    (storage.setThreadAiDraft as any).mockResolvedValue({});
    (storage.clearThreadAiDraft as any).mockResolvedValue(undefined);
  });

  it("requires authentication", async () => {
    await request(app).post("/api/threads/5/ai-draft").expect(401);
    await request(app).delete("/api/threads/5/ai-draft").expect(401);
  });

  it("rejects the parent (403)", async () => {
    await request(app).post("/api/threads/5/ai-draft").set("x-test-user", PARENT).expect(403);
    await request(app).delete("/api/threads/5/ai-draft").set("x-test-user", PARENT).expect(403);
  });

  it("rejects when AI auto-reply is disabled", async () => {
    (storage.getProvider as any).mockResolvedValue({ ...provider, aiAutoReplyEnabled: false });
    const res = await request(app).post("/api/threads/5/ai-draft").set("x-test-user", OWNER).expect(400);
    expect(res.body.message).toMatch(/enabled setting/i);
  });

  it("rejects when the latest message is from the provider", async () => {
    (storage.getThreadMessages as any).mockResolvedValue([parentMsg, providerMsg]);
    await request(app).post("/api/threads/5/ai-draft").set("x-test-user", OWNER).expect(400);
    expect(generateReplyDraft).not.toHaveBeenCalled();
  });

  it("reuses a cached draft for the same parent message", async () => {
    (storage.getThread as any).mockResolvedValue({
      ...baseThread,
      aiDraftBody: "Cached draft",
      aiDraftMessageId: 100,
    });
    const res = await request(app).post("/api/threads/5/ai-draft").set("x-test-user", OWNER).expect(200);
    expect(res.body).toEqual({ draft: "Cached draft", forMessageId: 100 });
    expect(generateReplyDraft).not.toHaveBeenCalled();
  });

  it("generates, stores, and returns a fresh draft", async () => {
    (generateReplyDraft as any).mockResolvedValue("Yes, lunch is included daily.");
    const res = await request(app).post("/api/threads/5/ai-draft").set("x-test-user", OWNER).expect(200);
    expect(res.body).toEqual({ draft: "Yes, lunch is included daily.", forMessageId: 100 });
    expect(storage.setThreadAiDraft).toHaveBeenCalledWith(5, "Yes, lunch is included daily.", 100);
  });

  it("returns 502 when generation fails", async () => {
    (generateReplyDraft as any).mockResolvedValue(null);
    await request(app).post("/api/threads/5/ai-draft").set("x-test-user", OWNER).expect(502);
    expect(storage.setThreadAiDraft).not.toHaveBeenCalled();
  });

  it("DELETE clears the draft but keeps the discard marker so it is not regenerated", async () => {
    await request(app).delete("/api/threads/5/ai-draft").set("x-test-user", OWNER).expect(200);
    expect(storage.clearThreadAiDraft).toHaveBeenCalledWith(5, { keepMarker: true });
  });

  it("a discarded draft (marker without body) is not treated as cached — explicit POST regenerates", async () => {
    (storage.getThread as any).mockResolvedValue({
      ...baseThread,
      aiDraftBody: null,
      aiDraftMessageId: 100, // discarded for message 100
    });
    (generateReplyDraft as any).mockResolvedValue("Fresh draft");
    const res = await request(app).post("/api/threads/5/ai-draft").set("x-test-user", OWNER).expect(200);
    expect(res.body.draft).toBe("Fresh draft");
    expect(generateReplyDraft).toHaveBeenCalled();
  });

  it("GET /api/threads/:id hides drafts from the parent but shows them to the owner", async () => {
    (storage.getThread as any).mockResolvedValue({
      ...baseThread,
      aiDraftBody: "Secret draft",
      aiDraftMessageId: 100,
    });
    const parentRes = await request(app).get("/api/threads/5").set("x-test-user", PARENT).expect(200);
    expect(parentRes.body.thread.aiDraftBody).toBeNull();
    expect(parentRes.body.thread.aiDraftMessageId).toBeNull();

    const ownerRes = await request(app).get("/api/threads/5").set("x-test-user", OWNER).expect(200);
    expect(ownerRes.body.thread.aiDraftBody).toBe("Secret draft");
  });

  it("GET /api/threads (list) never exposes AI draft fields, even if storage returns them", async () => {
    (storage.getThreadsForUser as any).mockResolvedValue([
      { ...baseThread, aiDraftBody: "Leaked draft", aiDraftMessageId: 100, unreadCount: 0 },
    ]);
    const res = await request(app).get("/api/threads").set("x-test-user", PARENT).expect(200);
    expect(res.body[0]).not.toHaveProperty("aiDraftBody");
    expect(res.body[0]).not.toHaveProperty("aiDraftMessageId");
  });

  it("GET /api/threads/provider/list redacts AI draft fields from list responses", async () => {
    (storage.getProvidersByCanonicalOwner as any).mockResolvedValue([{ id: 10 }]);
    (storage.getThreadsByProviderId as any).mockResolvedValue([
      { ...baseThread, aiDraftBody: "Leaked draft", aiDraftMessageId: 100, latestMessage: null },
    ]);
    const res = await request(app).get("/api/threads/provider/list").set("x-test-user", OWNER).expect(200);
    expect(res.body[0]).not.toHaveProperty("aiDraftBody");
    expect(res.body[0]).not.toHaveProperty("aiDraftMessageId");
  });

  it("clears a pending draft when the provider sends a reply", async () => {
    (storage.getThread as any).mockResolvedValue({
      ...baseThread,
      aiDraftBody: "Pending draft",
      aiDraftMessageId: 100,
    });
    (storage.createThreadMessage as any).mockResolvedValue({ id: 102 });
    (storage.getUser as any).mockResolvedValue(null);
    await request(app)
      .post("/api/threads/5/messages")
      .set("x-test-user", OWNER)
      .send({ body: "Yes, lunch is included." })
      .expect(201);
    expect(storage.clearThreadAiDraft).toHaveBeenCalledWith(5);
  });
});
