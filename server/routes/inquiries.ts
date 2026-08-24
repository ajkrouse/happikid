import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { inquiryLimiter } from "../middleware/rateLimiter";
import { inquiryClientCreateSchema } from "@shared/schema";
import { strictPathInt } from "../lib/pathParams";
import { apiError } from "../lib/apiError";
import { isCanonicalProviderOwner, isPublicProvider } from "../lib/providerAccess";
import { z } from "zod";
import { createLogger } from "../logger";

const log = createLogger("inquiries");

export function registerInquiryRoutes(app: Express): void {
  app.get("/api/inquiries/provider/:providerId", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.providerId);
      if (!providerId) return apiError(res, 400, "Invalid provider ID");
      const provider = await storage.getProvider(providerId);
      if (!provider || !isCanonicalProviderOwner(provider, req.user?.claims?.sub)) return apiError(res, 403, "Access denied");
      res.json(await storage.getInquiriesByProviderId(providerId));
    } catch (error) {
      log.error({ err: error }, "Error fetching inquiries");
      apiError(res, 500, "Failed to fetch inquiries");
    }
  });

  app.get("/api/inquiries/user", isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getInquiriesByUserId(req.user?.claims?.sub));
    } catch (error) {
      log.error({ err: error }, "Error fetching user inquiries");
      apiError(res, 500, "Failed to fetch inquiries");
    }
  });

  app.get("/api/inquiries/provider", isAuthenticated, async (req: any, res) => {
    try {
      const providers = await storage.getProvidersByCanonicalOwner(req.user?.claims?.sub);
      if (providers.length === 0) return res.json([]);
      res.json(await storage.getInquiriesByProviderId(providers[0].id));
    } catch (error) {
      log.error({ err: error }, "Error fetching provider inquiries");
      apiError(res, 500, "Failed to fetch inquiries");
    }
  });

  app.post("/api/inquiries", inquiryLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      // Use client-safe schema to strip userId/status from request body,
      // then enforce server-side values for those fields.
      const clientData = inquiryClientCreateSchema.parse(req.body);
      const provider = await storage.getProvider(clientData.providerId);
      if (!provider || !isPublicProvider(provider)) return apiError(res, 404, "Provider not found");
      const inquiryData = { ...clientData, userId, status: "pending" as const };
      res.status(201).json(await storage.createInquiry(inquiryData));
    } catch (error) {
      log.error({ err: error }, "Error creating inquiry");
      if (error instanceof z.ZodError) return apiError(res, 400, "Invalid inquiry data", { errors: error.errors });
      apiError(res, 500, "Failed to create inquiry");
    }
  });

  const updateInquiryStatusSchema = z.object({
    status: z.enum(["pending", "responded", "closed"]),
  });

  app.post("/api/inquiries/:id/reply", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return apiError(res, 400, "Invalid inquiry ID");
      const replySchema = z.object({ reply: z.string().min(1).max(2000) });
      const parsed = replySchema.safeParse(req.body);
      if (!parsed.success) return apiError(res, 400, "Reply text is required", { errors: parsed.error.errors });

      // Confirm the inquiry belongs to one of this provider's listings
      const inquiry = await storage.getInquiry(id);
      if (!inquiry) return apiError(res, 404, "Inquiry not found");
      const ownedProviders = await storage.getProvidersByCanonicalOwner(req.user?.claims?.sub);
      const owns = ownedProviders.some((p) => p.id === inquiry.providerId);
      if (!owns) return apiError(res, 403, "Not authorized to reply to this inquiry");

      res.json(await storage.replyToInquiry(id, parsed.data.reply));
    } catch (error) {
      log.error({ err: error }, "Error replying to inquiry");
      apiError(res, 500, "Failed to send reply");
    }
  });

  app.patch("/api/inquiries/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const inquiryId = strictPathInt(req.params.id);
      if (!inquiryId) return apiError(res, 400, "Invalid inquiry ID");

      const parsed = updateInquiryStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return apiError(res, 400, "Invalid status", { errors: parsed.error.errors });
      }

      // Only the provider that owns this inquiry may update its status
      const inquiry = await storage.getInquiry(inquiryId);
      if (!inquiry) return apiError(res, 404, "Inquiry not found");
      const provider = await storage.getProvider(inquiry.providerId);
      if (!provider || !isCanonicalProviderOwner(provider, req.user?.claims?.sub)) {
        return apiError(res, 403, "Access denied");
      }

      res.json(await storage.updateInquiryStatus(inquiryId, parsed.data.status));
    } catch (error) {
      log.error({ err: error }, "Error updating inquiry status");
      apiError(res, 500, "Failed to update inquiry status");
    }
  });
}
