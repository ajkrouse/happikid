import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, MapPin, Star, Phone, Mail, Users, Plus } from "lucide-react";
import { Provider } from "@shared/schema";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface ProviderCardProps {
  provider: Provider;
  onViewDetails?: (provider: Provider) => void;
  onRequestInfo?: (provider: Provider) => void;
  onAddToComparison?: (provider: Provider) => void;
  onRemoveFromComparison?: (providerId: number) => void;
  isInComparison?: boolean;
}

export default function ProviderCard({ provider, onViewDetails, onRequestInfo, onAddToComparison, onRemoveFromComparison, isInComparison = false }: ProviderCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [groups, setGroups] = useState<{[key: string]: number[]}>({});

  // Load groups from localStorage
  useEffect(() => {
    const savedGroups = localStorage.getItem('favoriteGroups');
    if (savedGroups) {
      setGroups(JSON.parse(savedGroups));
    }
  }, []);

  // Check if provider is favorited
  const { data: favoriteData } = useQuery({
    queryKey: [`/api/favorites/${provider.id}/check`],
    enabled: isAuthenticated,
  });

  const isFavorite = favoriteData?.isFavorite || false;

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/favorites/${provider.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${provider.id}/check`] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Removed from favorites",
        description: `${provider.name} removed from your favorites.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove from favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add favorite mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/favorites/${provider.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${provider.id}/check`] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      setShowGroupDialog(false);
      setNewGroupName("");
      toast({
        title: "Added to favorites",
        description: `${provider.name} added to your favorites.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add to favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Save groups to localStorage
  const saveGroups = (newGroups: {[key: string]: number[]}) => {
    setGroups(newGroups);
    localStorage.setItem('favoriteGroups', JSON.stringify(newGroups));
  };

  // Function to get relative cost level based on provider type and characteristics
  const getCostLevel = (provider: Provider) => {
    // Assign relative cost based on typical pricing patterns
    let dollarSigns = 2; // Default to moderate cost
    
    if (provider.name.includes('Bright Horizons')) dollarSigns = 4; // Premium national chain
    else if (provider.name.includes('Learning Experience')) dollarSigns = 3; // Mid-premium franchise
    else if (provider.name.includes('Little Sunshine')) dollarSigns = 2; // Moderate local
    else if (provider.name.includes('Montessori')) dollarSigns = 3; // Typically higher due to specialized curriculum
    else if (provider.name.includes('Bronx Academy')) dollarSigns = 4; // Private school premium
    else if (provider.name.includes('Camp')) dollarSigns = 2; // Summer camps typically moderate
    
    return dollarSigns;
  };

  // Function to get cost range based on provider characteristics
  const getCostRange = (provider: Provider) => {
    // Generate realistic cost ranges based on provider type and characteristics
    const typeRanges = {
      daycare: { min: 1800, max: 3500 },
      afterschool: { min: 800, max: 1500 },
      camp: { min: 1200, max: 2000 },
      school: { min: 2500, max: 4500 }
    };
    
    const baseRange = typeRanges[provider.type as keyof typeof typeRanges] || typeRanges.daycare;
    const dollarSigns = getCostLevel(provider);
    
    // Adjust range based on cost level
    const multiplier = [0.7, 0.85, 1.0, 1.3, 1.6][dollarSigns - 1] || 1.0;
    const min = Math.round(baseRange.min * multiplier);
    const max = Math.round(baseRange.max * multiplier);
    
    return { min, max };
  };

  // Function to render cost display
  const renderCostDisplay = (provider: Provider) => {
    const dollarSigns = getCostLevel(provider);
    const costRange = getCostRange(provider);
    
    // Always show the $$ meter first
    const dollarMeter = (
      <div className="flex items-center gap-0.5 mb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span 
            key={i} 
            className={`text-sm font-semibold ${i <= dollarSigns ? 'text-primary' : 'text-gray-300'}`}
          >
            $
          </span>
        ))}
      </div>
    );
    
    // Show exact price if available and provider wants to show it (and it's not $0)
    const priceValue = Number(provider.monthlyPrice);
    if (provider.monthlyPrice && priceValue > 0 && provider.showExactPrice) {
      return (
        <div className="text-left">
          {dollarMeter}
          <div className="text-lg font-bold text-gray-900">${provider.monthlyPrice}/month</div>
        </div>
      );
    }
    
    // Otherwise show the estimated range
    return (
      <div className="text-left">
        {dollarMeter}
        <div className="text-sm text-gray-600">${costRange.min.toLocaleString()} - ${costRange.max.toLocaleString()}/month</div>
      </div>
    );
  };

  // Handle adding to existing group
  const handleAddToGroup = (groupName: string) => {
    const newGroups = {
      ...groups,
      [groupName]: [...(groups[groupName] || []), provider.id]
    };
    saveGroups(newGroups);
    addFavoriteMutation.mutate();
  };

  // Handle creating new group
  const handleCreateNewGroup = () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Invalid group name",
        description: "Please enter a group name.",
        variant: "destructive",
      });
      return;
    }

    const newGroups = {
      ...groups,
      [newGroupName.trim()]: [provider.id]
    };
    saveGroups(newGroups);
    addFavoriteMutation.mutate();
  };

  // Handle saving ungrouped
  const handleSaveUngrouped = () => {
    addFavoriteMutation.mutate();
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to save favorites.",
        action: (
          <Button 
            size="sm" 
            onClick={() => window.location.href = '/api/login'}
            className="ml-2"
          >
            Sign In
          </Button>
        ),
        duration: 5000,
      });
      return;
    }

    if (isFavorite) {
      removeFavoriteMutation.mutate();
    } else {
      setShowGroupDialog(true);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      daycare: "Daycare",
      afterschool: "After School",
      camp: "Camp",
      school: "Private School",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getBoroughColor = (borough: string) => {
    const colors = {
      Manhattan: "bg-blue-50 text-blue-700",
      Brooklyn: "bg-green-50 text-green-700",
      Queens: "bg-purple-50 text-purple-700",
      Bronx: "bg-orange-50 text-orange-700",
      "Staten Island": "bg-red-50 text-red-700",
    };
    return colors[borough as keyof typeof colors] || "bg-gray-50 text-gray-700";
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onViewDetails?.(provider)}>
      <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
        <img
          src={
            provider.name.includes('Bright Horizons') 
              ? "https://images.pexels.com/photos/8613311/pexels-photo-8613311.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" // Children in modern daycare
              : provider.name.includes('Learning Experience') 
              ? "https://images.pexels.com/photos/8613097/pexels-photo-8613097.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" // Children in classroom setting
              : provider.name.includes('Little Sunshine') 
              ? "https://images.pexels.com/photos/8613179/pexels-photo-8613179.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" // Happy children playing
              : provider.name.includes('Montessori') 
              ? "https://images.pexels.com/photos/8613106/pexels-photo-8613106.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" // Children with Montessori materials
              : provider.name.includes('Bronx Academy') 
              ? "https://images.pexels.com/photos/8613090/pexels-photo-8613090.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" // Children after school learning
              : provider.name.includes('Camp') 
              ? "https://images.pexels.com/photos/8613068/pexels-photo-8613068.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" // Children summer camp activities
              : "https://images.pexels.com/photos/8613311/pexels-photo-8613311.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" // Default children
          }
          alt={provider.name}
          className="w-full h-full object-cover"
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
          onClick={handleFavoriteToggle}
          disabled={removeFavoriteMutation.isPending || addFavoriteMutation.isPending}
        >
          <Heart 
            className={`h-4 w-4 ${isAuthenticated && isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
          />
        </Button>
      </div>
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-1">{provider.name}</h3>
            <p className="text-gray-600 flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-1" />
              {provider.borough}, {provider.city === provider.borough ? 'NYC' : provider.city}
            </p>
          </div>
        </div>

        {provider.rating && (
          <div className="flex items-center mb-3">
            <div className="flex items-center mr-2">
              {[...Array(5)].map((_, i) => {
                const rating = Number(provider.rating);
                const isFilled = i < Math.floor(rating);
                const isPartial = i === Math.floor(rating) && rating % 1 !== 0;
                
                return (
                  <div key={i} className="relative">
                    {/* Background star */}
                    <Star className="h-4 w-4 text-gray-400 fill-gray-400" />
                    {/* Filled star overlay */}
                    {(isFilled || isPartial) && (
                      <Star 
                        className="h-4 w-4 text-yellow-400 fill-yellow-400 absolute top-0 left-0"
                        style={isPartial ? {
                          clipPath: `inset(0 ${100 - (rating % 1) * 100}% 0 0)`
                        } : undefined}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <span className="text-sm text-gray-600">
              {provider.rating} ({provider.reviewCount} reviews)
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge 
            variant="secondary"
            className="cursor-pointer hover:bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              const ageInYears = Math.floor(provider.ageRangeMin / 12);
              
              let ageGroupValue;
              if (ageInYears < 1) {
                ageGroupValue = "infants";
              } else if (ageInYears < 3) {
                ageGroupValue = "toddlers";
              } else if (ageInYears < 5) {
                ageGroupValue = "preschool";
              } else {
                ageGroupValue = "school-age";
              }
              
              setLocation(`/search?ageRange=${ageGroupValue}`);
            }}
          >
            Ages {Math.floor(provider.ageRangeMin / 12)}+
          </Badge>
          <Badge 
            className={`${getBoroughColor(provider.borough)} cursor-pointer hover:opacity-80`}
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/search?type=${encodeURIComponent(provider.type)}`);
            }}
          >
            {getTypeLabel(provider.type)}
          </Badge>
          {provider.features?.slice(0, 2).map((feature) => (
            <Badge 
              key={feature} 
              variant="outline" 
              className="text-xs cursor-pointer hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/search?features=${encodeURIComponent(feature)}`);
              }}
            >
              {feature}
            </Badge>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <div>
            {renderCostDisplay(provider)}
          </div>
          <div className="flex space-x-2">
            {onAddToComparison && (
              <Button
                variant={isInComparison ? "outline" : "secondary"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isInComparison && onRemoveFromComparison) {
                    onRemoveFromComparison(provider.id);
                  } else if (!isInComparison) {
                    onAddToComparison(provider);
                  }
                }}
                className={isInComparison ? "hover:bg-red-50 hover:border-red-200 hover:text-red-700" : ""}
              >
                {isInComparison ? "In Comparison" : "Compare"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRequestInfo?.(provider);
              }}
            >
              Get Info
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(provider);
              }}
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Group Selection Dialog */}
    <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Favorites</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            How would you like to organize "{provider.name}" in your favorites?
          </p>
          
          {/* Existing Groups */}
          {Object.keys(groups).length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Add to existing group:</Label>
              {Object.entries(groups).map(([groupName, providerIds]) => (
                <Button
                  key={groupName}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleAddToGroup(groupName)}
                  disabled={addFavoriteMutation.isPending}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {groupName} ({providerIds.length} providers)
                </Button>
              ))}
            </div>
          )}

          {/* Create New Group */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Create new group:</Label>
            <div className="flex space-x-2">
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name..."
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateNewGroup();
                  }
                }}
              />
              <Button
                onClick={handleCreateNewGroup}
                disabled={!newGroupName.trim() || addFavoriteMutation.isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Save Ungrouped */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Or save without grouping:</Label>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSaveUngrouped}
              disabled={addFavoriteMutation.isPending}
            >
              <Heart className="h-4 w-4 mr-2" />
              Save to favorites (ungrouped)
            </Button>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowGroupDialog(false)}
              disabled={addFavoriteMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
