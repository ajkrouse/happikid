import { useState, useEffect, useRef } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users, Sparkles, Search } from "lucide-react";

interface SearchSuggestion {
  type: 'recent' | 'popular' | 'location' | 'educational';
  text: string;
  category?: string;
  icon?: React.ReactNode;
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (query: string) => void;
  placeholder?: string;
}

export function SearchAutocomplete({ value, onChange, onSelect, placeholder }: SearchAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  // Save search to recent searches
  const saveSearch = (query: string) => {
    if (query.trim().length < 3) return;
    
    const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Generate suggestions based on input
  useEffect(() => {
    if (!value || value.length < 2) {
      // Show recent searches and popular queries when no input
      const popularQueries = [
        "Montessori programs in Jersey City",
        "after school programs for elementary kids",
        "summer camps in Manhattan",
        "daycare with extended hours",
        "bilingual preschool programs"
      ];

      setSuggestions([
        ...recentSearches.map(text => ({
          type: 'recent' as const,
          text,
          icon: <Clock className="h-4 w-4" />
        })),
        ...popularQueries.map(text => ({
          type: 'popular' as const,
          text,
          category: 'Popular',
          icon: <Sparkles className="h-4 w-4" />
        }))
      ]);
      return;
    }

    // Generate contextual suggestions
    const inputLower = value.toLowerCase();
    const newSuggestions: SearchSuggestion[] = [];

    // Location suggestions
    const locations = [
      "Jersey City", "Hoboken", "Manhattan", "Brooklyn", "Queens", 
      "Westfield", "Montclair", "Stamford", "Greenwich"
    ];
    
    locations.forEach(location => {
      if (location.toLowerCase().includes(inputLower)) {
        newSuggestions.push({
          type: 'location',
          text: `${value} in ${location}`,
          category: 'Location',
          icon: <MapPin className="h-4 w-4" />
        });
      }
    });

    // Educational philosophy suggestions
    const philosophies = ["Montessori", "Waldorf", "Reggio Emilia", "STEM"];
    philosophies.forEach(philosophy => {
      if (philosophy.toLowerCase().includes(inputLower) || inputLower.includes(philosophy.toLowerCase())) {
        newSuggestions.push({
          type: 'educational',
          text: `${philosophy} programs`,
          category: 'Educational',
          icon: <Sparkles className="h-4 w-4" />
        });
      }
    });

    // Age-based suggestions
    if (inputLower.includes('year') || inputLower.includes('age') || /\d/.test(inputLower)) {
      const ageGroups = ["toddlers", "preschool", "kindergarten", "school-age"];
      ageGroups.forEach(group => {
        newSuggestions.push({
          type: 'educational',
          text: `${value} for ${group}`,
          category: 'Age Group',
          icon: <Users className="h-4 w-4" />
        });
      });
    }

    setSuggestions(newSuggestions.slice(0, 8));
  }, [value, recentSearches]);

  const handleSelect = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    onSelect(suggestion.text);
    saveSearch(suggestion.text);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSelect(value);
      saveSearch(value);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={placeholder || "Try: 'Montessori programs in Jersey City'"}
            className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[600px] p-0" 
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <Command>
          <CommandList className="max-h-80">
            {suggestions.length === 0 ? (
              <CommandEmpty className="py-6 text-center text-gray-500">
                <div className="space-y-2">
                  <Search className="h-8 w-8 mx-auto text-gray-300" />
                  <p>Start typing to see suggestions</p>
                </div>
              </CommandEmpty>
            ) : (
              <>
                {recentSearches.length > 0 && suggestions.some(s => s.type === 'recent') && (
                  <CommandGroup heading="Recent Searches">
                    {suggestions
                      .filter(s => s.type === 'recent')
                      .map((suggestion, index) => (
                        <CommandItem
                          key={`recent-${index}`}
                          onSelect={() => handleSelect(suggestion)}
                          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50"
                        >
                          {suggestion.icon}
                          <span className="flex-1">{suggestion.text}</span>
                          <Badge variant="outline" className="text-xs">Recent</Badge>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
                
                {suggestions.some(s => s.type === 'location') && (
                  <CommandGroup heading="Location Suggestions">
                    {suggestions
                      .filter(s => s.type === 'location')
                      .map((suggestion, index) => (
                        <CommandItem
                          key={`location-${index}`}
                          onSelect={() => handleSelect(suggestion)}
                          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50"
                        >
                          {suggestion.icon}
                          <span className="flex-1">{suggestion.text}</span>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
                
                {suggestions.some(s => s.type === 'educational') && (
                  <CommandGroup heading="Educational Programs">
                    {suggestions
                      .filter(s => s.type === 'educational')
                      .map((suggestion, index) => (
                        <CommandItem
                          key={`educational-${index}`}
                          onSelect={() => handleSelect(suggestion)}
                          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50"
                        >
                          {suggestion.icon}
                          <span className="flex-1">{suggestion.text}</span>
                          {suggestion.category && (
                            <Badge variant="outline" className="text-xs">
                              {suggestion.category}
                            </Badge>
                          )}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
                
                {suggestions.some(s => s.type === 'popular') && (
                  <CommandGroup heading="Popular Searches">
                    {suggestions
                      .filter(s => s.type === 'popular')
                      .map((suggestion, index) => (
                        <CommandItem
                          key={`popular-${index}`}
                          onSelect={() => handleSelect(suggestion)}
                          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50"
                        >
                          {suggestion.icon}
                          <span className="flex-1">{suggestion.text}</span>
                          <Badge variant="outline" className="text-xs bg-primary-50 text-primary">
                            Popular
                          </Badge>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}