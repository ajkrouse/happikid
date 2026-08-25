import crypto from "node:crypto";
import { logger } from "../logger";
import { storage } from "../storage";
import { processNotificationOutboxBatch } from "./notificationOutbox";

const POLL_INTERVAL_MS = 15_000;

export function scheduleNotificationOutboxWorker(): void {
  const workerId = `app-${crypto.randomUUID()}`;
  let isRunning = false;

  const run = async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      const result = await processNotificationOutboxBatch(storage, workerId);
      if (result.delivered || result.retried || result.failed) {
        logger.info({ ...result }, "Processed notification outbox batch");
      }
    } catch (error) {
      logger.error({ err: error }, "Notification outbox worker failed");
    } finally {
      isRunning = false;
    }
  };

  void run();
  setInterval(() => void run(), POLL_INTERVAL_MS);
}