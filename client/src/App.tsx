import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Eagerly loaded — small, always visible on first paint
import Landing from "@/pages/Landing";
import NotFound from "@/pages/not-found";

// Lazily loaded — heavier pages only needed on demand
const Home = lazy(() => import("@/pages/Home"));
const Search = lazy(() => import("@/pages/Search"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const ProvidersOverview = lazy(() => import("@/pages/ProvidersOverview"));
const ProviderDashboard = lazy(() => import("@/pages/ProviderDashboard"));
const ProviderOnboarding = lazy(() => import("@/pages/ProviderOnboarding"));
const ProviderCelebration = lazy(() => import("@/pages/ProviderCelebration"));
const ParentSignup = lazy(() => import("@/pages/ParentSignup"));
const ProviderSignup = lazy(() => import("@/pages/ProviderSignup"));
const ClaimBusiness = lazy(() => import("@/pages/ClaimBusiness"));
const AdminClaims = lazy(() => import("@/pages/AdminClaims"));
const AfterSchoolPrograms = lazy(() => import("@/pages/AfterSchoolPrograms"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          {/* Public routes available to all users */}
          <Route path="/" component={Landing} />
          <Route path="/search" component={Search} />
          <Route path="/after-school-programs" component={AfterSchoolPrograms} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/providers" component={ProvidersOverview} />
          <Route path="/provider/onboarding" component={ProviderOnboarding} />
          <Route path="/provider/signup" component={ProviderSignup} />
          <Route path="/parent/signup" component={ParentSignup} />
          <Route path="/claim-business" component={ClaimBusiness} />

          {/* Dashboard routes — components handle their own auth guards */}
          <Route path="/provider/dashboard" component={ProviderDashboard} />
          <Route path="/provider/celebration" component={ProviderCelebration} />
          <Route path="/admin/claims" component={AdminClaims} />

          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
