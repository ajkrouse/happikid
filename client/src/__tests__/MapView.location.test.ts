import { describe, expect, it } from "vitest";
import { mapCenterForLocation } from "@/lib/mapLocation";

describe("MapView restored location", () => {
  it("centers the map on a valid externally supplied location", () => {
    expect(mapCenterForLocation({ lat: 40.7357, lng: -74.1724 })).toEqual([40.7357, -74.1724]);
  });

  it("keeps the NYC fallback when no valid location is available", () => {
    expect(mapCenterForLocation(null)).toEqual([40.7589, -73.9851]);
    expect(mapCenterForLocation({ lat: 100, lng: -74 })).toEqual([40.7589, -73.9851]);
  });
});