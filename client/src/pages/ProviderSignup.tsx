import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Building2,
  Shield,
  TrendingUp,
  Users,
  Star,
  Crown,
  CheckCircle,
  ArrowRight,
  Heart,
  MessageCircle,
  Clock
} from "lucide-react";

export default function ProviderSignup() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated providers to onboarding
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      setLocation("/provider/onboarding");
    }
  }, [isAuthenticated, isLoading, user, setLocation]);

  const handleSignup = () => {
    // Redirect to Replit Auth with return path
    window.location.href = "/api/login?returnTo=/provider/onboarding";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-warm">
        <Navigation />
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen gradient-warm">
      <Navigation />
      
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg mb-6">
              <Building2 className="h-5 w-5 text-secondary-500" />
              <span className="text-sm font-semibold text-gray-700">Provider Signup</span>
              <Crown className="h-5 w-5 text-accent-500" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Claim Your <span className="text-secondary-500">Free Page</span> 
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Join <span className="font-semibold text-primary-600">700+ trusted providers</span> and connect with families in the NYC tri-state area
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Side - Benefits */}
            <div className="space-y-6">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <TrendingUp className="h-6 w-6 text-secondary-500 mr-3" />
                    Why HappiKid?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Free Profile Setup</h4>
                      <p className="text-gray-600 text-sm">Create your profile at no cost - no hidden fees</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Qualified Leads</h4>
                      <p className="text-gray-600 text-sm">Connect with pre-qualified families in your area</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Professional Presence</h4>
                      <p className="text-gray-600 text-sm">Stand out with verified badge and professional profile</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Growth Analytics</h4>
                      <p className="text-gray-600 text-sm">Track profile views, inquiries, and enrollment trends</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Indicators */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="bg-secondary-100 p-4 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-secondary-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">100%</p>
                      <p className="text-xs text-gray-600">Verified</p>
                    </div>
                    <div>
                      <div className="bg-primary-100 p-4 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">700+</p>
                      <p className="text-xs text-gray-600">Providers</p>
                    </div>
                    <div>
                      <div className="bg-accent-100 p-4 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                        <Star className="h-6 w-6 text-accent-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">4.8</p>
                      <p className="text-xs text-gray-600">Avg Rating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Signup Form */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Get Started Today</CardTitle>
                <CardDescription>
                  Sign in to create your provider profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Trust Message */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Safe & Secure Login</h3>
                    <p className="text-sm text-gray-700">
                      We use Replit's secure authentication system. Your personal information is protected and never shared.
                    </p>
                  </div>

                  {/* Sign In Button */}
                  <Button 
                    size="lg" 
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 text-lg font-semibold"
                    onClick={handleSignup}
                  >
                    Continue with Replit
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>

                  <Separator />

                  {/* What's Next */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">What happens next?</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">1</Badge>
                        <span>Create your secure account</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">2</Badge>
                        <span>Complete your profile in 5 minutes</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">3</Badge>
                        <span>Get verified and start connecting</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Features Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-lg mb-4 inline-block border border-secondary-100">
                <Heart className="h-10 w-10 text-coral-500" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">❤️ Parent-First Platform</h3>
              <p className="text-gray-700 leading-relaxed">Designed to help parents find the perfect fit for their families</p>
            </div>
            <div className="text-center">
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-lg mb-4 inline-block border border-accent-100">
                <MessageCircle className="h-10 w-10 text-accent-500" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">💬 Direct Communication</h3>
              <p className="text-gray-700 leading-relaxed">Connect directly with interested families in your area</p>
            </div>
            <div className="text-center">
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-lg mb-4 inline-block border border-primary-100">
                <Clock className="h-10 w-10 text-primary-500" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">⚡ Quick Setup</h3>
              <p className="text-gray-700 leading-relaxed">Get your profile live in minutes, not days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}