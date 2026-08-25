import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

const mocks = vi.hoisted(() => ({ generate: vi.fn() }));

vi.mock("../server/replitAuth", () => ({
  isAuthenticated: (req: any, res: any, next: any) => {
    if (!req.header("x-test-user")) return res.status(401).json({ message: "Unauthorized" });
    next();
  },
}));
vi.mock("../server/middleware/rateLimiter", () => ({
  aiLimiter: (_req: any, _res: any, next: any) => next(),
}));
vi.mock("../server/replit_integrations/image/client", () => ({
  openai: { images: { generate: mocks.generate } },
}));
vi.mock("../server/logger", () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { registerImageRoutes } from "../server/replit_integrations/image/routes";

function buildApp() {
  const app = express();
  app.use(express.json());
  registerImageRoutes(app);
  return app;
}

describe("AI image consent and privacy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.generate.mockResolvedValue({ data: [{ b64_json: "safe-image" }] });
  });

  it("rejects image generation without explicit consent before contacting the model", async () => {
    const response = await request(buildApp())
      .post("/api/generate-image")
      .set("x-test-user", "user-1")
      .send({ prompt: "A watercolor playground" });

    expect(response.status).toBe(400);
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("withholds sensitive image prompts instead of sending them to the model", async () => {
    const response = await request(buildApp())
      .post("/api/generate-image")
      .set("x-test-user", "user-1")
      .send({ prompt: "Portrait of Jane Doe with her autistic daughter", aiDataConsent: true });

    expect(response.status).toBe(422);
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("withholds a mixed safe/sensitive image prompt instead of sending its safe portion", async () => {
    const response = await request(buildApp())
      .post("/api/generate-image")
      .set("x-test-user", "user-1")
      .send({ prompt: "A sunny playground. Portrait of Jane Doe.", aiDataConsent: true });

    expect(response.status).toBe(422);
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("sends only a consented, minimized safe prompt", async () => {
    const response = await request(buildApp())
      .post("/api/generate-image")
      .set("x-test-user", "user-1")
      .send({ prompt: "A watercolor illustration of a sunny playground", aiDataConsent: true });

    expect(response.status).toBe(200);
    expect(mocks.generate).toHaveBeenCalledWith(expect.objectContaining({
      prompt: "A watercolor illustration of a sunny playground",
    }));
  });
});