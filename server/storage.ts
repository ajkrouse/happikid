import { createLogger } from "./logger";

const log = createLogger("storage");

import {
  users,
  providers,
  reviews,
  inquiries,
  favorites,
  providerImages,
  providerLocations,
  providerPrograms,
  providerAmenities,
  familyProfiles,
  threads,
  threadMessages,
  tourRequests,
  type User,
  type UpsertUser,
  type Provider,
  type InsertProvider,
  type Review,
  type InsertReview,
  type Inquiry,
  type InsertInquiry,
  type Favorite,
  type ProviderImage,
  type InsertProviderImage,
  type ProviderLocation,
  type InsertProviderLocation,
  type ProviderProgram,
  type InsertProviderProgram,
  type ProviderAmenity,
  type InsertProviderAmenity,
  providerUpdates,
  providerPhotos,
  reviewVotes,
  claims,
  auditLogs,
  providerProfileViews,
  type ProviderUpdate,
  type InsertProviderUpdate,
  type ProviderPhoto,
  type InsertProviderPhoto,
  type ReviewVote,
  type InsertReviewVote,
  type ProviderScore,
  type InsertProviderScore,
  type ProviderWithScore,
  type FamilyProfile,
  type InsertFamilyProfile,
  type Claim,
  type InsertClaim,
  type AuditLog,
  type InsertAuditLog,
  type ProviderProfileView,
  type Thread,
  type ThreadMessage,
  type TourRequest,
  type InsertTourRequest,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, like, inArray, getTableColumns } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for authentication)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  linkGoogleId(userId: string, googleId: string): Promise<User>;
  upsertGoogleUser(data: { id: string; googleId: string; email: string | null; firstName: string | null; lastName: string | null; profileImageUrl: string | null }): Promise<User>;
  updateGoogleUserProfile(userId: string, data: { email: string | null; firstName: string | null; lastName: string | null; profileImageUrl: string | null }): Promise<User>;
  
  // Provider operations
  getProviders(filters?: {
    type?: string;
    borough?: string;
    ageRangeMin?: number;
    ageRangeMax?: number;
    features?: string[];
    search?: string;
    category?: string;
    subcategory?: string;
    limit?: number;
    offset?: number;
    includeUnconfirmed?: boolean;
    returnTotal?: boolean;
    acceptsSubsidies?: boolean;
    verifiedPricing?: boolean;
    enrollmentStatus?: string;
  }): Promise<ProviderWithScore[] | { providers: ProviderWithScore[]; total: number; verifiedPricingCount: number }>;
  getProvider(id: number): Promise<Provider | undefined>;
  getProviderWithDetails(id: number): Promise<Provider & { images: ProviderImage[]; reviews: Review[] } | undefined>;
  createProvider(provider: InsertProvider): Promise<Provider>;
  updateProvider(id: number, provider: Partial<InsertProvider>): Promise<Provider>;
  getProvidersByUserId(userId: string): Promise<Provider[]>;
  
  // Review operations
  getReviewsByProviderId(providerId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Favorites operations
  getFavoritesByUserId(userId: string): Promise<(Favorite & { provider: Provider })[]>;
  addFavorite(userId: string, providerId: number): Promise<Favorite>;
  removeFavorite(userId: string, providerId: number): Promise<void>;
  isFavorite(userId: string, providerId: number): Promise<boolean>;
  
  // Inquiry operations
  getInquiry(id: number): Promise<Inquiry | undefined>;
  getInquiriesByProviderId(providerId: number): Promise<Inquiry[]>;
  getInquiriesByUserId(userId: string): Promise<Inquiry[]>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiryStatus(id: number, status: "pending" | "responded" | "closed"): Promise<Inquiry>;
  
  // Provider images
  getProviderImages(providerId: number): Promise<ProviderImage[]>;
  addProviderImage(image: InsertProviderImage): Promise<ProviderImage>;
  
  // Provider locations
  getProviderLocations(providerId: number): Promise<ProviderLocation[]>;
  addProviderLocation(location: InsertProviderLocation): Promise<ProviderLocation>;
  updateProviderLocation(id: number, location: Partial<InsertProviderLocation>): Promise<ProviderLocation>;
  deleteProviderLocation(id: number): Promise<void>;
  
  // Provider programs
  getProviderPrograms(providerId: number): Promise<ProviderProgram[]>;
  addProviderProgram(program: InsertProviderProgram): Promise<ProviderProgram>;
  updateProviderProgram(id: number, program: Partial<InsertProviderProgram>): Promise<ProviderProgram>;
  deleteProviderProgram(id: number): Promise<void>;
  
  // Provider amenities
  getProviderAmenities(providerId: number): Promise<ProviderAmenity[]>;
  addProviderAmenity(amenity: InsertProviderAmenity): Promise<ProviderAmenity>;
  deleteProviderAmenity(id: number): Promise<void>;
  
  // User contribution operations
  createProviderUpdate(update: InsertProviderUpdate): Promise<ProviderUpdate>;
  getProviderUpdates(providerId: number): Promise<ProviderUpdate[]>;
  updateProviderUpdateStatus(updateId: number, status: "pending" | "approved" | "rejected", moderatorId?: string, notes?: string): Promise<ProviderUpdate>;
  
  createProviderPhoto(photo: InsertProviderPhoto): Promise<ProviderPhoto>;
  getProviderPhotos(providerId: number): Promise<ProviderPhoto[]>;
  updateProviderPhotoStatus(photoId: number, status: "pending" | "approved" | "rejected", moderatorId?: string, notes?: string): Promise<ProviderPhoto>;
  
  createReviewVote(vote: InsertReviewVote): Promise<ReviewVote>;
  getReviewVotes(reviewId: number): Promise<ReviewVote[]>;
  getUserReviewVote(userId: string, reviewId: number): Promise<ReviewVote | undefined>;
  
  // Get provider statistics
  getProviderStats(): Promise<{ count: number; breakdown: Record<string, number> }>;
  getFeaturedProviders(limit?: number): Promise<Provider[]>;
  
  // Claims operations
  createClaim(claim: InsertClaim): Promise<Claim>;
  getClaim(id: string): Promise<Claim | undefined>;
  getClaimsByUserId(userId: string): Promise<Claim[]>;
  getAllClaims(filters?: { status?: string }): Promise<Claim[]>;
  updateClaimStatus(id: string, status: string, rejectionReason?: string): Promise<Claim>;
  approveClaim(id: string, actorUserId: string): Promise<{ claim: Claim; provider: Provider }>;
  rejectClaim(id: string, rejectionReason: string, actorUserId: string): Promise<Claim>;
  
  // Provider claim operations
  updateProviderClaimStatus(providerId: number, status: string, ownerUserId?: string): Promise<Provider>;
  searchProviders(query: string, city?: string, state?: string): Promise<Provider[]>;
  
  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogsByTargetId(targetId: string, targetType: string): Promise<AuditLog[]>;
  
  // After-school programs taxonomy
  getAfterSchoolTaxonomy(): Promise<Array<{
    id: number;
    name: string;
    slug: string;
    subcategories: Array<{
      id: number;
      name: string;
      slug: string;
      keywords: string[];
      example_providers: unknown[];
    }>;
  }>>;
  
  // Provider optimization scores
  getProviderScore(providerId: number): Promise<ProviderScore | undefined>;
  createProviderScore(score: InsertProviderScore): Promise<ProviderScore>;
  updateProviderScore(providerId: number, score: Partial<InsertProviderScore>): Promise<ProviderScore>;
  getProviderInquiries(providerId: number): Promise<Inquiry[]>;

  // Bulk closure cleanup
  pruneExpiredClosures(): Promise<number>;

  // Thread (in-platform messaging) operations
  getOrCreateThread(parentUserId: string, providerId: number): Promise<Thread>;
  getThread(id: number): Promise<Thread | undefined>;
  getThreadsForUser(userId: string): Promise<any[]>;
  getThreadsByProviderId(providerId: number, ownerUserId?: string): Promise<any[]>;
  getProvidersByCanonicalOwner(userId: string): Promise<Provider[]>;
  updateThreadStatus(id: number, status: "open" | "enrolled" | "not_a_fit"): Promise<Thread>;
  createThreadMessage(threadId: number, senderUserId: string, body: string): Promise<ThreadMessage>;
  getThreadMessages(threadId: number): Promise<ThreadMessage[]>;
  markThreadMessagesRead(threadId: number, userId: string): Promise<void>;

  // Admin license verification queue
  getPendingLicenseVerifications(): Promise<(Provider & { ownerEmail: string | null; ownerFirstName: string | null; ownerLastName: string | null })[]>;

  // Tour request operations
  createTourRequest(tourRequest: InsertTourRequest): Promise<TourRequest>;
  getTourRequest(id: number): Promise<TourRequest | undefined>;
  getTourRequestsByParentId(parentUserId: string): Promise<(TourRequest & { providerName: string; providerAddress: string })[]>;
  getTourRequestsByProviderId(providerId: number): Promise<(TourRequest & { parentFirstName: string | null; parentLastName: string | null; parentEmail: string | null })[]>;
  updateTourRequestStatus(id: number, status: "pending" | "scheduled" | "cancelled"): Promise<TourRequest>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          // Intentionally exclude `role` so an existing provider's role is never
          // silently reset to "parent" on subsequent logins.
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Google-specific user operations
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async linkGoogleId(userId: string, googleId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ googleId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateGoogleUserProfile(
    userId: string,
    data: {
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
    }
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        profileImageUrl: data.profileImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async upsertGoogleUser(data: {
    id: string;
    googleId: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...data, role: "parent" })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          googleId: data.googleId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          profileImageUrl: data.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: role as "provider" | "parent" | "admin", updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Provider operations
  async getProviders(filters?: {
    type?: string;
    borough?: string;
    city?: string;
    ageRangeMin?: number;
    ageRangeMax?: number;
    features?: string[];
    search?: string;
    category?: string;
    subcategory?: string;
    limit?: number;
    offset?: number;
    includeUnconfirmed?: boolean;
    returnTotal?: boolean;
    acceptsSubsidies?: boolean;
    verifiedPricing?: boolean;
    enrollmentStatus?: string;
  }): Promise<ProviderWithScore[] | { providers: ProviderWithScore[]; total: number; verifiedPricingCount: number }> {
    try {
      let conditions: any[] = [eq(providers.isActive, true)];

      // By default, only show confirmed providers to the public
      if (!filters?.includeUnconfirmed) {
        conditions.push(eq(providers.licenseStatus, "confirmed"));
      }

      if (filters?.type) {
        conditions.push(eq(providers.type, filters.type as any));
      }

      if (filters?.borough) {
        conditions.push(eq(providers.borough, filters.borough));
      }

      if (filters?.city) {
        conditions.push(eq(providers.city, filters.city));
      }

      if (filters?.search) {
        // Enhanced search that includes features and address
        conditions.push(
          sql`(
            ${providers.name} ILIKE ${`%${filters.search}%`} OR 
            ${providers.description} ILIKE ${`%${filters.search}%`} OR
            array_to_string(${providers.features}, ' ') ILIKE ${`%${filters.search}%`} OR
            ${providers.address} ILIKE ${`%${filters.search}%`} OR
            ${providers.city} ILIKE ${`%${filters.search}%`}
          )`
        );
      }

      // Handle category/subcategory filtering using taxonomy keywords
      if (filters?.category && filters?.subcategory) {
        try {
          const taxonomy = await this.getAfterSchoolTaxonomy();
          const category = taxonomy.find((c: any) => c.slug === filters.category);
          if (category) {
            const subcategory = category.subcategories.find((s: any) => s.slug === filters.subcategory);
            if (subcategory && subcategory.keywords && subcategory.keywords.length > 0) {
              // Build OR'ed ILIKE clauses for each keyword
              const keywordConditions = subcategory.keywords.map((keyword: string) =>
                sql`(
                  ${providers.name} ILIKE ${`%${keyword}%`} OR 
                  ${providers.description} ILIKE ${`%${keyword}%`} OR
                  array_to_string(${providers.features}, ' ') ILIKE ${`%${keyword}%`}
                )`
              );
              conditions.push(or(...keywordConditions));
            }
          }
        } catch (error) {
          log.error({ err: error }, "Error fetching taxonomy for filtering");
          // Continue without taxonomy filtering
        }
      }

      if (filters?.ageRangeMin !== undefined) {
        conditions.push(sql`${providers.ageRangeMax} >= ${filters.ageRangeMin}`);
      }

      if (filters?.ageRangeMax !== undefined) {
        conditions.push(sql`${providers.ageRangeMin} <= ${filters.ageRangeMax}`);
      }

      if (filters?.features && filters.features.length > 0) {
        // Check if any of the requested features exist in the provider's features array
        // Convert array to text and use LIKE for simple containment check
        const featureConditions = filters.features.map(feature => 
          sql`array_to_string(${providers.features}, ',') ILIKE ${`%${feature}%`}`
        );
        conditions.push(or(...featureConditions));
      }

      // Filter by subsidy acceptance
      if (filters?.acceptsSubsidies) {
        conditions.push(eq(providers.acceptsSubsidies, true));
      }

      // Filter by enrollment status
      if (filters?.enrollmentStatus) {
        conditions.push(eq(providers.enrollmentStatus, filters.enrollmentStatus as any));
      }

      // Verified pricing SQL expression — matches the hasPricingData() rule in client/src/lib/providerPricing.ts:
      // a provider has verified pricing when it has an explicit price range OR a positive fixed monthly price.
      const verifiedPricingSql = sql`(
        (${providers.monthlyPriceMin} IS NOT NULL AND ${providers.monthlyPriceMax} IS NOT NULL)
        OR
        (${providers.monthlyPrice} IS NOT NULL AND ${providers.monthlyPrice}::numeric > 0)
      )`;

      // Capture base conditions before the verifiedPricing filter so we can count
      // how many providers in the current result set have verified pricing regardless
      // of whether the filter is active.
      const baseConditions = [...conditions];

      if (filters?.verifiedPricing) {
        conditions.push(verifiedPricingSql);
      }

      // Import provider_scores table for ranking
      const { providerScores } = await import("@shared/schema");

      // If returnTotal is requested, get total count + verified-pricing count
      if (filters?.returnTotal) {
        const [countResult, verifiedCountResult] = await Promise.all([
          db.select({ count: sql<number>`count(*)`.as('count') })
            .from(providers)
            .where(and(...conditions)),
          db.select({ count: sql<number>`count(*)`.as('count') })
            .from(providers)
            .where(and(...baseConditions, verifiedPricingSql)),
        ]);

        const total = countResult[0].count;
        const verifiedPricingCount = verifiedCountResult[0].count;

        // Join with provider_scores to incorporate optimization score in ranking
        const query = db
          .select({
            ...getTableColumns(providers),
            optimizationScore: providerScores.overallScore,
            badges: providerScores.badges,
          })
          .from(providers)
          .leftJoin(providerScores, eq(providers.id, providerScores.providerId))
          .where(and(...conditions))
          .orderBy(
            desc(sql`COALESCE(${providerScores.overallScore}, 0)`),
            desc(providers.rating),
            desc(providers.reviewCount)
          )
          .limit(filters?.limit || 20)
          .offset(filters?.offset || 0);

        const providerResults = await query;
        return { providers: providerResults, total, verifiedPricingCount };
      }

      // Normal query without total count - also include optimization score ranking
      const query = db
        .select({
          ...getTableColumns(providers),
          optimizationScore: providerScores.overallScore,
          badges: providerScores.badges,
        })
        .from(providers)
        .leftJoin(providerScores, eq(providers.id, providerScores.providerId))
        .where(and(...conditions))
        .orderBy(
          desc(sql`COALESCE(${providerScores.overallScore}, 0)`),
          desc(providers.rating),
          desc(providers.reviewCount)
        )
        .limit(filters?.limit || 20)
        .offset(filters?.offset || 0);

      return await query;
    } catch (error) {
      log.error({ err: error }, "Error in getProviders");
      // Fallback to simple query without complex filters
      const fallbackResults = await db.select().from(providers).where(eq(providers.isActive, true)).limit(20);
      return (filters?.returnTotal ? { providers: fallbackResults, total: fallbackResults.length } : fallbackResults) as any;
    }
  }

  async getProvider(id: number): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.id, id));
    return provider;
  }

  async getProviderWithDetails(id: number): Promise<Provider & { images: ProviderImage[]; reviews: Review[] } | undefined> {
    const provider = await this.getProvider(id);
    if (!provider) return undefined;

    const images = await this.getProviderImages(id);
    const reviews = await this.getReviewsByProviderId(id);

    return { ...provider, images, reviews };
  }

  async createProvider(provider: InsertProvider): Promise<Provider> {
    const [newProvider] = await db.insert(providers).values(provider as any).returning();
    return newProvider;
  }

  async updateProvider(id: number, provider: Partial<InsertProvider>): Promise<Provider> {
    const [updatedProvider] = await db
      .update(providers)
      .set({ ...(provider as any), updatedAt: new Date() })
      .where(eq(providers.id, id))
      .returning();
    return updatedProvider;
  }

  async getProvidersByUserId(userId: string): Promise<Provider[]> {
    return await db.select().from(providers).where(eq(providers.userId, userId));
  }

  // Review operations
  async getReviewsByProviderId(providerId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.providerId, providerId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();

    // Update provider rating
    const avgRating = await db
      .select({ avg: sql<number>`AVG(${reviews.rating})`, count: sql<number>`COUNT(*)` })
      .from(reviews)
      .where(eq(reviews.providerId, review.providerId));

    if (avgRating[0]) {
      await db
        .update(providers)
        .set({
          rating: avgRating[0].avg.toFixed(2),
          reviewCount: avgRating[0].count,
          updatedAt: new Date(),
        })
        .where(eq(providers.id, review.providerId));
    }

    return newReview;
  }

  // Favorites operations
  async getFavoritesByUserId(userId: string): Promise<(Favorite & { provider: Provider })[]> {
    return await db
      .select()
      .from(favorites)
      .innerJoin(providers, eq(favorites.providerId, providers.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt)) as unknown as (Favorite & { provider: Provider })[];
  }

  async addFavorite(userId: string, providerId: number): Promise<Favorite> {
    const [favorite] = await db
      .insert(favorites)
      .values({ userId, providerId })
      .returning();
    return favorite;
  }

  async removeFavorite(userId: string, providerId: number): Promise<void> {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.providerId, providerId)));
  }

  async isFavorite(userId: string, providerId: number): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.providerId, providerId)));
    return !!favorite;
  }

  // Inquiry operations
  async getInquiry(id: number): Promise<Inquiry | undefined> {
    const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return inquiry;
  }

  async getInquiriesByProviderId(providerId: number): Promise<Inquiry[]> {
    return await db
      .select()
      .from(inquiries)
      .where(eq(inquiries.providerId, providerId))
      .orderBy(desc(inquiries.createdAt));
  }

  async getInquiriesByUserId(userId: string): Promise<Inquiry[]> {
    return await db
      .select()
      .from(inquiries)
      .where(eq(inquiries.userId, userId))
      .orderBy(desc(inquiries.createdAt));
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [newInquiry] = await db.insert(inquiries).values(inquiry).returning();
    return newInquiry;
  }

  async updateInquiryStatus(id: number, status: "pending" | "responded" | "closed"): Promise<Inquiry> {
    const [updatedInquiry] = await db
      .update(inquiries)
      .set({ status, updatedAt: new Date() })
      .where(eq(inquiries.id, id))
      .returning();
    return updatedInquiry;
  }

  async replyToInquiry(id: number, reply: string): Promise<Inquiry> {
    const [updatedInquiry] = await db
      .update(inquiries)
      .set({
        providerReply: reply,
        repliedAt: new Date(),
        status: "responded",
        updatedAt: new Date(),
      })
      .where(eq(inquiries.id, id))
      .returning();
    return updatedInquiry;
  }

  // Profile view tracking — increment daily bucket for a provider
  async trackProfileView(providerId: number): Promise<void> {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    await db
      .insert(providerProfileViews)
      .values({ providerId, viewedDate: today, count: 1 })
      .onConflictDoUpdate({
        target: [providerProfileViews.providerId, providerProfileViews.viewedDate],
        set: { count: sql`${providerProfileViews.count} + 1` },
      });
    // Also bump the scalar counter on the providers table
    await db
      .update(providers)
      .set({ profileViews: sql`COALESCE(${providers.profileViews}, 0) + 1` })
      .where(eq(providers.id, providerId));
  }

  // Return the last `days` days of daily view counts for a provider
  async getProfileViewTrend(providerId: number, days = 30): Promise<{ date: string; views: number }[]> {
    const rows = await db
      .select({ viewedDate: providerProfileViews.viewedDate, count: providerProfileViews.count })
      .from(providerProfileViews)
      .where(
        and(
          eq(providerProfileViews.providerId, providerId),
          sql`${providerProfileViews.viewedDate} >= CURRENT_DATE - INTERVAL '${sql.raw(String(days))} days'`
        )
      )
      .orderBy(providerProfileViews.viewedDate);
    return rows.map((r) => ({ date: r.viewedDate, views: r.count }));
  }

  // Return this week's and last week's total view counts for a provider.
  // "This week"  = today back to 6 days ago  (CURRENT_DATE - 6 days … CURRENT_DATE) — 7 days
  // "Last week"  = 7 days ago back to 13 days ago (CURRENT_DATE - 13 days … CURRENT_DATE - 7 days) — 7 days
  // Both windows are equal-length and non-overlapping; aggregation is done in the DB
  // to avoid JS/local-timezone date-parsing issues.
  async getWeeklyViewSummary(providerId: number): Promise<{ viewsThisWeek: number; viewsLastWeek: number }> {
    const [thisWeekResult, lastWeekResult] = await Promise.all([
      db
        .select({ total: sql<number>`COALESCE(SUM(${providerProfileViews.count}), 0)` })
        .from(providerProfileViews)
        .where(
          and(
            eq(providerProfileViews.providerId, providerId),
            sql`${providerProfileViews.viewedDate} >= CURRENT_DATE - INTERVAL '6 days'`,
            sql`${providerProfileViews.viewedDate} <= CURRENT_DATE`
          )
        ),
      db
        .select({ total: sql<number>`COALESCE(SUM(${providerProfileViews.count}), 0)` })
        .from(providerProfileViews)
        .where(
          and(
            eq(providerProfileViews.providerId, providerId),
            sql`${providerProfileViews.viewedDate} >= CURRENT_DATE - INTERVAL '13 days'`,
            sql`${providerProfileViews.viewedDate} <= CURRENT_DATE - INTERVAL '7 days'`
          )
        ),
    ]);
    return {
      viewsThisWeek: Number(thisWeekResult[0]?.total ?? 0),
      viewsLastWeek: Number(lastWeekResult[0]?.total ?? 0),
    };
  }

  // Provider images
  async getProviderImages(providerId: number): Promise<ProviderImage[]> {
    return await db
      .select()
      .from(providerImages)
      .where(eq(providerImages.providerId, providerId))
      .orderBy(desc(providerImages.isPrimary), asc(providerImages.id));
  }

  async addProviderImage(image: InsertProviderImage): Promise<ProviderImage> {
    const [newImage] = await db.insert(providerImages).values(image).returning();
    return newImage;
  }

  // Provider locations
  async getProviderLocations(providerId: number): Promise<ProviderLocation[]> {
    return await db
      .select()
      .from(providerLocations)
      .where(eq(providerLocations.providerId, providerId))
      .orderBy(desc(providerLocations.isPrimary), asc(providerLocations.id));
  }

  async addProviderLocation(location: InsertProviderLocation): Promise<ProviderLocation> {
    const [newLocation] = await db.insert(providerLocations).values(location).returning();
    return newLocation;
  }

  async updateProviderLocation(id: number, location: Partial<InsertProviderLocation>): Promise<ProviderLocation> {
    const [updatedLocation] = await db
      .update(providerLocations)
      .set({ ...location, updatedAt: new Date() })
      .where(eq(providerLocations.id, id))
      .returning();
    return updatedLocation;
  }

  async deleteProviderLocation(id: number): Promise<void> {
    await db.delete(providerLocations).where(eq(providerLocations.id, id));
  }

  // Provider programs
  async getProviderPrograms(providerId: number): Promise<ProviderProgram[]> {
    return await db
      .select()
      .from(providerPrograms)
      .where(eq(providerPrograms.providerId, providerId))
      .orderBy(asc(providerPrograms.ageRangeMin), asc(providerPrograms.id));
  }

  async addProviderProgram(program: InsertProviderProgram): Promise<ProviderProgram> {
    const [newProgram] = await db.insert(providerPrograms).values(program).returning();
    return newProgram;
  }

  async updateProviderProgram(id: number, program: Partial<InsertProviderProgram>): Promise<ProviderProgram> {
    const [updatedProgram] = await db
      .update(providerPrograms)
      .set({ ...program, updatedAt: new Date() })
      .where(eq(providerPrograms.id, id))
      .returning();
    return updatedProgram;
  }

  async deleteProviderProgram(id: number): Promise<void> {
    await db.delete(providerPrograms).where(eq(providerPrograms.id, id));
  }

  // Provider amenities
  async getProviderAmenities(providerId: number): Promise<ProviderAmenity[]> {
    return await db
      .select()
      .from(providerAmenities)
      .where(eq(providerAmenities.providerId, providerId))
      .orderBy(asc(providerAmenities.category), asc(providerAmenities.name));
  }

  async addProviderAmenity(amenity: InsertProviderAmenity): Promise<ProviderAmenity> {
    const [newAmenity] = await db.insert(providerAmenities).values(amenity).returning();
    return newAmenity;
  }

  async deleteProviderAmenity(id: number): Promise<void> {
    await db.delete(providerAmenities).where(eq(providerAmenities.id, id));
  }

  // User contribution operations
  async createProviderUpdate(update: InsertProviderUpdate): Promise<ProviderUpdate> {
    const [newUpdate] = await db.insert(providerUpdates).values(update).returning();
    return newUpdate;
  }

  async getProviderUpdates(providerId: number): Promise<ProviderUpdate[]> {
    return await db
      .select()
      .from(providerUpdates)
      .where(eq(providerUpdates.providerId, providerId))
      .orderBy(desc(providerUpdates.createdAt));
  }

  async updateProviderUpdateStatus(
    updateId: number, 
    status: "pending" | "approved" | "rejected", 
    moderatorId?: string, 
    notes?: string
  ): Promise<ProviderUpdate> {
    const [updated] = await db
      .update(providerUpdates)
      .set({ 
        status, 
        moderatorId, 
        moderatorNotes: notes,
        updatedAt: new Date() 
      })
      .where(eq(providerUpdates.id, updateId))
      .returning();
    return updated;
  }

  async createProviderPhoto(photo: InsertProviderPhoto): Promise<ProviderPhoto> {
    const [newPhoto] = await db.insert(providerPhotos).values(photo).returning();
    return newPhoto;
  }

  async getProviderPhotos(providerId: number): Promise<ProviderPhoto[]> {
    return await db
      .select()
      .from(providerPhotos)
      .where(eq(providerPhotos.providerId, providerId))
      .orderBy(desc(providerPhotos.createdAt));
  }

  async updateProviderPhotoStatus(
    photoId: number, 
    status: "pending" | "approved" | "rejected", 
    moderatorId?: string, 
    notes?: string
  ): Promise<ProviderPhoto> {
    const [updated] = await db
      .update(providerPhotos)
      .set({ 
        status, 
        moderatorId, 
        moderatorNotes: notes,
        updatedAt: new Date() 
      })
      .where(eq(providerPhotos.id, photoId))
      .returning();
    return updated;
  }

  async createReviewVote(vote: InsertReviewVote): Promise<ReviewVote> {
    const [newVote] = await db
      .insert(reviewVotes)
      .values(vote)
      .onConflictDoUpdate({
        target: [reviewVotes.userId, reviewVotes.reviewId],
        set: { voteType: vote.voteType, createdAt: new Date() }
      })
      .returning();
    return newVote;
  }

  async getReviewVotes(reviewId: number): Promise<ReviewVote[]> {
    return await db
      .select()
      .from(reviewVotes)
      .where(eq(reviewVotes.reviewId, reviewId));
  }

  async getUserReviewVote(userId: string, reviewId: number): Promise<ReviewVote | undefined> {
    const [vote] = await db
      .select()
      .from(reviewVotes)
      .where(and(eq(reviewVotes.userId, userId), eq(reviewVotes.reviewId, reviewId)));
    return vote;
  }

  // Fetch overallScore for providers in the same city+type pool (excludes the requesting provider)
  async getSimilarProviderScores(
    excludeProviderId: number,
    city: string | null,
    type: string | null
  ): Promise<{ overallScore: number | null }[]> {
    const { providerScores } = await import("@shared/schema");
    let query = db
      .select({ overallScore: providerScores.overallScore })
      .from(providerScores)
      .innerJoin(providers, eq(providerScores.providerId, providers.id))
      .where(
        and(
          sql`${providerScores.providerId} != ${excludeProviderId}`,
          city ? eq(providers.city, city) : sql`TRUE`,
          type ? eq(providers.type, type as any) : sql`TRUE`,
        )
      )
      .$dynamic();
    return await query;
  }

  // Provider statistics methods
  async getProviderStats(): Promise<{ count: number; breakdown: Record<string, number> }> {
    const totalCount = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(providers);
    
    const breakdown = await db
      .select({
        type: providers.type,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(providers)
      .groupBy(providers.type);
    
    const breakdownRecord: Record<string, number> = {};
    breakdown.forEach(item => {
      breakdownRecord[item.type] = item.count;
    });
    
    return {
      count: totalCount[0]?.count || 0,
      breakdown: breakdownRecord,
    };
  }

  async getFeaturedProviders(limit: number = 6): Promise<Provider[]> {
    return await db
      .select()
      .from(providers)
      .orderBy(desc(providers.rating), desc(providers.reviewCount))
      .limit(limit);
  }

  // Claims operations
  async createClaim(claim: InsertClaim): Promise<Claim> {
    const [newClaim] = await db.insert(claims).values(claim).returning();
    return newClaim;
  }

  async getClaim(id: string): Promise<Claim | undefined> {
    const [claim] = await db.select().from(claims).where(eq(claims.id, id));
    return claim;
  }

  async getClaimsByUserId(userId: string): Promise<Claim[]> {
    return await db
      .select()
      .from(claims)
      .where(eq(claims.userId, userId))
      .orderBy(desc(claims.createdAt));
  }

  async getAllClaims(filters?: { status?: string }): Promise<Claim[]> {
    let query = db.select().from(claims);
    
    if (filters?.status) {
      (query as any) = query.where(eq(claims.status, filters.status as any));
    }
    
    return await query.orderBy(desc(claims.createdAt));
  }

  async updateClaimStatus(id: string, status: string, rejectionReason?: string): Promise<Claim> {
    const [updated] = await db
      .update(claims)
      .set({ 
        status: status as any,
        rejectionReason,
        updatedAt: new Date()
      })
      .where(eq(claims.id, id))
      .returning();
    return updated;
  }

  async approveClaim(id: string, actorUserId: string): Promise<{ claim: Claim; provider: Provider }> {
    // Get the claim first
    const claim = await this.getClaim(id);
    if (!claim) throw new Error('Claim not found');

    // Update claim status to approved
    const updatedClaim = await this.updateClaimStatus(id, 'approved');

    // Update provider ownership
    const updatedProvider = await this.updateProviderClaimStatus(
      claim.providerId, 
      'claimed',
      claim.userId
    );

    // Create audit log
    await this.createAuditLog({
      actorUserId,
      action: 'approve_claim',
      targetType: 'claim',
      targetId: id,
      meta: { providerId: claim.providerId, userId: claim.userId }
    });

    return { claim: updatedClaim, provider: updatedProvider };
  }

  async rejectClaim(id: string, rejectionReason: string, actorUserId: string): Promise<Claim> {
    const updatedClaim = await this.updateClaimStatus(id, 'rejected', rejectionReason);

    // Create audit log
    await this.createAuditLog({
      actorUserId,
      action: 'reject_claim',
      targetType: 'claim', 
      targetId: id,
      meta: { rejectionReason }
    });

    return updatedClaim;
  }

  // Provider claim operations
  async updateProviderClaimStatus(providerId: number, status: string, ownerUserId?: string): Promise<Provider> {
    const updateData: any = {
      claimStatus: status as any,
      updatedAt: new Date()
    };

    if (ownerUserId) {
      updateData.ownerUserId = ownerUserId;
      updateData.claimedAt = new Date();
    }

    const [updated] = await db
      .update(providers)
      .set(updateData)
      .where(eq(providers.id, providerId))
      .returning();
    return updated;
  }

  async searchProviders(query: string, city?: string, state?: string): Promise<Provider[]> {
    let conditions: any[] = [eq(providers.isActive, true)];

    // Search in provider name, business name, and address
    conditions.push(
      sql`(
        ${providers.name} ILIKE ${`%${query}%`} OR 
        ${providers.address} ILIKE ${`%${query}%`}
      )`
    );

    if (city) {
      conditions.push(eq(providers.city, city));
    }

    if (state) {
      conditions.push(eq(providers.state, state));
    }

    return await db
      .select()
      .from(providers)
      .where(and(...conditions))
      .orderBy(asc(providers.name))
      .limit(50);
  }

  // Audit log operations
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  async getAuditLogsByTargetId(targetId: string, targetType: string): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.targetId, targetId), eq(auditLogs.targetType, targetType)))
      .orderBy(desc(auditLogs.createdAt));
  }

  async getAfterSchoolTaxonomy() {
    const result = await db.execute(sql`
      SELECT 
        c.id,
        c.name,
        c.slug,
        json_agg(
          json_build_object(
            'id', s.id,
            'name', s.name,
            'slug', s.slug,
            'keywords', s.keywords,
            'example_providers', s.example_providers
          ) ORDER BY s.name
        ) as subcategories
      FROM happikid.categories c
      LEFT JOIN happikid.subcategories s ON c.id = s.category_id
      GROUP BY c.id, c.name, c.slug
      ORDER BY c.name
    `);
    
    return result.rows as Array<{
      id: number;
      name: string;
      slug: string;
      subcategories: Array<{
        id: number;
        name: string;
        slug: string;
        keywords: string[];
        example_providers: unknown[];
      }>;
    }>;
  }

  // Provider optimization scores
  async getProviderScore(providerId: number): Promise<ProviderScore | undefined> {
    const { providerScores } = await import("@shared/schema");
    const [score] = await db.select().from(providerScores).where(eq(providerScores.providerId, providerId));
    return score;
  }

  async createProviderScore(scoreData: InsertProviderScore): Promise<ProviderScore> {
    const { providerScores } = await import("@shared/schema");
    const [score] = await db.insert(providerScores).values(scoreData).returning();
    return score;
  }

  async updateProviderScore(providerId: number, scoreData: Partial<InsertProviderScore>): Promise<ProviderScore> {
    const { providerScores } = await import("@shared/schema");
    const [score] = await db
      .update(providerScores)
      .set({ ...scoreData, updatedAt: new Date() })
      .where(eq(providerScores.providerId, providerId))
      .returning();
    return score;
  }

  async getProviderReviews(providerId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.providerId, providerId)).orderBy(desc(reviews.createdAt));
  }

  async getProviderInquiries(providerId: number): Promise<Inquiry[]> {
    return await db.select().from(inquiries).where(eq(inquiries.providerId, providerId)).orderBy(desc(inquiries.createdAt));
  }

  // Bulk cleanup: remove expired closure entries across all providers without waiting for them to re-save.
  // Uses a single UPDATE with a JSONB sub-select so it runs in one round-trip.
  async pruneExpiredClosures(): Promise<number> {
    const todayIso = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Only touch rows that actually have at least one expired entry to avoid unnecessary writes.
    const result = await db.execute(sql`
      UPDATE providers
      SET
        closed_dates = (
          SELECT COALESCE(jsonb_agg(elem ORDER BY elem->>'from'), '[]'::jsonb)
          FROM jsonb_array_elements(closed_dates) AS elem
          WHERE (elem->>'to') >= ${todayIso}
        ),
        updated_at = NOW()
      WHERE
        closed_dates IS NOT NULL
        AND jsonb_array_length(closed_dates) > 0
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(closed_dates) AS elem
          WHERE (elem->>'to') < ${todayIso}
        )
    `);

    // drizzle's execute() returns { rowCount, rows }
    return (result as any).rowCount ?? 0;
  }

  // Family Profile operations
  async getFamilyProfile(userId: string): Promise<FamilyProfile | undefined> {
    const [profile] = await db.select().from(familyProfiles).where(eq(familyProfiles.userId, userId));
    return profile;
  }

  async createFamilyProfile(profile: InsertFamilyProfile): Promise<FamilyProfile> {
    const [created] = await db.insert(familyProfiles).values(profile).returning();
    return created;
  }

  async updateFamilyProfile(userId: string, profile: Partial<InsertFamilyProfile>): Promise<FamilyProfile> {
    const [updated] = await db
      .update(familyProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(familyProfiles.userId, userId))
      .returning();
    return updated;
  }

  async upsertFamilyProfile(profile: InsertFamilyProfile): Promise<FamilyProfile> {
    const existing = await this.getFamilyProfile(profile.userId);
    if (existing) {
      return await this.updateFamilyProfile(profile.userId, profile);
    }
    return await this.createFamilyProfile(profile);
  }

  // ─── Thread (in-platform messaging) operations ──────────────────────────────

  async getOrCreateThread(parentUserId: string, providerId: number): Promise<Thread> {
    // Try to find existing thread first
    const [existing] = await db
      .select()
      .from(threads)
      .where(and(eq(threads.parentUserId, parentUserId), eq(threads.providerId, providerId)));
    if (existing) return existing;
    // Create new thread
    const [thread] = await db
      .insert(threads)
      .values({ parentUserId, providerId, status: "open" })
      .returning();
    return thread;
  }

  async getThread(id: number): Promise<Thread | undefined> {
    const [thread] = await db.select().from(threads).where(eq(threads.id, id));
    return thread;
  }

  /**
   * Get all threads for a user (as parent or provider owner), enriched with:
   * - provider name + id
   * - latest message body + createdAt
   * - unread count (messages not sent by the caller and not yet read)
   */
  async getThreadsForUser(userId: string): Promise<any[]> {
    // Get threads where user is the parent
    const parentThreads = await db
      .select()
      .from(threads)
      .where(eq(threads.parentUserId, userId))
      .orderBy(desc(threads.updatedAt));

    // Get threads where user is the canonical provider owner.
    // Rule: if ownerUserId is set (claimed listing), only the claimant has access.
    //        if ownerUserId is NULL (unclaimed/direct-created), userId is the owner.
    // This prevents stale listing creators from reading threads of claimed listings.
    const ownedProviders = await db
      .select({ id: providers.id })
      .from(providers)
      .where(
        or(
          eq(providers.ownerUserId, userId),
          and(sql`${providers.ownerUserId} IS NULL`, eq(providers.userId, userId))
        )
      );
    const ownedProviderIds = ownedProviders.map((p) => p.id);

    const providerThreads =
      ownedProviderIds.length > 0
        ? await db
            .select()
            .from(threads)
            .where(inArray(threads.providerId, ownedProviderIds))
            .orderBy(desc(threads.updatedAt))
        : [];

    // Merge and deduplicate
    const allThreadIds = new Set<number>();
    const combined: Thread[] = [];
    for (const t of [...parentThreads, ...providerThreads]) {
      if (!allThreadIds.has(t.id)) {
        allThreadIds.add(t.id);
        combined.push(t);
      }
    }

    // Enrich each thread
    const enriched = await Promise.all(
      combined.map(async (thread) => {
        const msgs = await db
          .select()
          .from(threadMessages)
          .where(eq(threadMessages.threadId, thread.id))
          .orderBy(desc(threadMessages.createdAt));

        const provider = await db
          .select({ id: providers.id, name: providers.name })
          .from(providers)
          .where(eq(providers.id, thread.providerId));

        const parentUser = await db
          .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
          .from(users)
          .where(eq(users.id, thread.parentUserId));

        const latest = msgs[0] ?? null;
        const unreadCount = msgs.filter(
          (m) => m.senderUserId !== userId && !m.readAt
        ).length;

        return {
          ...thread,
          provider: provider[0] ?? null,
          parentUser: parentUser[0] ?? null,
          latestMessage: latest
            ? { body: latest.body, createdAt: latest.createdAt, senderUserId: latest.senderUserId }
            : null,
          unreadCount,
          messageCount: msgs.length,
        };
      })
    );

    return enriched.sort(
      (a, b) =>
        (b.latestMessage?.createdAt?.getTime() ?? 0) -
        (a.latestMessage?.createdAt?.getTime() ?? 0)
    );
  }

  /**
   * ownerUserId is the canonical messaging-owner (ownerUserId ?? userId) computed
   * by the caller. When supplied, unread counts are calculated relative to that user.
   */
  async getThreadsByProviderId(providerId: number, ownerUserId?: string): Promise<any[]> {
    const providerThreads = await db
      .select()
      .from(threads)
      .where(eq(threads.providerId, providerId))
      .orderBy(desc(threads.updatedAt));

    // Fetch provider info for enrichment
    const [providerRow] = await db
      .select({ userId: providers.userId, ownerUserId: providers.ownerUserId, name: providers.name })
      .from(providers)
      .where(eq(providers.id, providerId));

    // Use supplied ownerUserId, or derive canonical one from DB row
    const canonicalOwner = ownerUserId ?? providerRow?.ownerUserId ?? providerRow?.userId ?? null;

    const enriched = await Promise.all(
      providerThreads.map(async (thread) => {
        const msgs = await db
          .select()
          .from(threadMessages)
          .where(eq(threadMessages.threadId, thread.id))
          .orderBy(desc(threadMessages.createdAt));

        const parentUser = await db
          .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
          .from(users)
          .where(eq(users.id, thread.parentUserId));

        const latest = msgs[0] ?? null;
        const unreadCount = canonicalOwner
          ? msgs.filter((m) => m.senderUserId !== canonicalOwner && !m.readAt).length
          : 0;

        return {
          ...thread,
          providerName: providerRow?.name ?? null,
          parentUser: parentUser[0] ?? null,
          latestMessage: latest
            ? { body: latest.body, createdAt: latest.createdAt, senderUserId: latest.senderUserId }
            : null,
          unreadCount,
          messageCount: msgs.length,
        };
      })
    );

    return enriched.sort(
      (a, b) =>
        (b.latestMessage?.createdAt?.getTime() ?? 0) -
        (a.latestMessage?.createdAt?.getTime() ?? 0)
    );
  }

  /**
   * Find providers where the caller is the canonical owner.
   * Ownership rule: if ownerUserId is set (claimed listing), only the claimant is the owner.
   *                 if ownerUserId is NULL (unclaimed/direct-created), userId is the owner.
   * This prevents stale listing creators from managing claimed listings.
   */
  async getProvidersByCanonicalOwner(userId: string): Promise<Provider[]> {
    return db
      .select()
      .from(providers)
      .where(
        or(
          eq(providers.ownerUserId, userId),
          and(sql`${providers.ownerUserId} IS NULL`, eq(providers.userId, userId))
        )
      );
  }

  async updateThreadStatus(id: number, status: "open" | "enrolled" | "not_a_fit"): Promise<Thread> {
    const [updated] = await db
      .update(threads)
      .set({ status, updatedAt: new Date() })
      .where(eq(threads.id, id))
      .returning();
    return updated;
  }

  async createThreadMessage(threadId: number, senderUserId: string, body: string): Promise<ThreadMessage> {
    const [msg] = await db
      .insert(threadMessages)
      .values({ threadId, senderUserId, body })
      .returning();
    // Bump thread updatedAt so inbox re-sorts correctly
    await db.update(threads).set({ updatedAt: new Date() }).where(eq(threads.id, threadId));
    return msg;
  }

  async getThreadMessages(threadId: number): Promise<ThreadMessage[]> {
    return db
      .select()
      .from(threadMessages)
      .where(eq(threadMessages.threadId, threadId))
      .orderBy(asc(threadMessages.createdAt));
  }

  async markThreadMessagesRead(threadId: number, userId: string): Promise<void> {
    // Mark all messages in thread that were NOT sent by userId and not yet read
    await db
      .update(threadMessages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(threadMessages.threadId, threadId),
          sql`${threadMessages.senderUserId} != ${userId}`,
          sql`${threadMessages.readAt} IS NULL`
        )
      );
  }

  // Tour request operations
  async createTourRequest(tourRequest: InsertTourRequest): Promise<TourRequest> {
    const [row] = await db.insert(tourRequests).values(tourRequest as any).returning();
    return row;
  }

  async getTourRequest(id: number): Promise<TourRequest | undefined> {
    const [row] = await db.select().from(tourRequests).where(eq(tourRequests.id, id));
    return row;
  }

  async getTourRequestsByParentId(parentUserId: string): Promise<(TourRequest & { providerName: string; providerAddress: string })[]> {
    const rows = await db
      .select({
        ...getTableColumns(tourRequests),
        providerName: providers.name,
        providerAddress: providers.address,
      })
      .from(tourRequests)
      .innerJoin(providers, eq(tourRequests.providerId, providers.id))
      .where(eq(tourRequests.parentUserId, parentUserId))
      .orderBy(desc(tourRequests.createdAt));
    return rows as any;
  }

  async getTourRequestsByProviderId(providerId: number): Promise<(TourRequest & { parentFirstName: string | null; parentLastName: string | null; parentEmail: string | null })[]> {
    const rows = await db
      .select({
        ...getTableColumns(tourRequests),
        parentFirstName: users.firstName,
        parentLastName: users.lastName,
        parentEmail: users.email,
      })
      .from(tourRequests)
      .innerJoin(users, eq(tourRequests.parentUserId, users.id))
      .where(eq(tourRequests.providerId, providerId))
      .orderBy(desc(tourRequests.createdAt));
    return rows as any;
  }

  async updateTourRequestStatus(id: number, status: "pending" | "scheduled" | "cancelled"): Promise<TourRequest> {
    const [row] = await db
      .update(tourRequests)
      .set({ status })
      .where(eq(tourRequests.id, id))
      .returning();
    return row;
  }

  // Admin license verification queue — returns submitted-but-unreviewed providers
  // (pending with a submission date, or previously rejected so admin can re-examine)
  async getPendingLicenseVerifications(): Promise<(Provider & { ownerEmail: string | null; ownerFirstName: string | null; ownerLastName: string | null })[]> {
    const rows = await db
      .select({
        ...getTableColumns(providers),
        ownerEmail: users.email,
        ownerFirstName: users.firstName,
        ownerLastName: users.lastName,
      })
      .from(providers)
      .leftJoin(users, eq(providers.userId, users.id))
      .where(
        and(
          eq(providers.licenseStatus, "pending"),
          sql`${providers.licenseSubmittedAt} IS NOT NULL`
        )
      )
      .orderBy(asc(providers.licenseSubmittedAt));
    return rows as any;
  }
}

export const storage = new DatabaseStorage();
