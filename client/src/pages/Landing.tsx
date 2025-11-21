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
  ThumbsUp,
  Lightbulb,
  Home
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
      {/* Modern Warm Navbar - Consistent Branding */}
      <nav className="sticky top-0 z-50 backdrop-blur-sm bg-[var(--ivory)]/95 border-b border-[var(--warm-gray)]/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
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
                className="rounded-md font-medium border-2 hidden sm:inline-flex hover:bg-gray-50"
                style={{borderColor: 'var(--taupe)', color: 'var(--taupe)'}}
                data-testid="button-nav-list-program"
              >
                List Your Program
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION - Parent-First, Warm & Welcoming */}
      <section className="relative overflow-hidden py-20 sm:py-28" style={{background: 'linear-gradient(135deg, var(--peach) 0%, var(--deep-coral) 100%)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side */}
            <div className="text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm">
                <Sparkles className="h-4 w-4" style={{color: 'var(--amber)'}} />
                <span className="text-sm font-medium" style={{color: 'var(--taupe)'}}>Smarter Childcare Search</span>
              </div>

              <h1 className="text-5xl sm:text-6xl font-display text-white leading-tight">
                Find the <span className="relative inline-block">
                  <span className="relative z-10">perfect fit</span>
                  <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" style={{fill: 'var(--mustard)'}}>
                    <path d="M0,8 Q50,2 100,6 T200,8 L200,12 L0,12 Z" opacity="0.7"/>
                  </svg>
                </span> for your child's care and growth
              </h1>

              <p className="text-lg text-white/90 leading-relaxed">
                Search daycare, after-school programs, camps, sports, tutoring, and schools all in one place. Every program verified and ready to welcome your family.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg"
                  onClick={() => setLocation("/search")}
                  className="rounded-md text-white font-semibold shadow-lg hover:shadow-xl transition-all px-8"
                  style={{backgroundColor: 'var(--taupe)'}}
                  data-testid="button-hero-find-programs"
                >
                  Find Programs
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="rounded-md font-medium border-2 border-white text-white hover:bg-white/10"
                  data-testid="button-hero-list-program"
                >
                  List Your Program
                </Button>
              </div>

              {/* Parent Reassurance Line */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-white font-medium pt-2">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Free for parents</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Verified programs</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>One search for all care types</span>
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
              
              {/* Brighter decorative shapes */}
              <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-30 blur-2xl" style={{backgroundColor: 'var(--amber)'}}></div>
              <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-30 blur-3xl" style={{backgroundColor: 'var(--mint)'}}></div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROBLEM SECTION - Parent-Relatable */}
      <section className="py-20" style={{backgroundColor: 'var(--sage-light)'}}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-display mb-8" style={{color: 'var(--taupe)'}}>
            Finding childcare shouldn't be this <span style={{color: 'var(--deep-coral)'}}>hard</span>.
          </h2>
          
          <p className="text-xl mb-12" style={{color: 'var(--taupe)', opacity: 0.85}}>
            You deserve better than juggling 6-10 tabs, scrolling through Facebook groups, and calling dozens of programs just to find one good option.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: MessageSquare, label: 'Facebook Groups', color: 'var(--deep-coral)' },
              { icon: Search, label: 'Google Maps', color: 'var(--amber)' },
              { icon: BookOpen, label: 'Parent Blogs', color: 'var(--sage-dark)' },
              { icon: Shield, label: 'State Websites', color: 'var(--teal-blue)' }
            ].map((item, i) => (
              <Card key={i} className="p-6 text-center hover:shadow-lg transition-shadow bg-white backdrop-blur-sm rounded-xl">
                <item.icon className="h-9 w-9 mx-auto mb-3" style={{color: item.color}} />
                <p className="text-sm font-medium" style={{color: 'var(--taupe)'}}>{item.label}</p>
              </Card>
            ))}
          </div>

          <p className="mt-8 text-lg font-semibold" style={{color: 'var(--taupe)'}}>
            <span className="px-6 py-3 rounded-full inline-block" style={{backgroundColor: 'var(--terracotta-light)', color: 'var(--taupe)'}}>
              HappiKid brings it all together in one simple search.
            </span>
          </p>
        </div>
      </section>

      {/* 3. UNIFIED JOURNEY SECTION - Parent Journey */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-display mb-4" style={{color: 'var(--taupe)'}}>
              Your child's journey, <br />all in one place.
            </h2>
            <p className="text-lg" style={{color: 'var(--warm-gray)'}}>
              From infant care to summer camps, find everything your family needs.
            </p>
          </div>

          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 hidden md:block" style={{backgroundColor: 'var(--sage-light)'}}></div>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6 relative">
              {[
                { icon: Baby, label: 'Infant Care', age: '0-12mo', color: 'var(--deep-coral)' },
                { icon: School, label: 'Preschool', age: '2-4yr', color: 'var(--amber)' },
                { icon: BookOpen, label: 'After-School', age: '5-12yr', color: 'var(--sage-dark)' },
                { icon: Trophy, label: 'Activities', age: '3-12yr', color: 'var(--teal-blue)' },
                { icon: GraduationCap, label: 'Tutoring', age: '6-18yr', color: 'var(--terracotta)' },
                { icon: TreePine, label: 'Camps', age: 'All ages', color: 'var(--olive)' }
              ].map((stage, i) => (
                <div key={i} className="text-center">
                  <div 
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 shadow-lg hover:scale-110 transition-transform cursor-pointer"
                    style={{backgroundColor: i % 3 === 0 ? 'var(--terracotta-light)' : i % 3 === 1 ? 'hsl(45, 80%, 85%)' : 'var(--sage-light)'}}
                  >
                    <stage.icon className="h-10 w-10" style={{color: stage.color}} />
                  </div>
                  <p className="font-semibold mb-1" style={{color: 'var(--taupe)'}}>{stage.label}</p>
                  <p className="text-sm" style={{color: 'var(--warm-gray)'}}>{stage.age}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. CATEGORY DISCOVERY GRID - Brighter & More Joyful */}
      <section className="py-20" style={{backgroundColor: 'var(--cream)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-display mb-4" style={{color: 'var(--taupe)'}}>
              Explore Programs for Your Family
            </h2>
            <p className="text-lg" style={{color: 'var(--warm-gray)'}}>
              {totalCount && `${totalCount.count.toLocaleString()}+ verified programs across NY, NJ & CT`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                icon: Baby, 
                title: 'Daycare & Preschool', 
                desc: 'Safe, nurturing care for infants through pre-K',
                color: 'var(--deep-coral)',
                bgColor: 'hsl(6, 85%, 88%)',
                type: 'daycare'
              },
              { 
                icon: School, 
                title: 'After-School Programs', 
                desc: 'Fun activities that keep kids learning and growing',
                color: 'var(--sage-dark)',
                bgColor: 'hsl(145, 30%, 82%)',
                type: 'afterschool'
              },
              { 
                icon: Trophy, 
                title: 'Sports & Activities', 
                desc: 'Soccer, gymnastics, dance, martial arts & more',
                color: 'var(--amber)',
                bgColor: 'hsl(35, 85%, 85%)',
                type: 'afterschool'
              },
              { 
                icon: BookOpen, 
                title: 'Tutoring & Enrichment', 
                desc: 'Academic support and STEM learning',
                color: 'var(--teal-blue)',
                bgColor: 'hsl(185, 55%, 80%)',
                type: 'afterschool'
              },
              { 
                icon: TreePine, 
                title: 'Summer & Holiday Camps', 
                desc: 'Adventure, learning, and new friendships',
                color: 'var(--olive)',
                bgColor: 'hsl(75, 35%, 82%)',
                type: 'camp'
              },
              { 
                icon: GraduationCap, 
                title: 'Private & Microschools', 
                desc: 'Personalized education for every learner',
                color: 'var(--terracotta)',
                bgColor: 'hsl(12, 65%, 85%)',
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
                    <cat.icon className="h-9 w-9" style={{color: cat.color}} />
                  </div>
                  <h3 className="text-xl font-display mb-2" style={{color: 'var(--taupe)'}}>{cat.title}</h3>
                  <p className="text-sm mb-4" style={{color: 'var(--warm-gray)'}}>{cat.desc}</p>
                  <div className="flex items-center gap-2 text-sm font-semibold" style={{color: cat.color}}>
                    Browse Options
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SMART MATCHING - Parent Outcomes (Rewritten AI Section) */}
      <section className="py-20" style={{backgroundColor: 'var(--terracotta-light)'}}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-display mb-4" style={{color: 'var(--taupe)'}}>
              Not just search. <br /><span style={{color: 'var(--deep-coral)'}}>Smarter matches</span> for your family.
            </h2>
            <p className="text-lg" style={{color: 'var(--taupe)', opacity: 0.85}}>
              We understand what makes a program right for your child — not just keywords.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: ThumbsUp,
                title: 'Programs that fit your needs',
                desc: 'Find care that matches your schedule, location, and what matters most to your family'
              },
              {
                icon: Lightbulb,
                title: 'Clear, honest recommendations',
                desc: 'Understand exactly why each program is suggested and what makes it special'
              },
              {
                icon: Home,
                title: 'See the full picture',
                desc: 'Compare daycare, after-school, and camps side-by-side to plan ahead'
              }
            ].map((feature, i) => (
              <Card key={i} className="bg-white backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{backgroundColor: i === 0 ? 'hsl(35, 85%, 85%)' : i === 1 ? 'hsl(185, 55%, 80%)' : 'hsl(145, 30%, 82%)'}}>
                    <feature.icon className="h-9 w-9" style={{color: i === 0 ? 'var(--amber)' : i === 1 ? 'var(--teal-blue)' : 'var(--sage-dark)'}} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3" style={{color: 'var(--taupe)'}}>{feature.title}</h3>
                  <p style={{color: 'var(--warm-gray)'}}>{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{backgroundColor: 'hsl(145, 30%, 82%)'}}>
                <Search className="h-5 w-5" style={{color: 'var(--sage-dark)'}} />
              </div>
              <div>
                <p className="text-sm font-medium mb-2 opacity-70" style={{color: 'var(--warm-gray)'}}>Real search example:</p>
                <p className="text-lg font-medium" style={{color: 'var(--taupe)'}}>
                  "Full-day programs near the PATH train that take 2-year-olds starting in March"
                </p>
                <p className="text-sm mt-3" style={{color: 'var(--warm-gray)'}}>
                  HappiKid understands your location, timing, and age requirements all at once.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 6. SOCIAL PROOF - Trust & Community */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left - Stats */}
            <div className="space-y-8">
              <h2 className="text-4xl font-display" style={{color: 'var(--taupe)'}}>
                Trusted by families <br />across the tri-state area
              </h2>
              
              <div className="space-y-6">
                {[
                  { number: totalCount ? `${totalCount.count.toLocaleString()}+` : '5,500+', label: 'Verified Programs', icon: Target, bg: 'hsl(6, 85%, 88%)', color: 'var(--deep-coral)' },
                  { number: '85.3%', label: 'Government Verified', icon: Shield, bg: 'hsl(145, 30%, 82%)', color: 'var(--sage-dark)' },
                  { number: 'NY, NJ, CT', label: 'Tri-State Coverage', icon: MapPin, bg: 'hsl(35, 85%, 85%)', color: 'var(--amber)' }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-4 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow" style={{backgroundColor: stat.bg}}>
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white shadow-sm">
                      <stat.icon className="h-7 w-7" style={{color: stat.color}} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold" style={{color: 'var(--taupe)'}}>{stat.number}</p>
                      <p className="font-medium" style={{color: 'var(--taupe)'}}>{stat.label}</p>
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
                },
                {
                  quote: "I love that I can search for summer camps and after-school programs all in one place. It saves so much time!",
                  author: "Jennifer L.",
                  role: "Parent, Hoboken"
                }
              ].map((testimonial, i) => (
                <Card key={i} className="bg-white border-2 rounded-2xl shadow-md hover:shadow-lg transition-shadow" style={{borderColor: 'var(--sage-light)'}}>
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-5 w-5 fill-current" style={{color: 'var(--amber)'}} />
                      ))}
                    </div>
                    <p className="text-base mb-4 leading-relaxed" style={{color: 'var(--taupe)'}}>"{testimonial.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full" style={{backgroundColor: i === 0 ? 'var(--terracotta-light)' : i === 1 ? 'hsl(145, 30%, 82%)' : 'hsl(35, 85%, 85%)'}}></div>
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

      {/* 7. PROVIDER GROWTH - Parent-Friendly Benefits */}
      <section className="py-20" style={{backgroundColor: 'var(--warm-sand)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-display mb-4" style={{color: 'var(--taupe)'}}>
              For Providers: <br />Reach families actively searching for you
            </h2>
            <p className="text-lg" style={{color: 'var(--warm-gray)'}}>
              Get discovered by parents who need exactly what you offer.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left - Value Props (Parent-Friendly) */}
            <div className="space-y-6">
              {[
                { icon: Users, title: 'Connect with families near you', desc: 'Parents find you when they search for programs in your area' },
                { icon: TrendingUp, title: 'Fill open spots faster', desc: 'Get inquiries from families ready to enroll' },
                { icon: Award, title: 'Show what makes you special', desc: 'Highlight your unique approach, curriculum, and values' },
                { icon: Clock, title: 'Save time on marketing', desc: 'Focus on teaching while we bring families to you' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{backgroundColor: i % 2 === 0 ? 'hsl(145, 30%, 82%)' : 'hsl(35, 85%, 85%)'}}>
                    <item.icon className="h-6 w-6" style={{color: i % 2 === 0 ? 'var(--sage-dark)' : 'var(--amber)'}} />
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
                <p className="text-white font-semibold">Your Provider Dashboard</p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="p-4 rounded-xl" style={{backgroundColor: 'hsl(145, 30%, 90%)'}}>
                  <p className="text-sm mb-2 font-medium" style={{color: 'var(--taupe)'}}>Profile Visibility Score</p>
                  <div className="flex items-center gap-3">
                    <div className="text-4xl font-bold" style={{color: 'var(--sage-dark)'}}>87</div>
                    <div className="flex-1 h-3 rounded-full" style={{backgroundColor: 'var(--sage-light)'}}>
                      <div className="h-full rounded-full" style={{backgroundColor: 'var(--sage-dark)', width: '87%'}}></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl" style={{backgroundColor: 'hsl(6, 85%, 88%)'}}>
                    <p className="text-sm mb-1 font-medium" style={{color: 'var(--taupe)'}}>New Inquiries</p>
                    <p className="text-2xl font-bold" style={{color: 'var(--deep-coral)'}}>24</p>
                    <p className="text-xs opacity-70" style={{color: 'var(--taupe)'}}>This month</p>
                  </div>
                  <div className="p-4 rounded-xl" style={{backgroundColor: 'hsl(35, 85%, 85%)'}}>
                    <p className="text-sm mb-1 font-medium" style={{color: 'var(--taupe)'}}>Profile Views</p>
                    <p className="text-2xl font-bold" style={{color: 'var(--amber)'}}>342</p>
                    <p className="text-xs opacity-70" style={{color: 'var(--taupe)'}}>This month</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border-2" style={{borderColor: 'var(--sage-light)'}}>
                  <p className="text-sm mb-3 font-semibold" style={{color: 'var(--taupe)'}}>Quick Tips</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" style={{color: 'var(--sage-dark)'}} />
                      <span style={{color: 'var(--taupe)'}}>Add photos to get 40% more inquiries</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" style={{color: 'var(--sage-dark)'}} />
                      <span style={{color: 'var(--taupe)'}}>Complete pricing to rank higher</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 8. WHY NOW - Parent-Relevant */}
      <section className="py-20" style={{backgroundColor: 'var(--sage-light)'}}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-display mb-4" style={{color: 'var(--taupe)'}}>
              Built for today's families
            </h2>
            <p className="text-lg" style={{color: 'var(--warm-gray)'}}>
              The childcare landscape is changing. HappiKid brings clarity and trust to the search.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Parents need better tools',
                desc: 'Searching for childcare is the #1 challenge for working families',
                badge: 'For You'
              },
              {
                icon: Shield,
                title: 'Trust matters more than ever',
                desc: 'Government-verified programs give you confidence and peace of mind',
                badge: 'Verified'
              },
              {
                icon: Sparkles,
                title: 'Smarter search saves time',
                desc: 'Find programs that fit your needs without the endless scrolling',
                badge: 'Simple'
              }
            ].map((item, i) => (
              <Card key={i} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div 
                    className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                    style={{backgroundColor: i === 0 ? 'hsl(6, 85%, 88%)' : i === 1 ? 'hsl(145, 30%, 82%)' : 'hsl(35, 85%, 85%)'}}
                  >
                    <item.icon className="h-8 w-8" style={{color: i === 0 ? 'var(--deep-coral)' : i === 1 ? 'var(--sage-dark)' : 'var(--amber)'}} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3" style={{color: 'var(--taupe)'}}>{item.title}</h3>
                  <p className="mb-4 leading-relaxed" style={{color: 'var(--warm-gray)'}}>{item.desc}</p>
                  <Badge className="rounded-full px-4 py-1 font-medium" style={{backgroundColor: i === 0 ? 'var(--deep-coral)' : i === 1 ? 'var(--sage-dark)' : 'var(--amber)', color: 'white'}}>
                    {item.badge}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA BANNER */}
      <section className="py-20" style={{background: 'linear-gradient(135deg, var(--deep-coral) 0%, var(--amber) 100%)'}}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-display text-white mb-4">
            Ready to find the perfect program for your child?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Start searching now — it's completely free for parents.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg"
              onClick={() => setLocation("/search")}
              className="rounded-md bg-white font-semibold shadow-xl hover:shadow-2xl transition-all px-8"
              style={{color: 'var(--deep-coral)'}}
              data-testid="button-cta-find-programs"
            >
              Find Programs
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="rounded-md font-semibold border-2 border-white text-white hover:bg-white/10"
              data-testid="button-cta-list-program"
            >
              List Your Program
            </Button>
          </div>
        </div>
      </section>

      {/* 10. FOOTER - Consistent Branding */}
      <footer className="py-16" style={{backgroundColor: 'var(--taupe)', color: 'white'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Company */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-6 w-6" style={{color: 'var(--deep-coral)'}} />
                <span className="text-xl font-display">HappiKid</span>
              </div>
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
