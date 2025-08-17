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
    ageRange?: string;
    priceRange?: string;
    features?: string[];
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

export default function SearchFilters({ filters, onFiltersChange, onClearFilters }: SearchFiltersProps) {
  const handleTypeChange = (value: string) => {
    onFiltersChange({ ...filters, type: value === "all" ? undefined : value });
  };

  const handleBoroughChange = (value: string) => {
    onFiltersChange({ ...filters, borough: value === "all" ? undefined : value });
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

  const hasActiveFilters = filters.type || filters.borough || filters.ageRange || filters.priceRange || (filters.features && filters.features.length > 0);

  return (
    <Card className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Refine Your Search</CardTitle>
          <div className="w-20 h-8 flex items-center justify-end">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-xs px-2 py-1 h-6">
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Type */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Provider Type
          </Label>
          <Select value={filters.type || "all"} onValueChange={handleTypeChange}>
            <SelectTrigger>
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

        {/* Location */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Location
          </Label>
          <Select value={filters.borough || "all"} onValueChange={handleBoroughChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <optgroup label="NYC Boroughs">
                <SelectItem value="Manhattan">Manhattan</SelectItem>
                <SelectItem value="Brooklyn">Brooklyn</SelectItem>
                <SelectItem value="Queens">Queens</SelectItem>
                <SelectItem value="Bronx">Bronx</SelectItem>
                <SelectItem value="Staten Island">Staten Island</SelectItem>
              </optgroup>
              <optgroup label="New Jersey Counties">
                <SelectItem value="Hudson County">Hudson County, NJ</SelectItem>
                <SelectItem value="Bergen County">Bergen County, NJ</SelectItem>
                <SelectItem value="Monmouth County">Monmouth County, NJ</SelectItem>
                <SelectItem value="Morris County">Morris County, NJ</SelectItem>
                <SelectItem value="Essex County">Essex County, NJ</SelectItem>
              </optgroup>
              <optgroup label="Other NY Counties">
                <SelectItem value="Nassau County">Nassau County, NY</SelectItem>
                <SelectItem value="Suffolk County">Suffolk County, NY</SelectItem>
                <SelectItem value="Westchester County">Westchester County, NY</SelectItem>
              </optgroup>
              <optgroup label="Connecticut">
                <SelectItem value="Fairfield County">Fairfield County, CT</SelectItem>
                <SelectItem value="Hartford County">Hartford County, CT</SelectItem>
                <SelectItem value="New Haven County">New Haven County, CT</SelectItem>
              </optgroup>
            </SelectContent>
          </Select>
        </div>

        {/* Age Group */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Age Group
          </Label>
          <RadioGroup value={filters.ageRange || "all"} onValueChange={handleAgeRangeChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="age-all" />
              <Label htmlFor="age-all" className="text-sm text-gray-700">
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
                <Label htmlFor={age.id} className="text-sm text-gray-700">
                  {age.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Price Range */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Monthly Price Range
          </Label>
          <RadioGroup value={filters.priceRange || "all"} onValueChange={handlePriceRangeChange}>
            {[
              { value: "all", label: "Any Price" },
              { value: "0-1000", label: "Under $1,000" },
              { value: "1000-2000", label: "$1,000 - $2,000" },
              { value: "2000-3000", label: "$2,000 - $3,000" },
              { value: "3000+", label: "$3,000+" },
            ].map((price) => (
              <div key={price.value} className="flex items-center space-x-2">
                <RadioGroupItem value={price.value} id={price.value} />
                <Label htmlFor={price.value} className="text-sm text-gray-700">
                  {price.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Special Features */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Special Features
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
                <Label htmlFor={feature} className="text-sm text-gray-700">
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
