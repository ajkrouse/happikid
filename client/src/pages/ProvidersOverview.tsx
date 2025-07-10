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
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Grow Your Childcare Business with HappiKid
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Join hundreds of trusted providers who are connecting with families, 
              managing inquiries, and growing their enrollment through our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="px-8 py-3">
                Get Started Free
              </Button>
              <Button variant="outline" size="lg" onClick={handleLogin} className="px-8 py-3">
                Provider Login
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose HappiKid?</h2>
            <p className="text-xl text-gray-600">Everything you need to succeed in one platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="bg-primary-100 p-3 rounded-full w-fit mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Connect with Families</h3>
              <p className="text-gray-600">
                Reach thousands of parents actively searching for quality childcare in your area.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="bg-secondary-100 p-3 rounded-full w-fit mb-4">
                <TrendingUp className="h-6 w-6 text-secondary-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Increase Enrollment</h3>
              <p className="text-gray-600">
                Our smart matching system connects you with families looking for exactly what you offer.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="bg-accent-100 p-3 rounded-full w-fit mb-4">
                <MessageSquare className="h-6 w-6 text-accent-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Streamlined Communication</h3>
              <p className="text-gray-600">
                Manage all parent inquiries and communications from one organized dashboard.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="bg-primary-100 p-3 rounded-full w-fit mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics & Insights</h3>
              <p className="text-gray-600">
                Track your profile performance, inquiry conversion, and optimize your visibility.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="bg-green-100 p-3 rounded-full w-fit mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Verified & Trusted</h3>
              <p className="text-gray-600">
                Build credibility with our verification process and authentic parent reviews.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="bg-purple-100 p-3 rounded-full w-fit mb-4">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Tri-State Reach</h3>
              <p className="text-gray-600">
                Access families across NYC, Long Island, Westchester, and Northern New Jersey.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Success Statistics */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Proven Results</h2>
            <p className="text-xl text-gray-600">Real impact for childcare providers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="text-4xl font-bold text-primary mb-2">1,000+</div>
                <div className="text-gray-600">Active Providers</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="text-4xl font-bold text-primary mb-2">15K+</div>
                <div className="text-gray-600">Monthly Searches</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="text-4xl font-bold text-primary mb-2">85%</div>
                <div className="text-gray-600">Inquiry Response Rate</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="text-4xl font-bold text-primary mb-2">4.8★</div>
                <div className="text-gray-600">Average Provider Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in minutes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Create Your Profile</h3>
              <p className="text-gray-600">
                Set up your childcare profile with photos, services, and availability in under 10 minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-secondary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-secondary-500">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Get Discovered</h3>
              <p className="text-gray-600">
                Our smart search algorithm matches you with families looking for your specific services.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-accent-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-accent-500">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Manage & Grow</h3>
              <p className="text-gray-600">
                Handle inquiries, showcase your program, and build lasting relationships with families.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Choose the plan that works for your business</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="p-8 border-2 border-gray-200">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic</h3>
                <div className="text-4xl font-bold text-gray-900 mb-1">Free</div>
                <p className="text-gray-600 mb-6">Perfect to get started</p>
                
                <Button variant="outline" className="w-full mb-6" onClick={handleGetStarted}>
                  Get Started Free
                </Button>

                <div className="space-y-3 text-left">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-600">Basic profile listing</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-600">Up to 5 photos</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-600">Basic inquiry management</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-600">Parent reviews</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Premium Plan */}
            <Card className="p-8 border-2 border-primary bg-primary-50">
              <div className="text-center">
                <div className="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold mb-3 inline-block">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                <div className="text-4xl font-bold text-gray-900 mb-1">$29<span className="text-xl text-gray-600">/mo</span></div>
                <p className="text-gray-600 mb-6">Everything you need to grow</p>
                
                <Button className="w-full mb-6" onClick={handleGetStarted}>
                  Start Premium Trial
                </Button>

                <div className="space-y-3 text-left">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-600">Everything in Basic</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-600">Priority search placement</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-600">Unlimited photos & videos</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-600">Advanced analytics</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-600">Featured provider badge</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-600">Priority customer support</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Grow Your Childcare Business?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join hundreds of providers who are already connecting with families and growing their enrollment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={handleGetStarted} className="px-8 py-3">
              Get Started Free
            </Button>
            <Button size="lg" variant="secondary" onClick={handleLogin} className="px-8 py-3 bg-white text-primary hover:bg-gray-100">
              Existing Provider? Login
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            Questions? Contact us at <a href="mailto:providers@happikid.com" className="text-white hover:underline">providers@happikid.com</a>
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