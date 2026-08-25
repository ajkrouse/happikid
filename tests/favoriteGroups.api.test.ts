import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../server/replitAuth", () => ({
  isAuthenticated: vi.fn((req: any, res: any, next: any) => {
    const userId = req.headers["x-test-user"];
    if (!userId) return res.status(401).json({ ok: false, message: "Unauthorized" });
    req.user = { claims: { sub: userId } };
    next();
  }),
}));

vi.mock("../server/storage", () => ({
  SavedProviderGroupsConflictError: class SavedProviderGroupsConflictError extends Error {},
  storage: {
    getSavedProviderGroupsByUserId: vi.fn(),
    getSavedProviderGroupsState: vi.fn(),
    replaceSavedProviderGroups: vi.fn(),
    mergeSavedProviderGroups: vi.fn(),
  },
}));

vi.mock("../server/logger", () => ({
  createLogger: () => ({ error: vi.fn() }),
}));

import { storage } from "../server/storage";
import { registerFavoriteRoutes } from "../server/routes/favorites";

const publicProvider = {
  id: 7,
  name: "Public Program",
  description: null,
  address: "1 Main St",
  borough: "Brooklyn",
  city: "Brooklyn",
  state: "NY",
  zipCode: "11201",
  phone: null,
  email: "program@example.test",
  website: null,
  type: "daycare",
  ageRangeMin: 12,
  ageRangeMax: 60,
  capacity: null,
  monthlyPrice: "1200",
  monthlyPriceMin: null,
  monthlyPriceMax: null,
  showExactPrice: true,
  hoursOpen: null,
  hoursClose: null,
  schedule: null,
  features: [],
  minAgeMonths: null,
  maxAgeMonths: null,
  totalCapacity: null,
  featuresNew: [],
  featuresCustom: [],
  details: {},
  rating: "0",
  reviewCount: 0,
  programHighlights: [],
  uniqueSellingPoints: [],
  faqs: [],
  isPremium: false,
  acceptsSubsidies: false,
  enrollmentStatus: "accepting",
  closureNote: null,
  closedDates: [],
  lat: null,
  lng: null,
  isActive: true,
  licenseStatus: "confirmed",
  isProfileVisible: true,
  isProfilePublic: true,
  userId: "provider-owner-private-field",
  ownerUserId: "provider-owner-private-field",
  favoriteAdds: 99,
} as any;

function buildApp() {
  const app = express();
  app.use(express.json());
  registerFavoriteRoutes(app);
  return app;
}

describe("saved favorite groups API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("retrieves only the authenticated parent's groups and strips private provider fields", async () => {
    vi.mocked(storage.getSavedProviderGroupsState).mockResolvedValue({ revision: 0, groups: [{
      id: "group-1",
      userId: "parent-a",
      name: "Top choices",
      providerIds: [7],
      providers: [publicProvider],
      createdAt: new Date("2026-08-25T00:00:00.000Z"),
      updatedAt: new Date("2026-08-25T00:00:00.000Z"),
    }] });

    const response = await request(buildApp())
      .get("/api/favorite-groups")
      .set("x-test-user", "parent-a");

    expect(response.status).toBe(200);
    expect(storage.getSavedProviderGroupsState).toHaveBeenCalledWith("parent-a");
    expect(response.body.groups[0]).toMatchObject({
      id: "group-1",
      name: "Top choices",
      providerIds: [7],
      providers: [{ id: 7, name: "Public Program" }],
    });
    expect(response.body.groups[0].providers[0]).not.toHaveProperty("userId");
    expect(response.body.groups[0].providers[0]).not.toHaveProperty("ownerUserId");
    expect(response.body.groups[0].providers[0]).not.toHaveProperty("favoriteAdds");
  });

  it("writes the complete group state only for the authenticated parent", async () => {
    vi.mocked(storage.replaceSavedProviderGroups).mockResolvedValue({ groups: [], revision: 1 });
    const payload = { revision: 0, groups: [{ name: "Weekend options", providerIds: [7, 8] }] };

    const response = await request(buildApp())
      .put("/api/favorite-groups")
      .set("x-test-user", "parent-b")
      .send(payload);

    expect(response.status).toBe(200);
    expect(storage.replaceSavedProviderGroups).toHaveBeenCalledWith("parent-b", payload.groups, 0);
  });

  it("rejects malformed or duplicate group entries before they reach storage", async () => {
    const response = await request(buildApp())
      .put("/api/favorite-groups")
      .set("x-test-user", "parent-a")
      .send({
        groups: [
          { name: "Top choices", providerIds: [7, 7] },
          { name: "top choices", providerIds: [8] },
        ],
      });

    expect(response.status).toBe(400);
    expect(storage.replaceSavedProviderGroups).not.toHaveBeenCalled();
  });

  it("merges guest groups into the authenticated account instead of replacing it", async () => {
    vi.mocked(storage.mergeSavedProviderGroups).mockResolvedValue({ groups: [], revision: 1 });
    const payload = { groups: [{ name: "From this device", providerIds: [7] }] };

    const response = await request(buildApp())
      .post("/api/favorite-groups/import")
      .set("x-test-user", "parent-c")
      .send(payload);

    expect(response.status).toBe(200);
    expect(storage.mergeSavedProviderGroups).toHaveBeenCalledWith("parent-c", payload.groups);
  });
});