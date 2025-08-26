import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import { Heart, Baby, Search, Shield, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function ParentSignup() {
  const [formData, setFormData] = useState({
    zipCode: "",
    childAges: "",
    careType: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [showPreferences, setShowPreferences] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Handle initial auth check with timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoadComplete(true);
      if (isAuthenticated && user && !showPreferences) {
        setShowPreferences(true);
      }
    }, 1000); // Give 1 second for auth check

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, showPreferences]);

  // Update preferences when auth status changes
  useEffect(() => {
    if (initialLoadComplete && isAuthenticated && user && !showPreferences) {
      setShowPreferences(true);
    }
  }, [isAuthenticated, user, showPreferences, initialLoadComplete]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogin = () => {
    // Redirect to Replit Auth login
    window.location.href = "/api/login";
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Save user preferences to the backend
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: formData.zipCode,
          childAges: formData.childAges,
          careType: formData.careType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }
      
      toast({
        title: "Welcome to HappiKid!",
        description: "Your preferences have been saved. Let's find you great childcare options.",
      });

      // Redirect to search with their preferences
      const searchParams = new URLSearchParams();
      if (formData.careType) searchParams.append('type', formData.careType);
      if (formData.zipCode) searchParams.append('location', formData.zipCode);
      
      setLocation(`/search?${searchParams.toString()}`);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem saving your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state only for initial load
  if (authLoading && !initialLoadComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Navigation />
      
      <div className="max-w-2xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {isAuthenticated && showPreferences ? 'Tell Us About Your Needs' : 'Join HappiKid as a Parent'}
          </h1>
          <p className="text-lg text-gray-600">
            {isAuthenticated && showPreferences 
              ? `Welcome ${user?.firstName || 'there'}! Help us find the perfect childcare match for your family.`
              : 'Sign in to access 700+ verified childcare providers across NY, NJ & CT'
            }
          </p>
        </div>

        <Card className="card-playful">
          <CardHeader>
            <CardTitle>{isAuthenticated && showPreferences ? 'Your Childcare Preferences' : 'Sign in with Replit'}</CardTitle>
            <CardDescription>
              {isAuthenticated && showPreferences 
                ? 'This information helps us personalize your childcare search experience'
                : 'Quick and secure authentication to get started'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isAuthenticated ? (
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg text-center">
                  <LogIn className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Safe & Secure Login</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    We use Replit's secure authentication to protect your account and ensure a safe experience.
                  </p>
                  <Button 
                    onClick={handleLogin}
                    className="btn-pill"
                    size="lg"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign in with Replit
                  </Button>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-primary" />
                    What You'll Get
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Access to 700+ verified childcare providers</li>
                    <li>• Personalized search results based on your preferences</li>
                    <li>• Direct contact with providers and ability to save favorites</li>
                    <li>• Parent reviews and detailed provider information</li>
                  </ul>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePreferencesSubmit} className="space-y-6">
              {/* User is already authenticated, show their info */}
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {user?.profileImageUrl ? (
                      <img 
                        src={user.profileImageUrl} 
                        alt="Profile" 
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">
                      {user?.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : user?.email}
                    </p>
                    <p className="text-sm text-gray-600">Signed in successfully</p>
                  </div>
                </div>
              </div>

              {/* Childcare Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Baby className="h-5 w-5 mr-2 text-primary" />
                  Your Childcare Needs
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      type="text"
                      required
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      placeholder="e.g., 10001"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="childAges">Child Ages</Label>
                    <Input
                      id="childAges"
                      name="childAges"
                      type="text"
                      value={formData.childAges}
                      onChange={handleInputChange}
                      placeholder="e.g., 2 years, 4 years"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="careType">Type of Care Needed</Label>
                  <select
                    id="careType"
                    name="careType"
                    value={formData.careType}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select type of care</option>
                    <option value="daycare">Daycare Center</option>
                    <option value="afterschool">After-School Program</option>
                    <option value="school">Private School</option>
                    <option value="camp">Summer Camp</option>
                  </select>
                </div>
              </div>

              {/* Features */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-primary" />
                  What You'll Get
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Access to 700+ verified childcare providers</li>
                  <li>• Personalized search results based on your preferences</li>
                  <li>• Direct contact with providers and ability to save favorites</li>
                  <li>• Parent reviews and detailed provider information</li>
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full btn-pill" 
                size="lg"
                disabled={isLoading}
                data-testid="button-save-preferences"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving Preferences...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Search className="h-4 w-4 mr-2" />
                    Save Preferences & Start Searching
                  </div>
                )}
              </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {!isAuthenticated && (
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Want to browse without signing up?{" "}
              <button 
                onClick={() => setLocation("/search")}
                className="text-primary hover:text-primary-600 font-medium"
                data-testid="link-browse-without-signup"
              >
                Start browsing providers
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}