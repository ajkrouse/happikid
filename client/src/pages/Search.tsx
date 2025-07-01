import Navigation from "@/components/Navigation";
import ProviderCard from "@/components/ProviderCard";
import SearchFilters from "@/components/SearchFilters";
import ProviderModal from "@/components/ProviderModal";
import ComparisonModal from "@/components/ComparisonModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Grid, List, Search as SearchIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Provider } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function SearchPage() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    type?: string;
    borough?: string;
    ageRange?: string;
    priceRange?: string;
    features?: string[];
  }>({});
  const [sortBy, setSortBy] = useState("best-match");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Modal state
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [comparisonProviders, setComparisonProviders] = useState<Provider[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Get search params from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    const type = urlParams.get('type');
    
    if (q) {
      setSearchQuery(q);
    }
    if (type) {
      setFilters(prev => ({ ...prev, type }));
    }
  }, []);

  // Fetch providers
  const { data: providers = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/providers', { 
      search: searchQuery,
      type: filters.type,
      borough: filters.borough,
      // Convert age range and price range to query params
      limit: 20,
      offset: 0,
    }],
  });

  // Fetch favorites if authenticated
  const { data: favorites = [] } = useQuery({
    queryKey: ['/api/favorites'],
    enabled: isAuthenticated,
  });

  const favoriteProviderIds = favorites.map((fav: any) => fav.provider?.id || fav.providerId);

  const handleSearch = () => {
    refetch();
  };

  const handleProviderClick = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowProviderModal(true);
  };

  const handleRequestInfo = (provider: Provider) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to request information.",
        variant: "destructive",
      });
      return;
    }
    setSelectedProvider(provider);
    setShowProviderModal(true);
  };

  const handleAddToComparison = (provider: Provider) => {
    if (comparisonProviders.find(p => p.id === provider.id)) {
      toast({
        title: "Already in comparison",
        description: "This provider is already in your comparison list.",
        variant: "destructive",
      });
      return;
    }
    
    if (comparisonProviders.length >= 4) {
      toast({
        title: "Comparison limit reached",
        description: "You can compare up to 4 providers at a time.",
        variant: "destructive",
      });
      return;
    }

    setComparisonProviders(prev => [...prev, provider]);
    toast({
      title: "Added to comparison",
      description: `${provider.name} added to comparison list.`,
    });
  };

  const handleRemoveFromComparison = (providerId: number) => {
    setComparisonProviders(prev => prev.filter(p => p.id !== providerId));
  };

  const handleCompareProviders = () => {
    if (comparisonProviders.length < 2) {
      toast({
        title: "Need more providers",
        description: "Select at least 2 providers to compare.",
        variant: "destructive",
      });
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
    const count = providers.length;
    const searchText = searchQuery ? ` for "${searchQuery}"` : "";
    const filterText = filters.type ? ` in ${filters.type}` : "";
    return `${count} childcare option${count !== 1 ? 's' : ''} found${searchText}${filterText}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search for childcare providers..."
              className="w-full pl-12 pr-6 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              className="absolute right-2 top-2 px-6 py-1 rounded-lg font-medium"
              onClick={handleSearch}
            >
              Search
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <SearchFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={() => setFilters({})}
            />
          </div>

          {/* Results */}
          <div className="lg:w-3/4">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{getResultsText()}</h2>
                {searchQuery && (
                  <p className="text-gray-600 mt-1">for "{searchQuery}"</p>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best-match">Best Match</SelectItem>
                    <SelectItem value="highest-rated">Highest Rated</SelectItem>
                    <SelectItem value="lowest-price">Lowest Price</SelectItem>
                    <SelectItem value="nearest">Nearest</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Comparison Bar */}
            {comparisonProviders.length > 0 && (
              <Card className="mb-6 bg-primary-50 border-primary-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="font-medium text-primary-800">
                        Compare ({comparisonProviders.length})
                      </span>
                      <div className="flex space-x-2">
                        {comparisonProviders.map(provider => (
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
                      disabled={comparisonProviders.length < 2}
                    >
                      Compare Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
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

            {/* Provider Grid */}
            {!isLoading && providers.length > 0 && (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 gap-6" 
                : "space-y-6"
              }>
                {providers.map((provider: Provider) => (
                  <div key={provider.id} className="relative">
                    <ProviderCard
                      provider={provider}
                      onViewDetails={handleProviderClick}
                      onRequestInfo={handleRequestInfo}
                    />
                    
                    {/* Quick action buttons */}
                    <div className="absolute top-2 left-2 flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToComparison(provider);
                        }}
                        className="bg-white/90 hover:bg-white text-xs"
                      >
                        Compare
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && providers.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <SearchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No providers found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria or filters to find more options.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("");
                      setFilters({});
                      refetch();
                    }}
                  >
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Provider Detail Modal */}
      <ProviderModal
        provider={selectedProvider}
        isOpen={showProviderModal}
        onClose={() => {
          setShowProviderModal(false);
          setSelectedProvider(null);
        }}
      />

      {/* Comparison Modal */}
      <ComparisonModal
        providers={comparisonProviders}
        isOpen={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        onSelectProvider={handleSelectProvider}
      />
    </div>
  );
}
