import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sparkles, MapPin, Users, Clock, DollarSign, MessageCircle, Lightbulb } from "lucide-react";

interface ConversationalSearchProps {
  onSearch: (query: string) => void;
  currentQuery?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function ConversationalSearch({ onSearch, currentQuery, value, onChange }: ConversationalSearchProps) {
  const [localValue, setLocalValue] = useState(value || currentQuery || "");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const placeholderExamples = [
    "Find after-school programs near Hamilton Park for a 6-year-old…",
    "Show camps with early drop-off in August…",
    "Find preschools with extended hours near the PATH…",
    "Programs for toddlers starting in March…",
    "Montessori daycare in Jersey City for 3-year-olds…",
    "Summer camps with swimming and outdoor activities…"
  ];

  const exampleQueries = [
    {
      icon: Sparkles,
      text: "Montessori programs in Jersey City",
      category: "Educational Philosophy"
    },
    {
      icon: MapPin,
      text: "after school programs near Brooklyn Heights",
      category: "Location + Type"
    },
    {
      icon: Users,
      text: "daycare for 2 year old twins",
      category: "Age Specific"
    },
    {
      icon: Clock,
      text: "full time preschool with extended hours",
      category: "Schedule"
    },
    {
      icon: DollarSign,
      text: "affordable summer camps in Queens",
      category: "Budget"
    },
    {
      icon: MessageCircle,
      text: "bilingual daycare with outdoor playground",
      category: "Features"
    }
  ];

  // Rotate placeholder text every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderExamples.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && localValue.trim()) {
      onSearch(localValue);
    }
  };

  return (
    <div className="w-full">
      {/* Natural Language Search Input */}
      <div className="relative group mb-6">
        {/* Sparkle Icon */}
        <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <Sparkles 
            className="h-5 w-5 transition-colors" 
            style={{ color: 'var(--deep-coral)' }}
          />
        </div>

        <Input
          type="text"
          value={localValue}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholderExamples[placeholderIndex]}
          className="w-full h-16 pl-14 pr-6 text-base rounded-full shadow-md transition-all duration-300 border-2"
          style={{
            backgroundColor: 'hsl(40, 25%, 97%)', // warm ivory
            borderColor: 'var(--sage-light)',
            color: 'var(--taupe)'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--deep-coral)';
            e.target.style.boxShadow = '0 4px 12px rgba(242, 107, 91, 0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--sage-light)';
            e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
          }}
          data-testid="input-natural-language-search"
        />

        {/* Search hint */}
        {!localValue && (
          <div 
            className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-xs font-medium px-3 py-1 rounded-full"
            style={{
              backgroundColor: 'hsl(145, 30%, 88%)',
              color: 'var(--sage-dark)'
            }}
          >
            Press Enter ↵
          </div>
        )}
      </div>

      {/* Try Natural Language Search Suggestions */}
      <Card className="p-6 rounded-2xl shadow-sm border-2" style={{ backgroundColor: 'hsl(185, 45%, 94%)', borderColor: 'var(--teal-blue)' }}>
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="h-5 w-5" style={{ color: 'var(--teal-blue)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--taupe)' }}>Try Natural Language Search</h3>
        </div>
        
        <p className="text-sm mb-4" style={{ color: 'var(--warm-gray)' }}>
          Just ask naturally! Our AI understands location, age, educational philosophy, and more.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {exampleQueries.map((query, index) => {
            const Icon = query.icon;
            return (
              <button
                key={index}
                onClick={() => onSearch(query.text)}
                className="text-left p-3 bg-white rounded-xl border-2 border-transparent hover:shadow-md transition-all group"
                style={{
                  borderColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--teal-blue)';
                  e.currentTarget.style.backgroundColor = 'hsl(185, 55%, 98%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
                data-testid={`button-example-query-${index}`}
              >
                <div className="flex items-start gap-2">
                  <div className="transition-colors" style={{ color: 'var(--warm-gray)' }}>
                    <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" style={{ color: 'var(--teal-blue)' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--taupe)' }}>
                      "{query.text}"
                    </p>
                    <Badge 
                      variant="outline" 
                      className="text-xs border-0 px-2 py-0.5" 
                      style={{ backgroundColor: 'hsl(185, 45%, 88%)', color: 'var(--teal-blue)' }}
                    >
                      {query.category}
                    </Badge>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t flex items-start gap-2" style={{ borderColor: 'var(--sage-light)' }}>
          <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--amber)' }} />
          <p className="text-xs" style={{ color: 'var(--warm-gray)' }}>
            <strong>Pro tip:</strong> Be specific about location and age for best results. Try phrases like "for my 4-year-old" or "in downtown Hoboken"
          </p>
        </div>
      </Card>
    </div>
  );
}