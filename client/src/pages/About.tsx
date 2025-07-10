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
              {/* Realistic NYC Tri-State Map */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-8 relative overflow-hidden">
                <div className="relative w-full h-80 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl overflow-hidden">
                  {/* Water bodies */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-300"></div>
                  
                  {/* Hudson River */}
                  <div className="absolute left-4 top-8 w-2 h-32 bg-blue-400 rounded-full opacity-70"></div>
                  
                  {/* East River */}
                  <div className="absolute left-16 top-20 w-1.5 h-20 bg-blue-400 rounded-full opacity-70 rotate-12"></div>
                  
                  {/* Atlantic Ocean */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-400 to-transparent"></div>
                  
                  {/* Northern NJ */}
                  <div 
                    className="absolute left-2 top-16 w-16 h-24 bg-lime-400 rounded-lg opacity-80 cursor-pointer hover:opacity-100 transition-all duration-500 animate-pulse"
                    style={{animationDelay: '0s'}}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow-md">NJ</span>
                    </div>
                    {/* Provider dots */}
                    <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" style={{animationDelay: '3s'}}></div>
                    <div className="absolute bottom-3 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" style={{animationDelay: '3.5s'}}></div>
                  </div>
                  
                  {/* Westchester */}
                  <div 
                    className="absolute left-8 top-2 w-20 h-12 bg-pink-400 rounded-lg opacity-80 cursor-pointer hover:opacity-100 transition-all duration-500 animate-pulse"
                    style={{animationDelay: '0.5s'}}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow-md">Westchester</span>
                    </div>
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" style={{animationDelay: '4s'}}></div>
                  </div>
                  
                  {/* Bronx */}
                  <div 
                    className="absolute left-8 top-16 w-12 h-10 bg-purple-400 rounded-lg opacity-80 cursor-pointer hover:opacity-100 transition-all duration-500 animate-pulse"
                    style={{animationDelay: '1s'}}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow-md">Bronx</span>
                    </div>
                    <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" style={{animationDelay: '4.5s'}}></div>
                  </div>
                  
                  {/* Manhattan */}
                  <div 
                    className="absolute left-20 top-28 w-4 h-16 bg-orange-400 rounded-lg opacity-80 cursor-pointer hover:opacity-100 transition-all duration-500 animate-pulse"
                    style={{animationDelay: '1.5s'}}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                      <span className="text-xs font-bold text-orange-600 drop-shadow-md">Manhattan</span>
                    </div>
                    <div className="absolute top-3 left-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" style={{animationDelay: '5s'}}></div>
                    <div className="absolute bottom-3 left-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" style={{animationDelay: '5.2s'}}></div>
                  </div>
                  
                  {/* Queens */}
                  <div 
                    className="absolute left-26 top-24 w-20 h-14 bg-emerald-400 rounded-lg opacity-80 cursor-pointer hover:opacity-100 transition-all duration-500 animate-pulse"
                    style={{animationDelay: '2s'}}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow-md">Queens</span>
                    </div>
                    <div className="absolute top-2 left-3 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" style={{animationDelay: '5.5s'}}></div>
                    <div className="absolute bottom-2 right-3 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" style={{animationDelay: '6s'}}></div>
                  </div>
                  
                  {/* Brooklyn */}
                  <div 
                    className="absolute left-24 top-40 w-16 h-12 bg-cyan-400 rounded-lg opacity-80 cursor-pointer hover:opacity-100 transition-all duration-500 animate-pulse"
                    style={{animationDelay: '2.5s'}}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow-md">Brooklyn</span>
                    </div>
                    <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" style={{animationDelay: '6.5s'}}></div>
                    <div className="absolute bottom-1 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" style={{animationDelay: '7s'}}></div>
                  </div>
                  
                  {/* Staten Island */}
                  <div 
                    className="absolute left-8 bottom-8 w-12 h-10 bg-amber-400 rounded-full opacity-80 cursor-pointer hover:opacity-100 transition-all duration-500 animate-pulse"
                    style={{animationDelay: '3s'}}
                  >
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                      <span className="text-xs font-bold text-amber-600 drop-shadow-md">Staten Island</span>
                    </div>
                    <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" style={{animationDelay: '7.5s'}}></div>
                  </div>
                  
                  {/* Long Island */}
                  <div 
                    className="absolute right-4 top-32 w-24 h-8 bg-red-400 rounded-full opacity-80 cursor-pointer hover:opacity-100 transition-all duration-500 animate-pulse"
                    style={{animationDelay: '3.5s'}}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow-md">Long Island</span>
                    </div>
                    <div className="absolute top-1 left-4 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" style={{animationDelay: '8s'}}></div>
                    <div className="absolute bottom-1 right-4 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" style={{animationDelay: '8.5s'}}></div>
                  </div>
                  
                  {/* Coverage indicator */}
                  <div className="absolute bottom-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold animate-bounce">
                    Full Coverage
                  </div>
                  
                  {/* Hover tooltips */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                    Click any area to explore providers
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