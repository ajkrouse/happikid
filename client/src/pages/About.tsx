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
    <div className="min-h-screen bg-brand-sage">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-16 bg-brand-sage">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-headline mb-6 text-brand-evergreen">
            About <span className="text-action-clay">HappiKid</span>
          </h1>
          <p className="text-xl max-w-4xl mx-auto mb-8 text-brand-evergreen">
            HappiKid is a parent-first marketplace that uses AI to help families effortlessly search, compare, 
            and book trusted care and enrichment programs for kids—spanning daycare, camps, after-school activities, and private schools.
          </p>
          <div className="flex justify-center">
            <div className="rounded-2xl shadow-sm p-4 max-w-2xl border bg-brand-white border-brand-sage">
              <p className="text-sm italic text-brand-evergreen">
                "Finding safe, reliable care for your child shouldn't feel like a full-time job."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 bg-brand-sage">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline mb-4 text-brand-evergreen">Our Story</h2>
            <div className="w-20 h-1 mx-auto rounded-full bg-action-clay"></div>
          </div>
          
          <div className="prose prose-lg max-w-none space-y-6 text-brand-evergreen">
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
            
            <div className="rounded-2xl p-8 shadow-sm border-l-4 my-8 bg-brand-white border-action-clay">
              <p className="text-xl font-medium italic font-headline text-brand-evergreen">
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
            <div className="flex items-center justify-center font-semibold text-action-clay">
              <Heart className="h-6 w-6 mr-2 fill-current" />
              <span className="text-lg">For Charlie, for Chloe, for all families</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-brand-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-headline mb-6 text-brand-evergreen">The HappiKid Solution</h2>
              <p className="text-lg mb-6 text-brand-evergreen">
                Today's parents are left piecing together outdated websites, scattered reviews, and word-of-mouth 
                recommendations just to find a daycare, after-school program, private school, or camp that meets their needs.
              </p>
              <p className="text-lg mb-6 text-brand-evergreen">
                HappiKid is an AI-powered marketplace that simplifies this search. With our "just ask" LLM search, 
                parents describe what they're looking for and receive a curated list of trusted providers—displayed 
                side-by-side for easy comparison based on what matters most: safety, schedule, budget, and real parent reviews.
              </p>
              <p className="text-lg mb-8 text-brand-evergreen">
                We bring clarity and confidence to one of the most stressful decisions families face.
              </p>
              <div className="flex items-center font-semibold text-action-clay">
                <Heart className="h-5 w-5 mr-2" />
                <span>Making childcare discovery joyful for families</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card className="text-center p-6 rounded-2xl border bg-brand-white border-brand-sage">
                <div className="p-4 rounded-full inline-block mb-4 bg-brand-sage">
                  <Users className="h-8 w-8 text-brand-evergreen" />
                </div>
                <h3 className="font-semibold text-brand-evergreen mb-2">700+</h3>
                <p className="text-text-muted text-sm">Verified Providers</p>
              </Card>
              <Card className="text-center p-6 rounded-2xl border bg-brand-white border-brand-sage">
                <div className="p-4 rounded-full inline-block mb-4 bg-action-clay/20">
                  <Shield className="h-8 w-8 text-action-clay" />
                </div>
                <h3 className="font-semibold mb-2 text-brand-evergreen">23</h3>
                <p className="text-sm text-text-muted">Counties Covered</p>
              </Card>
              <Card className="text-center p-6 rounded-2xl border bg-brand-white border-brand-sage">
                <div className="p-4 rounded-full inline-block mb-4 bg-action-teal/20">
                  <Search className="h-8 w-8 text-action-teal" />
                </div>
                <h3 className="font-semibold mb-2 text-brand-evergreen">AI</h3>
                <p className="text-sm text-text-muted">Powered Search</p>
              </Card>
              <Card className="text-center p-6 rounded-2xl border bg-brand-white border-brand-sage">
                <div className="p-4 rounded-full inline-block mb-4 bg-brand-sage">
                  <Star className="h-8 w-8 text-brand-evergreen" />
                </div>
                <h3 className="font-semibold mb-2 text-brand-evergreen">100%</h3>
                <p className="text-sm text-text-muted">Authentic Data</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-16 bg-brand-sage">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline mb-4 text-brand-evergreen">What Makes HappiKid Different</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <Card className="p-8 rounded-2xl border bg-brand-white border-brand-sage">
              <div className="p-4 rounded-full inline-block mb-4 bg-action-clay/20">
                <Heart className="h-8 w-8 text-action-clay" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-brand-evergreen">Built for Parents, Not Providers</h3>
              <p className="text-brand-evergreen">
                HappiKid was designed from the ground up as a parent-first platform, removing the stress of finding safe, reliable childcare and enrichment.
              </p>
            </Card>
            
            <Card className="p-8 rounded-2xl border bg-brand-white border-brand-sage">
              <div className="p-4 rounded-full inline-block mb-4 bg-action-teal/20">
                <Search className="h-8 w-8 text-action-teal" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-brand-evergreen">Ask, and We'll Find It</h3>
              <p className="text-brand-evergreen">
                Tell us what you need — "a preschool with early drop-off" or "a camp with STEM programs" — and our AI instantly matches you with trusted options that fit your family.
              </p>
            </Card>
            
            <Card className="p-8 rounded-2xl border bg-brand-white border-brand-sage">
              <div className="p-4 rounded-full inline-block mb-4 bg-brand-sage">
                <Shield className="h-8 w-8 text-brand-evergreen" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-brand-evergreen">Trust You Can See</h3>
              <p className="text-brand-evergreen">
                Every provider is verified against official licensing and safety data. Real reviews, transparent details, no hidden surprises.
              </p>
            </Card>
            
            <Card className="p-8 rounded-2xl border bg-brand-white border-brand-sage">
              <div className="p-4 rounded-full inline-block mb-4 bg-action-clay/20">
                <Clock className="h-8 w-8 text-action-clay" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-brand-evergreen">Clarity at a Glance</h3>
              <p className="text-brand-evergreen">
                Side-by-side comparisons show cost, schedule, safety, and reviews so you can make confident choices in minutes, not weeks.
              </p>
            </Card>
          </div>

          <div className="rounded-2xl shadow-sm p-8 mt-12 border bg-brand-white border-brand-sage">
            <h3 className="text-2xl font-headline mb-6 text-center text-brand-evergreen">Why Families Choose HappiKid</h3>
            <p className="text-lg text-center mb-8 text-brand-evergreen">
              Other sites leave parents digging through outdated listings and unverified ads. HappiKid is different:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="p-2 rounded-full mr-4 mt-1 bg-action-teal/20">
                    <Search className="h-5 w-5 text-action-teal" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-evergreen">AI-powered natural language search ("just ask")</h4>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="p-2 rounded-full mr-4 mt-1 bg-brand-sage">
                    <Shield className="h-5 w-5 text-brand-evergreen" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-evergreen">Verified licensing data and authentic parent reviews</h4>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="p-2 rounded-full mr-4 mt-1 bg-action-clay/20">
                    <MessageCircle className="h-5 w-5 text-action-clay" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-evergreen">Side-by-side comparisons of what matters most</h4>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="p-2 rounded-full mr-4 mt-1 bg-action-clay/20">
                    <Heart className="h-5 w-5 text-action-clay" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-evergreen">Always free for parents, with providers powering the marketplace</h4>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-brand-evergreen/10 text-center">
              <p className="text-text-muted">
                HappiKid is launching first in the NYC tri-state area with a depth-over-breadth approach, ensuring every parent has access to trusted, complete, and transparent choices—before expanding to new markets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Area Map */}
      <section className="py-16 bg-brand-sage">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline text-brand-evergreen mb-4">Serving the NYC Tri-State Area</h2>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              Comprehensive childcare coverage across New York City, Long Island, Westchester, and Northern New Jersey
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              {/* Coverage Stats */}
              <div className="bg-brand-white rounded-2xl shadow-lg p-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-headline text-brand-evergreen mb-2">NYC Tri-State Coverage</h3>
                  <p className="text-text-muted">Comprehensive childcare provider network</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center bg-brand-sage rounded-lg p-4">
                    <div className="text-3xl font-bold text-brand-evergreen">700+</div>
                    <div className="text-sm text-text-muted">Providers</div>
                  </div>
                  <div className="text-center bg-brand-sage rounded-lg p-4">
                    <div className="text-3xl font-bold text-action-teal">23</div>
                    <div className="text-sm text-text-muted">Counties</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center bg-action-clay/10 rounded-lg p-4">
                    <div className="text-3xl font-bold text-action-clay">3</div>
                    <div className="text-sm text-text-muted">States</div>
                  </div>
                  <div className="text-center bg-action-teal/10 rounded-lg p-4">
                    <div className="text-3xl font-bold text-action-teal">100%</div>
                    <div className="text-sm text-text-muted">Authentic</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-brand-white rounded-lg p-4 shadow-sm border-l-4 border-brand-evergreen">
                  <h3 className="font-semibold text-brand-evergreen mb-1">New York City</h3>
                  <p className="text-text-muted text-sm">All 5 boroughs covered</p>
                  <p className="text-brand-evergreen font-semibold text-lg">450+ providers</p>
                </div>
                <div className="bg-brand-white rounded-lg p-4 shadow-sm border-l-4 border-action-teal">
                  <h3 className="font-semibold text-brand-evergreen mb-1">Long Island</h3>
                  <p className="text-text-muted text-sm">Nassau & Suffolk counties</p>
                  <p className="text-action-teal font-semibold text-lg">280+ providers</p>
                </div>
                <div className="bg-brand-white rounded-lg p-4 shadow-sm border-l-4 border-action-clay">
                  <h3 className="font-semibold text-brand-evergreen mb-1">Westchester</h3>
                  <p className="text-text-muted text-sm">Full county coverage</p>
                  <p className="text-action-clay font-semibold text-lg">180+ providers</p>
                </div>
                <div className="bg-brand-white rounded-lg p-4 shadow-sm border-l-4 border-action-teal">
                  <h3 className="font-semibold text-brand-evergreen mb-1">Northern NJ</h3>
                  <p className="text-text-muted text-sm">Bergen, Essex, Hudson</p>
                  <p className="text-action-teal font-semibold text-lg">90+ providers</p>
                </div>
              </div>

              <div className="bg-brand-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-brand-evergreen mb-3">Why This Coverage Matters</h3>
                <ul className="space-y-2 text-text-muted">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand-evergreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Cross-borough searches for families living on borders</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand-evergreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Commuter-friendly options near transit hubs</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand-evergreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Suburban and urban childcare options</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand-evergreen rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Consistent quality standards across all areas</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-brand-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline text-brand-evergreen mb-4">How HappiKid Works</h2>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              Finding quality childcare has never been easier
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-brand-evergreen p-4 rounded-2xl inline-block mb-6">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-brand-evergreen mb-4">1. Search Naturally</h3>
              <p className="text-text-muted">
                Use everyday language to describe what you're looking for. 
                Our smart search understands your needs and preferences.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-action-teal p-4 rounded-2xl inline-block mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-brand-evergreen mb-4">2. Browse Verified Options</h3>
              <p className="text-text-muted">
                Every provider is verified through public records and background checks. 
                See real photos, reviews, and detailed information.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-action-clay p-4 rounded-2xl inline-block mb-6">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-brand-evergreen mb-4">3. Connect & Decide</h3>
              <p className="text-text-muted">
                Contact providers directly, schedule tours, and make confident decisions 
                based on comprehensive, trustworthy information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-brand-sage">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline text-brand-evergreen mb-4">Our Values</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-brand-white">
              <div className="bg-brand-sage p-4 rounded-full inline-block mb-4">
                <Shield className="h-6 w-6 text-brand-evergreen" />
              </div>
              <h3 className="font-semibold text-brand-evergreen mb-3">Trust & Safety</h3>
              <p className="text-text-muted text-sm">
                Every provider is thoroughly verified and backgrounds checked for your peace of mind.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-brand-white">
              <div className="bg-action-teal/20 p-4 rounded-full inline-block mb-4">
                <Users className="h-6 w-6 text-action-teal" />
              </div>
              <h3 className="font-semibold text-brand-evergreen mb-3">Community First</h3>
              <p className="text-text-muted text-sm">
                Built by parents, for parents. Real reviews from real families in your community.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-brand-white">
              <div className="bg-action-clay/20 p-4 rounded-full inline-block mb-4">
                <Heart className="h-6 w-6 text-action-clay" />
              </div>
              <h3 className="font-semibold text-brand-evergreen mb-3">Family Focused</h3>
              <p className="text-text-muted text-sm">
                We understand the challenges of modern parenting and design for real family needs.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-brand-white">
              <div className="bg-brand-sage p-4 rounded-full inline-block mb-4">
                <Star className="h-6 w-6 text-brand-evergreen" />
              </div>
              <h3 className="font-semibold text-brand-evergreen mb-3">Quality First</h3>
              <p className="text-text-muted text-sm">
                We prioritize depth over breadth, ensuring comprehensive coverage where we operate.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-evergreen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-headline text-white mb-6">Ready to Find the Perfect Care?</h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of families who trust HappiKid to find safe, reliable childcare and enrichment programs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-action-clay hover:bg-action-clay/90 text-white px-8 py-3 rounded-lg font-medium">
              Start Your Search
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-brand-evergreen px-8 py-3 rounded-lg font-medium">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-brand-evergreen border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white/70">
            Making childcare discovery joyful for families in the NYC tri-state area.
          </p>
        </div>
      </footer>
    </div>
  );
}
