import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { reviewClientCreateSchema, insertReviewVoteSchema } from "@shared/schema";
import { strictPathInt } from "../lib/pathParams";
import { apiError } from "../lib/apiError";
import { isPublicProvider, toPublicReview } from "../lib/providerAccess";
import { z } from "zod";
import { createLogger } from "../logger";

const log = createLogger("reviews");

export function registerReviewRoutes(app: Express): void {
  app.get("/api/providers/:id/reviews", async (req, res) => {
    try {
      const id = strictPathInt(req.params.id);
      if (!id) return apiError(res, 400, "Invalid provider ID");
      const provider = await storage.getProvider(id);
      if (!provider || !isPublicProvider(provider)) return apiError(res, 404, "Provider not found");
      res.json((await storage.getReviewsByProviderId(id)).map(toPublicReview));
    } catch (error) {
      log.error({ err: error }, "Error fetching reviews");
      apiError(res, 500, "Failed to fetch reviews");
    }
  });

  app.post("/api/providers/:id/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.id);
      if (!providerId) return apiError(res, 400, "Invalid provider ID");
      const provider = await storage.getProvider(providerId);
      if (!provider || !isPublicProvider(provider)) return apiError(res, 404, "Provider not found");
      const reviewData = reviewClientCreateSchema.parse({
        ...req.body, providerId, userId: req.user?.claims?.sub,
      });
      res.status(201).json(toPublicReview(await storage.createReview(reviewData)));
    } catch (error) {
      log.error({ err: error }, "Error creating review");
      if (error instanceof z.ZodError) return apiError(res, 400, "Invalid review data", { errors: error.errors });
      apiError(res, 500, "Failed to create review");
    }
  });

  app.post("/api/reviews/:id/vote", isAuthenticated, async (req: any, res) => {
    try {
      const reviewId = strictPathInt(req.params.id);
      if (!reviewId) return apiError(res, 400, "Invalid review ID");
      const voteData = insertReviewVoteSchema.parse({
        ...req.body, userId: req.user?.claims?.sub, reviewId,
      });
      res.status(201).json(await storage.createReviewVote(voteData));
    } catch (error) {
      if (error instanceof z.ZodError) return apiError(res, 400, "Invalid vote data", { errors: error.errors });
      log.error({ err: error }, "Error creating review vote");
      apiError(res, 500, "Failed to record vote");
    }
  });

  app.get("/api/reviews/:id/votes", async (req, res) => {
    try {
      const reviewId = strictPathInt(req.params.id);
      if (!reviewId) return apiError(res, 400, "Invalid review ID");
      const votes = await storage.getReviewVotes(reviewId);
      const helpful = votes.filter((v) => v.voteType === "helpful").length;
      const notHelpful = votes.filter((v) => v.voteType === "not_helpful").length;
      res.json({ helpful, notHelpful, total: votes.length });
    } catch (error) {
      log.error({ err: error }, "Error fetching review votes");
      apiError(res, 500, "Failed to fetch votes");
    }
  });

  app.get("/api/reviews/:id/user-vote", isAuthenticated, async (req: any, res) => {
    try {
      const reviewId = strictPathInt(req.params.id);
      if (!reviewId) return apiError(res, 400, "Invalid review ID");
      res.json((await storage.getUserReviewVote(req.user?.claims?.sub, reviewId)) || null);
    } catch (error) {
      log.error({ err: error }, "Error fetching user vote");
      apiError(res, 500, "Failed to fetch user vote");
    }
  });
}
