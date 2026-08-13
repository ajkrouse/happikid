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

/**
 * Notify a provider that their license submission was rejected, with the reason
 * and a link to their dashboard so they can correct and resubmit.
 */
/**
 * Notify a provider that a parent has submitted a tour request.
 */
export async function sendTourRequestNotification(opts: {
  recipientEmail: string;
  recipientName: string;
  parentName: string;
  parentEmail: string;
  providerName: string;
  preferredDates: string[];
  preferredTime: string;
  note: string | null;
}): Promise<void> {
  const baseUrl = getCanonicalBaseUrl();
  const dashboardUrl = `${baseUrl}/provider/dashboard`;

  const safeRecipient = escapeHtml(opts.recipientName);
  const safeParent = escapeHtml(opts.parentName);
  const safeParentEmail = escapeHtml(opts.parentEmail);
  const safeProvider = escapeHtml(opts.providerName);
  const safeTime = escapeHtml(
    opts.preferredTime === "morning" ? "Morning (before noon)"
    : opts.preferredTime === "afternoon" ? "Afternoon (noon–5 pm)"
    : "Flexible"
  );
  const safeDates = opts.preferredDates.map(escapeHtml).join(", ");
  const safeNote = opts.note ? escapeHtml(opts.note) : null;

  const subject = `New tour request from ${opts.parentName} — ${opts.providerName}`;

  const text = [
    `Hi ${opts.recipientName},`,
    ``,
    `${opts.parentName} (${opts.parentEmail}) has requested a tour of ${opts.providerName}.`,
    ``,
    `Preferred dates: ${opts.preferredDates.join(", ")}`,
    `Preferred time: ${safeTime.replace(/<[^>]+>/g, "")}`,
    opts.note ? `Note: ${opts.note}` : null,
    ``,
    `Visit your dashboard to view and respond to this request:`,
    dashboardUrl,
    ``,
    `— The HappiKid Team`,
  ].filter((l) => l !== null).join("\n");

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#1a3a2a;margin-bottom:8px">New Tour Request</h2>
      <p style="color:#555;margin-bottom:16px">Hi ${safeRecipient},</p>
      <p style="color:#555;margin-bottom:16px">
        <strong>${safeParent}</strong> (<a href="mailto:${safeParentEmail}" style="color:#2563eb">${safeParentEmail}</a>)
        has requested a tour of <strong>${safeProvider}</strong>.
      </p>
      <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:12px 16px;border-radius:4px;margin-bottom:16px">
        <p style="margin:0 0 6px;font-weight:600;color:#166534">Preferred Dates</p>
        <p style="margin:0;color:#333">${safeDates}</p>
      </div>
      <div style="background:#eff6ff;border-left:4px solid #2563eb;padding:12px 16px;border-radius:4px;margin-bottom:${safeNote ? "16px" : "24px"}">
        <p style="margin:0 0 6px;font-weight:600;color:#1e40af">Preferred Time</p>
        <p style="margin:0;color:#333">${safeTime}</p>
      </div>
      ${safeNote ? `
      <div style="background:#fafafa;border:1px solid #e5e7eb;padding:12px 16px;border-radius:4px;margin-bottom:24px">
        <p style="margin:0 0 6px;font-weight:600;color:#374151">Note from parent</p>
        <p style="margin:0;color:#555">${safeNote}</p>
      </div>` : ""}
      <a href="${dashboardUrl}" style="display:inline-block;background:#1a3a2a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
        View Tour Requests
      </a>
      <p style="color:#999;font-size:12px;margin-top:32px">
        You can update the tour request status (Scheduled or Cancelled) from your provider dashboard.
      </p>
    </div>
  `;

  await sendEmail({ to: opts.recipientEmail, subject, html, text });
}

export async function sendLicenseRejectionEmail(opts: {
  recipientEmail: string;
  recipientName: string;
  providerName: string;
  reason: string;
}): Promise<void> {
  const baseUrl = getCanonicalBaseUrl();
  const dashboardUrl = `${baseUrl}/provider/dashboard`;

  const safeName = escapeHtml(opts.recipientName);
  const safeProvider = escapeHtml(opts.providerName);
  const safeReason = escapeHtml(opts.reason);

  const subject = `Action required: License verification for ${opts.providerName}`;
  const text = [
    `Hi ${opts.recipientName},`,
    ``,
    `We reviewed the license submission for ${opts.providerName} and were unable to verify it at this time.`,
    ``,
    `Reason: ${opts.reason}`,
    ``,
    `Please update your license information and resubmit for review:`,
    dashboardUrl,
    ``,
    `If you believe this is an error, please contact us at support@happikid.com.`,
    ``,
    `— The HappiKid Team`,
  ].join("\n");

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#1a3a2a;margin-bottom:8px">License Verification — Action Required</h2>
      <p style="color:#555;margin-bottom:16px">Hi ${safeName},</p>
      <p style="color:#555;margin-bottom:16px">
        We reviewed the license submission for <strong>${safeProvider}</strong> and were unable to verify it at this time.
      </p>
      <div style="background:#fff4f2;border-left:4px solid #c0502a;padding:12px 16px;border-radius:4px;margin-bottom:24px">
        <p style="color:#7a2a10;margin:0;font-weight:600;margin-bottom:4px">Reason</p>
        <p style="color:#333;margin:0">${safeReason}</p>
      </div>
      <p style="color:#555;margin-bottom:16px">
        Please update your license information on your dashboard and resubmit for review.
      </p>
      <a href="${dashboardUrl}" style="display:inline-block;background:#c0502a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
        Go to Dashboard
      </a>
      <p style="color:#999;font-size:12px;margin-top:32px">
        If you believe this is an error, please contact us at support@happikid.com.
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
