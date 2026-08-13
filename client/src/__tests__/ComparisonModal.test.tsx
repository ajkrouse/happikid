/**
 * Component tests for ComparisonModal — price range text wiring.
 *
 * These tests confirm that the Monthly Price row in the comparison table
 * renders text that matches what formatCostRange / getCostRange produce,
 * i.e. that getCostRange is correctly wired into the modal's formatPrice
 * helper and that showExactPrice / hasPricingData are respected.
 *
 * All network-dependent hooks are mocked so no server is required.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import type { Provider } from "@shared/schema";
import { getCostRange } from "@/lib/providerPricing";

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

vi.mock("@/hooks/useFavoriteGroups", () => ({
  useFavoriteGroups: () => ({ groups: {}, saveGroups: vi.fn() }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Import component AFTER mocks are declared
import ComparisonModal from "@/components/ComparisonModal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal Provider fixture — only fields used by the comparison modal's
 * price row are set explicitly; the rest are defaulted to null / 0 / false.
 */
function makeProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    id: 1,
    userId: null,
    name: "Test Provider",
    description: null,
    address: "1 Main St",
    borough: "Brooklyn",
    city: "Brooklyn",
    state: "NY",
    zipCode: "11201",
    phone: null,
    email: null,
    website: null,
    type: "daycare",
    ageRangeMin: 6,
    ageRangeMax: 60,
    capacity: null,
    monthlyPrice: "0",
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
    isVerified: false,
    isActive: true,
    rating: "0",
    reviewCount: 0,
    profileCompleteness: 0,
    onboardingStep: "basic_info",
    isProfileVisible: false,
    licenseNumber: null,
    licenseStatus: "pending",
    licenseConfirmedAt: null,
    accreditationDetails: null,
    programHighlights: null,
    uniqueSellingPoints: null,
    faqs: null,
    profileViews: 0,
    profileClicks: 0,
    inquiryCount: 0,
    comparisonAdds: 0,
    favoriteAdds: 0,
    isPremium: false,
    premiumExpiresAt: null,
    ownerUserId: null,
    claimStatus: "unclaimed",
    verificationMethod: null,
    verificationPayload: null,
    claimedAt: null,
    source: "manual",
    sourceUrl: null,
    sourceAsOfDate: null,
    county: null,
    agesServedRaw: null,
    ageMinMonths: null,
    ageMaxMonths: null,
    lat: null,
    lng: null,
    geocodeStatus: null,
    slug: null,
    isVerifiedByGov: false,
    isProfilePublic: true,
    acceptsSubsidies: false,
    campId: null,
    dohInspectionYear: null,
    dohReportUrl: null,
    campOwner: null,
    campDirector: null,
    healthDirector: null,
    evaluation: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Provider;
}

function renderModal(providers: Provider[]) {
  return render(
    <ComparisonModal
      providers={providers}
      isOpen={true}
      onClose={vi.fn()}
      onSelectProvider={vi.fn()}
      onRemoveProvider={vi.fn()}
    />,
  );
}

// ---------------------------------------------------------------------------
// Tests — price range text matches getCostRange output
// ---------------------------------------------------------------------------

describe("ComparisonModal — Monthly Price row text", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the explicit min–max price range for a provider with monthlyPriceMin/Max set", () => {
    const provider = makeProvider({
      monthlyPriceMin: "1500",
      monthlyPriceMax: "2500",
    });
    const { min, max } = getCostRange(provider);
    renderModal([provider]);

    const expectedText = `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });

  it("renders the fixed price as both bounds for a provider with only monthlyPrice set", () => {
    const provider = makeProvider({ monthlyPrice: "2000" });
    const { min, max } = getCostRange(provider);
    // min === max === 2000
    renderModal([provider]);

    const expectedText = `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });

  it("renders the type×borough estimate when no explicit price is set", () => {
    // Brooklyn daycare with no explicit price → 1800–3500
    const provider = makeProvider({
      type: "daycare",
      borough: "Brooklyn",
      city: "Brooklyn",
      monthlyPrice: "0",
      monthlyPriceMin: null,
      monthlyPriceMax: null,
    });
    const { min, max } = getCostRange(provider);
    renderModal([provider]);

    const expectedText = `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });

  it("hides the dollar amount but keeps the Verified badge when showExactPrice is false", () => {
    const provider = makeProvider({
      monthlyPrice: "2000",
      showExactPrice: false,
    });
    renderModal([provider]);

    // The amount text should not appear
    expect(screen.queryByText(/\$2,000\s*-\s*\$2,000/)).not.toBeInTheDocument();
    // But the verification badge should still appear (provider has explicit price)
    expect(screen.getByText("✓ Verified")).toBeInTheDocument();
  });

  it("shows 'Est. range' badge when the provider has no explicit pricing", () => {
    const provider = makeProvider({
      monthlyPrice: "0",
      monthlyPriceMin: null,
      monthlyPriceMax: null,
    });
    renderModal([provider]);
    expect(screen.getByText("Est. range")).toBeInTheDocument();
  });

  it("shows '✓ Verified' badge when the provider has verified pricing data", () => {
    const provider = makeProvider({
      monthlyPriceMin: "1800",
      monthlyPriceMax: "3000",
    });
    renderModal([provider]);
    expect(screen.getByText("✓ Verified")).toBeInTheDocument();
  });

  it("renders the correct price for each provider when multiple providers are shown", () => {
    const p1 = makeProvider({
      id: 1,
      name: "Provider A",
      monthlyPrice: "1200",
    });
    const p2 = makeProvider({
      id: 2,
      name: "Provider B",
      monthlyPriceMin: "3000",
      monthlyPriceMax: "4500",
    });

    const { min: min1, max: max1 } = getCostRange(p1);
    const { min: min2, max: max2 } = getCostRange(p2);

    renderModal([p1, p2]);

    expect(
      screen.getByText(`$${min1.toLocaleString()} - $${max1.toLocaleString()}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`$${min2.toLocaleString()} - $${max2.toLocaleString()}`),
    ).toBeInTheDocument();
  });

  it("applies the Manhattan borough multiplier (1.2) when rendering the estimate", () => {
    const provider = makeProvider({
      type: "daycare",
      borough: "Manhattan",
      city: "Manhattan",
      monthlyPrice: "0",
      monthlyPriceMin: null,
      monthlyPriceMax: null,
    });
    const { min, max } = getCostRange(provider);
    // Manhattan: 1800×1.2=2160, 3500×1.2=4200
    expect(min).toBe(2160);
    expect(max).toBe(4200);

    renderModal([provider]);
    expect(
      screen.getByText(`$${min.toLocaleString()} - $${max.toLocaleString()}`),
    ).toBeInTheDocument();
  });
});
