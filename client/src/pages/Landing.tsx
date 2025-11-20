import Navigation from "@/components/Navigation";
import ProviderModal from "@/components/ProviderModal";
import RoleSelectionModal from "@/components/RoleSelectionModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  Search, 
  Shield, 
  MessageCircle, 
  Clock,
  Baby,
  School,
  TreePine,
  GraduationCap,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Star,
  BookOpen,
  Smile,
  Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Provider } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTypeIndex, setCurrentTypeIndex] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const childcareTypes = ["Daycare", "After-School Program", "Summer Camp", "Private School"];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTypeIndex((prev) => (prev + 1) % childcareTypes.length);
    }, 2000); // Change every 2 seconds
    
    return () => clearInterval(interval);
  }, [childcareTypes.length]);

  // Fetch featured providers (limit to 6 for the landing page)
  const { data: featuredProviders, isLoading: providersLoading } = useQuery<Provider[]>({
    queryKey: ['/api/providers/featured', { limit: 6 }],
  });

  // Fetch total provider count for homepage display
  const { data: totalCount } = useQuery<{count: number}>({
    queryKey: ['/api/providers/stats'],
  });

  // Create a reusable favorite toggle handler
  const handleFavoriteToggle = (provider: Provider) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to save favorites.",
        action: (
          <Button 
            size="sm" 
            onClick={() => window.location.href = '/api/login'}
            className="ml-2"
          >
            Sign In
          </Button>
        ),
        duration: 5000,
      });
      return;
    }
    // For now, just show the authentication prompt - we'll implement the mutation later
    toast({
      title: "Feature coming soon",
      description: "Favorites will be available after you sign in.",
    });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      setLocation("/search");
    }
  };

  const handleViewDetails = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const handleFeatureClick = (feature: string) => {
    // Navigate to search with the feature as a filter
    setLocation(`/search?features=${encodeURIComponent(feature)}`);
  };

  const handleCostClick = (provider: Provider) => {
    const costRange = getCostRange(provider);
    const costLevel = getCostLevel(provider, costRange);
    // Navigate to search with cost level filter
    setLocation(`/search?cost=${encodeURIComponent(costLevel)}`);
  };

  const handleAgeClick = (provider: Provider) => {
    // Navigate to search with age range filter based on the provider's min age
    const ageInYears = Math.floor(provider.ageRangeMin / 12);
    
    let ageGroupValue;
    if (ageInYears < 1) {
      ageGroupValue = "infants";
    } else if (ageInYears < 3) {
      ageGroupValue = "toddlers";
    } else if (ageInYears < 5) {
      ageGroupValue = "preschool";
    } else {
      ageGroupValue = "school-age";
    }
    
    setLocation(`/search?ageRange=${ageGroupValue}`);
  };

  const handleTypeClick = (type: string) => {
    // Navigate to search with provider type filter
    setLocation(`/search?type=${encodeURIComponent(type)}`);
  };

  const handleQuickFilter = (type: string) => {
    setLocation(`/search?type=${type}`);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      daycare: "Daycare",
      afterschool: "After-School Program",
      camp: "Summer Camp",
      school: "Private School",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Function to get relative cost level based on calculated price range midpoint
  const getCostLevel = (provider: Provider, costRange: {min: number, max: number}) => {
    // Calculate $$ meter based on the midpoint of the estimated cost range
    // This provides a visual indicator of relative affordability
    const midpoint = (costRange.min + costRange.max) / 2;
    
    // Define thresholds for $$ meter (1-5 dollar signs)
    // Based on typical NYC childcare pricing ranges
    if (midpoint <= 1500) return 1;      // $ (most affordable)
    else if (midpoint <= 2200) return 2; // $$
    else if (midpoint <= 2900) return 3; // $$$
    else if (midpoint <= 3600) return 4; // $$$$
    else return 5;                       // $$$$$ (premium)
  };

  // Function to get cost range based on provider characteristics
  const getCostRange = (provider: Provider) => {
    // Generate realistic cost ranges based on provider type and location
    const typeRanges = {
      daycare: { min: 1800, max: 3500 },
      afterschool: { min: 800, max: 1500 },
      camp: { min: 1200, max: 2000 },
      school: { min: 2500, max: 4500 }
    };
    
    const baseRange = typeRanges[provider.type as keyof typeof typeRanges] || typeRanges.daycare;
    
    // Adjust based on borough (Manhattan premium, others slightly lower)
    let multiplier = 1.0;
    if (provider.borough === 'Manhattan') multiplier = 1.2;
    else if (provider.borough === 'Brooklyn') multiplier = 1.0;
    else if (provider.borough === 'Queens') multiplier = 0.9;
    else if (provider.borough === 'Bronx') multiplier = 0.8;
    else if (provider.borough === 'Staten Island') multiplier = 0.85;
    
    const min = Math.round(baseRange.min * multiplier);
    const max = Math.round(baseRange.max * multiplier);
    
    return { min, max };
  };

  // Function to render cost display
  const renderCostDisplay = (provider: Provider) => {
    // Use actual price range from database if available
    const hasDbPriceRange = provider.monthlyPriceMin && provider.monthlyPriceMax;
    const costRange = hasDbPriceRange ? 
      { min: Number(provider.monthlyPriceMin), max: Number(provider.monthlyPriceMax) } :
      getCostRange(provider);
    
    const dollarSigns = getCostLevel(provider, costRange);
    
    // Always show the $$ meter first (more compact spacing)
    const dollarMeter = (
      <div className="flex items-center gap-0.5 mb-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span 
            key={i} 
            className={`text-xs font-semibold ${i <= dollarSigns ? 'text-primary' : 'text-gray-300'}`}
          >
            $
          </span>
        ))}
      </div>
    );
    
    // Always show the full price range (never single price)
    return (
      <div className="text-left">
        {dollarMeter}
        <div className="text-xs text-gray-600 leading-tight">
          ${costRange.min.toLocaleString()} - ${costRange.max.toLocaleString()}/mo
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen gradient-warm">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Playful header badge */}
            <div className="mb-8">
              <div className="inline-flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg mb-4">
                <Sparkles className="h-5 w-5 text-accent-500" />
                <span className="text-sm font-semibold text-gray-700">AI-Powered Childcare Discovery</span>
                <Heart className="h-5 w-5 text-coral-500" />
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 text-shadow-soft">
              <div className="flex flex-col items-center space-y-2">
                <div>Find the <span className="text-primary-500">perfect</span></div>
                <div className="text-coral-500 relative text-center w-full" style={{ height: '1.2em', minHeight: '1.2em' }}>
                  {childcareTypes.map((type, index) => (
                    <span 
                      key={type} 
                      className={`absolute left-1/2 top-0 transform -translate-x-1/2 transition-all duration-500 ease-in-out ${
                        index === currentTypeIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                      }`}
                      style={{ height: '1.2em', lineHeight: '1.2' }}
                    >
                      <span className="whitespace-nowrap">{type}</span> ✨
                    </span>
                  ))}
                </div>
                <div>for your <span className="text-secondary-500">little ones</span></div>
              </div>
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-6 leading-relaxed">
              Discover daycares, after-school programs, camps, and private schools in the NYC tri-state area. 
              Make confident decisions in <span className="font-semibold text-primary-600">minutes, not hours</span>.
            </p>
            {totalCount && (
              <div className="mb-10">
                <div className="inline-flex flex-wrap items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-lg max-w-full">
                  <BookOpen className="h-4 sm:h-5 w-4 sm:w-5 text-primary-500 mr-2" />
                  <span className="text-sm sm:text-lg text-gray-700">We've done the homework — </span>
                  <span className="text-primary-600 text-xl sm:text-2xl font-bold mx-1 sm:mx-2">{totalCount.count.toLocaleString()}+</span>
                  <span className="text-sm sm:text-lg text-gray-700"> trusted programs across NY, NJ & CT</span>
                  <Smile className="h-4 sm:h-5 w-4 sm:w-5 text-accent-500 ml-2" />
                </div>
              </div>
            )}

            {/* Playful AI Search Bar */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <Search className="h-6 w-6 text-primary-400" />
                </div>
                <Input
                  type="text"
                  placeholder={`"Find a ${childcareTypes[currentTypeIndex]} with outdoor play areas..."`}
                  className="w-full pl-16 pr-36 py-6 text-lg border-2 border-white/60 bg-white/90 backdrop-blur-sm rounded-3xl focus:border-primary-400 focus:ring-primary-400 focus:bg-white shadow-xl placeholder:text-gray-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 btn-pill bg-primary-500 hover:bg-primary-600 text-white shadow-lg"
                  onClick={handleSearch}
                >
                  Just Ask! 🚀
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-3 italic">
                Try: "Montessori daycare with early drop-off" or "STEM summer camps for 8-year-olds"
              </p>
            </div>

            {/* Playful Quick Filters */}
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              <Button
                variant="outline"
                className="bg-white/90 hover:bg-primary-50 hover:border-primary-300 text-gray-700 hover:text-primary-700 px-6 py-3 rounded-full border-2 border-white/60 font-semibold shadow-lg transition-all transform hover:scale-105 backdrop-blur-sm"
                onClick={() => handleQuickFilter("daycare")}
              >
                <Baby className="h-5 w-5 mr-2 text-coral-500" />
                Daycare Centers
              </Button>
              <Button
                variant="outline"
                className="bg-white/90 hover:bg-secondary-50 hover:border-secondary-300 text-gray-700 hover:text-secondary-700 px-6 py-3 rounded-full border-2 border-white/60 font-semibold shadow-lg transition-all transform hover:scale-105 backdrop-blur-sm"
                onClick={() => handleQuickFilter("afterschool")}
              >
                <School className="h-5 w-5 mr-2 text-secondary-500" />
                After-School Programs
              </Button>
              <Button
                variant="outline"
                className="bg-white/90 hover:bg-accent-50 hover:border-accent-300 text-gray-700 hover:text-accent-700 px-6 py-3 rounded-full border-2 border-white/60 font-semibold shadow-lg transition-all transform hover:scale-105 backdrop-blur-sm"
                onClick={() => handleQuickFilter("camp")}
              >
                <TreePine className="h-5 w-5 mr-2 text-accent-600" />
                Summer Camps
              </Button>
              <Button
                variant="outline"
                className="bg-white/90 hover:bg-primary-50 hover:border-primary-300 text-gray-700 hover:text-primary-700 px-6 py-3 rounded-full border-2 border-white/60 font-semibold shadow-lg transition-all transform hover:scale-105 backdrop-blur-sm"
                onClick={() => handleQuickFilter("school")}
              >
                <GraduationCap className="h-5 w-5 mr-2 text-primary-500" />
                Private Schools
              </Button>
            </div>
            
            {/* Browse After-School Programs by Category Link */}
            <div className="text-center mb-12">
              <button
                onClick={() => setLocation("/after-school-programs")}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm hover:underline transition-colors inline-flex items-center gap-2"
                data-testid="button-browse-programs"
              >
                📚 Or browse after-school programs by category (55+ types) →
              </button>
            </div>

            {/* Trust Indicators - Playful Style */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center group">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-lg mb-4 inline-block transition-all group-hover:scale-105 group-hover:shadow-xl border border-secondary-100">
                  <Shield className="h-10 w-10 text-secondary-500" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">🛡️ Verified Providers</h3>
                <p className="text-gray-700 leading-relaxed">All providers verified through public records and background checks</p>
              </div>
              <div className="text-center group">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-lg mb-4 inline-block transition-all group-hover:scale-105 group-hover:shadow-xl border border-accent-100">
                  <MessageCircle className="h-10 w-10 text-accent-500" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">💬 Real Parent Reviews</h3>
                <p className="text-gray-700 leading-relaxed">Honest feedback from parents who've been there</p>
              </div>
              <div className="text-center group">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-lg mb-4 inline-block transition-all group-hover:scale-105 group-hover:shadow-xl border border-primary-100">
                  <Clock className="h-10 w-10 text-primary-500" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">⚡ Save Time</h3>
                <p className="text-gray-700 leading-relaxed">Find the right fit in minutes, not hours of research</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Providers Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-primary-50 rounded-full px-6 py-3 mb-6">
              <Star className="h-5 w-5 text-primary-500" />
              <span className="text-sm font-semibold text-primary-700">Top-Rated Providers</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 text-shadow-soft">Featured Providers ⭐</h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Discover <span className="font-semibold text-primary-600">trusted childcare providers</span> in the NYC tri-state area
            </p>
          </div>

          {providersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, index) => (
                <Card key={index} className="card-playful animate-pulse">
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary-100 to-secondary-100 rounded-t-2xl"></div>
                  <CardContent className="p-6">
                    <div className="h-6 bg-gray-200 rounded-full mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded-full mb-3 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded-full mb-4 w-1/2"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-8 bg-gray-200 rounded-full w-20"></div>
                      <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredProviders?.map((provider, index) => (
                <Card 
                  key={provider.id} 
                  className="card-playful cursor-pointer transition-all transform hover:scale-105 group"
                  onClick={() => handleViewDetails(provider)}
                >
                  <div className="aspect-[4/3] relative overflow-hidden rounded-t-2xl group-hover:opacity-90 transition-all">
                    <img
                      src={
                        provider.name.includes('Bright Horizons') 
                          ? "https://images.pexels.com/photos/8613311/pexels-photo-8613311.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" // Children in modern daycare
                          : provider.name.includes('Learning Experience') 
                          ? "https://images.pexels.com/photos/8613097/pexels-photo-8613097.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" // Children in classroom setting
                          : provider.name.includes('Little Sunshine') 
                          ? "https://images.pexels.com/photos/8613179/pexels-photo-8613179.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" // Happy children playing
                          : provider.name.includes('Montessori') 
                          ? "https://images.pexels.com/photos/8613106/pexels-photo-8613106.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" // Children with Montessori materials
                          : provider.name.includes('Bronx Academy') 
                          ? "https://images.pexels.com/photos/8613090/pexels-photo-8613090.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" // Children after school learning
                          : provider.name.includes('Camp') 
                          ? "https://images.pexels.com/photos/8613068/pexels-photo-8613068.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" // Children summer camp activities
                          : "https://images.pexels.com/photos/8613311/pexels-photo-8613311.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" // Default children
                      }
                      alt={provider.name}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg backdrop-blur-sm transition-all hover:scale-110"
                      onClick={handleFavoriteToggle(provider)}
                    >
                      <Heart 
                        className="h-4 w-4 text-coral-500 hover:text-coral-600" 
                      />
                    </Button>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{provider.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{provider.borough}, NYC</p>
                    
                    <div className="flex items-center mb-3">
                      <div className="flex items-center mr-2">
                        {[...Array(5)].map((_, i) => {
                          const rating = Number(provider.rating || 0);
                          const fullStars = Math.floor(rating);
                          const partialStar = rating - fullStars;
                          
                          if (i < fullStars) {
                            return <span key={i} className="text-yellow-400">★</span>;
                          } else if (i === fullStars && partialStar > 0) {
                            return (
                              <span key={i} className="relative">
                                <span className="text-gray-500">★</span>
                                <span 
                                  className="absolute left-0 top-0 text-yellow-400 overflow-hidden"
                                  style={{ width: `${partialStar * 100}%` }}
                                >
                                  ★
                                </span>
                              </span>
                            );
                          } else {
                            return <span key={i} className="text-gray-500">★</span>;
                          }
                        })}
                      </div>
                      <span className="text-sm text-gray-600">
                        {provider.rating || 'New'} ({provider.reviewCount || 0} reviews)
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge 
                        variant="secondary"
                        className="cursor-pointer bg-primary-100 text-primary-700 hover:bg-primary-200 border-0 rounded-full font-medium transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAgeClick(provider);
                        }}
                      >
                        Ages {Math.floor(provider.ageRangeMin / 12)}+
                      </Badge>
                      <Badge 
                        variant="outline"
                        className="cursor-pointer bg-secondary-50 text-secondary-700 border-secondary-200 hover:bg-secondary-100 rounded-full font-medium transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTypeClick(provider.type);
                        }}
                      >
                        {getTypeLabel(provider.type)}
                      </Badge>
                      {provider.features?.slice(0, 2).map((feature) => (
                        <Badge 
                          key={feature} 
                          variant="outline" 
                          className="text-xs cursor-pointer bg-accent-50 text-accent-700 border-accent-200 hover:bg-accent-100 rounded-full font-medium transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFeatureClick(feature);
                          }}
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex justify-between items-center">
                      <div 
                        className="cursor-pointer hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCostClick(provider);
                        }}
                      >
                        {renderCostDisplay(provider)}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(provider);
                        }}
                        className="shrink-0 btn-pill bg-primary-500 hover:bg-primary-600 text-white shadow-md"
                      >
                        Learn More ✨
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-16">
            <Button 
              size="lg" 
              onClick={() => setLocation("/search")}
              className="btn-pill bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-xl px-8 py-4 text-lg font-semibold"
            >
              Explore All 700+ Providers 🚀
            </Button>
            <p className="text-gray-600 mt-4 italic">
              Find your perfect match in minutes, not hours
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="md:col-span-1">
              <div className="flex items-center mb-4">
                <Heart className="h-6 w-6 text-primary mr-2" />
                <span className="text-xl font-bold">HappiKid</span>
              </div>
              <p className="text-gray-400 mb-4">
                The trusted platform for finding quality childcare in the NYC tri-state area.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* For Parents */}
            <div>
              <h3 className="font-semibold text-white mb-4">For Parents</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Find Childcare</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Compare Providers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Parent Reviews</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Safety & Licensing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Childcare Resources</a></li>
              </ul>
            </div>

            {/* For Providers */}
            <div>
              <h3 className="font-semibold text-white mb-4">For Providers</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">List Your Program</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Provider Dashboard</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Marketing Tools</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Premium Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Success Stories</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 HappiKid. All rights reserved.
              </p>
              <p className="text-gray-400 text-sm mt-4 md:mt-0">
                Serving the NYC Tri-State Area
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Provider Modal */}
      <ProviderModal 
        provider={selectedProvider}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      
      {/* Role Selection Modal */}
      <RoleSelectionModal 
        isOpen={showRoleSelection}
        onClose={() => setShowRoleSelection(false)}
      />
    </div>
  );
}
