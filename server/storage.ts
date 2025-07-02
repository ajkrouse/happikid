import {
  users,
  providers,
  reviews,
  inquiries,
  favorites,
  providerImages,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, like, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
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
  }): Promise<Provider[]>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
    ageRangeMin?: number;
    ageRangeMax?: number;
    features?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Provider[]> {
    let conditions: any[] = [eq(providers.isActive, true)];

    if (filters?.type) {
      conditions.push(eq(providers.type, filters.type as any));
    }

    if (filters?.borough) {
      conditions.push(eq(providers.borough, filters.borough));
    }

    if (filters?.search) {
      conditions.push(
        sql`${providers.name} ILIKE ${`%${filters.search}%`} OR ${providers.description} ILIKE ${`%${filters.search}%`}`
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

    let query = db
      .select()
      .from(providers)
      .where(and(...conditions))
      .orderBy(desc(providers.rating), desc(providers.reviewCount));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    return await query;
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
}

export const storage = new DatabaseStorage();
