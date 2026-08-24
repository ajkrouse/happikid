import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter";
import { logger } from "./logger";
import { storage } from "./storage";

const app = express();

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Disabled to avoid breaking Vite HMR and inline styles in dev
  crossOriginEmbedderPolicy: false, // Disabled to allow Leaflet map tiles and external resources
}));

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.REPLIT_DOMAINS || "")
  .split(",")
  .map((d) => `https://${d.trim()}`)
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin requests (no origin header) and whitelisted domains
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === "development") {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// ── General API rate limiting ─────────────────────────────────────────────────
app.use("/api/", apiLimiter);
app.use("/api/login", authLimiter);
app.use("/api/callback", authLimiter);

// ── Request logging ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Do not serialize request or response bodies. They can contain family
      // contact details, messages, and tour preferences.
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// Run expired-closure pruning once immediately, then repeat every 24 hours.
// This catches providers who haven't re-saved their schedule in months.
async function scheduleClosurePruning(): Promise<void> {
  const runPrune = async () => {
    try {
      const pruned = await storage.pruneExpiredClosures();
      if (pruned > 0) {
        logger.info({ pruned }, "Pruned expired closures from providers");
      }
    } catch (err) {
      logger.error({ err }, "Failed to prune expired closures");
    }
  };

  // Run immediately on startup so stale data is cleared before the first request
  await runPrune();

  // Then run once per day (24 h)
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(runPrune, TWENTY_FOUR_HOURS);
}

async function scheduleProviderImageCleanup(): Promise<void> {
  const runCleanup = async () => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const service = new ObjectStorageService();
      const expiredUploadCount = await service.purgeStaleProviderImageUploads();
      const jobs = await storage.getPendingProviderImageCleanupJobs();
      let completedJobCount = 0;

      for (const job of jobs) {
        try {
          await service.deleteObjectEntity(job.objectPath);
          await storage.completeProviderImageCleanupJob(job.id);
          completedJobCount += 1;
        } catch (error) {
          await storage.recordProviderImageCleanupFailure(job.id);
          logger.warn({ err: error, cleanupJobId: job.id }, "Provider image cleanup will retry");
        }
      }

      if (expiredUploadCount > 0 || completedJobCount > 0) {
        logger.info({ expiredUploadCount, completedJobCount }, "Completed provider image object cleanup");
      }
    } catch (err) {
      logger.error({ err }, "Provider image cleanup scheduler failed");
    }
  };

  await runCleanup();
  setInterval(runCleanup, 60 * 60 * 1000);
}

(async () => {
  const server = await registerRoutes(app);

  // Start the closure-pruning background job
  scheduleClosurePruning().catch((err) =>
    logger.error({ err }, "Closure pruning scheduler failed to start")
  );
  scheduleProviderImageCleanup().catch((err) =>
    logger.error({ err }, "Provider image cleanup scheduler failed to start")
  );

  // ── Global error handler ──────────────────────────────────────────────────
  // NOTE: Must be registered AFTER routes. The `throw err` that was here
  // previously would crash the process after the response was already sent.
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (!res.headersSent) {
      res.status(status).json({ ok: false, message });
    }

    // Log the error for observability without crashing the process
    if (status >= 500) {
      logger.error({ err, status }, "Unhandled server error");
    }
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
