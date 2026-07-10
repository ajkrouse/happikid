import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { intelligentSearch } from "../intelligentSearch";
import { generateSearchSummary } from "../services/aiSummaries";
import { insertProviderSchema, insertProviderUpdateSchema, insertProviderPhotoSchema } from "@shared/schema";
import { z } from "zod";

export function registerProviderRoutes(app: Express): void {
  // Featured providers — diverse selection across types
  app.get("/api/providers/featured", async (req, res) => {
    try {
      const { limit = 6 } = req.query;
      const diverseProviders = await Promise.all([
        storage.getProviders({ type: "daycare", limit: 2 }),
        storage.getProviders({ type: "afterschool", limit: 2 }),
        storage.getProviders({ type: "camp", limit: 2 }),
        storage.getProviders({ type: "school", limit: 2 }),
      ]);
      const allProviders = diverseProviders.flat();
      const shuffled = allProviders.sort(() => 0.5 - Math.random());
      res.json(shuffled.slice(0, parseInt(limit as string)));
    } catch (error) {
      console.error("Error fetching featured providers:", error);
      res.status(500).json({ message: "Failed to fetch featured providers" });
    }
  });

  // Provider stats
  app.get("/api/providers/stats", async (_req, res) => {
    try {
      const stats = await storage.getProviderStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching provider stats:", error);
      res.status(500).json({ message: "Failed to fetch provider stats" });
    }
  });

  // List providers with filtering + intelligent search
  app.get("/api/providers", async (req, res) => {
    try {
      const {
        type, borough, city, ageRange, ageRangeMin, ageRangeMax,
        features, search, category, subcategory,
        limit = 20, offset = 0, aiSummary: requestAiSummary, acceptsSubsidies,
      } = req.query;

      const ageGroupMap: { [key: string]: [number, number] } = {
        infants: [0, 12],
        toddlers: [12, 36],
        preschool: [36, 60],
        "school-age": [60, 180],
      };

      let convertedAgeRangeMin = ageRangeMin ? parseInt(ageRangeMin as string) : undefined;
      let convertedAgeRangeMax = ageRangeMax ? parseInt(ageRangeMax as string) : undefined;
      if (ageRange) {
        const ag = ageGroupMap[ageRange as string];
        if (ag) { convertedAgeRangeMin = ag[0]; convertedAgeRangeMax = ag[1]; }
      }

      let filters: any = {
        type: type as string,
        borough: borough as string,
        city: city as string,
        ageRangeMin: convertedAgeRangeMin,
        ageRangeMax: convertedAgeRangeMax,
        features: features ? (features as string).split(",") : undefined,
        search: search as string,
        category: category as string,
        subcategory: subcategory as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        returnTotal: true,
        acceptsSubsidies: acceptsSubsidies === "true",
      };

      if (search && (search as string).trim().length > 0) {
        const parsed = intelligentSearch.parseQuery(search as string);
        filters = {
          ...filters,
          type: filters.type || parsed.filters.type,
          borough: filters.borough || parsed.filters.borough,
          city: filters.city || parsed.filters.city,
          ageRangeMin: filters.ageRangeMin || parsed.filters.ageRangeMin,
          ageRangeMax: filters.ageRangeMax || parsed.filters.ageRangeMax,
          features: filters.features || parsed.filters.features,
          search: parsed.filters.search,
          acceptsSubsidies: filters.acceptsSubsidies || parsed.filters.acceptsSubsidies,
        };
        console.log("Intelligent search parsed:", {
          originalQuery: parsed.originalQuery,
          matchedTerms: parsed.matchedTerms,
          confidence: parsed.confidence,
          appliedFilters: filters,
        });
      }

      console.log("Provider filters received:", {
        type: filters.type, borough: filters.borough, city: filters.city,
        ageRangeMin: filters.ageRangeMin, ageRangeMax: filters.ageRangeMax,
        features: filters.features, search: filters.search, originalAgeRange: ageRange,
      });

      const result = await storage.getProviders(filters);

      if (search && (search as string).trim().length > 0) {
        const parsed = intelligentSearch.parseQuery(search as string);
        const searchMetadata = {
          originalQuery: parsed.originalQuery,
          parsedTerms: parsed.matchedTerms,
          confidence: parsed.confidence,
          suggestions: parsed.suggestions,
          explanation: intelligentSearch.explainParsing(parsed),
        };
        let aiSummaryResult = null;
        if (requestAiSummary === "true") {
          try {
            const providersArray = Array.isArray(result) ? result : result.providers;
            aiSummaryResult = await generateSearchSummary(
              search as string, providersArray,
              { matchedTerms: parsed.matchedTerms, confidence: parsed.confidence }
            );
          } catch (aiError) {
            console.error("Error generating AI summary:", aiError);
          }
        }
        if (Array.isArray(result)) {
          res.json({ providers: result, total: result.length, searchMetadata, ...(aiSummaryResult && { aiInsights: aiSummaryResult }) });
        } else {
          res.json({ ...result, searchMetadata, ...(aiSummaryResult && { aiInsights: aiSummaryResult }) });
        }
      } else {
        res.json(result);
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  // My provider (authenticated user's own listing)
  app.get("/api/providers/mine", isAuthenticated, async (req: any, res) => {
    try {
      const providers = await storage.getProvidersByUserId(req.user!.id);
      if (providers.length === 0) return res.status(404).json({ message: "No provider profile found" });
      res.json(providers[0]);
    } catch (error) {
      console.error("Error fetching user provider:", error);
      res.status(500).json({ message: "Failed to fetch provider" });
    }
  });

  // Single provider by ID
  app.get("/api/providers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid provider ID" });
      const provider = await storage.getProviderWithDetails(id);
      if (!provider) return res.status(404).json({ message: "Provider not found" });
      res.json(provider);
    } catch (error) {
      console.error("Error fetching provider:", error);
      res.status(500).json({ message: "Failed to fetch provider" });
    }
  });

  // Create or update provider
  app.post("/api/providers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { locations, ...providerData } = req.body;
      const existingProviders = await storage.getProvidersByUserId(userId);

      if (existingProviders.length > 0) {
        const providerId = existingProviders[0].id;
        const updateData = insertProviderSchema.partial().parse({ ...providerData, userId });
        const updatedProvider = await storage.updateProvider(providerId, updateData);
        if (locations?.length > 0) {
          const primary = locations.find((l: any) => l.isPrimary) || locations[0];
          if (primary) {
            await storage.updateProvider(providerId, {
              address: primary.address, borough: primary.borough, city: primary.city,
              state: primary.state, zipCode: primary.zipCode, phone: primary.phone,
              capacity: primary.capacity ? parseInt(primary.capacity) : undefined,
            });
          }
          for (const loc of locations) {
            await storage.addProviderLocation({
              providerId, name: loc.name, address: loc.address, borough: loc.borough,
              city: loc.city, state: loc.state, zipCode: loc.zipCode,
              phone: loc.phone, capacity: loc.capacity ? parseInt(loc.capacity) : null,
              isPrimary: loc.isPrimary,
            });
          }
        }
        res.json(updatedProvider);
      } else {
        const base: any = {
          ...providerData, userId,
          type: providerData.type || "daycare",
          ageRangeMin: parseInt(providerData.ageRangeMin) || 0,
          ageRangeMax: parseInt(providerData.ageRangeMax) || 120,
          monthlyPrice: providerData.monthlyPrice ? parseFloat(providerData.monthlyPrice) : 0,
          monthlyPriceMin: providerData.monthlyPriceMin ? parseFloat(providerData.monthlyPriceMin) : null,
          monthlyPriceMax: providerData.monthlyPriceMax ? parseFloat(providerData.monthlyPriceMax) : null,
          borough: providerData.borough || "",
        };
        if (locations?.length > 0) {
          const primary = locations.find((l: any) => l.isPrimary) || locations[0];
          if (primary) {
            Object.assign(base, {
              address: primary.address, borough: primary.borough, city: primary.city,
              state: primary.state, zipCode: primary.zipCode, phone: primary.phone,
              capacity: primary.capacity ? parseInt(primary.capacity) : undefined,
            });
          }
        }
        const provider = await storage.createProvider(insertProviderSchema.parse(base));
        if (locations?.length > 0) {
          for (const loc of locations) {
            await storage.addProviderLocation({
              providerId: provider.id, name: loc.name, address: loc.address,
              borough: loc.borough, city: loc.city, state: loc.state,
              zipCode: loc.zipCode, phone: loc.phone,
              capacity: loc.capacity ? parseInt(loc.capacity) : null, isPrimary: loc.isPrimary,
            });
          }
        }
        res.status(201).json(provider);
      }
    } catch (error) {
      console.error("Error creating/updating provider:", error);
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid provider data", errors: error.errors });
      res.status(500).json({ message: "Failed to create/update provider" });
    }
  });

  // Full update (PUT)
  app.put("/api/providers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      const existing = await storage.getProvider(id);
      if (!existing || existing.userId !== userId) return res.status(403).json({ message: "Access denied" });
      const provider = await storage.updateProvider(id, insertProviderSchema.partial().parse(req.body));
      res.json(provider);
    } catch (error) {
      console.error("Error updating provider:", error);
      res.status(500).json({ message: "Failed to update provider" });
    }
  });

  // Partial update (PATCH)
  app.patch("/api/providers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      const existing = await storage.getProvider(id);
      if (!existing || existing.userId !== userId) return res.status(403).json({ message: "Access denied" });
      const provider = await storage.updateProvider(id, insertProviderSchema.partial().parse(req.body));
      res.json(provider);
    } catch (error) {
      console.error("Error updating provider:", error);
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid provider data", errors: error.errors });
      res.status(500).json({ message: "Failed to update provider" });
    }
  });

  // Providers by user ID
  app.get("/api/providers/user/:userId", isAuthenticated, async (req: any, res) => {
    try {
      if (req.params.userId !== req.user!.id) return res.status(403).json({ message: "Access denied" });
      res.json(await storage.getProvidersByUserId(req.params.userId));
    } catch (error) {
      console.error("Error fetching user providers:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  // Confirm license
  app.post("/api/providers/confirm-license", isAuthenticated, async (req: any, res) => {
    try {
      const providers = await storage.getProvidersByUserId(req.user!.id);
      if (!providers?.length) return res.status(404).json({ message: "Provider not found" });
      const updated = await storage.updateProvider(providers[0].id, {
        licenseStatus: "confirmed", licenseConfirmedAt: new Date(), isProfileVisible: true,
      });
      res.json({ message: "License confirmation request submitted successfully", provider: updated, isConfirmed: true });
    } catch (error) {
      console.error("Error confirming license:", error);
      res.status(500).json({ message: "Failed to confirm license" });
    }
  });

  // Provider images
  app.get("/api/providers/:id/images", async (req: any, res) => {
    try {
      res.json(await storage.getProviderImages(parseInt(req.params.id)));
    } catch (error) {
      console.error("Error fetching provider images:", error);
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  app.post("/api/providers/:id/images", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const provider = await storage.getProvider(providerId);
      if (!provider || provider.userId !== req.user!.id) return res.status(403).json({ message: "Access denied" });
      const { imageUrl, caption, isPrimary = false } = req.body;
      if (!imageUrl) return res.status(400).json({ message: "Image URL is required" });
      res.status(201).json(await storage.addProviderImage({ providerId, imageUrl, caption: caption || null, isPrimary: Boolean(isPrimary) }));
    } catch (error) {
      console.error("Error adding provider image:", error);
      res.status(500).json({ message: "Failed to add image" });
    }
  });

  // Optimization score
  app.get("/api/providers/:id/score", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const provider = await storage.getProvider(providerId);
      if (!provider) return res.status(404).json({ message: "Provider not found" });
      if (provider.userId !== req.user!.id && req.user!.role !== "admin") return res.status(403).json({ message: "Access denied" });
      const existingScore = await storage.getProviderScore?.(providerId);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (existingScore?.lastCalculatedAt && new Date(existingScore.lastCalculatedAt) > oneHourAgo) {
        return res.json({
          overallScore: existingScore.overallScore, completenessScore: existingScore.completenessScore,
          engagementScore: existingScore.engagementScore, verificationScore: existingScore.verificationScore,
          freshnessScore: existingScore.freshnessScore, breakdown: existingScore.scoreBreakdown,
          badges: existingScore.badges, improvementSuggestions: existingScore.improvementSuggestions,
        });
      }
      const [images, reviews, inquiries] = await Promise.all([
        storage.getProviderImages(providerId),
        storage.getProviderReviews(providerId),
        storage.getProviderInquiries?.(providerId) || Promise.resolve([]),
      ]);
      const { ProviderScoringService } = await import("../services/providerScoring");
      const score = ProviderScoringService.calculateScore(provider, images, reviews, inquiries);
      const scorePayload = {
        overallScore: score.overallScore, completenessScore: score.completenessScore,
        engagementScore: score.engagementScore, verificationScore: score.verificationScore,
        freshnessScore: score.freshnessScore, scoreBreakdown: score.breakdown,
        badges: score.badges, improvementSuggestions: score.improvementSuggestions,
        lastCalculatedAt: new Date(),
      };
      if (existingScore) await storage.updateProviderScore?.(providerId, scorePayload);
      else await storage.createProviderScore?.({ providerId, ...scorePayload });
      res.json(score);
    } catch (error) {
      console.error("Error calculating provider score:", error);
      res.status(500).json({ message: "Failed to calculate score" });
    }
  });

  app.post("/api/providers/:id/score/calculate", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const provider = await storage.getProvider(providerId);
      if (!provider) return res.status(404).json({ message: "Provider not found" });
      if (provider.userId !== req.user!.id && req.user!.role !== "admin") return res.status(403).json({ message: "Access denied" });
      const [images, reviews, inquiries] = await Promise.all([
        storage.getProviderImages(providerId),
        storage.getProviderReviews(providerId),
        storage.getProviderInquiries?.(providerId) || Promise.resolve([]),
      ]);
      const { ProviderScoringService } = await import("../services/providerScoring");
      const score = ProviderScoringService.calculateScore(provider, images, reviews, inquiries);
      const scorePayload = {
        overallScore: score.overallScore, completenessScore: score.completenessScore,
        engagementScore: score.engagementScore, verificationScore: score.verificationScore,
        freshnessScore: score.freshnessScore, scoreBreakdown: score.breakdown,
        badges: score.badges, improvementSuggestions: score.improvementSuggestions,
        lastCalculatedAt: new Date(),
      };
      const existing = await storage.getProviderScore?.(providerId);
      if (existing) await storage.updateProviderScore?.(providerId, scorePayload);
      else await storage.createProviderScore?.({ providerId, ...scorePayload });
      res.json({ message: "Score recalculated successfully", score });
    } catch (error) {
      console.error("Error recalculating provider score:", error);
      res.status(500).json({ message: "Failed to recalculate score" });
    }
  });

  // Suggest an edit
  app.post("/api/providers/:id/suggest-update", isAuthenticated, async (req: any, res) => {
    try {
      const updateData = insertProviderUpdateSchema.parse({
        ...req.body, userId: req.user!.id, providerId: parseInt(req.params.id),
      });
      res.status(201).json(await storage.createProviderUpdate(updateData));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      console.error("Error creating provider update:", error);
      res.status(500).json({ message: "Failed to create update" });
    }
  });

  app.get("/api/providers/:id/updates", async (req, res) => {
    try {
      res.json(await storage.getProviderUpdates(parseInt(req.params.id)));
    } catch (error) {
      console.error("Error fetching provider updates:", error);
      res.status(500).json({ message: "Failed to fetch updates" });
    }
  });

  // User-contributed photos
  app.post("/api/providers/:id/contribute-photo", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.body.imageUrl) return res.status(400).json({ error: "imageUrl is required" });
      const providerId = parseInt(req.params.id);
      const userId = req.user!.id;
      const photoData = insertProviderPhotoSchema.parse({ ...req.body, userId, providerId });
      try {
        const { ObjectStorageService } = await import("../objectStorage");
        const svc = new ObjectStorageService();
        await svc.trySetObjectEntityAclPolicy(req.body.imageUrl, { owner: userId, visibility: "public" });
      } catch (e) {
        console.error("Error setting photo ACL:", e);
      }
      res.status(201).json(await storage.createProviderPhoto(photoData));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid photo data", errors: error.errors });
      console.error("Error creating provider photo:", error);
      res.status(500).json({ message: "Failed to add photo" });
    }
  });

  app.get("/api/providers/:id/user-photos", async (req, res) => {
    try {
      const photos = await storage.getProviderPhotos(parseInt(req.params.id));
      res.json(photos.filter((p) => p.status === "approved"));
    } catch (error) {
      console.error("Error fetching provider photos:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });
}
