import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";

interface SearchFiltersProps {
  filters: {
    type?: string;
    borough?: string;
    city?: string;
    ageRange?: string;
    priceRange?: string;
    features?: string[];
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

// City data organized by county
const cityData: { [county: string]: { name: string; count: number }[] } = {
  "Manhattan": [
    { name: "New York", count: 113 }
  ],
  "Brooklyn": [
    { name: "Brooklyn", count: 102 }
  ],
  "Queens": [
    { name: "Queens", count: 9 },
    { name: "Long Island City", count: 7 },
    { name: "Astoria", count: 5 },
    { name: "Fresh Meadows", count: 5 },
    { name: "Bayside", count: 4 },
    { name: "Forest Hills", count: 4 },
    { name: "Flushing", count: 4 },
    { name: "Bellerose", count: 3 },
    { name: "Little Neck", count: 3 },
    { name: "Jamaica", count: 3 },
    { name: "Queens Village", count: 2 },
    { name: "Whitestone", count: 2 },
    { name: "Middle Village", count: 2 },
    { name: "Corona", count: 1 },
    { name: "Ridgewood", count: 1 },
    { name: "St. Albans", count: 1 }
  ],
  "Bronx": [
    { name: "Bronx", count: 25 }
  ],
  "Staten Island": [
    { name: "Staten Island", count: 6 }
  ],
  "Hudson County": [
    { name: "Jersey City", count: 88 },
    { name: "Hoboken", count: 50 },
    { name: "West New York", count: 3 }
  ],
  "Bergen County": [
    { name: "Paramus", count: 6 },
    { name: "Fort Lee", count: 5 },
    { name: "Hackensack", count: 4 },
    { name: "Ridgewood", count: 2 },
    { name: "Oakland", count: 2 },
    { name: "Fairview", count: 1 },
    { name: "Montvale", count: 1 },
    { name: "Wyckoff", count: 1 },
    { name: "Closter", count: 1 },
    { name: "Mahwah", count: 1 },
    { name: "Englewood", count: 1 },
    { name: "Fair Lawn", count: 1 },
    { name: "Tenafly", count: 1 }
  ],
  "Morris County": [
    { name: "Morristown", count: 4 },
    { name: "Denville", count: 2 },
    { name: "Rockaway", count: 2 },
    { name: "Lake Hopatcong", count: 1 },
    { name: "Succasunna", count: 1 },
    { name: "Randolph", count: 1 },
    { name: "Jefferson", count: 1 },
    { name: "Madison", count: 1 },
    { name: "Parsippany", count: 1 },
    { name: "Budd Lake", count: 1 },
    { name: "Florham Park", count: 1 },
    { name: "Kenvil", count: 1 },
    { name: "Pine Brook", count: 1 }
  ],
  "Westchester County": [
    { name: "White Plains", count: 9 },
    { name: "Scarsdale", count: 4 },
    { name: "Purchase", count: 3 },
    { name: "Yonkers", count: 2 },
    { name: "Cortlandt Manor", count: 2 },
    { name: "Hartsdale", count: 1 },
    { name: "Dobbs Ferry", count: 1 },
    { name: "Mohegan Lake", count: 1 },
    { name: "Peekskill", count: 1 },
    { name: "Valhalla", count: 1 }
  ],
  "Nassau County": [
    { name: "Garden City", count: 5 },
    { name: "New Hyde Park", count: 3 },
    { name: "Hempstead", count: 3 },
    { name: "Hicksville", count: 2 },
    { name: "Port Washington", count: 2 },
    { name: "Manhasset", count: 2 },
    { name: "East Hills", count: 1 },
    { name: "Roslyn Heights", count: 1 },
    { name: "Valley Stream", count: 1 },
    { name: "Glen Head", count: 1 },
    { name: "Roslyn", count: 1 },
    { name: "Coram", count: 1 },
    { name: "Commack", count: 1 },
    { name: "Mineola", count: 1 },
    { name: "Glen Cove", count: 1 },
    { name: "Syosset", count: 1 }
  ],
  "Fairfield County": [
    { name: "Stamford", count: 7 },
    { name: "Norwalk", count: 3 },
    { name: "Wilton", count: 2 },
    { name: "Darien", count: 1 },
    { name: "Westport", count: 1 },
    { name: "Greenwich", count: 1 },
    { name: "Monroe", count: 1 }
  ]
};

function getCitiesForCounty(county: string): { name: string; count: number }[] {
  return cityData[county] || [];
}

export default function SearchFilters({ filters, onFiltersChange, onClearFilters }: SearchFiltersProps) {
  const handleTypeChange = (value: string) => {
    onFiltersChange({ ...filters, type: value === "all" ? undefined : value });
  };

  const handleBoroughChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      borough: value === "all" ? undefined : value,
      city: undefined // Clear city when county changes
    });
  };

  const handleCityChange = (value: string) => {
    onFiltersChange({ ...filters, city: value === "all" ? undefined : value });
  };

  const handleAgeRangeChange = (value: string) => {
    onFiltersChange({ ...filters, ageRange: value === "all" ? undefined : value });
  };

  const handlePriceRangeChange = (value: string) => {
    onFiltersChange({ ...filters, priceRange: value === "all" ? undefined : value });
  };

  const handleFeatureToggle = (feature: string, checked: boolean) => {
    const currentFeatures = filters.features || [];
    const newFeatures = checked
      ? [...currentFeatures, feature]
      : currentFeatures.filter(f => f !== feature);
    onFiltersChange({ ...filters, features: newFeatures });
  };

  const hasActiveFilters = filters.type || filters.borough || filters.city || filters.ageRange || filters.priceRange || (filters.features && filters.features.length > 0);

  return (
    <Card className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl shadow-lg border-2" style={{ borderColor: 'var(--sage-light)', backgroundColor: 'white' }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display" style={{ color: 'var(--taupe)' }}>Narrow Your Search</CardTitle>
          <div className="w-20 h-8 flex items-center justify-end">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-xs px-2 py-1 h-6 rounded-lg" style={{ color: 'var(--deep-coral)' }}>
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Type */}
        <div>
          <Label className="text-sm font-medium mb-2 block" style={{ color: 'var(--taupe)' }}>
            What type of program?
          </Label>
          <Select value={filters.type || "all"} onValueChange={handleTypeChange}>
            <SelectTrigger className="rounded-xl border-2" style={{ borderColor: 'var(--sage-light)' }}>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="daycare">Daycare Centers</SelectItem>
              <SelectItem value="afterschool">After-School Programs</SelectItem>
              <SelectItem value="camp">Summer Camps</SelectItem>
              <SelectItem value="school">Private Schools</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* County Selection */}
        <div>
          <Label className="text-sm font-medium mb-2 block" style={{ color: 'var(--taupe)' }}>
            Where are you looking?
          </Label>
          <Select value={filters.borough || "all"} onValueChange={handleBoroughChange}>
            <SelectTrigger className="rounded-xl border-2" style={{ borderColor: 'var(--sage-light)' }}>
              <SelectValue placeholder="All Counties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Counties</SelectItem>
              <SelectItem value="Manhattan">Manhattan</SelectItem>
              <SelectItem value="Brooklyn">Brooklyn</SelectItem>
              <SelectItem value="Queens">Queens</SelectItem>
              <SelectItem value="Bronx">Bronx</SelectItem>
              <SelectItem value="Staten Island">Staten Island</SelectItem>
              <SelectItem value="Hudson County">Hudson County, NJ (141)</SelectItem>
              <SelectItem value="Bergen County">Bergen County, NJ (27)</SelectItem>
              <SelectItem value="Morris County">Morris County, NJ (18)</SelectItem>
              <SelectItem value="Middlesex County">Middlesex County, NJ (12)</SelectItem>
              <SelectItem value="Union County">Union County, NJ (10)</SelectItem>
              <SelectItem value="Essex County">Essex County, NJ (7)</SelectItem>
              <SelectItem value="Somerset County">Somerset County, NJ (7)</SelectItem>
              <SelectItem value="Monmouth County">Monmouth County, NJ (5)</SelectItem>
              <SelectItem value="Nassau County">Nassau County, NY (28)</SelectItem>
              <SelectItem value="Westchester County">Westchester County, NY (24)</SelectItem>
              <SelectItem value="Suffolk County">Suffolk County, NY (9)</SelectItem>
              <SelectItem value="Fairfield County">Fairfield County, CT (16)</SelectItem>
              <SelectItem value="New Haven County">New Haven County, CT (11)</SelectItem>
              <SelectItem value="Dutchess County">Dutchess County, NY (4)</SelectItem>
              <SelectItem value="Rockland County">Rockland County, NY (3)</SelectItem>
              <SelectItem value="Orange County">Orange County, NY (3)</SelectItem>
              <SelectItem value="Passaic County">Passaic County, NJ (1)</SelectItem>
              <SelectItem value="Putnam County">Putnam County, NY (1)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* City Selection (only show if county is selected) */}
        {filters.borough && filters.borough !== "all" && (
          <div>
            <Label className="text-sm font-medium mb-2 block" style={{ color: 'var(--taupe)' }}>
              Specific neighborhood?
            </Label>
            <Select value={filters.city || "all"} onValueChange={handleCityChange}>
              <SelectTrigger className="rounded-xl border-2" style={{ borderColor: 'var(--sage-light)' }}>
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities in {filters.borough}</SelectItem>
                {getCitiesForCounty(filters.borough).map((city) => (
                  <SelectItem key={city.name} value={city.name}>
                    {city.name} ({city.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Age Group */}
        <div>
          <Label className="text-sm font-medium mb-3 block" style={{ color: 'var(--taupe)' }}>
            Your child's age
          </Label>
          <RadioGroup value={filters.ageRange || "all"} onValueChange={handleAgeRangeChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="age-all" />
              <Label htmlFor="age-all" className="text-sm" style={{ color: 'var(--warm-gray)' }}>
                All Ages
              </Label>
            </div>
            {[
              { id: "infants", label: "Infants (0-12 months)", value: "infants" },
              { id: "toddlers", label: "Toddlers (1-3 years)", value: "toddlers" },
              { id: "preschool", label: "Preschool (3-5 years)", value: "preschool" },
              { id: "school-age", label: "School Age (5+ years)", value: "school-age" },
            ].map((age) => (
              <div key={age.id} className="flex items-center space-x-2">
                <RadioGroupItem value={age.value} id={age.id} />
                <Label htmlFor={age.id} className="text-sm" style={{ color: 'var(--warm-gray)' }}>
                  {age.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Price Range */}
        <div>
          <Label className="text-sm font-medium mb-3 block" style={{ color: 'var(--taupe)' }}>
            What can you budget?
          </Label>
          <RadioGroup value={filters.priceRange || "all"} onValueChange={handlePriceRangeChange}>
            {[
              { value: "all", label: "Any Price" },
              { value: "0-1000", label: "Under $1,000/mo" },
              { value: "1000-2000", label: "$1,000 - $2,000/mo" },
              { value: "2000-3000", label: "$2,000 - $3,000/mo" },
              { value: "3000+", label: "$3,000+/mo" },
            ].map((price) => (
              <div key={price.value} className="flex items-center space-x-2">
                <RadioGroupItem value={price.value} id={price.value} />
                <Label htmlFor={price.value} className="text-sm" style={{ color: 'var(--warm-gray)' }}>
                  {price.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Special Features */}
        <div>
          <Label className="text-sm font-medium mb-3 block" style={{ color: 'var(--taupe)' }}>
            What matters to you?
          </Label>
          <div className="space-y-3">
            {[
              "Interactive whiteboards",
              "Coding for kids",
              "Yoga",
              "Language immersion",
              "Art studio",
              "Reggio Emilia approach",
              "Indoor playground",
              "Healthy meals",
              "Music & movement",
              "Science lab",
              "Homework help",
              "STEM projects",
              "Sports activities",
              "Art programs",
              "Field trips",
              "Swimming pool",
              "Sports courts",
              "Nature trails",
              "Arts & crafts",
              "Montessori method",
              "Mixed-age classrooms",
              "Outdoor learning",
              "Foreign language",
              "Music program",
            ].map((feature) => (
              <div key={feature} className="flex items-center space-x-2">
                <Checkbox
                  id={feature}
                  checked={filters.features?.includes(feature) || false}
                  onCheckedChange={(checked) => 
                    handleFeatureToggle(feature, checked as boolean)
                  }
                />
                <Label htmlFor={feature} className="text-sm" style={{ color: 'var(--warm-gray)' }}>
                  {feature}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
