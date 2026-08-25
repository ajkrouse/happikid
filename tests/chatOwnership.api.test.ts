import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../server/replitAuth", () => ({
  isAuthenticated: (req: any, res: any, next: any) => {
    const userId = req.header("x-test-user");
    if (!userId) return res.status(401).json({ ok: false, message: "Unauthorized" });
    req.user = { claims: { sub: userId } };
    next();
  },
}));

vi.mock("../server/middleware/rateLimiter", () => ({
  aiLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../server/replit_integrations/chat/storage", () => ({
  chatStorage: {
    getConversation: vi.fn(),
    getAllConversations: vi.fn(),
    createConversation: vi.fn(),
    deleteConversation: vi.fn(),
    getMessagesByConversation: vi.fn(),
    createMessage: vi.fn(),
  },
}));

vi.mock("openai", () => ({
  default: class OpenAI {
    chat = { completions: { create: vi.fn() } };
  },
}));

vi.mock("../server/logger", () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { chatStorage } from "../server/replit_integrations/chat/storage";
import { registerChatRoutes } from "../server/replit_integrations/chat/routes";

function buildApp() {
  const app = express();
  app.use(express.json());
  registerChatRoutes(app);
  return app;
}

describe("AI chat conversation ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(chatStorage.getAllConversations).mockResolvedValue([]);
    vi.mocked(chatStorage.createConversation).mockResolvedValue({ id: 9, userId: "parent-a", title: "New Chat" } as any);
    vi.mocked(chatStorage.deleteConversation).mockResolvedValue(false);
    vi.mocked(chatStorage.getConversation).mockResolvedValue(undefined);
    vi.mocked(chatStorage.getMessagesByConversation).mockResolvedValue([]);
  });

  it("writes a new conversation with the authenticated owner", async () => {
    const response = await request(buildApp())
      .post("/api/conversations")
      .set("x-test-user", "parent-a")
      .send({ title: "Questions for care" });

    expect(response.status).toBe(201);
    expect(chatStorage.createConversation).toHaveBeenCalledWith("Questions for care", "parent-a");
  });

  it("requires explicit consent before sending a message to the external AI service", async () => {
    const response = await request(buildApp())
      .post("/api/conversations/44/messages")
      .set("x-test-user", "parent-a")
      .send({ content: "Help me choose care" });

    expect(response.status).toBe(400);
    expect(chatStorage.getConversation).not.toHaveBeenCalled();
    expect(chatStorage.createMessage).not.toHaveBeenCalled();
  });

  it("withholds mixed sensitive chat input before it reaches conversation storage or the model", async () => {
    const response = await request(buildApp())
      .post("/api/conversations/44/messages")
      .set("x-test-user", "parent-a")
      .send({ content: "Help me choose care. My name is Jane Doe.", aiDataConsent: true });

    expect(response.status).toBe(422);
    expect(chatStorage.getConversation).not.toHaveBeenCalled();
    expect(chatStorage.createMessage).not.toHaveBeenCalled();
  });

  it("withholds a safe new message when its retained history contains sensitive content", async () => {
    vi.mocked(chatStorage.getConversation).mockResolvedValue({ id: 44, userId: "parent-a" } as any);
    vi.mocked(chatStorage.getMessagesByConversation).mockResolvedValue([
      { role: "user", content: "Help me choose care. My name is Jane Doe." },
      { role: "user", content: "Do you offer lunch?" },
    ] as any);

    const response = await request(buildApp())
      .post("/api/conversations/44/messages")
      .set("x-test-user", "parent-a")
      .send({ content: "Do you offer lunch?", aiDataConsent: true });

    expect(response.status).toBe(422);
    expect(response.body.message).toMatch(/conversation contains names or sensitive details/i);
  });

  it("returns 404 instead of another account's conversation or message history", async () => {
    const app = buildApp();

    const response = await request(app)
      .get("/api/conversations/44")
      .set("x-test-user", "parent-b");

    expect(response.status).toBe(404);
    expect(chatStorage.getConversation).toHaveBeenCalledWith(44, "parent-b");
    expect(chatStorage.getMessagesByConversation).not.toHaveBeenCalled();
  });

  it("will not delete or send a message into another account's conversation", async () => {
    const app = buildApp();

    const deletion = await request(app)
      .delete("/api/conversations/44")
      .set("x-test-user", "parent-b");
    const message = await request(app)
      .post("/api/conversations/44/messages")
      .set("x-test-user", "parent-b")
      .send({ content: "Please expose this chat", aiDataConsent: true });

    expect(deletion.status).toBe(404);
    expect(chatStorage.deleteConversation).toHaveBeenCalledWith(44, "parent-b");
    expect(message.status).toBe(404);
    expect(chatStorage.getConversation).toHaveBeenCalledWith(44, "parent-b");
    expect(chatStorage.createMessage).not.toHaveBeenCalled();
  });
});