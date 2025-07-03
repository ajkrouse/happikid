import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Star, Phone, Mail } from "lucide-react";
import { Provider } from "@shared/schema";
import { useState } from "react";
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
  isInComparison?: boolean;
}

export default function ProviderCard({ provider, onViewDetails, onRequestInfo, onAddToComparison, isInComparison = false }: ProviderCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Check if provider is favorited
  const { data: favoriteData } = useQuery({
    queryKey: [`/api/favorites/${provider.id}/check`],
    enabled: isAuthenticated,
  });

  const isFavorite = favoriteData?.isFavorite || false;

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await apiRequest("DELETE", `/api/favorites/${provider.id}`);
      } else {
        await apiRequest("POST", `/api/favorites/${provider.id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${provider.id}/check`] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: isFavorite ? "Removed from favorites" : "Added to favorites",
        description: isFavorite 
          ? `${provider.name} removed from your favorites.`
          : `${provider.name} added to your favorites.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

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
    toggleFavoriteMutation.mutate();
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
          disabled={toggleFavoriteMutation.isPending}
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
            {provider.monthlyPrice && (
              <>
                <span className="text-2xl font-bold text-gray-900">
                  ${provider.monthlyPrice}
                </span>
                <span className="text-gray-600">/month</span>
              </>
            )}
          </div>
          <div className="flex space-x-2">
            {onAddToComparison && (
              <Button
                variant={isInComparison ? "outline" : "secondary"}
                size="sm"
                disabled={isInComparison}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isInComparison) {
                    onAddToComparison(provider);
                  }
                }}
                className={isInComparison ? "opacity-50 cursor-not-allowed" : ""}
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
  );
}
