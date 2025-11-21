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
  Brain,
  Network,
  MessageSquare,
  Star,
  Clock,
  Users,
  Award,
  MapPin,
  Calendar,
  Code,
  Music,
  Palette
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch total provider count
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
      {/* Modern Warm Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-sm bg-[var(--ivory)]/95 border-b border-[var(--warm-gray)]/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6" style={{color: 'var(--deep-coral)'}} />
              <span className="text-xl font-display" style={{color: 'var(--taupe)'}}>HappiKid</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              <a href="#" style={{color: 'var(--taupe)'}} className="hover:opacity-70 transition">For Parents</a>
              <a href="#" style={{color: 'var(--taupe)'}} className="hover:opacity-70 transition">For Providers</a>
              <a href="#" style={{color: 'var(--taupe)'}} className="hover:opacity-70 transition">How It Works</a>
              <a href="#" style={{color: 'var(--taupe)'}} className="hover:opacity-70 transition">About</a>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setLocation("/search")}
                className="rounded-md text-white font-medium shadow-md hover:shadow-lg transition-all"
                style={{backgroundColor: 'var(--deep-coral)'}}
                data-testid="button-nav-find-programs"
              >
                Find Programs
              </Button>
              <Button 
                variant="outline" 
                className="rounded-md font-medium border-2 hidden sm:inline-flex"
                style={{borderColor: 'var(--taupe)', color: 'var(--taupe)'}}
                data-testid="button-nav-list-program"
              >
                List Your Program
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION - Asymmetric, Warm Gradient */}
      <section className="relative overflow-hidden py-20 sm:py-28" style={{background: 'linear-gradient(135deg, var(--peach) 0%, var(--deep-coral) 100%)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side */}
            <div className="text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm">
                <Sparkles className="h-4 w-4" style={{color: 'var(--amber)'}} />
                <span className="text-sm font-medium" style={{color: 'var(--taupe)'}}>AI-Powered Childcare & Enrichment Search</span>
              </div>

              <h1 className="text-5xl sm:text-6xl font-display text-white leading-tight">
                Find the <span className="relative inline-block">
                  <span className="relative z-10">right care</span>
                  <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" style={{fill: 'var(--mustard)'}}>
                    <path d="M0,8 Q50,2 100,6 T200,8 L200,12 L0,12 Z" opacity="0.6"/>
                  </svg>
                </span>, camps, and activities for your little ones
              </h1>

              <p className="text-lg text-white/90 leading-relaxed">
                One platform for daycares, after-school, camps, sports, tutoring, and schools — powered by a childcare-specific decision engine.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg"
                  onClick={() => setLocation("/search")}
                  className="rounded-md text-white font-semibold shadow-lg hover:shadow-xl transition-all px-8"
                  style={{backgroundColor: 'var(--taupe)'}}
                  data-testid="button-hero-start-searching"
                >
                  Start Searching
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="rounded-md font-medium border-2 border-white text-white hover:bg-white/10"
                  data-testid="button-hero-how-it-works"
                >
                  How HappiKid Works
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-white/80">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Verified data</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Parent-first</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Free to use</span>
                </div>
              </div>
            </div>

            {/* Right Side - Search Card */}
            <div className="relative">
              <Card className="relative z-10 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-sm bg-white/95">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-display mb-6" style={{color: 'var(--taupe)'}}>Start Your Search</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{color: 'var(--taupe)'}}>What are you looking for?</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{color: 'var(--warm-gray)'}} />
                        <Input
                          placeholder="Daycare, camp, tutoring..."
                          className="pl-10 rounded-lg border-2"
                          style={{borderColor: 'var(--sage-light)'}}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={handleKeyPress}
                          data-testid="input-hero-card-search"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{color: 'var(--taupe)'}}>Child's age</label>
                      <Input
                        placeholder="e.g., 3 years old"
                        className="rounded-lg border-2"
                        style={{borderColor: 'var(--sage-light)'}}
                        data-testid="input-hero-card-age"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{color: 'var(--taupe)'}}>Location</label>
                      <Input
                        placeholder="Manhattan, Brooklyn..."
                        className="rounded-lg border-2"
                        style={{borderColor: 'var(--sage-light)'}}
                        data-testid="input-hero-card-location"
                      />
                    </div>

                    <Button 
                      onClick={handleSearch}
                      className="w-full rounded-lg text-white font-semibold py-6 shadow-md hover:shadow-lg transition-all"
                      style={{backgroundColor: 'var(--deep-coral)'}}
                      data-testid="button-hero-card-search"
                    >
                      Search Programs
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Organic decorative shape */}
              <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20 blur-2xl" style={{backgroundColor: 'var(--mustard)'}}></div>
              <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-20 blur-3xl" style={{backgroundColor: 'var(--sage)'}}></div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROBLEM SECTION - "Childcare Search is Broken" */}
      <section className="py-20" style={{backgroundColor: 'var(--sage-light)'}}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-display mb-8" style={{color: 'var(--taupe)'}}>
            Childcare search is <span style={{color: 'var(--deep-coral)'}}>broken</span>.
          </h2>
          
          <p className="text-xl mb-12 opacity-80" style={{color: 'var(--taupe)'}}>
            Parents bounce across 6–10 tabs just to find one option. It's chaotic, outdated, and overwhelming.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: MessageSquare, label: 'Facebook Groups', color: 'var(--terracotta)' },
              { icon: Search, label: 'Google Maps', color: 'var(--mustard-dark)' },
              { icon: BookOpen, label: 'Mom Blogs', color: 'var(--sage-dark)' },
              { icon: Shield, label: 'State PDFs', color: 'var(--teal-blue)' }
            ].map((item, i) => (
              <Card key={i} className="p-6 text-center hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm rounded-xl">
                <item.icon className="h-8 w-8 mx-auto mb-3" style={{color: item.color}} />
                <p className="text-sm font-medium" style={{color: 'var(--taupe)'}}>{item.label}</p>
              </Card>
            ))}
          </div>

          <p className="mt-8 text-lg font-medium" style={{color: 'var(--taupe)'}}>
            <span className="px-4 py-2 rounded-full" style={{backgroundColor: 'var(--terracotta-light)'}}>
              HappiKid unifies everything in one intelligent platform.
            </span>
          </p>
        </div>
      </section>

      {/* 3. UNIFIED JOURNEY SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-display mb-4" style={{color: 'var(--taupe)'}}>
              Families move across categories — <br />HappiKid unifies them.
            </h2>
            <p className="text-lg" style={{color: 'var(--warm-gray)'}}>
              One journey. One platform. From infancy to school age.
            </p>
          </div>

          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 hidden md:block" style={{backgroundColor: 'var(--sage-light)'}}></div>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6 relative">
              {[
                { icon: Baby, label: 'Infant Care', age: '0-12mo' },
                { icon: School, label: 'Preschool', age: '2-4yr' },
                { icon: BookOpen, label: 'After-School', age: '5-12yr' },
                { icon: Trophy, label: 'Activities', age: '3-12yr' },
                { icon: GraduationCap, label: 'Tutoring', age: '6-18yr' },
                { icon: TreePine, label: 'Camps', age: 'All ages' }
              ].map((stage, i) => (
                <div key={i} className="text-center">
                  <div 
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 shadow-lg hover:scale-110 transition-transform"
                    style={{backgroundColor: i % 3 === 0 ? 'var(--terracotta-light)' : i % 3 === 1 ? 'var(--sage-light)' : 'var(--mustard-light)'}}
                  >
                    <stage.icon className="h-10 w-10" style={{color: 'var(--taupe)'}} />
                  </div>
                  <p className="font-semibold mb-1" style={{color: 'var(--taupe)'}}>{stage.label}</p>
                  <p className="text-sm" style={{color: 'var(--warm-gray)'}}>{stage.age}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. CATEGORY DISCOVERY GRID */}
      <section className="py-20" style={{backgroundColor: 'var(--cream)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-display mb-4" style={{color: 'var(--taupe)'}}>
              Discover Programs by Category
            </h2>
            <p className="text-lg" style={{color: 'var(--warm-gray)'}}>
              {totalCount && `${totalCount.count.toLocaleString()}+ verified programs across the tri-state area`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                icon: Baby, 
                title: 'Daycare & Preschool', 
                desc: 'Licensed full-day care for infants through pre-K',
                color: 'var(--terracotta)',
                bgColor: 'var(--terracotta-light)',
                type: 'daycare'
              },
              { 
                icon: School, 
                title: 'After-School Programs', 
                desc: 'Safe, enriching activities after school hours',
                color: 'var(--sage-dark)',
                bgColor: 'var(--sage-light)',
                type: 'afterschool'
              },
              { 
                icon: Trophy, 
                title: 'Sports & Activities', 
                desc: 'Soccer, gymnastics, martial arts, and more',
                color: 'var(--mustard-dark)',
                bgColor: 'var(--mustard-light)',
                type: 'afterschool'
              },
              { 
                icon: BookOpen, 
                title: 'Tutoring & Enrichment', 
                desc: 'Academic support and STEM programs',
                color: 'var(--teal-blue)',
                bgColor: 'hsl(185, 50%, 85%)',
                type: 'afterschool'
              },
              { 
                icon: TreePine, 
                title: 'Summer & Holiday Camps', 
                desc: 'Day camps and specialty programs',
                color: 'var(--olive)',
                bgColor: 'hsl(75, 25%, 85%)',
                type: 'camp'
              },
              { 
                icon: GraduationCap, 
                title: 'Private & Microschools', 
                desc: 'Independent schools and learning pods',
                color: 'var(--deep-coral)',
                bgColor: 'hsl(6, 75%, 85%)',
                type: 'school'
              }
            ].map((cat, i) => (
              <Card 
                key={i} 
                className="group cursor-pointer overflow-hidden hover:shadow-2xl transition-all duration-300 rounded-2xl border-2 border-transparent hover:scale-105"
                style={{backgroundColor: 'white'}}
                onClick={() => handleCategoryClick(cat.type)}
                data-testid={`card-category-${cat.type}`}
              >
                <CardContent className="p-8">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{backgroundColor: cat.bgColor}}
                  >
                    <cat.icon className="h-8 w-8" style={{color: cat.color}} />
                  </div>
                  <h3 className="text-xl font-display mb-2" style={{color: 'var(--taupe)'}}>{cat.title}</h3>
                  <p className="text-sm mb-4" style={{color: 'var(--warm-gray)'}}>{cat.desc}</p>
                  <div className="flex items-center gap-2 text-sm font-medium" style={{color: cat.color}}>
                    Explore
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5. AI DECISION ENGINE - THE MOAT */}
      <section className="py-20" style={{backgroundColor: 'var(--terracotta-light)'}}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-display mb-4" style={{color: 'var(--taupe)'}}>
              AI search isn't the innovation — <br />the decision engine behind it is.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: Network,
                title: 'Childcare Knowledge Graph',
                desc: 'Structured data on programs, pedagogy, licensing, and parent needs'
              },
              {
                icon: Brain,
                title: 'Explainable Recommendations',
                desc: 'Transparent matching logic you can trust and understand'
              },
              {
                icon: Zap,
                title: 'Cross-Category Reasoning',
                desc: 'Connect infant care to preschool to camps in one search'
              }
            ].map((feature, i) => (
              <Card key={i} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{backgroundColor: 'var(--mustard-light)'}}>
                    <feature.icon className="h-8 w-8" style={{color: 'var(--taupe)'}} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3" style={{color: 'var(--taupe)'}}>{feature.title}</h3>
                  <p style={{color: 'var(--warm-gray)'}}>{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{backgroundColor: 'var(--sage-light)'}}>
                <Search className="h-5 w-5" style={{color: 'var(--taupe)'}} />
              </div>
              <div>
                <p className="text-sm font-medium mb-2" style={{color: 'var(--warm-gray)'}}>Example Query:</p>
                <p className="text-lg font-medium" style={{color: 'var(--taupe)'}}>
                  "Find full-day programs with extended hours near the PATH train that accept 2-year-olds starting in March."
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 6. SOCIAL PROOF - STATS & TESTIMONIALS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left - Stats */}
            <div className="space-y-8">
              <h2 className="text-4xl font-display" style={{color: 'var(--taupe)'}}>
                Trusted by thousands <br />across NY, NJ & CT
              </h2>
              
              <div className="space-y-6">
                {[
                  { number: totalCount ? `${totalCount.count.toLocaleString()}+` : '5,500+', label: 'Programs Analyzed', icon: Target },
                  { number: '85.3%', label: 'Government Verified', icon: Shield },
                  { number: '3 States', label: 'Tri-State Coverage', icon: MapPin }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-4 p-6 rounded-2xl" style={{backgroundColor: 'var(--cream)'}}>
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{backgroundColor: 'var(--sage-light)'}}>
                      <stat.icon className="h-7 w-7" style={{color: 'var(--taupe)'}} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold" style={{color: 'var(--taupe)'}}>{stat.number}</p>
                      <p style={{color: 'var(--warm-gray)'}}>{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Testimonials */}
            <div className="space-y-6">
              {[
                {
                  quote: "Finding a daycare used to take weeks. With HappiKid, I found three great options in an afternoon.",
                  author: "Sarah M.",
                  role: "Parent, Brooklyn"
                },
                {
                  quote: "The government verification gives me peace of mind. I know every program is licensed and legitimate.",
                  author: "Michael T.",
                  role: "Parent, Manhattan"
                }
              ].map((testimonial, i) => (
                <Card key={i} className="bg-white border-2 rounded-2xl shadow-md hover:shadow-lg transition-shadow" style={{borderColor: 'var(--sage-light)'}}>
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-5 w-5 fill-current" style={{color: 'var(--mustard-dark)'}} />
                      ))}
                    </div>
                    <p className="text-lg mb-4" style={{color: 'var(--taupe)'}}>"{testimonial.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full" style={{backgroundColor: 'var(--terracotta-light)'}}></div>
                      <div>
                        <p className="font-semibold" style={{color: 'var(--taupe)'}}>{testimonial.author}</p>
                        <p className="text-sm" style={{color: 'var(--warm-gray)'}}>{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. PROVIDER GROWTH SECTION - B2B VALUE */}
      <section className="py-20" style={{backgroundColor: 'var(--warm-sand)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-display mb-4" style={{color: 'var(--taupe)'}}>
              Providers don't need admin tools — <br />they need <span style={{color: 'var(--deep-coral)'}}>growth</span>.
            </h2>
            <p className="text-lg" style={{color: 'var(--warm-gray)'}}>
              We drive enrollment, not just organization.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left - Value Props */}
            <div className="space-y-6">
              {[
                { icon: TrendingUp, title: 'SEO-Optimized Landing Pages', desc: 'Rank higher in Google for local childcare searches' },
                { icon: BarChart3, title: 'Demand Insights', desc: 'See what parents in your area are searching for' },
                { icon: Award, title: 'Profile Optimization Tools', desc: 'Gamified scoring system to improve visibility' },
                { icon: Users, title: 'Cross-Category Exposure', desc: 'Parents find you across multiple program types' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{backgroundColor: 'var(--sage-light)'}}>
                    <item.icon className="h-6 w-6" style={{color: 'var(--taupe)'}} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1" style={{color: 'var(--taupe)'}}>{item.title}</h3>
                    <p style={{color: 'var(--warm-gray)'}}>{item.desc}</p>
                  </div>
                </div>
              ))}
              
              <Button 
                size="lg"
                className="rounded-md text-white font-semibold shadow-lg hover:shadow-xl transition-all mt-6"
                style={{backgroundColor: 'var(--deep-coral)'}}
                data-testid="button-provider-list-program"
              >
                List Your Program (Free During MVP)
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Right - Dashboard Mockup */}
            <Card className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-br p-6" style={{background: 'linear-gradient(135deg, var(--sage-dark) 0%, var(--teal-blue) 100%)'}}>
                <p className="text-white font-semibold">Provider Dashboard</p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="p-4 rounded-xl" style={{backgroundColor: 'var(--cream)'}}>
                  <p className="text-sm mb-2" style={{color: 'var(--warm-gray)'}}>Profile Optimization Score</p>
                  <div className="flex items-center gap-3">
                    <div className="text-4xl font-bold" style={{color: 'var(--sage-dark)'}}>87</div>
                    <div className="flex-1 h-3 rounded-full" style={{backgroundColor: 'var(--sage-light)'}}>
                      <div className="h-full rounded-full" style={{backgroundColor: 'var(--sage-dark)', width: '87%'}}></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl" style={{backgroundColor: 'var(--terracotta-light)'}}>
                    <p className="text-sm mb-1" style={{color: 'var(--taupe)'}}>Monthly Inquiries</p>
                    <p className="text-2xl font-bold" style={{color: 'var(--taupe)'}}>24</p>
                  </div>
                  <div className="p-4 rounded-xl" style={{backgroundColor: 'var(--mustard-light)'}}>
                    <p className="text-sm mb-1" style={{color: 'var(--taupe)'}}>Profile Views</p>
                    <p className="text-2xl font-bold" style={{color: 'var(--taupe)'}}>342</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border-2" style={{borderColor: 'var(--sage-light)'}}>
                  <p className="text-sm mb-3 font-medium" style={{color: 'var(--taupe)'}}>Growth Insights</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" style={{color: 'var(--sage-dark)'}} />
                      <span style={{color: 'var(--taupe)'}}>Add photos to increase inquiries 40%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" style={{color: 'var(--sage-dark)'}} />
                      <span style={{color: 'var(--taupe)'}}>Complete pricing info for better ranking</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 8. AI FUTURE SECTION - "The OpenTable of Childcare" */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-display mb-6" style={{color: 'var(--taupe)'}}>
            AI is replacing Google — <br />HappiKid becomes the source.
          </h2>
          <p className="text-xl mb-12" style={{color: 'var(--warm-gray)'}}>
            AI assistants need structured childcare data, decision logic, and trusted endpoints. <br />We provide all three.
          </p>

          <div className="relative max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-4">
              {['Structured Data', 'Decision Logic', 'Verified Results'].map((item, i) => (
                <div key={i} className="p-6 rounded-2xl" style={{backgroundColor: 'var(--cream)'}}>
                  <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3" style={{backgroundColor: 'var(--teal-blue)', color: 'white'}}>
                    {i + 1}
                  </div>
                  <p className="font-medium" style={{color: 'var(--taupe)'}}>{item}</p>
                </div>
              ))}
            </div>
            
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{color: 'var(--sage-light)'}}>
              <line x1="16%" y1="50%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="84%" y2="50%" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
          </div>
        </div>
      </section>

      {/* 9. ROADMAP - "Why Now" */}
      <section className="py-20" style={{backgroundColor: 'var(--sage-light)'}}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-display mb-4" style={{color: 'var(--taupe)'}}>Why Now?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Parents Overwhelmed',
                desc: 'Childcare search is the #1 pain point for families',
                stat: '6-10 tabs per search'
              },
              {
                icon: TrendingUp,
                title: 'Providers Struggling',
                desc: 'Enrollment down, marketing budgets thin',
                stat: '40% vacancy increase'
              },
              {
                icon: Brain,
                title: 'AI Needs Vertical Data',
                desc: 'Generic search can\'t handle childcare complexity',
                stat: 'Structured > scraped'
              }
            ].map((item, i) => (
              <Card key={i} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div 
                    className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                    style={{backgroundColor: i === 0 ? 'var(--terracotta-light)' : i === 1 ? 'var(--mustard-light)' : 'var(--sage-light)'}}
                  >
                    <item.icon className="h-8 w-8" style={{color: 'var(--taupe)'}} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3" style={{color: 'var(--taupe)'}}>{item.title}</h3>
                  <p className="mb-4" style={{color: 'var(--warm-gray)'}}>{item.desc}</p>
                  <Badge className="rounded-full px-4 py-1" style={{backgroundColor: 'var(--deep-coral)', color: 'white'}}>
                    {item.stat}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA BANNER */}
      <section className="py-20" style={{background: 'linear-gradient(135deg, var(--deep-coral) 0%, var(--amber) 100%)'}}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-display text-white mb-4">
            Ready to find the right fit for your child?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            HappiKid is free for parents during MVP.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg"
              onClick={() => setLocation("/search")}
              className="rounded-md bg-white font-semibold shadow-xl hover:shadow-2xl transition-all px-8"
              style={{color: 'var(--deep-coral)'}}
              data-testid="button-cta-start-searching"
            >
              Start Searching
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="rounded-md font-medium border-2 border-white text-white hover:bg-white/10"
              data-testid="button-cta-list-program"
            >
              List Your Program
            </Button>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="py-16" style={{backgroundColor: 'var(--taupe)', color: 'white'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Company */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-6 w-6" />
                <span className="text-xl font-display">HappiKid</span>
              </div>
              <p className="text-white/80 mb-6 leading-relaxed">
                The AI-powered platform connecting families with trusted childcare and enrichment programs across the tri-state area.
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

            {/* For Parents */}
            <div>
              <h4 className="font-semibold mb-4">For Parents</h4>
              <ul className="space-y-3 text-white/80">
                <li><a href="/search" className="hover:text-white transition">Find Programs</a></li>
                <li><a href="#" className="hover:text-white transition">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition">Reviews</a></li>
                <li><a href="#" className="hover:text-white transition">Resources</a></li>
              </ul>
            </div>

            {/* For Providers */}
            <div>
              <h4 className="font-semibold mb-4">For Providers</h4>
              <ul className="space-y-3 text-white/80">
                <li><a href="#" className="hover:text-white transition">List Your Program</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Success Stories</a></li>
                <li><a href="#" className="hover:text-white transition">Support</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-white/80">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
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
