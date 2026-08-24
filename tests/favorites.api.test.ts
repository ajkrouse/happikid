import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../server/replitAuth", () => ({
  isAuthenticated: vi.fn((req: any, res: any, next: any) => {
    const userId = req.headers["x-test-user"];
    if (!userId) return res.status(401).json({ ok: false, message: "Unauthorized" });
    req.user = { claims: { sub: userId } };
    next();
  }),
}));

vi.mock("../server/storage", () => ({
  storage: {
    addFavorite: vi.fn(),
  },
}));

vi.mock("../server/logger", () => ({
  createLogger: () => ({ error: vi.fn() }),
}));

import { storage } from "../server/storage";
import { registerFavoriteRoutes } from "../server/routes/favorites";

function buildApp() {
  const app = express();
  app.use(express.json());
  registerFavoriteRoutes(app);
  return app;
}

describe("POST /api/favorites/:providerId", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the canonical bookmark for a duplicate request without a server error", async () => {
    const favorite = {
      userId: "parent_1",
      providerId: 7,
      createdAt: new Date("2026-08-24T00:00:00.000Z"),
    };
    vi.mocked(storage.addFavorite)
      .mockResolvedValueOnce({ favorite, created: true })
      .mockResolvedValueOnce({ favorite, created: false });

    const first = await request(buildApp())
      .post("/api/favorites/7")
      .set("x-test-user", "parent_1");
    const retry = await request(buildApp())
      .post("/api/favorites/7")
      .set("x-test-user", "parent_1");

    expect(first.status).toBe(201);
    expect(retry.status).toBe(200);
    expect(first.body).toMatchObject({ userId: "parent_1", providerId: 7 });
    expect(retry.body).toMatchObject({ userId: "parent_1", providerId: 7 });
    expect(storage.addFavorite).toHaveBeenCalledTimes(2);
    expect(storage.addFavorite).toHaveBeenNthCalledWith(1, "parent_1", 7);
    expect(storage.addFavorite).toHaveBeenNthCalledWith(2, "parent_1", 7);
  });
});