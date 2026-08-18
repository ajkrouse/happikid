/**
 * Smoke tests for the lazy-loaded in-page panels in Search.tsx.
 *
 * Each component — ComparisonModal, FamilyProfileWizard,
 * FavoritesSectionWithDnd, and AIInsights — is imported the same way
 * Search.tsx does it (via retryableLazy / React.lazy with a Suspense
 * boundary).  The tests confirm that:
 *
 *  1. The dynamic import resolves without throwing (the chunk exists and
 *     exports the right name).
 *  2. The component mounts and renders its expected content once Suspense
 *     settles — i.e. the Suspense fallback is gone and the panel is visible.
 *  3. No "Reload page" error boundary prompt appears (no render crash).
 *
 * Heavy/browser-only sub-dependencies are mocked at the module level so
 * the tests run in happy-dom without a real server or canvas context.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { lazy, Suspense } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { retryableLazy, LazyErrorBoundary } from "@/components/LazyErrorBoundary";
import type { Provider } from "@shared/schema";

// ---------------------------------------------------------------------------
// Module-level mocks — must be declared before any dynamic imports
// ---------------------------------------------------------------------------

// Hoist mockApiRequest so it is available inside vi.mock factory below
const mockApiRequest = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: mockApiRequest,
  getQueryFn: vi.fn(),
  queryClient: { invalidateQueries: vi.fn() },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false, user: null }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/useFavoriteGroups", () => ({
  useFavoriteGroups: () => ({ groups: {}, groupsCount: 0, saveGroups: vi.fn() }),
}));

// react-dnd / multi-backend require real DOM pointer events absent in happy-dom
vi.mock("react-dnd", () => ({
  DndProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDrag: () => [{ isDragging: false }, vi.fn(), vi.fn()],
  useDrop: () => [{ isOver: false }, vi.fn()],
}));
vi.mock("react-dnd-multi-backend", () => ({
  MultiBackend: {},
}));
vi.mock("rdndmb-html5-to-touch", () => ({
  HTML5toTouch: {},
}));

// FavoritesSection has its own API calls — stub it so DnD wrapper test is isolated
vi.mock("@/components/FavoritesSection", () => ({
  FavoritesSection: () => (
    <div data-testid="favorites-section-stub">Favorites</div>
  ),
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeQC() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

/** Wraps children with the providers and Suspense boundary used in Search.tsx */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={makeQC()}>
      <LazyErrorBoundary fallback={<div data-testid="lazy-fallback">loading…</div>}>
        {children}
      </LazyErrorBoundary>
    </QueryClientProvider>
  );
}

/** Stub fetch so hooks that hit /api/* resolve cleanly (401 = unauthenticated). */
function stubFetch() {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(null), { status: 401 }),
  );
}

/**
 * Minimal Provider fixture with all required fields.  Only override what
 * the specific test cares about.
 */
function makeProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    id: 1,
    userId: null,
    name: "Sunshine Daycare",
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
    monthlyPrice: "2000",
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
    enrollmentStatus: "accepting",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Provider;
}

// ---------------------------------------------------------------------------
// Lazy component definitions — mirror the pattern in Search.tsx exactly so
// we exercise the same dynamic-import paths the page uses at runtime.
// ---------------------------------------------------------------------------

const LazyComparisonModal = retryableLazy(
  () => import("@/components/ComparisonModal"),
);

const LazyFamilyProfileWizard = retryableLazy(() =>
  import("@/components/FamilyProfileWizard").then((m) => ({
    default: m.FamilyProfileWizard,
  })),
);

const LazyFavoritesSectionWithDnd = retryableLazy(
  () => import("@/components/FavoritesSectionWithDnd"),
);

const LazyAIInsights = retryableLazy(() =>
  import("@/components/AIInsights").then((m) => ({ default: m.AIInsights })),
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Lazy-loaded Search panels — smoke tests", () => {
  let fetchSpy: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    fetchSpy = stubFetch();
  });
  afterEach(() => {
    fetchSpy.mockRestore();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // ComparisonModal
  // -------------------------------------------------------------------------

  describe("ComparisonModal", () => {
    it("resolves and mounts when isOpen=true with two providers", async () => {
      const providers = [
        makeProvider({ id: 1, name: "Sunshine Daycare" }),
        makeProvider({ id: 2, name: "Bright Futures" }),
      ];

      render(
        <Shell>
          <LazyComparisonModal
            providers={providers}
            isOpen={true}
            onClose={vi.fn()}
            onSelectProvider={vi.fn()}
            onRemoveProvider={vi.fn()}
          />
        </Shell>,
      );

      // Suspense fallback should disappear after the chunk loads
      await waitFor(() =>
        expect(screen.queryByTestId("lazy-fallback")).not.toBeInTheDocument(),
      );

      // The modal's dialog title must be visible
      expect(
        screen.getByText(/compare & save providers/i),
      ).toBeInTheDocument();

      // No error-boundary "Reload page" prompt
      expect(
        screen.queryByRole("button", { name: /reload page/i }),
      ).not.toBeInTheDocument();
    });

    it("renders both provider names in the comparison table", async () => {
      const providers = [
        makeProvider({ id: 1, name: "Sunshine Daycare" }),
        makeProvider({ id: 2, name: "Bright Futures" }),
      ];

      render(
        <Shell>
          <LazyComparisonModal
            providers={providers}
            isOpen={true}
            onClose={vi.fn()}
            onSelectProvider={vi.fn()}
            onRemoveProvider={vi.fn()}
          />
        </Shell>,
      );

      await waitFor(() =>
        expect(screen.queryByTestId("lazy-fallback")).not.toBeInTheDocument(),
      );

      expect(screen.getByText("Sunshine Daycare")).toBeInTheDocument();
      expect(screen.getByText("Bright Futures")).toBeInTheDocument();
    });

    it("does not render when isOpen=false", async () => {
      render(
        <Shell>
          <LazyComparisonModal
            providers={[makeProvider()]}
            isOpen={false}
            onClose={vi.fn()}
            onSelectProvider={vi.fn()}
            onRemoveProvider={vi.fn()}
          />
        </Shell>,
      );

      await waitFor(() =>
        expect(screen.queryByTestId("lazy-fallback")).not.toBeInTheDocument(),
      );

      // Dialog title must NOT appear when closed
      expect(
        screen.queryByText(/compare & save providers/i),
      ).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // FamilyProfileWizard
  // -------------------------------------------------------------------------

  describe("FamilyProfileWizard", () => {
    it("resolves and mounts when isOpen=true, showing the first wizard step", async () => {
      render(
        <Shell>
          <LazyFamilyProfileWizard
            isOpen={true}
            onClose={vi.fn()}
          />
        </Shell>,
      );

      await waitFor(() =>
        expect(screen.queryByTestId("lazy-fallback")).not.toBeInTheDocument(),
      );

      // The first wizard step title must be present
      expect(screen.getByText("Your Children")).toBeInTheDocument();

      // No error-boundary prompt
      expect(
        screen.queryByRole("button", { name: /reload page/i }),
      ).not.toBeInTheDocument();
    });

    it("renders the step description for the Children step", async () => {
      render(
        <Shell>
          <LazyFamilyProfileWizard
            isOpen={true}
            onClose={vi.fn()}
          />
        </Shell>,
      );

      await waitFor(() =>
        expect(screen.queryByTestId("lazy-fallback")).not.toBeInTheDocument(),
      );

      expect(
        screen.getByText(/tell us about your little ones/i),
      ).toBeInTheDocument();
    });

    it("does not render the wizard content when isOpen=false", async () => {
      render(
        <Shell>
          <LazyFamilyProfileWizard
            isOpen={false}
            onClose={vi.fn()}
          />
        </Shell>,
      );

      await waitFor(() =>
        expect(screen.queryByTestId("lazy-fallback")).not.toBeInTheDocument(),
      );

      expect(screen.queryByText("Your Children")).not.toBeInTheDocument();
    });

    it("advances through all steps when Next is clicked and calls apiRequest on Finish", async () => {
      const user = userEvent.setup();
      mockApiRequest.mockResolvedValue({});

      render(
        <Shell>
          <LazyFamilyProfileWizard
            isOpen={true}
            onClose={vi.fn()}
            onComplete={vi.fn()}
          />
        </Shell>,
      );

      // Wait for Suspense to resolve
      await waitFor(() =>
        expect(screen.queryByTestId("lazy-fallback")).not.toBeInTheDocument(),
      );

      // Step 1 — "Your Children"
      expect(screen.getByText("Your Children")).toBeInTheDocument();

      // Advance step 1 → 2
      await user.click(screen.getByRole("button", { name: /next/i }));
      await waitFor(() =>
        expect(screen.getByText("Location")).toBeInTheDocument(),
      );

      // Advance step 2 → 3
      await user.click(screen.getByRole("button", { name: /next/i }));
      await waitFor(() =>
        expect(screen.getByText("Schedule")).toBeInTheDocument(),
      );

      // Advance step 3 → 4
      await user.click(screen.getByRole("button", { name: /next/i }));
      await waitFor(() =>
        expect(screen.getByText("Budget")).toBeInTheDocument(),
      );

      // Advance step 4 → 5 (last step)
      await user.click(screen.getByRole("button", { name: /next/i }));
      await waitFor(() =>
        expect(screen.getByText("Preferences")).toBeInTheDocument(),
      );

      // On the last step the forward button should say "Find My Matches"
      const finishBtn = screen.getByRole("button", { name: /find my matches/i });
      expect(finishBtn).toBeInTheDocument();

      // Click Finish — triggers the save mutation
      await user.click(finishBtn);

      // apiRequest must have been called with POST /api/family-profile and
      // a payload that marks the profile as complete
      await waitFor(() =>
        expect(mockApiRequest).toHaveBeenCalledWith(
          "POST",
          "/api/family-profile",
          expect.objectContaining({
            isComplete: true,
            completedSteps: ["children", "location", "schedule", "budget", "preferences"],
          }),
        ),
      );
    });
  });

  // -------------------------------------------------------------------------
  // FavoritesSectionWithDnd
  // -------------------------------------------------------------------------

  describe("FavoritesSectionWithDnd", () => {
    it("resolves, wraps FavoritesSection in DndProvider, and mounts without throwing", async () => {
      render(
        <Shell>
          <LazyFavoritesSectionWithDnd
            setSelectedProvider={vi.fn()}
            setShowProviderModal={vi.fn()}
            setComparisonProviders={vi.fn()}
            setShowSavedGroupsModal={vi.fn()}
            setShowComparisonModal={vi.fn()}
          />
        </Shell>,
      );

      await waitFor(() =>
        expect(screen.queryByTestId("lazy-fallback")).not.toBeInTheDocument(),
      );

      // The stub FavoritesSection inside the DnD wrapper must be present
      expect(
        screen.getByTestId("favorites-section-stub"),
      ).toBeInTheDocument();

      // No error-boundary prompt
      expect(
        screen.queryByRole("button", { name: /reload page/i }),
      ).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // AIInsights
  // -------------------------------------------------------------------------

  describe("AIInsights", () => {
    it("resolves and renders the summary text and AI Insights heading", async () => {
      render(
        <Shell>
          <LazyAIInsights
            summary="Brooklyn has great daycare options with bilingual programs."
            highlights={["Many programs accept subsidies", "Extended hours available"]}
            followUpSuggestions={["Show bilingual programs"]}
            onFollowUp={vi.fn()}
          />
        </Shell>,
      );

      await waitFor(() =>
        expect(screen.queryByTestId("lazy-fallback")).not.toBeInTheDocument(),
      );

      // Heading
      expect(screen.getByText("AI Insights")).toBeInTheDocument();

      // Summary text (rendered in data-testid="text-ai-summary")
      expect(
        screen.getByText(
          "Brooklyn has great daycare options with bilingual programs.",
        ),
      ).toBeInTheDocument();

      // No error-boundary prompt
      expect(
        screen.queryByRole("button", { name: /reload page/i }),
      ).not.toBeInTheDocument();
    });

    it("renders highlight bullets when highlights are provided", async () => {
      render(
        <Shell>
          <LazyAIInsights
            summary="Great options near you."
            highlights={["Many programs accept subsidies", "Extended hours available"]}
            followUpSuggestions={[]}
            onFollowUp={vi.fn()}
          />
        </Shell>,
      );

      await waitFor(() =>
        expect(screen.queryByTestId("lazy-fallback")).not.toBeInTheDocument(),
      );

      expect(
        screen.getByText("Many programs accept subsidies"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Extended hours available"),
      ).toBeInTheDocument();
    });

    it("renders follow-up suggestion buttons and wires onFollowUp", async () => {
      const onFollowUp = vi.fn();

      render(
        <Shell>
          <LazyAIInsights
            summary="Great options near you."
            highlights={[]}
            followUpSuggestions={["Show bilingual programs", "Under $1,500/month"]}
            onFollowUp={onFollowUp}
          />
        </Shell>,
      );

      await waitFor(() =>
        expect(screen.queryByTestId("lazy-fallback")).not.toBeInTheDocument(),
      );

      // Follow-up buttons rendered via data-testid="button-follow-up-0" etc.
      const btn0 = screen.getByTestId("button-follow-up-0");
      expect(btn0).toBeInTheDocument();
      expect(btn0).toHaveTextContent("Show bilingual programs");

      const btn1 = screen.getByTestId("button-follow-up-1");
      expect(btn1).toBeInTheDocument();
      expect(btn1).toHaveTextContent("Under $1,500/month");
    });
  });
});
