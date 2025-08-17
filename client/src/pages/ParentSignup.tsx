import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import { Heart, Baby, Search, Shield } from "lucide-react";

export default function ParentSignup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    zipCode: "",
    childAges: "",
    careType: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // For now, we'll simulate a successful signup and direct to search
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Welcome to HappiKid!",
        description: "Your account has been created. Let's find you great childcare options.",
      });

      // Store user info in localStorage for now (until proper auth is set up)
      localStorage.setItem("happikid_user", JSON.stringify({
        firstName: formData.firstName,
        email: formData.email,
        role: "parent",
        preferences: {
          zipCode: formData.zipCode,
          childAges: formData.childAges,
          careType: formData.careType
        }
      }));

      // Redirect to search with their preferences
      const searchParams = new URLSearchParams();
      if (formData.careType) searchParams.append('type', formData.careType);
      if (formData.zipCode) searchParams.append('location', formData.zipCode);
      
      setLocation(`/search?${searchParams.toString()}`);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-2xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Create Your Parent Account
          </h1>
          <p className="text-lg text-gray-600">
            Tell us about your childcare needs so we can help you find the perfect match
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              This information helps us personalize your childcare search experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                />
              </div>

              {/* Childcare Preferences */}
              <div className="border-t pt-6">
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
                  <li>• Access to 630+ verified childcare providers</li>
                  <li>• Personalized search results based on your preferences</li>
                  <li>• Direct contact with providers and ability to save favorites</li>
                  <li>• Parent reviews and detailed provider information</li>
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Search className="h-4 w-4 mr-2" />
                    Create Account & Start Searching
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <button 
              onClick={() => setLocation("/search")}
              className="text-primary hover:text-primary-600 font-medium"
            >
              Start searching instead
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}