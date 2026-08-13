import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { useState } from "react";
import { Shield, CheckCircle, XCircle, ExternalLink, Clock, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function AdminVerifications() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: verifications = [], isLoading: isLoadingVerifications, error } = useQuery<any[]>({
    queryKey: ["/api/admin/verifications"],
    enabled: isAuthenticated,
  });

  const approveMutation = useMutation({
    mutationFn: async (providerId: number) => {
      const res = await apiRequest("POST", `/api/admin/verifications/${providerId}/approve`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "License approved", description: "Provider profile is now live." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to approve", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ providerId, reason }: { providerId: number; reason: string }) => {
      const res = await apiRequest("POST", `/api/admin/verifications/${providerId}/reject`, { reason });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "License rejected", description: "Provider has been notified by email." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
      setRejectingId(null);
      setRejectReason("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to reject", description: error.message, variant: "destructive" });
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
            <CardTitle>Access Required</CardTitle>
            <CardDescription>Please sign in to access admin tools</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/api/login?returnTo=/admin/verifications">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto py-16 px-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {(error as any)?.message === "Admin access required"
                ? "You don't have admin access to this page."
                : "Failed to load verifications. Please try again."}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="mb-8 flex items-center gap-3">
          <div className="p-2 bg-brand-evergreen rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-evergreen">License Verification Queue</h1>
            <p className="text-gray-600 text-sm">Review and approve provider license submissions</p>
          </div>
        </div>

        {isLoadingVerifications ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : verifications.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">All clear!</h3>
              <p className="text-gray-500 text-sm mt-1">No pending license submissions to review.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              {verifications.length} submission{verifications.length !== 1 ? "s" : ""} awaiting review
            </p>

            {verifications.map((provider: any) => {
              const submittedAt = provider.licenseSubmittedAt
                ? new Date(provider.licenseSubmittedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Unknown";

              const ownerName =
                [provider.ownerFirstName, provider.ownerLastName].filter(Boolean).join(" ") ||
                provider.ownerEmail ||
                "Unknown";

              const isRejecting = rejectingId === provider.id;

              return (
                <Card key={provider.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <CardTitle className="text-lg">{provider.name}</CardTitle>
                          <Badge
                            className={
                              provider.licenseStatus === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }
                          >
                            {provider.licenseStatus === "rejected" ? "Previously rejected" : "Pending review"}
                          </Badge>
                        </div>
                        <CardDescription>
                          {provider.borough}, {provider.city} · {provider.type}
                        </CardDescription>
                      </div>
                      <Link href={`/providers/${provider.id}`} target="_blank">
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Owner</p>
                        <p className="text-gray-800 font-medium">{ownerName}</p>
                        {provider.ownerEmail && (
                          <p className="text-gray-500 text-xs">{provider.ownerEmail}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">License Number</p>
                        <p className="text-gray-800 font-medium font-mono">
                          {provider.licenseNumber || <span className="text-gray-400 font-sans">Not provided</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Submitted</p>
                        <p className="text-gray-800 font-medium flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {submittedAt}
                        </p>
                      </div>
                    </div>

                    {!isRejecting ? (
                      <div className="flex gap-3 pt-2">
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                          onClick={() => approveMutation.mutate(provider.id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => {
                            setRejectingId(provider.id);
                            setRejectReason("");
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-2 border-t">
                        <p className="text-sm font-medium text-gray-700">
                          Reason for rejection <span className="text-red-500">*</span>
                        </p>
                        <Textarea
                          placeholder="Explain why the license could not be verified and what the provider should fix before resubmitting…"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={3}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!rejectReason.trim() || rejectMutation.isPending}
                            onClick={() =>
                              rejectMutation.mutate({ providerId: provider.id, reason: rejectReason })
                            }
                          >
                            {rejectMutation.isPending ? "Rejecting…" : "Confirm Rejection"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setRejectingId(null);
                              setRejectReason("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
