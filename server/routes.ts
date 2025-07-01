import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProviderSchema, insertReviewSchema, insertInquirySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Provider routes
  app.get('/api/providers', async (req, res) => {
    try {
      const {
        type,
        borough,
        ageRangeMin,
        ageRangeMax,
        search,
        limit = 20,
        offset = 0
      } = req.query;

      const filters = {
        type: type as string,
        borough: borough as string,
        ageRangeMin: ageRangeMin ? parseInt(ageRangeMin as string) : undefined,
        ageRangeMax: ageRangeMax ? parseInt(ageRangeMax as string) : undefined,
        search: search as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const providers = await storage.getProviders(filters);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  app.get('/api/providers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const provider = await storage.getProviderWithDetails(id);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      res.json(provider);
    } catch (error) {
      console.error("Error fetching provider:", error);
      res.status(500).json({ message: "Failed to fetch provider" });
    }
  });

  app.post('/api/providers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const providerData = insertProviderSchema.parse({ ...req.body, userId });
      
      const provider = await storage.createProvider(providerData);
      res.status(201).json(provider);
    } catch (error) {
      console.error("Error creating provider:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid provider data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create provider" });
    }
  });

  app.put('/api/providers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check if user owns this provider
      const existingProvider = await storage.getProvider(id);
      if (!existingProvider || existingProvider.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData = insertProviderSchema.partial().parse(req.body);
      const provider = await storage.updateProvider(id, updateData);
      res.json(provider);
    } catch (error) {
      console.error("Error updating provider:", error);
      res.status(500).json({ message: "Failed to update provider" });
    }
  });

  app.get('/api/providers/user/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const requestedUserId = req.params.userId;
      const currentUserId = req.user.claims.sub;
      
      // Users can only access their own providers
      if (requestedUserId !== currentUserId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const providers = await storage.getProvidersByUserId(requestedUserId);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching user providers:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  // Review routes
  app.get('/api/providers/:id/reviews', async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const reviews = await storage.getReviewsByProviderId(providerId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/providers/:id/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        providerId,
        userId,
      });

      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Favorites routes
  app.get('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getFavoritesByUserId(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post('/api/favorites/:providerId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const providerId = parseInt(req.params.providerId);
      
      const favorite = await storage.addFavorite(userId, providerId);
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete('/api/favorites/:providerId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const providerId = parseInt(req.params.providerId);
      
      await storage.removeFavorite(userId, providerId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get('/api/favorites/:providerId/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const providerId = parseInt(req.params.providerId);
      
      const isFavorite = await storage.isFavorite(userId, providerId);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Error checking favorite:", error);
      res.status(500).json({ message: "Failed to check favorite" });
    }
  });

  // Inquiry routes
  app.get('/api/inquiries/provider/:providerId', isAuthenticated, async (req: any, res) => {
    try {
      const providerId = parseInt(req.params.providerId);
      const userId = req.user.claims.sub;
      
      // Check if user owns this provider
      const provider = await storage.getProvider(providerId);
      if (!provider || provider.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const inquiries = await storage.getInquiriesByProviderId(providerId);
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.get('/api/inquiries/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const inquiries = await storage.getInquiriesByUserId(userId);
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching user inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.post('/api/inquiries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const inquiryData = insertInquirySchema.parse({
        ...req.body,
        userId,
      });

      const inquiry = await storage.createInquiry(inquiryData);
      res.status(201).json(inquiry);
    } catch (error) {
      console.error("Error creating inquiry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  app.patch('/api/inquiries/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["pending", "responded", "closed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const inquiry = await storage.updateInquiryStatus(inquiryId, status);
      res.json(inquiry);
    } catch (error) {
      console.error("Error updating inquiry status:", error);
      res.status(500).json({ message: "Failed to update inquiry status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
