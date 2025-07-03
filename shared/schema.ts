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
  showExactPrice: boolean("show_exact_price").default(true),
  hoursOpen: varchar("hours_open"),
  hoursClose: varchar("hours_close"),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  providers: many(providers),
  reviews: many(reviews),
  favorites: many(favorites),
  inquiries: many(inquiries),
}));

export const providersRelations = relations(providers, ({ one, many }) => ({
  user: one(users, { fields: [providers.userId], references: [users.id] }),
  images: many(providerImages),
  reviews: many(reviews),
  favorites: many(favorites),
  inquiries: many(inquiries),
}));

export const providerImagesRelations = relations(providerImages, ({ one }) => ({
  provider: one(providers, { fields: [providerImages.providerId], references: [providers.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  provider: one(providers, { fields: [reviews.providerId], references: [providers.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  provider: one(providers, { fields: [favorites.providerId], references: [providers.id] }),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  provider: one(providers, { fields: [inquiries.providerId], references: [providers.id] }),
  user: one(users, { fields: [inquiries.userId], references: [users.id] }),
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
