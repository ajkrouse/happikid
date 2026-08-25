import { describe, expect, it } from "vitest";
import { restoreSearchUrl, serializeSearchUrl } from "@/lib/searchUrlState";

describe("search URL state", () => {
  it("restores every visible filter, sort mode, location and legacy cost link", () => {
    const restored = restoreSearchUrl(
      "?q=music+program&type=afterschool&borough=Brooklyn&city=Brooklyn" +
      "&ageRange=school-age&cost=3&features=Music+program,Homework+help" +
      "&category=performing-arts&subcategory=music&acceptsSubsidies=true" +
      "&verifiedPricing=true&enrollmentStatus=accepting&openOn=2026-09-01" +
      "&sortBy=nearest&lat=40.6782&lng=-73.9442&radius=5",
    );

    expect(restored).toEqual({
      searchQuery: "music program",
      filters: {
        type: "afterschool",
        borough: "Brooklyn",
        city: "Brooklyn",
        ageRange: "school-age",
        priceRange: "2000-3000",
        features: ["Music program", "Homework help"],
        category: "performing-arts",
        subcategory: "music",
        acceptsSubsidies: true,
        verifiedPricing: true,
        enrollmentStatus: "accepting",
        openOn: "2026-09-01",
      },
      sortBy: "nearest",
      userLocation: { lat: 40.6782, lng: -73.9442 },
      searchRadius: 5,
    });
  });

  it("serializes all active state and omits cleared controls", () => {
    const query = serializeSearchUrl({
      searchQuery: "  caring daycare  ",
      filters: {
        type: "daycare",
        priceRange: "0-1000",
        category: "arts",
        subcategory: "dance",
        verifiedPricing: true,
        enrollmentStatus: "waitlist",
      },
      sortBy: "highest-rated",
      userLocation: { lat: 40.7, lng: -74 },
      searchRadius: 10,
    });
    const params = new URLSearchParams(query);

    expect(params.get("q")).toBe("caring daycare");
    expect(params.get("type")).toBe("daycare");
    expect(params.get("priceRange")).toBe("0-1000");
    expect(params.get("category")).toBe("arts");
    expect(params.get("subcategory")).toBe("dance");
    expect(params.get("verifiedPricing")).toBe("true");
    expect(params.get("enrollmentStatus")).toBe("waitlist");
    expect(params.get("sortBy")).toBe("highest-rated");
    expect(params.get("lat")).toBe("40.7");
    expect(params.get("lng")).toBe("-74");
    expect(params.get("radius")).toBe("10");
    expect(params.has("acceptsSubsidies")).toBe(false);
  });

  it("drops malformed URL values rather than re-sending invalid filter requests", () => {
    const restored = restoreSearchUrl(
      "?type=unknown&priceRange=free&enrollmentStatus=open&openOn=2026-02-30" +
      "&sortBy=nearest&lat=40.7&radius=500&category=arts",
    );

    expect(restored).toEqual({
      searchQuery: "",
      filters: {},
      sortBy: "best-match",
      userLocation: null,
      searchRadius: 5,
    });
  });

  it("does not preserve nearest sorting without a usable location", () => {
    const restored = restoreSearchUrl("?sortBy=nearest");
    const serialized = serializeSearchUrl({
      searchQuery: "",
      filters: {},
      sortBy: "nearest",
      userLocation: null,
      searchRadius: 5,
    });

    expect(restored.sortBy).toBe("best-match");
    expect(new URLSearchParams(serialized).has("sortBy")).toBe(false);
  });
});