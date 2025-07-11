import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import PremiumFeaturesModal from "@/components/PremiumFeaturesModal";
import { useState } from "react";
import { 
  Eye, 
  MessageSquare, 
  Star, 
  TrendingUp, 
  Users, 
  Calendar,
  DollarSign,
  ArrowRight,
  Settings,
  Bell,
  Heart,
  Crown,
  Sparkles,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function ProviderDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Fetch provider profile
  const { data: provider } = useQuery({
    queryKey: ["/api/providers/mine"],
    enabled: isAuthenticated
  });

  // Fetch provider analytics
  const { data: analytics } = useQuery({
    queryKey: ["/api/providers/analytics"],
    enabled: isAuthenticated && !!provider
  });

  // Fetch inquiries
  const { data: inquiries } = useQuery({
    queryKey: ["/api/inquiries/provider"],
    enabled: isAuthenticated && !!provider
  });

  // License confirmation mutation
  const confirmLicenseMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/providers/confirm-license", "POST", {});
    },
    onSuccess: () => {
      toast({
        title: "License Confirmed!",
        description: "Your provider profile is now live and visible to families.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/providers/mine"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm license. Please try again.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Provider Access Required</CardTitle>
            <CardDescription>Please sign in to access your provider dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/api/login?returnTo=/provider/dashboard">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no provider profile exists, redirect to onboarding
  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Welcome to HappiKid Providers!</CardTitle>
              <CardDescription>
                Let's set up your provider profile to start connecting with families
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/provider/onboarding">
                  Start Your Profile
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Mock analytics data for demonstration
  const mockAnalytics = {
    profileViews: 156,
    totalInquiries: 23,
    responseRate: 95,
    averageRating: 4.8,
    profileCompleteness: 85,
    recentViews: [
      { date: "2025-01-09", views: 12 },
      { date: "2025-01-08", views: 8 },
      { date: "2025-01-07", views: 15 },
      { date: "2025-01-06", views: 11 },
      { date: "2025-01-05", views: 9 },
    ]
  };

  const mockInquiries = [
    {
      id: 1,
      parentName: "Sarah Johnson",
      childAge: "3 years",
      message: "Looking for part-time care starting next month...",
      status: "pending",
      createdAt: "2025-01-09T10:30:00Z"
    },
    {
      id: 2,
      parentName: "Michael Chen",
      childAge: "18 months",
      message: "Interested in your Montessori program...",
      status: "responded",
      createdAt: "2025-01-08T14:15:00Z"
    },
    {
      id: 3,
      parentName: "Emily Rodriguez",
      childAge: "4 years",
      message: "Do you have availability for after-school care?",
      status: "pending",
      createdAt: "2025-01-08T09:45:00Z"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Provider Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {provider.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
            </div>
          </div>
        </div>

        {/* License Status Banner */}
        {provider.licenseStatus === 'pending' && (
          <Card className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-red-400 to-orange-500 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">License Confirmation Required</h3>
                    <p className="text-red-700">Your profile is hidden from families until your license is confirmed</p>
                  </div>
                </div>
                <Button 
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold"
                  onClick={() => confirmLicenseMutation.mutate()}
                  disabled={confirmLicenseMutation.isPending}
                >
                  {confirmLicenseMutation.isPending ? (
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  {confirmLicenseMutation.isPending ? 'Confirming...' : 'Confirm License'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {provider.licenseStatus === 'confirmed' && (
          <Alert className="mb-8 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>License Confirmed!</strong> Your profile is now live and visible to families searching for childcare.
            </AlertDescription>
          </Alert>
        )}

        {/* Premium Upgrade Banner */}
        <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900">Upgrade to Premium</h3>
                  <p className="text-yellow-700">Get 3x more visibility and advanced analytics</p>
                </div>
              </div>
              <Button 
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
                onClick={() => setShowUpgradeModal(true)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.profileViews}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.totalInquiries}</div>
              <p className="text-xs text-muted-foreground">
                +5 this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.responseRate}%</div>
              <p className="text-xs text-muted-foreground">
                Excellent response time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.averageRating}</div>
              <p className="text-xs text-muted-foreground">
                Based on 18 reviews
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Completeness */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Completeness</CardTitle>
                <CardDescription>
                  Complete your profile to increase visibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-gray-600">{mockAnalytics.profileCompleteness}%</span>
                </div>
                <Progress value={mockAnalytics.profileCompleteness} className="h-2" />
                
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Basic Information</span>
                    <Badge variant="secondary">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Photos & Gallery</span>
                    <Badge variant="outline">Add Photos</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Verification</span>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href="/provider/onboarding">
                    Complete Profile
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Inquiries */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Inquiries</CardTitle>
                <CardDescription>
                  New families interested in your services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockInquiries.map((inquiry) => (
                    <div key={inquiry.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{inquiry.parentName}</span>
                          <span className="text-sm text-gray-500">• Child: {inquiry.childAge}</span>
                          <Badge 
                            variant={inquiry.status === 'pending' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {inquiry.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {inquiry.message}
                        </p>
                        <span className="text-xs text-gray-400">
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Button size="sm" variant="outline">
                        {inquiry.status === 'pending' ? 'Respond' : 'View'}
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  View All Inquiries
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <Calendar className="h-6 w-6 mb-2" />
                <span>Manage Availability</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <DollarSign className="h-6 w-6 mb-2" />
                <span>Update Pricing</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Users className="h-6 w-6 mb-2" />
                <span>View Public Profile</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Premium Features Modal */}
      <PremiumFeaturesModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={() => {
          // Handle upgrade logic here
          setShowUpgradeModal(false);
          toast({
            title: "Upgrade Coming Soon!",
            description: "We're working on premium features. You'll be notified when available.",
          });
        }}
      />
    </div>
  );
}