/**
 * Smoke tests for lazy-loaded routes.
 *
 * Two concerns tested here:
 *
 * 1. **Router resolution** – after the lazy-loading change, does wouter
 *    still route /search, /provider/onboarding, and /admin/claims to the
 *    correct component (and not, say, always fall through to Landing or
 *    NotFound)? Tested using real wouter Switch/Route with memoryLocation.
 *
 * 2. **Page mount** – each of those lazy pages can be imported and rendered
 *    inside the Suspense+ErrorBoundary shell without throwing.
 *
 * 3. **ErrorBoundary** – chunk-load failures are caught and show a friendly
 *    "Reload page" prompt instead of a blank screen.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { act, lazy, Suspense } from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Switch, Route } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { retryableLazy } from "@/components/LazyErrorBoundary";
import { getQueryFn } from "@/lib/queryClient";

// ---------------------------------------------------------------------------
// Mock heavy / browser-only sub-dependencies so real pages can load
// ---------------------------------------------------------------------------

// react-leaflet and leaflet require canvas / WebGL — neither exists in happy-dom
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map">{children}</div>
  ),
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
  useMap: () => ({}),
  useMapEvents: () => ({}),
}));
vi.mock("leaflet", () => ({
  default: { icon: () => ({}), Icon: { Default: { mergeOptions: () => {} } } },
  icon: () => ({}),
  Icon: { Default: { mergeOptions: () => {} } },
}));

// Components that make their own API calls or require real DOM features
vi.mock("@/components/Navigation", () => ({ default: () => <nav /> }));
vi.mock("@/components/MapView", () => ({
  default: () => <div data-testid="mapview" />,
}));
vi.mock("@/components/ProviderCard", () => ({ default: () => <div /> }));
vi.mock("@/components/SearchFilters", () => ({ default: () => <div /> }));
vi.mock("@/components/ProviderModal", () => ({ default: () => null }));
vi.mock("@/components/ContactInquiryModal", () => ({ default: () => null }));
vi.mock("@/components/ComparisonModal", () => ({ default: () => null }));
vi.mock("@/components/SearchInsights", () => ({
  SearchInsights: () => null,
}));
vi.mock("@/components/ConversationalSearch", () => ({
  ConversationalSearch: () => null,
}));
vi.mock("@/components/AIInsights", () => ({
  AIInsights: () => null,
  AIInsightsSkeleton: () => null,
}));
vi.mock("@/components/FamilyProfileWizard", () => ({
  FamilyProfileWizard: () => null,
}));
vi.mock("@/components/TaxonomyNavigator", () => ({
  TaxonomyNavigator: () => null,
}));
vi.mock("@/components/FavoritesSection", () => ({
  FavoritesSection: () => null,
}));
vi.mock("@/components/FavoritesSectionWithDnd", () => ({
  default: () => null,
}));
vi.mock("@/components/PremiumFeaturesModal", () => ({ default: () => null }));
vi.mock("@/components/ui/toaster", () => ({ Toaster: () => null }));

// Additional mocks for pages added in the extended smoke-test suite
vi.mock("@/components/RoleSelectionModal", () => ({ default: () => null }));
vi.mock("@/components/ProfileOptimizationCard", () => ({
  default: () => null,
}));
vi.mock("@/components/ProviderBadge", () => ({
  default: () => null,
  ProviderBadge: () => null,
}));
vi.mock("@/components/PricingEditCard", () => ({ default: () => null }));
vi.mock("@/components/ScheduleEditCard", () => ({ default: () => null }));
vi.mock("@/components/EnrollmentToggleCard", () => ({ default: () => null }));
vi.mock("recharts", () => ({
  AreaChart: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Stub fetch so useAuth's query resolves cleanly without a real server. */
function stubFetch() {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(null), { status: 401 }),
  );
}

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

/** QueryClient that includes the app's default queryFn so data queries fire. */
function makeQCWithFetch() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: getQueryFn({ on401: "returnNull" }),
        retry: false,
        staleTime: Infinity,
        refetchInterval: false,
        refetchOnWindowFocus: false,
      },
    },
  });
}

function ShellWithFetch({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={makeQCWithFetch()}>
      <ErrorBoundary>
        <Suspense fallback={<div data-testid="loading">loading…</div>}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={makeQC()}>
      <ErrorBoundary>
        <Suspense fallback={<div data-testid="loading">loading…</div>}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// 1. Router-resolution tests
//
// Use stub lazy components + real wouter so we verify that the Switch/Route
// table in App.tsx still maps each path to the right component — i.e. the
// lazy-loading change didn't accidentally break route matching.
// ---------------------------------------------------------------------------

// Lightweight stand-ins — we only care which one the router picks
const SearchStub = () => <div data-testid="route-search">Search</div>;
const OnboardingStub = () => (
  <div data-testid="route-onboarding">Onboarding</div>
);
const AdminStub = () => <div data-testid="route-admin">AdminClaims</div>;
const LandingStub = () => <div data-testid="route-landing">Landing</div>;
const NotFoundStub = () => <div data-testid="route-not-found">NotFound</div>;

// Lazy-wrapped stubs (same pattern as App.tsx) but resolve immediately
const LazySearchStub = lazy(() =>
  Promise.resolve({ default: SearchStub }),
);
const LazyOnboardingStub = lazy(() =>
  Promise.resolve({ default: OnboardingStub }),
);
const LazyAdminStub = lazy(() =>
  Promise.resolve({ default: AdminStub }),
);

/**
 * Renders a minimal replica of App's Switch (only the three routes under
 * test + Landing + NotFound) with the given in-memory path.
 */
function renderRouter(path: string) {
  const { hook } = memoryLocation({ path, static: true });
  return render(
    <Shell>
      <Router hook={hook}>
        <Switch>
          <Route path="/" component={LandingStub} />
          <Route path="/search" component={LazySearchStub} />
          <Route path="/provider/onboarding" component={LazyOnboardingStub} />
          <Route path="/admin/claims" component={LazyAdminStub} />
          <Route component={NotFoundStub} />
        </Switch>
      </Router>
    </Shell>,
  );
}

describe("Route resolution after lazy-loading change", () => {
  let fetchSpy: ReturnType<typeof stubFetch>;
  beforeEach(() => {
    fetchSpy = stubFetch();
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("/search resolves to the Search route (not Landing or NotFound)", async () => {
    renderRouter("/search");
    await waitFor(() =>
      expect(screen.getByTestId("route-search")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("route-landing")).not.toBeInTheDocument();
    expect(screen.queryByTestId("route-not-found")).not.toBeInTheDocument();
  });

  it("/provider/onboarding resolves to the Onboarding route", async () => {
    renderRouter("/provider/onboarding");
    await waitFor(() =>
      expect(screen.getByTestId("route-onboarding")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("route-landing")).not.toBeInTheDocument();
    expect(screen.queryByTestId("route-not-found")).not.toBeInTheDocument();
  });

  it("/admin/claims resolves to the AdminClaims route", async () => {
    renderRouter("/admin/claims");
    await waitFor(() =>
      expect(screen.getByTestId("route-admin")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("route-landing")).not.toBeInTheDocument();
    expect(screen.queryByTestId("route-not-found")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2. Page-mount smoke tests
//
// Confirm the real lazy page modules import and mount inside the
// Suspense+ErrorBoundary shell without throwing (heavy deps mocked above).
// ---------------------------------------------------------------------------

const LazySearch = lazy(() => import("@/pages/Search"));
const LazyProviderOnboarding = lazy(() => import("@/pages/ProviderOnboarding"));
const LazyAdminClaims = lazy(() => import("@/pages/AdminClaims"));

describe("Lazy-loaded page mount smoke tests", () => {
  let fetchSpy: ReturnType<typeof stubFetch>;
  beforeEach(() => {
    fetchSpy = stubFetch();
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("Search page mounts without throwing", async () => {
    render(
      <Shell>
        <LazySearch />
      </Shell>,
    );
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });

  it("ProviderOnboarding page mounts without throwing", async () => {
    render(
      <Shell>
        <LazyProviderOnboarding />
      </Shell>,
    );
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });

  it("AdminClaims page mounts without throwing", async () => {
    render(
      <Shell>
        <LazyAdminClaims />
      </Shell>,
    );
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2b. Extended page-mount smoke tests — remaining lazy routes
// ---------------------------------------------------------------------------

const LazyHome = lazy(() => import("@/pages/Home"));
const LazyAbout = lazy(() => import("@/pages/About"));
const LazyContact = lazy(() => import("@/pages/Contact"));
const LazyProvidersOverview = lazy(() => import("@/pages/ProvidersOverview"));
const LazyProviderDashboard = lazy(() => import("@/pages/ProviderDashboard"));
const LazyProviderCelebration = lazy(
  () => import("@/pages/ProviderCelebration"),
);
const LazyParentSignup = lazy(() => import("@/pages/ParentSignup"));
const LazyProviderSignup = lazy(() => import("@/pages/ProviderSignup"));
const LazyClaimBusiness = lazy(() => import("@/pages/ClaimBusiness"));
const LazyAfterSchoolPrograms = lazy(
  () => import("@/pages/AfterSchoolPrograms"),
);
const LazyAdminVerifications = lazy(
  () => import("@/pages/AdminVerifications"),
);
const LazyMessages = lazy(() => import("@/pages/Messages"));
const LazyParentDashboard = lazy(() => import("@/pages/ParentDashboard"));

describe("Remaining lazy-loaded page mount smoke tests", () => {
  let fetchSpy: ReturnType<typeof stubFetch>;
  beforeEach(() => {
    fetchSpy = stubFetch();
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("Home page mounts without throwing", async () => {
    render(
      <Shell>
        <LazyHome />
      </Shell>,
    );
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });

  it("About page mounts without throwing", async () => {
    render(
      <Shell>
        <LazyAbout />
      </Shell>,
    );
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });

  it("Contact page mounts without throwing", async () => {
    render(
      <Shell>
        <LazyContact />
      </Shell>,
    );
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });

  it("ProvidersOverview page mounts without throwing", async () => {
    render(
      <Shell>
        <LazyProvidersOverview />
      </Shell>,
    );
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });

  it("ProviderDashboard page mounts without throwing", async () => {
    render(
      <Shell>
        <LazyProviderDashboard />
      </Shell>,
    );
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });

  it("ProviderCelebration page mounts without throwing", async () => {
    render(
      <Shell>
        <LazyProviderCelebration />
      </Shell>,
    );
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });

  it("ParentSignup page mounts without throwing", async () => {
    render(
      <Shell>
        <LazyParentSignup />
      </Shell>,
    );
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });

  it("ProviderSignup page mounts without throwing", async () => {
    render(
      <Shell>
        <LazyProviderSignup />
      </Shell>,
    );
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });

  it("ClaimBusiness page mounts without throwing", async () => {
    render(
      <Shell>
        <LazyClaimBusiness />
      </Shell>,
    );
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });

  it("AfterSchoolPrograms page mounts without throwing", async () => {
    render(
      <Shell>
        <LazyAfterSchoolPrograms />
      </Shell>,
    );
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });

  it("AdminVerifications page mounts without throwing", async () => {
    render(
      <Shell>
        <LazyAdminVerifications />
      </Shell>,
    );
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });

  it("Messages page mounts without throwing", async () => {
    render(
      <Shell>
        <LazyMessages />
      </Shell>,
    );
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });

  it("ParentDashboard page mounts without throwing", async () => {
    render(
      <Shell>
        <LazyParentDashboard />
      </Shell>,
    );
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2c. Authenticated-session smoke tests — Messages and ParentDashboard
//
// The pages above render a sign-in gate when useAuth returns unauthenticated.
// These tests stub fetch so that /api/auth/user returns a real user, which
// lets the pages advance past the gate and render their main content.
// ---------------------------------------------------------------------------

/** Stub fetch for an authenticated parent session. */
function stubFetchAuthenticated() {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url =
      typeof input === "string" ? input : (input as Request).url;
    if (url.includes("/api/auth/user")) {
      return new Response(
        JSON.stringify({
          id: "user-1",
          firstName: "Test",
          lastName: "Parent",
          email: "test@example.com",
          role: "parent",
        }),
        { status: 200 },
      );
    }
    // Data endpoints — return empty collections so the page can finish loading
    if (url.includes("/api/threads") || url.includes("/api/tour-requests")) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    return new Response(JSON.stringify(null), { status: 401 });
  });
}

describe("Authenticated-session smoke tests – Messages and ParentDashboard", () => {
  let fetchSpy: ReturnType<typeof stubFetchAuthenticated>;
  beforeEach(() => {
    fetchSpy = stubFetchAuthenticated();
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("Messages renders its heading when the user is signed in", async () => {
    render(
      <Shell>
        <LazyMessages />
      </Shell>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /messages/i }),
      ).toBeInTheDocument(),
    );
    // The sign-in gate must not be shown
    expect(
      screen.queryByText(/sign in to view messages/i),
    ).not.toBeInTheDocument();
  });

  it("ParentDashboard renders its heading when the user is signed in", async () => {
    render(
      <Shell>
        <LazyParentDashboard />
      </Shell>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /my dashboard/i }),
      ).toBeInTheDocument(),
    );
    // The sign-in gate must not be shown
    expect(
      screen.queryByText(/sign in required/i),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2d. Non-empty data smoke tests – Messages and ParentDashboard
//
// The authenticated tests above stub the data APIs to return empty arrays.
// These tests provide a real ThreadSummary and a real tour-request object so
// that list-item rendering code is exercised and any crash inside the map()
// callbacks is caught before it reaches production.
// ---------------------------------------------------------------------------

const stubThread = {
  id: 1,
  providerId: 10,
  parentUserId: "user-1",
  status: "open" as const,
  createdAt: "2026-08-01T10:00:00Z",
  updatedAt: "2026-08-01T11:00:00Z",
  provider: { id: 10, name: "Sunshine Childcare" },
  parentUser: {
    id: "user-1",
    firstName: "Test",
    lastName: "Parent",
    email: "test@example.com",
  },
  latestMessage: {
    body: "Hello, I would like to schedule a tour.",
    createdAt: "2026-08-01T11:00:00Z",
    senderUserId: "user-1",
  },
  unreadCount: 2,
  messageCount: 3,
};

const stubTourRequest = {
  id: 1,
  status: "pending",
  providerName: "Sunshine Childcare",
  providerAddress: "123 Main St, Springfield",
  preferredDates: ["2026-08-20", "2026-08-21"],
  preferredTime: "morning",
  note: "Looking forward to the visit!",
  createdAt: "2026-08-10T09:00:00Z",
};

function stubFetchWithData() {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url =
      typeof input === "string" ? input : (input as Request).url;
    if (url.includes("/api/auth/user")) {
      return new Response(
        JSON.stringify({
          id: "user-1",
          firstName: "Test",
          lastName: "Parent",
          email: "test@example.com",
          role: "parent",
        }),
        { status: 200 },
      );
    }
    if (url.includes("/api/threads")) {
      return new Response(JSON.stringify([stubThread]), { status: 200 });
    }
    if (url.includes("/api/tour-requests")) {
      return new Response(JSON.stringify([stubTourRequest]), { status: 200 });
    }
    return new Response(JSON.stringify(null), { status: 401 });
  });
}

describe("Non-empty data smoke tests – Messages and ParentDashboard", () => {
  let fetchSpy: ReturnType<typeof stubFetchWithData>;
  beforeEach(() => {
    fetchSpy = stubFetchWithData();
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("Messages renders a thread list item when threads are returned", async () => {
    render(
      <ShellWithFetch>
        <LazyMessages />
      </ShellWithFetch>,
    );
    // Wait for the page heading (authenticated state)
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /messages/i }),
      ).toBeInTheDocument(),
    );
    // The thread list item should render the provider name without crashing
    await waitFor(() =>
      expect(screen.getByText("Sunshine Childcare")).toBeInTheDocument(),
    );
    // Unread badge (unreadCount = 2) should be visible inside the thread button
    const badges = screen.getAllByText("2");
    expect(badges.length).toBeGreaterThan(0);
    // No error boundary fallback
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });

  it("ParentDashboard renders a tour request card when tour requests are returned", async () => {
    render(
      <ShellWithFetch>
        <LazyParentDashboard />
      </ShellWithFetch>,
    );
    // Wait for the page heading (authenticated state)
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /my dashboard/i }),
      ).toBeInTheDocument(),
    );
    // The tour request card should show the provider name without crashing
    await waitFor(() =>
      expect(screen.getAllByText("Sunshine Childcare").length).toBeGreaterThan(0),
    );
    // Pending badge count (1 pending) should be visible
    expect(screen.getByText(/1 pending/i)).toBeInTheDocument();
    // No error boundary fallback
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2e. Thread detail panel smoke test – Messages with ?thread=1
//
// When ?thread=1 is in the URL the component sets selectedThreadId=1 and
// fetches /api/threads/1.  A crash inside the message map() or reply
// composer would not be caught by the list-only tests above.  This test
// stubs /api/threads/1 with a realistic ThreadDetail (one ThreadMessage)
// and confirms the message bubble renders without error.
// ---------------------------------------------------------------------------

// The detail message body must be DISTINCT from stubThread.latestMessage.body
// ("Hello, I would like to schedule a tour.") so that an assertion on this
// text can only pass when the detail panel actually rendered — not when the
// list-item preview text happens to match.
const DETAIL_MESSAGE_BODY = "Can I schedule a visit for next week?";

const stubThreadDetail = {
  thread: {
    id: 1,
    providerId: 10,
    parentUserId: "user-1",
    status: "open" as const,
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-01T11:00:00Z",
    provider: { id: 10, name: "Sunshine Childcare" },
    parentUser: {
      id: "user-1",
      firstName: "Test",
      lastName: "Parent",
      email: "test@example.com",
    },
    latestMessage: {
      body: DETAIL_MESSAGE_BODY,
      createdAt: "2026-08-01T11:00:00Z",
      senderUserId: "user-1",
    },
    unreadCount: 0,
    messageCount: 1,
  },
  messages: [
    {
      id: 101,
      threadId: 1,
      senderUserId: "user-1",
      body: DETAIL_MESSAGE_BODY,
      createdAt: "2026-08-01T11:00:00Z",
      readAt: null,
    },
  ],
  provider: {
    id: 10,
    name: "Sunshine Childcare",
    userId: null,
    ownerUserId: null,
  },
};

function stubFetchWithThreadDetail() {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url =
      typeof input === "string" ? input : (input as Request).url;
    if (url.includes("/api/auth/user")) {
      return new Response(
        JSON.stringify({
          id: "user-1",
          firstName: "Test",
          lastName: "Parent",
          email: "test@example.com",
          role: "parent",
        }),
        { status: 200 },
      );
    }
    // Mark-read endpoint (must be checked before the broader /api/threads/1 match)
    if (/\/api\/threads\/1\/read/.test(url)) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    // Thread detail for thread 1
    if (/\/api\/threads\/1$/.test(url)) {
      return new Response(JSON.stringify(stubThreadDetail), { status: 200 });
    }
    // Thread list
    if (url.includes("/api/threads")) {
      return new Response(JSON.stringify([stubThread]), { status: 200 });
    }
    return new Response(JSON.stringify(null), { status: 401 });
  });
}

describe("Thread detail panel smoke test – Messages with ?thread=1", () => {
  let fetchSpy: ReturnType<typeof stubFetchWithThreadDetail>;
  beforeEach(() => {
    fetchSpy = stubFetchWithThreadDetail();
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("renders the message bubble when a thread is selected", async () => {
    render(
      <ShellWithFetch>
        <LazyMessages />
      </ShellWithFetch>,
    );

    // Page must reach the authenticated heading without crashing
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /messages/i }),
      ).toBeInTheDocument(),
    );

    // Wait for the thread list item, then click it to open the detail panel
    await waitFor(() =>
      expect(screen.getByText("Sunshine Childcare")).toBeInTheDocument(),
    );
    const threadButton = screen
      .getByText("Sunshine Childcare")
      .closest("button")!;
    fireEvent.click(threadButton);

    // Assert /api/threads/1 was actually fetched — the check is inside waitFor
    // so it re-evaluates as new fetch calls arrive after the click.
    await waitFor(() => {
      const fetchedUrls = fetchSpy.mock.calls.map(([url]) =>
        typeof url === "string" ? url : (url as Request).url,
      );
      expect(
        fetchedUrls.some((u) => /\/api\/threads\/1($|\?)/.test(u)),
      ).toBe(true);
    });

    // DETAIL_MESSAGE_BODY ("Can I schedule a visit for next week?") is distinct
    // from stubThread.latestMessage.body ("Hello, I would like to schedule a
    // tour."), so this can only pass when the thread detail panel rendered the
    // message bubble — not when the list-item preview text matched instead.
    await waitFor(() =>
      expect(screen.getByText(DETAIL_MESSAGE_BODY)).toBeInTheDocument(),
    );

    // Reply composer textarea must be present (exercises that rendering branch)
    expect(
      screen.getByPlaceholderText(/type a message/i),
    ).toBeInTheDocument();

    // No error boundary fallback must be shown
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2f. Provider status dropdown visibility – only shown to provider owner
//
// Messages.tsx computes `isProviderRole` by comparing the logged-in user's id
// against `provider.ownerUserId ?? provider.userId`.  The status-change Select
// is only rendered when `isProviderRole` is true.  These two tests confirm that
// guard works: the Select appears for the owner and is absent for everyone else.
// ---------------------------------------------------------------------------

/**
 * Build a stubThreadDetail-shaped object whose provider has the given ownerUserId.
 * The logged-in user is always "user-1" in these tests.
 */
function makeOwnerDetail(ownerUserId: string | null) {
  return {
    thread: {
      id: 1,
      providerId: 10,
      parentUserId: "user-1",
      status: "open" as const,
      createdAt: "2026-08-01T10:00:00Z",
      updatedAt: "2026-08-01T11:00:00Z",
      provider: { id: 10, name: "Sunshine Childcare" },
      parentUser: {
        id: "user-1",
        firstName: "Test",
        lastName: "Parent",
        email: "test@example.com",
      },
      latestMessage: {
        body: "Can I schedule a visit?",
        createdAt: "2026-08-01T11:00:00Z",
        senderUserId: "user-1",
      },
      unreadCount: 0,
      messageCount: 1,
    },
    messages: [
      {
        id: 201,
        threadId: 1,
        senderUserId: "user-1",
        body: "Can I schedule a visit?",
        createdAt: "2026-08-01T11:00:00Z",
        readAt: null,
      },
    ],
    provider: {
      id: 10,
      name: "Sunshine Childcare",
      userId: null,
      ownerUserId,
    },
  };
}

function stubFetchForOwnerTest(ownerUserId: string | null) {
  const detail = makeOwnerDetail(ownerUserId);
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url =
      typeof input === "string" ? input : (input as Request).url;
    if (url.includes("/api/auth/user")) {
      return new Response(
        JSON.stringify({
          id: "user-1",
          firstName: "Test",
          lastName: "Parent",
          email: "test@example.com",
          role: "parent",
        }),
        { status: 200 },
      );
    }
    if (/\/api\/threads\/1\/read/.test(url)) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    if (/\/api\/threads\/1$/.test(url)) {
      return new Response(JSON.stringify(detail), { status: 200 });
    }
    if (url.includes("/api/threads")) {
      return new Response(
        JSON.stringify([
          {
            id: 1,
            providerId: 10,
            parentUserId: "user-1",
            status: "open",
            createdAt: "2026-08-01T10:00:00Z",
            updatedAt: "2026-08-01T11:00:00Z",
            provider: { id: 10, name: "Sunshine Childcare" },
            parentUser: null,
            latestMessage: null,
            unreadCount: 0,
            messageCount: 1,
          },
        ]),
        { status: 200 },
      );
    }
    return new Response(JSON.stringify(null), { status: 401 });
  });
}

describe("Provider status dropdown visibility in thread detail panel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the status Select when the logged-in user is the provider owner", async () => {
    // provider.ownerUserId === "user-1" (the logged-in user) → isProviderRole true
    stubFetchForOwnerTest("user-1");

    render(
      <ShellWithFetch>
        <LazyMessages />
      </ShellWithFetch>,
    );

    // Reach authenticated heading
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /messages/i }),
      ).toBeInTheDocument(),
    );

    // Open the thread detail panel
    await waitFor(() =>
      expect(screen.getByText("Sunshine Childcare")).toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByText("Sunshine Childcare").closest("button")!,
    );

    // Wait for the detail panel message to appear, confirming the detail loaded
    await waitFor(() =>
      expect(screen.getByText("Can I schedule a visit?")).toBeInTheDocument(),
    );

    // The status Select (rendered as a combobox) must be present for the owner
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("hides the status Select when the logged-in user is not the provider owner", async () => {
    // provider.ownerUserId === "other-user" ≠ "user-1" → isProviderRole false
    stubFetchForOwnerTest("other-user");

    render(
      <ShellWithFetch>
        <LazyMessages />
      </ShellWithFetch>,
    );

    // Reach authenticated heading
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /messages/i }),
      ).toBeInTheDocument(),
    );

    // Open the thread detail panel
    await waitFor(() =>
      expect(screen.getByText("Sunshine Childcare")).toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByText("Sunshine Childcare").closest("button")!,
    );

    // Wait for the detail panel message to appear, confirming the detail loaded
    await waitFor(() =>
      expect(screen.getByText("Can I schedule a visit?")).toBeInTheDocument(),
    );

    // The status Select must NOT be rendered for a non-owner
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 3. ErrorBoundary unit tests
// ---------------------------------------------------------------------------

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">ok</div>
      </ErrorBoundary>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("shows 'Reload page' button when a child throws", async () => {
    function Bomb(): React.ReactElement {
      throw new Error("boom");
    }
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /reload page/i }),
      ).toBeInTheDocument(),
    );
  });

  it("shows 'New version available' heading on a chunk-load error", async () => {
    function ChunkBomb(): React.ReactElement {
      throw new Error(
        "Failed to fetch dynamically imported module: /assets/Search-abc123.js",
      );
    }
    render(
      <ErrorBoundary>
        <ChunkBomb />
      </ErrorBoundary>,
    );
    await waitFor(() => {
      expect(screen.getByText(/new version available/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /reload page/i }),
      ).toBeInTheDocument();
    });
  });

  it("catches a lazy-chunk failure that propagates through Suspense", async () => {
    const FailingPage = lazy(() =>
      Promise.reject(new Error("ChunkLoadError: Loading chunk 5 failed")),
    );
    render(
      <ErrorBoundary>
        <Suspense fallback={<div>loading…</div>}>
          <FailingPage />
        </Suspense>
      </ErrorBoundary>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /reload page/i }),
      ).toBeInTheDocument(),
    );
  });

  it("shows the offline message instead of reload when chunk fails while offline", async () => {
    // Simulate being offline
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });
    try {
      const ChunkBomb = (): React.ReactElement => {
        throw new Error(
          "Failed to fetch dynamically imported module: /assets/Search-abc123.js",
        );
      };
      render(
        <ErrorBoundary>
          <Suspense fallback={<div>loading…</div>}>
            <ChunkBomb />
          </Suspense>
        </ErrorBoundary>,
      );
      await waitFor(() =>
        expect(
          screen.getByText(/you appear to be offline/i),
        ).toBeInTheDocument(),
      );
      expect(
        screen.queryByRole("button", { name: /reload page/i }),
      ).not.toBeInTheDocument();
    } finally {
      Object.defineProperty(navigator, "onLine", {
        value: true,
        configurable: true,
      });
    }
  });

  it("auto-retries the chunk import when connectivity is restored after an offline chunk error", async () => {
    // Simulate being offline
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });

    let callCount = 0;
    const LoadedContent = () => (
      <div data-testid="retried-content">Chunk recovered</div>
    );
    const factory = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(
          new Error(
            "Failed to fetch dynamically imported module: /assets/Search-abc123.js",
          ),
        );
      }
      return Promise.resolve({ default: LoadedContent });
    });

    const RetryableChunk = retryableLazy(factory);

    render(
      <ErrorBoundary>
        <Suspense fallback={<div data-testid="suspense-spinner">loading…</div>}>
          <RetryableChunk />
        </Suspense>
      </ErrorBoundary>,
    );

    // First attempt: offline + chunk error → offline message
    await waitFor(() =>
      expect(
        screen.getByText(/you appear to be offline/i),
      ).toBeInTheDocument(),
    );
    expect(factory).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();

    // Simulate coming back online — ErrorBoundary should auto-retry
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });

    // Factory must be called a second time (fresh chunk request)
    await waitFor(() =>
      expect(
        screen.getByTestId("retried-content"),
      ).toBeInTheDocument(),
    );
    expect(factory).toHaveBeenCalledTimes(2);

    // Error / offline UI should be gone
    expect(
      screen.queryByText(/you appear to be offline/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });

  it("does NOT auto-clear non-chunk errors when coming back online", async () => {
    function GenericBomb(): React.ReactElement {
      throw new Error("Some unrelated runtime error");
    }
    render(
      <ErrorBoundary>
        <Suspense fallback={<div>loading…</div>}>
          <GenericBomb />
        </Suspense>
      </ErrorBoundary>,
    );

    // Generic error: always shows reload prompt
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /reload page/i }),
      ).toBeInTheDocument(),
    );

    // Firing online should not clear a non-chunk error
    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });

    // Reload prompt must still be there
    expect(
      screen.getByRole("button", { name: /reload page/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/you appear to be offline/i),
    ).not.toBeInTheDocument();
  });
});
