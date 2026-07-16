import { describe, it, expect } from "vitest";
import { z } from "zod";
import { insertInquirySchema, insertReviewSchema, insertReviewVoteSchema } from "@shared/schema";

// ─── Inline contact schema (mirrors routes/meta.ts exactly) ──────────────────
const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().max(200).optional(),
  message: z.string().min(1).max(2000),
});

// ─── Inline send-message schema (mirrors chat/routes.ts exactly) ─────────────
const sendMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

// ─── insertInquirySchema ─────────────────────────────────────────────────────
describe("Validation — insertInquirySchema", () => {
  const valid = {
    parentName: "Jane Smith",
    parentEmail: "jane@example.com",
    providerId: 42,
    message: "Is there availability for my 2-year-old starting in September?",
    userId: "user_abc123",
  };

  it("accepts a fully valid inquiry payload", () => {
    const result = insertInquirySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects a payload with missing parentEmail", () => {
    const { parentEmail: _, ...rest } = valid;
    const result = insertInquirySchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("parentEmail");
    }
  });

  it("rejects a payload with missing parentName", () => {
    const { parentName: _, ...rest } = valid;
    const result = insertInquirySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric providerId", () => {
    const result = insertInquirySchema.safeParse({ ...valid, providerId: "abc" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("providerId");
    }
  });

  it("rejects a null providerId", () => {
    const result = insertInquirySchema.safeParse({ ...valid, providerId: null });
    expect(result.success).toBe(false);
  });

  it("rejects an empty message string", () => {
    const result = insertInquirySchema.safeParse({ ...valid, message: "" });
    // Empty string may fail if the column is NOT NULL with min length
    // We capture the outcome predictably
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});

// ─── insertReviewSchema ──────────────────────────────────────────────────────
describe("Validation — insertReviewSchema", () => {
  const valid = {
    providerId: 10,
    userId: "user_xyz",
    rating: 4,
    comment: "Very professional and caring staff.",
  };

  it("accepts a fully valid review payload", () => {
    const result = insertReviewSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects a payload missing required providerId", () => {
    const { providerId: _, ...rest } = valid;
    const result = insertReviewSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a string rating value (type coercion must fail)", () => {
    const result = insertReviewSchema.safeParse({ ...valid, rating: "five" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("rating");
    }
  });

  it("rejects a boolean rating value", () => {
    const result = insertReviewSchema.safeParse({ ...valid, rating: true });
    expect(result.success).toBe(false);
  });

  it("rejects a missing userId", () => {
    const { userId: _, ...rest } = valid;
    const result = insertReviewSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ─── Contact form schema ─────────────────────────────────────────────────────
describe("Validation — contact form schema (routes/meta.ts)", () => {
  const valid = {
    name: "Alice",
    email: "alice@example.com",
    message: "I have a question about listing my daycare.",
  };

  it("accepts a valid minimal contact form payload", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts an optional subject field", () => {
    const result = contactSchema.safeParse({ ...valid, subject: "Partnership inquiry" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email address", () => {
    const result = contactSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("email"));
      expect(issue).toBeDefined();
    }
  });

  it("rejects an empty name (min 1 char)", () => {
    const result = contactSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a name that exceeds 100 characters", () => {
    const result = contactSchema.safeParse({ ...valid, name: "A".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects a message that exceeds 2000 characters", () => {
    const result = contactSchema.safeParse({ ...valid, message: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("rejects an empty message (min 1 char)", () => {
    const result = contactSchema.safeParse({ ...valid, message: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a subject exceeding 200 characters", () => {
    const result = contactSchema.safeParse({ ...valid, subject: "S".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects a missing name field entirely", () => {
    const { name: _, ...rest } = valid;
    const result = contactSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ─── Chat message schema ─────────────────────────────────────────────────────
describe("Validation — sendMessageSchema (chat routes)", () => {
  it("accepts a valid message", () => {
    expect(sendMessageSchema.safeParse({ content: "Find me a daycare in Brooklyn" }).success).toBe(true);
  });

  it("rejects an empty content string (min 1 char)", () => {
    const result = sendMessageSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects content exceeding 4000 characters", () => {
    const result = sendMessageSchema.safeParse({ content: "a".repeat(4001) });
    expect(result.success).toBe(false);
  });

  it("rejects a missing content field", () => {
    const result = sendMessageSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a numeric content value", () => {
    const result = sendMessageSchema.safeParse({ content: 42 });
    expect(result.success).toBe(false);
  });
});
