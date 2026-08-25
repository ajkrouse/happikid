import { describe, expect, it, vi } from "vitest";

vi.mock("../server/logger", () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { formatProviderForContext } from "../server/services/aiSummaries";

const base: any = {
  id: 1,
  name: "Sunny Days",
  type: "daycare",
  city: "Brooklyn",
  state: "NY",
  ageRangeMin: 12,
  ageRangeMax: 60,
};

describe("AI search summary pricing context", () => {
  it("never puts hidden fixed or range amounts into model context", () => {
    const context = formatProviderForContext({
      ...base,
      showExactPrice: false,
      monthlyPrice: "1850",
      monthlyPriceMin: "1500",
      monthlyPriceMax: "2200",
    });

    expect(context).not.toContain("1850");
    expect(context).not.toContain("1500");
    expect(context).not.toContain("2200");
    expect(context).toMatch(/not publicly shared/i);
  });

  it("includes a complete public range before a fixed fallback", () => {
    const context = formatProviderForContext({
      ...base,
      showExactPrice: true,
      monthlyPrice: "1850",
      monthlyPriceMin: "1500",
      monthlyPriceMax: "2200",
    });

    expect(context).toContain("Monthly price range: $1500–$2200");
    expect(context).not.toContain("Monthly price: $1850/month");
  });
});