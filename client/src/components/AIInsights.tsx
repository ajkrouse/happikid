import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Lightbulb, MessageSquare, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIInsightsProps {
  summary: string;
  highlights: string[];
  followUpSuggestions: string[];
  onFollowUp?: (query: string) => void;
  isLoading?: boolean;
}

export function AIInsights({ 
  summary, 
  highlights, 
  followUpSuggestions, 
  onFollowUp,
  isLoading 
}: AIInsightsProps) {
  if (isLoading) {
    return (
      <Card className="mb-6 border-2 border-action-teal/20 bg-gradient-to-r from-brand-sage to-white overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-action-teal/10">
              <Sparkles className="h-5 w-5 text-action-teal animate-pulse" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-2 border-action-teal/20 bg-gradient-to-r from-brand-sage to-white overflow-hidden" data-testid="card-ai-insights">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-action-teal/10">
            <Sparkles className="h-5 w-5 text-action-teal" />
          </div>
          <h3 className="font-semibold text-brand-evergreen">AI Insights</h3>
          <Badge variant="outline" className="text-xs bg-action-teal/10 text-action-teal border-action-teal/20">
            Powered by AI
          </Badge>
        </div>

        <p className="text-brand-evergreen leading-relaxed mb-4" data-testid="text-ai-summary">
          {summary}
        </p>

        {highlights.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-brand-evergreen/80">Key Highlights</span>
            </div>
            <ul className="space-y-1">
              {highlights.map((highlight, index) => (
                <li key={index} className="text-sm text-brand-evergreen/70 flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-action-teal shrink-0 mt-0.5" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {followUpSuggestions.length > 0 && onFollowUp && (
          <div className="pt-4 border-t border-brand-evergreen/10">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-action-clay" />
              <span className="text-sm font-medium text-brand-evergreen/80">Explore Further</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {followUpSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onFollowUp(suggestion)}
                  className="text-xs border-action-clay/30 text-action-clay hover:bg-action-clay/10 hover:border-action-clay"
                  data-testid={`button-follow-up-${index}`}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AIInsightsSkeleton() {
  return (
    <Card className="mb-6 border-2 border-action-teal/20 bg-gradient-to-r from-brand-sage to-white overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-action-teal/10">
            <Sparkles className="h-5 w-5 text-action-teal animate-pulse" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );
}
