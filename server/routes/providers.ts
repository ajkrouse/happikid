import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { intelligentSearch } from "../intelligentSearch";
import { generateSearchSummary } from "../services/aiSummaries";
import { insertProviderSchema, insertProviderUpdateSchema, insertProviderPhotoSchema, insertProviderImageSchema, insertProviderLocationSchema, providerClientUpdateSchema } from "@shared/schema";
import { strictPathInt } from "../lib/pathParams";
import { z } from "zod";
import { createLogger } from "../logger";

const log = createLogger("providers");

// Schema for location items submitted in the provider create/update body.
// Capacity is optional/nullable but must be a non-negative integer when supplied — reject anything else.
const locationBodySchema = insertProviderLocationSchema.omit({ providerId: true }).extend({
  capacity: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.union([
      z.null(),
      z.number().int().nonnegative(),
      z.string().regex(/^\d+$/, "Capacity must be a non-negative integer").transform(Number),
    ])
  ).optional(),
});

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
      log.error({ err: error }, "Error fetching featured providers");
      res.status(500).json({ message: "Failed to fetch featured providers" });
    }
  });

  // Provider stats
  app.get("/api/providers/stats", async (_req, res) => {
    try {
      res.json(await storage.getProviderStats());
    } catch (error) {
      log.error({ err: error }, "Error fetching provider stats");
      res.status(500).json({ message: "Failed to fetch provider stats" });
    }
  });

  // List providers with filtering + intelligent search
  app.get("/api/providers", async (req, res) => {
    try {
      const {
        type, borough, city, ageRange, ageRangeMin, ageRangeMax,
        features, search, category, subcategory,
        limit = 20, offset = 0, aiSummary: requestAiSummary, acceptsSubsidies, verifiedPricing,
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
        verifiedPricing: verifiedPricing === "true",
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
        log.debug({
          originalQuery: parsed.originalQuery,
          matchedTerms: parsed.matchedTerms,
          confidence: parsed.confidence,
          appliedFilters: filters,
        }, "Intelligent search parsed");
      }

      log.debug({
        type: filters.type, borough: filters.borough, city: filters.city,
        ageRangeMin: filters.ageRangeMin, ageRangeMax: filters.ageRangeMax,
        features: filters.features, search: filters.search, originalAgeRange: ageRange,
      }, "Provider filters received");

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
            log.error({ err: aiError }, "Error generating AI summary");
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
      log.error({ err: error }, "Error fetching providers");
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  // Provider analytics for the authenticated provider owner
  app.get("/api/providers/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userProviders = await storage.getProvidersByUserId(req.user?.claims?.sub);
      if (userProviders.length === 0) return res.status(404).json({ message: "No provider profile found" });
      const provider = userProviders[0];

      const [reviews, inquiries] = await Promise.all([
        storage.getReviewsByProviderId(provider.id),
        storage.getProviderInquiries?.(provider.id) ?? Promise.resolve([]),
      ]);

      // Rating distribution (1-5 stars)
      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const r of reviews) {
        if (r.rating >= 1 && r.rating <= 5) ratingDistribution[r.rating]++;
      }

      // Inquiry stats
      const respondedInquiries = inquiries.filter((i) => i.status === "responded" || i.status === "closed");
      const responseRate = inquiries.length > 0
        ? Math.round((respondedInquiries.length / inquiries.length) * 100)
        : null;

      // Recent reviews (last 5)
      const recentReviews = reviews.slice(0, 5).map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        createdAt: r.createdAt,
      }));

      res.json({
        // Listing performance (from providers table analytics fields)
        profileViews: provider.profileViews ?? 0,
        profileClicks: provider.profileClicks ?? 0,
        comparisonAdds: provider.comparisonAdds ?? 0,
        favoriteAdds: provider.favoriteAdds ?? 0,
        // Review summary
        reviewCount: reviews.length,
        averageRating: reviews.length > 0 ? Number(provider.rating) : null,
        ratingDistribution,
        recentReviews,
        // Inquiry summary
        inquiryCount: inquiries.length,
        pendingInquiries: inquiries.filter((i) => i.status === "pending").length,
        responseRate,
      });
    } catch (error) {
      log.error({ err: error }, "Error fetching provider analytics");
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // My provider (authenticated user's own listing)
  app.get("/api/providers/mine", isAuthenticated, async (req: any, res) => {
    try {
      const providers = await storage.getProvidersByUserId(req.user?.claims?.sub);
      if (providers.length === 0) return res.status(404).json({ message: "No provider profile found" });
      const provider = providers[0];
      // Strip expired closure entries so the edit form never surfaces stale history
      const todayIso = new Date().toISOString().slice(0, 10);
      if (Array.isArray(provider.closedDates)) {
        (provider as any).closedDates = (provider.closedDates as any[]).filter(
          (e: any) => typeof e?.to === "string" && e.to >= todayIso
        );
      }
      res.json(provider);
    } catch (error) {
      log.error({ err: error }, "Error fetching user provider");
      res.status(500).json({ message: "Failed to fetch provider" });
    }
  });

  // Single provider by ID — also records a daily profile view
  app.get("/api/providers/:id", async (req, res) => {
    try {
      const id = strictPathInt(req.params.id);
      if (!id) return res.status(400).json({ message: "Invalid provider ID" });
      const provider = await storage.getProviderWithDetails(id);
      if (!provider) return res.status(404).json({ message: "Provider not found" });
      // Strip expired closure entries so families never see stale history
      const todayIso = new Date().toISOString().slice(0, 10);
      if (Array.isArray((provider as any).closedDates)) {
        (provider as any).closedDates = ((provider as any).closedDates as any[]).filter(
          (e: any) => typeof e?.to === "string" && e.to >= todayIso
        );
      }
      // Fire-and-forget: track the view without blocking the response
      storage.trackProfileView(id).catch(() => {});
      res.json(provider);
    } catch (error) {
      log.error({ err: error }, "Error fetching provider");
      res.status(500).json({ message: "Failed to fetch provider" });
    }
  });

  // Profile view trend — last 30 days of daily view counts for the authenticated provider
  app.get("/api/providers/analytics/views", isAuthenticated, async (req: any, res) => {
    try {
      const userProviders = await storage.getProvidersByUserId(req.user?.claims?.sub);
      if (userProviders.length === 0) return res.status(404).json({ message: "No provider profile found" });
      const trend = await storage.getProfileViewTrend(userProviders[0].id, 30);
      res.json(trend);
    } catch (error) {
      log.error({ err: error }, "Error fetching view trend");
      res.status(500).json({ message: "Failed to fetch view trend" });
    }
  });

  // Score comparison — how this provider's optimization score ranks among similar listings
  app.get("/api/providers/analytics/score-comparison", isAuthenticated, async (req: any, res) => {
    try {
      const userProviders = await storage.getProvidersByUserId(req.user?.claims?.sub);
      if (userProviders.length === 0) return res.status(404).json({ message: "No provider profile found" });
      const provider = userProviders[0];

      const myScore = await storage.getProviderScore?.(provider.id);
      const myOverall = myScore?.overallScore ?? null;

      // Fetch scores for providers in same city + type for a meaningful comparison pool
      const similarScores = await storage.getSimilarProviderScores(provider.id, provider.city, provider.type);

      if (similarScores.length === 0 || myOverall === null) {
        return res.json({ myScore: myOverall, percentile: null, poolSize: 0, averageScore: null });
      }

      const allScores = similarScores.map((s) => s.overallScore ?? 0);
      const averageScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
      const below = allScores.filter((s) => s < myOverall).length;
      const percentile = Math.round((below / allScores.length) * 100);

      res.json({
        myScore: myOverall,
        percentile,
        poolSize: allScores.length,
        averageScore,
        topScore: Math.max(...allScores),
      });
    } catch (error) {
      log.error({ err: error }, "Error fetching score comparison");
      res.status(500).json({ message: "Failed to fetch score comparison" });
    }
  });

  // Create or update provider
  app.post("/api/providers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { locations: rawLocations, ...providerData } = req.body;

      // Validate locations array up-front so we never write partial location data.
      // Any supplied non-null value must be a valid array; reject it otherwise.
      let validatedLocations: z.infer<typeof locationBodySchema>[] = [];
      if (rawLocations != null) {
        const locResult = z.array(locationBodySchema).safeParse(rawLocations);
        if (!locResult.success) {
          return res.status(400).json({ message: "Invalid location data", errors: locResult.error.errors });
        }
        validatedLocations = locResult.data;
      }

      const existingProviders = await storage.getProvidersByUserId(userId);

      if (existingProviders.length > 0) {
        // Update path: use providerClientUpdateSchema to strip server-controlled fields,
        // then enforce userId from the authenticated session only.
        const providerId = existingProviders[0].id;
        const parsed = providerClientUpdateSchema.partial().parse(providerData);
        // Lazy cleanup: drop any closure entries whose end date has already passed
        if (Array.isArray(parsed.closedDates)) {
          const todayIso = new Date().toISOString().slice(0, 10);
          parsed.closedDates = parsed.closedDates.filter((e) => e.to >= todayIso);
          if (parsed.closedDates.length === 0) parsed.closedDates = null;
        }
        const updateData = { ...parsed, userId };
        const updatedProvider = await storage.updateProvider(providerId, updateData);
        if (validatedLocations.length > 0) {
          const primary = validatedLocations.find((l) => l.isPrimary) || validatedLocations[0];
          if (primary) {
            await storage.updateProvider(providerId, {
              address: primary.address, borough: primary.borough, city: primary.city,
              state: primary.state, zipCode: primary.zipCode, phone: primary.phone,
              capacity: primary.capacity ?? undefined,
            });
          }
          for (const loc of validatedLocations) {
            await storage.addProviderLocation({ providerId, ...loc });
          }
        }
        res.json(updatedProvider);
      } else {
        // Create path: parse through providerClientUpdateSchema to strip server-controlled fields,
        // then let insertProviderSchema validate & normalise everything, with userId enforced from auth.
        // Pre-filter inverted closure entries (to < from) before schema validation so they are
        // silently stripped rather than causing a 400 rejection.
        const bodyForCreate: any = { ...providerData };
        if (Array.isArray(bodyForCreate.closedDates)) {
          bodyForCreate.closedDates = bodyForCreate.closedDates.filter(
            (e: any) => typeof e?.from === "string" && typeof e?.to === "string" && e.from <= e.to
          );
          if (bodyForCreate.closedDates.length === 0) bodyForCreate.closedDates = null;
        }
        const safeData = providerClientUpdateSchema.partial().parse(bodyForCreate);
        const base: any = {
          ...safeData, userId,
          type: safeData.type || "daycare",
          borough: safeData.borough || "",
        };
        if (validatedLocations.length > 0) {
          const primary = validatedLocations.find((l) => l.isPrimary) || validatedLocations[0];
          if (primary) {
            Object.assign(base, {
              address: primary.address, borough: primary.borough, city: primary.city,
              state: primary.state, zipCode: primary.zipCode, phone: primary.phone,
              capacity: primary.capacity ?? undefined,
            });
          }
        }
        const provider = await storage.createProvider(insertProviderSchema.parse(base));
        for (const loc of validatedLocations) {
          await storage.addProviderLocation({ providerId: provider.id, ...loc });
        }
        res.status(201).json(provider);
      }
    } catch (error) {
      log.error({ err: error }, "Error creating/updating provider");
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid provider data", errors: error.errors });
      res.status(500).json({ message: "Failed to create/update provider" });
    }
  });

  // Full update (PUT) — providerClientUpdateSchema strips server-controlled fields before write
  app.put("/api/providers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = strictPathInt(req.params.id);
      if (!id) return res.status(400).json({ message: "Invalid provider ID" });
      const userId = req.user?.claims?.sub;
      const existing = await storage.getProvider(id);
      if (!existing || existing.userId !== userId) return res.status(403).json({ message: "Access denied" });
      const parsed = providerClientUpdateSchema.partial().parse(req.body);
      // Lazy cleanup: drop any closure entries whose end date has already passed
      if (Array.isArray(parsed.closedDates)) {
        const todayIso = new Date().toISOString().slice(0, 10);
        parsed.closedDates = parsed.closedDates.filter((e) => e.to >= todayIso);
        if (parsed.closedDates.length === 0) parsed.closedDates = null;
      }
      res.json(await storage.updateProvider(id, { ...parsed, userId }));
    } catch (error) {
      log.error({ err: error }, "Error updating provider");
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid provider data", errors: error.errors });
      res.status(500).json({ message: "Failed to update provider" });
    }
  });

  // Partial update (PATCH) — providerClientUpdateSchema strips server-controlled fields before write
  app.patch("/api/providers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = strictPathInt(req.params.id);
      if (!id) return res.status(400).json({ message: "Invalid provider ID" });
      const userId = req.user?.claims?.sub;
      const existing = await storage.getProvider(id);
      if (!existing || existing.userId !== userId) return res.status(403).json({ message: "Access denied" });
      const parsed = providerClientUpdateSchema.partial().parse(req.body);
      // Lazy cleanup: drop any closure entries whose end date has already passed
      if (Array.isArray(parsed.closedDates)) {
        const todayIso = new Date().toISOString().slice(0, 10);
        parsed.closedDates = parsed.closedDates.filter((e) => e.to >= todayIso);
        if (parsed.closedDates.length === 0) parsed.closedDates = null;
      }
      res.json(await storage.updateProvider(id, { ...parsed, userId }));
    } catch (error) {
      log.error({ err: error }, "Error updating provider");
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid provider data", errors: error.errors });
      res.status(500).json({ message: "Failed to update provider" });
    }
  });

  // Providers by user ID
  app.get("/api/providers/user/:userId", isAuthenticated, async (req: any, res) => {
    try {
      if (req.params.userId !== req.user?.claims?.sub) return res.status(403).json({ message: "Access denied" });
      res.json(await storage.getProvidersByUserId(req.params.userId));
    } catch (error) {
      log.error({ err: error }, "Error fetching user providers");
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  // Confirm license
  app.post("/api/providers/confirm-license", isAuthenticated, async (req: any, res) => {
    try {
      const providers = await storage.getProvidersByUserId(req.user?.claims?.sub);
      if (!providers?.length) return res.status(404).json({ message: "Provider not found" });
      const updated = await storage.updateProvider(providers[0].id, {
        licenseStatus: "confirmed", licenseConfirmedAt: new Date(), isProfileVisible: true,
      });
      res.json({ message: "License confirmation request submitted successfully", provider: updated, isConfirmed: true });
    } catch (error) {
      log.error({ err: error }, "Error confirming license");
      res.status(500).json({ message: "Failed to confirm license" });
    }
  });

  // Provider images
  app.get("/api/providers/:id/images", async (req: any, res) => {
    try {
      const id = strictPathInt(req.params.id);
      if (!id) return res.status(400).json({ message: "Invalid provider ID" });
      res.json(await storage.getProviderImages(id));
    } catch (error) {
      log.error({ err: error }, "Error fetching provider images");
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  app.post("/api/providers/:id/images", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.id);
      if (!providerId) return res.status(400).json({ message: "Invalid provider ID" });
      const provider = await storage.getProvider(providerId);
      if (!provider || provider.userId !== req.user?.claims?.sub) return res.status(403).json({ message: "Access denied" });
      const parsed = insertProviderImageSchema.safeParse({ ...req.body, providerId });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid image data", errors: parsed.error.errors });
      }
      res.status(201).json(await storage.addProviderImage(parsed.data));
    } catch (error) {
      log.error({ err: error }, "Error adding provider image");
      res.status(500).json({ message: "Failed to add image" });
    }
  });

  // Optimization score
  app.get("/api/providers/:id/score", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.id);
      if (!providerId) return res.status(400).json({ message: "Invalid provider ID" });
      const provider = await storage.getProvider(providerId);
      if (!provider) return res.status(404).json({ message: "Provider not found" });
      if (provider.userId !== req.user?.claims?.sub && req.user?.claims?.role !== "admin") return res.status(403).json({ message: "Access denied" });
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
      log.error({ err: error }, "Error calculating provider score");
      res.status(500).json({ message: "Failed to calculate score" });
    }
  });

  app.post("/api/providers/:id/score/calculate", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.id);
      if (!providerId) return res.status(400).json({ message: "Invalid provider ID" });
      const provider = await storage.getProvider(providerId);
      if (!provider) return res.status(404).json({ message: "Provider not found" });
      if (provider.userId !== req.user?.claims?.sub && req.user?.claims?.role !== "admin") return res.status(403).json({ message: "Access denied" });
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
      log.error({ err: error }, "Error recalculating provider score");
      res.status(500).json({ message: "Failed to recalculate score" });
    }
  });

  // Suggest an edit
  app.post("/api/providers/:id/suggest-update", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.id);
      if (!providerId) return res.status(400).json({ message: "Invalid provider ID" });
      const updateData = insertProviderUpdateSchema.parse({
        ...req.body, userId: req.user?.claims?.sub, providerId,
      });
      res.status(201).json(await storage.createProviderUpdate(updateData));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      log.error({ err: error }, "Error creating provider update");
      res.status(500).json({ message: "Failed to create update" });
    }
  });

  app.get("/api/providers/:id/updates", async (req, res) => {
    try {
      const id = strictPathInt(req.params.id);
      if (!id) return res.status(400).json({ message: "Invalid provider ID" });
      res.json(await storage.getProviderUpdates(id));
    } catch (error) {
      log.error({ err: error }, "Error fetching provider updates");
      res.status(500).json({ message: "Failed to fetch updates" });
    }
  });

  // User-contributed photos
  app.post("/api/providers/:id/contribute-photo", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.id);
      if (!providerId) return res.status(400).json({ message: "Invalid provider ID" });
      const userId = req.user?.claims?.sub;
      const photoData = insertProviderPhotoSchema.parse({ ...req.body, userId, providerId });
      try {
        const { ObjectStorageService } = await import("../objectStorage");
        const svc = new ObjectStorageService();
        await svc.trySetObjectEntityAclPolicy(req.body.imageUrl, { owner: userId, visibility: "public" });
      } catch (e) {
        log.error({ err: e }, "Error setting photo ACL");
      }
      res.status(201).json(await storage.createProviderPhoto(photoData));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid photo data", errors: error.errors });
      log.error({ err: error }, "Error creating provider photo");
      res.status(500).json({ message: "Failed to add photo" });
    }
  });

  app.get("/api/providers/:id/user-photos", async (req, res) => {
    try {
      const id = strictPathInt(req.params.id);
      if (!id) return res.status(400).json({ message: "Invalid provider ID" });
      const photos = await storage.getProviderPhotos(id);
      res.json(photos.filter((p) => p.status === "approved"));
    } catch (error) {
      log.error({ err: error }, "Error fetching provider photos");
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });
}
