/**
 * ProviderDashboard – empty-data resilience tests
 *
 * Recharts AreaChart can throw when fed an empty array, which triggers the
 * ErrorBoundary and leaves the provider with a blank screen. These tests
 * confirm that the dashboard remains usable (no ErrorBoundary fallback) when
 * the API returns empty arrays for view-trend and inquiry data — the typical
 * state for a brand-new provider with no activity yet.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { Suspense, lazy } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// ---------------------------------------------------------------------------
// Mock heavy / browser-only sub-dependencies
// ---------------------------------------------------------------------------

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

vi.mock("@/components/Navigation", () => ({ default: () => <nav /> }));
vi.mock("@/components/PremiumFeaturesModal", () => ({ default: () => null }));
vi.mock("@/components/ProfileOptimizationCard", () => ({
  default: () => null,
  ProfileOptimizationCard: () => null,
}));
vi.mock("@/components/ProviderBadge", () => ({
  default: () => null,
  ProviderBadge: () => null,
}));
vi.mock("@/components/PricingEditCard", () => ({
  default: () => null,
  PricingEditCard: () => null,
}));
vi.mock("@/components/ScheduleEditCard", () => ({
  default: () => null,
  ScheduleEditCard: () => null,
}));
vi.mock("@/components/EnrollmentToggleCard", () => ({
  default: () => null,
  EnrollmentToggleCard: () => null,
}));

// Mock recharts so tests run in happy-dom (no canvas/SVG measurement).
// The AreaChart mock captures whether it was rendered (and with what data)
// so assertions can verify the guard logic in ProviderDashboard.
vi.mock("recharts", () => ({
  AreaChart: ({
    children,
    data,
  }: {
    children?: React.ReactNode;
    data?: unknown[];
  }) => (
    <div
      data-testid="area-chart"
      data-point-count={Array.isArray(data) ? data.length : 0}
    >
      {children}
    </div>
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
// Mock useAuth – return an authenticated provider user
// ---------------------------------------------------------------------------

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: 1, email: "provider@example.com", role: "provider" },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------

const PROVIDER_STUB = {
  id: 42,
  name: "Sunshine Daycare",
  licenseStatus: "confirmed",
  rating: null,
  reviewCount: 0,
  licenseSubmittedAt: null,
};

const ANALYTICS_STUB = {
  profileViews: 0,
  profileClicks: 0,
  favoriteAdds: 0,
  comparisonAdds: 0,
  inquiryCount: 0,
  pendingInquiries: 0,
  responseRate: 0,
  reviewCount: 0,
  ratingDistribution: {},
  viewsThisWeek: 0,
  viewsLastWeek: 0,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a QueryClient pre-seeded with empty-array API responses.
 * Pre-populating the cache avoids the need to intercept fetch — which can be
 * fragile when the queryFn is supplied by the global singleton client.
 */
function makeSeededQueryClient() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });

  // Provider profile
  qc.setQueryData(["/api/providers/mine"], PROVIDER_STUB);

  // Analytics (zeroed, no prior activity)
  qc.setQueryData(["/api/providers/analytics"], ANALYTICS_STUB);

  // View trend: empty array — the key Recharts edge case
  qc.setQueryData(["/api/providers/analytics/views"], []);

  // Score comparison — no comparison pool yet
  qc.setQueryData(["/api/providers/analytics/score-comparison"], null);

  // Provider optimization score — not yet available
  qc.setQueryData([`/api/providers/${PROVIDER_STUB.id}/score`], null);

  // Inquiry, thread, and tour lists — all empty for a new provider
  qc.setQueryData(["/api/inquiries/provider"], []);
  qc.setQueryData(["/api/threads/provider/list"], []);
  qc.setQueryData(["/api/tour-requests"], []);

  return qc;
}

// Stub fetch so any network requests that still fire (e.g. refetch triggers)
// resolve safely instead of hitting a real server.
function stubFetch() {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(null), { status: 200 }),
  );
}

const LazyProviderDashboard = lazy(() => import("@/pages/ProviderDashboard"));

function Shell({
  queryClient,
  children,
}: {
  queryClient: QueryClient;
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Suspense fallback={<div data-testid="loading">loading…</div>}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ProviderDashboard – empty data resilience", () => {
  let fetchSpy: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    fetchSpy = stubFetch();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("renders the dashboard without triggering the ErrorBoundary when view-trend data is an empty array", async () => {
    const qc = makeSeededQueryClient();
    render(
      <Shell queryClient={qc}>
        <LazyProviderDashboard />
      </Shell>,
    );

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    // No ErrorBoundary "Reload page" button — dashboard stayed usable
    expect(
      screen.queryByRole("button", { name: /reload page/i }),
    ).not.toBeInTheDocument();
  });

  it("does not render the AreaChart when view-trend data is an empty array", async () => {
    const qc = makeSeededQueryClient();
    render(
      <Shell queryClient={qc}>
        <LazyProviderDashboard />
      </Shell>,
    );

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    // With empty viewTrend the chart block should be suppressed entirely by the
    // `viewTrend && viewTrend.length > 0` guard in ProviderDashboard.
    expect(screen.queryByTestId("area-chart")).not.toBeInTheDocument();
  });

  it("shows the provider name on the dashboard with empty data", async () => {
    const qc = makeSeededQueryClient();
    render(
      <Shell queryClient={qc}>
        <LazyProviderDashboard />
      </Shell>,
    );

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    // Provider name should appear in the welcome message
    expect(screen.getByText(/Sunshine Daycare/i)).toBeInTheDocument();
  });

  it("renders the dashboard without crashing when inquiries data is an empty array", async () => {
    const qc = makeSeededQueryClient();
    render(
      <Shell queryClient={qc}>
        <LazyProviderDashboard />
      </Shell>,
    );

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    // Dashboard header is present — page did not crash
    expect(
      screen.getByRole("heading", { name: /provider dashboard/i }),
    ).toBeInTheDocument();
  });
});
