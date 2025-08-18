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
  confidence: number; // 0-1 score for how confident we are in the parsing
  suggestions?: string[]; // Alternative interpretations
}

// Educational philosophies and approaches
const EDUCATIONAL_PHILOSOPHIES: { [key: string]: string[] } = {
  'montessori': ['Montessori', 'montessori', 'child-led learning', 'self-directed learning', 'mixed-age classrooms', 'prepared environment'],
  'waldorf': ['Waldorf', 'waldorf', 'steiner', 'holistic education', 'arts integration', 'eurythmy'],
  'reggio emilia': ['Reggio Emilia', 'reggio', 'project-based learning', 'emergent curriculum', 'documentation'],
  'play-based': ['Play-based learning', 'play based', 'learning through play', 'child-centered', 'exploration'],
  'stem': ['STEM programs', 'STEM', 'science', 'technology', 'engineering', 'math', 'coding', 'robotics'],
  'bilingual': ['Bilingual', 'bilingual', 'spanish', 'chinese', 'language immersion', 'dual language', 'multilingual'],
  'academic': ['Academic enrichment', 'academic', 'school readiness', 'pre-k prep', 'structured learning', 'curriculum'],
  'creative': ['Creative arts', 'art', 'music', 'drama', 'creative expression', 'artistic'],
  'nature-based': ['Nature-based', 'outdoor learning', 'forest school', 'environmental education', 'garden'],
  'religious': ['Religious', 'faith-based', 'christian', 'jewish', 'catholic', 'islamic', 'spiritual'],
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
  'outdoor': ['Outdoor playground', 'outdoor', 'playground', 'garden', 'nature', 'fresh air'],
  'music': ['Music classes', 'music', 'musical', 'singing', 'instruments'],
  'art': ['Creative arts', 'art', 'arts and crafts', 'painting', 'drawing'], // Removed 'creative arts' from art to avoid confusion
  'cooking': ['Cooking classes', 'cooking', 'culinary', 'kitchen', 'nutrition education'],
  'gymnastics': ['Gymnastics', 'gymnastics', 'physical education', 'movement', 'exercise'],
  'transportation': ['Transportation', 'bus service', 'pickup', 'drop off', 'shuttle'],
  'extended hours': ['Extended hours', 'early drop off', 'late pickup', 'flexible hours', 'before care', 'after care'],
  'meals': ['Meals included', 'lunch', 'snacks', 'nutrition', 'organic meals', 'healthy food'],
  'swimming': ['Swimming pool', 'swimming', 'pool', 'water activities', 'aquatics'],
  'sports': ['Sports', 'athletics', 'soccer', 'basketball', 'tennis', 'physical activity'],
  'technology': ['Technology', 'computers', 'coding', 'digital literacy', 'tablets'],
  'language': ['Foreign languages', 'language learning', 'french', 'spanish', 'mandarin'],
  'special needs': ['Special needs', 'inclusion', 'therapy', 'IEP', 'developmental support'],
  'small class': ['Small class sizes', 'low ratio', 'individual attention', 'personalized'],
  'certified teachers': ['Certified teachers', 'qualified staff', 'experienced educators', 'trained professionals'],
};

export class IntelligentSearchService {
  
  /**
   * Parse a natural language query into structured filters
   */
  parseQuery(query: string): ParsedSearchQuery {
    const lowercaseQuery = query.toLowerCase();
    const matchedTerms: string[] = [];
    const filters: ParsedSearchQuery['filters'] = {};
    const suggestions: string[] = [];
    let confidence = 0;
    
    // Extract location information
    const locationMatch = this.extractLocation(lowercaseQuery);
    if (locationMatch) {
      filters.city = locationMatch.city;
      filters.borough = locationMatch.borough;
      matchedTerms.push(`location: ${locationMatch.city}`);
      confidence += 0.3;
    }
    
    // Extract provider type
    const typeMatch = this.extractProviderType(lowercaseQuery);
    if (typeMatch) {
      filters.type = typeMatch;
      matchedTerms.push(`type: ${typeMatch}`);
      confidence += 0.2;
    }
    
    // Extract age information
    const ageMatch = this.extractAgeRange(lowercaseQuery);
    if (ageMatch) {
      filters.ageRangeMin = ageMatch.min;
      filters.ageRangeMax = ageMatch.max;
      matchedTerms.push(`age: ${Math.floor(ageMatch.min/12)}-${Math.floor(ageMatch.max/12)} years`);
      confidence += 0.2;
    }
    
    // Extract educational philosophies and features
    const featuresMatch = this.extractFeatures(lowercaseQuery);
    if (featuresMatch.length > 0) {
      filters.features = featuresMatch;
      matchedTerms.push(`programs: ${featuresMatch.join(', ')}`);
      confidence += 0.3;
    }
    
    // Advanced query understanding
    this.extractAdvancedConcepts(lowercaseQuery, filters, matchedTerms, suggestions);
    
    // Quality and safety indicators
    this.extractQualityIndicators(lowercaseQuery, filters, matchedTerms);
    
    // If no specific terms were matched, use the original query for text search
    if (matchedTerms.length === 0) {
      filters.search = query;
      matchedTerms.push(`text search: ${query}`);
      confidence = 0.1; // Low confidence for generic text search
    }
    
    // Generate suggestions based on partial matches
    if (confidence < 0.7) {
      this.generateSuggestions(lowercaseQuery, suggestions);
    }
    
    return {
      filters,
      originalQuery: query,
      matchedTerms,
      confidence: Math.min(confidence, 1.0),
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }
  
  /**
   * Extract advanced concepts like budget, schedule, and special requirements
   */
  private extractAdvancedConcepts(query: string, filters: any, matchedTerms: string[], suggestions: string[]) {
    // Budget indicators
    const budgetTerms = ['cheap', 'affordable', 'budget', 'low cost', 'expensive', 'premium', 'luxury'];
    for (const term of budgetTerms) {
      if (query.includes(term)) {
        matchedTerms.push(`budget: ${term}`);
        if (['cheap', 'affordable', 'budget', 'low cost'].includes(term)) {
          suggestions.push('Try filtering by price range $1000-$2000');
        } else {
          suggestions.push('Try filtering by price range $3000+');
        }
      }
    }
    
    // Schedule indicators
    const scheduleTerms = ['full time', 'part time', 'half day', 'extended hours', 'early morning', 'evening'];
    for (const term of scheduleTerms) {
      if (query.includes(term)) {
        matchedTerms.push(`schedule: ${term}`);
        if (term === 'extended hours' || term === 'early morning' || term === 'evening') {
          if (!filters.features) filters.features = [];
          filters.features.push('Extended hours');
        }
      }
    }
    
    // Special requirements
    const specialNeeds = ['special needs', 'autism', 'disabilities', 'inclusive', 'therapy'];
    for (const term of specialNeeds) {
      if (query.includes(term)) {
        matchedTerms.push(`special requirements: ${term}`);
        if (!filters.features) filters.features = [];
        filters.features.push('Special needs');
      }
    }
  }
  
  /**
   * Extract quality and safety indicators
   */
  private extractQualityIndicators(query: string, filters: any, matchedTerms: string[]) {
    const qualityTerms = {
      'licensed': 'Licensed facility',
      'accredited': 'Accredited program',
      'certified teachers': 'Certified teachers',
      'small class': 'Small class sizes',
      'low ratio': 'Small class sizes',
      'experienced': 'Experienced staff',
      'qualified': 'Qualified staff'
    };
    
    for (const [term, feature] of Object.entries(qualityTerms)) {
      if (query.includes(term)) {
        matchedTerms.push(`quality: ${term}`);
        if (!filters.features) filters.features = [];
        filters.features.push(feature);
      }
    }
  }
  
  /**
   * Generate helpful suggestions based on the query
   */
  private generateSuggestions(query: string, suggestions: string[]) {
    // Suggest common searches if no clear intent
    if (query.length < 5) {
      suggestions.push('Try "montessori in manhattan" or "after school programs for 8 year olds"');
      return;
    }
    
    // Suggest location if missing
    if (!this.extractLocation(query)) {
      suggestions.push('Add a location like "in Brooklyn" or "near Jersey City"');
    }
    
    // Suggest age if missing
    if (!this.extractAgeRange(query)) {
      suggestions.push('Specify age like "for 4 year olds" or "toddler programs"');
    }
    
    // Suggest type if missing
    if (!this.extractProviderType(query)) {
      suggestions.push('Try adding "daycare", "after school", "camp", or "private school"');
    }
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
    
    // Prioritize specific program matches - return ONLY the most specific match
    if (query.includes('music')) {
      return ['Music classes']; // Return immediately with only music classes
    } else if (query.includes('art') && !query.includes('music')) {
      return ['Creative arts']; // Return immediately with only art
    } else if (query.includes('cooking')) {
      return ['Cooking classes'];
    } else if (query.includes('gymnastics')) {
      return ['Gymnastics'];
    } else if (query.includes('swimming') || query.includes('pool')) {
      return ['Swimming pool'];
    }
    
    // Check educational philosophies
    for (const [philosophy, terms] of Object.entries(EDUCATIONAL_PHILOSOPHIES)) {
      for (const term of terms) {
        if (query.includes(term.toLowerCase())) {
          matchedFeatures.push(terms[0]); // Use the canonical term
          break;
        }
      }
    }
    
    // Only check broader features if no specific programs were found
    if (matchedFeatures.length === 0) {
      for (const [featureKey, variations] of Object.entries(FEATURES)) {
        for (const variation of variations) {
          if (query.includes(variation.toLowerCase())) {
            matchedFeatures.push(variations[0]); // Use the canonical term
            break;
          }
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
    
    let explanation = `Found: ${parsed.matchedTerms.join(' • ')}`;
    
    if (parsed.confidence < 0.5) {
      explanation += ` (${Math.round(parsed.confidence * 100)}% confidence)`;
    }
    
    if (parsed.suggestions && parsed.suggestions.length > 0) {
      explanation += `\nSuggestions: ${parsed.suggestions.join(' | ')}`;
    }
    
    return explanation;
  }
  
  /**
   * Advanced semantic search using synonym expansion
   */
  expandSynonyms(query: string): string[] {
    const synonyms: { [key: string]: string[] } = {
      'kids': ['children', 'child', 'kids'],
      'learning': ['education', 'development', 'growth', 'instruction'],
      'care': ['childcare', 'daycare', 'supervision'],
      'quality': ['excellent', 'premium', 'top-rated', 'best'],
      'safe': ['secure', 'protected', 'trusted'],
      'fun': ['engaging', 'enjoyable', 'exciting'],
      'creative': ['artistic', 'imaginative', 'innovative'],
      'smart': ['intellectual', 'academic', 'educational'],
    };
    
    const words = query.toLowerCase().split(' ');
    const expandedTerms: string[] = [query];
    
    for (const word of words) {
      if (synonyms[word]) {
        for (const synonym of synonyms[word]) {
          const expandedQuery = query.toLowerCase().replace(word, synonym);
          if (expandedQuery !== query.toLowerCase()) {
            expandedTerms.push(expandedQuery);
          }
        }
      }
    }
    
    return expandedTerms;
  }

  /**
   * Get location suggestions based on partial input
   */
  getLocationSuggestions(input: string): Array<{ city: string; borough: string }> {
    const inputLower = input.toLowerCase();
    return Object.entries(LOCATIONS)
      .filter(([key]) => key.includes(inputLower))
      .map(([_, value]) => value)
      .slice(0, 5);
  }

  /**
   * Get educational philosophy suggestions
   */
  getEducationalSuggestions(input: string): string[] {
    const inputLower = input.toLowerCase();
    return Object.keys(EDUCATIONAL_PHILOSOPHIES)
      .filter(philosophy => philosophy.includes(inputLower) || inputLower.includes(philosophy))
      .slice(0, 3);
  }

  /**
   * Get feature suggestions
   */
  getFeatureSuggestions(input: string): string[] {
    const inputLower = input.toLowerCase();
    const matchedFeatures: string[] = [];
    
    for (const [feature, keywords] of Object.entries(FEATURES)) {
      if (keywords.some(keyword => keyword.toLowerCase().includes(inputLower))) {
        matchedFeatures.push(feature);
      }
    }
    
    return matchedFeatures.slice(0, 3);
  }
}

// Export a singleton instance
export const intelligentSearch = new IntelligentSearchService();