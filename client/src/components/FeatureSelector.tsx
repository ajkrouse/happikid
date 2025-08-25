import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChipInput } from "@/components/ChipInput";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Feature {
  id: string;
  label: string;
  group: string;
  types: string[];
  followups?: Array<{
    field: string;
    type: string;
    label: string;
  }>;
}

interface FeatureSelectorProps {
  providerType: string;
  selectedFeatures: string[];
  followupData: Record<string, any>;
  onChange: (features: string[], followupData: Record<string, any>) => void;
  className?: string;
}

export function FeatureSelector({
  providerType,
  selectedFeatures = [],
  followupData = {},
  onChange,
  className
}: FeatureSelectorProps) {
  const [localFollowupData, setLocalFollowupData] = useState(followupData);

  // Fetch features from registry
  const { data: allFeatures = [], isLoading } = useQuery<Feature[]>({
    queryKey: ["/api/meta/features"],
  });

  // Filter features by provider type
  const availableFeatures = allFeatures.filter(feature => 
    feature.types.includes(providerType)
  );

  // Group features by category
  const featureGroups = availableFeatures.reduce((groups, feature) => {
    if (!groups[feature.group]) {
      groups[feature.group] = [];
    }
    groups[feature.group].push(feature);
    return groups;
  }, {} as Record<string, Feature[]>);

  const handleFeatureToggle = (featureId: string, checked: boolean) => {
    let newSelectedFeatures: string[];
    let newFollowupData = { ...localFollowupData };

    if (checked) {
      newSelectedFeatures = [...selectedFeatures, featureId];
      
      // Check if this feature has followups
      const feature = allFeatures.find(f => f.id === featureId);
      if (feature?.followups) {
        feature.followups.forEach(followup => {
          if (!newFollowupData[followup.field]) {
            newFollowupData[followup.field] = followup.type === 'chips' ? [] : '';
          }
        });
      }
    } else {
      newSelectedFeatures = selectedFeatures.filter(id => id !== featureId);
      
      // Remove followup data for this feature
      const feature = allFeatures.find(f => f.id === featureId);
      if (feature?.followups) {
        feature.followups.forEach(followup => {
          delete newFollowupData[followup.field];
        });
      }
    }

    setLocalFollowupData(newFollowupData);
    onChange(newSelectedFeatures, newFollowupData);
  };

  const handleFollowupChange = (field: string, value: any) => {
    const newFollowupData = { ...localFollowupData, [field]: value };
    setLocalFollowupData(newFollowupData);
    onChange(selectedFeatures, newFollowupData);
  };

  const getFollowupsForSelectedFeatures = () => {
    const followups: Array<{ field: string; type: string; label: string; required: boolean }> = [];
    
    selectedFeatures.forEach(featureId => {
      const feature = allFeatures.find(f => f.id === featureId);
      if (feature?.followups) {
        feature.followups.forEach(followup => {
          if (!followups.find(f => f.field === followup.field)) {
            followups.push({
              ...followup,
              required: true // Followups are required when their parent feature is selected
            });
          }
        });
      }
    });
    
    return followups;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span>Loading features...</span>
      </div>
    );
  }

  if (!providerType) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Please select a provider type first to see relevant features</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Label className="text-base font-medium">Features & Amenities</Label>
      <p className="text-sm text-gray-600 mb-4">
        Select features that apply to your {providerType} services
      </p>

      {Object.keys(featureGroups).length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <p>No features available for {providerType}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(featureGroups).map(([groupName, features]) => (
            <div key={groupName} className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
                {groupName.charAt(0).toUpperCase() + groupName.slice(1)}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {features.map((feature) => (
                  <div key={feature.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`feature-${feature.id}`}
                      checked={selectedFeatures.includes(feature.id)}
                      onCheckedChange={(checked) => 
                        handleFeatureToggle(feature.id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`feature-${feature.id}`} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {feature.label}
                    </Label>
                    {feature.followups && selectedFeatures.includes(feature.id) && (
                      <Badge variant="outline" className="text-xs ml-auto">
                        Details required
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Render followup fields */}
          {getFollowupsForSelectedFeatures().length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg space-y-4">
              <h4 className="font-medium text-blue-900">Additional Details</h4>
              {getFollowupsForSelectedFeatures().map((followup) => (
                <div key={followup.field}>
                  {followup.type === 'chips' ? (
                    <ChipInput
                      label={followup.label}
                      value={localFollowupData[followup.field] || []}
                      onChange={(value) => handleFollowupChange(followup.field, value)}
                      placeholder="Add items..."
                      required={followup.required}
                      maxItems={10}
                    />
                  ) : (
                    <div>
                      <Label htmlFor={followup.field}>
                        {followup.label} {followup.required && "*"}
                      </Label>
                      <input
                        id={followup.field}
                        type="text"
                        value={localFollowupData[followup.field] || ''}
                        onChange={(e) => handleFollowupChange(followup.field, e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        placeholder={`Enter ${followup.label.toLowerCase()}`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Selected features summary */}
          {selectedFeatures.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 mb-2">
                <span className="font-medium">{selectedFeatures.length} features selected</span>
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedFeatures.map(featureId => {
                  const feature = allFeatures.find(f => f.id === featureId);
                  return feature ? (
                    <Badge key={featureId} variant="secondary" className="text-xs">
                      {feature.label}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}