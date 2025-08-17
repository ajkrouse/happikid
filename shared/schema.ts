import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["parent", "provider"] }).notNull().default("parent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider profiles
export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  borough: varchar("borough").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  zipCode: varchar("zip_code").notNull(),
  phone: varchar("phone"),
  email: varchar("email"),
  website: varchar("website"),
  type: varchar("type", { enum: ["daycare", "afterschool", "camp", "school"] }).notNull(),
  ageRangeMin: integer("age_range_min").notNull(),
  ageRangeMax: integer("age_range_max").notNull(),
  capacity: integer("capacity"),
  monthlyPrice: decimal("monthly_price", { precision: 8, scale: 2 }).notNull(),
  monthlyPriceMin: decimal("monthly_price_min", { precision: 8, scale: 2 }),
  monthlyPriceMax: decimal("monthly_price_max", { precision: 8, scale: 2 }),
  showExactPrice: boolean("show_exact_price").default(true),
  hoursOpen: varchar("hours_open"),
  hoursClose: varchar("hours_close"),
  schedule: jsonb("schedule"), // Flexible schedule for different days
  features: text("features").array(),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  // Onboarding and profile completion
  profileCompleteness: integer("profile_completeness").default(0), // Percentage
  onboardingStep: varchar("onboarding_step").default("basic_info"),
  isProfileVisible: boolean("is_profile_visible").default(false),
  licenseNumber: varchar("license_number"),
  licenseStatus: varchar("license_status", { enum: ["pending", "confirmed", "rejected"] }).default("pending"),
  licenseConfirmedAt: timestamp("license_confirmed_at"),
  accreditationDetails: text("accreditation_details"),
  programHighlights: text("program_highlights").array(),
  uniqueSellingPoints: text("unique_selling_points").array(),
  faqs: jsonb("faqs"), // Array of {question, answer} objects
  // Analytics fields
  profileViews: integer("profile_views").default(0),
  profileClicks: integer("profile_clicks").default(0),
  inquiryCount: integer("inquiry_count").default(0),
  comparisonAdds: integer("comparison_adds").default(0),
  favoriteAdds: integer("favorite_adds").default(0),
  isPremium: boolean("is_premium").default(false),
  premiumExpiresAt: timestamp("premium_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider images
export const providerImages = pgTable("provider_images", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  imageUrl: varchar("image_url").notNull(),
  caption: varchar("caption"),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  title: varchar("title"),
  content: text("content"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Favorites
export const favorites = pgTable("favorites", {
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  providerId: integer("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.providerId] }),
}));

// Inquiries
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentName: varchar("parent_name").notNull(),
  parentEmail: varchar("parent_email").notNull(),
  parentPhone: varchar("parent_phone"),
  childAge: varchar("child_age"),
  message: text("message"),
  inquiryType: varchar("inquiry_type", { enum: ["info", "tour", "enrollment"] }).default("info"),
  status: varchar("status", { enum: ["pending", "responded", "closed"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User-contributed provider information updates (like Yelp's "Suggest an Edit")
export const providerUpdates = pgTable("provider_updates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  providerId: integer("provider_id").references(() => providers.id, { onDelete: "cascade" }).notNull(),
  updateType: varchar("update_type", { enum: ["contact_info", "hours", "pricing", "description", "features"] }).notNull(),
  field: varchar("field").notNull(), // Specific field being updated (e.g., "phone", "website", "hours_open")
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
  reason: text("reason"), // User's explanation for the update
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  moderatorId: varchar("moderator_id").references(() => users.id),
  moderatorNotes: text("moderator_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User-uploaded photos for providers (like Yelp's photo contributions)
export const providerPhotos = pgTable("provider_photos", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  providerId: integer("provider_id").references(() => providers.id, { onDelete: "cascade" }).notNull(),
  imageUrl: varchar("image_url").notNull(),
  caption: text("caption"),
  photoType: varchar("photo_type", { enum: ["exterior", "interior", "playground", "classroom", "activity", "other"] }).default("other"),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  moderatorId: varchar("moderator_id").references(() => users.id),
  moderatorNotes: text("moderator_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Track helpful votes on reviews (like Yelp's "Useful" feature)
export const reviewVotes = pgTable("review_votes", {
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  reviewId: integer("review_id").references(() => reviews.id, { onDelete: "cascade" }).notNull(),
  voteType: varchar("vote_type", { enum: ["helpful", "not_helpful"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.reviewId] }),
}));

// Provider Locations - supports multiple locations per provider
export const providerLocations = pgTable("provider_locations", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  name: varchar("name"), // Location name like "Main Campus", "East Side Branch"
  address: text("address").notNull(),
  borough: varchar("borough").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  zipCode: varchar("zip_code").notNull(),
  phone: varchar("phone"),
  capacity: integer("capacity"),
  hoursOpen: varchar("hours_open"),
  hoursClose: varchar("hours_close"),
  isPrimary: boolean("is_primary").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider Programs - supports different pricing for different programs
export const providerPrograms = pgTable("provider_programs", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // e.g. "Toddler Program", "After School Care"
  description: text("description"),
  ageRangeMin: integer("age_range_min").notNull(),
  ageRangeMax: integer("age_range_max").notNull(),
  priceType: varchar("price_type", { enum: ["hourly", "daily", "weekly", "monthly", "yearly"] }).notNull(),
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  showExactPrice: boolean("show_exact_price").default(true),
  capacity: integer("capacity"),
  schedule: jsonb("schedule"), // Flexible schedule object
  features: text("features").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dynamic Amenities/Features by Provider Type
export const providerAmenities = pgTable("provider_amenities", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // The amenity name
  category: varchar("category"), // e.g. "Safety", "Learning", "Convenience"
  isStructured: boolean("is_structured").default(false), // Whether it's a predefined amenity
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  providers: many(providers),
  reviews: many(reviews),
  favorites: many(favorites),
  inquiries: many(inquiries),
  providerUpdates: many(providerUpdates),
  providerPhotos: many(providerPhotos),
  reviewVotes: many(reviewVotes),
}));

export const providersRelations = relations(providers, ({ one, many }) => ({
  user: one(users, { fields: [providers.userId], references: [users.id] }),
  images: many(providerImages),
  reviews: many(reviews),
  favorites: many(favorites),
  inquiries: many(inquiries),
  locations: many(providerLocations),
  programs: many(providerPrograms),
  amenities: many(providerAmenities),
  userUpdates: many(providerUpdates),
  userPhotos: many(providerPhotos),
}));

export const providerImagesRelations = relations(providerImages, ({ one }) => ({
  provider: one(providers, { fields: [providerImages.providerId], references: [providers.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  provider: one(providers, { fields: [reviews.providerId], references: [providers.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  votes: many(reviewVotes),
}));

// Relations for new tables
export const providerUpdatesRelations = relations(providerUpdates, ({ one }) => ({
  user: one(users, { fields: [providerUpdates.userId], references: [users.id] }),
  provider: one(providers, { fields: [providerUpdates.providerId], references: [providers.id] }),
  moderator: one(users, { fields: [providerUpdates.moderatorId], references: [users.id] }),
}));

export const providerPhotosRelations = relations(providerPhotos, ({ one }) => ({
  user: one(users, { fields: [providerPhotos.userId], references: [users.id] }),
  provider: one(providers, { fields: [providerPhotos.providerId], references: [providers.id] }),
  moderator: one(users, { fields: [providerPhotos.moderatorId], references: [users.id] }),
}));

export const reviewVotesRelations = relations(reviewVotes, ({ one }) => ({
  user: one(users, { fields: [reviewVotes.userId], references: [users.id] }),
  review: one(reviews, { fields: [reviewVotes.reviewId], references: [reviews.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  provider: one(providers, { fields: [favorites.providerId], references: [providers.id] }),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  provider: one(providers, { fields: [inquiries.providerId], references: [providers.id] }),
  user: one(users, { fields: [inquiries.userId], references: [users.id] }),
}));

export const providerLocationsRelations = relations(providerLocations, ({ one }) => ({
  provider: one(providers, { fields: [providerLocations.providerId], references: [providers.id] }),
}));

export const providerProgramsRelations = relations(providerPrograms, ({ one }) => ({
  provider: one(providers, { fields: [providerPrograms.providerId], references: [providers.id] }),
}));

export const providerAmenitiesRelations = relations(providerAmenities, ({ one }) => ({
  provider: one(providers, { fields: [providerAmenities.providerId], references: [providers.id] }),
}));

// Insert schemas
export const insertProviderSchema = createInsertSchema(providers).omit({
  id: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Handle type field to allow empty string and transform to undefined for optional handling
  type: z.string().optional().transform(val => {
    if (val === "" || val === null || val === undefined) return undefined;
    return val;
  }),
  // Handle optional numeric fields properly
  monthlyPrice: z.union([z.string(), z.number(), z.null()]).optional().transform(val => {
    if (val === "" || val === null || val === undefined) return null;
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed.toString();
    }
    return val?.toString() || null;
  }),
  capacity: z.union([z.string(), z.number(), z.null()]).optional().transform(val => {
    if (val === "" || val === null || val === undefined) return null;
    if (typeof val === "string") {
      const parsed = parseInt(val);
      return isNaN(parsed) ? null : parsed;
    }
    return val;
  }),
  ageRangeMin: z.union([z.string(), z.number()]).transform(val => {
    if (val === "" || val === null || val === undefined) return 0;
    if (typeof val === "string") {
      const parsed = parseInt(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }),
  ageRangeMax: z.union([z.string(), z.number()]).transform(val => {
    if (val === "" || val === null || val === undefined) return 18;
    if (typeof val === "string") {
      const parsed = parseInt(val);
      return isNaN(parsed) ? 18 : parsed;
    }
    return val;
  }),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProviderImageSchema = createInsertSchema(providerImages).omit({
  id: true,
  createdAt: true,
});

export const insertProviderLocationSchema = createInsertSchema(providerLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProviderProgramSchema = createInsertSchema(providerPrograms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProviderAmenitySchema = createInsertSchema(providerAmenities).omit({
  id: true,
  createdAt: true,
});

// New schemas for user contributions
export const insertProviderUpdateSchema = createInsertSchema(providerUpdates).omit({
  id: true,
  status: true,
  moderatorId: true,
  moderatorNotes: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProviderPhotoSchema = createInsertSchema(providerPhotos).omit({
  id: true,
  status: true,
  moderatorId: true,
  moderatorNotes: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewVoteSchema = createInsertSchema(reviewVotes).omit({
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Provider = typeof providers.$inferSelect;
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type ProviderImage = typeof providerImages.$inferSelect;
export type InsertProviderImage = z.infer<typeof insertProviderImageSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type ProviderLocation = typeof providerLocations.$inferSelect;
export type InsertProviderLocation = z.infer<typeof insertProviderLocationSchema>;
export type ProviderProgram = typeof providerPrograms.$inferSelect;
export type InsertProviderProgram = z.infer<typeof insertProviderProgramSchema>;
export type ProviderAmenity = typeof providerAmenities.$inferSelect;
export type InsertProviderAmenity = z.infer<typeof insertProviderAmenitySchema>;

// New types for user contributions
export type ProviderUpdate = typeof providerUpdates.$inferSelect;
export type InsertProviderUpdate = z.infer<typeof insertProviderUpdateSchema>;
export type ProviderPhoto = typeof providerPhotos.$inferSelect;
export type InsertProviderPhoto = z.infer<typeof insertProviderPhotoSchema>;
export type ReviewVote = typeof reviewVotes.$inferSelect;
export type InsertReviewVote = z.infer<typeof insertReviewVoteSchema>;
