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
  unique,
  check,
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
  googleId: varchar("google_id").unique(),
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
  licenseSubmittedAt: timestamp("license_submitted_at"),
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

  // Enrollment status — set by provider, shown as a badge on cards and profile
  enrollmentStatus: varchar("enrollment_status", { enum: ["accepting", "waitlist", "full"] }).default("accepting"),

  // Closure / exception note — free-text field for holiday closures or temporary exceptions
  closureNote: text("closure_note"),

  // AI-assisted replies — when enabled, incoming parent messages get an AI draft reply
  // surfaced in the provider's thread view (never auto-sent; provider reviews and sends)
  aiAutoReplyEnabled: boolean("ai_auto_reply_enabled").default(false),
  aiDataProcessingConsentAt: timestamp("ai_data_processing_consent_at"),

  // Structured closed-date ranges — array of { from, to, reason } objects (ISO date strings)
  closedDates: jsonb("closed_dates").default(sql`'[]'::jsonb`),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Matches public marketplace equality filters before pagination and ranking.
  // The migration also owns five pg_trgm expression indexes for the ILIKE
  // columns (name, description, address, city, and feature text). Drizzle cannot model the
  // pg_trgm operator class, so preserve those deliberate raw indexes when
  // generating future migrations.
  publicSearchFiltersIdx: index("providers_public_search_filters_idx")
    .on(table.city, table.borough, table.type, table.enrollmentStatus, table.acceptsSubsidies)
    .where(sql`${table.isActive} = true AND ${table.licenseStatus} = 'confirmed' AND ${table.isProfileVisible} = true AND ${table.isProfilePublic} = true`),
}));

// Provider images
export const providerImages = pgTable("provider_images", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  imageUrl: varchar("image_url").notNull(),
  caption: varchar("caption"),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Durable cleanup queue for private objects that should be deleted after a
// provider image record is removed. It deliberately has no foreign key to the
// image row because that row is deleted before the external object is retried.
export const providerImageCleanupJobs = pgTable("provider_image_cleanup_jobs", {
  id: serial("id").primaryKey(),
  objectPath: varchar("object_path").notNull().unique(),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Durable delivery queue. Domain mutations insert one of these rows in the
// same database transaction; SMTP delivery happens later in a leased worker.
export const notificationOutbox = pgTable("notification_outbox", {
  id: serial("id").primaryKey(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
  idempotencyKey: varchar("idempotency_key", { length: 200 }).notNull().unique(),
  status: varchar("status", { enum: ["pending", "processing", "delivered", "failed"] }).notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  availableAt: timestamp("available_at").notNull().defaultNow(),
  lockedAt: timestamp("locked_at"),
  lockedBy: varchar("locked_by", { length: 128 }),
  deliveredAt: timestamp("delivered_at"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  dueIdx: index("notification_outbox_due_idx").on(table.status, table.availableAt),
  leaseIdx: index("notification_outbox_lease_idx").on(table.status, table.lockedAt),
}));

export type NotificationOutbox = typeof notificationOutbox.$inferSelect;

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
}, (table) => ({
  providerUserUniq: unique("reviews_provider_user_uniq").on(table.providerId, table.userId),
  ratingBounds: check("reviews_rating_bounds", sql`${table.rating} BETWEEN 1 AND 5`),
}));

// Favorites
export const favorites = pgTable("favorites", {
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  providerId: integer("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.providerId] }),
}));

// Parent-owned saved favorites and comparison groups. Group membership is
// server-side so it remains available after a parent changes devices.
export const savedProviderGroups = pgTable("saved_provider_groups", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userNameUnique: unique("saved_provider_groups_user_name_uniq").on(table.userId, table.name),
  userUpdatedIdx: index("saved_provider_groups_user_updated_idx").on(table.userId, table.updatedAt),
}));

export const savedProviderGroupItems = pgTable("saved_provider_group_items", {
  groupId: uuid("group_id").notNull().references(() => savedProviderGroups.id, { onDelete: "cascade" }),
  providerId: integer("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.groupId, table.providerId] }),
  groupPositionUnique: unique("saved_provider_group_items_group_position_uniq").on(table.groupId, table.position),
}));

export const savedProviderGroupVersions = pgTable("saved_provider_group_versions", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  revision: integer("revision").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
  providerReply: text("provider_reply"),
  repliedAt: timestamp("replied_at"),
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
export const usersRelations = relations(users, ({ many, one }) => ({
  providers: many(providers),
  reviews: many(reviews),
  favorites: many(favorites),
  savedProviderGroups: many(savedProviderGroups),
  savedProviderGroupVersion: one(savedProviderGroupVersions),
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
  savedProviderGroupItems: many(savedProviderGroupItems),
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

export const savedProviderGroupsRelations = relations(savedProviderGroups, ({ one, many }) => ({
  user: one(users, { fields: [savedProviderGroups.userId], references: [users.id] }),
  items: many(savedProviderGroupItems),
}));

export const savedProviderGroupVersionsRelations = relations(savedProviderGroupVersions, ({ one }) => ({
  user: one(users, { fields: [savedProviderGroupVersions.userId], references: [users.id] }),
}));

export const savedProviderGroupItemsRelations = relations(savedProviderGroupItems, ({ one }) => ({
  group: one(savedProviderGroups, { fields: [savedProviderGroupItems.groupId], references: [savedProviderGroups.id] }),
  provider: one(providers, { fields: [savedProviderGroupItems.providerId], references: [providers.id] }),
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

// ---------- insertProviderSchema helpers ----------
// Strict nullable/optional integer: absent → null; present → must be a non-negative integer.
const _strictOptInt = z.preprocess(
  (v) => (v === "" ? null : v),
  z.union([z.null(), z.number().int().nonnegative().finite(), z.string().regex(/^\d+$/, "Must be a non-negative integer").transform(Number)])
).nullable().optional();

// Strict required integer with a fallback when the field is absent.
// If the value is supplied it must be a valid non-negative integer — "abc" is rejected.
const _strictReqInt = (fallback: number) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? fallback : v),
    z.union([z.number().int().nonnegative().finite(), z.string().regex(/^\d+$/, "Must be a non-negative integer").transform(Number)])
  );

// Strict nullable/optional decimal: absent/null/empty → null; present → must be a non-negative number.
// Returns a string because drizzle-zod maps decimal columns to strings.
const _strictOptDecStr = z.preprocess(
  (v) => (v === "" ? null : v),
  z.union([
    z.null(),
    z.number().nonnegative().finite().transform((n) => n.toString()),
    z.string().regex(/^\d+(\.\d+)?$/, "Must be a non-negative number"),
  ])
).nullable().optional();

/**
 * Validates provider closure ranges independently of a full provider payload.
 * Storage also uses this schema so internal write paths cannot bypass the same
 * calendar, ordering, and overlap safeguards applied to API requests.
 */
export const providerClosedDatesSchema = z.array(
  z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
    reason: z.string().max(200).optional(),
  }).superRefine((entry, ctx) => {
    // JavaScript normalizes impossible dates (for example, Feb 30), so round-trip
    // each component before accepting it as a real calendar date.
    const strictParseIso = (iso: string): Date | null => {
      const [year, month, day] = iso.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      return date.getFullYear() === year
        && date.getMonth() === month - 1
        && date.getDate() === day
        ? date
        : null;
    };
    const fromDate = strictParseIso(entry.from);
    const toDate = strictParseIso(entry.to);
    if (fromDate === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid calendar date: ${entry.from}`, path: ["from"] });
    }
    if (toDate === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid calendar date: ${entry.to}`, path: ["to"] });
    }
    if (fromDate !== null && toDate !== null && entry.to < entry.from) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End date must be on or after start date", path: ["to"] });
    }
  }),
).superRefine((entries, ctx) => {
  for (let index = 0; index < entries.length; index += 1) {
    for (let comparison = index + 1; comparison < entries.length; comparison += 1) {
      const first = entries[index];
      const second = entries[comparison];
      if (first.from <= second.to && second.from <= first.to) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Closure date ranges cannot overlap",
          path: [comparison],
        });
      }
    }
  }
});

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
  // Required age fields: absent → sensible default; present but invalid → 400
  ageRangeMin: _strictReqInt(0),
  ageRangeMax: _strictReqInt(120),
  // Optional integer fields: must be non-negative integers when present
  capacity: _strictOptInt,
  minAgeMonths: _strictOptInt,
  maxAgeMonths: _strictOptInt,
  totalCapacity: _strictOptInt,
  ageMinMonths: _strictOptInt,
  ageMaxMonths: _strictOptInt,
  profileCompleteness: z.preprocess(
    (v) => (v === "" ? null : v),
    z.union([z.null(), z.number().int().min(0).max(100).finite(), z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(100))])
  ).nullable().optional(),
  dohInspectionYear: z.preprocess(
    (v) => (v === "" ? null : v),
    z.union([z.null(), z.number().int().positive().finite(), z.string().regex(/^\d{4}$/, "Must be a 4-digit year").transform(Number)])
  ).nullable().optional(),
  // Analytics counters: optional integers (clients should not normally write these)
  profileViews: _strictOptInt,
  profileClicks: _strictOptInt,
  inquiryCount: _strictOptInt,
  comparisonAdds: _strictOptInt,
  favoriteAdds: _strictOptInt,
  // Decimal price fields: must be non-negative numbers when present; stored as strings
  monthlyPrice: _strictOptDecStr,
  monthlyPriceMin: _strictOptDecStr,
  monthlyPriceMax: _strictOptDecStr,
  // Schedule: each day entry must have exactly { isOpen, open, close } — strict rejects unknown fields.
  //
  // open/close accept an empty string (used by onboarding for days not yet configured) OR a
  // canonical 24-hour HH:MM value (zero-padded hours and minutes).  Non-zero-padded inputs
  // like "7:00" are rejected by the regex so they cannot bypass the ordering check.
  //
  // When isOpen is true the superRefine additionally requires:
  //   • both open and close are non-empty canonical HH:MM values
  //   • close is strictly after open, compared as parsed minutes-since-midnight
  schedule: z.record(
    z.string(),
    z.object({
      isOpen: z.boolean(),
      open:  z.string().regex(/^$|^(?:[01]\d|2[0-3]):[0-5]\d$/, "Must be empty or a valid 24-hour time in HH:MM format"),
      close: z.string().regex(/^$|^(?:[01]\d|2[0-3]):[0-5]\d$/, "Must be empty or a valid 24-hour time in HH:MM format"),
    })
      .strict()
      .superRefine((day, ctx) => {
        if (!day.isOpen) return; // closed days — no time constraints
        const HH_MM = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
        if (!HH_MM.test(day.open)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Open time is required and must be a valid 24-hour HH:MM time", path: ["open"] });
        }
        if (!HH_MM.test(day.close)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Close time is required and must be a valid 24-hour HH:MM time", path: ["close"] });
        }
        if (HH_MM.test(day.open) && HH_MM.test(day.close)) {
          const toMinutes = (t: string) => {
            const [h, m] = t.split(":").map(Number);
            return h * 60 + m;
          };
          if (toMinutes(day.close) <= toMinutes(day.open)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Close time must be after open time",
              path: ["close"],
            });
          }
        }
      })
  ).optional().nullable(),
  // Structured closure date ranges
  closedDates: providerClosedDatesSchema.optional().nullable(),
});

/**
 * Schema for client-supplied provider create/update payloads.
 * Server-controlled fields (ownership, claims, analytics counters, admin flags) are
 * omitted so clients cannot overwrite them even if they are included in the request body.
 * userId is enforced server-side from the authenticated session, never from the body.
 */
export const providerClientUpdateSchema = insertProviderSchema.omit({
  // Ownership / identity — always set by the server from the authenticated session
  userId: true,
  ownerUserId: true,
  // Claim fields — managed through the dedicated claim workflow
  claimStatus: true,
  verificationMethod: true,
  verificationPayload: true,
  claimedAt: true,
  // Analytics counters — server-incremented, never client-writable
  profileViews: true,
  profileClicks: true,
  inquiryCount: true,
  comparisonAdds: true,
  favoriteAdds: true,
  // Admin-only / system flags
  isVerified: true,
  isVerifiedByGov: true,
  isPremium: true,
  premiumExpiresAt: true,
  isActive: true,
  // Visibility — controlled by the license/confirm-license workflow
  isProfileVisible: true,
  isProfilePublic: true,
  // License — managed through the confirm-license endpoint
  licenseStatus: true,
  licenseConfirmedAt: true,
  // Derived/aggregated fields — set by server workflows, not direct client writes
  profileCompleteness: true,
  onboardingStep: true,
  // Import / data-provenance fields — set by the data pipeline, not clients
  source: true,
  sourceUrl: true,
  sourceAsOfDate: true,
  county: true,
  agesServedRaw: true,
  slug: true,
  geocodeStatus: true,
  lat: true,
  lng: true,
  // Government inspection / camp report fields — import-only
  campId: true,
  dohInspectionYear: true,
  dohReportUrl: true,
  campOwner: true,
  campDirector: true,
  healthDirector: true,
  evaluation: true,
}).extend({
  // Enforce the same 500-character limit that the client textarea imposes, so a
  // custom client or script cannot bypass it and store arbitrarily long notes.
  closureNote: z.string().max(500, "Closure note must be 500 characters or fewer").nullable().optional(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/** Client-safe schema for review creation — strips isVerified so clients cannot self-mark reviews as verified. */
export const reviewClientCreateSchema = insertReviewSchema.omit({ isVerified: true }).extend({
  rating: z.number().finite().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  content: z.string().trim().min(1, "Review text is required"),
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Client-safe schema for inquiry creation.
 * Strips userId (set from auth), status (always starts as "pending"), and timestamps.
 */
export const inquiryClientCreateSchema = insertInquirySchema.omit({
  userId: true,
  status: true,
});

export const insertProviderImageSchema = createInsertSchema(providerImages).omit({
  id: true,
  createdAt: true,
});

export type ProviderImageCleanupJob = typeof providerImageCleanupJobs.$inferSelect;

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
export type SavedProviderGroup = typeof savedProviderGroups.$inferSelect;
export type SavedProviderGroupItem = typeof savedProviderGroupItems.$inferSelect;
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
  // Nullable only to preserve legacy records safely during the ownership migration.
  // New conversations are always created with an authenticated user ID.
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  userCreatedIdx: index("conversations_user_created_idx").on(table.userId, table.createdAt),
}));

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

/**
 * Client-safe schema for family profile create/update requests.
 * Strips server-controlled fields so clients cannot forge profile progress or ownership.
 * userId is enforced server-side from the authenticated session.
 */
export const familyProfileClientUpdateSchema = insertFamilyProfileSchema.omit({
  userId: true,
  // Profile completion progress — updated by the wizard workflow, not arbitrary client POSTs
  isComplete: true,
  completedSteps: true,
});

export type FamilyProfile = typeof familyProfiles.$inferSelect;
export type InsertFamilyProfile = z.infer<typeof insertFamilyProfileSchema>;

// In-platform parent–provider messaging
export const threadStatusEnum = pgEnum('thread_status', ['open', 'enrolled', 'not_a_fit']);

export const threads = pgTable("threads", {
  id: serial("id").primaryKey(),
  parentUserId: varchar("parent_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  providerId: integer("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  status: threadStatusEnum("status").default('open').notNull(),
  // AI-generated draft reply (provider-side only, never auto-sent).
  // aiDraftMessageId records which parent message the draft was generated for,
  // so stale drafts can be detected and regenerated.
  aiDraftBody: text("ai_draft_body"),
  aiDraftMessageId: integer("ai_draft_message_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  parentProviderUniq: unique("thread_parent_provider_uniq").on(t.parentUserId, t.providerId),
  providerIdx: index("thread_provider_idx").on(t.providerId),
}));

export const threadMessages = pgTable("thread_messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
  senderUserId: varchar("sender_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
}, (t) => ({
  threadIdx: index("thread_messages_thread_idx").on(t.threadId),
}));

export const threadsRelations = relations(threads, ({ one, many }) => ({
  parent: one(users, { fields: [threads.parentUserId], references: [users.id] }),
  provider: one(providers, { fields: [threads.providerId], references: [providers.id] }),
  messages: many(threadMessages),
}));

export const threadMessagesRelations = relations(threadMessages, ({ one }) => ({
  thread: one(threads, { fields: [threadMessages.threadId], references: [threads.id] }),
  sender: one(users, { fields: [threadMessages.senderUserId], references: [users.id] }),
}));

export const insertThreadSchema = createInsertSchema(threads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertThreadMessageSchema = createInsertSchema(threadMessages).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export type Thread = typeof threads.$inferSelect;
export type InsertThread = z.infer<typeof insertThreadSchema>;
export type ThreadMessage = typeof threadMessages.$inferSelect;
export type InsertThreadMessage = z.infer<typeof insertThreadMessageSchema>;

// Daily profile view tracking — one row per provider, privacy-safe viewer key, and day.
export const providerProfileViews = pgTable("provider_profile_views", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  viewerKey: varchar("viewer_key", { length: 64 }).notNull(),
  viewedDate: date("viewed_date").notNull(),
  count: integer("count").notNull().default(1),
}, (t) => ({
  dateProviderIdx: index("ppv_provider_date_idx").on(t.providerId, t.viewedDate),
  providerViewerDateUniq: unique("ppv_provider_viewer_date_uniq").on(t.providerId, t.viewerKey, t.viewedDate),
  positiveCount: check("ppv_count_positive", sql`${t.count} > 0`),
}));

export type ProviderProfileView = typeof providerProfileViews.$inferSelect;

// Tour requests — structured visit scheduling from parents to providers
export const tourRequestStatusEnum = pgEnum('tour_request_status', ['pending', 'scheduled', 'cancelled']);

export const tourRequests = pgTable("tour_requests", {
  id: serial("id").primaryKey(),
  parentUserId: varchar("parent_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  providerId: integer("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  // Up to 3 preferred dates as ISO strings: ["2026-09-10", "2026-09-12", "2026-09-15"]
  preferredDates: jsonb("preferred_dates").notNull().$type<string[]>(),
  preferredTime: varchar("preferred_time", { enum: ["morning", "afternoon", "flexible"] }).notNull(),
  note: text("note"),
  status: tourRequestStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  parentIdx: index("tour_requests_parent_idx").on(t.parentUserId),
  providerIdx: index("tour_requests_provider_idx").on(t.providerId),
}));

export const tourRequestsRelations = relations(tourRequests, ({ one }) => ({
  parent: one(users, { fields: [tourRequests.parentUserId], references: [users.id] }),
  provider: one(providers, { fields: [tourRequests.providerId], references: [providers.id] }),
}));

export const insertTourRequestSchema = createInsertSchema(tourRequests).omit({
  id: true,
  createdAt: true,
});

/** Client-safe schema — parentUserId and status are enforced server-side. */
export const tourRequestClientCreateSchema = insertTourRequestSchema.omit({
  parentUserId: true,
  status: true,
}).extend({
  preferredDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")).min(1).max(3),
  preferredTime: z.enum(["morning", "afternoon", "flexible"]),
  note: z.string().max(1000).optional().nullable(),
});

export type TourRequest = typeof tourRequests.$inferSelect;
export type InsertTourRequest = z.infer<typeof insertTourRequestSchema>;
