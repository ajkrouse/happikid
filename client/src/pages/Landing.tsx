import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  MessageSquare,
  Star,
  Users,
  Award,
  MapPin,
  Eye,
  X,
  Building2,
  CheckCheck,
  BrainCircuit,
  Layers,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: totalCount } = useQuery<{ count: number }>({
    queryKey: ["/api/providers/stats"],
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      setLocation("/search");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="min-h-screen bg-brand-white">
      <Navigation />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative w-full bg-gradient-to-b from-brand-sage to-brand-white px-6 pt-20 pb-24 flex flex-col items-center text-center">

        {/* Eyebrow */}
        <span className="inline-block bg-brand-white border border-brand-evergreen/20 text-text-muted rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase mb-7 shadow-sm">
          For parents and providers in NYC / NJ
        </span>

        {/* Headline */}
        <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl lg:text-[4rem] text-brand-evergreen mb-6 max-w-3xl leading-[1.1] tracking-tight">
          Find the right childcare and kids' programs{" "}
          <span className="text-action-clay italic">without the search chaos.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-text-muted mb-9 max-w-2xl leading-relaxed">
          HappiKid uses AI to organize scattered daycare, after-school, camp, and enrichment information into one trusted marketplace — so parents can compare real options faster and providers can reach families ready to enroll.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button
            size="lg"
            onClick={() => setLocation("/search")}
            className="bg-action-clay hover:bg-action-clay/90 text-white rounded-lg px-9 py-3 font-semibold shadow-md text-base"
            data-testid="button-hero-explore"
          >
            Find Programs
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setLocation("/providers")}
            className="border-2 border-action-teal text-action-teal hover:bg-action-teal hover:text-white rounded-lg px-9 py-3 font-semibold text-base"
            data-testid="button-hero-grow"
          >
            List Your Program
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Proof row */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-text-muted font-medium">
          <span>5,000+ provider profiles</span>
          <span className="hidden sm:inline text-brand-evergreen/20">·</span>
          <span>NYC / NJ launch market</span>
          <span className="hidden sm:inline text-brand-evergreen/20">·</span>
          <span>Verified data where available</span>
        </div>
      </section>

      {/* ── QUICK CATEGORY BAR ───────────────────────────────────── */}
      <div className="w-full bg-brand-white border-y border-brand-evergreen/8 py-5">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
          <div className="flex justify-between md:justify-center gap-8 min-w-max">
            {[
              { label: "Daycare", type: "daycare", path: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "Camps", type: "camp", path: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
              { label: "After-School", type: "afterschool", path: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
              { label: "Sports", type: "sports", path: "M3 3h18v18H3zM8 12h8m-4-4v8" },
              { label: "Tutoring", type: "tutoring", path: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
              { label: "Enrichment", type: "enrichment", path: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
            ].map((cat) => (
              <button
                key={cat.type}
                onClick={() => setLocation(`/search?type=${cat.type}`)}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="text-brand-evergreen group-hover:text-action-clay transition-colors">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={cat.path} />
                  </svg>
                </div>
                <span className="text-xs font-medium text-text-muted group-hover:text-brand-evergreen transition-colors">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── WHY PARENTS USE HAPPIKID ────────────────────────────── */}
      <section className="py-24 bg-brand-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-action-clay/10 text-action-clay border border-action-clay/20 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest mb-4">
              For Parents
            </span>
            <h2 className="font-headline text-4xl md:text-5xl text-brand-evergreen mb-4 leading-tight">
              Stop searching. Start choosing.
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Finding the right program for your child shouldn't mean spending hours across ten tabs, a Facebook group, and a spreadsheet you made yourself.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start mb-14">
            {/* The old way */}
            <div className="bg-brand-sage/60 rounded-2xl p-8 border border-brand-evergreen/8">
              <h3 className="font-semibold text-brand-evergreen mb-5 text-lg">The way it works today</h3>
              <ul className="space-y-4">
                {[
                  "You ask in a Facebook parent group and get 40 different opinions",
                  "You open 12 browser tabs and still can't compare prices or schedules",
                  "Program websites are outdated — availability is unknown until you call",
                  "Every inquiry means filling out a different form from scratch",
                  "You build a spreadsheet to track it all, then do it again next season",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-text-muted/20 flex items-center justify-center shrink-0 mt-0.5">
                      <X className="h-3 w-3 text-text-muted" />
                    </div>
                    <span className="text-text-muted text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* The HappiKid way */}
            <div className="bg-brand-white rounded-2xl p-8 border-2 border-action-clay/20 shadow-sm">
              <h3 className="font-semibold text-brand-evergreen mb-5 text-lg flex items-center gap-2">
                <span className="text-action-clay">With HappiKid</span>
              </h3>
              <ul className="space-y-4">
                {[
                  { title: "One trusted place", desc: "Search childcare, camps, after-school, and enrichment all together — no tab switching." },
                  { title: "Describe what you need", desc: "Type in plain language — age, neighborhood, schedule, budget — and get matched instantly." },
                  { title: "Compare what matters", desc: "See schedules, pricing, reviews, and safety records side by side." },
                  { title: "Know what's verified", desc: "Every provider is cross-referenced with official licensing records, so you can trust what you see." },
                  { title: "Connect directly", desc: "Message providers, ask questions, and start enrollment — without leaving the platform." },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-action-teal/15 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCheck className="h-3 w-3 text-action-teal" />
                    </div>
                    <div>
                      <span className="font-semibold text-brand-evergreen text-sm">{item.title} — </span>
                      <span className="text-text-muted text-sm">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                <Button onClick={() => setLocation("/search")} className="w-full bg-action-clay hover:bg-action-clay/90 text-white rounded-lg" data-testid="button-parents-explore">
                  Explore Programs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Parent benefit cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: BrainCircuit, color: "text-action-clay", bg: "bg-action-clay/8", title: "AI-powered search", desc: "Just describe what you need. Our AI handles the rest." },
              { icon: Shield, color: "text-action-teal", bg: "bg-action-teal/8", title: "Verified safety data", desc: "Every provider checked against government licensing records." },
              { icon: Layers, color: "text-brand-evergreen", bg: "bg-brand-sage", title: "Side-by-side compare", desc: "Price, schedule, age range, and reviews — in one view." },
              { icon: MessageSquare, color: "text-action-clay", bg: "bg-action-clay/8", title: "Direct messaging", desc: "Ask questions and start enrollment without the phone tag." },
            ].map((card, i) => (
              <div key={i} className={`${card.bg} rounded-xl p-6 border border-brand-evergreen/6`}>
                <card.icon className={`h-7 w-7 ${card.color} mb-3`} />
                <h4 className="font-semibold text-brand-evergreen mb-1 text-sm">{card.title}</h4>
                <p className="text-text-muted text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI SEARCH ───────────────────────────────────────────── */}
      <section className="py-24 bg-brand-sage">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-brand-white text-brand-evergreen border border-brand-evergreen/15 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest mb-4">
              <BrainCircuit className="h-3.5 w-3.5 text-action-clay" /> AI-Powered Search
            </span>
            <h2 className="font-headline text-4xl md:text-5xl text-brand-evergreen mb-4 leading-tight">
              Just describe what you need.
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              No filters to wrestle with. Type what matters to your family in plain language — and HappiKid finds the programs that actually fit.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {[
              "Affordable Spanish immersion preschool near Hoboken for my 3-year-old",
              "Daycare in Jersey City for my special needs son, age 2, that can handle meds during the day",
              "Mandarin immersion daycare in Brooklyn within a 10-minute drive of Park Slope",
              "After-school STEM program for a 9-year-old in the Bronx, weekdays until 6pm",
              "Summer camp with swimming in Westchester, $500 or less per week",
              "Early drop-off daycare in Hoboken that accepts childcare subsidies",
            ].map((query, i) => (
              <button
                key={i}
                onClick={() => setLocation(`/search?q=${encodeURIComponent(query)}`)}
                className="group text-left bg-brand-white hover:bg-action-clay/5 border border-brand-evergreen/10 hover:border-action-clay/30 rounded-xl p-4 transition-all shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Search className="h-4 w-4 text-action-clay shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-brand-evergreen leading-relaxed">"{query}"</span>
                </div>
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: BrainCircuit, color: "text-action-clay", bg: "bg-brand-white", heading: "Natural language", body: "Describe what you need the way you'd say it to a friend — age, neighborhood, schedule, budget, language, special needs." },
              { icon: Shield, color: "text-action-teal", bg: "bg-brand-white", heading: "Grounded in real data", body: "Results are filtered by what's available, what's licensed, and what actually fits — not a generic list of suggestions." },
              { icon: Sparkles, color: "text-brand-evergreen", bg: "bg-brand-white", heading: "Ready for the AI future", body: "Whether you're searching HappiKid directly or through an AI assistant, we're building the infrastructure to surface the right programs for your family." },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} rounded-2xl p-6 border border-brand-evergreen/8 shadow-sm`}>
                <item.icon className={`h-7 w-7 ${item.color} mb-3`} />
                <h4 className="font-semibold text-brand-evergreen mb-2 text-sm">{item.heading}</h4>
                <p className="text-text-muted text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY PROVIDERS USE HAPPIKID ──────────────────────────── */}
      <section className="py-24 bg-brand-sage">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-action-teal/15 text-action-teal border border-action-teal/25 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest mb-4">
              For Providers
            </span>
            <h2 className="font-headline text-4xl md:text-5xl text-brand-evergreen mb-4 leading-tight">
              Be where families are looking.
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Parents searching for programs like yours are online right now. HappiKid makes sure they can find you — and makes it easy for them to take the next step.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start mb-14">
            {/* Current challenges */}
            <div className="bg-brand-white/70 rounded-2xl p-8 border border-brand-evergreen/8">
              <h3 className="font-semibold text-brand-evergreen mb-5 text-lg">What providers deal with today</h3>
              <ul className="space-y-4">
                {[
                  "Families find you through word-of-mouth — or not at all",
                  "Your website doesn't tell the full story of what you offer",
                  "Enrollment means email threads, PDFs, and manual follow-up",
                  "You don't know which families are interested until they reach out",
                  "Staying discoverable online takes time you don't have",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-text-muted/20 flex items-center justify-center shrink-0 mt-0.5">
                      <X className="h-3 w-3 text-text-muted" />
                    </div>
                    <span className="text-text-muted text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* HappiKid for providers */}
            <div className="bg-brand-white rounded-2xl p-8 border-2 border-action-teal/25 shadow-sm">
              <h3 className="font-semibold text-brand-evergreen mb-5 text-lg">
                <span className="text-action-teal">With HappiKid</span>
              </h3>
              <ul className="space-y-4">
                {[
                  { title: "A free, searchable profile", desc: "Get discovered by families actively searching for programs like yours — no ad budget required." },
                  { title: "High-intent inquiries", desc: "Parents arrive already comparing your program, not clicking a cold ad. These leads convert." },
                  { title: "Centralized messaging", desc: "Manage every family conversation in one place instead of scattered across email and DMs." },
                  { title: "Enrollment tools", desc: "Receive inquiries, track interest, and guide families from question to enrolled — with less friction." },
                  { title: "Demand insights", desc: "See what families in your area are searching for and how your profile is performing." },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-action-teal/15 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCheck className="h-3 w-3 text-action-teal" />
                    </div>
                    <div>
                      <span className="font-semibold text-brand-evergreen text-sm">{item.title} — </span>
                      <span className="text-text-muted text-sm">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                <Button onClick={() => setLocation("/providers")} className="w-full bg-action-teal hover:bg-action-teal/90 text-white rounded-lg" data-testid="button-providers-grow">
                  Grow With HappiKid
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Provider benefit cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Target, color: "text-action-teal", bg: "bg-action-teal/10", title: "Free listing", desc: "Claimable in minutes. No credit card needed to get started." },
              { icon: BarChart3, color: "text-brand-evergreen", bg: "bg-brand-white", title: "Demand analytics", desc: "Know what local families are searching for and how you compare." },
              { icon: Award, color: "text-action-clay", bg: "bg-action-clay/8", title: "Profile optimization", desc: "Guided tips to improve your ranking and attract more inquiries." },
              { icon: TrendingUp, color: "text-action-teal", bg: "bg-action-teal/10", title: "Growth tools", desc: "Start free. Add performance-based features as your enrollment grows." },
            ].map((card, i) => (
              <div key={i} className={`${card.bg} rounded-xl p-6 border border-brand-evergreen/6`}>
                <card.icon className={`h-7 w-7 ${card.color} mb-3`} />
                <h4 className="font-semibold text-brand-evergreen mb-1 text-sm">{card.title}</h4>
                <p className="text-text-muted text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-brand-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-headline text-4xl md:text-5xl text-brand-evergreen mb-4">
              How HappiKid works
            </h2>
            <p className="text-lg text-text-muted max-w-xl mx-auto">
              Whether you're a parent looking for programs or a provider looking for families, the process is built around you.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Parent flow */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-action-clay/15 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-action-clay" />
                </div>
                <h3 className="text-xl font-headline text-brand-evergreen">For parents</h3>
              </div>
              <div className="space-y-6">
                {[
                  { step: "1", icon: Search, title: "Search naturally", desc: "Type what you need in plain language — age, neighborhood, schedule, budget. No filters to figure out." },
                  { step: "2", icon: Eye, title: "Compare your options", desc: "Verified programs appear side by side with schedules, prices, safety records, and real reviews." },
                  { step: "3", icon: Shield, title: "Understand the fit", desc: "See licensing status, program details, and parent feedback. Know exactly what you're considering." },
                  { step: "4", icon: CheckCircle2, title: "Connect and enroll", desc: "Message providers directly, ask questions, and start enrollment — without starting from scratch each time." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-action-clay text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {item.step}
                    </div>
                    <div className="pt-1">
                      <h4 className="font-semibold text-brand-evergreen mb-1">{item.title}</h4>
                      <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Provider flow */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-action-teal/15 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-action-teal" />
                </div>
                <h3 className="text-xl font-headline text-brand-evergreen">For providers</h3>
              </div>
              <div className="space-y-6">
                {[
                  { step: "1", icon: Target, title: "Claim your free profile", desc: "Add your program details — ages, schedule, pricing, photos — in a structured format families can actually compare." },
                  { step: "2", icon: TrendingUp, title: "Improve your discoverability", desc: "Optimization tools guide you to complete your profile and rank higher in search results." },
                  { step: "3", icon: Users, title: "Receive better-matched demand", desc: "Families come to you already informed about your program — a warmer, higher-converting inquiry." },
                  { step: "4", icon: BarChart3, title: "Track and grow", desc: "See how many families viewed, saved, or inquired about your program. Use insights to improve." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-action-teal text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {item.step}
                    </div>
                    <div className="pt-1">
                      <h4 className="font-semibold text-brand-evergreen mb-1">{item.title}</h4>
                      <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE MARKET SHIFT ────────────────────────────────────── */}
      <section className="py-20 bg-brand-sage">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 bg-brand-white text-brand-evergreen border border-brand-evergreen/15 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest mb-4">
              <Sparkles className="h-3.5 w-3.5 text-action-clay" /> Why this matters now
            </span>
            <h2 className="font-headline text-4xl md:text-5xl text-brand-evergreen mb-4 leading-tight">
              How families find programs <br className="hidden md:block" /> is changing.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                icon: BrainCircuit,
                color: "text-action-clay",
                bg: "bg-brand-white",
                heading: "Parents expect better answers",
                body: "Families increasingly expect to describe what they need and get a relevant, trustworthy result — not a list of links to dig through.",
              },
              {
                icon: Eye,
                color: "text-action-teal",
                bg: "bg-brand-white",
                heading: "Providers need to be structured to be found",
                body: "Programs with incomplete or scattered online information are harder to surface — even for families actively looking for them.",
              },
              {
                icon: Shield,
                color: "text-brand-evergreen",
                bg: "bg-brand-white",
                heading: "Trust is the deciding factor",
                body: "When safety, cost, and schedule are all on the line, families choose the platform — and the programs — they can verify and trust.",
              },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} rounded-2xl p-7 border border-brand-evergreen/8 shadow-sm`}>
                <item.icon className={`h-8 w-8 ${item.color} mb-4`} />
                <h4 className="font-semibold text-brand-evergreen mb-2">{item.heading}</h4>
                <p className="text-text-muted text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="bg-brand-evergreen rounded-2xl p-8 text-center text-white">
            <p className="text-lg md:text-xl font-medium text-white/90 max-w-3xl mx-auto">
              HappiKid organizes fragmented program information into one trusted place — so parents get better answers faster, and providers get discovered by the families who are the best fit.
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS / TRUST ───────────────────────────────────────── */}
      <section className="py-20 bg-brand-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-headline text-4xl md:text-5xl text-brand-evergreen mb-4">
              The numbers behind the problem.
            </h2>
            <p className="text-lg text-text-muted max-w-xl mx-auto">
              Parents are stressed, time-constrained, and turning to new tools to navigate the process.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                stat: "79%",
                desc: "of parents have used AI tools, compared to 54% of non-parents",
                note: "Source: Modernizing Learning research, 2024",
                color: "text-action-clay",
                bg: "bg-action-clay/6",
              },
              {
                stat: "34%",
                desc: "of parents use AI specifically for childcare management",
                note: "Source: Modernizing Learning research, 2024",
                color: "text-action-teal",
                bg: "bg-action-teal/8",
              },
              {
                stat: "48%",
                desc: "of parents say stress is overwhelming on most days",
                note: "Source: American Psychological Association, Stress in America 2023",
                color: "text-brand-evergreen",
                bg: "bg-brand-sage",
              },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} rounded-2xl p-8 border border-brand-evergreen/8 text-center`}>
                <div className={`text-5xl font-bold mb-3 ${item.color}`}>{item.stat}</div>
                <p className="text-brand-evergreen font-medium mb-3 text-sm leading-relaxed">{item.desc}</p>
                <p className="text-text-muted text-xs italic">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── TESTIMONIALS ────────────────────────────────────────── */}
      <section className="py-20 bg-brand-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-headline text-3xl md:text-4xl text-brand-evergreen mb-2">What families are saying.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "Finding a daycare used to take weeks of spreadsheets and phone calls. With HappiKid, I found three great options in an afternoon.", author: "Sarah M.", location: "Brooklyn, NY" },
              { quote: "The verification gives me real peace of mind. I know every program I consider is properly licensed and legitimate.", author: "Michael T.", location: "Manhattan, NY" },
              { quote: "Finally — one place to compare schedules, prices, and reviews. I didn't realize how much time I was wasting before this.", author: "Jennifer K.", location: "Hoboken, NJ" },
            ].map((t, i) => (
              <Card key={i} className="bg-brand-white border border-brand-evergreen/10 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-current text-amber-400" />
                    ))}
                  </div>
                  <p className="text-brand-evergreen text-sm leading-relaxed mb-5">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${i === 0 ? "bg-action-sand" : i === 1 ? "bg-brand-sage" : "bg-action-teal/20"}`} />
                    <div>
                      <p className="font-semibold text-brand-evergreen text-sm">{t.author}</p>
                      <p className="text-xs text-text-muted">{t.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ─────────────────────────────────────────── */}
      <section className="py-24 bg-brand-evergreen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Parents CTA */}
            <div className="bg-white/8 border border-white/15 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-action-clay/20 flex items-center justify-center mx-auto mb-5">
                <Heart className="h-6 w-6 text-action-clay" />
              </div>
              <h3 className="font-headline text-2xl text-white mb-3">Find the right programs faster.</h3>
              <p className="text-white/70 mb-6 text-sm leading-relaxed">
                Search 5,500+ verified childcare and enrichment programs across NY, NJ &amp; CT. Free for parents, always.
              </p>
              <Button
                onClick={() => setLocation("/search")}
                className="bg-action-clay hover:bg-action-clay/90 text-white rounded-lg px-8 font-semibold w-full"
                data-testid="button-closing-parents"
              >
                Explore Programs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Providers CTA */}
            <div className="bg-white/8 border border-white/15 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-action-teal/25 flex items-center justify-center mx-auto mb-5">
                <Building2 className="h-6 w-6 text-action-teal" />
              </div>
              <h3 className="font-headline text-2xl text-white mb-3">Reach more families. Simplify enrollment.</h3>
              <p className="text-white/70 mb-6 text-sm leading-relaxed">
                Get a free listing, connect with high-intent parent leads, and manage inquiries — all in one place.
              </p>
              <Button
                onClick={() => setLocation("/providers")}
                variant="outline"
                className="border-2 border-action-teal text-action-teal bg-transparent hover:bg-action-teal hover:text-white rounded-lg px-8 font-semibold w-full"
                data-testid="button-closing-providers"
              >
                Grow With HappiKid
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="py-14 bg-brand-evergreen border-t border-white/10 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <a href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 text-white">
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="10" width="15" height="80" rx="4" fill="currentColor" />
                    <rect x="65" y="10" width="15" height="80" rx="4" fill="currentColor" />
                    <path d="M35 60 C35 60, 50 75, 65 60" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                    <circle cx="50" cy="35" r="7" className="text-action-clay fill-current" />
                  </svg>
                </div>
                <span className="font-headline text-2xl tracking-wide">HappiKid</span>
              </a>
              <p className="text-white/60 text-sm italic mb-3">Happy Parents. HappiKid.</p>
              <p className="text-white/50 text-sm leading-relaxed">Connecting families with trusted childcare and enrichment programs across NY, NJ &amp; CT.</p>
              <div className="flex gap-4 mt-5">
                <a href="#" className="hover:opacity-70 transition"><Facebook className="h-4 w-4" /></a>
                <a href="#" className="hover:opacity-70 transition"><Twitter className="h-4 w-4" /></a>
                <a href="#" className="hover:opacity-70 transition"><Instagram className="h-4 w-4" /></a>
                <a href="#" className="hover:opacity-70 transition"><Linkedin className="h-4 w-4" /></a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm">For Parents</h4>
              <ul className="space-y-2.5 text-white/70 text-sm">
                <li><span onClick={() => setLocation("/search")} className="hover:text-white cursor-pointer transition" data-testid="footer-find-programs">Find Programs</span></li>
                <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
                <li><span onClick={() => setLocation("/search?type=afterschool")} className="hover:text-white cursor-pointer transition">After-School</span></li>
                <li><span onClick={() => setLocation("/search?type=camp")} className="hover:text-white cursor-pointer transition">Summer Camps</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm">For Providers</h4>
              <ul className="space-y-2.5 text-white/70 text-sm">
                <li><a href="/providers" className="hover:text-white transition">List Your Program</a></li>
                <li><a href="/providers" className="hover:text-white transition">Claim Your Profile</a></li>
                <li><a href="/providers" className="hover:text-white transition">Provider Dashboard</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-2.5 text-white/70 text-sm">
                <li><span onClick={() => setLocation("/about")} className="hover:text-white cursor-pointer transition">About Us</span></li>
                <li><span onClick={() => setLocation("/contact")} className="hover:text-white cursor-pointer transition">Contact</span></li>
                <li><span onClick={() => setLocation("/about")} className="hover:text-white cursor-pointer transition">Our Story</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/15 pt-8 text-center text-white/40 text-xs">
            <p>&copy; 2026 HappiKid. All rights reserved. | <a href="#" className="hover:text-white">Privacy Policy</a> | <a href="#" className="hover:text-white">Terms of Service</a></p>
          </div>
        </div>
      </footer>

    </div>
  );
}
