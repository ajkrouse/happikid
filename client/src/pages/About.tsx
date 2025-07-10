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
              {/* Coverage Areas Visual */}
              <div className="bg-white rounded-2xl shadow-lg p-6 relative overflow-hidden">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">NYC Tri-State Coverage</h3>
                  <p className="text-gray-600">Comprehensive childcare provider network</p>
                </div>

                {/* Animated Coverage Circles */}
                <div className="relative h-64 flex items-center justify-center">
                  {/* Central Hub */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-white font-bold text-sm">NYC</span>
                    </div>
                  </div>
                  
                  {/* Surrounding Areas - Animated Orbit */}
                  <div className="absolute inset-0 animate-spin" style={{animationDuration: '20s'}}>
                    {/* Manhattan */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                      <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">MAN</span>
                      </div>
                      <div className="text-center mt-1">
                        <span className="text-xs font-semibold text-orange-600">Manhattan</span>
                      </div>
                    </div>
                    
                    {/* Brooklyn */}
                    <div className="absolute bottom-4 right-8">
                      <div className="w-12 h-12 bg-cyan-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">BKN</span>
                      </div>
                      <div className="text-center mt-1">
                        <span className="text-xs font-semibold text-cyan-600">Brooklyn</span>
                      </div>
                    </div>
                    
                    {/* Queens */}
                    <div className="absolute top-8 right-4">
                      <div className="w-12 h-12 bg-emerald-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">QNS</span>
                      </div>
                      <div className="text-center mt-1">
                        <span className="text-xs font-semibold text-emerald-600">Queens</span>
                      </div>
                    </div>
                    
                    {/* Bronx */}
                    <div className="absolute top-8 left-4">
                      <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">BX</span>
                      </div>
                      <div className="text-center mt-1">
                        <span className="text-xs font-semibold text-purple-600">Bronx</span>
                      </div>
                    </div>
                    
                    {/* Staten Island */}
                    <div className="absolute bottom-4 left-8">
                      <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">SI</span>
                      </div>
                      <div className="text-center mt-1">
                        <span className="text-xs font-semibold text-amber-600">Staten Is.</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Extended Coverage Areas */}
                  <div className="absolute inset-0">
                    {/* Long Island */}
                    <div className="absolute top-1/2 right-2 transform -translate-y-1/2">
                      <div className="w-10 h-10 bg-red-400 rounded-full flex items-center justify-center animate-pulse" style={{animationDelay: '1s'}}>
                        <span className="text-white font-bold text-xs">LI</span>
                      </div>
                      <div className="text-center mt-1">
                        <span className="text-xs font-semibold text-red-600">Long Island</span>
                      </div>
                    </div>
                    
                    {/* Westchester */}
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                      <div className="w-10 h-10 bg-pink-400 rounded-full flex items-center justify-center animate-pulse" style={{animationDelay: '1.5s'}}>
                        <span className="text-white font-bold text-xs">WC</span>
                      </div>
                      <div className="text-center mt-1">
                        <span className="text-xs font-semibold text-pink-600">Westchester</span>
                      </div>
                    </div>
                    
                    {/* Northern NJ */}
                    <div className="absolute top-1/2 left-2 transform -translate-y-1/2">
                      <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center animate-pulse" style={{animationDelay: '2s'}}>
                        <span className="text-white font-bold text-xs">NJ</span>
                      </div>
                      <div className="text-center mt-1">
                        <span className="text-xs font-semibold text-green-600">Northern NJ</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Connection Lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full opacity-20">
                      <defs>
                        <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                          <circle cx="2" cy="2" r="1" fill="#6366f1"/>
                        </pattern>
                      </defs>
                      <circle cx="50%" cy="50%" r="80" fill="none" stroke="url(#dots)" strokeWidth="2"/>
                      <circle cx="50%" cy="50%" r="120" fill="none" stroke="url(#dots)" strokeWidth="1" opacity="0.5"/>
                    </svg>
                  </div>
                </div>

                {/* Coverage Stats */}
                <div className="grid grid-cols-4 gap-3 mt-6 pt-6 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">8</div>
                    <div className="text-xs text-gray-600">Areas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">1,000+</div>
                    <div className="text-xs text-gray-600">Providers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">100%</div>
                    <div className="text-xs text-gray-600">Coverage</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">24/7</div>
                    <div className="text-xs text-gray-600">Support</div>
                  </div>
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