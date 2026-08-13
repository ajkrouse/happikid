/**
 * Server-side tests — thread access control.
 *
 * Confirms that:
 * 1. Unauthenticated requests to all thread endpoints return 401.
 * 2. GET /api/threads/:id returns 403 for a user not party to the thread.
 * 3. POST /api/threads/:id/messages returns 403 for a non-party user.
 * 4. PATCH /api/threads/:id returns 403 for a non-provider-owner.
 * 5. POST /api/threads/:id/read returns 403 for a non-party user.
 * 6. Non-integer / zero thread IDs return 400 on parameterised routes.
 * 7. Valid but non-existent thread IDs return 404.
 * 8. The parent (thread owner) and the canonical provider owner both get 200.
 * 9. POST /api/threads rejects self-messaging and missing providers.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// Module-level mocks — vi.mock is hoisted above imports by Vitest
// ---------------------------------------------------------------------------

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
    getProvider: vi.fn(),
    getOrCreateThread: vi.fn(),
    createThreadMessage: vi.fn(),
    getUser: vi.fn(),
    getThread: vi.fn(),
    getThreadMessages: vi.fn(),
    markThreadMessagesRead: vi.fn(),
    updateThreadStatus: vi.fn(),
    getThreadsForUser: vi.fn(),
    getThreadsByProviderId: vi.fn(),
    getProvidersByCanonicalOwner: vi.fn(),
  },
}));

vi.mock("../server/services/email", () => ({
  sendNewMessageNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../server/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { storage } from "../server/storage";
import { registerThreadRoutes } from "../server/routes/threads";

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

function buildApp() {
  const app = express();
  app.use(express.json());
  registerThreadRoutes(app);
  return app;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A provider whose canonical owner is "user_provider". */
function makeProvider(overrides: Record<string, unknown> = {}) {
  return {
    id: 42,
    name: "Sunshine Daycare",
    ownerUserId: "user_provider",
    userId: "user_provider",
    ...overrides,
  };
}

/** A thread between "user_parent" and provider 42. */
function makeThread(overrides: Record<string, unknown> = {}) {
  return {
    id: 99,
    parentUserId: "user_parent",
    providerId: 42,
    status: "open",
    ...overrides,
  };
}

function makeMessage() {
  return { id: 1, threadId: 99, senderUserId: "user_parent", body: "Hello!", createdAt: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// beforeEach — reset all mocks to a clean state
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.mocked(storage.getProvider).mockReset();
  vi.mocked(storage.getThread).mockReset();
  vi.mocked(storage.getThreadMessages).mockReset();
  vi.mocked(storage.markThreadMessagesRead).mockReset();
  vi.mocked(storage.updateThreadStatus).mockReset();
  vi.mocked(storage.createThreadMessage).mockReset();
  vi.mocked(storage.getOrCreateThread).mockReset();
  vi.mocked(storage.getUser).mockReset();
  vi.mocked(storage.getThreadsForUser).mockReset();
  vi.mocked(storage.getThreadsByProviderId).mockReset();
  vi.mocked(storage.getProvidersByCanonicalOwner).mockReset();
});

// ===========================================================================
// GET /api/threads/:id
// ===========================================================================

describe("GET /api/threads/:id — access control", () => {
  it("returns 401 when the request is unauthenticated", async () => {
    const res = await request(buildApp()).get("/api/threads/99");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: "Unauthorized" });
  });

  it("returns 400 for a non-integer thread ID", async () => {
    const res = await request(buildApp())
      .get("/api/threads/not-a-number")
      .set("x-test-user", "user_parent");
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: /invalid thread id/i });
  });

  it("returns 400 for a zero thread ID", async () => {
    const res = await request(buildApp())
      .get("/api/threads/0")
      .set("x-test-user", "user_parent");
    expect(res.status).toBe(400);
  });

  it("returns 400 for a float thread ID", async () => {
    const res = await request(buildApp())
      .get("/api/threads/1.5")
      .set("x-test-user", "user_parent");
    expect(res.status).toBe(400);
  });

  it("returns 404 when the thread does not exist", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(undefined);

    const res = await request(buildApp())
      .get("/api/threads/99")
      .set("x-test-user", "user_parent");
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ message: /not found/i });
  });

  it("returns 403 when the user is not the parent or provider owner", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);

    const res = await request(buildApp())
      .get("/api/threads/99")
      .set("x-test-user", "user_intruder");
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ message: /access denied/i });
    // Must not leak messages to an unauthorized user
    expect(storage.getThreadMessages).not.toHaveBeenCalled();
  });

  it("returns 200 and messages for the parent (thread owner)", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);
    vi.mocked(storage.getThreadMessages).mockResolvedValue([makeMessage()] as any);
    vi.mocked(storage.markThreadMessagesRead).mockResolvedValue(undefined);

    const res = await request(buildApp())
      .get("/api/threads/99")
      .set("x-test-user", "user_parent");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("thread");
    expect(res.body).toHaveProperty("messages");
  });

  it("returns 200 and messages for the canonical provider owner", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);
    vi.mocked(storage.getThreadMessages).mockResolvedValue([makeMessage()] as any);
    vi.mocked(storage.markThreadMessagesRead).mockResolvedValue(undefined);

    const res = await request(buildApp())
      .get("/api/threads/99")
      .set("x-test-user", "user_provider");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("thread");
    expect(res.body).toHaveProperty("messages");
  });

  it("returns 403 when ownerUserId is null and userId is different from the caller", async () => {
    // Provider with ownerUserId null — fall back to userId check (which is also "user_provider")
    // An intruder still gets 403.
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(
      makeProvider({ ownerUserId: null, userId: "user_provider" }) as any
    );

    const res = await request(buildApp())
      .get("/api/threads/99")
      .set("x-test-user", "user_intruder");
    expect(res.status).toBe(403);
  });

  it("allows provider owner via userId fallback when ownerUserId is null", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(
      makeProvider({ ownerUserId: null, userId: "user_provider" }) as any
    );
    vi.mocked(storage.getThreadMessages).mockResolvedValue([] as any);
    vi.mocked(storage.markThreadMessagesRead).mockResolvedValue(undefined);

    const res = await request(buildApp())
      .get("/api/threads/99")
      .set("x-test-user", "user_provider");
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// POST /api/threads/:id/messages
// ===========================================================================

describe("POST /api/threads/:id/messages — access control", () => {
  it("returns 401 when the request is unauthenticated", async () => {
    const res = await request(buildApp())
      .post("/api/threads/99/messages")
      .send({ body: "Hello!" });
    expect(res.status).toBe(401);
  });

  it("returns 400 for a non-integer thread ID", async () => {
    const res = await request(buildApp())
      .post("/api/threads/abc/messages")
      .set("x-test-user", "user_parent")
      .send({ body: "Hello!" });
    expect(res.status).toBe(400);
  });

  it("returns 404 when the thread does not exist", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(undefined);

    const res = await request(buildApp())
      .post("/api/threads/99/messages")
      .set("x-test-user", "user_parent")
      .send({ body: "Hello!" });
    expect(res.status).toBe(404);
  });

  it("returns 403 when the user is not party to the thread", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);

    const res = await request(buildApp())
      .post("/api/threads/99/messages")
      .set("x-test-user", "user_intruder")
      .send({ body: "I shouldn't be here." });
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ message: /access denied/i });
    expect(storage.createThreadMessage).not.toHaveBeenCalled();
  });

  it("returns 400 when the message body is empty", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);

    const res = await request(buildApp())
      .post("/api/threads/99/messages")
      .set("x-test-user", "user_parent")
      .send({ body: "" });
    expect(res.status).toBe(400);
    expect(storage.createThreadMessage).not.toHaveBeenCalled();
  });

  it("returns 400 when the message body exceeds 5000 characters", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);

    const res = await request(buildApp())
      .post("/api/threads/99/messages")
      .set("x-test-user", "user_parent")
      .send({ body: "x".repeat(5001) });
    expect(res.status).toBe(400);
    expect(storage.createThreadMessage).not.toHaveBeenCalled();
  });

  it("allows the parent to send a message", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);
    vi.mocked(storage.createThreadMessage).mockResolvedValue(makeMessage() as any);
    vi.mocked(storage.getUser).mockResolvedValue(null as any);

    const res = await request(buildApp())
      .post("/api/threads/99/messages")
      .set("x-test-user", "user_parent")
      .send({ body: "Is there availability?" });
    expect(res.status).toBe(201);
    expect(storage.createThreadMessage).toHaveBeenCalledWith(99, "user_parent", "Is there availability?");
  });

  it("allows the canonical provider owner to reply", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);
    vi.mocked(storage.createThreadMessage).mockResolvedValue({ ...makeMessage(), senderUserId: "user_provider" } as any);
    vi.mocked(storage.getUser).mockResolvedValue(null as any);

    const res = await request(buildApp())
      .post("/api/threads/99/messages")
      .set("x-test-user", "user_provider")
      .send({ body: "Yes, we have spots!" });
    expect(res.status).toBe(201);
    expect(storage.createThreadMessage).toHaveBeenCalledWith(99, "user_provider", "Yes, we have spots!");
  });
});

// ===========================================================================
// PATCH /api/threads/:id — status update
// ===========================================================================

describe("PATCH /api/threads/:id — access control", () => {
  it("returns 401 when the request is unauthenticated", async () => {
    const res = await request(buildApp())
      .patch("/api/threads/99")
      .send({ status: "enrolled" });
    expect(res.status).toBe(401);
  });

  it("returns 400 for a non-integer thread ID", async () => {
    const res = await request(buildApp())
      .patch("/api/threads/xyz")
      .set("x-test-user", "user_provider")
      .send({ status: "enrolled" });
    expect(res.status).toBe(400);
  });

  it("returns 404 when the thread does not exist", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(undefined);

    const res = await request(buildApp())
      .patch("/api/threads/99")
      .set("x-test-user", "user_provider")
      .send({ status: "enrolled" });
    expect(res.status).toBe(404);
  });

  it("returns 403 when a non-provider-owner tries to change status", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);

    const res = await request(buildApp())
      .patch("/api/threads/99")
      .set("x-test-user", "user_parent") // the parent, not the provider
      .send({ status: "enrolled" });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/only the provider/i);
    expect(storage.updateThreadStatus).not.toHaveBeenCalled();
  });

  it("returns 403 when a random intruder tries to change status", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);

    const res = await request(buildApp())
      .patch("/api/threads/99")
      .set("x-test-user", "user_intruder")
      .send({ status: "not_a_fit" });
    expect(res.status).toBe(403);
    expect(storage.updateThreadStatus).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid status value", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);

    const res = await request(buildApp())
      .patch("/api/threads/99")
      .set("x-test-user", "user_provider")
      .send({ status: "unknown_status" });
    expect(res.status).toBe(400);
    expect(storage.updateThreadStatus).not.toHaveBeenCalled();
  });

  it("allows the canonical provider owner to update status", async () => {
    const updated = { ...makeThread(), status: "enrolled" };
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);
    vi.mocked(storage.updateThreadStatus).mockResolvedValue(updated as any);

    const res = await request(buildApp())
      .patch("/api/threads/99")
      .set("x-test-user", "user_provider")
      .send({ status: "enrolled" });
    expect(res.status).toBe(200);
    expect(storage.updateThreadStatus).toHaveBeenCalledWith(99, "enrolled");
  });
});

// ===========================================================================
// POST /api/threads/:id/read
// ===========================================================================

describe("POST /api/threads/:id/read — access control", () => {
  it("returns 401 when the request is unauthenticated", async () => {
    const res = await request(buildApp()).post("/api/threads/99/read");
    expect(res.status).toBe(401);
  });

  it("returns 400 for a non-integer thread ID", async () => {
    const res = await request(buildApp())
      .post("/api/threads/nope/read")
      .set("x-test-user", "user_parent");
    expect(res.status).toBe(400);
  });

  it("returns 404 when the thread does not exist", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(undefined);

    const res = await request(buildApp())
      .post("/api/threads/99/read")
      .set("x-test-user", "user_parent");
    expect(res.status).toBe(404);
  });

  it("returns 403 when the user is not party to the thread", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);

    const res = await request(buildApp())
      .post("/api/threads/99/read")
      .set("x-test-user", "user_intruder");
    expect(res.status).toBe(403);
    expect(storage.markThreadMessagesRead).not.toHaveBeenCalled();
  });

  it("allows the parent to mark the thread as read", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);
    vi.mocked(storage.markThreadMessagesRead).mockResolvedValue(undefined);

    const res = await request(buildApp())
      .post("/api/threads/99/read")
      .set("x-test-user", "user_parent");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true });
    expect(storage.markThreadMessagesRead).toHaveBeenCalledWith(99, "user_parent");
  });

  it("allows the canonical provider owner to mark the thread as read", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);
    vi.mocked(storage.markThreadMessagesRead).mockResolvedValue(undefined);

    const res = await request(buildApp())
      .post("/api/threads/99/read")
      .set("x-test-user", "user_provider");
    expect(res.status).toBe(200);
    expect(storage.markThreadMessagesRead).toHaveBeenCalledWith(99, "user_provider");
  });
});

// ===========================================================================
// POST /api/threads — start a new thread
// ===========================================================================

describe("POST /api/threads — create thread", () => {
  it("returns 401 when the request is unauthenticated", async () => {
    const res = await request(buildApp())
      .post("/api/threads")
      .send({ providerId: 42, body: "Hello!" });
    expect(res.status).toBe(401);
  });

  it("returns 400 for an invalid request body", async () => {
    const res = await request(buildApp())
      .post("/api/threads")
      .set("x-test-user", "user_parent")
      .send({ providerId: "not-a-number", body: "Hello!" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when message body is empty", async () => {
    const res = await request(buildApp())
      .post("/api/threads")
      .set("x-test-user", "user_parent")
      .send({ providerId: 42, body: "" });
    expect(res.status).toBe(400);
  });

  it("returns 404 when the provider does not exist", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(undefined);

    const res = await request(buildApp())
      .post("/api/threads")
      .set("x-test-user", "user_parent")
      .send({ providerId: 42, body: "Hello!" });
    expect(res.status).toBe(404);
  });

  it("returns 422 when the provider has no in-platform owner", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(
      makeProvider({ ownerUserId: null, userId: null }) as any
    );

    const res = await request(buildApp())
      .post("/api/threads")
      .set("x-test-user", "user_parent")
      .send({ providerId: 42, body: "Hello!" });
    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/not yet joined/i);
  });

  it("returns 400 when the provider owner tries to message their own listing", async () => {
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);

    const res = await request(buildApp())
      .post("/api/threads")
      .set("x-test-user", "user_provider") // same as ownerUserId
      .send({ providerId: 42, body: "Hello myself!" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot message your own listing/i);
  });

  it("creates a thread and first message for a valid parent request", async () => {
    const thread = makeThread();
    const message = makeMessage();
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);
    vi.mocked(storage.getOrCreateThread).mockResolvedValue(thread as any);
    vi.mocked(storage.createThreadMessage).mockResolvedValue(message as any);
    vi.mocked(storage.getUser).mockResolvedValue(null as any);

    const res = await request(buildApp())
      .post("/api/threads")
      .set("x-test-user", "user_parent")
      .send({ providerId: 42, body: "Is there availability?" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("thread");
    expect(res.body).toHaveProperty("message");
    expect(storage.getOrCreateThread).toHaveBeenCalledWith("user_parent", 42);
    expect(storage.createThreadMessage).toHaveBeenCalledWith(thread.id, "user_parent", "Is there availability?");
  });
});

// ===========================================================================
// GET /api/threads (list own threads)
// ===========================================================================

describe("GET /api/threads — list own threads", () => {
  it("returns 401 when the request is unauthenticated", async () => {
    const res = await request(buildApp()).get("/api/threads");
    expect(res.status).toBe(401);
  });

  it("returns the caller's threads", async () => {
    vi.mocked(storage.getThreadsForUser).mockResolvedValue([makeThread()] as any);

    const res = await request(buildApp())
      .get("/api/threads")
      .set("x-test-user", "user_parent");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(storage.getThreadsForUser).toHaveBeenCalledWith("user_parent");
  });
});

// ===========================================================================
// GET /api/threads/provider/list
// ===========================================================================

describe("GET /api/threads/provider/list — provider inbox", () => {
  it("returns 401 when the request is unauthenticated", async () => {
    const res = await request(buildApp()).get("/api/threads/provider/list");
    expect(res.status).toBe(401);
  });

  it("returns [] when the user owns no providers", async () => {
    vi.mocked(storage.getProvidersByCanonicalOwner).mockResolvedValue([]);

    const res = await request(buildApp())
      .get("/api/threads/provider/list")
      .set("x-test-user", "user_provider");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns combined threads for all owned providers", async () => {
    const thread1 = { ...makeThread(), latestMessage: { createdAt: "2026-01-02T00:00:00Z" } };
    const thread2 = { ...makeThread(), id: 100, latestMessage: { createdAt: "2026-01-01T00:00:00Z" } };
    vi.mocked(storage.getProvidersByCanonicalOwner).mockResolvedValue([makeProvider()] as any);
    vi.mocked(storage.getThreadsByProviderId).mockResolvedValue([thread1, thread2] as any);

    const res = await request(buildApp())
      .get("/api/threads/provider/list")
      .set("x-test-user", "user_provider");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    // Most-recent thread should be first
    expect(res.body[0].id).toBe(thread1.id);
  });

  it("does not expose threads to a user who owns no providers", async () => {
    vi.mocked(storage.getProvidersByCanonicalOwner).mockResolvedValue([]);

    const res = await request(buildApp())
      .get("/api/threads/provider/list")
      .set("x-test-user", "user_intruder");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    // getThreadsByProviderId should never be called when there are no owned providers
    expect(storage.getThreadsByProviderId).not.toHaveBeenCalled();
  });
});
