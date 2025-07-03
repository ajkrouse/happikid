import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Eye, 
  MessageSquare, 
  Heart, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Users,
  Star,
  AlertCircle,
  CheckCircle,
  Lock,
  Crown,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Camera,
  Shield,
  Lightbulb,
  Target,
  Zap
} from "lucide-react";
import { useLocation } from "wouter";

// Mock data for demonstrations - in production these would come from real analytics
const SAMPLE_ANALYTICS = {
  views: { current: 156, previous: 142, change: 9.9 },
  clicks: { current: 23, previous: 19, change: 21.1 },
  inquiries: { current: 8, previous: 5, change: 60.0 },
  comparisons: { current: 12, previous: 15, change: -20.0 },
  favorites: { current: 34, previous: 28, change: 21.4 }
};

const VISIBILITY_RECOMMENDATIONS = [
  {
    id: "photos",
    title: "Add more photos",
    description: "Profiles with 5+ photos get 60% more engagement",
    impact: "High",
    effort: "Medium",
    premium: false
  },
  {
    id: "hours",
    title: "Extend operating hours",
    description: "20 parents filtered for after-6pm pickup this week",
    impact: "Medium",
    effort: "High",
    premium: false
  },
  {
    id: "verification",
    title: "Complete license verification",
    description: "Verified providers get 3x more inquiries",
    impact: "High",
    effort: "Low",
    premium: false
  },
  {
    id: "reviews",
    title: "Encourage parent reviews",
    description: "You need 3 more reviews to unlock better ranking",
    impact: "High",
    effort: "Medium",
    premium: false
  },
  {
    id: "competitive",
    title: "Price optimization insights",
    description: "Your pricing is 15% above local average",
    impact: "Medium",
    effort: "Low",
    premium: true
  },
  {
    id: "seo",
    title: "Trending keyword opportunities",
    description: "Add 'STEM activities' to boost discovery",
    impact: "Medium",
    effort: "Low",
    premium: true
  }
];

export default function ProviderDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
      return;
    }
  }, [isAuthenticated, setLocation]);

  // Load provider data
  const { data: provider, isLoading } = useQuery({
    queryKey: ["/api/providers/mine"],
    enabled: isAuthenticated,
  });

  // Load inquiries
  const { data: inquiries } = useQuery({
    queryKey: ["/api/inquiries/provider"],
    enabled: isAuthenticated && !!provider,
  });

  const updateProviderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/providers/${provider.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/providers/mine"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Provider Profile Found</h2>
            <p className="text-gray-600 mb-4">
              You need to complete your provider profile setup first.
            </p>
            <Button onClick={() => setLocation("/provider/onboarding")}>
              Start Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completeness = provider.profileCompleteness || 0;
  const isProfileVisible = provider.isProfileVisible || false;
  const isPremium = provider.isPremium || false;

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Profile Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profile Completeness</p>
                <p className="text-2xl font-bold">{completeness}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Progress value={completeness} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profile Status</p>
                <p className="text-sm font-semibold flex items-center mt-1">
                  {isProfileVisible ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                      Visible
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-600 mr-1" />
                      Hidden
                    </>
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
            {!isProfileVisible && (
              <p className="text-xs text-gray-500 mt-2">
                Complete verification to make visible
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Account Type</p>
                <p className="text-sm font-semibold flex items-center mt-1">
                  {isPremium ? (
                    <>
                      <Crown className="h-4 w-4 text-yellow-600 mr-1" />
                      Premium
                    </>
                  ) : (
                    "Standard"
                  )}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isPremium ? "bg-yellow-100" : "bg-gray-100"
              }`}>
                {isPremium ? (
                  <Crown className="h-6 w-6 text-yellow-600" />
                ) : (
                  <Users className="h-6 w-6 text-gray-600" />
                )}
              </div>
            </div>
            {!isPremium && (
              <Button size="sm" variant="outline" className="mt-2 text-xs">
                Upgrade
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Overview</CardTitle>
          <CardDescription>Your performance over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(SAMPLE_ANALYTICS).map(([key, data]) => {
              const isPositive = data.change > 0;
              const Icon = key === "views" ? Eye : 
                         key === "clicks" ? Target :
                         key === "inquiries" ? MessageSquare :
                         key === "comparisons" ? BarChart3 : Heart;
              
              return (
                <div key={key} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold">{data.current}</p>
                  <p className="text-sm text-gray-600 capitalize">{key}</p>
                  <div className={`flex items-center justify-center text-xs mt-1 ${
                    isPositive ? "text-green-600" : "text-red-600"
                  }`}>
                    {isPositive ? (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(data.change)}%
                  </div>
                </div>
              );
            })}
          </div>
          
          {!isPremium && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center mb-2">
                <Lock className="h-4 w-4 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-900">Unlock Premium Analytics</span>
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                Get detailed insights, competitive benchmarking, and conversion tracking
              </p>
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                Upgrade to Premium
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Inquiries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Recent Inquiries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inquiries && inquiries.length > 0 ? (
            <div className="space-y-4">
              {inquiries.slice(0, 3).map((inquiry: any) => (
                <div key={inquiry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{inquiry.parentName}</p>
                    <p className="text-sm text-gray-600">{inquiry.message.substring(0, 100)}...</p>
                    <p className="text-xs text-gray-500">
                      {new Date(inquiry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={inquiry.status === "pending" ? "default" : "secondary"}>
                    {inquiry.status}
                  </Badge>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setActiveTab("inquiries")}>
                View All Inquiries
              </Button>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No inquiries yet</p>
              <p className="text-sm">Complete your profile to start receiving inquiries</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderRecommendationsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <Lightbulb className="h-6 w-6 text-yellow-500 mr-3" />
            <div>
              <h2 className="text-xl font-semibold">Get Found More!</h2>
              <p className="text-gray-600">Personalized recommendations to boost your visibility</p>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              These recommendations are tailored to your profile and local market conditions. 
              Completing them can increase your inquiries by up to 300%.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="grid gap-4">
        {VISIBILITY_RECOMMENDATIONS.map((rec) => (
          <Card key={rec.id} className={rec.premium && !isPremium ? "opacity-60" : ""}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="font-semibold mr-2">{rec.title}</h3>
                    {rec.premium && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                        Premium
                      </Badge>
                    )}
                    <Badge 
                      variant={rec.impact === "High" ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {rec.impact} Impact
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{rec.description}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-4">Effort: {rec.effort}</span>
                  </div>
                </div>
                <div className="ml-4">
                  {rec.premium && !isPremium ? (
                    <Button size="sm" variant="outline" disabled>
                      <Lock className="h-4 w-4 mr-1" />
                      Locked
                    </Button>
                  ) : (
                    <Button size="sm">
                      <Zap className="h-4 w-4 mr-1" />
                      Take Action
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Premium Upsell */}
      {!isPremium && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Crown className="h-6 w-6 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900">Unlock Premium Insights</h3>
                <p className="text-yellow-700">Get advanced recommendations and competitive intelligence</p>
              </div>
            </div>
            <ul className="text-sm text-yellow-800 space-y-1 mb-4">
              <li>• Competitive pricing analysis</li>
              <li>• Market demand alerts</li>
              <li>• SEO keyword opportunities</li>
              <li>• Parent behavior insights</li>
            </ul>
            <Button className="bg-yellow-600 hover:bg-yellow-700">
              Upgrade to Premium - $29/month
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderInquiriesTab = () => (
    <div className="space-y-6">
      {inquiries && inquiries.length > 0 ? (
        inquiries.map((inquiry: any) => (
          <Card key={inquiry.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{inquiry.parentName}</h3>
                  <p className="text-sm text-gray-600">{inquiry.parentEmail}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(inquiry.createdAt).toLocaleDateString()} at{" "}
                    {new Date(inquiry.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <Badge variant={
                  inquiry.status === "pending" ? "default" : 
                  inquiry.status === "responded" ? "secondary" : "outline"
                }>
                  {inquiry.status}
                </Badge>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm">{inquiry.message}</p>
              </div>
              {inquiry.status === "pending" && (
                <Button size="sm">Respond to Inquiry</Button>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Inquiries Yet</h3>
            <p className="text-gray-600 mb-4">
              Once parents start contacting you, their messages will appear here.
            </p>
            <Button variant="outline" onClick={() => setActiveTab("recommendations")}>
              View Tips to Get More Inquiries
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>
            <p className="text-gray-600">{provider.name}</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => setLocation("/provider/onboarding")}>
              Edit Profile
            </Button>
            <Button onClick={() => setLocation("/search")}>
              View Public Profile
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="inquiries">
              Inquiries {inquiries?.length > 0 && `(${inquiries.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {renderOverviewTab()}
          </TabsContent>

          <TabsContent value="recommendations" className="mt-6">
            {renderRecommendationsTab()}
          </TabsContent>

          <TabsContent value="inquiries" className="mt-6">
            {renderInquiriesTab()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}