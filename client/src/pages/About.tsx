import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Shield, 
  Users, 
  Clock, 
  Search, 
  MessageCircle,
  Star,
  ChevronRight
} from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            About <span className="text-primary">HappiKid</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're transforming how families find quality childcare in the NYC tri-state area. 
            Our mission is to make the overwhelming process of choosing childcare simple, transparent, and confident.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                Every parent deserves to find the perfect childcare for their family without the stress, 
                endless research, and uncertainty that typically comes with the process.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                HappiKid centralizes verified provider information, real parent reviews, and smart search 
                technology to help you make confident decisions in minutes, not hours.
              </p>
              <div className="flex items-center text-primary font-semibold">
                <Heart className="h-5 w-5 mr-2" />
                <span>Making childcare discovery joyful for families</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card className="text-center p-6">
                <div className="bg-primary-100 p-4 rounded-full inline-block mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">1,000+</h3>
                <p className="text-gray-600 text-sm">Verified Providers</p>
              </Card>
              <Card className="text-center p-6">
                <div className="bg-secondary-100 p-4 rounded-full inline-block mb-4">
                  <MessageCircle className="h-8 w-8 text-secondary-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">5,000+</h3>
                <p className="text-gray-600 text-sm">Parent Reviews</p>
              </Card>
              <Card className="text-center p-6">
                <div className="bg-accent-100 p-4 rounded-full inline-block mb-4">
                  <Clock className="h-8 w-8 text-accent-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">90%</h3>
                <p className="text-gray-600 text-sm">Time Saved</p>
              </Card>
              <Card className="text-center p-6">
                <div className="bg-primary-100 p-4 rounded-full inline-block mb-4">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">4.9</h3>
                <p className="text-gray-600 text-sm">Average Rating</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Area Map */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Serving the NYC Tri-State Area</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive childcare coverage across New York City, Long Island, Westchester, and Northern New Jersey
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              {/* Animated NYC Tri-State Map */}
              <div className="bg-white rounded-2xl shadow-lg p-8 relative overflow-hidden">
                <svg viewBox="0 0 400 300" className="w-full h-auto">
                  {/* Background */}
                  <rect width="400" height="300" fill="#f8fafc" />
                  
                  {/* Water/Ocean */}
                  <path d="M0,200 Q100,180 200,200 Q300,220 400,200 L400,300 L0,300 Z" fill="#bfdbfe" opacity="0.7" />
                  
                  {/* Manhattan */}
                  <rect x="140" y="120" width="15" height="80" rx="3" fill="#f97316" className="animate-pulse" style={{animationDelay: '0s'}} />
                  <text x="148" y="115" textAnchor="middle" className="text-xs font-semibold" fill="#f97316">Manhattan</text>
                  
                  {/* Brooklyn */}
                  <polygon points="155,140 180,140 185,180 160,180" fill="#06b6d4" className="animate-pulse" style={{animationDelay: '0.5s'}} />
                  <text x="172" y="195" textAnchor="middle" className="text-xs font-semibold" fill="#06b6d4">Brooklyn</text>
                  
                  {/* Queens */}
                  <polygon points="180,120 220,120 225,160 185,160" fill="#10b981" className="animate-pulse" style={{animationDelay: '1s'}} />
                  <text x="202" y="115" textAnchor="middle" className="text-xs font-semibold" fill="#10b981">Queens</text>
                  
                  {/* Bronx */}
                  <polygon points="140,80 170,80 175,120 145,120" fill="#8b5cf6" className="animate-pulse" style={{animationDelay: '1.5s'}} />
                  <text x="157" y="75" textAnchor="middle" className="text-xs font-semibold" fill="#8b5cf6">Bronx</text>
                  
                  {/* Staten Island */}
                  <circle cx="120" cy="220" r="20" fill="#f59e0b" className="animate-pulse" style={{animationDelay: '2s'}} />
                  <text x="120" y="250" textAnchor="middle" className="text-xs font-semibold" fill="#f59e0b">Staten Island</text>
                  
                  {/* Long Island */}
                  <ellipse cx="280" cy="160" rx="80" ry="25" fill="#ef4444" className="animate-pulse" style={{animationDelay: '2.5s'}} />
                  <text x="280" y="165" textAnchor="middle" className="text-xs font-semibold" fill="white">Long Island</text>
                  
                  {/* Westchester */}
                  <polygon points="120,60 180,60 185,100 125,100" fill="#ec4899" className="animate-pulse" style={{animationDelay: '3s'}} />
                  <text x="152" y="55" textAnchor="middle" className="text-xs font-semibold" fill="#ec4899">Westchester</text>
                  
                  {/* Northern NJ */}
                  <polygon points="80,120 140,120 145,200 85,200" fill="#84cc16" className="animate-pulse" style={{animationDelay: '3.5s'}} />
                  <text x="112" y="115" textAnchor="middle" className="text-xs font-semibold" fill="#84cc16">Northern NJ</text>
                  
                  {/* Provider dots animation */}
                  <circle cx="148" cy="140" r="3" fill="#dc2626" className="animate-ping" style={{animationDelay: '4s'}} />
                  <circle cx="172" cy="160" r="3" fill="#dc2626" className="animate-ping" style={{animationDelay: '4.2s'}} />
                  <circle cx="202" cy="140" r="3" fill="#dc2626" className="animate-ping" style={{animationDelay: '4.4s'}} />
                  <circle cx="157" cy="100" r="3" fill="#dc2626" className="animate-ping" style={{animationDelay: '4.6s'}} />
                  <circle cx="280" cy="160" r="3" fill="#dc2626" className="animate-ping" style={{animationDelay: '4.8s'}} />
                  <circle cx="152" cy="80" r="3" fill="#dc2626" className="animate-ping" style={{animationDelay: '5s'}} />
                  <circle cx="112" cy="160" r="3" fill="#dc2626" className="animate-ping" style={{animationDelay: '5.2s'}} />
                  <circle cx="120" cy="220" r="3" fill="#dc2626" className="animate-ping" style={{animationDelay: '5.4s'}} />
                </svg>
                
                {/* Animated coverage indicator */}
                <div className="absolute bottom-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold animate-bounce">
                  Full Coverage
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-primary">
                  <h3 className="font-semibold text-gray-900 mb-1">New York City</h3>
                  <p className="text-gray-600 text-sm">All 5 boroughs covered</p>
                  <p className="text-primary font-semibold text-lg">450+ providers</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-secondary-500">
                  <h3 className="font-semibold text-gray-900 mb-1">Long Island</h3>
                  <p className="text-gray-600 text-sm">Nassau & Suffolk counties</p>
                  <p className="text-secondary-500 font-semibold text-lg">280+ providers</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-accent-500">
                  <h3 className="font-semibold text-gray-900 mb-1">Westchester</h3>
                  <p className="text-gray-600 text-sm">Full county coverage</p>
                  <p className="text-accent-500 font-semibold text-lg">180+ providers</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                  <h3 className="font-semibold text-gray-900 mb-1">Northern NJ</h3>
                  <p className="text-gray-600 text-sm">Bergen, Essex, Hudson</p>
                  <p className="text-green-500 font-semibold text-lg">90+ providers</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Why This Coverage Matters</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Cross-borough searches for families living on borders</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Commuter-friendly options near transit hubs</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Suburban and urban childcare options</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Consistent quality standards across all areas</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How HappiKid Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Finding quality childcare has never been easier
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary p-4 rounded-2xl inline-block mb-6">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Search Naturally</h3>
              <p className="text-gray-600">
                Use everyday language to describe what you're looking for. 
                Our smart search understands your needs and preferences.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-secondary-500 p-4 rounded-2xl inline-block mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Browse Verified Options</h3>
              <p className="text-gray-600">
                Every provider is verified through public records and background checks. 
                See real photos, reviews, and detailed information.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-accent-500 p-4 rounded-2xl inline-block mb-6">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Connect & Decide</h3>
              <p className="text-gray-600">
                Contact providers directly, schedule tours, and make confident decisions 
                based on comprehensive, trustworthy information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="bg-primary-50 p-4 rounded-full inline-block mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Trust & Safety</h3>
              <p className="text-gray-600 text-sm">
                Every provider is thoroughly verified and backgrounds checked for your peace of mind.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="bg-secondary-50 p-4 rounded-full inline-block mb-4">
                <Users className="h-6 w-6 text-secondary-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Community First</h3>
              <p className="text-gray-600 text-sm">
                Built by parents, for parents. Real reviews from real families in your community.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="bg-accent-50 p-4 rounded-full inline-block mb-4">
                <Search className="h-6 w-6 text-accent-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Simplicity</h3>
              <p className="text-gray-600 text-sm">
                Complex decisions made simple through intuitive design and smart technology.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="bg-primary-50 p-4 rounded-full inline-block mb-4">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Empathy</h3>
              <p className="text-gray-600 text-sm">
                We understand the challenges of parenting and strive to make your life easier.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Find Your Perfect Childcare?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of families who have found their ideal childcare through HappiKid.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-primary hover:bg-gray-50"
              onClick={() => window.location.href = "/search"}
            >
              Start Searching
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-primary text-primary bg-white hover:bg-primary hover:text-white"
              onClick={() => window.location.href = "/dashboard"}
            >
              List Your Program
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-6 w-6 text-primary mr-2" />
            <span className="text-xl font-bold">HappiKid</span>
          </div>
          <p className="text-gray-400">
            Making childcare discovery joyful for families in the NYC tri-state area.
          </p>
        </div>
      </footer>
    </div>
  );
}