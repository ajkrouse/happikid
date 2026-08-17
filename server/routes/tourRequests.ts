import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { tourRequestClientCreateSchema } from "@shared/schema";
import { strictPathInt } from "../lib/pathParams";
import { apiError } from "../lib/apiError";
import { z } from "zod";
import { createLogger } from "../logger";
import { sendTourRequestNotification, sendTourStatusEmail } from "../services/email";

const log = createLogger("tourRequests");

export function registerTourRequestRoutes(app: Express): void {
  // POST /api/providers/:id/tour-requests — parent submits a tour request
  // Only authenticated parents may create tour requests.
  app.post("/api/providers/:id/tour-requests", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.id);
      if (!providerId) return apiError(res, 400, "Invalid provider ID");

      const parentUserId = req.user?.claims?.sub as string;

      // Enforce parent-only access — providers and admins cannot submit tour requests
      const requester = await storage.getUser(parentUserId);
      if (!requester || requester.role !== "parent") {
        return apiError(res, 403, "Only parent accounts can submit tour requests");
      }

      const provider = await storage.getProvider(providerId);
      if (!provider) return apiError(res, 404, "Provider not found");

      const parsed = tourRequestClientCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return apiError(res, 400, "Invalid tour request data", { errors: parsed.error.errors });
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
      if (error instanceof z.ZodError) return apiError(res, 400, "Invalid tour request data", { errors: error.errors });
      apiError(res, 500, "Failed to create tour request");
    }
  });

  // GET /api/tour-requests — list tour requests for the caller
  // Parents see their own; providers see requests for their listing
  app.get("/api/tour-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub as string;
      const user = await storage.getUser(userId);
      if (!user) return apiError(res, 404, "User not found");

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
      apiError(res, 500, "Failed to fetch tour requests");
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
      if (!id) return apiError(res, 400, "Invalid tour request ID");

      const statusSchema = z.object({ status: z.enum(["pending", "scheduled", "cancelled"]) });
      const parsed = statusSchema.safeParse(req.body);
      if (!parsed.success) {
        return apiError(res, 400, "Invalid status", { errors: parsed.error.errors });
      }

      const userId = req.user?.claims?.sub as string;
      const tourRequest = await storage.getTourRequest(id);
      if (!tourRequest) return apiError(res, 404, "Tour request not found");

      // Canonical provider ownership: getProvidersByCanonicalOwner handles both
      // claimed (ownerUserId = userId) and unclaimed (ownerUserId IS NULL AND userId = userId).
      const ownedProviders = await storage.getProvidersByCanonicalOwner(userId);
      const isProviderOwner = ownedProviders.some((p) => p.id === tourRequest.providerId);
      const isRequestAuthor = tourRequest.parentUserId === userId;

      const newStatus = parsed.data.status;

      if (isProviderOwner) {
        // Providers may schedule or cancel — they cannot reset to pending
        if (newStatus === "pending") {
          return apiError(res, 403, "Providers cannot reset a tour request to pending");
        }
      } else if (isRequestAuthor) {
        // Parents may only cancel their own pending requests
        if (newStatus !== "cancelled") {
          return apiError(res, 403, "Parents can only cancel their own tour requests");
        }
        if (tourRequest.status !== "pending") {
          return apiError(res, 409, "Only pending tour requests can be cancelled");
        }
      } else {
        return apiError(res, 403, "Not authorized to update this tour request");
      }

      const updated = await storage.updateTourRequestStatus(id, newStatus);

      // Notify the parent when a provider schedules or cancels their tour request.
      if (isProviderOwner && (newStatus === "scheduled" || newStatus === "cancelled")) {
        const parent = await storage.getUser(tourRequest.parentUserId);
        const provider = ownedProviders.find((p) => p.id === tourRequest.providerId);
        if (parent?.email && provider) {
          const parentName = [parent.firstName, parent.lastName].filter(Boolean).join(" ") || parent.email;
          sendTourStatusEmail({
            recipientEmail: parent.email,
            recipientName: parentName,
            providerName: provider.name,
            newStatus,
          }).catch(() => {});
        }
      }

      res.json(updated);
    } catch (error) {
      log.error({ err: error }, "Error updating tour request");
      apiError(res, 500, "Failed to update tour request");
    }
  });
}
