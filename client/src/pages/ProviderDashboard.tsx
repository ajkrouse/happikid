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
import { ProfileOptimizationCard } from "@/components/ProfileOptimizationCard";
import { ProviderBadge, BadgeType } from "@/components/ProviderBadge";
import { useState } from "react";
import {
  MessageSquare,
  Star,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  ArrowRight,
  Settings,
  Crown,
  Sparkles,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  MousePointerClick,
  Heart,
  GitCompareArrows,
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function ProviderDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Fetch provider profile
  const { data: provider } = useQuery<any>({
    queryKey: ["/api/providers/mine"],
    enabled: isAuthenticated,
  });

  // Fetch provider analytics (views, review summary, inquiry stats)
  const { data: analytics } = useQuery<any>({
    queryKey: ["/api/providers/analytics"],
    enabled: isAuthenticated && !!provider,
  });

  // Fetch inquiries (for recent list)
  const { data: inquiries } = useQuery<any[]>({
    queryKey: ["/api/inquiries/provider"],
    enabled: isAuthenticated && !!provider,
  });

  // Fetch provider optimization score
  const { data: providerScore, isLoading: isLoadingScore } = useQuery<any>({
    queryKey: [`/api/providers/${provider?.id}/score`],
    enabled: isAuthenticated && !!provider?.id,
  });

  // License confirmation mutation
  const confirmLicenseMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/providers/confirm-license", {});
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
    },
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

  // Derive inquiry metrics from analytics (preferred) or from inquiries list fallback
  const realInquiries: any[] = Array.isArray(inquiries) ? inquiries : [];
  const pendingCount = analytics?.pendingInquiries ?? realInquiries.filter((i: any) => i.status === "pending").length;
  const respondedCount = analytics != null
    ? (analytics.inquiryCount - analytics.pendingInquiries)
    : realInquiries.filter((i: any) => i.status === "responded").length;
  const totalInquiryCount = analytics?.inquiryCount ?? realInquiries.length;
  const responseRate = analytics?.responseRate ??
    (realInquiries.length > 0
      ? Math.round((respondedCount / realInquiries.length) * 100)
      : 0);
  const recentInquiries = realInquiries.slice(0, 5);

  // Rating distribution helpers
  const ratingDist: Record<number, number> = analytics?.ratingDistribution ?? {};
  const reviewCount = analytics?.reviewCount ?? (provider.reviewCount || 0);
  const maxDistCount = Math.max(...Object.values(ratingDist as Record<string, number>).map(Number), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-evergreen mb-2">Provider Dashboard</h1>
              <p className="text-gray-600">Welcome back, {provider.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/provider/onboarding">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* License Status Banner */}
        {provider.licenseStatus === "pending" && (
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
                  {confirmLicenseMutation.isPending ? "Confirming..." : "Confirm License"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {provider.licenseStatus === "confirmed" && (
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

        {/* Achievements/Badges */}
        {providerScore && providerScore.badges && providerScore.badges.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-brand-evergreen mb-3">Your Achievements</h3>
            <div className="flex flex-wrap gap-3">
              {providerScore.badges.map((badgeType: string, index: number) => (
                <ProviderBadge key={index} type={badgeType as BadgeType} />
              ))}
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInquiryCount}</div>
              <p className="text-xs text-muted-foreground">{pendingCount} pending response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {responseRate != null ? `${responseRate}%` : "—"}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalInquiryCount > 0
                  ? `${respondedCount} of ${totalInquiryCount} replied`
                  : "No inquiries yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.profileViews ?? "—"}</div>
              <p className="text-xs text-muted-foreground">
                {analytics?.profileClicks != null
                  ? `${analytics.profileClicks} click-throughs`
                  : "Total all-time views"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {provider.rating ? Number(provider.rating).toFixed(1) : "—"}
              </div>
              <p className="text-xs text-muted-foreground">
                {provider.reviewCount ? `Based on ${provider.reviewCount} reviews` : "No reviews yet"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Listing Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Listing Performance</CardTitle>
            <CardDescription>How families are interacting with your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
                <Eye className="h-6 w-6 text-blue-500 mb-2" />
                <div className="text-2xl font-bold text-blue-700">
                  {analytics?.profileViews ?? 0}
                </div>
                <div className="text-xs text-blue-600 text-center mt-1">Profile Views</div>
              </div>
              <div className="flex flex-col items-center p-4 bg-purple-50 rounded-lg">
                <MousePointerClick className="h-6 w-6 text-purple-500 mb-2" />
                <div className="text-2xl font-bold text-purple-700">
                  {analytics?.profileClicks ?? 0}
                </div>
                <div className="text-xs text-purple-600 text-center mt-1">Click-throughs</div>
              </div>
              <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
                <Heart className="h-6 w-6 text-red-500 mb-2" />
                <div className="text-2xl font-bold text-red-700">
                  {analytics?.favoriteAdds ?? 0}
                </div>
                <div className="text-xs text-red-600 text-center mt-1">Saved as Favorite</div>
              </div>
              <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
                <GitCompareArrows className="h-6 w-6 text-green-500 mb-2" />
                <div className="text-2xl font-bold text-green-700">
                  {analytics?.comparisonAdds ?? 0}
                </div>
                <div className="text-xs text-green-600 text-center mt-1">Added to Comparison</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Optimization Score */}
        {isLoadingScore ? (
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                <span className="ml-3 text-gray-600">Loading your profile score...</span>
              </div>
            </CardContent>
          </Card>
        ) : providerScore ? (
          <div className="mb-8">
            <ProfileOptimizationCard score={providerScore} />
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Profile Completeness */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Completeness</CardTitle>
                <CardDescription>Complete your profile to increase visibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-gray-600">
                    {providerScore?.overallScore ?? "—"}{providerScore ? "%" : ""}
                  </span>
                </div>
                <Progress value={providerScore?.overallScore ?? 0} className="h-2" />

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

          {/* Review Summary */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Review Summary</CardTitle>
                <CardDescription>
                  {reviewCount > 0
                    ? `${reviewCount} review${reviewCount !== 1 ? "s" : ""} from families`
                    : "No reviews yet — encourage parents to share their experience"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reviewCount === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No reviews yet.</p>
                    <p className="text-xs mt-1">Complete your profile to attract families and get your first review.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Average rating hero */}
                    <div className="flex items-center gap-6 pb-4 border-b">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-brand-evergreen">
                          {Number(provider.rating).toFixed(1)}
                        </div>
                        <div className="flex justify-center mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-4 w-4 ${
                                s <= Math.round(Number(provider.rating))
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{reviewCount} reviews</div>
                      </div>
                      {/* Rating bars */}
                      <div className="flex-1 space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = ratingDist[star] ?? 0;
                          const pct = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-xs">
                              <span className="w-4 text-right text-gray-500">{star}</span>
                              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                              <div className="flex-1 bg-gray-100 rounded-full h-2">
                                <div
                                  className="bg-yellow-400 h-2 rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-8 text-gray-500">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recent reviews */}
                    {analytics?.recentReviews && analytics.recentReviews.length > 0 && (
                      <div className="space-y-3 pt-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Reviews</p>
                        {analytics.recentReviews.map((review: any) => (
                          <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-1 mb-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-3 w-3 ${
                                    s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-gray-400 ml-2">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {review.title && (
                              <p className="text-sm font-medium text-gray-800">{review.title}</p>
                            )}
                            {review.content && (
                              <p className="text-sm text-gray-600 line-clamp-2">{review.content}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Inquiries */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Recent Inquiries</CardTitle>
            <CardDescription>Families who have reached out about your program</CardDescription>
          </CardHeader>
          <CardContent>
            {recentInquiries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No inquiries yet.</p>
                <p className="text-xs mt-1">Complete your profile to attract more families.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentInquiries.map((inquiry: any) => (
                  <div key={inquiry.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium">{inquiry.parentName || "Anonymous"}</span>
                        {inquiry.childAge && (
                          <span className="text-sm text-gray-500">• Child: {inquiry.childAge}</span>
                        )}
                        <Badge
                          variant={inquiry.status === "pending" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {inquiry.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{inquiry.message}</p>
                      <span className="text-xs text-gray-400">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex-col" asChild>
                <Link href="/provider/onboarding">
                  <Calendar className="h-6 w-6 mb-2" />
                  <span>Edit Schedule & Availability</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col" asChild>
                <Link href="/provider/onboarding">
                  <DollarSign className="h-6 w-6 mb-2" />
                  <span>Update Pricing</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col" asChild>
                <Link href="/search">
                  <Users className="h-6 w-6 mb-2" />
                  <span>View Public Directory</span>
                </Link>
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
