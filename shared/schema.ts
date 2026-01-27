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
  pgEnum,
  uuid,
  date,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for claiming system
export const claimStatusEnum = pgEnum('claim_status', ['unclaimed', 'pending_review', 'verified', 'rejected']);
export const verificationMethodEnum = pgEnum('verification_method', ['email_domain', 'doc_upload']);
export const claimRequestStatusEnum = pgEnum('claim_request_status', ['initiated', 'awaiting_admin_review', 'approved', 'rejected']);

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
  role: varchar("role", { enum: ["parent", "provider", "admin"] }).notNull().default("parent"),
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
  // Step 2 upgrade fields
  minAgeMonths: integer("min_age_months"),
  maxAgeMonths: integer("max_age_months"),
  totalCapacity: integer("total_capacity"),
  featuresNew: jsonb("features_new").default(sql`'[]'::jsonb`), // selected feature IDs
  featuresCustom: jsonb("features_custom").default(sql`'[]'::jsonb`), // custom chips
  details: jsonb("details").default(sql`'{}'::jsonb`), // type-specific fields
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
  
  // Claiming system fields
  ownerUserId: varchar("owner_user_id").references(() => users.id), // Verified owner after claiming
  claimStatus: claimStatusEnum("claim_status").default('unclaimed'),
  verificationMethod: verificationMethodEnum("verification_method"),
  verificationPayload: jsonb("verification_payload"),
  claimedAt: timestamp("claimed_at"),
  
  // Data import tracking fields
  source: varchar("source", { length: 64 }).default("manual"),
  sourceUrl: text("source_url"),
  sourceAsOfDate: date("source_as_of_date"),
  county: text("county"),
  agesServedRaw: text("ages_served_raw"),
  ageMinMonths: integer("age_min_months"),
  ageMaxMonths: integer("age_max_months"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  geocodeStatus: text("geocode_status"),
  slug: text("slug"),
  isVerifiedByGov: boolean("is_verified_by_gov").default(false),
  isProfilePublic: boolean("is_profile_public").default(true),
  
  // Subsidy/financial assistance fields
  acceptsSubsidies: boolean("accepts_subsidies").default(false),
  
  // Summer camp specific fields
  campId: text("camp_id"),
  dohInspectionYear: integer("doh_inspection_year"),
  dohReportUrl: text("doh_report_url"),
  campOwner: text("camp_owner"),
  campDirector: text("camp_director"),
  healthDirector: text("health_director"),
  evaluation: text("evaluation"),
  
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

// Claims tracking table
export const claims = pgTable("claims", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: integer("provider_id").references(() => providers.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: claimRequestStatusEnum("status").default('initiated').notNull(),
  verificationMethod: verificationMethodEnum("verification_method").notNull(),
  verificationPayload: jsonb("verification_payload"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit logs for admin actions
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  actorUserId: varchar("actor_user_id").references(() => users.id),
  action: varchar("action").notNull(),
  targetType: varchar("target_type").notNull(),
  targetId: varchar("target_id").notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Provider optimization scores for gamification
export const providerScores = pgTable("provider_scores", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score").notNull().default(0), // 0-100
  completenessScore: integer("completeness_score").notNull().default(0),
  engagementScore: integer("engagement_score").notNull().default(0),
  verificationScore: integer("verification_score").notNull().default(0),
  freshnessScore: integer("freshness_score").notNull().default(0),
  scoreBreakdown: jsonb("score_breakdown").default(sql`'{}'::jsonb`), // Detailed breakdown
  badges: text("badges").array().default(sql`'{}'::text[]`), // Array of badge IDs
  rankInCategory: integer("rank_in_category"), // Rank among similar providers
  categoryAverage: integer("category_average"), // Average score for this provider type
  improvementSuggestions: jsonb("improvement_suggestions").default(sql`'[]'::jsonb`),
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider achievements/badges
export const providerBadges = pgTable("provider_badges", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  badgeType: varchar("badge_type", { 
    enum: ["top_rated", "quick_responder", "rising_star", "verified", "premium", "complete_profile", "parent_favorite"] 
  }).notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Some badges may expire
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`), // Additional badge-specific data
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
  claims: many(claims),
  auditLogs: many(auditLogs),
}));

export const providersRelations = relations(providers, ({ one, many }) => ({
  user: one(users, { fields: [providers.userId], references: [users.id] }),
  owner: one(users, { fields: [providers.ownerUserId], references: [users.id] }),
  images: many(providerImages),
  reviews: many(reviews),
  favorites: many(favorites),
  inquiries: many(inquiries),
  locations: many(providerLocations),
  programs: many(providerPrograms),
  amenities: many(providerAmenities),
  userUpdates: many(providerUpdates),
  userPhotos: many(providerPhotos),
  claims: many(claims),
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

export const claimsRelations = relations(claims, ({ one }) => ({
  provider: one(providers, { fields: [claims.providerId], references: [providers.id] }),
  user: one(users, { fields: [claims.userId], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, { fields: [auditLogs.actorUserId], references: [users.id] }),
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

// Claiming system types and schemas
export type Claim = typeof claims.$inferSelect;
export type InsertClaim = typeof claims.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// Gamification types and schemas
export type ProviderScore = typeof providerScores.$inferSelect;
export type InsertProviderScore = typeof providerScores.$inferInsert;
export type ProviderBadge = typeof providerBadges.$inferSelect;
export type InsertProviderBadge = typeof providerBadges.$inferInsert;

// Insert schemas for new tables
export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProviderScoreSchema = createInsertSchema(providerScores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProviderBadgeSchema = createInsertSchema(providerBadges).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Provider with optimization data (used in search results)
export type ProviderWithScore = Provider & {
  optimizationScore: number | null;
  badges: string[] | null;
};

// Chat conversations for AI integration
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Parent-Provider Messaging System
export const providerInquiries = pgTable("provider_inquiries", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  parentId: varchar("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  messageType: varchar("message_type", { enum: ["tour_request", "rates_inquiry", "availability", "general"] }).default("general"),
  status: varchar("status", { enum: ["sent", "read", "replied", "archived"] }).default("sent"),
  parentEmail: varchar("parent_email"),
  parentPhone: varchar("parent_phone"),
  childAge: varchar("child_age"),
  preferredStartDate: date("preferred_start_date"),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

export const inquiryReplies = pgTable("inquiry_replies", {
  id: serial("id").primaryKey(),
  inquiryId: integer("inquiry_id").notNull().references(() => providerInquiries.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  senderRole: varchar("sender_role", { enum: ["parent", "provider"] }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProviderInquirySchema = createInsertSchema(providerInquiries).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export const insertInquiryReplySchema = createInsertSchema(inquiryReplies).omit({
  id: true,
  createdAt: true,
});

export type ProviderInquiry = typeof providerInquiries.$inferSelect;
export type InsertProviderInquiry = z.infer<typeof insertProviderInquirySchema>;
export type InquiryReply = typeof inquiryReplies.$inferSelect;
export type InsertInquiryReply = z.infer<typeof insertInquiryReplySchema>;

// Family profiles for AI matching
export const familyProfiles = pgTable("family_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  
  // Children info
  childrenAges: jsonb("children_ages").default(sql`'[]'::jsonb`), // Array of {age: number, ageUnit: 'months'|'years'}
  
  // Location preferences
  preferredBorough: varchar("preferred_borough"),
  preferredCity: varchar("preferred_city"),
  preferredZipCode: varchar("preferred_zip_code"),
  maxDistanceMiles: integer("max_distance_miles").default(5),
  
  // Schedule needs
  scheduleType: varchar("schedule_type", { enum: ["full_time", "part_time", "after_school", "flexible"] }),
  preferredDays: jsonb("preferred_days").default(sql`'[]'::jsonb`), // Array of days like ["monday", "tuesday"]
  preferredStartTime: varchar("preferred_start_time"),
  preferredEndTime: varchar("preferred_end_time"),
  
  // Budget
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  needsSubsidy: boolean("needs_subsidy").default(false),
  
  // Must-haves (deal breakers)
  mustHaveFeatures: jsonb("must_have_features").default(sql`'[]'::jsonb`), // Array of feature IDs
  specialNeeds: jsonb("special_needs").default(sql`'[]'::jsonb`), // Array like ["speech_therapy", "wheelchair_accessible"]
  preferredLanguages: jsonb("preferred_languages").default(sql`'[]'::jsonb`), // Array like ["spanish", "mandarin"]
  
  // Nice-to-haves (bonus points)
  niceToHaveFeatures: jsonb("nice_to_have_features").default(sql`'[]'::jsonb`),
  preferredProviderTypes: jsonb("preferred_provider_types").default(sql`'[]'::jsonb`), // Array like ["daycare", "preschool"]
  
  // Profile completion
  isComplete: boolean("is_complete").default(false),
  completedSteps: jsonb("completed_steps").default(sql`'[]'::jsonb`), // Track which wizard steps are done
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFamilyProfileSchema = createInsertSchema(familyProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type FamilyProfile = typeof familyProfiles.$inferSelect;
export type InsertFamilyProfile = z.infer<typeof insertFamilyProfileSchema>;
