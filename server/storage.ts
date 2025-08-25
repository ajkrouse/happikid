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
  type ProviderUpdate,
  type InsertProviderUpdate,
  type ProviderPhoto,
  type InsertProviderPhoto,
  type ReviewVote,
  type InsertReviewVote,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, like, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for authentication)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Provider operations
  getProviders(filters?: {
    type?: string;
    borough?: string;
    ageRangeMin?: number;
    ageRangeMax?: number;
    features?: string[];
    search?: string;
    limit?: number;
    offset?: number;
    includeUnconfirmed?: boolean;
    returnTotal?: boolean;
  }): Promise<Provider[] | { providers: Provider[]; total: number }>;
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
          ...userData,
          updatedAt: new Date(),
        },
      })
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
    limit?: number;
    offset?: number;
    includeUnconfirmed?: boolean;
    returnTotal?: boolean;
  }): Promise<Provider[] | { providers: Provider[]; total: number }> {
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

      // If returnTotal is requested, get total count first
      if (filters?.returnTotal) {
        const countQuery = db
          .select({ count: sql<number>`count(*)`.as('count') })
          .from(providers)
          .where(and(...conditions));
        
        const [{ count: total }] = await countQuery;

        const query = db
          .select()
          .from(providers)
          .where(and(...conditions))
          .orderBy(desc(providers.rating), desc(providers.reviewCount))
          .limit(filters?.limit || 20)
          .offset(filters?.offset || 0);

        const providerResults = await query;
        return { providers: providerResults, total };
      }

      // Normal query without total count
      const query = db
        .select()
        .from(providers)
        .where(and(...conditions))
        .orderBy(desc(providers.rating), desc(providers.reviewCount))
        .limit(filters?.limit || 20)
        .offset(filters?.offset || 0);

      return await query;
    } catch (error) {
      console.error("Error in getProviders:", error);
      // Fallback to simple query without complex filters
      const fallbackResults = await db.select().from(providers).where(eq(providers.isActive, true)).limit(20);
      return filters?.returnTotal ? { providers: fallbackResults, total: fallbackResults.length } : fallbackResults;
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
    const [newProvider] = await db.insert(providers).values(provider).returning();
    return newProvider;
  }

  async updateProvider(id: number, provider: Partial<InsertProvider>): Promise<Provider> {
    const [updatedProvider] = await db
      .update(providers)
      .set({ ...provider, updatedAt: new Date() })
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
      .orderBy(desc(favorites.createdAt));
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
      query = query.where(eq(claims.status, filters.status as any));
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
        ${providers.businessName} ILIKE ${`%${query}%`} OR
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
}

export const storage = new DatabaseStorage();
