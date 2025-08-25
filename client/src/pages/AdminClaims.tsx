import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, Building2, Mail, FileText, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Claim } from "@shared/schema";

export default function AdminClaims() {
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Check if user is admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Building2 className="w-12 h-12 mx-auto text-red-600 mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Admin access required to view this page
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Fetch all claims
  const { data: claims, isLoading } = useQuery({
    queryKey: ["/api/admin/claims", statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all" ? "/api/admin/claims" : `/api/admin/claims?status=${statusFilter}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch claims');
      return response.json();
    },
    retry: (failureCount, error) => !isUnauthorizedError(error as Error) && failureCount < 3,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Approve claim mutation
  const approveMutation = useMutation({
    mutationFn: async (claimId: string) => {
      const response = await fetch(`/api/admin/claims/${claimId}/approve`, {
        method: "POST"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/claims"] });
      setActionDialog(null);
      setSelectedClaim(null);
      toast({
        title: "Claim approved successfully",
        description: "The business owner has been notified and can now manage their listing.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to approve claim",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  });

  // Reject claim mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ claimId, reason }: { claimId: string; reason: string }) => {
      const response = await fetch(`/api/admin/claims/${claimId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: reason })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/claims"] });
      setActionDialog(null);
      setSelectedClaim(null);
      setRejectionReason("");
      toast({
        title: "Claim rejected",
        description: "The user has been notified of the rejection.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reject claim",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  });

  const handleApprove = () => {
    if (selectedClaim) {
      approveMutation.mutate(selectedClaim.id);
    }
  };

  const handleReject = () => {
    if (selectedClaim && rejectionReason.trim()) {
      rejectMutation.mutate({ claimId: selectedClaim.id, reason: rejectionReason.trim() });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'initiated':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVerificationIcon = (method: string) => {
    switch (method) {
      case 'email_domain':
        return <Mail className="w-4 h-4" />;
      case 'document_upload':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const filteredClaims = claims || [];
  const pendingCount = claims?.filter((c: Claim) => c.status === 'initiated').length || 0;
  const approvedCount = claims?.filter((c: Claim) => c.status === 'approved').length || 0;
  const rejectedCount = claims?.filter((c: Claim) => c.status === 'rejected').length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading claims...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Business Claims Administration
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Review and manage business claiming requests
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Claims</p>
                  <p className="text-2xl font-bold">{filteredClaims.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <Label htmlFor="status-filter" className="text-base font-medium mb-2 block">
            Filter by Status
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Claims</SelectItem>
              <SelectItem value="initiated">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Claims List */}
        <div className="space-y-4">
          {filteredClaims.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No claims found</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {statusFilter === "all" 
                    ? "There are no business claims yet." 
                    : `No ${statusFilter} claims at the moment.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredClaims.map((claim: Claim) => (
              <Card key={claim.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Provider ID: {claim.providerId}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Claimed by User: {claim.userId}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(claim.status)}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          {getVerificationIcon(claim.verificationMethod)}
                          <span className="capitalize">
                            {claim.verificationMethod.replace('_', ' ')} verification
                          </span>
                        </div>
                        <div>
                          <span>Submitted: {new Date(claim.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {claim.rejectionReason && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                            Rejection Reason:
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            {claim.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedClaim(claim)}
                        data-testid={`button-view-claim-${claim.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      
                      {claim.status === 'initiated' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedClaim(claim);
                              setActionDialog('approve');
                            }}
                            data-testid={`button-approve-${claim.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedClaim(claim);
                              setActionDialog('reject');
                            }}
                            data-testid={`button-reject-${claim.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Action Dialogs */}
        <Dialog open={actionDialog === 'approve'} onOpenChange={() => setActionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Business Claim</DialogTitle>
              <DialogDescription>
                This will approve the claim and grant ownership to the user. The business listing will be updated to show it's claimed.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm">
                <strong>Provider ID:</strong> {selectedClaim?.providerId}<br />
                <strong>User:</strong> {selectedClaim?.userId}<br />
                <strong>Verification Method:</strong> {selectedClaim?.verificationMethod.replace('_', ' ')}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                data-testid="button-confirm-approve"
              >
                {approveMutation.isPending ? "Approving..." : "Approve Claim"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={actionDialog === 'reject'} onOpenChange={() => setActionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Business Claim</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this claim. The user will be notified.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide a clear reason for the rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
                data-testid="textarea-rejection-reason"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
                data-testid="button-confirm-reject"
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject Claim"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}