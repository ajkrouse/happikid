import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Eye, 
  Mail, 
  Calendar, 
  Star, 
  User, 
  Clock, 
  Camera, 
  BarChart3,
  HelpCircle,
  MessageCircle,
  Play,
  CheckCircle,
  Circle,
  Crown
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Provider, Inquiry } from "@shared/schema";

export default function ProviderDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch user's providers
  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: [`/api/providers/user/${user?.id}`],
    enabled: !!user?.id && isAuthenticated,
  });

  // Fetch inquiries for the first provider (simplified for demo)
  const mainProvider = providers[0];
  const { data: inquiries = [] } = useQuery({
    queryKey: [`/api/inquiries/provider/${mainProvider?.id}`],
    enabled: !!mainProvider?.id,
  });

  if (isLoading || providersLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Mock stats for demo
  const stats = {
    views: 1247,
    inquiries: inquiries.length || 23,
    tours: 8,
    rating: mainProvider?.rating || "4.8",
  };

  const profileCompletion = 85; // Mock completion percentage

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="bg-primary px-6 py-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Provider Dashboard</h1>
                <p className="text-primary-100">
                  Manage your listing and track your performance
                </p>
              </div>
              <Button variant="secondary" className="mt-4 md:mt-0">
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-6 rounded-xl">
                <div className="flex items-center">
                  <div className="bg-primary p-3 rounded-lg">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{stats.views}</div>
                    <div className="text-sm text-gray-600">Profile Views</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-secondary-50 to-secondary-100 p-6 rounded-xl">
                <div className="flex items-center">
                  <div className="bg-secondary-500 p-3 rounded-lg">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{stats.inquiries}</div>
                    <div className="text-sm text-gray-600">New Inquiries</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-accent-50 to-accent-100 p-6 rounded-xl">
                <div className="flex items-center">
                  <div className="bg-accent-500 p-3 rounded-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{stats.tours}</div>
                    <div className="text-sm text-gray-600">Scheduled Tours</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl">
                <div className="flex items-center">
                  <div className="bg-gray-500 p-3 rounded-lg">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{stats.rating}</div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Completion */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{profileCompletion}% Complete</span>
                    <span>3 items remaining</span>
                  </div>
                  <Progress value={profileCompletion} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-600">Basic information completed</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-600">Photos uploaded</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Circle className="h-5 w-5 text-gray-300 mr-3" />
                    <span className="text-gray-600">Add more detailed program description</span>
                    <Button variant="link" className="ml-auto text-primary p-0">
                      Add
                    </Button>
                  </div>
                  <div className="flex items-center text-sm">
                    <Circle className="h-5 w-5 text-gray-300 mr-3" />
                    <span className="text-gray-600">Upload staff credentials</span>
                    <Button variant="link" className="ml-auto text-primary p-0">
                      Upload
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Inquiries */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Inquiries</CardTitle>
              </CardHeader>
              <CardContent>
                {inquiries.length > 0 ? (
                  <div className="space-y-4">
                    {inquiries.slice(0, 5).map((inquiry: Inquiry) => (
                      <div key={inquiry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="bg-primary-100 p-2 rounded-full mr-4">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{inquiry.parentName}</div>
                            <div className="text-sm text-gray-600">
                              {inquiry.childAge ? `Child age: ${inquiry.childAge}` : "General inquiry"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(inquiry.createdAt!).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button size="sm">
                          Respond
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No inquiries yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upgrade Card */}
            <Card className="bg-gradient-to-br from-accent-50 to-accent-100 border-accent-200">
              <CardContent className="p-6 text-center">
                <Crown className="h-12 w-12 text-accent-500 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Upgrade to Premium</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get featured placement and advanced analytics
                </p>
                <Button className="w-full bg-accent-500 hover:bg-accent-600">
                  Learn More
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="ghost" className="w-full justify-start">
                  <Clock className="h-5 w-5 mr-3" />
                  Update Hours
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Camera className="h-5 w-5 mr-3" />
                  Add Photos
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Star className="h-5 w-5 mr-3" />
                  Manage Reviews
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <BarChart3 className="h-5 w-5 mr-3" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a href="#" className="flex items-center text-gray-600 hover:text-primary text-sm">
                  <HelpCircle className="h-5 w-5 mr-3" />
                  FAQ & Help Center
                </a>
                <a href="#" className="flex items-center text-gray-600 hover:text-primary text-sm">
                  <MessageCircle className="h-5 w-5 mr-3" />
                  Contact Support
                </a>
                <a href="#" className="flex items-center text-gray-600 hover:text-primary text-sm">
                  <Play className="h-5 w-5 mr-3" />
                  Video Tutorials
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
