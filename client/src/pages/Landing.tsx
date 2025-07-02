import Navigation from "@/components/Navigation";
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
  Linkedin
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Provider } from "@shared/schema";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTypeIndex, setCurrentTypeIndex] = useState(0);
  
  const childcareTypes = ["Daycare", "After-School Program", "Summer Camp", "Private School"];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTypeIndex((prev) => (prev + 1) % childcareTypes.length);
    }, 2000); // Change every 2 seconds
    
    return () => clearInterval(interval);
  }, [childcareTypes.length]);

  // Fetch featured providers (limit to 3 for the landing page)
  const { data: featuredProviders, isLoading: providersLoading } = useQuery<Provider[]>({
    queryKey: ['/api/providers', { limit: 3 }],
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      setLocation("/search");
    }
  };

  const handleQuickFilter = (type: string) => {
    setLocation(`/search?type=${type}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Function to get relative cost level based on provider type and characteristics
  const getCostLevel = (provider: Provider) => {
    // Assign relative cost based on typical pricing patterns
    let dollarSigns = 2; // Default to moderate cost
    
    if (provider.name.includes('Bright Horizons')) dollarSigns = 4; // Premium national chain
    else if (provider.name.includes('Learning Experience')) dollarSigns = 3; // Mid-premium franchise
    else if (provider.name.includes('Little Sunshine')) dollarSigns = 2; // Moderate local
    else if (provider.name.includes('Montessori')) dollarSigns = 3; // Typically higher due to specialized curriculum
    else if (provider.name.includes('Bronx Academy')) dollarSigns = 4; // Private school premium
    else if (provider.name.includes('Camp')) dollarSigns = 2; // Summer camps typically moderate
    
    return dollarSigns;
  };

  // Function to render cost display
  const renderCostDisplay = (provider: Provider) => {
    if (provider.monthlyPrice) {
      return (
        <>
          <span className="text-2xl font-bold text-gray-900">${provider.monthlyPrice}</span>
          <span className="text-gray-600">/month</span>
        </>
      );
    }
    
    const dollarSigns = getCostLevel(provider);
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span 
            key={i} 
            className={`text-sm font-semibold ${i <= dollarSigns ? 'text-primary' : 'text-gray-300'}`}
          >
            $
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 text-center">
              <div className="flex flex-col items-center space-y-1">
                <div>Find The Perfect</div>
                <div className="text-primary relative text-center" style={{ height: '1.2em', minWidth: '280px' }}>
                  {childcareTypes.map((type, index) => (
                    <span 
                      key={type} 
                      className={`absolute left-1/2 top-0 transform -translate-x-1/2 transition-opacity duration-300 ease-in-out whitespace-nowrap ${
                        index === currentTypeIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{ height: '1.2em', lineHeight: '1.2' }}
                    >
                      {type}
                    </span>
                  ))}
                </div>
                <div>For Your Family</div>
              </div>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Discover daycares, after-school programs, camps, and private schools in the NYC tri-state area. 
              Make confident decisions in minutes, not hours.
            </p>

            {/* Natural Language Search */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Try: 'Montessori daycare near Central Park' or 'After-school programs in Brooklyn'"
                  className="w-full pl-14 pr-32 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-primary h-16 shadow-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button 
                  className="absolute right-2 top-2 px-6 py-2 rounded-xl font-medium h-12"
                  onClick={handleSearch}
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <Button
                variant="outline"
                className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-full border border-gray-200 font-medium"
                onClick={() => handleQuickFilter("daycare")}
              >
                <Baby className="h-4 w-4 mr-2" />
                Daycare Centers
              </Button>
              <Button
                variant="outline"
                className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-full border border-gray-200 font-medium"
                onClick={() => handleQuickFilter("afterschool")}
              >
                <School className="h-4 w-4 mr-2" />
                After-School Programs
              </Button>
              <Button
                variant="outline"
                className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-full border border-gray-200 font-medium"
                onClick={() => handleQuickFilter("camp")}
              >
                <TreePine className="h-4 w-4 mr-2" />
                Summer Camps
              </Button>
              <Button
                variant="outline"
                className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-full border border-gray-200 font-medium"
                onClick={() => handleQuickFilter("school")}
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Private Schools
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 inline-block">
                  <Shield className="h-8 w-8 text-secondary-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Verified Providers</h3>
                <p className="text-gray-600">All providers verified through public records and background checks</p>
              </div>
              <div className="text-center">
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 inline-block">
                  <MessageCircle className="h-8 w-8 text-accent-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Real Parent Reviews</h3>
                <p className="text-gray-600">Honest feedback from parents who've been there</p>
              </div>
              <div className="text-center">
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 inline-block">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Save Time</h3>
                <p className="text-gray-600">Find the right fit in minutes, not hours of research</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Providers Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Providers</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Top-rated childcare providers in the NYC tri-state area
            </p>
          </div>

          {providersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-24"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredProviders?.map((provider, index) => (
                <Card key={provider.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
                    <img
                      src={
                        provider.name.includes('Bright Horizons') 
                          ? "https://images.unsplash.com/photo-1622737133809-d95047b9e673?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" // Modern daycare classroom
                          : provider.name.includes('Learning Experience') 
                          ? "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" // Children learning activities
                          : provider.name.includes('Little Sunshine') 
                          ? "https://images.unsplash.com/photo-1616400619175-5beda3a17896?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" // Happy young children
                          : provider.name.includes('Montessori') 
                          ? "https://images.unsplash.com/photo-1502781252888-9143ba7f074e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" // Educational toys and materials
                          : provider.name.includes('Bronx Academy') 
                          ? "https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" // After school study time
                          : provider.name.includes('Camp') 
                          ? "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" // Summer camp outdoor fun
                          : "https://images.unsplash.com/photo-1622737133809-d95047b9e673?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" // Default
                      }
                      alt={provider.name}
                      className="w-full h-full object-cover"
                    />
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
                      <Badge variant="secondary">Ages {provider.ageRangeMin}-{provider.ageRangeMax}</Badge>
                      <Badge variant="outline">{provider.type}</Badge>
                      {provider.features?.slice(0, 2).map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        {renderCostDisplay(provider)}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => setLocation(`/search?provider=${provider.id}`)}
                        className="shrink-0"
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button size="lg" onClick={() => setLocation("/search")}>
              View All Providers
            </Button>
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
    </div>
  );
}
