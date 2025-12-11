import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  Search, 
  Shield, 
  Sparkles,
  Baby,
  School,
  TreePine,
  GraduationCap,
  BookOpen,
  Trophy,
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
  X
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
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

  const handleCategoryClick = (type: string) => {
    setLocation(`/search?type=${type}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="relative w-full bg-gradient-to-br from-brand-sage via-brand-white to-action-sand px-6 pt-20 pb-32 flex flex-col items-center justify-center text-center">
        <h1 className="font-headline text-5xl md:text-6xl text-brand-evergreen mb-6 max-w-4xl leading-tight">
          The village, <span className="text-action-clay italic">verified.</span>
        </h1>
        
        <p className="font-body text-text-muted text-lg md:text-xl mb-10 max-w-2xl">
          Describe what you need. Our AI checks availability, safety records, and pricing across the entire ecosystem.
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
              className="bg-action-clay hover:bg-action-clay/90 text-white px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap"
              data-testid="button-hero-ask"
            >
              Ask HappiKid
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted font-medium">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-action-teal"></div> Verified Safety
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-action-teal"></div> Real-time Pricing
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-action-teal"></div> No Ads
          </span>
        </div>
      </section>

      <section className="w-full bg-brand-white border-b border-brand-evergreen/10 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <button 
              onClick={() => setLocation("/search?type=daycare")}
              className="group flex flex-col items-center gap-3 min-w-[100px] p-2 rounded-xl hover:bg-brand-sage/50 transition-colors"
              data-testid="category-daycare"
            >
              <div className="w-12 h-12 rounded-full bg-brand-sage flex items-center justify-center text-brand-evergreen group-hover:bg-brand-evergreen group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <span className="font-body text-sm font-semibold text-brand-evergreen">Daycare</span>
            </button>

            <button 
              onClick={() => setLocation("/search?type=camp")}
              className="group flex flex-col items-center gap-3 min-w-[100px] p-2 rounded-xl hover:bg-brand-sage/50 transition-colors"
              data-testid="category-camps"
            >
              <div className="w-12 h-12 rounded-full bg-brand-sage flex items-center justify-center text-brand-evergreen group-hover:bg-brand-evergreen group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
              </div>
              <span className="font-body text-sm font-semibold text-brand-evergreen">Summer Camps</span>
            </button>

            <button 
              onClick={() => setLocation("/search?type=afterschool")}
              className="group flex flex-col items-center gap-3 min-w-[100px] p-2 rounded-xl hover:bg-brand-sage/50 transition-colors"
              data-testid="category-afterschool"
            >
              <div className="w-12 h-12 rounded-full bg-brand-sage flex items-center justify-center text-brand-evergreen group-hover:bg-brand-evergreen group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              </div>
              <span className="font-body text-sm font-semibold text-brand-evergreen">After School</span>
            </button>

            <button 
              onClick={() => setLocation("/search?type=sports")}
              className="group flex flex-col items-center gap-3 min-w-[100px] p-2 rounded-xl hover:bg-brand-sage/50 transition-colors"
              data-testid="category-sports"
            >
              <div className="w-12 h-12 rounded-full bg-brand-sage flex items-center justify-center text-brand-evergreen group-hover:bg-brand-evergreen group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h18v18H3zM8 12h8m-4-4v8"></path></svg>
              </div>
              <span className="font-body text-sm font-semibold text-brand-evergreen">Youth Sports</span>
            </button>

            <button 
              onClick={() => setLocation("/search?type=tutoring")}
              className="group flex flex-col items-center gap-3 min-w-[100px] p-2 rounded-xl hover:bg-brand-sage/50 transition-colors"
              data-testid="category-tutoring"
            >
              <div className="w-12 h-12 rounded-full bg-brand-sage flex items-center justify-center text-brand-evergreen group-hover:bg-brand-evergreen group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
              </div>
              <span className="font-body text-sm font-semibold text-brand-evergreen">Tutoring</span>
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-headline mb-6 text-brand-evergreen">
                No more digging through Facebook groups, outdated sites, or endless calls
              </h2>
              <p className="text-lg leading-relaxed mb-6 text-text-muted">
                HappiKid shows you real choices with real information in one place, saving families hours and eliminating guesswork around pricing, availability, reviews, and safety.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Pricing', 'Availability', 'Reviews', 'Safety'].map((item, i) => (
                  <Badge key={i} className="px-4 py-2 text-sm font-medium rounded-full bg-brand-sage text-action-teal">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: MessageSquare, label: 'Facebook Groups', color: 'text-action-clay', bg: 'bg-action-sand' },
                { icon: Search, label: 'Google Maps', color: 'text-action-teal', bg: 'bg-brand-sage' },
                { icon: BookOpen, label: 'Parent Blogs', color: 'text-brand-evergreen', bg: 'bg-action-sand' },
                { icon: Shield, label: 'State PDFs', color: 'text-action-teal', bg: 'bg-brand-sage' }
              ].map((item, i) => (
                <Card key={i} className={`p-4 text-center rounded-2xl relative overflow-hidden ${item.bg}`}>
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center bg-white">
                    <X className="h-4 w-4 text-action-clay" />
                  </div>
                  <item.icon className={`h-8 w-8 mx-auto mb-2 ${item.color}`} />
                  <p className="text-xs font-medium text-brand-evergreen">{item.label}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-brand-sage">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Database, title: 'Collect', desc: 'Gather data from multiple sources', color: 'text-action-clay', bg: 'bg-white' },
                  { icon: Sparkles, title: 'Clean', desc: 'Standardize and verify information', color: 'text-action-teal', bg: 'bg-white' },
                  { icon: BarChart3, title: 'Compare', desc: 'Side-by-side program comparison', color: 'text-action-clay', bg: 'bg-white' },
                  { icon: Target, title: 'Connect', desc: 'Direct enrollment pathways', color: 'text-action-teal', bg: 'bg-white' }
                ].map((step, i) => (
                  <Card key={i} className={`p-5 rounded-2xl text-center shadow-md ${step.bg}`}>
                    <step.icon className={`h-8 w-8 mx-auto mb-2 ${step.color}`} />
                    <h4 className="font-semibold text-sm mb-1 text-brand-evergreen">{step.title}</h4>
                    <p className="text-xs text-text-muted">{step.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <Badge className="mb-4 px-4 py-2 text-xs font-semibold rounded-full bg-action-teal text-white">
                AI-Powered
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-headline mb-6 text-brand-evergreen">
                AI that organizes a fragmented childcare ecosystem
              </h2>
              <p className="text-lg leading-relaxed text-text-muted">
                HappiKid collects, cleans, and standardizes provider data into a searchable, side-by-side comparison tool. Families can compare instantly; providers gain visibility, trust, and full enrollment.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-2 text-xs font-semibold rounded-full bg-action-clay text-white">
              Ages 0–13
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-headline mb-4 text-brand-evergreen">
              All the child-focused programs you rely on
            </h2>
            <p className="text-lg max-w-3xl mx-auto text-text-muted">
              HappiKid serves the full ecosystem: daycare and early learning centers, after-school programs, camps, youth sports, tutoring, arts and STEM enrichment, and other activity-based businesses for ages 0–13. Our mission is to bring transparency, structure, and accessibility to all services families depend on year-round.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[
              { icon: Baby, label: 'Daycare & Early Learning', color: 'text-action-clay', bg: 'bg-action-sand' },
              { icon: School, label: 'Preschools', color: 'text-action-teal', bg: 'bg-brand-sage' },
              { icon: BookOpen, label: 'After-School Programs', color: 'text-action-clay', bg: 'bg-action-sand' },
              { icon: TreePine, label: 'Summer & Day Camps', color: 'text-action-teal', bg: 'bg-brand-sage' },
              { icon: Trophy, label: 'Youth Sports', color: 'text-action-clay', bg: 'bg-action-sand' },
              { icon: GraduationCap, label: 'Tutoring', color: 'text-action-teal', bg: 'bg-brand-sage' },
              { icon: Sparkles, label: 'Arts & STEM Enrichment', color: 'text-action-clay', bg: 'bg-action-sand' },
              { icon: Users, label: 'Activity Programs', color: 'text-action-teal', bg: 'bg-brand-sage' }
            ].map((category, i) => (
              <Card 
                key={i} 
                className={`p-5 text-center rounded-2xl cursor-pointer hover:shadow-lg transition-all hover:scale-105 ${category.bg}`}
                onClick={() => setLocation("/search")}
              >
                <category.icon className={`h-8 w-8 mx-auto mb-3 ${category.color}`} />
                <p className="text-sm font-medium text-brand-evergreen">{category.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-headline mb-4 text-brand-evergreen">
              Trusted by thousands across NY, NJ & CT
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              {[
                { number: totalCount ? `${totalCount.count.toLocaleString()}+` : '5,515+', label: 'Programs Analyzed', icon: Target, bg: 'bg-action-sand', color: 'text-action-clay' },
                { number: '85%', label: 'Verified Through Public Records', icon: Shield, bg: 'bg-brand-sage', color: 'text-action-teal' },
                { number: '3', label: 'States', icon: MapPin, bg: 'bg-amber-100', color: 'text-amber-500' }
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
                  quote: "Finding a daycare used to take weeks. With HappiKid, I found three great options in an afternoon.",
                  author: "Sarah M.",
                  role: "Brooklyn"
                },
                {
                  quote: "The verification gives me peace of mind. I know every program we consider is legitimate.",
                  author: "Michael T.",
                  role: "Manhattan"
                }
              ].map((testimonial, i) => (
                <Card key={i} className="bg-white border-2 rounded-2xl shadow-md hover:shadow-lg transition-shadow border-brand-evergreen/10">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-5 w-5 fill-current text-amber-500" />
                      ))}
                    </div>
                    <p className="text-base mb-4 leading-relaxed text-brand-evergreen">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${i === 0 ? 'bg-action-sand' : 'bg-brand-sage'}`}></div>
                      <div>
                        <p className="font-semibold text-brand-evergreen">{testimonial.author}</p>
                        <p className="text-sm text-text-muted">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-brand-sage">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-headline mb-4 text-brand-evergreen">
              How It Works
            </h2>
            <p className="text-lg max-w-2xl mx-auto text-text-muted">
              Finding the right childcare shouldn't be complicated. Here's how HappiKid makes it simple.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: Search,
                title: 'Search Programs',
                desc: 'Tell us what you need — age, location, type of care. We\'ll show you verified options in seconds.'
              },
              {
                step: '2',
                icon: Eye,
                title: 'Compare & Review',
                desc: 'See schedules, prices, reviews, and safety records all in one place. No more jumping between tabs.'
              },
              {
                step: '3',
                icon: CheckCircle2,
                title: 'Connect & Enroll',
                desc: 'Reach out to your favorites directly. We make it easy to ask questions and start the enrollment process.'
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

      <section className="py-20 bg-action-sand">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-headline mb-4 text-brand-evergreen">
              Smarter matches. <br />Clearer choices. Better outcomes.
            </h2>
            <p className="text-lg max-w-3xl mx-auto text-brand-evergreen/90">
              We organize the details that matter — schedules, age ranges, teaching styles, safety info, and more — so you can make confident decisions without the guesswork.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: Database,
                title: 'Childcare Knowledge Graph',
                desc: 'Structured, reliable information on programs, teaching styles, and licensing.',
                iconBg: 'bg-amber-100',
                iconColor: 'text-amber-500'
              },
              {
                icon: Lightbulb,
                title: 'Explainable Recommendations',
                desc: 'See why a program matches your needs — transparent, simple, and helpful.',
                iconBg: 'bg-cyan-100',
                iconColor: 'text-action-teal'
              },
              {
                icon: Network,
                title: 'Cross-Category Search',
                desc: 'Compare care types, camps, activities, and tutoring in one search.',
                iconBg: 'bg-brand-sage',
                iconColor: 'text-action-teal'
              }
            ].map((feature, i) => (
              <Card key={i} className="bg-white backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
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

      <section className="py-20 bg-lime-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-headline mb-4 text-brand-evergreen">
              Providers don't need more admin tools — <br />they need more families.
            </h2>
            <p className="text-lg text-text-muted">
              HappiKid helps you fill open spots, improve your visibility, and reach families searching for programs like yours.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {[
                { icon: TrendingUp, title: 'SEO-Optimized Profiles', desc: 'Show up in local searches when families look for care, camps, and enrichment.', iconBg: 'bg-brand-sage', iconColor: 'text-action-teal' },
                { icon: BarChart3, title: 'Demand Insights', desc: 'See what families in your area are searching for — and how your program compares.', iconBg: 'bg-amber-100', iconColor: 'text-amber-500' },
                { icon: Award, title: 'Profile Boosting Tools', desc: 'We guide you step-by-step to strengthen your profile and attract more inquiries.', iconBg: 'bg-brand-sage', iconColor: 'text-action-teal' },
                { icon: Target, title: 'Cross-Category Exposure', desc: 'Be discovered across daycare, after-school, camps, and activities — all from one listing.', iconBg: 'bg-amber-100', iconColor: 'text-amber-500' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                    <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-brand-evergreen">{item.title}</h3>
                    <p className="text-text-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
              
              <Button 
                size="lg"
                className="rounded-md bg-action-clay text-white font-semibold shadow-lg hover:shadow-xl hover:bg-action-clay/90 transition-all mt-6"
                data-testid="button-provider-list-program"
              >
                List Your Program (Free During MVP)
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <Card className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-action-teal to-cyan-600 p-6">
                <p className="text-white font-semibold">Your Provider Dashboard</p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-brand-sage/50">
                  <p className="text-sm mb-2 font-medium text-brand-evergreen">Profile Visibility Score</p>
                  <div className="flex items-center gap-3">
                    <div className="text-4xl font-bold text-action-teal">87</div>
                    <div className="flex-1 h-3 rounded-full bg-brand-evergreen/10">
                      <div className="h-full rounded-full bg-action-teal w-[87%]"></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-action-sand">
                    <p className="text-sm mb-1 font-medium text-brand-evergreen">New Inquiries</p>
                    <p className="text-2xl font-bold text-action-clay">24</p>
                    <p className="text-xs opacity-70 text-brand-evergreen">This month</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-100">
                    <p className="text-sm mb-1 font-medium text-brand-evergreen">Profile Views</p>
                    <p className="text-2xl font-bold text-amber-500">342</p>
                    <p className="text-xs opacity-70 text-brand-evergreen">This month</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border-2 border-brand-evergreen/10">
                  <p className="text-sm mb-3 font-semibold text-brand-evergreen">Quick Tips</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-action-teal" />
                      <span className="text-brand-evergreen">Add photos to get 40% more inquiries</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-action-teal" />
                      <span className="text-brand-evergreen">Complete pricing to rank higher</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-headline mb-4 text-brand-evergreen">
              Why families and providers need HappiKid now
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Parents Overwhelmed',
                desc: 'Childcare search is the #1 frustration for families.',
                badge: '6–10 tabs per search'
              },
              {
                icon: TrendingUp,
                title: 'Providers Struggling',
                desc: 'Enrollment is down, and programs need help reaching new families.',
                badge: '40% vacancy increase'
              },
              {
                icon: Zap,
                title: 'Complexity Rising',
                desc: 'Generic search tools can\'t handle childcare logistics, schedules, or age requirements.',
                badge: 'Structured > Scraped'
              }
            ].map((item, i) => (
              <div key={i} className="bg-brand-white border border-brand-evergreen/10 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-all">
                <div className="w-16 h-16 mx-auto bg-brand-sage rounded-full flex items-center justify-center mb-6 text-brand-evergreen">
                  <item.icon className="h-8 w-8" />
                </div>
                <h3 className="font-headline text-xl text-brand-evergreen mb-3">{item.title}</h3>
                <p className="font-body text-text-muted mb-4">{item.desc}</p>
                <Badge className="rounded-full px-4 py-1 font-medium text-xs bg-action-teal text-white">
                  {item.badge}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-brand-evergreen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-headline text-white mb-4">
            Ready to find the right fit for your child?
          </h2>
          <p className="text-xl text-white/95 mb-8">
            HappiKid is free for parents during MVP.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg"
              onClick={() => setLocation("/search")}
              className="rounded-md bg-white text-action-clay font-semibold shadow-xl hover:shadow-2xl transition-all px-8"
              data-testid="button-cta-find-programs"
            >
              Start Searching
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => setLocation("/providers")}
              className="rounded-md font-semibold border-2 border-white text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm"
              data-testid="button-cta-list-program"
            >
              List Your Program
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

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
              <p className="text-white/80 mb-6 leading-relaxed">
                Connecting families with trusted childcare and enrichment programs across NY, NJ & CT.
              </p>
              <div className="flex gap-4">
                <a href="#" className="hover:opacity-70 transition">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="hover:opacity-70 transition">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="hover:opacity-70 transition">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="hover:opacity-70 transition">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Parents</h4>
              <ul className="space-y-3 text-white/80">
                <li><span onClick={() => setLocation("/search")} className="hover:text-white transition cursor-pointer" data-testid="footer-find-programs">Find Programs</span></li>
                <li><a href="#how-it-works" className="hover:text-white transition" data-testid="footer-how-it-works">How It Works</a></li>
                <li><span onClick={() => setLocation("/search")} className="hover:text-white transition cursor-pointer" data-testid="footer-reviews">Reviews</span></li>
                <li><span onClick={() => setLocation("/search")} className="hover:text-white transition cursor-pointer" data-testid="footer-resources">Resources</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Providers</h4>
              <ul className="space-y-3 text-white/80">
                <li><span onClick={() => setLocation("/providers")} className="hover:text-white transition cursor-pointer" data-testid="footer-list-program">List Your Program</span></li>
                <li><span onClick={() => setLocation("/providers")} className="hover:text-white transition cursor-pointer" data-testid="footer-pricing">Pricing</span></li>
                <li><span onClick={() => setLocation("/providers")} className="hover:text-white transition cursor-pointer" data-testid="footer-success-stories">Success Stories</span></li>
                <li><span onClick={() => setLocation("/contact")} className="hover:text-white transition cursor-pointer" data-testid="footer-support">Support</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-white/80">
                <li><span onClick={() => setLocation("/about")} className="hover:text-white transition cursor-pointer" data-testid="footer-about">About Us</span></li>
                <li><span onClick={() => setLocation("/")} className="hover:text-white transition cursor-pointer" data-testid="footer-blog">Blog</span></li>
                <li><span onClick={() => setLocation("/about")} className="hover:text-white transition cursor-pointer" data-testid="footer-careers">Careers</span></li>
                <li><span onClick={() => setLocation("/contact")} className="hover:text-white transition cursor-pointer" data-testid="footer-contact">Contact</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 mt-12 pt-8 text-center text-white/60 text-sm">
            <p>&copy; 2025 HappiKid. All rights reserved. | <a href="#" className="hover:text-white">Privacy Policy</a> | <a href="#" className="hover:text-white">Terms of Service</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
