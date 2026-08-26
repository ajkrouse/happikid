import { describe, expect, it, vi } from "vitest";
import {
  NOTIFICATION_LEASE_MS,
  NOTIFICATION_MAX_ATTEMPTS,
  processNotificationOutboxBatch,
  retryDelayMs,
  dispatchNotification,
  type LeasedNotification,
  type NotificationOutboxStorage,
} from "../server/services/notificationOutbox";

const job: LeasedNotification = {
  id: 14,
  eventType: "thread_message",
  attempts: 1,
  payload: {
    type: "thread_message",
    recipientEmail: "parent@example.com",
    recipientName: "Alex Parent",
    senderName: "Jordan Provider",
    providerName: "Sunny Days",
    messagePreview: "We have availability.",
    threadId: 9,
  },
};

function fakeStorage(jobs: LeasedNotification[]): NotificationOutboxStorage & Record<string, any> {
  return {
    claimNotificationOutboxEvents: vi.fn().mockResolvedValue(jobs),
    completeNotificationOutboxEvent: vi.fn().mockResolvedValue(undefined),
    retryNotificationOutboxEvent: vi.fn().mockResolvedValue(undefined),
  };
}

describe("notification outbox worker", () => {
  it("marks a successfully delivered event complete", async () => {
    const storage = fakeStorage([job]);
    const dispatch = vi.fn().mockResolvedValue(undefined);

    await expect(processNotificationOutboxBatch(storage, "worker-a", { dispatch })).resolves.toEqual({
      delivered: 1, retried: 0, failed: 0,
    });
    expect(storage.claimNotificationOutboxEvents).toHaveBeenCalledWith("worker-a", 20, NOTIFICATION_LEASE_MS);
    expect(dispatch).toHaveBeenCalledWith({ eventType: job.eventType, payload: job.payload });
    expect(storage.completeNotificationOutboxEvent).toHaveBeenCalledWith(job.id, "worker-a");
  });

  it("uses bounded exponential backoff after a temporary SMTP failure", async () => {
    const storage = fakeStorage([job]);
    const dispatch = vi.fn().mockRejectedValue(new Error("SMTP connection reset"));
    const now = new Date("2026-08-25T12:00:00.000Z");

    await expect(processNotificationOutboxBatch(storage, "worker-a", {
      dispatch,
      now: () => now,
    })).resolves.toEqual({ delivered: 0, retried: 1, failed: 0 });

    expect(storage.retryNotificationOutboxEvent).toHaveBeenCalledWith(
      job.id,
      "worker-a",
      "SMTP connection reset",
      new Date(now.getTime() + retryDelayMs(1)),
      false,
    );
    expect(storage.completeNotificationOutboxEvent).not.toHaveBeenCalled();
  });

  it("retries a timed-out SMTP send without marking it delivered", async () => {
    const storage = fakeStorage([job]);
    const dispatch = vi.fn().mockRejectedValue(new Error("SMTP socket timed out"));
    const now = new Date("2026-08-25T12:00:00.000Z");

    await expect(processNotificationOutboxBatch(storage, "worker-a", {
      dispatch,
      now: () => now,
    })).resolves.toEqual({ delivered: 0, retried: 1, failed: 0 });

    expect(storage.completeNotificationOutboxEvent).not.toHaveBeenCalled();
    expect(storage.retryNotificationOutboxEvent).toHaveBeenCalledWith(
      job.id,
      "worker-a",
      "SMTP socket timed out",
      new Date(now.getTime() + retryDelayMs(job.attempts)),
      false,
    );
  });

  it("keeps an event retryable when SMTP configuration is missing", async () => {
    const storage = fakeStorage([job]);
    const originalSmtp = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    };
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    try {
      await expect(processNotificationOutboxBatch(storage, "worker-a", {
        dispatch: dispatchNotification,
      })).resolves.toEqual({ delivered: 0, retried: 1, failed: 0 });
    } finally {
      if (originalSmtp.host === undefined) delete process.env.SMTP_HOST;
      else process.env.SMTP_HOST = originalSmtp.host;
      if (originalSmtp.port === undefined) delete process.env.SMTP_PORT;
      else process.env.SMTP_PORT = originalSmtp.port;
      if (originalSmtp.user === undefined) delete process.env.SMTP_USER;
      else process.env.SMTP_USER = originalSmtp.user;
      if (originalSmtp.pass === undefined) delete process.env.SMTP_PASS;
      else process.env.SMTP_PASS = originalSmtp.pass;
    }

    expect(storage.completeNotificationOutboxEvent).not.toHaveBeenCalled();
    expect(storage.retryNotificationOutboxEvent).toHaveBeenCalledWith(
      job.id,
      "worker-a",
      expect.stringContaining("SMTP configuration is invalid"),
      expect.any(Date),
      false,
    );
  });

  it("retains exhausted events as permanently failed for diagnosis", async () => {
    const storage = fakeStorage([{ ...job, attempts: NOTIFICATION_MAX_ATTEMPTS }]);

    await expect(processNotificationOutboxBatch(storage, "worker-a", {
      dispatch: vi.fn().mockRejectedValue(new Error("Mailbox unavailable")),
    })).resolves.toEqual({ delivered: 0, retried: 0, failed: 1 });

    expect(storage.retryNotificationOutboxEvent).toHaveBeenCalledWith(
      job.id,
      "worker-a",
      "Mailbox unavailable",
      expect.any(Date),
      true,
    );
    expect(storage.completeNotificationOutboxEvent).not.toHaveBeenCalled();
  });

  it("does not duplicate delivery when a second worker finds no unlocked rows", async () => {
    const storage = fakeStorage([]);
    storage.claimNotificationOutboxEvents
      .mockResolvedValueOnce([job])
      .mockResolvedValueOnce([]);
    const dispatch = vi.fn().mockResolvedValue(undefined);

    await Promise.all([
      processNotificationOutboxBatch(storage, "worker-a", { dispatch }),
      processNotificationOutboxBatch(storage, "worker-b", { dispatch }),
    ]);

    expect(dispatch).toHaveBeenCalledOnce();
    expect(storage.completeNotificationOutboxEvent).toHaveBeenCalledOnce();
  });

  it("processes a recovered lease exactly like any other claimed event", async () => {
    const storage = fakeStorage([{ ...job, attempts: 2 }]);
    const dispatch = vi.fn().mockResolvedValue(undefined);

    await processNotificationOutboxBatch(storage, "recovery-worker", { dispatch });

    expect(storage.claimNotificationOutboxEvents).toHaveBeenCalledWith(
      "recovery-worker", 20, NOTIFICATION_LEASE_MS,
    );
    expect(storage.completeNotificationOutboxEvent).toHaveBeenCalledWith(job.id, "recovery-worker");
  });
});