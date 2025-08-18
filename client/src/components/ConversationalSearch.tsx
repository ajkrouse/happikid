import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Sparkles, MapPin, Users, Clock, DollarSign } from "lucide-react";

interface ConversationalSearchProps {
  onSearch: (query: string) => void;
  currentQuery?: string;
}

export function ConversationalSearch({ onSearch, currentQuery }: ConversationalSearchProps) {
  const [showSuggestions, setShowSuggestions] = useState(!currentQuery);

  const exampleQueries = [
    {
      icon: <Sparkles className="h-4 w-4" />,
      text: "Montessori programs in Jersey City",
      category: "Educational Philosophy"
    },
    {
      icon: <MapPin className="h-4 w-4" />,
      text: "after school programs near Brooklyn Heights",
      category: "Location + Type"
    },
    {
      icon: <Users className="h-4 w-4" />,
      text: "daycare for 2 year old twins",
      category: "Age Specific"
    },
    {
      icon: <Clock className="h-4 w-4" />,
      text: "full time preschool with extended hours",
      category: "Schedule"
    },
    {
      icon: <DollarSign className="h-4 w-4" />,
      text: "affordable summer camps in Queens",
      category: "Budget"
    },
    {
      icon: <MessageCircle className="h-4 w-4" />,
      text: "bilingual daycare with outdoor playground",
      category: "Features"
    }
  ];

  const conversationalPrompts = [
    "What kind of program are you looking for?",
    "Tell me about your child's needs...",
    "Describe your ideal childcare situation...",
    "What matters most to your family?"
  ];

  if (!showSuggestions && currentQuery) {
    return (
      <div className="mb-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowSuggestions(true)}
          className="text-xs"
        >
          <MessageCircle className="h-3 w-3 mr-1" />
          Show search examples
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-gradient-to-r from-primary-50 to-secondary-50 p-4 rounded-lg border border-primary-100">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-medium text-gray-900">Try Natural Language Search</h3>
        {currentQuery && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowSuggestions(false)}
            className="text-xs ml-auto"
          >
            Hide
          </Button>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Just ask naturally! Our AI understands location, age, educational philosophy, and more.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {exampleQueries.map((query, index) => (
          <button
            key={index}
            onClick={() => onSearch(query.text)}
            className="text-left p-3 bg-white rounded-md border border-gray-200 hover:border-primary hover:bg-primary-50 transition-colors group"
          >
            <div className="flex items-start gap-2">
              <div className="text-gray-400 group-hover:text-primary">
                {query.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 group-hover:text-primary font-medium">
                  "{query.text}"
                </p>
                <Badge variant="outline" className="text-xs mt-1">
                  {query.category}
                </Badge>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 <strong>Pro tip:</strong> Be specific about location and age for best results. Try phrases like "for my 4-year-old" or "in downtown Hoboken"
        </p>
      </div>
    </div>
  );
}