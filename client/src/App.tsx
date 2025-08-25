import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import ProvidersOverview from "@/pages/ProvidersOverview";
import ProviderDashboard from "@/pages/ProviderDashboard";
import ProviderOnboarding from "@/pages/ProviderOnboarding";
import ProviderCelebration from "@/pages/ProviderCelebration";
import ParentSignup from "@/pages/ParentSignup";
import ProviderSignup from "@/pages/ProviderSignup";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes available to all users */}
      <Route path="/" component={Landing} />
      <Route path="/search" component={Search} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/providers" component={ProvidersOverview} />
      <Route path="/provider/onboarding" component={ProviderOnboarding} />
      <Route path="/provider/signup" component={ProviderSignup} />
      <Route path="/parent/signup" component={ParentSignup} />
      
      {/* Protected routes for authenticated users */}
      {isAuthenticated && (
        <>
          <Route path="/provider/dashboard" component={ProviderDashboard} />
          <Route path="/provider/celebration" component={ProviderCelebration} />
        </>
      )}
      
      <Route component={NotFound} />
    </Switch>
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
