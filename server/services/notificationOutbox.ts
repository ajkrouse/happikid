import { createLogger } from "../logger";
import {
  sendLicenseApprovalEmail,
  sendLicenseRejectionEmail,
  sendNewMessageNotification,
  sendTourRequestNotification,
  sendTourStatusEmail,
} from "./email";

const log = createLogger("notification-outbox");

export type NotificationEventType =
  | "thread_message"
  | "tour_request"
  | "tour_status"
  | "license_approved"
  | "license_rejected";

export type NotificationPayload =
  | { type: "thread_message"; recipientEmail: string; recipientName: string; senderName: string; providerName: string; messagePreview: string; threadId: number }
  | { type: "tour_request"; recipientEmail: string; recipientName: string; parentName: string; parentEmail: string; providerName: string; preferredDates: string[]; preferredTime: string; note: string | null }
  | { type: "tour_status"; recipientEmail: string; recipientName: string; providerName: string; newStatus: "scheduled" | "cancelled" }
  | { type: "license_approved"; recipientEmail: string; recipientName: string; providerName: string; providerId: number }
  | { type: "license_rejected"; recipientEmail: string; recipientName: string; providerName: string; reason: string };

export interface NotificationOutboxInput {
  eventType: NotificationEventType;
  payload: NotificationPayload;
}

export async function dispatchNotification(input: NotificationOutboxInput): Promise<void> {
  switch (input.payload.type) {
    case "thread_message":
      return sendNewMessageNotification(input.payload);
    case "tour_request":
      return sendTourRequestNotification(input.payload);
    case "tour_status":
      return sendTourStatusEmail(input.payload);
    case "license_approved":
      return sendLicenseApprovalEmail(input.payload);
    case "license_rejected":
      return sendLicenseRejectionEmail(input.payload);
    default: {
      const impossible: never = input.payload;
      throw new Error(`Unsupported notification payload: ${JSON.stringify(impossible)}`);
    }
  }
}

export const NOTIFICATION_MAX_ATTEMPTS = 8;
export const NOTIFICATION_LEASE_MS = 2 * 60 * 1000;

export function retryDelayMs(attempts: number): number {
  const baseMs = 30_000;
  const maxMs = 30 * 60 * 1000;
  return Math.min(maxMs, baseMs * 2 ** Math.max(0, attempts - 1));
}

export interface LeasedNotification {
  id: number;
  eventType: NotificationEventType;
  payload: NotificationPayload;
  attempts: number;
}

export interface NotificationOutboxStorage {
  claimNotificationOutboxEvents(workerId: string, limit: number, leaseMs: number): Promise<LeasedNotification[]>;
  completeNotificationOutboxEvent(id: number, workerId: string): Promise<void>;
  retryNotificationOutboxEvent(id: number, workerId: string, errorMessage: string, availableAt: Date, permanentlyFailed: boolean): Promise<void>;
}

export async function processNotificationOutboxBatch(
  storage: NotificationOutboxStorage,
  workerId: string,
  options: {
    now?: () => Date;
    dispatch?: (input: NotificationOutboxInput) => Promise<void>;
    limit?: number;
  } = {},
): Promise<{ delivered: number; retried: number; failed: number }> {
  const now = options.now ?? (() => new Date());
  const dispatch = options.dispatch ?? dispatchNotification;
  const jobs = await storage.claimNotificationOutboxEvents(workerId, options.limit ?? 20, NOTIFICATION_LEASE_MS);
  const result = { delivered: 0, retried: 0, failed: 0 };

  for (const job of jobs) {
    try {
      await dispatch({ eventType: job.eventType, payload: job.payload });
      await storage.completeNotificationOutboxEvent(job.id, workerId);
      result.delivered += 1;
    } catch (error) {
      const permanentlyFailed = job.attempts >= NOTIFICATION_MAX_ATTEMPTS;
      const message = error instanceof Error ? error.message.slice(0, 1000) : "Notification delivery failed";
      const availableAt = new Date(now().getTime() + retryDelayMs(job.attempts));
      await storage.retryNotificationOutboxEvent(job.id, workerId, message, availableAt, permanentlyFailed);
      if (permanentlyFailed) result.failed += 1;
      else result.retried += 1;
      log.warn({ notificationId: job.id, attempts: job.attempts, permanentlyFailed }, "Notification delivery failed");
    }
  }

  return result;
}