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
    <div className="min-h-screen bg-brand-sage">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-20 bg-brand-sage">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-headline mb-6 text-brand-evergreen">
              Grow Your Childcare Business with HappiKid
            </h1>
            <p className="text-xl max-w-3xl mx-auto mb-8 text-brand-evergreen">
              Join hundreds of trusted providers who are connecting with families, 
              managing inquiries, and growing their enrollment through our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="px-8 py-3 rounded-lg text-white shadow-md hover:shadow-lg bg-action-clay hover:bg-action-clay/90">
                Get Started Free
              </Button>
              <Button variant="outline" size="lg" onClick={handleLogin} className="px-8 py-3 rounded-lg border-2 hover:opacity-90 border-brand-evergreen text-brand-evergreen">
                Provider Login
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-brand-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline mb-4 text-brand-evergreen">Why Choose HappiKid?</h2>
            <p className="text-xl text-brand-evergreen">Everything you need to succeed in one platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 rounded-2xl border hover:shadow-lg transition-shadow bg-brand-white border-brand-sage">
              <div className="p-3 rounded-full w-fit mb-4 bg-brand-sage">
                <Users className="h-6 w-6 text-brand-evergreen" />
              </div>
              <h3 className="text-xl font-headline mb-3 text-brand-evergreen">Connect with Families</h3>
              <p className="text-brand-evergreen">
                Reach thousands of parents actively searching for quality childcare in your area.
              </p>
            </Card>

            <Card className="p-6 rounded-2xl border hover:shadow-lg transition-shadow bg-brand-white border-action-clay/30">
              <div className="p-3 rounded-full w-fit mb-4 bg-action-clay/20">
                <TrendingUp className="h-6 w-6 text-action-clay" />
              </div>
              <h3 className="text-xl font-headline mb-3 text-brand-evergreen">Increase Enrollment</h3>
              <p className="text-brand-evergreen">
                Our smart matching system connects you with families looking for exactly what you offer.
              </p>
            </Card>

            <Card className="p-6 rounded-2xl border hover:shadow-lg transition-shadow bg-brand-white border-action-teal/30">
              <div className="p-3 rounded-full w-fit mb-4 bg-action-teal/20">
                <MessageSquare className="h-6 w-6 text-action-teal" />
              </div>
              <h3 className="text-xl font-headline mb-3 text-brand-evergreen">Streamlined Communication</h3>
              <p className="text-brand-evergreen">
                Manage all parent inquiries and communications from one organized dashboard.
              </p>
            </Card>

            <Card className="p-6 rounded-2xl border hover:shadow-lg transition-shadow bg-brand-white border-brand-sage">
              <div className="p-3 rounded-full w-fit mb-4 bg-brand-sage">
                <BarChart3 className="h-6 w-6 text-brand-evergreen" />
              </div>
              <h3 className="text-xl font-headline mb-3 text-brand-evergreen">Analytics & Insights</h3>
              <p className="text-brand-evergreen">
                Track your profile performance, inquiry conversion, and optimize your visibility.
              </p>
            </Card>

            <Card className="p-6 rounded-2xl border hover:shadow-lg transition-shadow bg-brand-white border-brand-sage">
              <div className="p-3 rounded-full w-fit mb-4 bg-brand-sage">
                <Shield className="h-6 w-6 text-brand-evergreen" />
              </div>
              <h3 className="text-xl font-headline mb-3 text-brand-evergreen">Verified & Trusted</h3>
              <p className="text-brand-evergreen">
                Build credibility with our verification process and authentic parent reviews.
              </p>
            </Card>

            <Card className="p-6 rounded-2xl border hover:shadow-lg transition-shadow bg-brand-white border-action-teal/30">
              <div className="p-3 rounded-full w-fit mb-4 bg-action-teal/20">
                <Globe className="h-6 w-6 text-action-teal" />
              </div>
              <h3 className="text-xl font-headline mb-3 text-brand-evergreen">Tri-State Reach</h3>
              <p className="text-brand-evergreen">
                Access families across NYC, Long Island, Westchester, and Northern New Jersey.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Success Statistics */}
      <section className="py-16 bg-brand-sage">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline mb-4 text-brand-evergreen">Proven Results</h2>
            <p className="text-xl text-brand-evergreen">Real impact for childcare providers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="rounded-2xl p-6 shadow-lg bg-brand-white">
                <div className="text-4xl font-headline mb-2 text-action-clay">1,000+</div>
                <div className="text-brand-evergreen">Active Providers</div>
              </div>
            </div>
            <div className="text-center">
              <div className="rounded-2xl p-6 shadow-lg bg-brand-white">
                <div className="text-4xl font-headline mb-2 text-action-clay">15K+</div>
                <div className="text-brand-evergreen">Monthly Searches</div>
              </div>
            </div>
            <div className="text-center">
              <div className="rounded-2xl p-6 shadow-lg bg-brand-white">
                <div className="text-4xl font-headline mb-2 text-action-clay">85%</div>
                <div className="text-brand-evergreen">Inquiry Response Rate</div>
              </div>
            </div>
            <div className="text-center">
              <div className="rounded-2xl p-6 shadow-lg bg-brand-white">
                <div className="text-4xl font-headline mb-2 text-action-clay">4.8★</div>
                <div className="text-brand-evergreen">Average Provider Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-brand-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline mb-4 text-brand-evergreen">How It Works</h2>
            <p className="text-xl text-brand-evergreen">Get started in minutes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-brand-sage">
                <span className="text-2xl font-headline text-brand-evergreen">1</span>
              </div>
              <h3 className="text-xl font-headline mb-3 text-brand-evergreen">Create Your Profile</h3>
              <p className="text-brand-evergreen">
                Set up your childcare profile with photos, services, and availability in under 10 minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-action-clay/20">
                <span className="text-2xl font-headline text-action-clay">2</span>
              </div>
              <h3 className="text-xl font-headline mb-3 text-brand-evergreen">Get Discovered</h3>
              <p className="text-brand-evergreen">
                Our smart search algorithm matches you with families looking for your specific services.
              </p>
            </div>

            <div className="text-center">
              <div className="rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-action-teal/20">
                <span className="text-2xl font-headline text-action-teal">3</span>
              </div>
              <h3 className="text-xl font-headline mb-3 text-brand-evergreen">Manage & Grow</h3>
              <p className="text-brand-evergreen">
                Handle inquiries, showcase your program, and build lasting relationships with families.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-action-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline mb-4 text-brand-evergreen">Simple, Transparent Pricing</h2>
            <p className="text-xl text-brand-evergreen">Choose the plan that works for your business</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="p-8 rounded-2xl border-2 bg-brand-white border-text-muted">
              <div className="text-center">
                <h3 className="text-2xl font-headline mb-2 text-brand-evergreen">Basic</h3>
                <div className="text-4xl font-headline mb-1 text-brand-evergreen">Free</div>
                <p className="mb-6 text-brand-evergreen">Perfect to get started</p>
                
                <Button variant="outline" className="w-full mb-6 border-2 border-brand-evergreen text-brand-evergreen" onClick={handleGetStarted}>
                  Get Started Free
                </Button>

                <div className="space-y-3 text-left">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3 text-brand-evergreen" />
                    <span className="text-brand-evergreen">Basic profile listing</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3 text-brand-evergreen" />
                    <span className="text-brand-evergreen">Up to 5 photos</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3 text-brand-evergreen" />
                    <span className="text-brand-evergreen">Basic inquiry management</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3 text-brand-evergreen" />
                    <span className="text-brand-evergreen">Parent reviews</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Premium Plan */}
            <Card className="p-8 rounded-2xl border-2 bg-brand-sage border-brand-evergreen">
              <div className="text-center">
                <div className="px-3 py-1 rounded-full text-sm font-semibold mb-3 inline-block text-white bg-action-clay">
                  Most Popular
                </div>
                <h3 className="text-2xl font-headline mb-2 text-brand-evergreen">Premium</h3>
                <div className="text-4xl font-headline mb-1 text-brand-evergreen">$29<span className="text-xl text-brand-evergreen">/mo</span></div>
                <p className="mb-6 text-brand-evergreen">Everything you need to grow</p>
                
                <Button className="w-full mb-6 text-white bg-action-clay hover:bg-action-clay/90" onClick={handleGetStarted}>
                  Start Premium Trial
                </Button>

                <div className="space-y-3 text-left">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3 text-brand-evergreen" />
                    <span className="text-brand-evergreen">Everything in Basic</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3 text-brand-evergreen" />
                    <span className="text-brand-evergreen">Priority search placement</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3 text-brand-evergreen" />
                    <span className="text-brand-evergreen">Unlimited photos & videos</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3 text-brand-evergreen" />
                    <span className="text-brand-evergreen">Advanced analytics</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3 text-brand-evergreen" />
                    <span className="text-brand-evergreen">Featured provider badge</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3 text-brand-evergreen" />
                    <span className="text-brand-evergreen">Priority customer support</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-action-clay">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-headline mb-4 text-white">Ready to Grow Your Childcare Business?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-white opacity-90">
            Join hundreds of providers who are already connecting with families and growing their enrollment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="px-8 py-3 text-white border-2 border-white hover:bg-white hover:text-action-clay bg-transparent">
              Get Started Free
            </Button>
            <Button size="lg" onClick={handleLogin} className="px-8 py-3 hover:opacity-90 bg-brand-white text-action-clay">
              Existing Provider? Login
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-brand-evergreen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-text-muted">
            Questions? Contact us at <a href="mailto:providers@happikid.com" className="hover:underline text-white">providers@happikid.com</a>
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
