import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Sparkles, Search as SearchIcon } from "lucide-react";

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
      <div className="relative group">
        {/* Sparkle Icon */}
        <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <Sparkles 
            className="h-5 w-5 transition-colors" 
            style={{ color: 'var(--deep-coral)' }}
          />
        </div>

        {/* Natural Language Search Input */}
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

      {/* Subtle helper text */}
      <p className="text-xs mt-2 text-center" style={{ color: 'var(--warm-gray)' }}>
        <Sparkles className="inline h-3 w-3 mr-1" style={{ color: 'var(--amber)' }} />
        Ask naturally — we understand location, age, schedule, and more
      </p>
    </div>
  );
}