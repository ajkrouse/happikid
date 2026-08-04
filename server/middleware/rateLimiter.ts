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
  // Suppress the IPv6 normalization warning — authenticated users are keyed by userId,
  // and unauthenticated fallback to req.ip is intentional (AI routes require auth anyway).
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: any) => {
    const userId = req.user?.claims?.sub;
    if (userId) return `user:${userId}`;
    return req.ip ?? "unknown";
  },
});

/** Inquiry limiter — 10 submissions per hour per IP to prevent spam */
export const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many inquiries submitted. Please wait before sending more." },
});

/** Auth route limiter — 20 attempts per 15 minutes per IP to deter brute force */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later." },
});
