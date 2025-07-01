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

interface ProviderCardProps {
  provider: Provider;
  onViewDetails?: (provider: Provider) => void;
  onRequestInfo?: (provider: Provider) => void;
}

export default function ProviderCard({ provider, onViewDetails, onRequestInfo }: ProviderCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        title: "Sign in required",
        description: "Please sign in to save favorites.",
        variant: "destructive",
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
          src="https://images.unsplash.com/photo-1576085898323-218337e3e43c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
          alt={provider.name}
          className="w-full h-full object-cover"
        />
        {isAuthenticated && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            onClick={handleFavoriteToggle}
            disabled={toggleFavoriteMutation.isPending}
          >
            <Heart 
              className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
            />
          </Button>
        )}
      </div>
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-1">{provider.name}</h3>
            <p className="text-gray-600 flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-1" />
              {provider.borough}, {provider.city}
            </p>
          </div>
        </div>

        {provider.rating && (
          <div className="flex items-center mb-3">
            <div className="flex items-center mr-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(Number(provider.rating))
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {provider.rating} ({provider.reviewCount} reviews)
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary">
            Ages {provider.ageRangeMin}-{provider.ageRangeMax}
          </Badge>
          <Badge className={getBoroughColor(provider.borough)}>
            {getTypeLabel(provider.type)}
          </Badge>
          {provider.features?.slice(0, 2).map((feature) => (
            <Badge key={feature} variant="outline" className="text-xs">
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
