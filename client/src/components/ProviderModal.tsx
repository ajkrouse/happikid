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
  TreePine,
  CalendarX,
  CalendarCheck,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ProviderContributions } from "./ProviderContributions";
import { ReviewVoting } from "./ReviewVoting";
import { getCostRange, getCostLevel, getBoroughColor, hasPublicPricingData } from "@/lib/providerPricing";
import { ClosedDatesCalendar, type ClosedDateEntry } from "./ClosedDatesCalendar";
import { ProviderImageGallery } from "./ProviderImageGallery";

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
  const [showTourForm, setShowTourForm] = useState(false);
  const [tourData, setTourData] = useState({
    preferredDates: ["", "", ""],
    preferredTime: "flexible" as "morning" | "afternoon" | "flexible",
    note: "",
  });
  const [inquiryData, setInquiryData] = useState({
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    childAge: "",
    message: "",
    inquiryType: "info" as "info" | "tour" | "enrollment",
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    title: "",
    content: "",
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

  // Function to render cost display
  const renderCostDisplay = (provider: any) => {
    // Safety check for provider
    if (!provider) {
      return <div className="text-center text-gray-500">Price information unavailable</div>;
    }

    const costRange = getCostRange(provider);
    const dollarSigns = getCostLevel(costRange);
    const hasPublicPrice = hasPublicPricingData(provider);
    const showAmounts = hasPublicPrice;
    
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
    
    return (
      <div className="text-center">
        {dollarMeter}
        {showAmounts && (
          <>
            <div className="text-lg font-semibold text-brand-evergreen">${costRange.min.toLocaleString()} - ${costRange.max.toLocaleString()}</div>
            <div className="text-gray-600">per month</div>
          </>
        )}
        <div className={`text-xs mt-1 font-medium ${hasPublicPrice ? 'text-green-600' : 'text-gray-400'}`}>
          {hasPublicPrice ? '✓ Verified pricing' : provider.showExactPrice === false ? 'Tuition not disclosed' : 'Estimated range'}
        </div>
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

  // Submit tour request mutation
  const submitTourRequestMutation = useMutation({
    mutationFn: async () => {
      if (!provider) return;
      const dates = tourData.preferredDates.filter((d) => d.trim() !== "");
      await apiRequest("POST", `/api/providers/${provider.id}/tour-requests`, {
        preferredDates: dates,
        preferredTime: tourData.preferredTime,
        note: tourData.note.trim() || null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Tour request sent!",
        description: "The provider will review your preferred dates and follow up shortly.",
      });
      setShowTourForm(false);
      setTourData({ preferredDates: ["", "", ""], preferredTime: "flexible", note: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send tour request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTourSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validDates = tourData.preferredDates.filter((d) => d.trim() !== "");
    if (validDates.length === 0) {
      toast({
        title: "At least one date required",
        description: "Please enter at least one preferred tour date.",
        variant: "destructive",
      });
      return;
    }
    submitTourRequestMutation.mutate();
  };

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
    
    // Basic validation for required fields
    if (!inquiryData.parentName.trim() || !inquiryData.parentEmail.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in your name and email address.",
        variant: "destructive",
      });
      return;
    }
    
    if (!inquiryData.message.trim()) {
      toast({
        title: "Missing message",
        description: "Please write a message to the provider.",
        variant: "destructive",
      });
      return;
    }
    
    submitInquiryMutation.mutate();
  };

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!provider) return null;
      const response = await apiRequest("POST", `/api/providers/${provider.id}/reviews`, {
        rating: reviewData.rating,
        title: reviewData.title.trim() || null,
        content: reviewData.content.trim(),
      });
      return response.json() as Promise<Review>;
    },
    onSuccess: (newReview) => {
      if (!provider || !newReview) return;

      // Keep the open profile responsive while the server returns the
      // authoritative provider aggregate. The invalidation below then
      // reconciles this optimistic list and rating with the database.
      const providerQueryKey = [`/api/providers/${provider.id}`];
      const cachedProvider = queryClient.getQueryData?.<Provider & {
        reviews?: Review[];
      }>(providerQueryKey);
      if (cachedProvider) {
        const existingReviews = Array.isArray(cachedProvider.reviews)
          ? cachedProvider.reviews
          : [];
        const previousCount = cachedProvider.reviewCount || existingReviews.length;
        const previousRating = Number(cachedProvider.rating) || 0;
        const nextCount = previousCount + 1;
        const nextRating = ((previousRating * previousCount) + newReview.rating) / nextCount;
        queryClient.setQueryData?.(providerQueryKey, {
          ...cachedProvider,
          rating: nextRating.toFixed(2),
          reviewCount: nextCount,
          reviews: [newReview, ...existingReviews],
        });
      }
      queryClient.invalidateQueries({ queryKey: providerQueryKey });
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      setShowReviewForm(false);
      setReviewData({ rating: 0, title: "", content: "" });
      toast({
        title: "Review submitted!",
        description: "Thank you for sharing your experience with this provider.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "";
      const isDuplicate =
        errorMessage.includes("409") ||
        /already reviewed/i.test(errorMessage);
      toast({
        title: isDuplicate ? "Review already submitted" : "Unable to submit review",
        description: isDuplicate
          ? "You can only submit one review for each provider."
          : "We couldn't submit your review. Please check your details and try again.",
        variant: "destructive",
      });
    },
  });

  const handleReviewClick = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to share a review.",
        action: (
          <Button size="sm" onClick={() => signIn()} className="ml-2">
            Sign In
          </Button>
        ),
        duration: 5000,
      });
      return;
    }
    if (user?.role !== "parent") {
      toast({
        title: "Parent account required",
        description: "Only parent accounts can submit provider reviews.",
        variant: "destructive",
      });
      return;
    }
    setShowReviewForm((isShowing) => !isShowing);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewData.rating) {
      toast({
        title: "Rating required",
        description: "Please choose a rating from one to five stars.",
        variant: "destructive",
      });
      return;
    }
    if (!reviewData.content.trim()) {
      toast({
        title: "Review text required",
        description: "Please share a few words about your experience.",
        variant: "destructive",
      });
      return;
    }
    submitReviewMutation.mutate();
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
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{currentProvider.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={`rounded-full font-medium text-xs ${getBoroughColor(currentProvider.borough, currentProvider.city)}`}
                >
                  {currentProvider.city === 'Hoboken' || currentProvider.city === 'Jersey City'
                    ? currentProvider.city
                    : currentProvider.borough}
                </Badge>
                {(currentProvider as any).enrollmentStatus === "accepting" && (
                  <Badge className="rounded-full text-xs font-medium bg-green-100 text-green-700 border-green-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 inline-block" />
                    Open
                  </Badge>
                )}
                {(currentProvider as any).enrollmentStatus === "waitlist" && (
                  <Badge className="rounded-full text-xs font-medium bg-amber-100 text-amber-700 border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 inline-block" />
                    Waitlist
                  </Badge>
                )}
                {(currentProvider as any).enrollmentStatus === "full" && (
                  <Badge className="rounded-full text-xs font-medium bg-red-100 text-red-700 border-red-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1 inline-block" />
                    Full
                  </Badge>
                )}
                <span className="text-sm text-gray-500 flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  {currentProvider.address}
                </span>
              </div>
            </div>
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
            <ProviderImageGallery
              providerName={currentProvider.name}
              images={(currentProvider as Provider & { images?: ProviderImage[] }).images}
            />

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
                              <div className="font-medium text-brand-evergreen">{feature}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                <div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">What Parents Say</h3>
                      {(!typedProviderDetails?.reviews || typedProviderDetails.reviews.length === 0) && (
                        <p className="text-sm text-gray-600 mt-1">Be the first parent to share your experience.</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleReviewClick}
                      data-testid="button-write-review"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      {showReviewForm ? "Hide Review Form" : "Write a Review"}
                    </Button>
                  </div>

                  {showReviewForm && isAuthenticated && user?.role === "parent" && (
                    <Card className="mb-4 border-primary/30">
                      <CardContent className="p-4">
                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                          <div>
                            <Label>Rating *</Label>
                            <RadioGroup
                              value={reviewData.rating ? String(reviewData.rating) : ""}
                              onValueChange={(value) => setReviewData((previous) => ({
                                ...previous,
                                rating: Number(value),
                              }))}
                              className="flex items-center gap-1 mt-2"
                              aria-label="Rating"
                            >
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <div key={rating}>
                                  <RadioGroupItem
                                    id={`review-rating-${rating}`}
                                    value={String(rating)}
                                  aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
                                    className="peer sr-only"
                                  />
                                  <Label
                                    htmlFor={`review-rating-${rating}`}
                                    className="block cursor-pointer rounded-sm p-1 peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
                                  >
                                  <Star
                                    className={`h-7 w-7 ${
                                      rating <= reviewData.rating
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-300"
                                    }`}
                                  />
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>

                          <div>
                            <Label htmlFor="review-title">Review title (optional)</Label>
                            <Input
                              id="review-title"
                              value={reviewData.title}
                              onChange={(e) => setReviewData((previous) => ({ ...previous, title: e.target.value }))}
                              placeholder="What stood out?"
                            />
                          </div>

                          <div>
                            <Label htmlFor="review-content">Your review *</Label>
                            <Textarea
                              id="review-content"
                              value={reviewData.content}
                              onChange={(e) => setReviewData((previous) => ({ ...previous, content: e.target.value }))}
                              rows={4}
                              placeholder="Tell other parents about your experience..."
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowReviewForm(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={submitReviewMutation.isPending}
                            >
                              {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {typedProviderDetails?.reviews && typedProviderDetails.reviews.length > 0 && (
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
                              <span className="font-medium text-brand-evergreen">
                                {review.title}
                              </span>
                            </div>
                            <p className="text-gray-600">{review.content}</p>
                            <ReviewVoting reviewId={review.id} />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

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
                      {/* Prefer the detailed weekly schedule; fall back to legacy open/close times */}
                      {(() => {
                        const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const;
                        const sched = currentProvider.schedule as Record<string, { isOpen?: boolean; open?: string; close?: string }> | null | undefined;
                        const openDays = sched ? DAYS.filter((d) => sched[d]?.isOpen) : [];
                        if (openDays.length > 0) {
                          return (
                            <div>
                              <span className="text-gray-600 block mb-1">Hours</span>
                              <div className="space-y-0.5">
                                {openDays.map((day) => (
                                  <div key={day} className="flex justify-between text-sm">
                                    <span className="capitalize text-gray-500">{day}</span>
                                    <span className="font-medium">
                                      {formatTime(sched![day].open || "")} – {formatTime(sched![day].close || "")}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        if (currentProvider.hoursOpen && currentProvider.hoursClose) {
                          return (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Hours</span>
                              <span className="font-medium">
                                {formatTime(currentProvider.hoursOpen)} - {formatTime(currentProvider.hoursClose)}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {currentProvider.closureNote && (
                        <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                          <span className="shrink-0">⚠️</span>
                          <span>{currentProvider.closureNote}</span>
                        </div>
                      )}
                      {/* Structured closed-dates calendar */}
                      {(() => {
                        const rawDates = (currentProvider as any).closedDates as ClosedDateEntry[] | null | undefined;
                        const today = new Date().toISOString().slice(0, 10);
                        const upcoming = (rawDates ?? [])
                          .filter((e) => e.to >= today)
                          .sort((a, b) => a.from.localeCompare(b.from));
                        if (upcoming.length === 0) return null;
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              <CalendarX className="h-3.5 w-3.5" />
                              Closure Calendar
                            </div>
                            <div className="rounded-md border border-red-100 bg-red-50/40 p-3">
                              <ClosedDatesCalendar closedDates={upcoming} />
                            </div>
                          </div>
                        );
                      })()}
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
                        onClick={() => {
                          if (!isAuthenticated) {
                            toast({
                              title: "Sign In Required",
                              description: "Please sign in to request a tour.",
                              action: (
                                <Button size="sm" onClick={() => signIn()} className="ml-2">Sign In</Button>
                              ),
                              duration: 5000,
                            });
                            return;
                          }
                          setShowTourForm(true);
                          setTimeout(() => {
                            const dialogContent = document.querySelector('[role="dialog"] [data-radix-scroll-area-viewport]') ||
                                                 document.querySelector('[role="dialog"]');
                            if (dialogContent) {
                              dialogContent.scrollTo({ top: dialogContent.scrollHeight, behavior: 'smooth' });
                            }
                          }, 100);
                        }}
                        data-testid="button-request-tour"
                      >
                        <CalendarCheck className="h-4 w-4 mr-2" />
                        {showTourForm ? "Scroll Down to See Form" : "Request a Tour"}
                      </Button>

                      <Button 
                        variant="outline"
                        className="w-full" 
                        onClick={() => {
                          setShowInquiryForm(true);
                          setTimeout(() => {
                            const dialogContent = document.querySelector('[role="dialog"] [data-radix-scroll-area-viewport]') || 
                                                 document.querySelector('[role="dialog"]');
                            if (dialogContent) {
                              dialogContent.scrollTo({ top: dialogContent.scrollHeight, behavior: 'smooth' });
                            }
                          }, 100);
                        }}
                        data-testid="button-request-info"
                      >
                        {showInquiryForm ? "Scroll Down to See Form" : "Request Information"}
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
                    <h4 className="font-semibold text-brand-evergreen mb-3">Contact Information</h4>
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

            {/* Tour Request Form */}
            {showTourForm && (
              <Card className="mt-6 border-2 border-green-200 bg-green-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                      <CalendarCheck className="h-5 w-5" />
                      Request a Tour — {currentProvider?.name}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTourForm(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕ Close
                    </Button>
                  </div>
                  <form onSubmit={handleTourSubmit} className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Preferred Dates <span className="text-gray-400 font-normal">(enter up to 3)</span>
                      </Label>
                      <div className="space-y-2">
                        {tourData.preferredDates.map((date, i) => (
                          <Input
                            key={i}
                            type="date"
                            value={date}
                            onChange={(e) => {
                              const newDates = [...tourData.preferredDates];
                              newDates[i] = e.target.value;
                              setTourData({ ...tourData, preferredDates: newDates });
                            }}
                            placeholder={`Option ${i + 1}`}
                            min={new Date().toISOString().slice(0, 10)}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="tourTime" className="text-sm font-medium text-gray-700 mb-1 block">
                        Preferred Time of Day
                      </Label>
                      <Select
                        value={tourData.preferredTime}
                        onValueChange={(value: "morning" | "afternoon" | "flexible") =>
                          setTourData({ ...tourData, preferredTime: value })
                        }
                      >
                        <SelectTrigger id="tourTime">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning (before noon)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (noon–5 pm)</SelectItem>
                          <SelectItem value="flexible">Flexible — any time works</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tourNote" className="text-sm font-medium text-gray-700 mb-1 block">
                        Note <span className="text-gray-400 font-normal">(optional)</span>
                      </Label>
                      <Textarea
                        id="tourNote"
                        value={tourData.note}
                        onChange={(e) => setTourData({ ...tourData, note: e.target.value })}
                        rows={3}
                        placeholder="Any questions or details you'd like the provider to know before the tour..."
                        maxLength={1000}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowTourForm(false)}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitTourRequestMutation.isPending}
                        className="bg-green-700 hover:bg-green-800 text-white"
                      >
                        {submitTourRequestMutation.isPending ? "Sending…" : "Send Tour Request"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Inquiry Form Modal */}
            {showInquiryForm && (
              <Card className="mt-6 border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-primary">📝 Send Inquiry to {currentProvider?.name}</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowInquiryForm(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕ Close
                    </Button>
                  </div>
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
