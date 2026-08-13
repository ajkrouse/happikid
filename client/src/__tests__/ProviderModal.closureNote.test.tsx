/**
 * Tests for ProviderModal — closure note display.
 *
 * Confirms that when a provider has a closureNote set, the amber warning
 * banner appears in the sidebar Quick Info card of the public-facing modal.
 */

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import type { Provider } from "@shared/schema";

// ---------------------------------------------------------------------------
// Module-level mocks — hoisted before any component imports
// ---------------------------------------------------------------------------

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false, signIn: vi.fn(), user: null }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: vi.fn(),
  queryClient: { invalidateQueries: vi.fn() },
  getQueryFn: vi.fn(),
}));

// useQuery: return no providerDetails so the component falls back to the prop
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: vi.fn(() => ({ data: undefined, isLoading: false })),
    useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
  };
});

// Stub heavy child components that pull in their own network deps
vi.mock("@/components/ProviderContributions", () => ({
  ProviderContributions: () => null,
}));

vi.mock("@/components/ReviewVoting", () => ({
  ReviewVoting: () => null,
}));

// Import component AFTER mocks are registered
import ProviderModal from "@/components/ProviderModal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal Provider fixture with all required fields.
 * Mirrors the shape used in ComparisonModal.test.tsx.
 */
function makeProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    id: 1,
    userId: null,
    name: "Sunny Day Childcare",
    description: null,
    address: "123 Main St",
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
    closureNote: null,
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ProviderModal — closure note display", () => {
  it("shows the amber closure note banner when closureNote is set", () => {
    const provider = makeProvider({
      closureNote: "Closed Dec 24–Jan 1 for winter break.",
    });

    render(<ProviderModal provider={provider} isOpen={true} onClose={vi.fn()} />);

    expect(
      screen.getByText("Closed Dec 24–Jan 1 for winter break.")
    ).toBeInTheDocument();
  });

  it("renders the closure note inside an amber-styled container", () => {
    const provider = makeProvider({
      closureNote: "Closed on all NYC public school holidays.",
    });

    render(<ProviderModal provider={provider} isOpen={true} onClose={vi.fn()} />);

    const noteText = screen.getByText("Closed on all NYC public school holidays.");
    // The note sits inside the bg-amber-50 warning box
    const banner = noteText.closest("div");
    expect(banner).toHaveClass("bg-amber-50");
  });

  it("does NOT render a closure banner when closureNote is null", () => {
    const provider = makeProvider({ closureNote: null });

    render(<ProviderModal provider={provider} isOpen={true} onClose={vi.fn()} />);

    // Nothing with amber styling related to closure
    expect(screen.queryByText(/closed.*winter/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/closed.*holiday/i)).not.toBeInTheDocument();
  });

  it("does NOT render a closure banner when closureNote is an empty string", () => {
    // An empty string is falsy in JS, so the conditional should skip the banner
    const provider = makeProvider({ closureNote: "" });

    render(<ProviderModal provider={provider} isOpen={true} onClose={vi.fn()} />);

    const amberDivs = document
      .querySelectorAll("div.bg-amber-50");
    // No amber closure banner should be present
    expect(amberDivs.length).toBe(0);
  });

  it("renders null without errors when provider prop is null", () => {
    // The component returns null early when provider is null
    const { container } = render(
      <ProviderModal provider={null} isOpen={true} onClose={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
