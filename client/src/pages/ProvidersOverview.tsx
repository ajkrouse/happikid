import Navigation from "@/components/Navigation";
import RoleSelectionModal from "@/components/RoleSelectionModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  MessageSquare, 
  Shield, 
  Star,
  CheckCircle,
  BarChart3,
  Globe,
  Clock,
  DollarSign,
  Award
} from "lucide-react";
import { useState } from "react";

export default function ProvidersOverview() {
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  
  const handleLogin = () => {
    window.location.href = "/api/login?returnTo=/provider/dashboard";
  };

  const handleGetStarted = () => {
    setShowRoleSelection(true);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(40, 25%, 97%)' }}>
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, hsl(145, 30%, 95%) 0%, hsl(40, 35%, 96%) 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-display mb-6" style={{ color: 'var(--taupe)' }}>
              Grow Your Childcare Business with HappiKid
            </h1>
            <p className="text-xl max-w-3xl mx-auto mb-8" style={{ color: 'var(--taupe)' }}>
              Join hundreds of trusted providers who are connecting with families, 
              managing inquiries, and growing their enrollment through our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="px-8 py-3 rounded-lg text-white shadow-md hover:shadow-lg" style={{ backgroundColor: 'var(--deep-coral)' }}>
                Get Started Free
              </Button>
              <Button variant="outline" size="lg" onClick={handleLogin} className="px-8 py-3 rounded-lg border-2 hover:opacity-90" style={{ borderColor: 'var(--taupe)', color: 'var(--taupe)' }}>
                Provider Login
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16" style={{ backgroundColor: 'var(--ivory)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display mb-4" style={{ color: 'var(--taupe)' }}>Why Choose HappiKid?</h2>
            <p className="text-xl" style={{ color: 'var(--taupe)' }}>Everything you need to succeed in one platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 rounded-2xl border hover:shadow-lg transition-shadow" style={{ backgroundColor: 'var(--ivory)', borderColor: 'var(--sage-light)' }}>
              <div className="p-3 rounded-full w-fit mb-4" style={{ backgroundColor: 'hsl(145, 30%, 90%)' }}>
                <Users className="h-6 w-6" style={{ color: 'var(--sage-dark)' }} />
              </div>
              <h3 className="text-xl font-display mb-3" style={{ color: 'var(--taupe)' }}>Connect with Families</h3>
              <p style={{ color: 'var(--taupe)' }}>
                Reach thousands of parents actively searching for quality childcare in your area.
              </p>
            </Card>

            <Card className="p-6 rounded-2xl border hover:shadow-lg transition-shadow" style={{ backgroundColor: 'var(--ivory)', borderColor: 'var(--terracotta-light)' }}>
              <div className="p-3 rounded-full w-fit mb-4" style={{ backgroundColor: 'var(--terracotta-light)' }}>
                <TrendingUp className="h-6 w-6" style={{ color: 'var(--terracotta)' }} />
              </div>
              <h3 className="text-xl font-display mb-3" style={{ color: 'var(--taupe)' }}>Increase Enrollment</h3>
              <p style={{ color: 'var(--taupe)' }}>
                Our smart matching system connects you with families looking for exactly what you offer.
              </p>
            </Card>

            <Card className="p-6 rounded-2xl border hover:shadow-lg transition-shadow" style={{ backgroundColor: 'var(--ivory)', borderColor: 'var(--mustard-light)' }}>
              <div className="p-3 rounded-full w-fit mb-4" style={{ backgroundColor: 'var(--mustard-light)' }}>
                <MessageSquare className="h-6 w-6" style={{ color: 'var(--mustard-dark)' }} />
              </div>
              <h3 className="text-xl font-display mb-3" style={{ color: 'var(--taupe)' }}>Streamlined Communication</h3>
              <p style={{ color: 'var(--taupe)' }}>
                Manage all parent inquiries and communications from one organized dashboard.
              </p>
            </Card>

            <Card className="p-6 rounded-2xl border hover:shadow-lg transition-shadow" style={{ backgroundColor: 'var(--ivory)', borderColor: 'var(--sage-light)' }}>
              <div className="p-3 rounded-full w-fit mb-4" style={{ backgroundColor: 'var(--sage-light)' }}>
                <BarChart3 className="h-6 w-6" style={{ color: 'var(--sage-dark)' }} />
              </div>
              <h3 className="text-xl font-display mb-3" style={{ color: 'var(--taupe)' }}>Analytics & Insights</h3>
              <p style={{ color: 'var(--taupe)' }}>
                Track your profile performance, inquiry conversion, and optimize your visibility.
              </p>
            </Card>

            <Card className="p-6 rounded-2xl border hover:shadow-lg transition-shadow" style={{ backgroundColor: 'var(--ivory)', borderColor: 'var(--sage-light)' }}>
              <div className="p-3 rounded-full w-fit mb-4" style={{ backgroundColor: 'var(--sage-light)' }}>
                <Shield className="h-6 w-6" style={{ color: 'var(--sage-dark)' }} />
              </div>
              <h3 className="text-xl font-display mb-3" style={{ color: 'var(--taupe)' }}>Verified & Trusted</h3>
              <p style={{ color: 'var(--taupe)' }}>
                Build credibility with our verification process and authentic parent reviews.
              </p>
            </Card>

            <Card className="p-6 rounded-2xl border hover:shadow-lg transition-shadow" style={{ backgroundColor: 'var(--ivory)', borderColor: 'hsl(185, 55%, 78%)' }}>
              <div className="p-3 rounded-full w-fit mb-4" style={{ backgroundColor: 'hsl(185, 55%, 88%)' }}>
                <Globe className="h-6 w-6" style={{ color: 'var(--teal-blue)' }} />
              </div>
              <h3 className="text-xl font-display mb-3" style={{ color: 'var(--taupe)' }}>Tri-State Reach</h3>
              <p style={{ color: 'var(--taupe)' }}>
                Access families across NYC, Long Island, Westchester, and Northern New Jersey.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Success Statistics */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, var(--sage-light) 0%, var(--ivory) 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display mb-4" style={{ color: 'var(--taupe)' }}>Proven Results</h2>
            <p className="text-xl" style={{ color: 'var(--taupe)' }}>Real impact for childcare providers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="rounded-2xl p-6 shadow-lg" style={{ backgroundColor: 'var(--ivory)' }}>
                <div className="text-4xl font-display mb-2" style={{ color: 'var(--deep-coral)' }}>1,000+</div>
                <div style={{ color: 'var(--taupe)' }}>Active Providers</div>
              </div>
            </div>
            <div className="text-center">
              <div className="rounded-2xl p-6 shadow-lg" style={{ backgroundColor: 'var(--ivory)' }}>
                <div className="text-4xl font-display mb-2" style={{ color: 'var(--deep-coral)' }}>15K+</div>
                <div style={{ color: 'var(--taupe)' }}>Monthly Searches</div>
              </div>
            </div>
            <div className="text-center">
              <div className="rounded-2xl p-6 shadow-lg" style={{ backgroundColor: 'var(--ivory)' }}>
                <div className="text-4xl font-display mb-2" style={{ color: 'var(--deep-coral)' }}>85%</div>
                <div style={{ color: 'var(--taupe)' }}>Inquiry Response Rate</div>
              </div>
            </div>
            <div className="text-center">
              <div className="rounded-2xl p-6 shadow-lg" style={{ backgroundColor: 'var(--ivory)' }}>
                <div className="text-4xl font-display mb-2" style={{ color: 'var(--deep-coral)' }}>4.8★</div>
                <div style={{ color: 'var(--taupe)' }}>Average Provider Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16" style={{ backgroundColor: 'var(--ivory)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display mb-4" style={{ color: 'var(--taupe)' }}>How It Works</h2>
            <p className="text-xl" style={{ color: 'var(--taupe)' }}>Get started in minutes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--sage-light)' }}>
                <span className="text-2xl font-display" style={{ color: 'var(--sage-dark)' }}>1</span>
              </div>
              <h3 className="text-xl font-display mb-3" style={{ color: 'var(--taupe)' }}>Create Your Profile</h3>
              <p style={{ color: 'var(--taupe)' }}>
                Set up your childcare profile with photos, services, and availability in under 10 minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--terracotta-light)' }}>
                <span className="text-2xl font-display" style={{ color: 'var(--terracotta)' }}>2</span>
              </div>
              <h3 className="text-xl font-display mb-3" style={{ color: 'var(--taupe)' }}>Get Discovered</h3>
              <p style={{ color: 'var(--taupe)' }}>
                Our smart search algorithm matches you with families looking for your specific services.
              </p>
            </div>

            <div className="text-center">
              <div className="rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--mustard-light)' }}>
                <span className="text-2xl font-display" style={{ color: 'var(--mustard-dark)' }}>3</span>
              </div>
              <h3 className="text-xl font-display mb-3" style={{ color: 'var(--taupe)' }}>Manage & Grow</h3>
              <p style={{ color: 'var(--taupe)' }}>
                Handle inquiries, showcase your program, and build lasting relationships with families.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16" style={{ backgroundColor: 'var(--warm-sand)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display mb-4" style={{ color: 'var(--taupe)' }}>Simple, Transparent Pricing</h2>
            <p className="text-xl" style={{ color: 'var(--taupe)' }}>Choose the plan that works for your business</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="p-8 rounded-2xl border-2" style={{ backgroundColor: 'var(--ivory)', borderColor: 'var(--warm-gray)' }}>
              <div className="text-center">
                <h3 className="text-2xl font-display mb-2" style={{ color: 'var(--taupe)' }}>Basic</h3>
                <div className="text-4xl font-display mb-1" style={{ color: 'var(--taupe)' }}>Free</div>
                <p className="mb-6" style={{ color: 'var(--taupe)' }}>Perfect to get started</p>
                
                <Button variant="outline" className="w-full mb-6 border-2" onClick={handleGetStarted} style={{ borderColor: 'var(--taupe)', color: 'var(--taupe)' }}>
                  Get Started Free
                </Button>

                <div className="space-y-3 text-left">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3" style={{ color: 'var(--sage-dark)' }} />
                    <span style={{ color: 'var(--taupe)' }}>Basic profile listing</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3" style={{ color: 'var(--sage-dark)' }} />
                    <span style={{ color: 'var(--taupe)' }}>Up to 5 photos</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3" style={{ color: 'var(--sage-dark)' }} />
                    <span style={{ color: 'var(--taupe)' }}>Basic inquiry management</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3" style={{ color: 'var(--sage-dark)' }} />
                    <span style={{ color: 'var(--taupe)' }}>Parent reviews</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Premium Plan */}
            <Card className="p-8 rounded-2xl border-2" style={{ backgroundColor: 'var(--sage-light)', borderColor: 'var(--sage-dark)' }}>
              <div className="text-center">
                <div className="px-3 py-1 rounded-full text-sm font-semibold mb-3 inline-block text-white" style={{ backgroundColor: 'var(--deep-coral)' }}>
                  Most Popular
                </div>
                <h3 className="text-2xl font-display mb-2" style={{ color: 'var(--taupe)' }}>Premium</h3>
                <div className="text-4xl font-display mb-1" style={{ color: 'var(--taupe)' }}>$29<span className="text-xl" style={{ color: 'var(--taupe)' }}>/mo</span></div>
                <p className="mb-6" style={{ color: 'var(--taupe)' }}>Everything you need to grow</p>
                
                <Button className="w-full mb-6 text-white" onClick={handleGetStarted} style={{ backgroundColor: 'var(--deep-coral)' }}>
                  Start Premium Trial
                </Button>

                <div className="space-y-3 text-left">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3" style={{ color: 'var(--sage-dark)' }} />
                    <span style={{ color: 'var(--taupe)' }}>Everything in Basic</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3" style={{ color: 'var(--sage-dark)' }} />
                    <span style={{ color: 'var(--taupe)' }}>Priority search placement</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3" style={{ color: 'var(--sage-dark)' }} />
                    <span style={{ color: 'var(--taupe)' }}>Unlimited photos & videos</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3" style={{ color: 'var(--sage-dark)' }} />
                    <span style={{ color: 'var(--taupe)' }}>Advanced analytics</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3" style={{ color: 'var(--sage-dark)' }} />
                    <span style={{ color: 'var(--taupe)' }}>Featured provider badge</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3" style={{ color: 'var(--sage-dark)' }} />
                    <span style={{ color: 'var(--taupe)' }}>Priority customer support</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16" style={{ backgroundColor: 'var(--deep-coral)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-display mb-4 text-white">Ready to Grow Your Childcare Business?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-white opacity-90">
            Join hundreds of providers who are already connecting with families and growing their enrollment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="px-8 py-3 text-white border-2 border-white hover:bg-white" style={{ backgroundColor: 'transparent' }}>
              Get Started Free
            </Button>
            <Button size="lg" onClick={handleLogin} className="px-8 py-3 hover:opacity-90" style={{ backgroundColor: 'var(--ivory)', color: 'var(--deep-coral)' }}>
              Existing Provider? Login
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8" style={{ backgroundColor: 'var(--taupe)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p style={{ color: 'var(--warm-gray)' }}>
            Questions? Contact us at <a href="mailto:providers@happikid.com" className="hover:underline" style={{ color: 'var(--ivory)' }}>providers@happikid.com</a>
          </p>
        </div>
      </footer>
      
      {/* Role Selection Modal */}
      <RoleSelectionModal 
        isOpen={showRoleSelection}
        onClose={() => setShowRoleSelection(false)}
      />
    </div>
  );
}