/**
 * Unit tests — AI draft prompt context must never leak provider-hidden pricing.
 *
 * When showExactPrice === false, the provider's profile publicly shows only a
 * non-numeric cost level, so no numeric price (fixed or min/max range) may be
 * placed in the model context.
 */

import { describe, it, expect, vi } from "vitest";

vi.mock("../server/logger", () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { buildProviderContext } from "../server/services/aiReply";

const base: any = {
  id: 1,
  name: "Sunny Days",
  type: "daycare",
  address: "1 Main St",
  city: "Brooklyn",
  state: "NY",
  zipCode: "11201",
  enrollmentStatus: "accepting",
};

describe("buildProviderContext pricing visibility", () => {
  it("includes the exact monthly price when showExactPrice is true", () => {
    const ctx = buildProviderContext({ ...base, showExactPrice: true, monthlyPrice: "1850.00" });
    expect(ctx).toContain("$1850.00");
  });

  it("excludes fixed price when showExactPrice is false", () => {
    const ctx = buildProviderContext({ ...base, showExactPrice: false, monthlyPrice: "1850.00" });
    expect(ctx).not.toContain("1850");
    expect(ctx).toMatch(/not shared publicly/i);
    expect(ctx).toMatch(/do not state any dollar amount/i);
  });

  it("excludes the min/max range when showExactPrice is false", () => {
    const ctx = buildProviderContext({
      ...base,
      showExactPrice: false,
      monthlyPrice: "1850.00",
      monthlyPriceMin: "1500.00",
      monthlyPriceMax: "2200.00",
    });
    expect(ctx).not.toContain("1850");
    expect(ctx).not.toContain("1500");
    expect(ctx).not.toContain("2200");
  });

  it("uses the range only when exact price is shown but no fixed price exists", () => {
    const ctx = buildProviderContext({
      ...base,
      showExactPrice: true,
      monthlyPrice: null,
      monthlyPriceMin: "1500.00",
      monthlyPriceMax: "2200.00",
    });
    expect(ctx).toContain("$1500.00–$2200.00");
  });

  it("omits pricing entirely when no price data exists", () => {
    const ctx = buildProviderContext({ ...base, showExactPrice: true, monthlyPrice: null });
    expect(ctx).not.toMatch(/price/i);
  });
});
