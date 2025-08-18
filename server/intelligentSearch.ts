/**
 * Intelligent Search Service
 * Parses natural language queries and converts them to structured filters
 * without requiring external AI APIs
 */

interface ParsedSearchQuery {
  filters: {
    type?: string;
    borough?: string;
    city?: string;
    ageRangeMin?: number;
    ageRangeMax?: number;
    features?: string[];
    search?: string;
  };
  originalQuery: string;
  matchedTerms: string[];
}

// Educational philosophies and approaches
const EDUCATIONAL_PHILOSOPHIES = {
  'montessori': ['Montessori', 'montessori', 'child-led learning', 'self-directed learning'],
  'waldorf': ['Waldorf', 'waldorf', 'steiner', 'holistic education'],
  'reggio emilia': ['Reggio Emilia', 'reggio', 'project-based learning'],
  'play-based': ['Play-based learning', 'play based', 'learning through play'],
  'stem': ['STEM programs', 'STEM', 'science', 'technology', 'engineering', 'math'],
  'bilingual': ['Bilingual', 'bilingual', 'spanish', 'chinese', 'language immersion'],
  'academic': ['Academic enrichment', 'academic', 'school readiness', 'pre-k prep'],
};

// NYC Area locations with variations
const LOCATIONS: { [key: string]: { city: string; borough: string } } = {
  // New Jersey
  'jersey city': { city: 'Jersey City', borough: 'Hudson County' },
  'hoboken': { city: 'Hoboken', borough: 'Hudson County' },
  'weehawken': { city: 'Weehawken', borough: 'Hudson County' },
  'union city': { city: 'Union City', borough: 'Hudson County' },
  'west new york': { city: 'West New York', borough: 'Hudson County' },
  'north bergen': { city: 'North Bergen', borough: 'Hudson County' },
  'secaucus': { city: 'Secaucus', borough: 'Hudson County' },
  'bayonne': { city: 'Bayonne', borough: 'Hudson County' },
  'kearny': { city: 'Kearny', borough: 'Hudson County' },
  
  // Bergen County, NJ
  'fort lee': { city: 'Fort Lee', borough: 'Bergen County' },
  'englewood': { city: 'Englewood', borough: 'Bergen County' },
  'teaneck': { city: 'Teaneck', borough: 'Bergen County' },
  'hackensack': { city: 'Hackensack', borough: 'Bergen County' },
  'paramus': { city: 'Paramus', borough: 'Bergen County' },
  'wyckoff': { city: 'Wyckoff', borough: 'Bergen County' },
  'ridgewood': { city: 'Ridgewood', borough: 'Bergen County' },
  'mahwah': { city: 'Mahwah', borough: 'Bergen County' },
  
  // NYC Boroughs
  'manhattan': { city: 'Manhattan', borough: 'New York County' },
  'brooklyn': { city: 'Brooklyn', borough: 'Kings County' },
  'queens': { city: 'Queens', borough: 'Queens County' },
  'bronx': { city: 'Bronx', borough: 'Bronx County' },
  'staten island': { city: 'Staten Island', borough: 'Richmond County' },
  
  // NYC Neighborhoods (map to boroughs)
  'upper east side': { city: 'Manhattan', borough: 'New York County' },
  'upper west side': { city: 'Manhattan', borough: 'New York County' },
  'tribeca': { city: 'Manhattan', borough: 'New York County' },
  'soho': { city: 'Manhattan', borough: 'New York County' },
  'chelsea': { city: 'Manhattan', borough: 'New York County' },
  'williamsburg': { city: 'Brooklyn', borough: 'Kings County' },
  'park slope': { city: 'Brooklyn', borough: 'Kings County' },
  'dumbo': { city: 'Brooklyn', borough: 'Kings County' },
  'long island city': { city: 'Queens', borough: 'Queens County' },
  'astoria': { city: 'Queens', borough: 'Queens County' },
};

// Provider types
const PROVIDER_TYPES: { [key: string]: string[] } = {
  'daycare': ['daycare', 'day care', 'childcare', 'child care', 'nursery'],
  'afterschool': ['after school', 'afterschool', 'after-school', 'extended day'],
  'camp': ['camp', 'summer camp', 'day camp', 'summer program'],
  'school': ['school', 'private school', 'preschool', 'pre-school', 'kindergarten'],
};

// Age-related terms
const AGE_TERMS: { [key: string]: { min: number; max: number } } = {
  'infant': { min: 0, max: 18 }, // 0-18 months
  'baby': { min: 0, max: 18 },
  'toddler': { min: 12, max: 36 }, // 1-3 years
  'toddlers': { min: 12, max: 36 },
  'preschool': { min: 36, max: 60 }, // 3-5 years
  'preschooler': { min: 36, max: 60 },
  'school age': { min: 60, max: 144 }, // 5-12 years
  'school-age': { min: 60, max: 144 },
  'kindergarten': { min: 60, max: 72 }, // 5-6 years
};

// Common features and amenities
const FEATURES: { [key: string]: string[] } = {
  'outdoor': ['Outdoor playground', 'outdoor', 'playground', 'garden'],
  'music': ['Music classes', 'music', 'musical'],
  'art': ['Art studio', 'art', 'creative arts', 'arts and crafts'],
  'cooking': ['Cooking classes', 'cooking', 'culinary'],
  'gymnastics': ['Gymnastics', 'gymnastics', 'physical education'],
  'transportation': ['Transportation', 'bus service', 'pickup', 'drop off'],
  'extended hours': ['Extended hours', 'early drop off', 'late pickup'],
  'meals': ['Meals included', 'lunch', 'snacks', 'nutrition'],
};

export class IntelligentSearchService {
  
  /**
   * Parse a natural language query into structured filters
   */
  parseQuery(query: string): ParsedSearchQuery {
    const lowercaseQuery = query.toLowerCase();
    const matchedTerms: string[] = [];
    const filters: ParsedSearchQuery['filters'] = {};
    
    // Extract location information
    const locationMatch = this.extractLocation(lowercaseQuery);
    if (locationMatch) {
      filters.city = locationMatch.city;
      filters.borough = locationMatch.borough;
      matchedTerms.push(`location: ${locationMatch.city}`);
    }
    
    // Extract provider type
    const typeMatch = this.extractProviderType(lowercaseQuery);
    if (typeMatch) {
      filters.type = typeMatch;
      matchedTerms.push(`type: ${typeMatch}`);
    }
    
    // Extract age information
    const ageMatch = this.extractAgeRange(lowercaseQuery);
    if (ageMatch) {
      filters.ageRangeMin = ageMatch.min;
      filters.ageRangeMax = ageMatch.max;
      matchedTerms.push(`age: ${ageMatch.min}-${ageMatch.max} months`);
    }
    
    // Extract educational philosophies and features
    const featuresMatch = this.extractFeatures(lowercaseQuery);
    if (featuresMatch.length > 0) {
      filters.features = featuresMatch;
      matchedTerms.push(`features: ${featuresMatch.join(', ')}`);
    }
    
    // If no specific terms were matched, use the original query for text search
    if (matchedTerms.length === 0) {
      filters.search = query;
      matchedTerms.push(`text search: ${query}`);
    }
    
    return {
      filters,
      originalQuery: query,
      matchedTerms
    };
  }
  
  private extractLocation(query: string): { city: string; borough: string } | null {
    // Check for specific city/neighborhood mentions
    for (const [locationKey, locationData] of Object.entries(LOCATIONS)) {
      if (query.includes(locationKey)) {
        return locationData;
      }
    }
    
    // Check for "in [location]" or "near [location]" patterns
    const locationPatterns = [
      /(?:in|near|around)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/,
      /([a-zA-Z\s]+?)\s+(?:area|neighborhood)/
    ];
    
    for (const pattern of locationPatterns) {
      const match = query.match(pattern);
      if (match) {
        const locationText = match[1].trim().toLowerCase();
        if (LOCATIONS[locationText]) {
          return LOCATIONS[locationText];
        }
      }
    }
    
    return null;
  }
  
  private extractProviderType(query: string): string | null {
    for (const [type, variations] of Object.entries(PROVIDER_TYPES)) {
      for (const variation of variations) {
        if (query.includes(variation)) {
          return type;
        }
      }
    }
    return null;
  }
  
  private extractAgeRange(query: string): { min: number; max: number } | null {
    // Check age terms first
    for (const [ageTerm, range] of Object.entries(AGE_TERMS)) {
      if (query.includes(ageTerm)) {
        return range;
      }
    }
    
    // Check for specific age numbers
    const agePatterns = [
      /(\d+)\s*(?:year|yr)s?\s*old/g,
      /(?:age|ages)\s*(\d+)(?:\s*-\s*(\d+))?/g,
      /(\d+)\s*(?:month|mo)s?\s*old/g
    ];
    
    for (const pattern of agePatterns) {
      const matches = Array.from(query.matchAll(pattern));
      if (matches.length > 0) {
        const match = matches[0];
        if (pattern.source.includes('month')) {
          // Age in months
          const months = parseInt(match[1]);
          return { min: Math.max(0, months - 6), max: months + 6 };
        } else {
          // Age in years
          const years = parseInt(match[1]);
          const months = years * 12;
          const endYears = match[2] ? parseInt(match[2]) : years;
          const endMonths = endYears * 12;
          return { min: months, max: endMonths };
        }
      }
    }
    
    return null;
  }
  
  private extractFeatures(query: string): string[] {
    const matchedFeatures: string[] = [];
    
    // Check educational philosophies
    for (const [philosophy, terms] of Object.entries(EDUCATIONAL_PHILOSOPHIES)) {
      for (const term of terms) {
        if (query.includes(term.toLowerCase())) {
          matchedFeatures.push(terms[0]); // Use the canonical term
          break;
        }
      }
    }
    
    // Check features
    for (const [featureKey, variations] of Object.entries(FEATURES)) {
      for (const variation of variations) {
        if (query.includes(variation.toLowerCase())) {
          matchedFeatures.push(variations[0]); // Use the canonical term
          break;
        }
      }
    }
    
    return Array.from(new Set(matchedFeatures)); // Remove duplicates
  }
  
  /**
   * Generate a human-readable explanation of what was parsed
   */
  explainParsing(parsed: ParsedSearchQuery): string {
    if (parsed.matchedTerms.length === 0) {
      return `Searching for "${parsed.originalQuery}"`;
    }
    
    return `Found: ${parsed.matchedTerms.join(' • ')}`;
  }
}

// Export a singleton instance
export const intelligentSearch = new IntelligentSearchService();