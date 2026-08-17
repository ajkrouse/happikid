import type { Response } from "express";

/**
 * Send a consistent JSON error response.
 * All routes should use this instead of ad-hoc res.status().json() calls.
 */
export function apiError(
  res: Response,
  status: number,
  message: string,
  extras?: Record<string, unknown>
): void {
  res.status(status).json({ ok: false, message, ...extras });
}
