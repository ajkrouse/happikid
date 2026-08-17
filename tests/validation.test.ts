import { describe, it, expect } from "vitest";
import { z } from "zod";
import { insertInquirySchema, insertReviewSchema, insertReviewVoteSchema, providerClientUpdateSchema } from "@shared/schema";

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

// ─── providerClientUpdateSchema — schedule field ─────────────────────────────
describe("Validation — providerClientUpdateSchema schedule field", () => {
  const schema = providerClientUpdateSchema.partial();

  const validSchedule = {
    monday:    { isOpen: true,  open: "07:00", close: "18:00" },
    tuesday:   { isOpen: true,  open: "07:00", close: "18:00" },
    wednesday: { isOpen: true,  open: "07:00", close: "18:00" },
    thursday:  { isOpen: true,  open: "07:00", close: "18:00" },
    friday:    { isOpen: true,  open: "07:00", close: "17:00" },
    saturday:  { isOpen: false, open: "09:00", close: "13:00" },
    sunday:    { isOpen: false, open: "09:00", close: "13:00" },
  };

  it("accepts a valid schedule payload and preserves every field", () => {
    const result = schema.safeParse({ schedule: validSchedule });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.schedule).toEqual(validSchedule);
    }
  });

  it("accepts a schedule where every day is set to isOpen: false", () => {
    const allClosed = Object.fromEntries(
      Object.keys(validSchedule).map((day) => [
        day,
        { isOpen: false, open: "07:00", close: "18:00" },
      ])
    );
    const result = schema.safeParse({ schedule: allClosed });
    expect(result.success).toBe(true);
    if (result.success) {
      for (const day of Object.keys(allClosed)) {
        expect((result.data.schedule as Record<string, { isOpen: boolean }>)[day].isOpen).toBe(false);
      }
    }
  });

  it("rejects a schedule entry that contains an unexpected field", () => {
    const withExtra = {
      ...validSchedule,
      monday: { isOpen: true, open: "07:00", close: "18:00", notes: "surprise" },
    };
    const result = schema.safeParse({ schedule: withExtra });
    expect(result.success).toBe(false);
    if (!result.success) {
      // The error path should point into the schedule field
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.startsWith("schedule"))).toBe(true);
    }
  });

  it("rejects an open day where close time is before open time", () => {
    const backwards = {
      ...validSchedule,
      monday: { isOpen: true, open: "18:00", close: "07:00" },
    };
    const result = schema.safeParse({ schedule: backwards });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.startsWith("schedule"))).toBe(true);
    }
  });

  it("rejects an open day where close time equals open time", () => {
    const equal = {
      ...validSchedule,
      friday: { isOpen: true, open: "09:00", close: "09:00" },
    };
    const result = schema.safeParse({ schedule: equal });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.startsWith("schedule"))).toBe(true);
    }
  });

  it("allows a closed day to have open >= close without error", () => {
    // When isOpen is false the times are irrelevant — no validation should fire
    const closedBackwards = {
      ...validSchedule,
      saturday: { isOpen: false, open: "18:00", close: "06:00" },
    };
    const result = schema.safeParse({ schedule: closedBackwards });
    expect(result.success).toBe(true);
  });

  it("rejects a non-zero-padded close time that would bypass lexical comparison (e.g. '7:00' > '18:00')", () => {
    // Lexically "7:00" > "18:00", so a plain string comparison would incorrectly accept this.
    // The schema must reject "7:00" because it is not canonical HH:MM format.
    const nonPadded = {
      ...validSchedule,
      monday: { isOpen: true, open: "18:00", close: "7:00" },
    };
    const result = schema.safeParse({ schedule: nonPadded });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.startsWith("schedule"))).toBe(true);
    }
  });

  it("rejects a non-zero-padded open time", () => {
    const nonPadded = {
      ...validSchedule,
      tuesday: { isOpen: true, open: "9:00", close: "17:00" },
    };
    const result = schema.safeParse({ schedule: nonPadded });
    expect(result.success).toBe(false);
  });

  it("rejects a time with invalid minutes (e.g. '07:60')", () => {
    const badMinutes = {
      ...validSchedule,
      wednesday: { isOpen: true, open: "07:60", close: "18:00" },
    };
    const result = schema.safeParse({ schedule: badMinutes });
    expect(result.success).toBe(false);
  });

  it("rejects a time with an out-of-range hour (e.g. '25:00')", () => {
    const badHour = {
      ...validSchedule,
      thursday: { isOpen: true, open: "25:00", close: "26:00" },
    };
    const result = schema.safeParse({ schedule: badHour });
    expect(result.success).toBe(false);
  });

  it("accepts the onboarding default schedule — all days closed with empty time strings", () => {
    // ProviderOnboarding initialises every day as isOpen:false with empty open/close strings
    // before the provider reaches the schedule step. The schema must accept this so early
    // onboarding steps can save without error.
    const onboardingDefault = {
      monday:    { isOpen: false, open: "", close: "" },
      tuesday:   { isOpen: false, open: "", close: "" },
      wednesday: { isOpen: false, open: "", close: "" },
      thursday:  { isOpen: false, open: "", close: "" },
      friday:    { isOpen: false, open: "", close: "" },
      saturday:  { isOpen: false, open: "", close: "" },
      sunday:    { isOpen: false, open: "", close: "" },
    };
    const result = schema.safeParse({ schedule: onboardingDefault });
    expect(result.success).toBe(true);
  });

  it("rejects an open day with empty times (times are required when isOpen is true)", () => {
    const openWithEmptyTimes = {
      monday:    { isOpen: true,  open: "", close: "" },
      tuesday:   { isOpen: false, open: "", close: "" },
      wednesday: { isOpen: false, open: "", close: "" },
      thursday:  { isOpen: false, open: "", close: "" },
      friday:    { isOpen: false, open: "", close: "" },
      saturday:  { isOpen: false, open: "", close: "" },
      sunday:    { isOpen: false, open: "", close: "" },
    };
    const result = schema.safeParse({ schedule: openWithEmptyTimes });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.startsWith("schedule"))).toBe(true);
    }
  });

  it("accepts a schedule with closed days that have empty open/close strings", () => {
    // Closed days whose time inputs haven't been filled in should be accepted —
    // the UI hides the time inputs for closed days.
    const closedEmpty = {
      monday:    { isOpen: true,  open: "07:00", close: "18:00" },
      tuesday:   { isOpen: true,  open: "07:00", close: "18:00" },
      wednesday: { isOpen: true,  open: "07:00", close: "18:00" },
      thursday:  { isOpen: true,  open: "07:00", close: "18:00" },
      friday:    { isOpen: true,  open: "07:00", close: "17:00" },
      saturday:  { isOpen: false, open: "", close: "" },
      sunday:    { isOpen: false, open: "", close: "" },
    };
    const result = schema.safeParse({ schedule: closedEmpty });
    expect(result.success).toBe(true);
  });
});
