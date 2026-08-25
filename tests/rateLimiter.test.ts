import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { aiLimiter, aiSummaryLimiter } from "../server/middleware/rateLimiter";

describe("AI rate limits", () => {
  it("allows normal provider searches but caps AI summary requests per visitor", async () => {
    const app = express();
    app.get("/providers", aiSummaryLimiter, (_req, res) => res.json({ ok: true }));

    const normal = await request(app).get("/providers");
    expect(normal.status).toBe(200);

    for (let index = 0; index < 20; index += 1) {
      const response = await request(app).get("/providers").query({ aiSummary: "true" });
      expect(response.status).toBe(200);
    }

    const limited = await request(app).get("/providers").query({ aiSummary: "true" });
    expect(limited.status).toBe(429);
    expect(limited.body).toMatchObject({
      ok: false,
      message: expect.stringMatching(/AI rate limit/i),
    });
  });

  it("applies the generic AI budget per authenticated account", async () => {
    const app = express();
    app.use((req: any, _res, next) => {
      const userId = req.header("x-test-user");
      if (userId) req.user = { claims: { sub: userId } };
      next();
    });
    app.post("/ai", aiLimiter, (_req, res) => res.json({ ok: true }));

    for (let index = 0; index < 20; index += 1) {
      await request(app).post("/ai").set("x-test-user", "account-a").expect(200);
    }
    await request(app).post("/ai").set("x-test-user", "account-b").expect(200);

    const limited = await request(app).post("/ai").set("x-test-user", "account-a").expect(429);
    expect(limited.body).toMatchObject({
      ok: false,
      message: expect.stringMatching(/AI rate limit/i),
    });
  });
});