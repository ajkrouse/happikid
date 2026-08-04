import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { z } from "zod";
import { apiError } from "../lib/apiError";
import { createLogger } from "../logger";

const log = createLogger("claims");

export function registerClaimRoutes(app: Express): void {
  app.get("/api/claims/search", async (req, res) => {
    try {
      const { q: query, city, state } = req.query;
      if (!query || typeof query !== "string" || query.trim().length < 2) {
        return res.status(400).json({ message: "Query must be at least 2 characters long" });
      }
      res.json(await storage.searchProviders(query.trim(), city as string, state as string));
    } catch (error) {
      log.error({ err: error }, "Error searching providers for claiming");
      res.status(500).json({ message: "Failed to search providers" });
    }
  });

  // Schema for the claim request body (subset of insertClaimSchema for user-supplied fields)
  const createClaimBodySchema = z.object({
    providerId: z.number().int().positive(),
    verificationMethod: z.enum(["email_domain", "doc_upload"]),
    verificationPayload: z.record(z.unknown()).optional(),
  });

  app.post("/api/claims", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;

      const parsed = createClaimBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return apiError(res, 400, parsed.error.errors.map((e) => e.message).join("; "));
      }

      const { providerId, verificationMethod, verificationPayload } = parsed.data;

      const provider = await storage.getProvider(providerId);
      if (!provider) return res.status(404).json({ message: "Provider not found" });
      if (provider.claimStatus !== "unclaimed") {
        return apiError(res, 400, "Provider is already claimed or has a pending claim");
      }
      const existingClaims = await storage.getClaimsByUserId(userId);
      if (existingClaims.find((c) => c.providerId === providerId && c.status === "initiated")) {
        return apiError(res, 400, "You already have a pending claim for this provider");
      }
      res.json(await storage.createClaim({ providerId, userId, verificationMethod, verificationPayload, status: "initiated" }));
    } catch (error) {
      log.error({ err: error }, "Error creating claim");
      res.status(500).json({ message: "Failed to create claim" });
    }
  });

  app.get("/api/claims/my", isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getClaimsByUserId(req.user?.claims?.sub));
    } catch (error) {
      log.error({ err: error }, "Error fetching user claims");
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  app.get("/api/admin/claims", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.claims?.sub);
      if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
      res.json(await storage.getAllClaims({ status: req.query.status as string }));
    } catch (error) {
      log.error({ err: error }, "Error fetching claims for admin");
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  app.post("/api/admin/claims/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const claimIdParsed = z.string().uuid().safeParse(req.params.id);
      if (!claimIdParsed.success) return res.status(400).json({ message: "Invalid claim ID" });
      const user = await storage.getUser(req.user?.claims?.sub);
      if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
      res.json(await storage.approveClaim(req.params.id, req.user?.claims?.sub));
    } catch (error) {
      log.error({ err: error }, "Error approving claim");
      res.status(500).json({ message: "Failed to approve claim" });
    }
  });

  const rejectClaimBodySchema = z.object({
    rejectionReason: z.string().min(1, "Rejection reason is required"),
  });

  app.post("/api/admin/claims/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const claimIdParsed = z.string().uuid().safeParse(req.params.id);
      if (!claimIdParsed.success) return res.status(400).json({ message: "Invalid claim ID" });
      const user = await storage.getUser(req.user?.claims?.sub);
      if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
      const parsed = rejectClaimBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return apiError(res, 400, parsed.error.errors.map((e) => e.message).join("; "));
      }
      res.json(await storage.rejectClaim(req.params.id, parsed.data.rejectionReason, req.user?.claims?.sub));
    } catch (error) {
      log.error({ err: error }, "Error rejecting claim");
      res.status(500).json({ message: "Failed to reject claim" });
    }
  });
}
