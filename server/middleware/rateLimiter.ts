import rateLimit from "express-rate-limit";

/** General API rate limit — 200 requests per minute per IP */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

/** Strict limit for AI endpoints — 20 requests per 10 minutes per user/IP */
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "AI rate limit reached. Please wait before sending more requests." },
  // Key by authenticated user ID when available so limits are per-user, not per-IP
  // (avoids IPv6 bypass issues when keying purely by IP)
  skip: () => false,
  requestPropertyName: "rateLimit",
  keyGenerator: (req: any) => {
    const userId = req.user?.claims?.sub;
    if (userId) return `user:${userId}`;
    // Fall back to normalized IP (express-rate-limit handles IPv6 normalization internally)
    return req.ip ?? "unknown";
  },
});

/** Auth route limiter — 20 attempts per 15 minutes per IP to deter brute force */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later." },
});
