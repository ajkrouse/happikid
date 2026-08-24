import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: isDev ? "debug" : "info",
  // Keep accidental structured logging from exposing contact details,
  // conversation text, search queries, or request/response payloads. Sensitive
  // fields are also omitted at their call sites; this is defense in depth.
  redact: {
    paths: [
      "body", "content", "email", "from", "message", "name", "note",
      "phone", "preferences", "preferredDates", "preferredTime", "query",
      "requestBody", "responseBody", "sessionId", "subject", "text", "to",
      "userId", "adminId",
      "req.body", "res.body",
      "*.body", "*.content", "*.email", "*.from", "*.message", "*.name",
      "*.note", "*.phone", "*.preferences", "*.preferredDates",
      "*.preferredTime", "*.query", "*.requestBody", "*.responseBody",
      "*.sessionId", "*.subject", "*.text", "*.to", "*.userId", "*.adminId",
    ],
    remove: true,
  },
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

export function createLogger(module: string) {
  return logger.child({ module });
}
