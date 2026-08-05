import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./replitAuth";
import { setupGoogleAuth } from "./googleAuth";
import { addSampleData } from "./db/seed";
import { createLogger } from "./logger";

const log = createLogger("routes");

import { registerProviderRoutes } from "./routes/providers";
import { registerReviewRoutes } from "./routes/reviews";
import { registerFavoriteRoutes } from "./routes/favorites";
import { registerInquiryRoutes } from "./routes/inquiries";
import { registerUploadRoutes } from "./routes/uploads";
import { registerClaimRoutes } from "./routes/claims";
import { registerAuthRoutes } from "./routes/auth";
import { registerFamilyRoutes } from "./routes/family";
import { registerTaxonomyRoutes } from "./routes/taxonomy";
import { registerMetaRoutes } from "./routes/meta";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware must be set up before any routes that use isAuthenticated
  await setupAuth(app);
  setupGoogleAuth(app);

  // Seed sample data in development if the database is empty
  if (process.env.NODE_ENV === "development") {
    addSampleData().catch((err) => {
      log.warn({ err }, "Failed to add sample data (non-critical)");
    });
  }

  // Domain route registrations
  registerProviderRoutes(app);
  registerReviewRoutes(app);
  registerFavoriteRoutes(app);
  registerInquiryRoutes(app);
  registerUploadRoutes(app);
  registerClaimRoutes(app);
  registerAuthRoutes(app);
  registerFamilyRoutes(app);
  registerTaxonomyRoutes(app);
  registerMetaRoutes(app);

  return createServer(app);
}
