import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Search, 
  Shield, 
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Target,
  Zap,
  MessageSquare,
  Star,
  Clock,
  Users,
  Award,
  MapPin,
  Eye,
  Lightbulb,
  Database,
  Network,
  X,
  Building2,
  DollarSign,
  Layers,
  CalendarDays,
  BrainCircuit,
  CheckCheck
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: totalCount } = useQuery<{count: number}>({
    queryKey: ['/api/providers/stats'],
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      setLocation("/search");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* HERO */}
      <section className="relative w-full bg-gradient-to-br from-brand-sage via-brand-white to-action-sand px-6 pt-20 pb-32 flex flex-col items-center justify-center text-center">
        <h1 className="font-headline text-5xl md:text-6xl text-brand-evergreen mb-6 max-w-4xl leading-tight">
          Find Care. Compare. <span className="text-action-clay italic">Book with Confidence.</span>
        </h1>
        
        <p className="font-body text-text-muted text-lg md:text-xl mb-10 max-w-2xl">
          Just describe what your family needs. HappiKid finds trusted, verified childcare and enrichment programs — and shows you everything side by side.
        </p>

        <div className="relative w-full max-w-2xl group">
          <div className="absolute -inset-1 bg-action-teal/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
          <div className="relative flex items-center bg-brand-white rounded-xl shadow-xl border border-brand-evergreen/10 p-2">
            <div className="pl-4 text-action-clay">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input 
              type="text" 
              className="w-full bg-transparent border-none text-brand-evergreen placeholder-text-muted/60 text-lg px-4 py-3 focus:ring-0 focus:outline-none"
              placeholder="Try 'Montessori preschool in Jersey City under $2k/mo'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              data-testid="input-hero-search"
            />
            <button 
              onClick={handleSearch}
              className="bg-action-clay hover:opacity-90 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg whitespace-nowrap"
              data-testid="button-hero-ask"
            >
              Ask HappiKid
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted font-medium">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-action-teal"></div> Verified Safety Records
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-action-teal"></div> Real-Time Pricing
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-action-teal"></div> Free for Parents
          </span>
        </div>
      </section>

      {/* QUICK ACCESS BAR */}
      <div className="w-full bg-brand-white border-b border-brand-evergreen/10 py-6">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
          <div className="flex justify-between md:justify-center gap-8 min-w-max">
            <button onClick={() => setLocation("/search?type=daycare")} className="flex flex-col items-center gap-2 group cursor-pointer" data-testid="quick-access-daycare">
              <div className="text-brand-evergreen group-hover:text-action-clay transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <span className="text-sm font-medium text-brand-evergreen/80 group-hover:text-brand-evergreen">Daycare</span>
            </button>
            <button onClick={() => setLocation("/search?type=camp")} className="flex flex-col items-center gap-2 group cursor-pointer" data-testid="quick-access-camps">
              <div className="text-brand-evergreen group-hover:text-action-clay transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
              </div>
              <span className="text-sm font-medium text-brand-evergreen/80 group-hover:text-brand-evergreen">Camps</span>
            </button>
            <button onClick={() => setLocation("/search?type=afterschool")} className="flex flex-col items-center gap-2 group cursor-pointer" data-testid="quick-access-schools">
              <div className="text-brand-evergreen group-hover:text-action-clay transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              </div>
              <span className="text-sm font-medium text-brand-evergreen/80 group-hover:text-brand-evergreen">After-School</span>
            </button>
            <button onClick={() => setLocation("/search?type=sports")} className="flex flex-col items-center gap-2 group cursor-pointer" data-testid="quick-access-sports">
              <div className="text-brand-evergreen group-hover:text-action-clay transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h18v18H3zM8 12h8m-4-4v8"></path></svg>
              </div>
              <span className="text-sm font-medium text-brand-evergreen/80 group-hover:text-brand-evergreen">Sports</span>
            </button>
            <button onClick={() => setLocation("/search?type=tutoring")} className="flex flex-col items-center gap-2 group cursor-pointer" data-testid="quick-access-tutors">
              <div className="text-brand-evergreen group-hover:text-action-clay transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
              </div>
              <span className="text-sm font-medium text-brand-evergreen/80 group-hover:text-brand-evergreen">Tutors</span>
            </button>
          </div>
        </div>
      </div>

      {/* ECOSYSTEM GRID */}
      <section className="w-full bg-brand-white py-24 px-6 border-b border-brand-evergreen/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block bg-brand-sage text-brand-evergreen px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-brand-evergreen/10">
              Ages 0–13
            </span>
            <h2 className="font-headline text-4xl md:text-5xl text-brand-evergreen mb-6 leading-tight">
              Everything your child needs, <br className="hidden md:block" /> all in one place.
            </h2>
            <p className="font-body text-lg text-text-muted leading-relaxed">
              From infant care and preschools to STEM enrichment and youth sports — HappiKid covers every stage of your child's growth.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <a href="/search?type=daycare" className="group flex flex-col items-center text-center p-8 rounded-2xl bg-action-sand bg-opacity-60 hover:bg-opacity-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-transparent hover:border-brand-evergreen/10" data-testid="ecosystem-daycare">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm text-action-clay">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="font-headline text-lg text-brand-evergreen leading-tight">Daycare & Early Learning</h3>
            </a>
            <a href="/search?type=preschool" className="group flex flex-col items-center text-center p-8 rounded-2xl bg-brand-sage bg-opacity-60 hover:bg-opacity-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-transparent hover:border-brand-evergreen/10" data-testid="ecosystem-preschool">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm text-action-teal">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h3 className="font-headline text-lg text-brand-evergreen leading-tight">Preschools</h3>
            </a>
            <a href="/search?type=afterschool" className="group flex flex-col items-center text-center p-8 rounded-2xl bg-action-sand bg-opacity-60 hover:bg-opacity-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-transparent hover:border-brand-evergreen/10" data-testid="ecosystem-afterschool">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm text-action-clay">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h3 className="font-headline text-lg text-brand-evergreen leading-tight">After-School Programs</h3>
            </a>
            <a href="/search?type=camp" className="group flex flex-col items-center text-center p-8 rounded-2xl bg-brand-sage bg-opacity-60 hover:bg-opacity-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-transparent hover:border-brand-evergreen/10" data-testid="ecosystem-camps">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm text-action-teal">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              </div>
              <h3 className="font-headline text-lg text-brand-evergreen leading-tight">Summer & Day Camps</h3>
            </a>
            <a href="/search?type=sports" className="group flex flex-col items-center text-center p-8 rounded-2xl bg-action-sand bg-opacity-60 hover:bg-opacity-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-transparent hover:border-brand-evergreen/10" data-testid="ecosystem-sports">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm text-action-clay">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h18v18H3zM8 12h8m-4-4v8" /></svg>
              </div>
              <h3 className="font-headline text-lg text-brand-evergreen leading-tight">Youth Sports</h3>
            </a>
            <a href="/search?type=tutoring" className="group flex flex-col items-center text-center p-8 rounded-2xl bg-brand-sage bg-opacity-60 hover:bg-opacity-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-transparent hover:border-brand-evergreen/10" data-testid="ecosystem-tutoring">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm text-action-teal">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <h3 className="font-headline text-lg text-brand-evergreen leading-tight">Tutoring</h3>
            </a>
            <a href="/search?type=enrichment" className="group flex flex-col items-center text-center p-8 rounded-2xl bg-action-sand bg-opacity-60 hover:bg-opacity-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-transparent hover:border-brand-evergreen/10" data-testid="ecosystem-enrichment">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm text-action-clay">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <h3 className="font-headline text-lg text-brand-evergreen leading-tight">Arts & STEM Enrichment</h3>
            </a>
            <a href="/search?type=activity" className="group flex flex-col items-center text-center p-8 rounded-2xl bg-brand-sage bg-opacity-60 hover:bg-opacity-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-transparent hover:border-brand-evergreen/10" data-testid="ecosystem-activity">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm text-action-teal">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="font-headline text-lg text-brand-evergreen leading-tight">Activity Programs</h3>
            </a>
          </div>
        </div>
      </section>

      {/* WHY HAPPIKID — For Parents */}
      <section className="py-24 bg-brand-sage">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-headline text-4xl md:text-5xl text-brand-evergreen mb-4">
              Stop searching. Start finding.
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Most parents bounce between Google, Facebook groups, spreadsheets, and phone calls just to find one good program. HappiKid brings it all together.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BrainCircuit,
                title: 'Just Ask',
                desc: 'Type what you need in plain language — "after-school STEM near Hoboken with late pickup for a 7-year-old" — and get matched instantly.',
                bg: 'bg-action-clay/10',
                color: 'text-action-clay'
              },
              {
                icon: Shield,
                title: 'Trust What You See',
                desc: 'Every provider is cross-referenced against official government licensing records. Safety and verification data is surfaced right on the listing.',
                bg: 'bg-action-teal/10',
                color: 'text-action-teal'
              },
              {
                icon: Layers,
                title: 'Compare Side by Side',
                desc: 'See cost, schedule, age range, reviews, and availability all in one view. No more open tabs, no more guesswork.',
                bg: 'bg-brand-sage',
                color: 'text-brand-evergreen'
              },
            ].map((item, i) => (
              <div key={i} className="bg-brand-white rounded-2xl p-8 shadow-sm border border-brand-evergreen/10 hover:shadow-md transition-all">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${item.bg}`}>
                  <item.icon className={`h-7 w-7 ${item.color}`} />
                </div>
                <h3 className="font-headline text-xl text-brand-evergreen mb-3">{item.title}</h3>
                <p className="text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM TRUST STATS + TESTIMONIALS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-headline mb-4 text-brand-evergreen">
              Trusted by families across NY, NJ & CT
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              {[
                { number: totalCount ? `${totalCount.count.toLocaleString()}+` : '5,500+', label: 'Verified Programs Listed', icon: Target, bg: 'bg-action-sand', color: 'text-action-clay' },
                { number: '85%', label: 'Cross-Referenced with Gov\'t Licensing Records', icon: Shield, bg: 'bg-brand-sage', color: 'text-action-teal' },
                { number: '23', label: 'Counties Covered Across NY, NJ & CT', icon: MapPin, bg: 'bg-action-teal/10', color: 'text-action-teal' },
              ].map((stat, i) => (
                <div key={i} className={`flex items-center gap-4 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow ${stat.bg}`}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white shadow-sm">
                    <stat.icon className={`h-7 w-7 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-brand-evergreen">{stat.number}</p>
                    <p className="font-medium text-brand-evergreen">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {[
                {
                  quote: "Finding a daycare used to take weeks of calls and spreadsheets. With HappiKid, I found three great options in an afternoon.",
                  author: "Sarah M.",
                  role: "Brooklyn, NY"
                },
                {
                  quote: "The verification gives me real peace of mind. I know every program we consider is properly licensed.",
                  author: "Michael T.",
                  role: "Manhattan, NY"
                },
                {
                  quote: "Finally — one place to compare schedules, prices, and reviews without bouncing between ten tabs.",
                  author: "Jennifer K.",
                  role: "Hoboken, NJ"
                }
              ].map((testimonial, i) => (
                <Card key={i} className="bg-white border-2 rounded-2xl shadow-md hover:shadow-lg transition-shadow border-brand-evergreen/10">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-current text-amber-500" />
                      ))}
                    </div>
                    <p className="text-base mb-4 leading-relaxed text-brand-evergreen">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${i === 0 ? 'bg-action-sand' : i === 1 ? 'bg-brand-sage' : 'bg-action-teal/20'}`}></div>
                      <div>
                        <p className="font-semibold text-brand-evergreen text-sm">{testimonial.author}</p>
                        <p className="text-xs text-text-muted">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-brand-sage">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-headline mb-4 text-brand-evergreen">
              How It Works
            </h2>
            <p className="text-lg max-w-2xl mx-auto text-text-muted">
              Finding the right program shouldn't be complicated. Here's how HappiKid makes it simple.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: Search,
                title: 'Search Programs',
                desc: 'Tell us what you need — age, location, type of care. Our smart search understands your constraints and shows you verified options in seconds.'
              },
              {
                step: '2',
                icon: Eye,
                title: 'Compare & Review',
                desc: 'See schedules, prices, reviews, and safety records all in one place. No more jumping between tabs or building your own spreadsheet.'
              },
              {
                step: '3',
                icon: CheckCircle2,
                title: 'Connect & Enroll',
                desc: 'Message providers directly, ask questions, and start the enrollment process — all without leaving the platform.'
              }
            ].map((step, i) => (
              <div key={i} className="relative bg-brand-white border border-brand-evergreen/10 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-all">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-action-clay">
                  {step.step}
                </div>
                <div className="w-16 h-16 mx-auto bg-brand-sage rounded-full flex items-center justify-center mb-6 mt-4 text-brand-evergreen">
                  <step.icon className="h-8 w-8" />
                </div>
                <h3 className="font-headline text-xl text-brand-evergreen mb-3">{step.title}</h3>
                <p className="font-body text-text-muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI SEARCH FEATURES */}
      <section className="py-20 bg-action-sand">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-headline mb-4 text-brand-evergreen">
              Smarter search. Clearer choices.
            </h2>
            <p className="text-lg max-w-3xl mx-auto text-brand-evergreen/90">
              HappiKid organizes the details that matter — schedules, age ranges, teaching styles, safety info, and more — so you can make confident decisions without the guesswork.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: Database,
                title: 'Comprehensive Provider Info',
                desc: 'Structured, reliable information on programs, teaching styles, age ranges, pricing, and licensing.',
                iconBg: 'bg-amber-100',
                iconColor: 'text-amber-500'
              },
              {
                icon: Lightbulb,
                title: 'Transparent Recommendations',
                desc: 'See why a program matches your needs — transparent criteria, simple to understand, easy to compare.',
                iconBg: 'bg-cyan-100',
                iconColor: 'text-action-teal'
              },
              {
                icon: Network,
                title: 'Cross-Category Search',
                desc: 'Compare daycares, camps, after-school programs, and tutoring together in a single search.',
                iconBg: 'bg-brand-sage',
                iconColor: 'text-action-teal'
              }
            ].map((feature, i) => (
              <Card key={i} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${feature.iconBg}`}>
                    <feature.icon className={`h-9 w-9 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-brand-evergreen">{feature.title}</h3>
                  <p className="text-text-muted">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-brand-sage">
                <Search className="h-5 w-5 text-action-teal" />
              </div>
              <div>
                <p className="text-sm font-medium mb-2 opacity-70 text-text-muted">Real search example:</p>
                <p className="text-lg font-medium text-brand-evergreen">
                  "Find full-day programs with extended hours near the PATH train that accept 2-year-olds starting in March."
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* FOR PROVIDERS */}
      <section className="py-20 bg-brand-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-action-teal mb-3">For Providers</p>
              <h2 className="text-4xl font-headline text-brand-evergreen mb-6">
                Reach more families. Fill more spots.
              </h2>
              <p className="text-lg text-text-muted mb-6">
                HappiKid gives your program a free, SEO-friendly profile that puts you in front of high-intent local families actively searching for programs like yours.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Free listing — claimable in minutes, no credit card needed',
                  'High-intent parent inquiries, not unqualified ad clicks',
                  'Centralized messaging dashboard to manage all family conversations',
                  'Profile optimization tools and enrollment analytics',
                  'Performance-based — start free, upgrade as you grow',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCheck className="h-5 w-5 text-action-teal shrink-0 mt-0.5" />
                    <span className="text-brand-evergreen">{item}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={() => setLocation("/providers")} className="bg-action-teal hover:bg-action-teal/90 text-white rounded-lg px-8" data-testid="button-providers-cta">
                List Your Program Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {[
                { icon: Users, label: 'Parent Inquiries', desc: 'Families come to you already comparing your program', bg: 'bg-brand-sage', color: 'text-brand-evergreen' },
                { icon: BarChart3, label: 'Demand Analytics', desc: 'See what families in your area are searching for', bg: 'bg-action-teal/10', color: 'text-action-teal' },
                { icon: MessageSquare, label: 'Messaging Tools', desc: 'Answer questions and nurture leads in one place', bg: 'bg-action-clay/10', color: 'text-action-clay' },
                { icon: Award, label: 'Profile Boosts', desc: 'Guided tips to improve your ranking and visibility', bg: 'bg-brand-sage', color: 'text-brand-evergreen' },
              ].map((card, i) => (
                <div key={i} className={`${card.bg} rounded-2xl p-6 border border-brand-evergreen/5`}>
                  <card.icon className={`h-7 w-7 mb-3 ${card.color}`} />
                  <h4 className="font-semibold text-brand-evergreen mb-1">{card.label}</h4>
                  <p className="text-sm text-text-muted">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-evergreen py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-headline text-white mb-4">
            Ready to find the right fit for your child?
          </h2>
          <p className="text-xl text-white/80 mb-2">
            HappiKid is free for parents — always.
          </p>
          <p className="text-white/60 mb-8 text-sm">Are you a provider? Claim your free listing and reach families in your area.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg"
              onClick={() => setLocation("/search")}
              className="rounded-lg bg-white text-action-clay font-semibold shadow-xl hover:shadow-2xl transition-all px-8"
              data-testid="button-cta-find-programs"
            >
              Start Searching
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => setLocation("/providers")}
              className="rounded-lg font-semibold border-2 border-white text-white bg-white/10 hover:bg-white/20"
              data-testid="button-cta-list-program"
            >
              List Your Program Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 bg-brand-evergreen text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <a href="/" className="flex items-center gap-2 mb-4 group">
                <div className="w-8 h-8 text-white">
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="10" width="15" height="80" rx="4" fill="currentColor" />
                    <rect x="65" y="10" width="15" height="80" rx="4" fill="currentColor" />
                    <path d="M35 60 C35 60, 50 75, 65 60" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                    <circle cx="50" cy="35" r="7" className="text-action-clay fill-current" />
                  </svg>
                </div>
                <span className="font-headline text-2xl text-white tracking-wide">HappiKid</span>
              </a>
              <p className="text-white/70 text-sm mb-2 italic">Happy Parents. HappiKid.</p>
              <p className="text-white/60 mb-6 leading-relaxed text-sm">
                Connecting families with trusted childcare and enrichment programs across NY, NJ &amp; CT.
              </p>
              <div className="flex gap-4">
                <a href="#" className="hover:opacity-70 transition"><Facebook className="h-5 w-5" /></a>
                <a href="#" className="hover:opacity-70 transition"><Twitter className="h-5 w-5" /></a>
                <a href="#" className="hover:opacity-70 transition"><Instagram className="h-5 w-5" /></a>
                <a href="#" className="hover:opacity-70 transition"><Linkedin className="h-5 w-5" /></a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Parents</h4>
              <ul className="space-y-3 text-white/80">
                <li><span onClick={() => setLocation("/search")} className="hover:text-white transition cursor-pointer" data-testid="footer-find-programs">Find Programs</span></li>
                <li><a href="#how-it-works" className="hover:text-white transition" data-testid="footer-how-it-works">How It Works</a></li>
                <li><span onClick={() => setLocation("/search")} className="hover:text-white transition cursor-pointer">After-School Programs</span></li>
                <li><span onClick={() => setLocation("/search")} className="hover:text-white transition cursor-pointer" data-testid="footer-resources">Summer Camps</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Providers</h4>
              <ul className="space-y-3 text-white/80">
                <li><a href="/providers" className="hover:text-white transition" data-testid="footer-list-program">List Your Program</a></li>
                <li><a href="/providers" className="hover:text-white transition">Claim Your Profile</a></li>
                <li><a href="/providers" className="hover:text-white transition">Provider Dashboard</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-white/80">
                <li><span onClick={() => setLocation("/about")} className="hover:text-white transition cursor-pointer" data-testid="footer-about">About Us</span></li>
                <li><span onClick={() => setLocation("/contact")} className="hover:text-white transition cursor-pointer" data-testid="footer-contact">Contact</span></li>
                <li><span onClick={() => setLocation("/about")} className="hover:text-white transition cursor-pointer">Our Story</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 mt-12 pt-8 text-center text-white/50 text-sm">
            <p>&copy; 2026 HappiKid. All rights reserved. | <a href="#" className="hover:text-white">Privacy Policy</a> | <a href="#" className="hover:text-white">Terms of Service</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
