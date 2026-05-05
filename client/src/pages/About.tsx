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
  ChevronRight,
  Building2,
  BrainCircuit,
  Database,
  TrendingUp,
  Target,
  MapPin,
  DollarSign,
  CheckCheck,
  X,
  Layers,
  Lock
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function About() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-brand-sage">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-16 bg-brand-sage">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-action-teal mb-4">Our Mission</p>
          <h1 className="text-4xl sm:text-5xl font-headline mb-6 text-brand-evergreen">
            About <span className="text-action-clay">HappiKid</span>
          </h1>
          <p className="text-xl max-w-4xl mx-auto mb-8 text-brand-evergreen">
            HappiKid is building the trusted discovery and enrollment layer for childcare and kids' enrichment — 
            starting with after-school programs, camps, and K–5 enrichment in the NYC Tri-State area.
          </p>
          <div className="flex justify-center">
            <div className="rounded-2xl shadow-sm p-5 max-w-2xl border bg-brand-white border-brand-sage">
              <p className="text-sm italic text-brand-evergreen font-medium">
                "Happy Parents. HappiKid."
              </p>
              <p className="text-xs text-text-muted mt-1">Vision: To become the trusted operating system for how families discover, compare, and enroll in childcare and enrichment — and how providers acquire, convert, and retain families.</p>
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
              What should have been straightforward turned into a maze of spreadsheets, Facebook group posts, Google and Yelp reviews, endless phone calls, and daycare walkthroughs. Every step felt fragmented and inefficient. It was clear the process was broken — and parents everywhere were asking the same questions over and over: "Can anyone recommend a daycare? A camp? A birthday party spot?"
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
              Today, HappiKid is an AI-powered marketplace where parents can search in plain language, compare verified providers side-by-side, and move from discovery to enrollment in one place — daycares, after-school programs, private schools, camps, enrichment, and more.
            </p>
            
            <p>
              We built HappiKid to bring clarity, trust, and efficiency to one of life's most important decisions. Because families deserve better — and because the infrastructure to make that possible has never existed, until now.
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

      {/* The Problem We're Solving */}
      <section className="py-16 bg-brand-evergreen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline mb-4 text-white">The Problem is Real. The Market is Massive.</h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Childcare and enrichment discovery is broken — for parents and providers alike.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { stat: '13+ hrs', label: 'Average time parents spend searching for childcare' },
              { stat: '70%', label: 'of families have 3 weeks or less to make their decision' },
              { stat: '$200B+', label: 'U.S. child-related services market annually' },
              { stat: 'Zero', label: 'dominant platform exists for institutional program discovery' },
            ].map((item, i) => (
              <div key={i} className="px-2">
                <div className="text-3xl md:text-4xl font-bold text-action-clay mb-2">{item.stat}</div>
                <div className="text-white/70 text-sm leading-snug">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-brand-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-headline mb-6 text-brand-evergreen">What HappiKid Does</h2>
              <p className="text-lg mb-4 text-brand-evergreen">
                HappiKid is a two-sided AI-powered marketplace that streamlines how parents discover and book care and enrichment, and how providers acquire and manage families.
              </p>
              <p className="text-lg mb-4 text-brand-evergreen">
                AI normalizes messy provider data, surfaces licensing and safety signals, and matches parent queries to real-world constraints — age, schedule, location, budget, and start date.
              </p>
              <p className="text-lg mb-8 text-brand-evergreen">
                The result is a measurable improvement in time-to-shortlist and inquiry-to-enrollment conversion — not a novelty feature.
              </p>
              <div className="flex items-center font-semibold text-action-clay">
                <Heart className="h-5 w-5 mr-2" />
                <span>AI-native from day one — not AI bolted on</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card className="text-center p-6 rounded-2xl border bg-brand-white border-brand-sage">
                <div className="p-4 rounded-full inline-block mb-4 bg-brand-sage">
                  <Users className="h-8 w-8 text-brand-evergreen" />
                </div>
                <h3 className="font-semibold text-brand-evergreen mb-2">5,500+</h3>
                <p className="text-text-muted text-sm">Providers Listed</p>
              </Card>
              <Card className="text-center p-6 rounded-2xl border bg-brand-white border-brand-sage">
                <div className="p-4 rounded-full inline-block mb-4 bg-action-teal/20">
                  <Shield className="h-8 w-8 text-action-teal" />
                </div>
                <h3 className="font-semibold mb-2 text-brand-evergreen">85%</h3>
                <p className="text-sm text-text-muted">Gov't Verified</p>
              </Card>
              <Card className="text-center p-6 rounded-2xl border bg-brand-white border-brand-sage">
                <div className="p-4 rounded-full inline-block mb-4 bg-action-teal/20">
                  <Search className="h-8 w-8 text-action-teal" />
                </div>
                <h3 className="font-semibold mb-2 text-brand-evergreen">AI-Native</h3>
                <p className="text-sm text-text-muted">Search & Matching</p>
              </Card>
              <Card className="text-center p-6 rounded-2xl border bg-brand-white border-brand-sage">
                <div className="p-4 rounded-full inline-block mb-4 bg-brand-sage">
                  <MapPin className="h-8 w-8 text-brand-evergreen" />
                </div>
                <h3 className="font-semibold mb-2 text-brand-evergreen">23</h3>
                <p className="text-sm text-text-muted">Counties Covered</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Sided Marketplace */}
      <section className="py-16 bg-brand-sage">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline mb-4 text-brand-evergreen">A Marketplace Built for Both Sides</h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              HappiKid creates compounding value — more families improve provider ROI, better providers improve parent outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <Card className="p-8 rounded-2xl border bg-brand-white border-brand-sage">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 rounded-full bg-action-clay/15">
                  <Heart className="h-6 w-6 text-action-clay" />
                </div>
                <h3 className="text-xl font-semibold text-brand-evergreen">For Parents</h3>
              </div>
              <ul className="space-y-3 text-brand-evergreen">
                {[
                  'AI natural language search — "just describe what you need"',
                  'Verified licensing data and safety signals',
                  'Side-by-side comparison: age, schedule, price, distance',
                  'Direct messaging and inquiry — no more email tag',
                  'Saved favorites and family profile for personalized matching',
                  'Always free',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCheck className="h-4 w-4 text-action-teal shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            
            <Card className="p-8 rounded-2xl border bg-brand-white border-brand-sage">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 rounded-full bg-action-teal/15">
                  <Building2 className="h-6 w-6 text-action-teal" />
                </div>
                <h3 className="text-xl font-semibold text-brand-evergreen">For Providers</h3>
              </div>
              <ul className="space-y-3 text-brand-evergreen">
                {[
                  'Free, SEO-optimized profile — claimable in minutes',
                  'High-intent parent leads, not unqualified ad clicks',
                  'Enrollment and inquiry dashboard with conversion tracking',
                  'Centralized messaging to manage all family inquiries',
                  'Performance-based monetization — pay per lead, then subscribe',
                  'Analytics dashboard for demand and utilization insights',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCheck className="h-4 w-4 text-action-teal shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Coverage Area */}
      <section className="py-16 bg-brand-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline text-brand-evergreen mb-4">Density Before Breadth</h2>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              Launching in the NYC Tri-State area first — 5,500+ providers across the region most parents rely on.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="bg-brand-sage rounded-2xl shadow-lg p-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-headline text-brand-evergreen mb-2">NYC Tri-State Coverage</h3>
                  <p className="text-text-muted">Beachhead market before national expansion</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center bg-brand-white rounded-lg p-4">
                    <div className="text-3xl font-bold text-brand-evergreen">5,500+</div>
                    <div className="text-sm text-text-muted">Providers</div>
                  </div>
                  <div className="text-center bg-brand-white rounded-lg p-4">
                    <div className="text-3xl font-bold text-action-teal">23</div>
                    <div className="text-sm text-text-muted">Counties</div>
                  </div>
                  <div className="text-center bg-brand-white rounded-lg p-4">
                    <div className="text-3xl font-bold text-action-clay">3</div>
                    <div className="text-sm text-text-muted">States</div>
                  </div>
                  <div className="text-center bg-brand-white rounded-lg p-4">
                    <div className="text-3xl font-bold text-action-teal">85%</div>
                    <div className="text-sm text-text-muted">Gov't Verified</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { region: 'New York City', detail: 'All 5 boroughs — priority focus', count: '1,040+', color: 'border-brand-evergreen' },
                { region: 'Northern NJ', detail: 'Hoboken, Jersey City, Bergen, Hudson, Essex', count: '280+', color: 'border-action-teal' },
                { region: 'Hudson Valley', detail: 'Westchester, Rockland, Orange, Putnam, Dutchess', count: '35+', color: 'border-action-clay' },
                { region: 'Long Island & CT', detail: 'Nassau, Suffolk & Fairfield counties', count: '65+', color: 'border-action-teal' },
              ].map((area, i) => (
                <div key={i} className={`bg-brand-sage rounded-lg p-4 shadow-sm border-l-4 ${area.color}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-brand-evergreen">{area.region}</h3>
                      <p className="text-text-muted text-sm">{area.detail}</p>
                    </div>
                    <span className="font-bold text-brand-evergreen text-lg">{area.count}</span>
                  </div>
                </div>
              ))}

              <div className="bg-brand-evergreen/5 rounded-lg p-4 border border-brand-evergreen/10">
                <p className="text-sm text-text-muted">
                  <strong className="text-brand-evergreen">Strategy:</strong> Build density and local liquidity in the NYC Tri-State market first, then expand into the surrounding suburban corridors and new metros once unit economics are proven.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-brand-sage">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline text-brand-evergreen mb-4">How HappiKid Works</h2>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              From search to enrolled — in minutes, not weeks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Search, color: 'bg-brand-evergreen', step: '1', title: 'Search Naturally', desc: 'Use everyday language to describe what you need — age, location, schedule, budget. Our AI finds the right matches instantly.' },
              { icon: Shield, color: 'bg-action-teal', step: '2', title: 'Compare Verified Options', desc: 'Side-by-side comparison of verified providers — schedules, pricing, safety records, and real reviews. No more tab-switching.' },
              { icon: MessageCircle, color: 'bg-action-clay', step: '3', title: 'Inquire & Enroll', desc: 'Message providers directly, ask questions, and start enrollment — all from one place.' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className={`${step.color} p-4 rounded-2xl inline-block mb-6`}>
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-brand-evergreen mb-4">{step.step}. {step.title}</h3>
                <p className="text-text-muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-brand-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline text-brand-evergreen mb-4">Our Principles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, bg: 'bg-brand-sage', color: 'text-brand-evergreen', title: 'Trust-First Data', desc: 'Verified licensing and safety signals at the program level — not user-generated listings.' },
              { icon: Database, bg: 'bg-action-teal/20', color: 'text-action-teal', title: 'Structured Inventory', desc: 'We normalize messy provider data into machine-readable, comparable, AI-ready inventory.' },
              { icon: Users, bg: 'bg-action-clay/20', color: 'text-action-clay', title: 'Density Over Breadth', desc: 'Build deep local liquidity first, then expand — not the reverse.' },
              { icon: TrendingUp, bg: 'bg-brand-sage', color: 'text-brand-evergreen', title: 'Compounding Value', desc: 'Each new provider and family makes the platform more useful for everyone.' },
            ].map((v, i) => (
              <Card key={i} className="p-6 text-center hover:shadow-lg transition-shadow bg-brand-white border border-brand-sage">
                <div className={`${v.bg} p-4 rounded-full inline-block mb-4`}>
                  <v.icon className={`h-6 w-6 ${v.color}`} />
                </div>
                <h3 className="font-semibold text-brand-evergreen mb-3">{v.title}</h3>
                <p className="text-text-muted text-sm">{v.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-evergreen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-headline text-white mb-6">Ready to explore HappiKid?</h2>
          <p className="text-xl text-white/80 mb-8">
            Search 5,500+ verified providers across NY, NJ &amp; CT — free for parents, always.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => setLocation("/search")} className="bg-action-clay hover:bg-action-clay/90 text-white px-8 py-3 rounded-lg font-medium">
              Start Your Search
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button onClick={() => setLocation("/providers")} variant="outline" className="border-white text-white hover:bg-white hover:text-brand-evergreen px-8 py-3 rounded-lg font-medium">
              I'm a Provider
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-brand-evergreen border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white/60 text-sm">
            &copy; 2026 HappiKid. The trusted discovery and enrollment layer for childcare and kids' enrichment.
          </p>
        </div>
      </footer>
    </div>
  );
}
