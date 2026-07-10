import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";

export function registerClaimRoutes(app: Express): void {
  // Search providers available for claiming
  app.get("/api/claims/search", async (req, res) => {
    try {
      const { q: query, city, state } = req.query;
      if (!query || typeof query !== "string" || query.trim().length < 2) {
        return res.status(400).json({ message: "Query must be at least 2 characters long" });
      }
      res.json(await storage.searchProviders(query.trim(), city as string, state as string));
    } catch (error) {
      console.error("Error searching providers for claiming:", error);
      res.status(500).json({ message: "Failed to search providers" });
    }
  });

  // Submit a claim
  app.post("/api/claims", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { providerId, verificationMethod, verificationPayload } = req.body;
      if (!providerId || !verificationMethod) {
        return res.status(400).json({ message: "Provider ID and verification method are required" });
      }
      const provider = await storage.getProvider(providerId);
      if (!provider) return res.status(404).json({ message: "Provider not found" });
      if (provider.claimStatus !== "unclaimed") {
        return res.status(400).json({ message: "Provider is already claimed or has a pending claim" });
      }
      const existingClaims = await storage.getClaimsByUserId(userId);
      if (existingClaims.find((c) => c.providerId === providerId && c.status === "initiated")) {
        return res.status(400).json({ message: "You already have a pending claim for this provider" });
      }
      res.json(await storage.createClaim({ providerId, userId, verificationMethod, verificationPayload, status: "initiated" }));
    } catch (error) {
      console.error("Error creating claim:", error);
      res.status(500).json({ message: "Failed to create claim" });
    }
  });

  // Get current user's claims
  app.get("/api/claims/my", isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getClaimsByUserId(req.user?.claims?.sub));
    } catch (error) {
      console.error("Error fetching user claims:", error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  // Admin — list all claims
  app.get("/api/admin/claims", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.claims?.sub);
      if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
      res.json(await storage.getAllClaims({ status: req.query.status as string }));
    } catch (error) {
      console.error("Error fetching claims for admin:", error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  // Admin — approve claim
  app.post("/api/admin/claims/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.claims?.sub);
      if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
      res.json(await storage.approveClaim(req.params.id, req.user?.claims?.sub));
    } catch (error) {
      console.error("Error approving claim:", error);
      res.status(500).json({ message: "Failed to approve claim" });
    }
  });

  // Admin — reject claim
  app.post("/api/admin/claims/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.claims?.sub);
      if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
      const { rejectionReason } = req.body;
      if (!rejectionReason) return res.status(400).json({ message: "Rejection reason is required" });
      res.json(await storage.rejectClaim(req.params.id, rejectionReason, req.user?.claims?.sub));
    } catch (error) {
      console.error("Error rejecting claim:", error);
      res.status(500).json({ message: "Failed to reject claim" });
    }
  });
}
