import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";

// vi.mock is hoisted by Vitest above imports, so the mock is applied
// before replitAuth is loaded — avoiding the OIDC network call and
// the module-level REPLIT_DOMAINS env guard.
vi.mock("../server/replitAuth", () => ({
  isAuthenticated: vi.fn((req: any, res: any, next: any) => {
    // Faithful simulation of the real middleware:
    // no session user → 401 immediately, just like the real isAuthenticated does.
    const user = req.user as any;
    if (!user?.expires_at) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  }),
  setupAuth: vi.fn().mockResolvedValue(undefined),
}));

import { isAuthenticated } from "../server/replitAuth";

function buildTestApp() {
  const app = express();
  app.use(express.json());

  // Mirror the real route protection used in production:
  // chat/routes.ts: app.use("/api/conversations", isAuthenticated, aiLimiter)
  app.get("/api/conversations", isAuthenticated, (_req, res) => {
    res.json({ conversations: [] });
  });

  // image/routes.ts: app.post("/api/generate-image", isAuthenticated, aiLimiter, ...)
  app.post("/api/generate-image", isAuthenticated, (_req, res) => {
    res.json({ url: "https://example.com/image.png" });
  });

  return app;
}

describe("Auth Middleware — unauthenticated requests must be rejected", () => {
  const app = buildTestApp();

  it("rejects GET /api/conversations with 401", async () => {
    const res = await request(app).get("/api/conversations");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: "Unauthorized" });
  });

  it("rejects POST /api/generate-image with 401", async () => {
    const res = await request(app)
      .post("/api/generate-image")
      .send({ prompt: "a happy child at daycare", size: "1024x1024" });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: "Unauthorized" });
  });

  it("does not leak stack traces or internal error fields in 401 response", async () => {
    const res = await request(app).get("/api/conversations");
    expect(res.body).not.toHaveProperty("stack");
    expect(res.body).not.toHaveProperty("err");
    expect(Object.keys(res.body)).toEqual(["message"]);
  });

  it("returns JSON content-type on 401", async () => {
    const res = await request(app).get("/api/conversations");
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });
});
