import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info, Building2, Plus } from "lucide-react";
import type { OnboardingFormData, LocationEntry } from "@/types/onboarding";
import { AREAS } from "@/lib/areas";

interface StepBasicInfoProps {
  formData: OnboardingFormData;
  locations: LocationEntry[];
  onFormDataChange: (updates: Partial<OnboardingFormData>) => void;
  onLocationsChange: (locations: LocationEntry[]) => void;
  tips?: string[];
}

export function StepBasicInfo({ formData, locations, onFormDataChange, onLocationsChange, tips }: StepBasicInfoProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>Start with the foundation of your provider profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Provider Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onFormDataChange({ name: e.target.value })}
              placeholder="Little Sprouts Daycare"
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onFormDataChange({ description: e.target.value })}
              placeholder="Tell parents about your childcare philosophy, approach, and what makes you special..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Locations *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onLocationsChange([
                    ...locations,
                    { name: `Location ${locations.length + 1}`, address: "", borough: "", city: "New York", state: "NY", zipCode: "", phone: "", capacity: "", isPrimary: false },
                  ])
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </div>

            {locations.map((location, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Input
                      value={location.name}
                      onChange={(e) => {
                        const updated = [...locations];
                        updated[index] = { ...updated[index], name: e.target.value };
                        onLocationsChange(updated);
                      }}
                      placeholder="Location Name"
                      className="w-48"
                    />
                    {location.isPrimary && <Badge variant="default">Primary</Badge>}
                  </div>
                  {locations.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const filtered = locations.filter((_, i) => i !== index);
                        if (location.isPrimary && filtered.length > 0) {
                          filtered[0] = { ...filtered[0], isPrimary: true };
                        }
                        onLocationsChange(filtered);
                      }}
                    >
                      ×
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Address *</Label>
                    <Input
                      value={location.address}
                      onChange={(e) => {
                        const updated = [...locations];
                        updated[index] = { ...updated[index], address: e.target.value };
                        onLocationsChange(updated);
                      }}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <Label>Borough / Area</Label>
                    <Select
                      value={location.borough}
                      onValueChange={(value) => {
                        const updated = [...locations];
                        updated[index] = { ...updated[index], borough: value };
                        onLocationsChange(updated);
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select if in NYC area" /></SelectTrigger>
                      <SelectContent>
                        {AREAS.map((area) => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                        <SelectItem value="Long Island">Long Island</SelectItem>
                        <SelectItem value="Westchester">Westchester County</SelectItem>
                        <SelectItem value="Northern NJ">Northern New Jersey</SelectItem>
                        <SelectItem value="Other">Other Area</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label>City *</Label>
                    <Input
                      value={location.city}
                      onChange={(e) => {
                        const updated = [...locations];
                        updated[index] = { ...updated[index], city: e.target.value };
                        onLocationsChange(updated);
                      }}
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Input
                      value={location.state}
                      onChange={(e) => {
                        const updated = [...locations];
                        updated[index] = { ...updated[index], state: e.target.value };
                        onLocationsChange(updated);
                      }}
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <Label>ZIP Code *</Label>
                    <Input
                      value={location.zipCode}
                      onChange={(e) => {
                        const updated = [...locations];
                        updated[index] = { ...updated[index], zipCode: e.target.value };
                        onLocationsChange(updated);
                      }}
                      placeholder="10001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={location.phone}
                      onChange={(e) => {
                        const updated = [...locations];
                        updated[index] = { ...updated[index], phone: e.target.value };
                        onLocationsChange(updated);
                      }}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label>Capacity</Label>
                    <Input
                      value={location.capacity}
                      onChange={(e) => {
                        const updated = [...locations];
                        updated[index] = { ...updated[index], capacity: e.target.value };
                        onLocationsChange(updated);
                      }}
                      placeholder="50 children"
                    />
                  </div>
                </div>

                {!location.isPrimary && (
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updated = locations.map((loc, i) => ({ ...loc, isPrimary: i === index }));
                        onLocationsChange(updated);
                      }}
                    >
                      Set as Primary
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onFormDataChange({ email: e.target.value })}
              placeholder="contact@littlesprouts.com"
            />
          </div>

          <div>
            <Label htmlFor="website">Website (Optional)</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => onFormDataChange({ website: e.target.value })}
              placeholder="https://www.littlesprouts.com"
            />
          </div>
        </CardContent>
      </Card>

      {tips && tips.length > 0 && (
        <Card className="bg-brand-sage border-action-teal/30">
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <Info className="h-4 w-4 text-action-teal mr-2" />
              <span className="font-medium text-brand-evergreen">Pro Tips</span>
            </div>
            <ul className="text-sm text-text-muted space-y-1">
              {tips.map((tip, i) => <li key={i}>• {tip}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
