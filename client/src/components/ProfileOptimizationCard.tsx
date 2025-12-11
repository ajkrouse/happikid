import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, TrendingUp, AlertCircle } from "lucide-react";
import type { OptimizationScore } from "../../../server/services/providerScoring";

interface ProfileOptimizationCardProps {
  score: OptimizationScore;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function ProfileOptimizationCard({ score, onRefresh, isRefreshing = false }: ProfileOptimizationCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-mint";
    if (score >= 75) return "text-secondary";
    if (score >= 60) return "text-yellow-600";
    return "text-coral";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-mint/10";
    if (score >= 75) return "bg-secondary/10";
    if (score >= 60) return "bg-yellow-50";
    return "bg-coral/10";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Work";
  };

  const getPriorityIcon = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-4 w-4 text-coral" />;
      case "medium":
        return <TrendingUp className="h-4 w-4 text-yellow-600" />;
      case "low":
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card className="border-brand-evergreen/10 shadow-sm">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-serif text-brand-evergreen">Profile Optimization Score</CardTitle>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              data-testid="button-refresh-score"
            >
              {isRefreshing ? "Calculating..." : "Refresh"}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Overall Score Circle */}
        <div className="flex items-center gap-6">
          <div className={`relative flex items-center justify-center w-32 h-32 rounded-full ${getScoreBgColor(score.overallScore)}`}>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(score.overallScore)}`}>
                {score.overallScore}
              </div>
              <div className="text-sm text-gray-600 font-medium">out of 100</div>
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className={`text-2xl font-semibold ${getScoreColor(score.overallScore)} mb-1`}>
              {getScoreLabel(score.overallScore)}
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              {score.overallScore >= 90 && "Your profile stands out with exceptional quality and engagement."}
              {score.overallScore >= 75 && score.overallScore < 90 && "Your profile is performing well. Keep up the great work!"}
              {score.overallScore >= 60 && score.overallScore < 75 && "Your profile is on the right track. Focus on the suggestions below."}
              {score.overallScore < 60 && "Complete the suggestions below to improve your visibility and attract more families."}
            </p>
            <Progress 
              value={score.overallScore} 
              className="h-2"
              data-testid="progress-overall-score"
            />
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-brand-evergreen mb-3">Score Breakdown</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Profile Completeness</span>
                <span className={`font-semibold ${getScoreColor(score.completenessScore)}`}>
                  {score.completenessScore}%
                </span>
              </div>
              <Progress value={score.completenessScore} className="h-1.5" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Engagement</span>
                <span className={`font-semibold ${getScoreColor(score.engagementScore)}`}>
                  {score.engagementScore}%
                </span>
              </div>
              <Progress value={score.engagementScore} className="h-1.5" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Verification</span>
                <span className={`font-semibold ${getScoreColor(score.verificationScore)}`}>
                  {score.verificationScore}%
                </span>
              </div>
              <Progress value={score.verificationScore} className="h-1.5" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Freshness</span>
                <span className={`font-semibold ${getScoreColor(score.freshnessScore)}`}>
                  {score.freshnessScore}%
                </span>
              </div>
              <Progress value={score.freshnessScore} className="h-1.5" />
            </div>
          </div>
        </div>

        {/* Badges */}
        {score.badges && score.badges.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-brand-evergreen">Earned Badges</h4>
            <div className="flex flex-wrap gap-2">
              {score.badges.map((badge) => (
                <Badge 
                  key={badge}
                  variant="secondary"
                  className="bg-mint/10 text-mint border-mint/20"
                  data-testid={`badge-${badge}`}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {badge.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Suggestions */}
        {score.improvementSuggestions && score.improvementSuggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-brand-evergreen">Top Improvement Suggestions</h4>
            <div className="space-y-2">
              {score.improvementSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-md border border-brand-evergreen/10"
                  data-testid={`suggestion-${index}`}
                >
                  <div className="mt-0.5">
                    {getPriorityIcon(suggestion.priority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-brand-evergreen">{suggestion.action}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Category: {suggestion.category} • +{suggestion.points} points
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-900">
            <strong>Boost your visibility:</strong> Providers with higher optimization scores appear higher in search results and attract more inquiries from parents.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
