import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ReviewVotingProps {
  reviewId: number;
}

export function ReviewVoting({ reviewId }: ReviewVotingProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vote counts
  const { data: voteCounts = { helpful: 0, notHelpful: 0, total: 0 } } = useQuery({
    queryKey: ['/api/reviews', reviewId, 'votes'],
  });

  // Fetch user's current vote (if authenticated)
  const { data: userVote } = useQuery({
    queryKey: ['/api/reviews', reviewId, 'user-vote'],
    enabled: isAuthenticated,
  });

  const voteCountsTyped = voteCounts as { helpful: number; notHelpful: number; total: number };
  const userVoteTyped = userVote as { voteType: string } | null;

  // Mutation to vote on review
  const voteMutation = useMutation({
    mutationFn: async (voteType: 'helpful' | 'not_helpful') => {
      return apiRequest(`/api/reviews/${reviewId}/vote`, 'POST', { voteType });
    },
    onSuccess: () => {
      // Invalidate and refetch vote data
      queryClient.invalidateQueries({ queryKey: ['/api/reviews', reviewId, 'votes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews', reviewId, 'user-vote'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error voting on review",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVote = (voteType: 'helpful' | 'not_helpful') => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote on reviews.",
        variant: "destructive",
      });
      return;
    }

    voteMutation.mutate(voteType);
  };

  if (!isAuthenticated && voteCountsTyped.total === 0) {
    return null; // Don't show voting if no votes and user not authenticated
  }

  return (
    <div className="flex items-center gap-4 mt-3 pt-3 border-t">
      <span className="text-sm text-gray-600">Was this review helpful?</span>
      
      <div className="flex items-center gap-2">
        <Button
          variant={userVoteTyped?.voteType === 'helpful' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleVote('helpful')}
          disabled={voteMutation.isPending || !isAuthenticated}
          className="flex items-center gap-1 h-8"
        >
          <ThumbsUp className="h-3 w-3" />
          <span>Yes</span>
          {voteCountsTyped.helpful > 0 && (
            <span className="ml-1 text-xs">({voteCountsTyped.helpful})</span>
          )}
        </Button>

        <Button
          variant={userVoteTyped?.voteType === 'not_helpful' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleVote('not_helpful')}
          disabled={voteMutation.isPending || !isAuthenticated}
          className="flex items-center gap-1 h-8"
        >
          <ThumbsDown className="h-3 w-3" />
          <span>No</span>
          {voteCountsTyped.notHelpful > 0 && (
            <span className="ml-1 text-xs">({voteCountsTyped.notHelpful})</span>
          )}
        </Button>
      </div>

      {!isAuthenticated && (
        <span className="text-xs text-gray-500">
          Sign in to vote
        </span>
      )}
    </div>
  );
}