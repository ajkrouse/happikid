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
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
            HappiKid is a parent-first marketplace that uses AI to help families effortlessly search, compare, 
            and book trusted care and enrichment programs for kids—spanning daycare, camps, after-school activities, and private schools.
          </p>
          <div className="flex justify-center">
            <div className="bg-white rounded-lg shadow-sm p-4 max-w-2xl">
              <p className="text-sm text-gray-600 italic">
                "Finding safe, reliable care for your child shouldn't feel like a full-time job."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Story</h2>
            <div className="w-20 h-1 bg-primary mx-auto"></div>
          </div>
          
          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p>
              HappiKid started with our own parenting journey.
            </p>
            
            <p>
              After years of fertility treatments, my wife and I were thrilled to learn we were expecting twins in 2022. Like many new parents, we quickly shifted from celebration to logistics: "Where are we going to find childcare?"
            </p>
            
            <p>
              What should have been straightforward turned into a maze of spreadsheets, Facebook group posts, Google and Yelp reviews, endless phone calls, and daycare walkthroughs. Every step felt fragmented and inefficient. It was clear the process was broken—and parents everywhere were asking the same questions over and over again: "Can anyone recommend a daycare? A camp? A birthday party spot?"
            </p>
            
            <p>
              In the months that followed, life tested us in ways we could never have imagined. Our twins, Chloe and Charlie, were born extremely premature. Chloe came home after 69 days in the NICU, but we heartbreakingly lost our son, Charlie, due to complications. Through it all, the idea for HappiKid stayed with me: parents deserve a simpler, more transparent way to find trusted care and enrichment options for their kids.
            </p>
            
            <div className="bg-white rounded-lg p-8 shadow-sm border-l-4 border-primary my-8">
              <p className="text-xl font-medium text-gray-900 italic">
                That mission became HappiKid.
              </p>
            </div>
            
            <p>
              Today, HappiKid is an AI-powered marketplace where parents can "just ask" for what they need and instantly compare trusted providers side-by-side—daycares, after-school programs, private schools, camps, and more—based on what matters most: safety, schedule, budget, and real parent reviews.
            </p>
            
            <p>
              We built HappiKid to bring clarity, trust, and peace of mind to one of life's most important decisions. Because families deserve better.
            </p>
          </div>
          
          <div className="text-center mt-12">
            <div className="flex items-center justify-center text-primary font-semibold">
              <Heart className="h-6 w-6 mr-2 fill-current" />
              <span className="text-lg">For Charlie, for Chloe, for all families</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">The HappiKid Solution</h2>
              <p className="text-lg text-gray-600 mb-6">
                Today's parents are left piecing together outdated websites, scattered reviews, and word-of-mouth 
                recommendations just to find a daycare, after-school program, private school, or camp that meets their needs.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                HappiKid is an AI-powered marketplace that simplifies this search. With our "just ask" LLM search, 
                parents describe what they're looking for and receive a curated list of trusted providers—displayed 
                side-by-side for easy comparison based on what matters most: safety, schedule, budget, and real parent reviews.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                We bring clarity and confidence to one of the most stressful decisions families face.
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
                <h3 className="font-semibold text-gray-900 mb-2">700+</h3>
<p className="text-gray-600 text-sm">Verified Providers</p>
              </Card>
              <Card className="text-center p-6">
                <div className="bg-secondary-100 p-4 rounded-full inline-block mb-4">
                  <Shield className="h-8 w-8 text-secondary-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">23</h3>
                <p className="text-gray-600 text-sm">Counties Covered</p>
              </Card>
              <Card className="text-center p-6">
                <div className="bg-accent-100 p-4 rounded-full inline-block mb-4">
                  <Search className="h-8 w-8 text-accent-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">AI</h3>
                <p className="text-gray-600 text-sm">Powered Search</p>
              </Card>
              <Card className="text-center p-6">
                <div className="bg-primary-100 p-4 rounded-full inline-block mb-4">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">100%</h3>
                <p className="text-gray-600 text-sm">Authentic Data</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Makes HappiKid Different</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <Card className="p-8">
              <div className="bg-primary-100 p-4 rounded-full inline-block mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Built for Parents, Not Providers</h3>
              <p className="text-gray-600">
                HappiKid was designed from the ground up as a parent-first platform, removing the stress of finding safe, reliable childcare and enrichment.
              </p>
            </Card>
            
            <Card className="p-8">
              <div className="bg-primary-100 p-4 rounded-full inline-block mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Ask, and We'll Find It</h3>
              <p className="text-gray-600">
                Tell us what you need — "a preschool with early drop-off" or "a camp with STEM programs" — and our AI instantly matches you with trusted options that fit your family.
              </p>
            </Card>
            
            <Card className="p-8">
              <div className="bg-secondary-100 p-4 rounded-full inline-block mb-4">
                <Shield className="h-8 w-8 text-secondary-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Trust You Can See</h3>
              <p className="text-gray-600">
                Every provider is verified against official licensing and safety data. Real reviews, transparent details, no hidden surprises.
              </p>
            </Card>
            
            <Card className="p-8">
              <div className="bg-accent-100 p-4 rounded-full inline-block mb-4">
                <Clock className="h-8 w-8 text-accent-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Clarity at a Glance</h3>
              <p className="text-gray-600">
                Side-by-side comparisons show cost, schedule, safety, and reviews so you can make confident choices in minutes, not weeks.
              </p>
            </Card>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 mt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why Families Choose HappiKid</h3>
            <p className="text-lg text-gray-600 text-center mb-8">
              Other sites leave parents digging through outdated listings and unverified ads. HappiKid is different:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-primary-100 p-2 rounded-full mr-4 mt-1">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">AI-powered natural language search ("just ask")</h4>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary-100 p-2 rounded-full mr-4 mt-1">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Verified licensing data and authentic parent reviews</h4>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-primary-100 p-2 rounded-full mr-4 mt-1">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Side-by-side comparisons of what matters most</h4>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary-100 p-2 rounded-full mr-4 mt-1">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Always free for parents, with providers powering the marketplace</h4>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-200 text-center">
              <p className="text-gray-600">
                HappiKid is launching first in the NYC tri-state area with a depth-over-breadth approach, ensuring every parent has access to trusted, complete, and transparent choices—before expanding to new markets.
              </p>
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
              {/* Coverage Stats */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">NYC Tri-State Coverage</h3>
                  <p className="text-gray-600">Comprehensive childcare provider network</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center bg-primary-50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-primary">700+</div>
                    <div className="text-sm text-gray-600">Providers</div>
                  </div>
                  <div className="text-center bg-secondary-50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-secondary-500">23</div>
                    <div className="text-sm text-gray-600">Counties</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center bg-accent-50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-accent-500">3</div>
                    <div className="text-sm text-gray-600">States</div>
                  </div>
                  <div className="text-center bg-green-50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-green-600">100%</div>
                    <div className="text-sm text-gray-600">Authentic</div>
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