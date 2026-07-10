import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { insertReviewSchema, insertReviewVoteSchema } from "@shared/schema";
import { z } from "zod";

export function registerReviewRoutes(app: Express): void {
  // Get all reviews for a provider
  app.get("/api/providers/:id/reviews", async (req, res) => {
    try {
      res.json(await storage.getReviewsByProviderId(parseInt(req.params.id)));
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Submit a review
  app.post("/api/providers/:id/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body, providerId: parseInt(req.params.id), userId: req.user!.id,
      });
      res.status(201).json(await storage.createReview(reviewData));
    } catch (error) {
      console.error("Error creating review:", error);
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Vote on a review
  app.post("/api/reviews/:id/vote", isAuthenticated, async (req: any, res) => {
    try {
      const voteData = insertReviewVoteSchema.parse({
        ...req.body, userId: req.user!.id, reviewId: parseInt(req.params.id),
      });
      res.status(201).json(await storage.createReviewVote(voteData));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid vote data", errors: error.errors });
      console.error("Error creating review vote:", error);
      res.status(500).json({ message: "Failed to record vote" });
    }
  });

  // Get vote counts for a review
  app.get("/api/reviews/:id/votes", async (req, res) => {
    try {
      const votes = await storage.getReviewVotes(parseInt(req.params.id));
      const helpful = votes.filter((v) => v.voteType === "helpful").length;
      const notHelpful = votes.filter((v) => v.voteType === "not_helpful").length;
      res.json({ helpful, notHelpful, total: votes.length });
    } catch (error) {
      console.error("Error fetching review votes:", error);
      res.status(500).json({ message: "Failed to fetch votes" });
    }
  });

  // Get current user's vote on a review
  app.get("/api/reviews/:id/user-vote", isAuthenticated, async (req: any, res) => {
    try {
      res.json((await storage.getUserReviewVote(req.user!.id, parseInt(req.params.id))) || null);
    } catch (error) {
      console.error("Error fetching user vote:", error);
      res.status(500).json({ message: "Failed to fetch user vote" });
    }
  });
}
