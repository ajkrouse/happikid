import { describe, expect, it } from "vitest";
import { IntelligentSearchService } from "../server/intelligentSearch";

describe("IntelligentSearchService monthly budget parsing", () => {
  const search = new IntelligentSearchService();

  it("turns an explicit monthly budget into numeric search bounds", () => {
    const parsed = search.parseQuery("daycare between $1,500 and $2,200 per month");

    expect(parsed.filters).toMatchObject({
      type: "daycare",
      priceMin: 1500,
      priceMax: 2200,
    });
  });

  it("recognizes an upper monthly budget without inventing a lower bound", () => {
    const parsed = search.parseQuery("preschool under $2,000 a month");

    expect(parsed.filters.priceMin).toBeUndefined();
    expect(parsed.filters.priceMax).toBe(2000);
  });
});