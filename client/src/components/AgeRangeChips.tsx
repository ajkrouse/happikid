import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface AgeRangeChipsProps {
  minAgeMonths?: number;
  maxAgeMonths?: number;
  onChange: (min: number, max: number) => void;
  className?: string;
}

const AGE_PRESETS = [
  { id: 'infant', label: 'Infant (0–18m)', min: 0, max: 18 },
  { id: 'toddler', label: 'Toddler (18–36m)', min: 18, max: 36 },
  { id: 'pre_k', label: 'Pre-K (3–5y)', min: 36, max: 60 },
  { id: 'elementary', label: 'Elementary (5–11y)', min: 60, max: 132 },
  { id: 'middle', label: 'Middle (11–14y)', min: 132, max: 168 },
  { id: 'high', label: 'High (14–18y)', min: 168, max: 216 }
];

export function AgeRangeChips({ minAgeMonths = 0, maxAgeMonths = 0, onChange, className }: AgeRangeChipsProps) {
  const [customMin, setCustomMin] = useState(minAgeMonths?.toString() || "");
  const [customMax, setCustomMax] = useState(maxAgeMonths?.toString() || "");

  const isPresetSelected = (preset: typeof AGE_PRESETS[0]) => {
    return minAgeMonths === preset.min && maxAgeMonths === preset.max;
  };

  const handlePresetClick = (preset: typeof AGE_PRESETS[0]) => {
    onChange(preset.min, preset.max);
    setCustomMin(preset.min.toString());
    setCustomMax(preset.max.toString());
  };

  const handleCustomChange = () => {
    const min = parseInt(customMin) || 0;
    const max = parseInt(customMax) || 0;
    if (min <= max) {
      onChange(min, max);
    }
  };

  const formatAge = (months: number) => {
    if (months < 12) return `${months}m`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years}y`;
    return `${years}y ${remainingMonths}m`;
  };

  return (
    <div className={className}>
      <Label className="text-base font-medium">Age Range</Label>
      <p className="text-sm text-gray-600 mb-3">Select preset age ranges or enter custom values</p>
      
      <div className="space-y-4">
        {/* Preset chips */}
        <div className="flex flex-wrap gap-2">
          {AGE_PRESETS.map((preset) => (
            <Badge
              key={preset.id}
              variant={isPresetSelected(preset) ? "default" : "outline"}
              className="cursor-pointer hover:bg-blue-50 hover:border-blue-300"
              onClick={() => handlePresetClick(preset)}
            >
              {preset.label}
            </Badge>
          ))}
        </div>

        {/* Custom inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="min-age">Min Age (months) *</Label>
            <Input
              id="min-age"
              type="number"
              value={customMin}
              onChange={(e) => {
                setCustomMin(e.target.value);
                handleCustomChange();
              }}
              onBlur={handleCustomChange}
              placeholder="0"
              min="0"
              max="216"
            />
            {customMin && (
              <p className="text-sm text-gray-500 mt-1">
                {formatAge(parseInt(customMin))}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="max-age">Max Age (months) *</Label>
            <Input
              id="max-age"
              type="number"
              value={customMax}
              onChange={(e) => {
                setCustomMax(e.target.value);
                handleCustomChange();
              }}
              onBlur={handleCustomChange}
              placeholder="60"
              min="0"
              max="216"
            />
            {customMax && (
              <p className="text-sm text-gray-500 mt-1">
                {formatAge(parseInt(customMax))}
              </p>
            )}
          </div>
        </div>

        {minAgeMonths && maxAgeMonths && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Selected range:</span> {formatAge(minAgeMonths)} to {formatAge(maxAgeMonths)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}