/**
 * Email notification service.
 * Logs emails to console in development (no SMTP config required).
 * In production, configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS env vars.
 */
import nodemailer from "nodemailer";
import { createLogger } from "../logger";

const log = createLogger("email");

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/** Escape characters that have special meaning in HTML. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Returns the canonical public base URL for the application.
 * Reads APP_BASE_URL env var (set this in production).
 * Falls back to REPLIT_DEV_DOMAIN for Replit preview environments.
 * Never constructed from client-controlled request headers.
 */
function getCanonicalBaseUrl(): string {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return "https://happikid.com"; // production fallback
}

async function sendEmail(opts: EmailOptions): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? "HappiKid <noreply@happikid.com>";

  if (!host || !user || !pass) {
    // SMTP not configured — log only non-sensitive delivery diagnostics.
    // Never log message body or recipient details to avoid leaking private
    // conversation content into application logs.
    log.info({ subject: opts.subject }, "[EMAIL] SMTP not configured — notification skipped");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    log.info({ to: opts.to, subject: opts.subject }, "Email sent");
  } catch (err) {
    log.error({ err, to: opts.to, subject: opts.subject }, "Failed to send email");
  }
}

/**
 * Notify recipient that a new message has arrived in their thread.
 * All dynamic values are HTML-escaped before interpolation.
 * The action URL is built from a server-configured base URL, never from
 * client-controlled request headers, preventing open-redirect / phishing.
 */
export async function sendNewMessageNotification(opts: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  providerName: string;
  messagePreview: string;
  threadId: number;
}): Promise<void> {
  const baseUrl = getCanonicalBaseUrl();
  // threadId is a server-generated integer — no escaping needed, but we cast to
  // ensure it stays numeric even if the caller passes a coerced value.
  const threadUrl = `${baseUrl}/messages?thread=${Number(opts.threadId)}`;

  const safeRecipient = escapeHtml(opts.recipientName);
  const safeSender = escapeHtml(opts.senderName);
  const safeProvider = escapeHtml(opts.providerName);
  const safePreview = escapeHtml(opts.messagePreview);

  const subject = `New message from ${opts.senderName} — ${opts.providerName}`;
  const text = [
    `Hi ${opts.recipientName},`,
    ``,
    `You have a new message from ${opts.senderName} about ${opts.providerName}:`,
    ``,
    `"${opts.messagePreview}"`,
    ``,
    `Reply here: ${threadUrl}`,
    ``,
    `— The HappiKid Team`,
  ].join("\n");

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#1a3a2a;margin-bottom:8px">New message from ${safeSender}</h2>
      <p style="color:#555;margin-bottom:16px">Regarding <strong>${safeProvider}</strong></p>
      <div style="background:#f4f4f0;border-left:4px solid #2d7d5f;padding:12px 16px;border-radius:4px;margin-bottom:24px">
        <p style="color:#333;margin:0;font-style:italic">&ldquo;${safePreview}&rdquo;</p>
      </div>
      <a href="${threadUrl}" style="display:inline-block;background:#c0502a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
        View &amp; Reply
      </a>
      <p style="color:#999;font-size:12px;margin-top:32px">
        Hi ${safeRecipient} — you received this because you have an active conversation on HappiKid.
      </p>
    </div>
  `;

  await sendEmail({
    to: opts.recipientEmail,
    subject,
    html,
    text,
  });
}
