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
import { useState } from "react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Find Perfect <span className="text-primary">Childcare</span>
              <br />for Your Family
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
                  placeholder="Try: 'Montessori daycare near Central Park for 3-year-old' or 'After-school programs with pickup in Brooklyn'"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Little Scholars Montessori",
                location: "Upper East Side, Manhattan",
                rating: "4.9",
                reviews: "47",
                type: "Montessori",
                ages: "2-6",
                price: "$2,400",
                features: ["Organic Meals", "Small Classes"],
              },
              {
                name: "Rainbow Bridge Academy",
                location: "Midtown West, Manhattan",
                rating: "4.7",
                reviews: "23",
                type: "Arts Focus",
                ages: "3-5",
                price: "$2,100",
                features: ["Bilingual", "Extended Hours"],
              },
              {
                name: "Central Park Kids Club",
                location: "Upper West Side, Manhattan",
                rating: "4.8",
                reviews: "31",
                type: "Outdoor Focus",
                ages: "1-6",
                price: "$2,800",
                features: ["Extended Hours", "Transportation"],
              },
            ].map((provider, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
                  <img
                    src={`https://images.unsplash.com/photo-${
                      index === 0 
                        ? "1576085898323-218337e3e43c" 
                        : index === 1 
                        ? "1503454537195-1dcabb73ffb9" 
                        : "1578662996442-48f60103fc96"
                    }?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400`}
                    alt={provider.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{provider.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{provider.location}</p>
                  
                  <div className="flex items-center mb-3">
                    <div className="flex items-center mr-2">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-yellow-400 ${i < Math.floor(Number(provider.rating)) ? '★' : '☆'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {provider.rating} ({provider.reviews} reviews)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">Ages {provider.ages}</Badge>
                    <Badge variant="outline">{provider.type}</Badge>
                    {provider.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">{provider.price}</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <Button size="sm" onClick={() => setLocation("/search")}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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
