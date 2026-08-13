import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { sendLicenseRejectionEmail, sendLicenseApprovalEmail } from "../services/email";
import { strictPathInt } from "../lib/pathParams";
import { createLogger } from "../logger";

const log = createLogger("admin");

/**
 * Middleware that ensures the authenticated user has role === "admin".
 */
async function isAdmin(req: any, res: any, next: any) {
  if (!req.user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUser(req.user.claims.sub);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export function registerAdminRoutes(app: Express): void {
  // List all providers pending license review (status "pending" that have been submitted,
  // i.e. licenseSubmittedAt IS NOT NULL, plus status "rejected" so admin can re-review)
  app.get("/api/admin/verifications", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const pending = await storage.getPendingLicenseVerifications();
      res.json(pending);
    } catch (error) {
      log.error({ err: error }, "Error fetching verifications");
      res.status(500).json({ message: "Failed to fetch verifications" });
    }
  });

  // Approve a license submission
  app.post(
    "/api/admin/verifications/:providerId/approve",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const providerId = strictPathInt(req.params.providerId);
        if (!providerId) return res.status(400).json({ message: "Invalid provider ID" });

        const provider = await storage.getProvider(providerId);
        if (!provider) return res.status(404).json({ message: "Provider not found" });

        // Guard: only process providers that are actually in the review queue
        if (provider.licenseStatus !== "pending" || !provider.licenseSubmittedAt) {
          return res.status(409).json({
            message: "Provider is not in the pending-review queue. Only submitted, unreviewed verifications can be approved.",
          });
        }

        const updated = await storage.updateProvider(providerId, {
          licenseStatus: "confirmed",
          licenseConfirmedAt: new Date(),
          isProfileVisible: true,
          isVerified: true,
        });

        // Send approval email if we can look up the owner's email
        if (provider.userId) {
          const owner = await storage.getUser(provider.userId);
          if (owner?.email) {
            await sendLicenseApprovalEmail({
              recipientEmail: owner.email,
              recipientName:
                [owner.firstName, owner.lastName].filter(Boolean).join(" ") || "Provider",
              providerName: provider.name,
              providerId,
            });
          }
        }

        // Audit log
        await storage.createAuditLog({
          actorUserId: req.user.claims.sub,
          action: "license_approved",
          targetType: "provider",
          targetId: String(providerId),
          meta: { providerId },
        });

        log.info({ providerId, adminId: req.user.claims.sub }, "License approved");
        res.json({ message: "License approved", provider: updated });
      } catch (error) {
        log.error({ err: error }, "Error approving license");
        res.status(500).json({ message: "Failed to approve license" });
      }
    }
  );

  // Reject a license submission
  app.post(
    "/api/admin/verifications/:providerId/reject",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const providerId = strictPathInt(req.params.providerId);
        if (!providerId) return res.status(400).json({ message: "Invalid provider ID" });

        const { reason } = req.body;
        if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
          return res.status(400).json({ message: "A rejection reason is required" });
        }

        const provider = await storage.getProvider(providerId);
        if (!provider) return res.status(404).json({ message: "Provider not found" });

        // Guard: only process providers that are actually in the review queue
        if (provider.licenseStatus !== "pending" || !provider.licenseSubmittedAt) {
          return res.status(409).json({
            message: "Provider is not in the pending-review queue. Only submitted, unreviewed verifications can be rejected.",
          });
        }

        // Mark as rejected; keep isProfileVisible false (don't go live)
        const updated = await storage.updateProvider(providerId, {
          licenseStatus: "rejected",
          isProfileVisible: false,
        });

        // Send rejection email if we can look up the owner's email
        if (provider.userId) {
          const owner = await storage.getUser(provider.userId);
          if (owner?.email) {
            await sendLicenseRejectionEmail({
              recipientEmail: owner.email,
              recipientName:
                [owner.firstName, owner.lastName].filter(Boolean).join(" ") || "Provider",
              providerName: provider.name,
              reason: reason.trim(),
            });
          }
        }

        // Audit log
        await storage.createAuditLog({
          actorUserId: req.user.claims.sub,
          action: "license_rejected",
          targetType: "provider",
          targetId: String(providerId),
          meta: { providerId, reason: reason.trim() },
        });

        log.info({ providerId, adminId: req.user.claims.sub }, "License rejected");
        res.json({ message: "License rejected", provider: updated });
      } catch (error) {
        log.error({ err: error }, "Error rejecting license");
        res.status(500).json({ message: "Failed to reject license" });
      }
    }
  );
}
