import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import {
  CalendarCheck,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

export default function ParentDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: tourRequests = [],
    isLoading: isLoadingTours,
    isError: isToursError,
    refetch: refetchTours,
  } = useQuery<any[]>({
    queryKey: ["/api/tour-requests"],
    enabled: isAuthenticated,
  });

  const {
    data: inquiries = [],
    isLoading: isLoadingInquiries,
    isError: isInquiriesError,
    refetch: refetchInquiries,
  } = useQuery<any[]>({
    queryKey: ["/api/inquiries/user"],
    enabled: isAuthenticated,
  });

  const cancelTourMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/tour-requests/${id}`, { status: "cancelled" });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Tour request cancelled" });
      queryClient.invalidateQueries({ queryKey: ["/api/tour-requests"] });
    },
    onError: () => {
      toast({ title: "Failed to cancel", variant: "destructive" });
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
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view your dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/api/login?returnTo=/parent/dashboard">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pending = tourRequests.filter((r: any) => r.status === "pending");
  const scheduled = tourRequests.filter((r: any) => r.status === "scheduled");
  const cancelled = tourRequests.filter((r: any) => r.status === "cancelled");

  const statusIcon = (status: string) => {
    if (status === "scheduled") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === "cancelled") return <XCircle className="h-4 w-4 text-gray-400" />;
    return <Clock className="h-4 w-4 text-amber-500" />;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700",
      scheduled: "bg-green-100 text-green-700",
      cancelled: "bg-gray-100 text-gray-500",
    };
    return map[status] ?? "bg-gray-100 text-gray-500";
  };

  const inquiryStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700",
      responded: "bg-green-100 text-green-700",
      closed: "bg-gray-100 text-gray-500",
    };
    return map[status] ?? "bg-gray-100 text-gray-500";
  };

  const inquiryTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      info: "General question",
      tour: "Tour inquiry",
      enrollment: "Enrollment inquiry",
    };
    return map[type] ?? "Inquiry";
  };

  const inquiryStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "Waiting for reply",
      responded: "Provider replied",
      closed: "Closed",
    };
    return map[status] ?? status;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-evergreen mb-1">My Dashboard</h1>
          <p className="text-gray-600">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}! Track your tour requests and activity here.
          </p>
        </div>

        {/* Tour Requests */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarCheck className="h-5 w-5 text-green-600" />
              My Tour Requests
              {pending.length > 0 && (
                <Badge className="bg-amber-500 text-white text-xs">{pending.length} pending</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Tour requests you've submitted to childcare providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTours ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : isToursError ? (
              <div className="text-center py-8 text-red-700">
                <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-70" />
                <p className="font-medium">We couldn't load your tour requests.</p>
                <p className="text-sm mt-1 mb-4 text-gray-500">Please try again.</p>
                <Button variant="outline" onClick={() => refetchTours()}>
                  Try again
                </Button>
              </div>
            ) : tourRequests.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <CalendarCheck className="h-12 w-12 mx-auto mb-3 opacity-25" />
                <p className="font-medium text-gray-700">No tour requests yet</p>
                <p className="text-sm mt-1 mb-4">
                  Browse providers and click "Request a Tour" to get started.
                </p>
                <Button asChild variant="outline">
                  <Link href="/search">Browse Providers</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {tourRequests.map((req: any) => {
                  const timeLabel =
                    req.preferredTime === "morning" ? "Morning"
                    : req.preferredTime === "afternoon" ? "Afternoon"
                    : "Flexible";
                  return (
                    <div
                      key={req.id}
                      className={`p-4 border rounded-lg ${req.status === "cancelled" ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {statusIcon(req.status)}
                            <span className="font-semibold text-brand-evergreen">
                              {req.providerName}
                            </span>
                            <Badge className={`text-xs ${statusBadge(req.status)}`}>
                              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </Badge>
                          </div>
                          {req.providerAddress && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                              <MapPin className="h-3 w-3" />
                              {req.providerAddress}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Requested dates:</span>{" "}
                            {Array.isArray(req.preferredDates)
                              ? req.preferredDates.join(", ")
                              : req.preferredDates}
                            <span className="ml-2 text-gray-400">· {timeLabel}</span>
                          </p>
                          {req.note && (
                            <p className="text-sm text-gray-500 mt-1 italic">"{req.note}"</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            Submitted {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {req.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={cancelTourMutation.isPending}
                            onClick={() => cancelTourMutation.mutate(req.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inquiries */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              My Inquiries
              {inquiries.filter((inquiry: any) => inquiry.status === "pending").length > 0 && (
                <Badge className="bg-amber-500 text-white text-xs">
                  {inquiries.filter((inquiry: any) => inquiry.status === "pending").length} awaiting reply
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Questions you've sent to childcare providers and their replies
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingInquiries ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                <span className="sr-only">Loading your inquiries</span>
              </div>
            ) : isInquiriesError ? (
              <div className="text-center py-8 text-red-700">
                <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-70" />
                <p className="font-medium">We couldn't load your inquiries.</p>
                <p className="text-sm mt-1 mb-4 text-gray-500">Your messages are safe. Please try again.</p>
                <Button variant="outline" onClick={() => refetchInquiries()}>
                  Try again
                </Button>
              </div>
            ) : inquiries.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-25" />
                <p className="font-medium text-gray-700">No inquiries yet</p>
                <p className="text-sm mt-1 mb-4">
                  Contact a provider to ask a question about their program.
                </p>
                <Button asChild variant="outline">
                  <Link href="/search">Browse Providers</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inquiry: any) => (
                  <div key={inquiry.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-brand-evergreen">
                            {inquiry.providerName ?? `Provider #${inquiry.providerId}`}
                          </span>
                          <Badge className={`text-xs ${inquiryStatusBadge(inquiry.status)}`}>
                            {inquiryStatusLabel(inquiry.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          {inquiryTypeLabel(inquiry.inquiryType)}
                        </p>
                        {inquiry.message && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Your message:</span>{" "}
                            {inquiry.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Sent {new Date(inquiry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {inquiry.providerReply ? (
                      <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm text-blue-900">
                        <p className="text-xs font-medium text-blue-600 mb-1">
                          Reply from {inquiry.providerName ?? "the provider"}
                          {inquiry.repliedAt && (
                            <span className="font-normal text-blue-500">
                              {" "}· {new Date(inquiry.repliedAt).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                        <p>{inquiry.providerReply}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        This provider hasn't replied yet.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <MessageSquare className="h-8 w-8 text-blue-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">Messages</p>
                <p className="text-sm text-gray-500">View conversations with providers</p>
              </div>
              <Button size="sm" variant="outline" asChild className="ml-auto shrink-0">
                <Link href="/messages">Open</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <CalendarCheck className="h-8 w-8 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">Find Providers</p>
                <p className="text-sm text-gray-500">Search and request tours</p>
              </div>
              <Button size="sm" variant="outline" asChild className="ml-auto shrink-0">
                <Link href="/search">Search</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
