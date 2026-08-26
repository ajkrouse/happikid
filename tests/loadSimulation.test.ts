/**
 * Bounded concurrency simulations for the highest-frequency alpha paths.
 *
 * Live latency and connection behavior are covered by scripts/alpha-load-test.ts.
 * These deterministic checks cover the safety properties that cannot be
 * safely induced against a real staging database: fail-closed search errors,
 * limiter rejection, and exactly-once outbox claims under worker contention.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { aiSummaryLimiter } from "../server/middleware/rateLimiter";
import {
  processNotificationOutboxBatch,
  type LeasedNotification,
  type NotificationOutboxStorage,
} from "../server/services/notificationOutbox";

const storageMock = vi.hoisted(() => ({
  getProviders: vi.fn(),
  getProviderImages: vi.fn(),
  getThreadsForUser: vi.fn(),
}));

vi.mock("../server/replitAuth", () => ({
  isAuthenticated: vi.fn((req: any, _res: any, next: any) => {
    req.user = { claims: { sub: req.header("x-test-user") || "load-parent" } };
    next();
  }),
}));
vi.mock("../server/storage", () => ({ storage: storageMock }));
vi.mock("../server/intelligentSearch", () => ({
  intelligentSearch: {
    parseQuery: vi.fn((search: string) => ({
      originalQuery: search,
      matchedTerms: [],
      confidence: 1,
      filters: { search },
      suggestions: [],
    })),
    explainParsing: vi.fn(() => ""),
  },
}));
vi.mock("../server/services/aiSummaries", () => ({
  generateSearchSummary: vi.fn().mockResolvedValue(null),
}));
vi.mock("../server/logger", () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { registerProviderRoutes } from "../server/routes/providers";
import { registerThreadRoutes } from "../server/routes/threads";

function buildSearchApp() {
  const app = express();
  app.use(express.json());
  registerProviderRoutes(app);
  return app;
}

function buildThreadApp() {
  const app = express();
  app.use(express.json());
  registerThreadRoutes(app);
  return app;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const notificationPayload = {
  type: "thread_message" as const,
  recipientEmail: "parent@example.test",
  recipientName: "Parent",
  senderName: "Provider",
  providerName: "Sunshine Center",
  messagePreview: "We have availability.",
  threadId: 7,
};

function makeJobs(count: number): LeasedNotification[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    eventType: "thread_message" as const,
    payload: notificationPayload,
    attempts: 1,
  }));
}

describe("concurrent load safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageMock.getProviderImages.mockResolvedValue([]);
  });

  it("fails closed for every concurrent search when the database query fails", async () => {
    storageMock.getProviders.mockRejectedValue(new Error("database pool unavailable"));
    const app = buildSearchApp();
    const requests = Array.from({ length: 32 }, (_, index) =>
      request(app).get("/api/providers").query({
        city: index % 2 === 0 ? "Brooklyn" : "Queens",
        sortBy: index % 2 === 0 ? "best-match" : "newest",
        search: index % 3 === 0 ? "music" : undefined,
      }),
    );

    const responses = await Promise.all(requests);

    expect(responses).toHaveLength(32);
    expect(responses.every((response) => response.status === 500)).toBe(true);
    expect(responses.every((response) => response.body.ok === false)).toBe(true);
    expect(responses.every((response) => !("providers" in response.body))).toBe(true);
    expect(storageMock.getProviders).toHaveBeenCalledTimes(32);
  });

  it("rejects excess concurrent AI-summary requests instead of allowing unlimited work", async () => {
    const app = express();
    app.get("/providers", aiSummaryLimiter, (_req, res) => res.json({ ok: true }));

    const responses = await Promise.all(
      Array.from({ length: 25 }, () => request(app).get("/providers").query({ aiSummary: "true" })),
    );
    const accepted = responses.filter((response) => response.status === 200);
    const limited = responses.filter((response) => response.status === 429);

    expect(accepted).toHaveLength(20);
    expect(limited).toHaveLength(5);
    expect(limited.every((response) => response.body.ok === false)).toBe(true);
  });

  it("serves concurrent inbox reads without leaking provider-only draft fields", async () => {
    storageMock.getThreadsForUser.mockImplementation(async (userId: string) => {
      await wait(5);
      return [{
        id: 1,
        parentUserId: userId,
        providerId: 9,
        aiDraftBody: "private provider draft",
        aiDraftMessageId: 17,
        latestMessage: { body: "Hello" },
      }];
    });
    const app = buildThreadApp();

    const responses = await Promise.all(
      Array.from({ length: 40 }, () =>
        request(app).get("/api/threads").set("x-test-user", "load-parent"),
      ),
    );

    expect(responses.every((response) => response.status === 200)).toBe(true);
    expect(responses.every((response) => response.body[0].aiDraftBody === undefined)).toBe(true);
    expect(responses.every((response) => response.body[0].aiDraftMessageId === undefined)).toBe(true);
    expect(storageMock.getThreadsForUser).toHaveBeenCalledTimes(40);
  });

  it("delivers each outbox job once while multiple workers contend for batches", async () => {
    const jobs = makeJobs(40);
    const leased = new Set<number>();
    const completed = new Set<number>();
    const dispatched: number[] = [];

    const outboxStorage: NotificationOutboxStorage = {
      async claimNotificationOutboxEvents(_workerId, limit) {
        await wait(1);
        const nextJobs = jobs
          .filter((job) => !leased.has(job.id) && !completed.has(job.id))
          .slice(0, limit);
        for (const job of nextJobs) leased.add(job.id);
        return nextJobs;
      },
      async completeNotificationOutboxEvent(id) {
        await wait(1);
        leased.delete(id);
        completed.add(id);
      },
      async retryNotificationOutboxEvent(id) {
        leased.delete(id);
      },
    };

    const dispatch = async (input: { payload: { threadId: number } }) => {
      await wait(1);
      dispatched.push(input.payload.threadId);
    };

    const workers = Array.from({ length: 6 }, async (_, workerIndex) => {
      for (let batch = 0; batch < 4; batch += 1) {
        await processNotificationOutboxBatch(outboxStorage, `load-worker-${workerIndex}`, {
          dispatch,
          limit: 5,
        });
      }
    });
    await Promise.all(workers);

    expect(completed).toEqual(new Set(jobs.map((job) => job.id)));
    expect(dispatched).toHaveLength(40);
    expect(new Set(dispatched)).toHaveLength(1);
    expect(leased).toHaveLength(0);
  });
});