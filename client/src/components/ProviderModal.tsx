import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Users, 
  Star,
  Heart,
  ShieldCheck,
  Leaf,
  UserCheck,
  TreePine
} from "lucide-react";
import { Provider, Review, ProviderImage } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProviderContributions } from "./ProviderContributions";
import { ReviewVoting } from "./ReviewVoting";

interface ProviderModalProps {
  provider: Provider | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProviderModal({ provider, isOpen, onClose }: ProviderModalProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryData, setInquiryData] = useState({
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    childAge: "",
    message: "",
    inquiryType: "info" as "info" | "tour" | "enrollment",
  });

  // Function to convert 24-hour time to 12-hour AM/PM format
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Function to get relative cost level based on actual price range
  const getCostLevel = (provider: any, costRange: {min: number, max: number}) => {
    // Safety check for costRange
    if (!costRange || typeof costRange.min !== 'number' || typeof costRange.max !== 'number') {
      return 3; // Default to middle tier
    }
    
    // Calculate dollar meter based on midpoint of price range
    const midpoint = (costRange.min + costRange.max) / 2;
    
    // Thresholds based on typical NYC childcare pricing
    if (midpoint <= 1500) return 1;      // $
    else if (midpoint <= 2200) return 2; // $$
    else if (midpoint <= 2900) return 3; // $$$
    else if (midpoint <= 3600) return 4; // $$$$
    else return 5;                       // $$$$$
  };

  // Function to get cost range based on provider characteristics
  const getCostRange = (provider: any) => {
    // Generate realistic cost ranges based on provider type and characteristics
    const typeRanges = {
      daycare: { min: 1800, max: 3500 },
      afterschool: { min: 800, max: 1500 },
      camp: { min: 1200, max: 2000 },
      school: { min: 2500, max: 4500 }
    };
    
    const baseRange = typeRanges[provider.type as keyof typeof typeRanges] || typeRanges.daycare;
    
    // Use the actual monthly price if available, otherwise use base range
    if (provider.monthlyPrice) {
      const price = Number(provider.monthlyPrice);
      // Create a range around the single price point
      return { min: Math.round(price * 0.9), max: Math.round(price * 1.1) };
    }
    
    return baseRange;
  };

  // Function to render cost display
  const renderCostDisplay = (provider: any) => {
    // Safety check for provider
    if (!provider) {
      return <div className="text-center text-gray-500">Price information unavailable</div>;
    }
    
    // Use actual price range from database if available
    const hasDbPriceRange = provider.monthlyPriceMin && provider.monthlyPriceMax;
    let costRange;
    
    if (hasDbPriceRange) {
      costRange = { min: Number(provider.monthlyPriceMin), max: Number(provider.monthlyPriceMax) };
    } else {
      costRange = getCostRange(provider);
    }
    
    // Ensure costRange is properly defined with fallback
    if (!costRange || typeof costRange.min !== 'number' || typeof costRange.max !== 'number') {
      costRange = { min: 2000, max: 3000 }; // Default fallback
    }
    
    const dollarSigns = getCostLevel(provider, costRange);
    
    // Always show the $$ meter first
    const dollarMeter = (
      <div className="flex items-center justify-center gap-0.5 mb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <span 
            key={i} 
            className={`text-lg font-semibold ${i <= dollarSigns ? 'text-primary' : 'text-gray-300'}`}
          >
            $
          </span>
        ))}
      </div>
    );
    
    // Always show the full price range, never single price
    return (
      <div className="text-center">
        {dollarMeter}
        <div className="text-lg font-semibold text-gray-900">${costRange.min.toLocaleString()} - ${costRange.max.toLocaleString()}</div>
        <div className="text-gray-600">per month</div>
      </div>
    );
  };

  // Fetch detailed provider data
  const { data: providerDetails, isLoading } = useQuery({
    queryKey: [`/api/providers/${provider?.id}`],
    enabled: !!provider?.id && isOpen,
  });

  // Check if favorited
  const { data: favoriteData } = useQuery({
    queryKey: [`/api/favorites/${provider?.id}/check`],
    enabled: !!provider?.id && isAuthenticated && isOpen,
  });

  const typedProviderDetails = providerDetails as (Provider & { reviews?: Review[]; images?: ProviderImage[] }) | undefined;
  const isFavorite = (favoriteData as { isFavorite?: boolean })?.isFavorite || false;

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!provider) return;
      if (isFavorite) {
        await apiRequest("DELETE", `/api/favorites/${provider.id}`);
      } else {
        await apiRequest("POST", `/api/favorites/${provider.id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${provider?.id}/check`] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: isFavorite ? "Removed from favorites" : "Added to favorites",
        description: isFavorite 
          ? `${provider?.name} removed from your favorites.`
          : `${provider?.name} added to your favorites.`,
      });
    },
  });

  const { signIn } = useAuth();

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required", 
        description: "Please sign in to save favorites.",
        action: (
          <Button 
            size="sm" 
            onClick={() => signIn()}
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

  // Submit inquiry mutation
  const submitInquiryMutation = useMutation({
    mutationFn: async () => {
      if (!provider) return;
      await apiRequest("POST", "/api/inquiries", {
        ...inquiryData,
        providerId: provider.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Inquiry sent!",
        description: "Your inquiry has been sent to the provider. They will contact you soon.",
      });
      setShowInquiryForm(false);
      setInquiryData({
        parentName: "",
        parentEmail: "",
        parentPhone: "",
        childAge: "",
        message: "",
        inquiryType: "info",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send inquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to send inquiries.",
        variant: "destructive",
      });
      return;
    }
    submitInquiryMutation.mutate();
  };

  const getFeatureIcon = (feature: string) => {
    const icons: Record<string, any> = {
      "Organic Meals": Leaf,
      "Bilingual Program": UserCheck,
      "Extended Hours": Clock,
      "Outdoor Playground": TreePine,
      "Transportation": Users,
      "Music Program": Star,
      "Art Classes": Star,
      "Swimming Pool": Star,
    };
    return icons[feature] || Star;
  };

  if (!provider) return null;

  const currentProvider = typedProviderDetails || provider;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{currentProvider.name}</DialogTitle>
            <div className="mr-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFavoriteToggle}
                disabled={toggleFavoriteMutation.isPending}
                className="hover:bg-red-50"
              >
                <Heart 
                  className={`h-5 w-5 ${isAuthenticated && isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
                />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Provider Images */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <img
                src={
                  currentProvider.name.includes('Bright Horizons') 
                    ? "https://images.pexels.com/photos/8613311/pexels-photo-8613311.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Children in modern daycare
                    : currentProvider.name.includes('Learning Experience') 
                    ? "https://images.pexels.com/photos/8613097/pexels-photo-8613097.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Children in classroom setting
                    : currentProvider.name.includes('Little Sunshine') 
                    ? "https://images.pexels.com/photos/8613179/pexels-photo-8613179.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Happy children playing
                    : currentProvider.name.includes('Montessori') 
                    ? "https://images.pexels.com/photos/8613106/pexels-photo-8613106.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Children with Montessori materials
                    : currentProvider.name.includes('Bronx Academy') 
                    ? "https://images.pexels.com/photos/8613090/pexels-photo-8613090.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Children after school learning
                    : currentProvider.name.includes('Camp') 
                    ? "https://images.pexels.com/photos/8613068/pexels-photo-8613068.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Children summer camp activities
                    : "https://images.pexels.com/photos/8613311/pexels-photo-8613311.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Default children
                }
                alt={currentProvider.name}
                className="rounded-lg object-cover h-48 w-full"
              />
              <img
                src={
                  currentProvider.name.includes('Bright Horizons') 
                    ? "https://images.pexels.com/photos/8613179/pexels-photo-8613179.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Children playing together
                    : currentProvider.name.includes('Learning Experience') 
                    ? "https://images.pexels.com/photos/8613106/pexels-photo-8613106.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Children with learning materials
                    : currentProvider.name.includes('Little Sunshine') 
                    ? "https://images.pexels.com/photos/8613090/pexels-photo-8613090.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Children in learning environment
                    : currentProvider.name.includes('Montessori') 
                    ? "https://images.pexels.com/photos/8613179/pexels-photo-8613179.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Children collaborative learning
                    : currentProvider.name.includes('Bronx Academy') 
                    ? "https://images.pexels.com/photos/8613106/pexels-photo-8613106.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Educational activities
                    : currentProvider.name.includes('Camp') 
                    ? "https://images.pexels.com/photos/8613090/pexels-photo-8613090.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Camp activities
                    : "https://images.pexels.com/photos/8613179/pexels-photo-8613179.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Default
                }
                alt="Activity Area"
                className="rounded-lg object-cover h-48 w-full"
              />
              <img
                src={
                  currentProvider.name.includes('Bright Horizons') 
                    ? "https://images.pexels.com/photos/8613068/pexels-photo-8613068.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Children creative activities
                    : currentProvider.name.includes('Learning Experience') 
                    ? "https://images.pexels.com/photos/8613068/pexels-photo-8613068.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Children outdoor learning
                    : currentProvider.name.includes('Little Sunshine') 
                    ? "https://images.pexels.com/photos/8613068/pexels-photo-8613068.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Children playing outdoors
                    : currentProvider.name.includes('Montessori') 
                    ? "https://images.pexels.com/photos/8613068/pexels-photo-8613068.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Children nature-based learning
                    : currentProvider.name.includes('Bronx Academy') 
                    ? "https://images.pexels.com/photos/8613068/pexels-photo-8613068.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Children group activities
                    : currentProvider.name.includes('Camp') 
                    ? "https://images.pexels.com/photos/8613311/pexels-photo-8613311.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Children camp fun
                    : "https://images.pexels.com/photos/8613068/pexels-photo-8613068.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop" // Default
                }
                alt="Learning Space"
                className="rounded-lg object-cover h-48 w-full"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* About */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">About Our Program</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {currentProvider.description || 
                      `${currentProvider.name} provides quality childcare services for children ages ${currentProvider.ageRangeMin}-${currentProvider.ageRangeMax}. Our experienced staff creates a nurturing environment where children can learn, play, and grow.`
                    }
                  </p>
                </div>

                {/* Features */}
                {currentProvider.features && currentProvider.features.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">What Makes Us Special</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {currentProvider.features.slice(0, 6).map((feature) => {
                        const IconComponent = getFeatureIcon(feature);
                        return (
                          <div key={feature} className="flex items-center p-4 bg-primary-50 rounded-lg">
                            <IconComponent className="h-5 w-5 text-primary mr-3" />
                            <div>
                              <div className="font-medium text-gray-900">{feature}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {typedProviderDetails?.reviews && typedProviderDetails.reviews.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">What Parents Say</h3>
                    <div className="space-y-4">
                      {typedProviderDetails.reviews.slice(0, 3).map((review: Review) => (
                        <Card key={review.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center mb-2">
                              <div className="flex mr-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-medium text-gray-900">
                                {review.title}
                              </span>
                            </div>
                            <p className="text-gray-600">{review.content}</p>
                            <ReviewVoting reviewId={review.id} />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* User Contributions */}
                <ProviderContributions providerId={currentProvider.id} provider={currentProvider} />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Info */}
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      {renderCostDisplay(currentProvider)}
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ages</span>
                        <span className="font-medium">
                          {Math.floor(currentProvider.ageRangeMin / 12) === 0 
                            ? `${currentProvider.ageRangeMin} mo` 
                            : `${Math.floor(currentProvider.ageRangeMin / 12)} yr`} - {Math.floor(currentProvider.ageRangeMax / 12)} yr
                        </span>
                      </div>
                      {currentProvider.hoursOpen && currentProvider.hoursClose && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hours</span>
                          <span className="font-medium">
                            {formatTime(currentProvider.hoursOpen)} - {formatTime(currentProvider.hoursClose)}
                          </span>
                        </div>
                      )}
                      {currentProvider.capacity && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Capacity</span>
                          <span className="font-medium">{currentProvider.capacity} children</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">License</span>
                        <span className="font-medium text-green-600 flex items-center">
                          <ShieldCheck className="h-4 w-4 mr-1" />
                          {currentProvider.isVerified ? "Verified" : "Pending"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button 
                        className="w-full" 
                        onClick={() => setShowInquiryForm(true)}
                        disabled={!isAuthenticated}
                      >
                        Request Information
                      </Button>
                      
                      {isAuthenticated && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => toggleFavoriteMutation.mutate()}
                          disabled={toggleFavoriteMutation.isPending}
                        >
                          <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                          {isFavorite ? "Remove from Favorites" : "Save to Favorites"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Info */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-3" />
                        <span>{currentProvider.address}</span>
                      </div>
                      {currentProvider.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-4 w-4 mr-3" />
                          <span>{currentProvider.phone}</span>
                        </div>
                      )}
                      {currentProvider.email && (
                        <div className="flex items-center text-gray-600">
                          <Mail className="h-4 w-4 mr-3" />
                          <span>{currentProvider.email}</span>
                        </div>
                      )}
                      {currentProvider.website && (
                        <div className="flex items-center text-gray-600">
                          <Globe className="h-4 w-4 mr-3" />
                          <span>{currentProvider.website}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Inquiry Form Modal */}
            {showInquiryForm && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Send Inquiry</h3>
                  <form onSubmit={handleInquirySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="parentName">Your Name *</Label>
                        <Input
                          id="parentName"
                          value={inquiryData.parentName}
                          onChange={(e) => setInquiryData({ ...inquiryData, parentName: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="parentEmail">Email *</Label>
                        <Input
                          id="parentEmail"
                          type="email"
                          value={inquiryData.parentEmail}
                          onChange={(e) => setInquiryData({ ...inquiryData, parentEmail: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="parentPhone">Phone</Label>
                        <Input
                          id="parentPhone"
                          value={inquiryData.parentPhone}
                          onChange={(e) => setInquiryData({ ...inquiryData, parentPhone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="childAge">Child's Age</Label>
                        <Input
                          id="childAge"
                          value={inquiryData.childAge}
                          onChange={(e) => setInquiryData({ ...inquiryData, childAge: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="inquiryType">Inquiry Type</Label>
                      <Select
                        value={inquiryData.inquiryType}
                        onValueChange={(value: "info" | "tour" | "enrollment") =>
                          setInquiryData({ ...inquiryData, inquiryType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">General Information</SelectItem>
                          <SelectItem value="tour">Schedule a Tour</SelectItem>
                          <SelectItem value="enrollment">Enrollment Inquiry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={inquiryData.message}
                        onChange={(e) => setInquiryData({ ...inquiryData, message: e.target.value })}
                        rows={4}
                        placeholder="Tell us about your needs and any specific questions you have..."
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowInquiryForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitInquiryMutation.isPending}
                      >
                        {submitInquiryMutation.isPending ? "Sending..." : "Send Inquiry"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
