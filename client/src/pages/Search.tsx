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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Grid, List, Search as SearchIcon, Bookmark, Heart, Plus, Edit, Trash2, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Provider } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Inline FavoritesSection component
function FavoritesSection() {
  const { data: favorites } = useQuery({
    queryKey: ["/api/favorites"],
    enabled: true,
  });

  return (
    <div className="space-y-3">
      {!favorites || favorites.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <Heart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">No favorite providers yet</p>
          <p className="text-gray-500 text-xs">Click the ❤️ on provider cards to save them</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {favorites.map((favorite: any) => (
            <div key={favorite.providerId} className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{favorite.provider.name}</h4>
                  <p className="text-sm text-gray-600">{favorite.provider.borough}</p>
                  <p className="text-xs text-gray-500">
                    Saved {new Date(favorite.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {favorite.provider.type}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [showSavedGroupsModal, setShowSavedGroupsModal] = useState(false);

  // Get search params from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    const type = urlParams.get('type');
    const features = urlParams.get('features');
    const cost = urlParams.get('cost');
    const ageRange = urlParams.get('ageRange');
    
    if (q) {
      setSearchQuery(q);
    }
    if (type) {
      setFilters(prev => ({ ...prev, type }));
    }
    if (features) {
      // Split features by comma and set as array
      setFilters(prev => ({ ...prev, features: features.split(',') }));
    }
    if (cost) {
      // Map cost level to price range
      const costToPrice: { [key: string]: string } = {
        '1': '0-1000',
        '2': '1000-2000', 
        '3': '2000-3000',
        '4': '3000+',
        '5': '3000+'
      };
      setFilters(prev => ({ ...prev, priceRange: costToPrice[cost] }));
    }
    if (ageRange) {
      setFilters(prev => ({ ...prev, ageRange }));
    }
  }, []);

  // Fetch providers
  const { data: providers = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/providers', { 
      search: searchQuery,
      type: filters.type,
      borough: filters.borough,
      ageRange: filters.ageRange, // Send age range to backend
      features: filters.features?.join(','),
      priceRange: filters.priceRange,
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
              className="w-full pl-12 pr-28 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 rounded-lg font-medium h-[calc(100%-16px)] flex items-center justify-center"
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
                <Button
                  variant="outline"
                  onClick={() => setShowSavedGroupsModal(true)}
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Saved Groups
                </Button>
                
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
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    onViewDetails={handleProviderClick}
                    onRequestInfo={handleRequestInfo}
                    onAddToComparison={handleAddToComparison}
                  />
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
        onRemoveProvider={handleRemoveFromComparison}
      />

      {/* Saved Groups Dialog */}
      <Dialog open={showSavedGroupsModal} onOpenChange={setShowSavedGroupsModal}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>My Saved Providers & Groups</DialogTitle>
          </DialogHeader>
          
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Individual Favorites */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Heart className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold">Favorite Providers</h3>
              </div>
              
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                <div className="text-sm text-pink-700 space-y-1">
                  <p>• Click the ❤️ heart icon on any provider card to save it to your favorites</p>
                  <p>• Organize favorites into custom groups for easy access</p>
                  <p>• Perfect for keeping track of providers you want to remember</p>
                </div>
              </div>

              {isAuthenticated ? (
                <FavoritesSection />
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <Heart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Sign in to save favorite providers</p>
                </div>
              )}
            </div>

            {/* Saved Comparisons */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Bookmark className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Saved Comparisons</h3>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Add providers to comparison using "Add to Comparison" buttons</p>
                  <p>• Open comparison modal and save your comparison groups</p>
                  <p>• Perfect for side-by-side evaluation of multiple providers</p>
                </div>
              </div>

              {isAuthenticated ? (
                <>
                  {/* Current Comparison Preview */}
                  {comparisonProviders.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h4 className="font-medium text-green-800 mb-2">Current Comparison</h4>
                      <p className="text-sm text-green-700 mb-2">
                        {comparisonProviders.length} provider{comparisonProviders.length !== 1 ? 's' : ''} ready to save
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {comparisonProviders.map((provider) => (
                          <Badge key={provider.id} variant="secondary" className="text-xs">
                            {provider.name}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setShowSavedGroupsModal(false);
                          setShowComparisonModal(true);
                        }}
                        className="bg-green-600 hover:bg-green-700 w-full"
                      >
                        Open Comparison to Save
                      </Button>
                    </div>
                  )}

                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <Bookmark className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">No saved comparison groups yet</p>
                    <p className="text-gray-500 text-xs">Add providers to comparison first</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <Bookmark className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Sign in to save comparison groups</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
