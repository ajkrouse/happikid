/**
 * Email notification smoke-tests for the messaging feature.
 *
 * Confirms that:
 * 1. POST /api/threads dispatches sendNewMessageNotification to the provider
 *    owner when a parent starts a new thread.
 * 2. POST /api/threads/:id/messages dispatches the notification to the
 *    recipient on both sides (parent → provider, provider → parent).
 * 3. The notification is NOT dispatched when the recipient has no email.
 * 4. sendNewMessageNotification itself produces a subject line that contains
 *    both the sender name and the provider name.
 * 5. The thread URL in the generated HTML and plain-text body correctly
 *    encodes the thread ID.
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

vi.mock("../server/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// We do NOT mock the email service here — instead we mock nodemailer so we
// can verify the real sendNewMessageNotification logic end-to-end without
// touching a live SMTP server.
// ---------------------------------------------------------------------------

const mockSendMail = vi.fn().mockResolvedValue({ messageId: "test-id" });

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: mockSendMail })),
  },
}));

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------

import { storage } from "../server/storage";
import { registerThreadRoutes } from "../server/routes/threads";
import { sendNewMessageNotification } from "../server/services/email";

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

function makeProvider(overrides: Record<string, unknown> = {}) {
  return {
    id: 42,
    name: "Sunshine Daycare",
    ownerUserId: "user_provider",
    userId: "user_provider",
    isActive: true,
    licenseStatus: "confirmed",
    isProfileVisible: true,
    isProfilePublic: true,
    ...overrides,
  };
}

function makeThread(overrides: Record<string, unknown> = {}) {
  return {
    id: 99,
    parentUserId: "user_parent",
    providerId: 42,
    status: "open",
    ...overrides,
  };
}

function makeMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    threadId: 99,
    senderUserId: "user_parent",
    body: "Hello!",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeUser(
  id: string,
  firstName: string,
  lastName: string,
  email: string
) {
  return { id, firstName, lastName, email };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Flush micro-tasks so the fire-and-forget email promise resolves. */
async function flushPromises() {
  await new Promise((r) => setImmediate(r));
}

// ---------------------------------------------------------------------------
// beforeEach — reset mocks
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
  mockSendMail.mockClear();
});

// ===========================================================================
// Unit tests for sendNewMessageNotification itself
// ===========================================================================

describe("sendNewMessageNotification — email content", () => {
  // Provide SMTP env vars so the real sendEmail path is exercised.
  beforeEach(() => {
    process.env.SMTP_HOST = "smtp.test";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user@test.com";
    process.env.SMTP_PASS = "secret";
    process.env.SMTP_FROM = "HappiKid <noreply@happikid.com>";
    // Control the base URL so thread links are predictable.
    process.env.APP_BASE_URL = "https://happikid.com";
  });

  afterEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
    delete process.env.APP_BASE_URL;
  });

  it("calls sendMail once for a notification", async () => {
    await sendNewMessageNotification({
      recipientEmail: "provider@example.com",
      recipientName: "Jane Provider",
      senderName: "Alex Parent",
      providerName: "Sunshine Daycare",
      messagePreview: "Is there availability for September?",
      threadId: 99,
    });

    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it("subject line includes the sender name and provider name", async () => {
    await sendNewMessageNotification({
      recipientEmail: "provider@example.com",
      recipientName: "Jane Provider",
      senderName: "Alex Parent",
      providerName: "Sunshine Daycare",
      messagePreview: "Is there availability?",
      threadId: 99,
    });

    const call = mockSendMail.mock.calls[0][0];
    expect(call.subject).toContain("Alex Parent");
    expect(call.subject).toContain("Sunshine Daycare");
  });

  it("HTML body contains the correct thread URL with the thread ID", async () => {
    await sendNewMessageNotification({
      recipientEmail: "provider@example.com",
      recipientName: "Jane Provider",
      senderName: "Alex Parent",
      providerName: "Sunshine Daycare",
      messagePreview: "Hello!",
      threadId: 99,
    });

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain("https://happikid.com/messages?thread=99");
  });

  it("plain-text body contains the correct thread URL with the thread ID", async () => {
    await sendNewMessageNotification({
      recipientEmail: "provider@example.com",
      recipientName: "Jane Provider",
      senderName: "Alex Parent",
      providerName: "Sunshine Daycare",
      messagePreview: "Hello!",
      threadId: 99,
    });

    const call = mockSendMail.mock.calls[0][0];
    expect(call.text).toContain("https://happikid.com/messages?thread=99");
  });

  it("thread URL uses the supplied threadId, not a hardcoded value", async () => {
    await sendNewMessageNotification({
      recipientEmail: "provider@example.com",
      recipientName: "Jane Provider",
      senderName: "Alex Parent",
      providerName: "Sunshine Daycare",
      messagePreview: "Hello!",
      threadId: 777,
    });

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain("thread=777");
    expect(call.text).toContain("thread=777");
  });

  it("HTML-escapes special characters in sender and provider names", async () => {
    await sendNewMessageNotification({
      recipientEmail: "provider@example.com",
      recipientName: "Jane Provider",
      senderName: "<script>alert(1)</script>",
      providerName: 'Sunshine & Co "Daycare"',
      messagePreview: "Hello!",
      threadId: 99,
    });

    const call = mockSendMail.mock.calls[0][0];
    // Raw script tag must not appear in the HTML body
    expect(call.html).not.toContain("<script>");
    // Ampersand must be escaped
    expect(call.html).toContain("&amp;");
  });

  it("sends to the recipientEmail address", async () => {
    await sendNewMessageNotification({
      recipientEmail: "specific-recipient@example.com",
      recipientName: "Jane Provider",
      senderName: "Alex Parent",
      providerName: "Sunshine Daycare",
      messagePreview: "Hello!",
      threadId: 99,
    });

    const call = mockSendMail.mock.calls[0][0];
    expect(call.to).toBe("specific-recipient@example.com");
  });
});

// ===========================================================================
// Integration: POST /api/threads dispatches the notification
// ===========================================================================

describe("POST /api/threads — email notification dispatch", () => {
  beforeEach(() => {
    // Provide SMTP env vars so the real email path is exercised
    process.env.SMTP_HOST = "smtp.test";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user@test.com";
    process.env.SMTP_PASS = "secret";
    process.env.APP_BASE_URL = "https://happikid.com";
  });

  afterEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.APP_BASE_URL;
  });

  it("dispatches a notification email to the provider owner when a thread is started", async () => {
    const thread = makeThread();
    const message = makeMessage();

    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);
    vi.mocked(storage.getOrCreateThread).mockResolvedValue(thread as any);
    vi.mocked(storage.createThreadMessage).mockResolvedValue(message as any);

    // getUser is called twice: once for providerUser, once for senderUser
    vi.mocked(storage.getUser)
      .mockResolvedValueOnce(
        makeUser("user_provider", "Jane", "Provider", "jane@provider.com") as any
      )
      .mockResolvedValueOnce(
        makeUser("user_parent", "Alex", "Parent", "alex@parent.com") as any
      );

    await request(buildApp())
      .post("/api/threads")
      .set("x-test-user", "user_parent")
      .send({ providerId: 42, body: "Is there availability?" });

    // Allow fire-and-forget promises to settle
    await flushPromises();

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const mailArgs = mockSendMail.mock.calls[0][0];
    expect(mailArgs.to).toBe("jane@provider.com");
    expect(mailArgs.subject).toContain("Alex Parent");
    expect(mailArgs.subject).toContain("Sunshine Daycare");
    expect(mailArgs.html).toContain(`thread=${thread.id}`);
  });

  it("does not dispatch an email when the provider owner has no email address", async () => {
    const thread = makeThread();
    const message = makeMessage();

    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);
    vi.mocked(storage.getOrCreateThread).mockResolvedValue(thread as any);
    vi.mocked(storage.createThreadMessage).mockResolvedValue(message as any);

    // Provider user has no email
    vi.mocked(storage.getUser).mockResolvedValue(
      makeUser("user_provider", "Jane", "Provider", "") as any
    );

    await request(buildApp())
      .post("/api/threads")
      .set("x-test-user", "user_parent")
      .send({ providerId: 42, body: "Hello!" });

    await flushPromises();

    expect(mockSendMail).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// Integration: POST /api/threads/:id/messages dispatches the notification
// ===========================================================================

describe("POST /api/threads/:id/messages — email notification dispatch", () => {
  beforeEach(() => {
    process.env.SMTP_HOST = "smtp.test";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user@test.com";
    process.env.SMTP_PASS = "secret";
    process.env.APP_BASE_URL = "https://happikid.com";
  });

  afterEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.APP_BASE_URL;
  });

  it("notifies the provider owner when the parent sends a message", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);
    vi.mocked(storage.createThreadMessage).mockResolvedValue(makeMessage() as any);

    // getUser: first call is for the recipient (provider), second for the sender (parent)
    vi.mocked(storage.getUser)
      .mockResolvedValueOnce(
        makeUser("user_provider", "Jane", "Provider", "jane@provider.com") as any
      )
      .mockResolvedValueOnce(
        makeUser("user_parent", "Alex", "Parent", "alex@parent.com") as any
      );

    await request(buildApp())
      .post("/api/threads/99/messages")
      .set("x-test-user", "user_parent")
      .send({ body: "Any spots for September?" });

    await flushPromises();

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const mailArgs = mockSendMail.mock.calls[0][0];
    expect(mailArgs.to).toBe("jane@provider.com");
    expect(mailArgs.subject).toContain("Alex Parent");
    expect(mailArgs.subject).toContain("Sunshine Daycare");
    expect(mailArgs.html).toContain("thread=99");
  });

  it("notifies the parent when the provider owner replies", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);
    vi.mocked(storage.createThreadMessage).mockResolvedValue(
      makeMessage({ senderUserId: "user_provider" }) as any
    );

    // getUser: first call is for recipient (parent), second for sender (provider)
    vi.mocked(storage.getUser)
      .mockResolvedValueOnce(
        makeUser("user_parent", "Alex", "Parent", "alex@parent.com") as any
      )
      .mockResolvedValueOnce(
        makeUser("user_provider", "Jane", "Provider", "jane@provider.com") as any
      );

    await request(buildApp())
      .post("/api/threads/99/messages")
      .set("x-test-user", "user_provider")
      .send({ body: "Yes, we have spots!" });

    await flushPromises();

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const mailArgs = mockSendMail.mock.calls[0][0];
    expect(mailArgs.to).toBe("alex@parent.com");
    expect(mailArgs.subject).toContain("Jane Provider");
    expect(mailArgs.subject).toContain("Sunshine Daycare");
    expect(mailArgs.html).toContain("thread=99");
  });

  it("does not dispatch an email when the recipient has no email address", async () => {
    vi.mocked(storage.getThread).mockResolvedValue(makeThread() as any);
    vi.mocked(storage.getProvider).mockResolvedValue(makeProvider() as any);
    vi.mocked(storage.createThreadMessage).mockResolvedValue(makeMessage() as any);

    // Recipient user has no email
    vi.mocked(storage.getUser).mockResolvedValue(
      makeUser("user_provider", "Jane", "Provider", "") as any
    );

    await request(buildApp())
      .post("/api/threads/99/messages")
      .set("x-test-user", "user_parent")
      .send({ body: "Any spots?" });

    await flushPromises();

    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
