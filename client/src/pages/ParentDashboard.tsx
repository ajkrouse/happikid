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

  const { data: tourRequests = [], isLoading: isLoadingTours } = useQuery<any[]>({
    queryKey: ["/api/tour-requests"],
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
