import { Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { retryableLazy } from "@/components/LazyErrorBoundary";

// Eagerly loaded — small, always visible on first paint
import Landing from "@/pages/Landing";
import NotFound from "@/pages/not-found";

// Lazily loaded — heavier pages only needed on demand.
// retryableLazy (instead of React.lazy) lets ErrorBoundary trigger a fresh
// import() call on reconnection, so a chunk-load failure caused by going
// offline is retried automatically when connectivity returns.
const Home = retryableLazy(() => import("@/pages/Home"));
const Search = retryableLazy(() => import("@/pages/Search"));
const About = retryableLazy(() => import("@/pages/About"));
const Contact = retryableLazy(() => import("@/pages/Contact"));
const ProvidersOverview = retryableLazy(() => import("@/pages/ProvidersOverview"));
const ProviderDashboard = retryableLazy(() => import("@/pages/ProviderDashboard"));
const ProviderOnboarding = retryableLazy(() => import("@/pages/ProviderOnboarding"));
const ProviderCelebration = retryableLazy(() => import("@/pages/ProviderCelebration"));
const ParentSignup = retryableLazy(() => import("@/pages/ParentSignup"));
const ProviderSignup = retryableLazy(() => import("@/pages/ProviderSignup"));
const ClaimBusiness = retryableLazy(() => import("@/pages/ClaimBusiness"));
const AdminClaims = retryableLazy(() => import("@/pages/AdminClaims"));
const AdminVerifications = retryableLazy(() => import("@/pages/AdminVerifications"));
const AfterSchoolPrograms = retryableLazy(() => import("@/pages/AfterSchoolPrograms"));
const Messages = retryableLazy(() => import("@/pages/Messages"));
const ParentDashboard = retryableLazy(() => import("@/pages/ParentDashboard"));

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

          {/* Messaging inbox */}
          <Route path="/messages" component={Messages} />

          {/* Parent dashboard */}
          <Route path="/parent/dashboard" component={ParentDashboard} />

          {/* Dashboard routes — components handle their own auth guards */}
          <Route path="/provider/dashboard" component={ProviderDashboard} />
          <Route path="/provider/celebration" component={ProviderCelebration} />
          <Route path="/admin/claims" component={AdminClaims} />
          <Route path="/admin/verifications" component={AdminVerifications} />

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
        <OfflineBanner />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
