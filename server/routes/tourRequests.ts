import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { tourRequestClientCreateSchema } from "@shared/schema";
import { strictPathInt } from "../lib/pathParams";
import { z } from "zod";
import { createLogger } from "../logger";
import { sendTourRequestNotification } from "../services/email";

const log = createLogger("tourRequests");

export function registerTourRequestRoutes(app: Express): void {
  // POST /api/providers/:id/tour-requests — parent submits a tour request
  // Only authenticated parents may create tour requests.
  app.post("/api/providers/:id/tour-requests", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.id);
      if (!providerId) return res.status(400).json({ message: "Invalid provider ID" });

      const parentUserId = req.user?.claims?.sub as string;

      // Enforce parent-only access — providers and admins cannot submit tour requests
      const requester = await storage.getUser(parentUserId);
      if (!requester || requester.role !== "parent") {
        return res.status(403).json({ message: "Only parent accounts can submit tour requests" });
      }

      const provider = await storage.getProvider(providerId);
      if (!provider) return res.status(404).json({ message: "Provider not found" });

      const parsed = tourRequestClientCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid tour request data", errors: parsed.error.errors });
      }

      const tourRequest = await storage.createTourRequest({
        ...parsed.data,
        parentUserId,
        providerId,
        status: "pending",
      });

      // Fire-and-forget email to provider
      if (provider.email) {
        const parentName = [requester.firstName, requester.lastName].filter(Boolean).join(" ") || requester.email || "A parent";
        sendTourRequestNotification({
          recipientEmail: provider.email,
          recipientName: provider.name,
          parentName,
          parentEmail: requester.email || "",
          providerName: provider.name,
          preferredDates: parsed.data.preferredDates,
          preferredTime: parsed.data.preferredTime,
          note: parsed.data.note ?? null,
        }).catch(() => {});
      }

      res.status(201).json(tourRequest);
    } catch (error) {
      log.error({ err: error }, "Error creating tour request");
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid tour request data", errors: error.errors });
      res.status(500).json({ message: "Failed to create tour request" });
    }
  });

  // GET /api/tour-requests — list tour requests for the caller
  // Parents see their own; providers see requests for their listing
  app.get("/api/tour-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub as string;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.role === "provider") {
        // getProvidersByCanonicalOwner handles both claimed (ownerUserId = userId)
        // and unclaimed/legacy (ownerUserId IS NULL AND userId = userId) listings.
        const ownedProviders = await storage.getProvidersByCanonicalOwner(userId);
        if (ownedProviders.length === 0) return res.json([]);
        const results = await Promise.all(ownedProviders.map((p) => storage.getTourRequestsByProviderId(p.id)));
        return res.json(results.flat());
      }

      // Parent or admin — return their own tour requests
      res.json(await storage.getTourRequestsByParentId(userId));
    } catch (error) {
      log.error({ err: error }, "Error fetching tour requests");
      res.status(500).json({ message: "Failed to fetch tour requests" });
    }
  });

  // PATCH /api/tour-requests/:id — update tour request status
  //
  // Authorization rules:
  //   - Providers (canonical owners via ownerUserId OR legacy userId) may set
  //     status to "scheduled" or "cancelled" only.
  //   - Parents may only cancel their own pending requests (status → "cancelled").
  //   - All other combinations are rejected with 403.
  app.patch("/api/tour-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = strictPathInt(req.params.id);
      if (!id) return res.status(400).json({ message: "Invalid tour request ID" });

      const statusSchema = z.object({ status: z.enum(["pending", "scheduled", "cancelled"]) });
      const parsed = statusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid status", errors: parsed.error.errors });
      }

      const userId = req.user?.claims?.sub as string;
      const tourRequest = await storage.getTourRequest(id);
      if (!tourRequest) return res.status(404).json({ message: "Tour request not found" });

      // Canonical provider ownership: getProvidersByCanonicalOwner handles both
      // claimed (ownerUserId = userId) and unclaimed (ownerUserId IS NULL AND userId = userId).
      const ownedProviders = await storage.getProvidersByCanonicalOwner(userId);
      const isProviderOwner = ownedProviders.some((p) => p.id === tourRequest.providerId);
      const isRequestAuthor = tourRequest.parentUserId === userId;

      const newStatus = parsed.data.status;

      if (isProviderOwner) {
        // Providers may schedule or cancel — they cannot reset to pending
        if (newStatus === "pending") {
          return res.status(403).json({ message: "Providers cannot reset a tour request to pending" });
        }
      } else if (isRequestAuthor) {
        // Parents may only cancel their own pending requests
        if (newStatus !== "cancelled") {
          return res.status(403).json({ message: "Parents can only cancel their own tour requests" });
        }
        if (tourRequest.status !== "pending") {
          return res.status(409).json({ message: "Only pending tour requests can be cancelled" });
        }
      } else {
        return res.status(403).json({ message: "Not authorized to update this tour request" });
      }

      res.json(await storage.updateTourRequestStatus(id, newStatus));
    } catch (error) {
      log.error({ err: error }, "Error updating tour request");
      res.status(500).json({ message: "Failed to update tour request" });
    }
  });
}
