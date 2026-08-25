export function mapCenterForLocation(
  location: { lat: number; lng: number } | null | undefined,
  fallback: [number, number] = [40.7589, -73.9851],
): [number, number] {
  if (
    typeof location?.lat === "number" &&
    typeof location.lng === "number" &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng) &&
    location.lat >= -90 && location.lat <= 90 &&
    location.lng >= -180 && location.lng <= 180
  ) {
    return [location.lat, location.lng];
  }
  return fallback;
}