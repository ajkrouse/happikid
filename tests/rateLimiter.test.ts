import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { aiSummaryLimiter } from "../server/middleware/rateLimiter";

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
});