import Navigation from "@/components/Navigation";
import ProviderCard from "@/components/ProviderCard";
import SearchFilters from "@/components/SearchFilters";
import ProviderModal from "@/components/ProviderModal";
import ContactInquiryModal from "@/components/ContactInquiryModal";
import { SearchInsights } from "@/components/SearchInsights";
import { ConversationalSearch } from "@/components/ConversationalSearch";
// AIInsightsSkeleton is inlined below to avoid a static import of the AIInsights
// module, which would pull the lazy chunk into the initial bundle.
function AIInsightsSkeleton() {
  return (
    <Card className="mb-6 border-2 border-action-teal/20 bg-gradient-to-r from-brand-sage to-white overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-action-teal/10">
            <Sparkles className="h-5 w-5 text-action-teal animate-pulse" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );
}
import { TaxonomyNavigator } from "@/components/TaxonomyNavigator";
import { useFavoriteGroups } from "@/hooks/useFavoriteGroups";
import type { FamilyProfile } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search as SearchIcon, Grid, List, Bookmark, Users, X, Map, BookOpen, CheckCircle2, ArrowRight, SlidersHorizontal, Sparkles, MapPin } from "lucide-react";
import { formatAreaLabel } from "@/lib/areas";
import { useState, useEffect, useRef } from "react";
import { LazyErrorBoundary, retryableLazy } from "@/components/LazyErrorBoundary";

const MapView = retryableLazy(() => import("@/components/MapView"));
const AIInsights = retryableLazy(() =>
  import("@/components/AIInsights").then((m) => ({ default: m.AIInsights }))
);
const ComparisonModal = retryableLazy(() => import("@/components/ComparisonModal"));
const FamilyProfileWizard = retryableLazy(() =>
  import("@/components/FamilyProfileWizard").then((m) => ({ default: m.FamilyProfileWizard }))
);
const FavoritesSectionWithDnd = retryableLazy(() => import("@/components/FavoritesSectionWithDnd"));
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Provider } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { TaxonomyResponse, Category } from "../../../types/taxonomy";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function getTypeLabel(type: string): string {
  switch (type) {
    case "daycare": return "Daycare Center";
    case "afterschool": return "After-School Program";
    case "camp": return "Summer Camp";
    case "school": return "Private School";
    default: return type;
  }
}

export default function SearchPage() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [urlParsed, setUrlParsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => { if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current); };
  }, [searchQuery]);

  const [filters, setFilters] = useState<{
    type?: string;
    borough?: string;
    city?: string;
    ageRange?: string;
    priceRange?: string;
    features?: string[];
    category?: string;
    subcategory?: string;
    acceptsSubsidies?: boolean;
    verifiedPricing?: boolean;
    enrollmentStatus?: string;
  }>({});
  const [sortBy, setSortBy] = useState("best-match");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const handleLocationSearch = (location: { lat: number; lng: number; radius: number }) => {
    setUserLocation({ lat: location.lat, lng: location.lng });
    toast({ title: "Location Search", description: `Searching within ${location.radius} miles of your location` });
  };

  const handleMapProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowProviderModal(true);
  };

  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [comparisonProviders, setComparisonProviders] = useState<Provider[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showSavedGroupsModal, setShowSavedGroupsModal] = useState(false);
  const [showFamilyProfileWizard, setShowFamilyProfileWizard] = useState(false);

  const { groupsCount } = useFavoriteGroups();

  const { data: familyProfile, isLoading: isFamilyProfileLoading } = useQuery<FamilyProfile | null>({
    queryKey: ["/api/family-profile"],
    enabled: isAuthenticated && user?.role === "parent",
  });

  const showProfileBanner = isAuthenticated && user?.role === "parent" && !isFamilyProfileLoading && familyProfile === null;
  const activeAreaLabel = filters.borough || familyProfile?.preferredBorough || null;
  const showAreaSummary = isAuthenticated && user?.role === "parent" && !isFamilyProfileLoading && familyProfile !== null && !!activeAreaLabel;

  // Automatically apply the family's preferred borough as the initial filter when:
  // - URL parsing is complete (so URL-set filters take precedence)
  // - The family profile has loaded and has a preferredBorough
  // - No borough or city filter is already active
  useEffect(() => {
    if (!urlParsed) return;
    if (isFamilyProfileLoading) return;
    if (!familyProfile?.preferredBorough) return;
    if (filters.borough || filters.city) return;
    setFilters((prev) => ({ ...prev, borough: familyProfile.preferredBorough! }));
  }, [urlParsed, isFamilyProfileLoading, familyProfile?.preferredBorough]); // eslint-disable-line react-hooks/exhaustive-deps

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalProviders, setTotalProviders] = useState(0);

  const handleGroupsSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
  };

  const handleCategorySelect = (category: string, subcategory: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("category", category);
    urlParams.set("subcategory", subcategory);
    window.history.pushState({}, "", `${window.location.pathname}?${urlParams.toString()}`);
    setFilters((prev) => ({ ...prev, category, subcategory }));
    setCurrentPage(1);
    refetch();
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get("q");
    const type = urlParams.get("type");
    const borough = urlParams.get("borough");
    const city = urlParams.get("city");
    const features = urlParams.get("features");
    const cost = urlParams.get("cost");
    const ageRange = urlParams.get("ageRange");
    const category = urlParams.get("category");
    const subcategory = urlParams.get("subcategory");

    const costToPrice: { [key: string]: string } = {
      "1": "0-1000",
      "2": "1000-2000",
      "3": "2000-3000",
      "4": "3000+",
      "5": "3000+",
    };

    if (q) {
      setSearchQuery(q);
      setDebouncedSearchQuery(q);
    }

    const newFilters: typeof filters = {};
    if (type) newFilters.type = type;
    if (borough) newFilters.borough = borough;
    if (city) newFilters.city = city;
    if (features) newFilters.features = features.split(",");
    if (cost) newFilters.priceRange = costToPrice[cost];
    if (ageRange) newFilters.ageRange = ageRange;
    if (category) newFilters.category = category;
    if (subcategory) newFilters.subcategory = subcategory;

    if (Object.keys(newFilters).length > 0) setFilters(newFilters);
    setUrlParsed(true);
  }, []);

  const { data: providerResponse, isLoading, refetch } = useQuery<any>({
    queryKey: [
      "/api/providers",
      {
        search: debouncedSearchQuery,
        type: filters.type,
        borough: filters.borough,
        city: filters.city,
        ageRange: filters.ageRange,
        features: filters.features?.join(","),
        priceRange: filters.priceRange,
        acceptsSubsidies: filters.acceptsSubsidies ? "true" : undefined,
        verifiedPricing: filters.verifiedPricing ? "true" : undefined,
        enrollmentStatus: filters.enrollmentStatus || undefined,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        aiSummary: debouncedSearchQuery ? "true" : undefined,
      },
    ],
    enabled: urlParsed,
  });

  useEffect(() => {
    if (providerResponse && typeof providerResponse === "object" && "total" in (providerResponse as any)) {
      setTotalProviders((providerResponse as any).total);
    }
  }, [providerResponse]);

  const providers = Array.isArray(providerResponse) ? providerResponse : (providerResponse as any)?.providers || [];
  const totalCount = Array.isArray(providerResponse) ? providers.length : (providerResponse as any)?.total || providers.length;
  const verifiedPricingCount: number | null = (providerResponse as any)?.verifiedPricingCount ?? null;

  const { data: favorites = [] } = useQuery({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
  });

  const { data: taxonomyData } = useQuery<TaxonomyResponse>({
    queryKey: ["/api/taxonomy/after-school-programs"],
    enabled: filters.type === "afterschool",
  });

  const categories = taxonomyData?.afterSchoolPrograms || [];

  const handleSearch = () => { refetch(); };

  const handleProviderClick = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowProviderModal(true);
  };

  const handleRequestInfo = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowContactModal(true);
  };

  const handleAddToComparison = (provider: Provider) => {
    if (comparisonProviders.find((p) => p.id === provider.id)) {
      toast({ title: "Already in comparison", description: "This provider is already in your comparison list.", variant: "destructive" });
      return;
    }
    if (comparisonProviders.length >= 4) {
      toast({ title: "Comparison limit reached", description: "You can compare up to 4 providers at a time.", variant: "destructive" });
      return;
    }
    setComparisonProviders((prev) => [...prev, provider]);
    toast({ title: "Added to comparison", description: `${provider.name} added to comparison list.` });
  };

  const handleRemoveFromComparison = (providerId: number) => {
    setComparisonProviders((prev) => prev.filter((p) => p.id !== providerId));
  };

  const handleCompareProviders = () => {
    if (comparisonProviders.length < 2) {
      toast({ title: "Need more providers", description: "Select at least 2 providers to compare.", variant: "destructive" });
      return;
    }
    setShowComparisonModal(true);
  };

  const handleSelectProvider = (provider: Provider) => {
    setShowComparisonModal(false);
    setSelectedProvider(provider);
    setShowProviderModal(true);
  };

  const getResultsText = () => {
    if (isLoading) return "Searching...";
    if (providers.length === 0) return "No providers found";
    return `${totalCount} childcare options found`;
  };

  useEffect(() => {
    document.title = "Find Programs | HappiKid - Childcare & Enrichment Directory";
  }, []);

  return (
    <div className="min-h-screen bg-brand-sage">
      <Navigation />

      {showProfileBanner && (
        <div className="bg-gradient-to-r from-action-teal/10 to-action-clay/10 border-b border-action-teal/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-action-teal/20 rounded-full shrink-0">
                  <Sparkles className="h-4 w-4 text-action-teal" />
                </div>
                <div>
                  <p className="font-medium text-brand-evergreen text-sm">Get personalized matches!</p>
                  <p className="text-text-muted text-xs">Tell us about your family to unlock AI-powered recommendations.</p>
                </div>
              </div>
              <Button
                onClick={() => setShowFamilyProfileWizard(true)}
                onMouseEnter={() => import("@/components/FamilyProfileWizard")}
                size="sm"
                className="bg-action-clay hover:bg-action-clay/90 whitespace-nowrap self-start sm:self-auto"
              >
                Complete Profile <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAreaSummary && (
        <div className="bg-action-teal/5 border-b border-action-teal/15">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <button
              onClick={() => setShowFamilyProfileWizard(true)}
              className="flex items-center gap-2 text-sm text-action-teal hover:text-action-teal/80 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>Searching near <span className="font-medium">{formatAreaLabel(activeAreaLabel!)}</span></span>
              <span className="text-text-muted text-xs ml-1">· Edit</span>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 max-w-5xl mx-auto">
          <ConversationalSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={(query) => { setSearchQuery(query); setTimeout(handleSearch, 100); }}
            currentQuery={searchQuery}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="hidden lg:block lg:w-1/4">
            <SearchFilters filters={filters} onFiltersChange={setFilters} onClearFilters={() => setFilters({})} verifiedPricingCount={verifiedPricingCount} />

            {filters.type === "afterschool" && categories.length > 0 && (
              <div className="mt-6">
                <TaxonomyNavigator
                  categories={categories}
                  selectedCategory={filters.category}
                  selectedSubcategory={filters.subcategory}
                  onCategorySelect={handleCategorySelect}
                />
              </div>
            )}
          </div>

          <div className="lg:w-3/4">
            {searchQuery && providerResponse?.searchMetadata && (
              <SearchInsights metadata={providerResponse.searchMetadata} resultsCount={providers.length} />
            )}

            {debouncedSearchQuery && isLoading && <AIInsightsSkeleton />}

            {debouncedSearchQuery && !isLoading && providerResponse?.aiInsights && (
              <LazyErrorBoundary fallback={<AIInsightsSkeleton />}>
                <AIInsights
                  summary={providerResponse.aiInsights.summary}
                  highlights={providerResponse.aiInsights.highlights || []}
                  followUpSuggestions={providerResponse.aiInsights.followUpSuggestions || []}
                  onFollowUp={(query: string) => { setSearchQuery(query); refetch(); }}
                />
              </LazyErrorBoundary>
            )}

            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-2 border-brand-evergreen/10">
              <div className="lg:hidden mb-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full border-2 border-brand-evergreen/10 text-brand-evergreen">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                      {(filters.type || filters.borough || filters.city || filters.ageRange || filters.priceRange || filters.acceptsSubsidies || filters.verifiedPricing || filters.enrollmentStatus || (filters.features && filters.features.length > 0)) && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-action-teal text-white">Active</span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Narrow Your Search</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <SearchFilters filters={filters} onFiltersChange={setFilters} onClearFilters={() => setFilters({})} verifiedPricingCount={verifiedPricingCount} />
                      {filters.type === "afterschool" && categories.length > 0 && (
                        <div className="mt-6">
                          <TaxonomyNavigator
                            categories={categories}
                            selectedCategory={filters.category}
                            selectedSubcategory={filters.subcategory}
                            onCategorySelect={handleCategorySelect}
                          />
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {filters.type === "afterschool" && categories.length > 0 && (
                <div className="lg:hidden mt-4">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="w-full" data-testid="button-browse-categories-mobile">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Browse 55+ Program Categories
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Browse by Category</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4">
                        <TaxonomyNavigator
                          categories={categories}
                          selectedCategory={filters.category}
                          selectedSubcategory={filters.subcategory}
                          onCategorySelect={handleCategorySelect}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-headline font-bold mb-1 text-brand-evergreen">{getResultsText()}</h2>
                  {searchQuery && <p className="text-sm text-text-muted">for "{searchQuery}"</p>}
                  {!isLoading && verifiedPricingCount !== null && totalCount > 0 && (
                    <p className="text-sm text-text-muted mt-0.5">
                      <span className="text-green-600 font-medium">{verifiedPricingCount}</span>
                      {" "}of {totalCount} have{" "}
                      <button
                        className="underline underline-offset-2 hover:text-action-teal transition-colors"
                        onClick={() => setFilters((prev) => ({ ...prev, verifiedPricing: !prev.verifiedPricing }))}
                        aria-pressed={!!filters.verifiedPricing}
                      >
                        verified pricing
                      </button>
                      {filters.verifiedPricing && (
                        <span className="ml-1 text-action-teal font-medium">· filtered</span>
                      )}
                    </p>
                  )}

                  {filters.category && filters.subcategory && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className="bg-action-teal/20 text-action-teal">
                        {categories.find((c: Category) => c.slug === filters.category)?.name || filters.category}
                      </Badge>
                      <span className="text-text-muted">›</span>
                      <Badge variant="secondary" className="bg-action-teal/20 text-action-teal">
                        {categories.find((c: Category) => c.slug === filters.category)?.subcategories?.find((s) => s.slug === filters.subcategory)?.name || filters.subcategory}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const urlParams = new URLSearchParams(window.location.search);
                          urlParams.delete("category");
                          urlParams.delete("subcategory");
                          window.history.pushState({}, "", `${window.location.pathname}?${urlParams.toString()}`);
                          setFilters((prev) => ({ ...prev, category: undefined, subcategory: undefined }));
                          refetch();
                        }}
                        data-testid="button-clear-category"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowSavedGroupsModal(true)}
                    onMouseEnter={() => import("@/components/FavoritesSectionWithDnd")}
                    className="rounded-lg font-medium border-2 border-brand-evergreen/10 text-action-teal bg-brand-sage"
                  >
                    <Bookmark className="h-4 w-4 mr-2" />
                    My Groups
                    {groupsCount > 0 && (
                      <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-action-teal text-white">{groupsCount}</span>
                    )}
                  </Button>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48 rounded-lg border-2 border-brand-evergreen/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="best-match">Best Match</SelectItem>
                      <SelectItem value="highest-rated">Highest Rated</SelectItem>
                      <SelectItem value="lowest-price">Price: Low to High</SelectItem>
                      <SelectItem value="highest-price">Price: High to Low</SelectItem>
                      <SelectItem value="nearest">Nearest</SelectItem>
                      <SelectItem value="newest">Newest Listings</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex border-2 rounded-lg overflow-hidden border-brand-evergreen/10">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className={`rounded-none ${viewMode === "grid" ? "bg-action-clay text-white" : ""}`}
                      data-testid="button-view-grid"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className={`rounded-none ${viewMode === "list" ? "bg-action-clay text-white" : ""}`}
                      data-testid="button-view-list"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "map" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("map")}
                      className={`rounded-none ${viewMode === "map" ? "bg-action-clay text-white" : ""}`}
                      data-testid="button-view-map"
                    >
                      <Map className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-4 mb-6 border bg-brand-sage border-brand-evergreen/10">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-action-teal" />
                  <span className="text-brand-evergreen font-medium">Verified through public records</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-action-teal" />
                  <span className="text-brand-evergreen font-medium">Real parent reviews</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-action-teal" />
                  <span className="text-brand-evergreen font-medium">Updated for 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-action-teal" />
                  <span className="text-brand-evergreen font-medium">Personalized matching</span>
                </div>
              </div>
            </div>

            {comparisonProviders.length > 0 && (
              <Card className="mb-6 rounded-2xl border bg-brand-sage border-brand-evergreen/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="font-medium text-action-teal">Compare ({comparisonProviders.length})</span>
                      <div className="flex space-x-2">
                        {comparisonProviders.map((provider) => (
                          <Badge
                            key={provider.id}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => handleRemoveFromComparison(provider.id)}
                          >
                            {provider.name} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={handleCompareProviders}
                      onMouseEnter={() => import("@/components/ComparisonModal")}
                      disabled={comparisonProviders.length < 2}
                    >
                      Compare & Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-[4/3] bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoading && providers.length > 0 && (
              viewMode === "map" ? (
                <div className="h-[600px]">
                  <LazyErrorBoundary fallback={
                    <div className="h-full flex items-center justify-center rounded-lg bg-gray-100">
                      <div className="text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action-teal mx-auto mb-3"></div>
                        <p className="text-sm">Loading map…</p>
                      </div>
                    </div>
                  }>
                    <MapView
                      providers={providers}
                      onProviderSelect={handleMapProviderSelect}
                      onLocationSearch={handleLocationSearch}
                      userLocation={userLocation}
                    />
                  </LazyErrorBoundary>
                </div>
              ) : (
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-6"}>
                  {providers.map((provider: any) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      onViewDetails={handleProviderClick}
                      onRequestInfo={handleRequestInfo}
                      onAddToComparison={handleAddToComparison}
                      onRemoveFromComparison={handleRemoveFromComparison}
                      isInComparison={comparisonProviders.some((p) => p.id === provider.id)}
                    />
                  ))}
                </div>
              )
            )}

            {!isLoading && providers.length === 0 && (
              <Card className="text-center py-16 rounded-2xl shadow-lg border-2 border-brand-evergreen/10 bg-white">
                <CardContent>
                  <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-brand-sage">
                    <SearchIcon className="h-10 w-10 text-action-teal" />
                  </div>
                  <h3 className="text-2xl font-headline font-bold mb-3 text-brand-evergreen">No results match your search</h3>
                  <div className="mb-8 space-y-2">
                    <p className="text-lg text-text-muted">Try adjusting age, location, or schedule — or explore nearby neighborhoods.</p>
                    {filters.type && filters.ageRange && (
                      <p className="text-sm rounded-xl p-4 inline-block mt-4 bg-action-sand text-brand-evergreen border-2 border-action-clay">
                        <strong>Tip:</strong> {getTypeLabel(filters.type)} programs typically serve{" "}
                        {filters.type === "daycare" && "infants through preschool age (0-5 years)"}
                        {filters.type === "afterschool" && "school-age children (5+ years)"}
                        {filters.type === "school" && "preschool through elementary age (3-12 years)"}
                        {filters.type === "camp" && "all ages with age-specific programs"}
                        . Try adjusting the age range filter.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      className="rounded-lg px-6 text-white font-semibold bg-action-clay hover:bg-action-clay/90"
                      onClick={() => { setSearchQuery(""); setFilters({}); setCurrentPage(1); refetch(); }}
                    >
                      Clear Filters
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-lg px-6 font-medium border-2 border-brand-evergreen/10 text-action-teal"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition((position) => {
                            handleLocationSearch({ lat: position.coords.latitude, lng: position.coords.longitude, radius: 5 });
                          });
                        }
                      }}
                    >
                      Show Programs Near Me
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isLoading && providers.length > 0 && totalCount > itemsPerPage && (
              <div className="flex flex-col items-center space-y-4 mt-8">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-text-muted">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
                  </span>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => { setItemsPerPage(parseInt(value)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-text-muted">per page</span>
                </div>

                <Pagination>
                  <PaginationContent className="flex-wrap gap-1">
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(3, Math.ceil(totalCount / itemsPerPage)) }, (_, i) => {
                      const totalPages = Math.ceil(totalCount / itemsPerPage);
                      let page: number;
                      if (totalPages <= 3) page = i + 1;
                      else if (currentPage <= 2) page = i + 1;
                      else if (currentPage >= totalPages - 1) page = totalPages - 2 + i;
                      else page = currentPage - 1 + i;

                      return (
                        <PaginationItem key={page} className="hidden sm:inline-flex">
                          <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem className="sm:hidden">
                      <span className="px-3 py-2 text-sm text-text-muted">
                        {currentPage} / {Math.ceil(totalCount / itemsPerPage)}
                      </span>
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(Math.min(Math.ceil(totalCount / itemsPerPage), currentPage + 1))}
                        className={currentPage === Math.ceil(totalCount / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 rounded-3xl p-12 text-center shadow-xl bg-action-clay">
          <h2 className="text-3xl sm:text-4xl font-headline text-white mb-4">Not ready to decide yet?</h2>
          <p className="text-xl text-white/95 mb-8 max-w-2xl mx-auto">
            Save programs, compare options, and get updates — all in one place.
          </p>
          <Button
            size="lg"
            className="rounded-lg px-8 py-6 bg-white font-semibold shadow-lg hover:shadow-2xl transition-all text-lg text-action-clay hover:bg-white/90"
            onClick={() => (window.location.href = "/api/login")}
          >
            Create a free account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      <ContactInquiryModal
        provider={selectedProvider}
        isOpen={showContactModal}
        onClose={() => { setShowContactModal(false); setSelectedProvider(null); }}
      />

      <ProviderModal
        provider={selectedProvider}
        isOpen={showProviderModal}
        onClose={() => { setShowProviderModal(false); setSelectedProvider(null); }}
      />

      {showComparisonModal && (
        <LazyErrorBoundary>
          <ComparisonModal
            providers={comparisonProviders}
            isOpen={showComparisonModal}
            onClose={() => setShowComparisonModal(false)}
            onSelectProvider={handleSelectProvider}
            onRemoveProvider={handleRemoveFromComparison}
            onGroupsSaved={handleGroupsSaved}
          />
        </LazyErrorBoundary>
      )}

      <Dialog open={showSavedGroupsModal} onOpenChange={setShowSavedGroupsModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>My Saved Groups</DialogTitle>
            <DialogDescription>Organize and manage your saved providers in custom groups</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="rounded-2xl border p-4 bg-brand-sage border-brand-evergreen/10">
              <div className="text-sm space-y-2 text-action-teal">
                <p>• <strong>Save individual providers:</strong> Click the ❤️ heart icon on any provider card</p>
                <p>• <strong>Save comparison groups:</strong> Use "Compare & Save" to create provider groups</p>
                <p>• <strong>Launch group comparison:</strong> Click on any group name to load it into the comparison tool</p>
                <p>• <strong>Organize with custom names:</strong> Create groups like "Top 3 Daycares" or "Summer Camp Options"</p>
              </div>
            </div>

            {isAuthenticated ? (
              <LazyErrorBoundary fallback={
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-action-teal"></div>
                </div>
              }>
                <FavoritesSectionWithDnd
                  setSelectedProvider={setSelectedProvider}
                  setShowProviderModal={setShowProviderModal}
                  setComparisonProviders={setComparisonProviders}
                  setShowSavedGroupsModal={setShowSavedGroupsModal}
                  setShowComparisonModal={setShowComparisonModal}
                />
              </LazyErrorBoundary>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">Sign in to save and organize providers in groups</p>
              </div>
            )}

            {comparisonProviders.length > 0 && (
              <div className="rounded-2xl border p-4 bg-brand-sage border-brand-evergreen/10">
                <h4 className="font-medium mb-2 text-action-teal">Current Comparison</h4>
                <p className="text-sm mb-2 text-brand-evergreen">
                  {comparisonProviders.length} provider{comparisonProviders.length !== 1 ? "s" : ""} ready to save as group
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {comparisonProviders.map((provider) => (
                    <Badge key={provider.id} variant="secondary" className="text-xs">{provider.name}</Badge>
                  ))}
                </div>
                <Button
                  size="sm"
                  onClick={() => { setShowSavedGroupsModal(false); setShowComparisonModal(true); }}
                  className="bg-green-600 hover:bg-green-700 w-full"
                >
                  Compare & Save as Group
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {showFamilyProfileWizard && (
        <LazyErrorBoundary>
          <FamilyProfileWizard
            isOpen={showFamilyProfileWizard}
            onClose={() => setShowFamilyProfileWizard(false)}
            onComplete={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/family-profile"] });
              toast({ title: "Profile complete!", description: "We'll now show you personalized matches." });
            }}
          />
        </LazyErrorBoundary>
      )}
    </div>
  );
}
