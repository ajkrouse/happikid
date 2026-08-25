import type { Express } from "express";
import crypto from "crypto";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { intelligentSearch } from "../intelligentSearch";
import { generateSearchSummary } from "../services/aiSummaries";
import { insertProviderSchema, insertProviderUpdateSchema, insertProviderPhotoSchema, insertProviderImageSchema, insertProviderLocationSchema, providerClientUpdateSchema } from "@shared/schema";
import { strictPathInt } from "../lib/pathParams";
import { apiError } from "../lib/apiError";
import {
  isCanonicalProviderOwner,
  isPublicProvider,
  toPublicProvider,
  toPublicProviderDetail,
  toPublicProviderImage,
  toPublicProviderPhoto,
  toPublicProviderUpdate,
} from "../lib/providerAccess";
import {
  ProviderImageValidationError,
  assertProviderImageObjectPath,
  isStoredProviderImagePath,
  verifyProviderImageUploadToken,
} from "../lib/providerImageUpload";
import { z } from "zod";
import { createLogger } from "../logger";
import { aiSummaryLimiter } from "../middleware/rateLimiter";
import {
  formatProviderSearchValidationError,
  parseProviderSearchQuery,
} from "../lib/providerSearch";

const log = createLogger("providers");

function postgresErrorCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current && typeof current === "object"; depth += 1) {
    const databaseError = current as { code?: unknown; cause?: unknown };
    if (typeof databaseError.code === "string") return databaseError.code;
    current = databaseError.cause;
  }
  return undefined;
}

/**
 * Returns an opaque, stable per-visitor key for daily profile-view deduplication.
 * Authenticated identities and anonymous session IDs are hashed before storage.
 */
function getProfileViewViewerKey(req: any): string | null {
  const userId = req.user?.claims?.sub;
  let identity: string | null = typeof userId === "string" && userId.length > 0
    ? `user:${userId}`
    : null;

  if (!identity && req.session) {
    if (!req.session.providerViewVisitorId) {
      req.session.providerViewVisitorId = crypto.randomUUID();
    }
    identity = `visitor:${req.session.providerViewVisitorId}`;
  }

  if (!identity) return null;
  return crypto.createHash("sha256").update(identity).digest("hex");
}

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

const providerImageCreateSchema = z.object({
  objectPath: z.string().optional(),
  uploadToken: z.string().optional(),
  imageUrl: z.string().url().max(2048).optional(),
  caption: z.string().trim().max(300).nullable().optional(),
  isPrimary: z.boolean().optional(),
}).superRefine((data, ctx) => {
  const usesUploadedObject = !!data.objectPath;
  const usesExternalUrl = !!data.imageUrl;
  if (usesUploadedObject === usesExternalUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Provide exactly one image source",
      path: ["objectPath"],
    });
  }
  if (usesUploadedObject && !data.uploadToken) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Missing upload token",
      path: ["uploadToken"],
    });
  }
});

const providerImageUpdateSchema = z.object({
  caption: z.string().trim().max(300).nullable().optional(),
  isPrimary: z.boolean().optional(),
}).refine((data) => data.caption !== undefined || data.isPrimary !== undefined, {
  message: "Provide an image update",
});

async function toPublicProviderWithImages(provider: any) {
  const images = (await storage.getProviderImages(provider.id)) ?? [];
  return toPublicProvider({ ...provider, images } as any);
}

async function cleanUpFailedProviderImageObject(objectPath: string): Promise<void> {
  const isPermanentObject = isStoredProviderImagePath(objectPath);
  let cleanupJobQueued = false;

  if (isPermanentObject) {
    try {
      await storage.queueProviderImageCleanup(objectPath);
      cleanupJobQueued = true;
    } catch (queueError) {
      log.error({ err: queueError, objectPath }, "Unable to queue failed provider image cleanup");
    }
  }

  try {
    const { ObjectStorageService } = await import("../objectStorage");
    await new ObjectStorageService().deleteObjectEntity(objectPath);
    if (cleanupJobQueued) {
      await storage.completeProviderImageCleanupByObjectPath(objectPath);
    }
  } catch (cleanupError) {
    log.warn({ err: cleanupError, objectPath }, "Unable to clean up failed provider image upload");
  }
}

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
      res.json(await Promise.all(
        shuffled.slice(0, parseInt(limit as string)).map(toPublicProviderWithImages),
      ));
    } catch (error) {
      log.error({ err: error }, "Error fetching featured providers");
      apiError(res, 500, "Failed to fetch featured providers");
    }
  });

  // Provider stats
  app.get("/api/providers/stats", async (_req, res) => {
    try {
      res.json(await storage.getProviderStats());
    } catch (error) {
      log.error({ err: error }, "Error fetching provider stats");
      apiError(res, 500, "Failed to fetch provider stats");
    }
  });

  // List providers with filtering + intelligent search
  app.get("/api/providers", aiSummaryLimiter, async (req, res) => {
    try {
      const ageGroupMap: { [key: string]: [number, number] } = {
        infants: [0, 12],
        toddlers: [12, 36],
        preschool: [36, 60],
        "school-age": [60, 180],
      };

      let query;
      try {
        query = parseProviderSearchQuery(req.query);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return apiError(res, 400, "Invalid provider search parameters", {
            details: formatProviderSearchValidationError(error),
          });
        }
        throw error;
      }

      const ageGroup = query.ageRange ? ageGroupMap[query.ageRange] : undefined;
      let filters: any = {
        type: query.type,
        borough: query.borough,
        city: query.city,
        ageRangeMin: ageGroup?.[0] ?? query.ageRangeMin,
        ageRangeMax: ageGroup?.[1] ?? query.ageRangeMax,
        features: query.features,
        search: query.search,
        category: query.category,
        subcategory: query.subcategory,
        limit: query.limit,
        offset: query.offset,
        returnTotal: true,
        acceptsSubsidies: query.acceptsSubsidies,
        verifiedPricing: query.verifiedPricing,
        enrollmentStatus: query.enrollmentStatus,
        openOn: query.openOn,
        priceRange: query.priceRange,
        priceMin: query.priceMin,
        priceMax: query.priceMax,
        lat: query.lat,
        lng: query.lng,
        radius: query.radius,
        sortBy: query.sortBy,
      };

      if (query.search && query.search.length > 0) {
        const parsed = intelligentSearch.parseQuery(query.search);
        filters = {
          ...filters,
          type: filters.type || parsed.filters.type,
          borough: filters.borough || parsed.filters.borough,
          city: filters.city || parsed.filters.city,
          ageRangeMin: filters.ageRangeMin ?? parsed.filters.ageRangeMin,
          ageRangeMax: filters.ageRangeMax ?? parsed.filters.ageRangeMax,
          features: filters.features || parsed.filters.features,
          search: parsed.filters.search,
          acceptsSubsidies: filters.acceptsSubsidies ?? parsed.filters.acceptsSubsidies,
          priceMin: filters.priceMin ?? parsed.filters.priceMin,
          priceMax: filters.priceMax ?? parsed.filters.priceMax,
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
        features: filters.features, search: filters.search, originalAgeRange: query.ageRange,
      }, "Provider filters received");

      const result = await storage.getProviders(filters);
      const publicResult = Array.isArray(result)
        ? await Promise.all(result.map(toPublicProviderWithImages))
        : {
            ...result,
            providers: await Promise.all(result.providers.map(toPublicProviderWithImages)),
          };

      if (query.search && query.search.length > 0) {
        const parsed = intelligentSearch.parseQuery(query.search);
        const searchMetadata = {
          originalQuery: parsed.originalQuery,
          parsedTerms: parsed.matchedTerms,
          confidence: parsed.confidence,
          suggestions: parsed.suggestions,
          explanation: intelligentSearch.explainParsing(parsed),
        };
        let aiSummaryResult = null;
        if (query.aiSummary) {
          try {
            const providersArray = Array.isArray(publicResult)
              ? publicResult
              : publicResult.providers;
            aiSummaryResult = await generateSearchSummary(
              query.search, providersArray as any,
              { matchedTerms: parsed.matchedTerms, confidence: parsed.confidence }
            );
          } catch (aiError) {
            log.error({ err: aiError }, "Error generating AI summary");
          }
        }
        const aiFallback = "AI insights are temporarily unavailable. Your search results are still complete.";
        if (Array.isArray(publicResult)) {
          res.json({
            providers: publicResult,
            total: publicResult.length,
            searchMetadata,
            aiInsights: aiSummaryResult,
            aiInsightsStatus: aiSummaryResult ? "ready" : "unavailable",
            aiInsightsMessage: aiSummaryResult ? undefined : aiFallback,
          });
        } else {
          res.json({
            ...publicResult,
            searchMetadata,
            aiInsights: aiSummaryResult,
            aiInsightsStatus: aiSummaryResult ? "ready" : "unavailable",
            aiInsightsMessage: aiSummaryResult ? undefined : aiFallback,
          });
        }
      } else {
        res.json(publicResult);
      }
    } catch (error) {
      log.error({ err: error }, "Error fetching providers");
      apiError(res, 500, "Failed to fetch providers");
    }
  });

  // Provider analytics for the authenticated provider owner
  app.get("/api/providers/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userProviders = await storage.getProvidersByCanonicalOwner(req.user?.claims?.sub);
      if (userProviders.length === 0) return apiError(res, 404, "No provider profile found");
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

      const weeklyViews = await storage.getWeeklyViewSummary(provider.id);

      res.json({
        // Listing performance (from providers table analytics fields)
        profileViews: provider.profileViews ?? 0,
        profileClicks: provider.profileClicks ?? 0,
        comparisonAdds: provider.comparisonAdds ?? 0,
        favoriteAdds: provider.favoriteAdds ?? 0,
        // Weekly view trend
        viewsThisWeek: weeklyViews.viewsThisWeek,
        viewsLastWeek: weeklyViews.viewsLastWeek,
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
      apiError(res, 500, "Failed to fetch analytics");
    }
  });

  // Toggle AI auto-reply for the authenticated provider's own listing
  app.patch("/api/providers/mine/ai-auto-reply", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = z.object({ enabled: z.boolean() }).safeParse(req.body);
      if (!parsed.success) {
        return apiError(res, 400, "Invalid request", { errors: parsed.error.errors });
      }
      // Canonical ownership: ownerUserId wins for claimed listings; fall back to
      // userId only when the listing was never claimed. This prevents a stale
      // listing creator from toggling AI replies on a listing someone else claimed.
      const providers = await storage.getProvidersByCanonicalOwner(req.user?.claims?.sub);
      if (providers.length === 0) return apiError(res, 404, "No provider profile found");
      const updated = await storage.updateProvider(providers[0].id, {
        aiAutoReplyEnabled: parsed.data.enabled,
      } as any);
      res.json({ aiAutoReplyEnabled: updated.aiAutoReplyEnabled });
    } catch (error) {
      log.error({ err: error }, "Error updating AI auto-reply setting");
      apiError(res, 500, "Failed to update AI auto-reply setting");
    }
  });

  // My provider (authenticated user's own listing)
  // Canonical ownership: a claimed listing belongs to ownerUserId; userId only
  // counts when the listing was never claimed. This lets claimants (ownerUserId
  // set, userId possibly someone else) see and manage their dashboard.
  app.get("/api/providers/mine", isAuthenticated, async (req: any, res) => {
    try {
      const providers = await storage.getProvidersByCanonicalOwner(req.user?.claims?.sub);
      if (providers.length === 0) return apiError(res, 404, "No provider profile found");
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
      apiError(res, 500, "Failed to fetch provider");
    }
  });

  // Single provider by ID — also records a daily profile view
  app.get("/api/providers/:id", async (req, res, next) => {
    try {
      // Keep the specific analytics route reachable even though this dynamic
      // public-detail route is registered earlier in the module.
      if (req.params.id === "analytics") return next();
      const id = strictPathInt(req.params.id);
      if (!id) return apiError(res, 400, "Invalid provider ID");
      const provider = await storage.getProviderWithDetails(id);
      if (!provider || !isPublicProvider(provider)) return apiError(res, 404, "Provider not found");
      // Strip expired closure entries so families never see stale history
      const todayIso = new Date().toISOString().slice(0, 10);
      if (Array.isArray((provider as any).closedDates)) {
        (provider as any).closedDates = ((provider as any).closedDates as any[]).filter(
          (e: any) => typeof e?.to === "string" && e.to >= todayIso
        );
      }
      // Fire-and-forget: track the first view for this visitor today without
      // blocking the response. setupAuth supplies the session in production.
      const viewerKey = getProfileViewViewerKey(req);
      if (viewerKey) storage.trackProfileView(id, viewerKey).catch(() => {});
      res.json(toPublicProviderDetail(provider as any));
    } catch (error) {
      log.error({ err: error }, "Error fetching provider");
      apiError(res, 500, "Failed to fetch provider");
    }
  });

  // Profile view trend — last 30 days of daily view counts for the authenticated provider
  app.get("/api/providers/analytics/views", isAuthenticated, async (req: any, res) => {
    try {
      const userProviders = await storage.getProvidersByCanonicalOwner(req.user?.claims?.sub);
      if (userProviders.length === 0) return apiError(res, 404, "No provider profile found");
      const trend = await storage.getProfileViewTrend(userProviders[0].id, 30);
      res.json(trend);
    } catch (error) {
      log.error({ err: error }, "Error fetching view trend");
      apiError(res, 500, "Failed to fetch view trend");
    }
  });

  // Score comparison — how this provider's optimization score ranks among similar listings
  app.get("/api/providers/analytics/score-comparison", isAuthenticated, async (req: any, res) => {
    try {
      const userProviders = await storage.getProvidersByCanonicalOwner(req.user?.claims?.sub);
      if (userProviders.length === 0) return apiError(res, 404, "No provider profile found");
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
      apiError(res, 500, "Failed to fetch score comparison");
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
          return apiError(res, 400, "Invalid location data", { errors: locResult.error.errors });
        }
        validatedLocations = locResult.data;
      }

      const existingProviders = await storage.getProvidersByCanonicalOwner(userId);

      if (existingProviders.length > 0) {
        // Update path: the canonical owner may update a claimed listing, but the
        // historical userId remains unchanged after a claim transfer.
        const providerId = existingProviders[0].id;
        const parsed = providerClientUpdateSchema.partial().parse(providerData);
        // Lazy cleanup: drop any closure entries whose end date has already passed
        if (Array.isArray(parsed.closedDates)) {
          const todayIso = new Date().toISOString().slice(0, 10);
          parsed.closedDates = parsed.closedDates.filter((e) => e.to >= todayIso);
          if (parsed.closedDates.length === 0) parsed.closedDates = null;
        }
        const updatedProvider = await storage.updateProvider(providerId, parsed);
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
        const bodyForCreate: any = { ...providerData };
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
      if (error instanceof z.ZodError) return apiError(res, 400, "Invalid provider data", { errors: error.errors });
      if (postgresErrorCode(error) === "23514") return apiError(res, 400, "Invalid provider data");
      apiError(res, 500, "Failed to create/update provider");
    }
  });

  // Full update (PUT) — providerClientUpdateSchema strips server-controlled fields before write
  app.put("/api/providers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = strictPathInt(req.params.id);
      if (!id) return apiError(res, 400, "Invalid provider ID");
      const userId = req.user?.claims?.sub;
      const existing = await storage.getProvider(id);
      if (!existing || !isCanonicalProviderOwner(existing, userId)) return apiError(res, 403, "Access denied");
      const parsed = providerClientUpdateSchema.partial().parse(req.body);
      // Lazy cleanup: drop any closure entries whose end date has already passed
      if (Array.isArray(parsed.closedDates)) {
        const todayIso = new Date().toISOString().slice(0, 10);
        parsed.closedDates = parsed.closedDates.filter((e) => e.to >= todayIso);
        if (parsed.closedDates.length === 0) parsed.closedDates = null;
      }
      res.json(await storage.updateProvider(id, parsed));
    } catch (error) {
      log.error({ err: error }, "Error updating provider");
      if (error instanceof z.ZodError) return apiError(res, 400, "Invalid provider data", { errors: error.errors });
      if (postgresErrorCode(error) === "23514") return apiError(res, 400, "Invalid provider data");
      apiError(res, 500, "Failed to update provider");
    }
  });

  // Partial update (PATCH) — providerClientUpdateSchema strips server-controlled fields before write
  app.patch("/api/providers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = strictPathInt(req.params.id);
      if (!id) return apiError(res, 400, "Invalid provider ID");
      const userId = req.user?.claims?.sub;
      const existing = await storage.getProvider(id);
      if (!existing || !isCanonicalProviderOwner(existing, userId)) return apiError(res, 403, "Access denied");
      const parsed = providerClientUpdateSchema.partial().parse(req.body);
      // Cross-field price validation: distinguish field presence (undefined = absent) from
      // explicit null (= clearing). Reject when exactly one bound is supplied (whether null or
      // numeric). When both are supplied, accept only both-null (clear) or both-numeric with
      // max >= min.
      const sentMin = parsed.monthlyPriceMin !== undefined;
      const sentMax = parsed.monthlyPriceMax !== undefined;
      if (sentMin !== sentMax) {
        return apiError(res, 400, "Invalid provider data", {
          errors: [{ message: "monthlyPriceMin and monthlyPriceMax must both be provided together" }],
        });
      }
      if (sentMin && sentMax) {
        const minIsNull = parsed.monthlyPriceMin === null;
        const maxIsNull = parsed.monthlyPriceMax === null;
        if (minIsNull !== maxIsNull) {
          return apiError(res, 400, "Invalid provider data", {
            errors: [{ message: "monthlyPriceMin and monthlyPriceMax must both be provided together" }],
          });
        }
        if (!minIsNull && !maxIsNull && Number(parsed.monthlyPriceMax) < Number(parsed.monthlyPriceMin)) {
          return apiError(res, 400, "Invalid provider data", {
            errors: [{ message: "monthlyPriceMax must be greater than or equal to monthlyPriceMin" }],
          });
        }
      }
      // Lazy cleanup: drop any closure entries whose end date has already passed
      if (Array.isArray(parsed.closedDates)) {
        const todayIso = new Date().toISOString().slice(0, 10);
        parsed.closedDates = parsed.closedDates.filter((e) => e.to >= todayIso);
        if (parsed.closedDates.length === 0) parsed.closedDates = null;
      }
      res.json(await storage.updateProvider(id, parsed));
    } catch (error) {
      log.error({ err: error }, "Error updating provider");
      if (error instanceof z.ZodError) return apiError(res, 400, "Invalid provider data", { errors: error.errors });
      if (postgresErrorCode(error) === "23514") return apiError(res, 400, "Invalid provider data");
      apiError(res, 500, "Failed to update provider");
    }
  });

  // Providers by user ID
  app.get("/api/providers/user/:userId", isAuthenticated, async (req: any, res) => {
    try {
      if (req.params.userId !== req.user?.claims?.sub) return apiError(res, 403, "Access denied");
      res.json(await storage.getProvidersByCanonicalOwner(req.params.userId));
    } catch (error) {
      log.error({ err: error }, "Error fetching user providers");
      apiError(res, 500, "Failed to fetch providers");
    }
  });

  // Submit license for admin review
  app.post("/api/providers/confirm-license", isAuthenticated, async (req: any, res) => {
    try {
      const userProviders = await storage.getProvidersByCanonicalOwner(req.user?.claims?.sub);
      if (!userProviders?.length) return apiError(res, 404, "Provider not found");
      const existing = userProviders[0];

      // If already confirmed, no-op so existing confirmed providers are unaffected
      if (existing.licenseStatus === "confirmed") {
        return res.json({ message: "License already confirmed", provider: existing, isPending: false });
      }

      const updated = await storage.updateProvider(existing.id, {
        licenseStatus: "pending",
        licenseSubmittedAt: new Date(),
        isProfileVisible: false,
      });
      res.json({ message: "License submitted for review. An admin will verify your submission shortly.", provider: updated, isPending: true });
    } catch (error) {
      log.error({ err: error }, "Error submitting license for review");
      apiError(res, 500, "Failed to submit license for review");
    }
  });

  // Provider images
  app.get("/api/providers/:id/images", async (req: any, res) => {
    try {
      const id = strictPathInt(req.params.id);
      if (!id) return apiError(res, 400, "Invalid provider ID");
      const provider = await storage.getProvider(id);
      if (!provider || !isPublicProvider(provider)) return apiError(res, 404, "Provider not found");
      res.json((await storage.getProviderImages(id)).map((image) => toPublicProviderImage(image, id)));
    } catch (error) {
      log.error({ err: error }, "Error fetching provider images");
      apiError(res, 500, "Failed to fetch images");
    }
  });

  app.post("/api/providers/:id/images", isAuthenticated, async (req: any, res) => {
    let uploadedObjectPath: string | null = null;
    let canCleanUploadedObject = false;
    try {
      const providerId = strictPathInt(req.params.id);
      if (!providerId) return apiError(res, 400, "Invalid provider ID");
      const provider = await storage.getProvider(providerId);
      if (!provider || !isCanonicalProviderOwner(provider, req.user?.claims?.sub)) return apiError(res, 403, "Access denied");
      const parsed = providerImageCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return apiError(res, 400, "Invalid image data", { errors: parsed.error.errors });
      }

      const userId = req.user?.claims?.sub;
      let imageUrl = parsed.data.imageUrl;
      if (parsed.data.objectPath) {
        assertProviderImageObjectPath(parsed.data.objectPath);
        if (!userId || !verifyProviderImageUploadToken(parsed.data.uploadToken, userId, parsed.data.objectPath, providerId)) {
          return apiError(res, 400, "Invalid upload reference");
        }

        uploadedObjectPath = parsed.data.objectPath;
        canCleanUploadedObject = true;
        const { ObjectStorageService } = await import("../objectStorage");
        const service = new ObjectStorageService();
        await service.validateProviderImageObject(uploadedObjectPath);
        uploadedObjectPath = await service.promoteProviderImageObject(uploadedObjectPath);
        await service.trySetObjectEntityAclPolicy(uploadedObjectPath, {
          owner: userId,
          visibility: isPublicProvider(provider) ? "public" : "private",
        });
        imageUrl = uploadedObjectPath;
      }

      const image = await storage.addProviderImage(
        insertProviderImageSchema.parse({
          providerId,
          imageUrl,
          caption: parsed.data.caption ?? null,
          isPrimary: parsed.data.isPrimary ?? false,
        }),
      );
      canCleanUploadedObject = false;
      // Return the storage path to the authenticated editor. Public endpoints
      // deliberately translate private object paths to a visibility-checked URL.
      res.status(201).json(image);
    } catch (error) {
      if (canCleanUploadedObject && uploadedObjectPath) {
        await cleanUpFailedProviderImageObject(uploadedObjectPath);
      }
      if (error instanceof z.ZodError || error instanceof ProviderImageValidationError) {
        return apiError(res, 400, "Invalid image data");
      }
      log.error({ err: error }, "Error adding provider image");
      apiError(res, 500, "Failed to add image");
    }
  });

  app.get("/api/providers/:id/images/manage", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.id);
      if (!providerId) return apiError(res, 400, "Invalid provider ID");
      const provider = await storage.getProvider(providerId);
      if (!provider || !isCanonicalProviderOwner(provider, req.user?.claims?.sub)) return apiError(res, 403, "Access denied");
      res.json(await storage.getProviderImages(providerId));
    } catch (error) {
      log.error({ err: error }, "Error fetching provider images for editing");
      apiError(res, 500, "Failed to fetch images");
    }
  });

  app.get("/api/providers/:id/images/:imageId/content", async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.id);
      const imageId = strictPathInt(req.params.imageId);
      if (!providerId || !imageId) return apiError(res, 400, "Invalid image ID");
      const provider = await storage.getProvider(providerId);
      if (!provider || !isPublicProvider(provider)) return apiError(res, 404, "Image not found");
      const image = await storage.getProviderImage(imageId);
      if (!image || image.providerId !== providerId) return apiError(res, 404, "Image not found");

      if (!isStoredProviderImagePath(image.imageUrl)) {
        return res.redirect(image.imageUrl);
      }
      const { ObjectStorageService } = await import("../objectStorage");
      const service = new ObjectStorageService();
      service.downloadObject(await service.getObjectEntityFile(image.imageUrl), res);
    } catch (error) {
      log.error({ err: error }, "Error serving provider image");
      apiError(res, 500, "Failed to load image");
    }
  });

  app.patch("/api/providers/:id/images/:imageId", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.id);
      const imageId = strictPathInt(req.params.imageId);
      if (!providerId || !imageId) return apiError(res, 400, "Invalid image ID");
      const provider = await storage.getProvider(providerId);
      if (!provider || !isCanonicalProviderOwner(provider, req.user?.claims?.sub)) return apiError(res, 403, "Access denied");
      const existingImage = await storage.getProviderImage(imageId);
      if (!existingImage || existingImage.providerId !== providerId) return apiError(res, 404, "Image not found");
      const parsed = providerImageUpdateSchema.safeParse(req.body);
      if (!parsed.success) return apiError(res, 400, "Invalid image data", { errors: parsed.error.errors });

      let updatedImage = existingImage;
      if (parsed.data.caption !== undefined) {
        updatedImage = await storage.updateProviderImage(imageId, { caption: parsed.data.caption });
      }
      if (parsed.data.isPrimary === true) {
        updatedImage = (await storage.setProviderImagePrimary(providerId, imageId)) ?? updatedImage;
      }
      res.json(updatedImage);
    } catch (error) {
      log.error({ err: error }, "Error updating provider image");
      apiError(res, 500, "Failed to update image");
    }
  });

  app.delete("/api/providers/:id/images/:imageId", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.id);
      const imageId = strictPathInt(req.params.imageId);
      if (!providerId || !imageId) return apiError(res, 400, "Invalid image ID");
      const provider = await storage.getProvider(providerId);
      if (!provider || !isCanonicalProviderOwner(provider, req.user?.claims?.sub)) return apiError(res, 403, "Access denied");
      const image = await storage.getProviderImage(imageId);
      if (!image || image.providerId !== providerId) return apiError(res, 404, "Image not found");

      await storage.deleteProviderImageWithCleanup(imageId);
      let cleanupPending = false;
      if (isStoredProviderImagePath(image.imageUrl)) {
        try {
          const { ObjectStorageService } = await import("../objectStorage");
          await new ObjectStorageService().deleteObjectEntity(image.imageUrl);
        } catch (cleanupError) {
          cleanupPending = true;
          log.warn({ err: cleanupError, imageId }, "Provider image record deleted but storage cleanup failed");
        }
      }
      res.json({ ok: true, cleanupPending });
    } catch (error) {
      log.error({ err: error }, "Error deleting provider image");
      apiError(res, 500, "Failed to delete image");
    }
  });

  // Optimization score
  app.get("/api/providers/:id/score", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.id);
      if (!providerId) return apiError(res, 400, "Invalid provider ID");
      const provider = await storage.getProvider(providerId);
      if (!provider) return apiError(res, 404, "Provider not found");
      if (!isCanonicalProviderOwner(provider, req.user?.claims?.sub) && req.user?.claims?.role !== "admin") return apiError(res, 403, "Access denied");
      const existingScore = await storage.getProviderScore?.(providerId);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (existingScore?.lastCalculatedAt && new Date(existingScore.lastCalculatedAt) > oneHourAgo) {
        const { ProviderScoringService: PSS } = await import("../services/providerScoring");
        const { rankInCategory, categoryAverage, poolSize } =
          await PSS.calculateCategoryRank(providerId, provider.type, provider.city ?? null);
        return res.json({
          overallScore: existingScore.overallScore, completenessScore: existingScore.completenessScore,
          engagementScore: existingScore.engagementScore, verificationScore: existingScore.verificationScore,
          freshnessScore: existingScore.freshnessScore, breakdown: existingScore.scoreBreakdown,
          badges: existingScore.badges, improvementSuggestions: existingScore.improvementSuggestions,
          rankInCategory, categoryAverage, poolSize, providerType: provider.type, city: provider.city,
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

      // Compute category rank now that the score is persisted
      const { rankInCategory, categoryAverage, poolSize } =
        await ProviderScoringService.calculateCategoryRank(providerId, provider.type, provider.city ?? null);

      res.json({ ...score, rankInCategory, categoryAverage, poolSize, providerType: provider.type, city: provider.city });
    } catch (error) {
      log.error({ err: error }, "Error calculating provider score");
      apiError(res, 500, "Failed to calculate score");
    }
  });

  app.post("/api/providers/:id/score/calculate", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.id);
      if (!providerId) return apiError(res, 400, "Invalid provider ID");
      const provider = await storage.getProvider(providerId);
      if (!provider) return apiError(res, 404, "Provider not found");
      if (!isCanonicalProviderOwner(provider, req.user?.claims?.sub) && req.user?.claims?.role !== "admin") return apiError(res, 403, "Access denied");
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
      apiError(res, 500, "Failed to recalculate score");
    }
  });

  // Suggest an edit
  app.post("/api/providers/:id/suggest-update", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.id);
      if (!providerId) return apiError(res, 400, "Invalid provider ID");
      const provider = await storage.getProvider(providerId);
      if (!provider || !isPublicProvider(provider)) return apiError(res, 404, "Provider not found");
      const updateData = insertProviderUpdateSchema.parse({
        ...req.body, userId: req.user?.claims?.sub, providerId,
      });
      res.status(201).json(await storage.createProviderUpdate(updateData));
    } catch (error) {
      if (error instanceof z.ZodError) return apiError(res, 400, "Invalid update data", { errors: error.errors });
      log.error({ err: error }, "Error creating provider update");
      apiError(res, 500, "Failed to create update");
    }
  });

  app.get("/api/providers/:id/updates", async (req, res) => {
    try {
      const id = strictPathInt(req.params.id);
      if (!id) return apiError(res, 400, "Invalid provider ID");
      const provider = await storage.getProvider(id);
      if (!provider || !isPublicProvider(provider)) return apiError(res, 404, "Provider not found");
      const updates = await storage.getProviderUpdates(id);
      res.json(
        updates
          .filter((update) => update.status === "approved")
          .map(toPublicProviderUpdate),
      );
    } catch (error) {
      log.error({ err: error }, "Error fetching provider updates");
      apiError(res, 500, "Failed to fetch updates");
    }
  });

  // User-contributed photos
  app.post("/api/providers/:id/contribute-photo", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = strictPathInt(req.params.id);
      if (!providerId) return apiError(res, 400, "Invalid provider ID");
      const provider = await storage.getProvider(providerId);
      if (!provider || !isPublicProvider(provider)) return apiError(res, 404, "Provider not found");
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
      if (error instanceof z.ZodError) return apiError(res, 400, "Invalid photo data", { errors: error.errors });
      log.error({ err: error }, "Error creating provider photo");
      apiError(res, 500, "Failed to add photo");
    }
  });

  app.get("/api/providers/:id/user-photos", async (req, res) => {
    try {
      const id = strictPathInt(req.params.id);
      if (!id) return apiError(res, 400, "Invalid provider ID");
      const provider = await storage.getProvider(id);
      if (!provider || !isPublicProvider(provider)) return apiError(res, 404, "Provider not found");
      const photos = await storage.getProviderPhotos(id);
      res.json(photos.filter((photo) => photo.status === "approved").map(toPublicProviderPhoto));
    } catch (error) {
      log.error({ err: error }, "Error fetching provider photos");
      apiError(res, 500, "Failed to fetch photos");
    }
  });
}
