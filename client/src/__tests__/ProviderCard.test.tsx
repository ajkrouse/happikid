/**
 * Component tests for ProviderCard — dollar-sign meter wiring.
 *
 * These tests confirm that getCostLevel output is correctly plumbed into the
 * rendered UI: the right number of $ spans carry the "filled" colour class
 * (text-action-clay) and the remaining spans carry the "unfilled" class
 * (text-gray-300).
 *
 * All network-dependent hooks (useQuery, useMutation, useAuth, …) are mocked
 * so the tests run without a server and focus purely on the display logic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ProviderWithScore } from "@shared/schema";

// ---------------------------------------------------------------------------
// Module-level mocks — must be hoisted before component import
// ---------------------------------------------------------------------------

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false, signIn: vi.fn() }),
}));

vi.mock("@/hooks/useFavoriteGroups", () => ({
  useFavoriteGroups: () => ({ groups: {}, saveGroups: vi.fn() }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: vi.fn(),
  queryClient: { invalidateQueries: vi.fn() },
  getQueryFn: vi.fn(),
}));

// Stub heavyweight child components so they don't need their own deps
vi.mock("@/components/MessageProviderModal", () => ({
  MessageProviderModal: () => null,
}));

vi.mock("@/components/ProviderBadge", () => ({
  ProviderBadge: () => null,
}));

// Stub @tanstack/react-query at the hook level so no real fetch is issued.
// We preserve QueryClient / QueryClientProvider so the wrapper still works.
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: vi.fn().mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    }),
    useMutation: vi.fn().mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    }),
    useQueryClient: vi.fn().mockReturnValue({
      invalidateQueries: vi.fn(),
    }),
  };
});

// Import component AFTER mocks are declared
import ProviderCard from "@/components/ProviderCard";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wraps the card in the QueryClientProvider that shadcn hooks expect. */
function renderCard(provider: ProviderWithScore) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <ProviderCard provider={provider} />
    </QueryClientProvider>,
  );
}

/**
 * Minimal ProviderWithScore fixture.  Only the fields used by renderCostDisplay
 * (plus the bare minimum to avoid runtime errors in the rest of the card) are
 * set explicitly; everything else is defaulted to null / 0 / false.
 */
function makeProvider(
  overrides: Partial<ProviderWithScore> = {},
): ProviderWithScore {
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
    // ProviderWithScore extras
    optimizationScore: null,
    badges: [],
    ...overrides,
  } as ProviderWithScore;
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** Returns the 5 $ span elements rendered by the dollar meter. */
function getDollarSpans() {
  // All 5 spans contain the literal "$" character and sit inside the meter div.
  // aria-hidden spans are excluded from getByText, so query the DOM directly.
  return Array.from(document.querySelectorAll<HTMLElement>("span"))
    .filter((el) => el.textContent === "$");
}

/** Returns the meter container element (role="img" with aria-label). */
function getMeterContainer() {
  return screen.getByRole("img", { name: /cost level/i });
}

function filledCount(spans: HTMLElement[]) {
  return spans.filter((s) => s.classList.contains("text-action-clay")).length;
}

function unfilledCount(spans: HTMLElement[]) {
  return spans.filter((s) => s.classList.contains("text-gray-300")).length;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Accessibility tests — aria-label on meter container
// ---------------------------------------------------------------------------

describe("ProviderCard — dollar-sign meter (accessibility)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("meter container has role='img' and aria-label matching the cost level", () => {
    // monthlyPrice "2000" → level 2
    renderCard(makeProvider({ monthlyPrice: "2000" }));
    const meter = getMeterContainer();
    expect(meter).toBeInTheDocument();
    expect(meter).toHaveAttribute("aria-label", "Cost level: 2 out of 5");
  });

  it("aria-label reflects level 1 for a very low price", () => {
    renderCard(makeProvider({ monthlyPrice: "1200" }));
    const meter = getMeterContainer();
    expect(meter).toHaveAttribute("aria-label", "Cost level: 1 out of 5");
  });

  it("aria-label reflects level 5 for a very high price", () => {
    renderCard(makeProvider({ monthlyPrice: "5000" }));
    const meter = getMeterContainer();
    expect(meter).toHaveAttribute("aria-label", "Cost level: 5 out of 5");
  });

  it("aria-label reflects level 3 for a mid-range price", () => {
    renderCard(makeProvider({ monthlyPriceMin: "2600", monthlyPriceMax: "3200" }));
    const meter = getMeterContainer();
    // midpoint 2900 → level 3
    expect(meter).toHaveAttribute("aria-label", "Cost level: 3 out of 5");
  });

  it("all individual $ spans have aria-hidden='true'", () => {
    renderCard(makeProvider({ monthlyPrice: "3000" }));
    const spans = getDollarSpans();
    expect(spans).toHaveLength(5);
    spans.forEach((span) => {
      expect(span).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("aria-label updates when provider pricing changes", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const initial = makeProvider({ monthlyPrice: "1200" }); // level 1
    const { rerender } = render(
      <QueryClientProvider client={qc}><ProviderCard provider={initial} /></QueryClientProvider>,
    );
    expect(getMeterContainer()).toHaveAttribute("aria-label", "Cost level: 1 out of 5");

    const updated = makeProvider({ monthlyPrice: "5000" }); // level 5
    rerender(
      <QueryClientProvider client={qc}><ProviderCard provider={updated} /></QueryClientProvider>,
    );
    expect(getMeterContainer()).toHaveAttribute("aria-label", "Cost level: 5 out of 5");
  });
});

describe("ProviderCard — dollar-sign meter ($ count)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 1 filled $ for a very low fixed price (midpoint ≤ 1500 → level 1)", () => {
    renderCard(makeProvider({ monthlyPrice: "1200" }));
    const spans = getDollarSpans();
    expect(spans).toHaveLength(5);
    expect(filledCount(spans)).toBe(1);
    expect(unfilledCount(spans)).toBe(4);
  });

  it("shows 2 filled $ for a moderate fixed price (midpoint 2000 → level 2)", () => {
    renderCard(makeProvider({ monthlyPrice: "2000" }));
    const spans = getDollarSpans();
    expect(filledCount(spans)).toBe(2);
    expect(unfilledCount(spans)).toBe(3);
  });

  it("shows 3 filled $ for an explicit range whose midpoint is in tier 3 (2600–3200)", () => {
    renderCard(
      makeProvider({ monthlyPriceMin: "2600", monthlyPriceMax: "3200" }),
    );
    const spans = getDollarSpans();
    // midpoint = 2900, level 3
    expect(filledCount(spans)).toBe(3);
    expect(unfilledCount(spans)).toBe(2);
  });

  it("shows 4 filled $ for a range whose midpoint is in tier 4 (3000–4200)", () => {
    renderCard(
      makeProvider({ monthlyPriceMin: "3000", monthlyPriceMax: "4200" }),
    );
    const spans = getDollarSpans();
    // midpoint = 3600, level 4
    expect(filledCount(spans)).toBe(4);
    expect(unfilledCount(spans)).toBe(1);
  });

  it("shows 5 filled $ for a very high fixed price (midpoint 5000 → level 5)", () => {
    renderCard(makeProvider({ monthlyPrice: "5000" }));
    const spans = getDollarSpans();
    expect(filledCount(spans)).toBe(5);
    expect(unfilledCount(spans)).toBe(0);
  });

  it("falls back to the type×borough estimate and lands at the right level when no explicit price is set", () => {
    // Brooklyn daycare: min=1800 max=3500 → midpoint=2650 → level 3
    renderCard(
      makeProvider({
        monthlyPrice: "0",
        monthlyPriceMin: null,
        monthlyPriceMax: null,
        type: "daycare",
        borough: "Brooklyn",
        city: "Brooklyn",
      }),
    );
    const spans = getDollarSpans();
    expect(filledCount(spans)).toBe(3);
  });

  it("falls back to the type×borough estimate for an afterschool provider in Queens (level 1)", () => {
    // Queens afterschool: base 800–1500 × 0.9 → 720–1350 → midpoint 1035 → level 1
    renderCard(
      makeProvider({
        monthlyPrice: "0",
        monthlyPriceMin: null,
        monthlyPriceMax: null,
        type: "afterschool",
        borough: "Queens",
        city: "Queens",
      }),
    );
    const spans = getDollarSpans();
    expect(filledCount(spans)).toBe(1);
  });

  it("shows price range text when showExactPrice is true", () => {
    renderCard(makeProvider({ monthlyPrice: "2000" }));
    // Fixed price → min === max → "$2,000 - $2,000/mo"
    expect(screen.getByText(/\$2,000\s*-\s*\$2,000\/mo/)).toBeInTheDocument();
  });

  it("hides price range text when showExactPrice is false", () => {
    renderCard(makeProvider({ monthlyPrice: "2000", showExactPrice: false }));
    expect(screen.queryByText(/\$2,000\s*-\s*\$2,000\/mo/)).not.toBeInTheDocument();
  });

  it("shows 'Verified pricing' badge when hasPricingData returns true", () => {
    renderCard(makeProvider({ monthlyPrice: "2000" }));
    expect(screen.getByText(/verified pricing/i)).toBeInTheDocument();
  });

  it("shows 'Est. range' badge when hasPricingData returns false", () => {
    renderCard(
      makeProvider({ monthlyPrice: "0", monthlyPriceMin: null, monthlyPriceMax: null }),
    );
    expect(screen.getByText(/est\. range/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Pricing prop-update tests — re-render with new provider props
// ---------------------------------------------------------------------------

describe("ProviderCard — pricing prop updates (rerender)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Helper that returns a QueryClientProvider-wrapped rerender function so
   * tests can drive the same lifecycle as renderCard but also call rerender.
   */
  function renderCardWithRerender(provider: ProviderWithScore) {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { rerender, ...rest } = render(
      <QueryClientProvider client={qc}>
        <ProviderCard provider={provider} />
      </QueryClientProvider>,
    );

    const rerenderCard = (nextProvider: ProviderWithScore) => {
      rerender(
        <QueryClientProvider client={qc}>
          <ProviderCard provider={nextProvider} />
        </QueryClientProvider>,
      );
    };

    return { rerenderCard, ...rest };
  }

  it("meter level rises and badge changes from Est. range to Verified pricing when provider adds an explicit price range", () => {
    // Initial state: no explicit price → Brooklyn daycare estimate → midpoint 2650 → level 3
    const initial = makeProvider({
      monthlyPrice: "0",
      monthlyPriceMin: null,
      monthlyPriceMax: null,
      type: "daycare",
      borough: "Brooklyn",
      city: "Brooklyn",
    });
    const { rerenderCard } = renderCardWithRerender(initial);

    let spans = getDollarSpans();
    expect(filledCount(spans)).toBe(3);
    expect(screen.getByText(/est\. range/i)).toBeInTheDocument();

    // Provider updates their pricing to a high verified range → midpoint 5000 → level 5
    const updated = makeProvider({
      ...initial,
      monthlyPriceMin: "4500",
      monthlyPriceMax: "5500",
    });
    rerenderCard(updated);

    spans = getDollarSpans();
    expect(filledCount(spans)).toBe(5);
    expect(unfilledCount(spans)).toBe(0);
    expect(screen.getByText(/verified pricing/i)).toBeInTheDocument();
    // The estimate text should be gone
    expect(screen.queryByText(/est\. range/i)).not.toBeInTheDocument();
  });

  it("meter level drops and price text updates when provider switches to a lower verified range", () => {
    // Initial state: high fixed price → level 5
    const initial = makeProvider({ monthlyPrice: "5000" });
    const { rerenderCard } = renderCardWithRerender(initial);

    let spans = getDollarSpans();
    expect(filledCount(spans)).toBe(5);

    // Provider updates price to a lower range → midpoint 1350 → level 1
    const updated = makeProvider({
      ...initial,
      monthlyPrice: "0",
      monthlyPriceMin: "1200",
      monthlyPriceMax: "1500",
    });
    rerenderCard(updated);

    spans = getDollarSpans();
    expect(filledCount(spans)).toBe(1);
    expect(unfilledCount(spans)).toBe(4);
    // Price text should reflect the new range
    expect(screen.getByText(/\$1,200\s*-\s*\$1,500\/mo/)).toBeInTheDocument();
  });

  it("hides price amount text when showExactPrice transitions from true to false", () => {
    const initial = makeProvider({ monthlyPrice: "2000", showExactPrice: true });
    const { rerenderCard } = renderCardWithRerender(initial);

    // Price text should be visible initially
    expect(screen.getByText(/\$2,000\s*-\s*\$2,000\/mo/)).toBeInTheDocument();

    // Provider toggles showExactPrice off
    rerenderCard(makeProvider({ monthlyPrice: "2000", showExactPrice: false }));

    // Price text should now be hidden
    expect(screen.queryByText(/\$2,000\s*-\s*\$2,000\/mo/)).not.toBeInTheDocument();
    // But the meter ($ signs) should still be present
    const spans = getDollarSpans();
    expect(spans).toHaveLength(5);
  });

  it("shows price amount text again when showExactPrice transitions from false back to true", () => {
    const initial = makeProvider({ monthlyPrice: "3000", showExactPrice: false });
    const { rerenderCard } = renderCardWithRerender(initial);

    // Price text hidden initially
    expect(screen.queryByText(/\$3,000\s*-\s*\$3,000\/mo/)).not.toBeInTheDocument();

    // Provider re-enables exact price display
    rerenderCard(makeProvider({ monthlyPrice: "3000", showExactPrice: true }));

    // Price text should now be visible
    expect(screen.getByText(/\$3,000\s*-\s*\$3,000\/mo/)).toBeInTheDocument();
  });
});

describe("ProviderCard — persisted provider imagery", () => {
  it("renders the provider's primary public image instead of the stock fallback", () => {
    renderCard({
      ...makeProvider(),
      images: [
        { id: 11, imageUrl: "/api/providers/1/images/11/content", caption: "Classroom", isPrimary: false },
        { id: 12, imageUrl: "/api/providers/1/images/12/content", caption: "Playground", isPrimary: true },
      ],
    } as any);

    expect(screen.getByAltText("Test Provider")).toHaveAttribute(
      "src",
      "/api/providers/1/images/12/content",
    );
  });
});
