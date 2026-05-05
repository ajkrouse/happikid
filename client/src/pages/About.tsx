import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Shield, 
  Users, 
  Search, 
  MessageCircle,
  Star,
  ChevronRight,
  Building2,
  CheckCheck,
  Database,
  TrendingUp,
  MapPin
} from "lucide-react";
import { useLocation } from "wouter";

export default function About() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-brand-sage">
      <Navigation />
      
      {/* Hero */}
      <section className="py-16 bg-brand-sage">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-headline mb-6 text-brand-evergreen">
            About <span className="text-action-clay">HappiKid</span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto mb-8 text-brand-evergreen">
            HappiKid helps parents in the NYC Tri-State area find, compare, and connect with trusted childcare 
            and enrichment programs — daycares, after-school activities, camps, private schools, and more.
          </p>
          <div className="flex justify-center">
            <div className="rounded-2xl shadow-sm p-5 max-w-xl border bg-brand-white border-brand-sage">
              <p className="text-base italic text-brand-evergreen font-medium">
                "Finding safe, reliable care for your child shouldn't feel like a full-time job."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-brand-sage">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline mb-4 text-brand-evergreen">Our Story</h2>
            <div className="w-20 h-1 mx-auto rounded-full bg-action-clay"></div>
          </div>
          
          <div className="space-y-6 text-lg text-brand-evergreen">
            <p>HappiKid started with our own parenting journey.</p>
            
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
              Today, HappiKid is an AI-powered platform where parents can simply describe what they're looking for and instantly compare trusted providers side-by-side — based on what matters most: safety, schedule, budget, and real parent reviews.
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

      {/* What HappiKid Does */}
      <section className="py-16 bg-brand-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-headline mb-6 text-brand-evergreen">What HappiKid Does for You</h2>
              <p className="text-lg mb-4 text-brand-evergreen">
                Most parents spend hours bouncing between Google, Facebook groups, and phone calls just to put together a shortlist. HappiKid replaces all of that.
              </p>
              <p className="text-lg mb-4 text-brand-evergreen">
                Our AI search understands plain language — tell us your child's age, your schedule, your neighborhood, your budget — and we match you with verified programs that actually fit.
              </p>
              <p className="text-lg mb-8 text-brand-evergreen">
                Every listing is cross-referenced with official licensing records, so you can search with confidence knowing the providers you see are legitimate and accountable.
              </p>
              <div className="flex items-center font-semibold text-action-clay">
                <Heart className="h-5 w-5 mr-2" />
                <span>Always free for parents</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: Users, bg: 'bg-brand-sage', color: 'text-brand-evergreen', number: '5,500+', label: 'Providers Listed' },
                { icon: Shield, bg: 'bg-action-teal/20', color: 'text-action-teal', number: '85%', label: "Gov't Verified" },
                { icon: Search, bg: 'bg-action-teal/20', color: 'text-action-teal', number: 'AI', label: 'Natural Language Search' },
                { icon: MapPin, bg: 'bg-brand-sage', color: 'text-brand-evergreen', number: '23', label: 'Counties Covered' },
              ].map((stat, i) => (
                <Card key={i} className="text-center p-6 rounded-2xl border bg-brand-white border-brand-sage">
                  <div className={`p-4 rounded-full inline-block mb-4 ${stat.bg}`}>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                  <h3 className={`font-semibold mb-2 ${stat.color}`}>{stat.number}</h3>
                  <p className="text-sm text-text-muted">{stat.label}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What Makes HappiKid Different */}
      <section className="py-16 bg-brand-sage">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline mb-4 text-brand-evergreen">What Makes HappiKid Different</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {[
              { icon: Heart, bg: 'bg-action-clay/20', color: 'text-action-clay', title: 'Built for Parents', desc: 'HappiKid was designed from the ground up around how parents actually search — not just a database with a search box bolted on.' },
              { icon: Search, bg: 'bg-action-teal/20', color: 'text-action-teal', title: 'Just Ask', desc: 'Tell us what you need in plain language — "a preschool with early drop-off in Hoboken" or "STEM camp for a 9-year-old." Our AI finds the right matches.' },
              { icon: Shield, bg: 'bg-brand-sage', color: 'text-brand-evergreen', title: 'Trust You Can See', desc: "Every provider is checked against official licensing and safety data. Real verification, not user-generated badges." },
              { icon: MessageCircle, bg: 'bg-action-clay/20', color: 'text-action-clay', title: 'From Search to Enrolled', desc: 'Contact providers directly, schedule tours, and start enrollment — all from one place, without the back-and-forth.' },
            ].map((card, i) => (
              <Card key={i} className="p-8 rounded-2xl border bg-brand-white border-brand-sage">
                <div className={`p-4 rounded-full inline-block mb-4 ${card.bg}`}>
                  <card.icon className={`h-8 w-8 ${card.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-brand-evergreen">{card.title}</h3>
                <p className="text-brand-evergreen">{card.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For Providers */}
      <section className="py-16 bg-brand-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-action-teal mb-3">For Providers</p>
              <h2 className="text-3xl font-headline mb-6 text-brand-evergreen">Reach families who are ready to enroll.</h2>
              <p className="text-lg mb-6 text-brand-evergreen">
                HappiKid gives your program a free, searchable profile that puts you in front of local families actively looking for programs like yours — not cold ad traffic.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Free listing — no credit card, claimable in minutes',
                  'High-intent parent inquiries from families already comparing',
                  'Centralized messaging to manage all conversations in one place',
                  'Enrollment dashboard and demand analytics',
                  'Profile optimization tips to improve your visibility',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCheck className="h-5 w-5 text-action-teal shrink-0 mt-0.5" />
                    <span className="text-brand-evergreen">{item}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={() => setLocation("/providers")} className="bg-action-teal hover:bg-action-teal/90 text-white rounded-lg px-8">
                List Your Program Free
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="bg-brand-sage rounded-2xl p-8">
              <h3 className="text-xl font-headline text-brand-evergreen mb-6">Why providers choose HappiKid</h3>
              <div className="space-y-5">
                {[
                  { icon: Users, title: 'Qualified parent leads', desc: 'Parents arrive already comparing your program to others — a much warmer lead than an ad click.' },
                  { icon: TrendingUp, title: 'Growth tools built in', desc: 'SEO-optimized profiles, profile scoring, and guided optimization tips to help you stand out.' },
                  { icon: Database, title: 'Enrollment insights', desc: 'See inquiry volume, family interest, and demand trends to make smarter decisions.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-action-teal/15 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-action-teal" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-brand-evergreen">{item.title}</h4>
                      <p className="text-sm text-text-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Area */}
      <section className="py-16 bg-brand-sage">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline text-brand-evergreen mb-4">Serving the NYC Tri-State Area</h2>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              5,500+ childcare and enrichment providers across New York City, Northern New Jersey, Long Island, Hudson Valley, and Connecticut.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-brand-white rounded-2xl shadow-lg p-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-headline text-brand-evergreen mb-2">NYC Tri-State Coverage</h3>
                <p className="text-text-muted">Comprehensive childcare provider network</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '5,500+', label: 'Providers', color: 'text-brand-evergreen' },
                  { value: '23', label: 'Counties', color: 'text-action-teal' },
                  { value: '3', label: 'States', color: 'text-action-clay' },
                  { value: '85%', label: 'Verified', color: 'text-action-teal' },
                ].map((s, i) => (
                  <div key={i} className="text-center bg-brand-sage rounded-lg p-4">
                    <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-sm text-text-muted">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {[
                { region: 'New York City', detail: 'All 5 boroughs covered', count: '1,040+', color: 'border-brand-evergreen' },
                { region: 'Northern NJ', detail: 'Jersey City, Hoboken, Bergen, Hudson, Essex & more', count: '280+', color: 'border-action-teal' },
                { region: 'Hudson Valley', detail: 'Westchester, Rockland, Orange, Putnam, Dutchess', count: '35+', color: 'border-action-clay' },
                { region: 'Long Island & CT', detail: 'Nassau, Suffolk & Fairfield counties', count: '65+', color: 'border-action-teal' },
              ].map((area, i) => (
                <div key={i} className={`bg-brand-white rounded-lg p-4 shadow-sm border-l-4 ${area.color}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-brand-evergreen">{area.region}</h3>
                      <p className="text-text-muted text-sm">{area.detail}</p>
                    </div>
                    <span className="font-bold text-brand-evergreen text-lg">{area.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-brand-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline text-brand-evergreen mb-4">Our Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, bg: 'bg-brand-sage', color: 'text-brand-evergreen', title: 'Trust & Safety', desc: 'Every provider is verified against public licensing records — so you know what you see is real.' },
              { icon: Users, bg: 'bg-action-teal/20', color: 'text-action-teal', title: 'Community First', desc: 'Built by parents, for parents. Real reviews from real families in your community.' },
              { icon: Heart, bg: 'bg-action-clay/20', color: 'text-action-clay', title: 'Family Focused', desc: 'We understand the pressures of modern parenting and design every feature around real family needs.' },
              { icon: Star, bg: 'bg-brand-sage', color: 'text-brand-evergreen', title: 'Depth Over Breadth', desc: 'We prioritize comprehensive, accurate coverage where we operate before expanding.' },
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

      {/* CTA */}
      <section className="py-16 bg-brand-evergreen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-headline text-white mb-6">Ready to find the perfect care?</h2>
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

      <footer className="py-8 bg-brand-evergreen border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white/60 text-sm">
            &copy; 2026 HappiKid. Making childcare discovery joyful for families in the NYC tri-state area.
          </p>
        </div>
      </footer>
    </div>
  );
}
