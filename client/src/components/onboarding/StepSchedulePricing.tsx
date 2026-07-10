import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, Clock } from "lucide-react";
import type { OnboardingFormData } from "@/types/onboarding";

interface StepSchedulePricingProps {
  formData: OnboardingFormData;
  onFormDataChange: (updates: Partial<OnboardingFormData>) => void;
  tips?: string[];
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export function StepSchedulePricing({ formData, onFormDataChange, tips }: StepSchedulePricingProps) {
  const updateScheduleDay = (day: string, field: string, value: any) => {
    onFormDataChange({
      schedule: {
        ...formData.schedule,
        [day]: { ...formData.schedule[day], [field]: value },
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule & Pricing
          </CardTitle>
          <CardDescription>Set your operating hours and pricing information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Label className="text-base font-medium">Weekly Schedule *</Label>
            <p className="text-sm text-gray-600">Set your operating hours for each day of the week</p>

            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-24 flex items-center gap-2">
                  <Checkbox
                    id={`${day}-open`}
                    checked={formData.schedule[day]?.isOpen || false}
                    onCheckedChange={(checked) => updateScheduleDay(day, "isOpen", checked)}
                  />
                  <Label htmlFor={`${day}-open`} className="capitalize">{day}</Label>
                </div>

                {formData.schedule[day]?.isOpen && (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={formData.schedule[day]?.open || ""}
                      onChange={(e) => updateScheduleDay(day, "open", e.target.value)}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-500">to</span>
                    <Input
                      type="time"
                      value={formData.schedule[day]?.close || ""}
                      onChange={(e) => updateScheduleDay(day, "close", e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Pricing *</Label>
            <p className="text-sm text-gray-600">Choose how you want to display your pricing</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Pricing Type</Label>
                <Select
                  value={formData.monthlyPriceMin ? "range" : "fixed"}
                  onValueChange={(value) => {
                    if (value === "range") {
                      onFormDataChange({ monthlyPriceMin: formData.monthlyPrice || "", monthlyPriceMax: "" });
                    } else {
                      onFormDataChange({ monthlyPriceMin: "", monthlyPriceMax: "" });
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select pricing type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Price</SelectItem>
                    <SelectItem value="range">Price Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.monthlyPriceMin ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthlyPriceMin">Minimum Monthly Price *</Label>
                  <Input
                    id="monthlyPriceMin"
                    type="number"
                    value={formData.monthlyPriceMin}
                    onChange={(e) => onFormDataChange({ monthlyPriceMin: e.target.value })}
                    placeholder="1000"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyPriceMax">Maximum Monthly Price *</Label>
                  <Input
                    id="monthlyPriceMax"
                    type="number"
                    value={formData.monthlyPriceMax}
                    onChange={(e) => onFormDataChange({ monthlyPriceMax: e.target.value })}
                    placeholder="1500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="monthlyPrice">Monthly Price *</Label>
                <Input
                  id="monthlyPrice"
                  type="number"
                  value={formData.monthlyPrice}
                  onChange={(e) => onFormDataChange({ monthlyPrice: e.target.value })}
                  placeholder="1200"
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            <div className="flex items-center space-x-2 mt-3">
              <Checkbox
                id="showExactPrice"
                checked={formData.showExactPrice !== false}
                onCheckedChange={(checked) => onFormDataChange({ showExactPrice: checked !== false })}
              />
              <Label htmlFor="showExactPrice" className="text-sm">Show exact price on my profile</Label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your price helps us show accurate $$ cost meters to parents. If unchecked, we'll only show the cost level ($$) without the exact amount.
            </p>
          </div>
        </CardContent>
      </Card>

      {tips && tips.length > 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <Info className="h-4 w-4 text-orange-600 mr-2" />
              <span className="font-medium text-orange-900">Pro Tips</span>
            </div>
            <ul className="text-sm text-orange-700 space-y-1">
              {tips.map((tip, i) => <li key={i}>• {tip}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
