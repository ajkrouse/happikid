import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Target, MapPin, Users, Star } from "lucide-react";

interface SearchMetadata {
  originalQuery: string;
  parsedTerms: string[];
  confidence: number;
  suggestions?: string[];
  explanation: string;
}

interface SearchInsightsProps {
  metadata: SearchMetadata;
  resultsCount: number;
}

export function SearchInsights({ metadata, resultsCount }: SearchInsightsProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800 border-green-200";
    if (confidence >= 0.5) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <Target className="h-3 w-3" />;
    if (confidence >= 0.5) return <Star className="h-3 w-3" />;
    return <Lightbulb className="h-3 w-3" />;
  };

  const getTermIcon = (term: string) => {
    if (term.includes('location:')) return <MapPin className="h-3 w-3" />;
    if (term.includes('age:')) return <Users className="h-3 w-3" />;
    return <Target className="h-3 w-3" />;
  };

  return (
    <Card className="mb-6 border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Search Understanding */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900">Search Understanding</h3>
              <Badge 
                variant="outline" 
                className={`text-xs ${getConfidenceColor(metadata.confidence)}`}
              >
                {getConfidenceIcon(metadata.confidence)}
                {Math.round(metadata.confidence * 100)}% confidence
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              {resultsCount} programs found
            </div>
          </div>

          {/* Parsed Terms */}
          <div className="flex flex-wrap gap-2">
            {metadata.parsedTerms.map((term, index) => (
              <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                {getTermIcon(term)}
                {term}
              </Badge>
            ))}
          </div>

          {/* Suggestions */}
          {metadata.suggestions && metadata.suggestions.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">Try these refinements:</p>
                  <div className="space-y-1">
                    {metadata.suggestions.map((suggestion, index) => (
                      <p key={index} className="text-sm text-blue-700">• {suggestion}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}