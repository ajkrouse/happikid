import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import PremiumFeaturesModal from "@/components/PremiumFeaturesModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  Info, 
  ArrowRight, 
  ArrowLeft,
  Building2,
  Users,
  Clock,
  Crown,
  Sparkles,
  Camera,
  Shield,
  Star,
  Plus
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import type { Provider } from "@shared/schema";
import { StepServiceDetails } from "@/components/StepServiceDetails";
import { StepBasicInfo } from "@/components/onboarding/StepBasicInfo";
import { StepSchedulePricing } from "@/components/onboarding/StepSchedulePricing";
import { StepMediaPhotos } from "@/components/onboarding/StepMediaPhotos";
import { StepVerification } from "@/components/onboarding/StepVerification";
import { StepReview } from "@/components/onboarding/StepReview";

const ONBOARDING_STEPS = [
  { id: "basic_info", title: "Basic Information", icon: Building2 },
  { id: "service_details", title: "Service Details", icon: Users },
  { id: "schedule_pricing", title: "Schedule & Pricing", icon: Clock },
  { id: "media_photos", title: "Photos & Media", icon: Camera },
  { id: "verification", title: "Verification", icon: Shield },
  { id: "review", title: "Review & Publish", icon: Star }
];

const COMPLETION_TIPS = {
  basic_info: [
    "A compelling description increases parent interest by 40%",
    "Include your unique approach to childcare",
    "Mention any special programs or methodologies"
  ],
  service_details: [
    "Clear age ranges help parents find you faster",
    "List specific features that set you apart",
    "Consider seasonal programs (summer camps, etc.)"
  ],
  schedule_pricing: [
    "Transparent pricing builds trust with parents",
    "Extended hours can be a major selling point",
    "Consider offering flexible arrangements"
  ],
  media_photos: [
    "Photos increase parent engagement by 60%",
    "Show children actively learning and playing",
    "Include shots of your facilities and staff"
  ],
  verification: [
    "Verified providers get 3x more inquiries",
    "Licensing badges build immediate trust",
    "Complete verification unlocks profile visibility"
  ]
};

const FEATURES_BY_TYPE = {
  daycare: {
    safety: ["Security Cameras", "Secure Entry", "Background Checked Staff", "First Aid Certified"],
    learning: ["Early Learning Curriculum", "Reading Program", "STEM Activities", "Art & Crafts"],
    convenience: ["Extended Hours", "Flexible Scheduling", "Online Updates", "Drop-in Care"],
    nutrition: ["Organic Meals", "Allergy-Friendly Options", "Fresh Snacks", "Nutrition Education"],
    outdoor: ["Outdoor Playground", "Garden/Nature Area", "Physical Activity", "Nature Exploration"]
  },
  afterschool: {
    academics: ["Homework Help", "Tutoring", "Study Groups", "Reading Support"],
    activities: ["Sports Programs", "Art Classes", "Music Lessons", "Drama/Theater"],
    technology: ["Computer Lab", "Coding Classes", "Digital Literacy", "STEM Projects"],
    social: ["Team Building", "Social Skills", "Leadership Development", "Community Service"],
    convenience: ["Transportation", "Flexible Hours", "Holiday Care", "Late Pickup"]
  },
  camp: {
    outdoor: ["Swimming Pool", "Sports Fields", "Nature Trails", "Adventure Activities"],
    creative: ["Arts & Crafts", "Music Programs", "Drama/Theater", "Creative Writing"],
    sports: ["Team Sports", "Individual Sports", "Fitness Activities", "Sports Instruction"],
    educational: ["STEM Activities", "Environmental Education", "Cultural Programs", "Field Trips"],
    special: ["Overnight Stays", "Special Events", "Theme Weeks", "Guest Speakers"]
  },
  school: {
    academics: ["Advanced Curriculum", "AP Courses", "Language Programs", "STEM Focus"],
    facilities: ["Science Labs", "Library", "Computer Lab", "Art Studios"],
    extracurricular: ["Sports Teams", "Music Program", "Drama Club", "Academic Clubs"],
    support: ["Counseling Services", "Learning Support", "College Prep", "Career Guidance"],
    technology: ["1:1 Devices", "Smart Classrooms", "Online Learning", "Digital Resources"]
  }
};

const FEATURES_OPTIONS = [
  "Outdoor Playground", "Art & Crafts", "Music Programs", "STEM Activities",
  "Language Immersion", "Organic Meals", "Security Cameras", "Extended Hours",
  "Transportation", "Swimming Pool", "Library", "Garden/Farm",
  "Special Needs Support", "Montessori Method", "Waldorf Approach"
];

export default function ProviderOnboarding() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    borough: "",
    city: "New York",
    state: "NY",
    zipCode: "",
    phone: "",
    email: "",
    website: "",
    type: "",
    ageRangeMin: "",
    ageRangeMax: "",
    // Step 2 upgrade fields
    minAgeMonths: undefined as number | undefined,
    maxAgeMonths: undefined as number | undefined,
    totalCapacity: undefined as number | undefined,
    featuresNew: [] as string[],
    featuresCustom: [] as string[],
    details: {} as Record<string, any>,
    // Legacy fields
    capacity: "",
    monthlyPrice: "",
    monthlyPriceMin: "",
    monthlyPriceMax: "",
    showExactPrice: true,
    hoursOpen: "",
    hoursClose: "",
    schedule: {
      monday: { open: "", close: "", isOpen: true },
      tuesday: { open: "", close: "", isOpen: true },
      wednesday: { open: "", close: "", isOpen: true },
      thursday: { open: "", close: "", isOpen: true },
      friday: { open: "", close: "", isOpen: true },
      saturday: { open: "", close: "", isOpen: false },
      sunday: { open: "", close: "", isOpen: false }
    },
    features: [] as string[],
    customFeatures: [] as string[],
    licenseNumber: "",
    accreditationDetails: "",
    programHighlights: [] as string[],
    uniqueSellingPoints: [] as string[],
    faqs: [] as { question: string; answer: string }[]
  });

  // State for followup data (feature-specific fields)
  const [followupData, setFollowupData] = useState<Record<string, any>>({});

  const [locations, setLocations] = useState<Array<{
    id?: number;
    name: string;
    address: string;
    borough: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    capacity: string;
    isPrimary: boolean;
  }>>([{
    name: "Main Location",
    address: "",
    borough: "",
    city: "New York",
    state: "NY",
    zipCode: "",
    phone: "",
    capacity: "",
    isPrimary: true
  }]);

  const [uploadedImages, setUploadedImages] = useState<Array<{
    id?: number;
    url: string;
    caption: string;
    isPrimary: boolean;
  }>>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Check if user is authenticated; redirect to login if not
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = "/api/login?returnTo=" + encodeURIComponent("/provider/onboarding");
      return;
    }
    // Promote role to "provider" if the user signed up through the provider flow
    if (user && user.role !== 'provider') {
      fetch('/api/user/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'provider' }),
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      });
    }
  }, [isAuthenticated, user, queryClient, setLocation]);

  // Fetch existing provider profile if exists
  const { data: existingProvider } = useQuery<Provider | null>({
    queryKey: ["/api/providers/mine"],
    enabled: isAuthenticated
  });

  // Update form with existing data
  useEffect(() => {
    if (existingProvider) {
      setFormData(prev => ({
        ...prev,
        name: existingProvider.name || "",
        description: existingProvider.description || "",
        address: existingProvider.address || "",
        borough: (existingProvider as any).borough || "",
        city: existingProvider.city || "New York",
        state: existingProvider.state || "NY",
        zipCode: existingProvider.zipCode || "",
        phone: existingProvider.phone || "",
        email: existingProvider.email || "",
        website: existingProvider.website || "",
        type: existingProvider.type || "",
        ageRangeMin: existingProvider.ageRangeMin?.toString() || "",
        ageRangeMax: existingProvider.ageRangeMax?.toString() || "",
        capacity: existingProvider.capacity?.toString() || "",
        monthlyPrice: (existingProvider as any).monthlyPrice || "",
        monthlyPriceMin: (existingProvider as any).monthlyPriceMin || "",
        monthlyPriceMax: (existingProvider as any).monthlyPriceMax || "",
        hoursOpen: (existingProvider as any).hoursOpen || "",
        hoursClose: (existingProvider as any).hoursClose || "",
        schedule: (existingProvider as any).schedule || prev.schedule,
        features: (existingProvider as any).features || [],
        customFeatures: [],
        licenseNumber: existingProvider.licenseNumber || "",
        accreditationDetails: (existingProvider as any).accreditationDetails || "",
        programHighlights: (existingProvider as any).programHighlights || [],
        uniqueSellingPoints: (existingProvider as any).uniqueSellingPoints || [],
        faqs: (existingProvider as any).faqs || [],
        showExactPrice: (existingProvider as any).showExactPrice || false,
      }));
      
      // Set current step based on onboarding progress
      const stepIndex = ONBOARDING_STEPS.findIndex(step => step.id === (existingProvider as any).onboardingStep);
      if (stepIndex >= 0) {
        setCurrentStep(stepIndex);
      }
    }
  }, [existingProvider]);

  const createProviderMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/providers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers/mine"] });
      toast({
        title: "Progress Saved",
        description: "Your provider profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save provider profile",
        variant: "destructive",
      });
    },
  });

  const addImageMutation = useMutation({
    mutationFn: async ({ providerId, imageData }: { providerId: number; imageData: any }) => {
      return apiRequest("POST", `/api/providers/${providerId}/images`, imageData);
    },
    onSuccess: () => {
      toast({
        title: "Image Added",
        description: "Your image has been uploaded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  const calculateCompleteness = () => {
    const requiredFields = [
      "name", "description", "address", "zipCode", "phone", "email",
      "type", "ageRangeMin", "ageRangeMax", "capacity", "hoursOpen", "hoursClose"
    ];
    
    const filledFields = requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData];
      return value && value.toString().trim() !== "";
    });
    
    const baseCompletion = (filledFields.length / requiredFields.length) * 70;
    
    // Bonus points for optional fields
    let bonusPoints = 0;
    if (formData.borough) bonusPoints += 5; // Borough is now optional bonus
    if (formData.website) bonusPoints += 5;
    if (formData.monthlyPrice) bonusPoints += 5;
    if (formData.features.length > 0) bonusPoints += 10;
    if (formData.licenseNumber) bonusPoints += 5;
    if (formData.accreditationDetails) bonusPoints += 5;
    
    return Math.min(100, Math.round(baseCompletion + bonusPoints));
  };

  // Convert months to years and months for display
  const formatAgeRange = (minMonths: number, maxMonths: number) => {
    const formatAge = (months: number) => {
      if (months < 12) return `${months} months`;
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
      return `${years}y ${remainingMonths}m`;
    };
    return `${formatAge(minMonths)} - ${formatAge(maxMonths)}`;
  };

  const handleNext = async () => {
    const requiredFields = getRequiredFieldsForStep(currentStep);
    const missingFields: string[] = [];
    
    requiredFields.forEach(field => {
      // For address, zipCode, and phone, check the primary location instead of formData
      if (field === "address" || field === "zipCode" || field === "phone") {
        const primaryLocation = locations.find(loc => loc.isPrimary) || locations[0];
        const value = primaryLocation?.[field as keyof typeof primaryLocation];
        if (!value || value.toString().trim() === "") {
          // Convert field names to display format
          if (field === "zipCode") missingFields.push("Zip Code");
          else missingFields.push(field.charAt(0).toUpperCase() + field.slice(1));
        }
      } else {
        const value = formData[field as keyof typeof formData];
        if (!value || value.toString().trim() === "") {
          missingFields.push(field.charAt(0).toUpperCase() + field.slice(1));
        }
      }
    });

    if (missingFields.length > 0) {
      toast({
        title: "Please complete all required fields",
        description: `Missing: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Save current progress
    const providerData = {
      ...formData,
      ageRangeMin: parseInt(formData.ageRangeMin) || 0,
      ageRangeMax: parseInt(formData.ageRangeMax) || 120,
      capacity: parseInt(formData.capacity) || 0,
      monthlyPrice: parseFloat(formData.monthlyPrice) || 0,
      monthlyPriceMin: formData.monthlyPriceMin ? parseFloat(formData.monthlyPriceMin) : null,
      monthlyPriceMax: formData.monthlyPriceMax ? parseFloat(formData.monthlyPriceMax) : null,
      features: [...formData.features, ...formData.customFeatures],
      schedule: formData.schedule,
      onboardingStep: ONBOARDING_STEPS[Math.min(currentStep + 1, ONBOARDING_STEPS.length - 1)].id,
      locations: locations
    };

    try {
      await createProviderMutation.mutateAsync(providerData);
      setHasUnsavedChanges(false); // Clear unsaved changes flag
      if (currentStep < ONBOARDING_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Completed onboarding
        setLocation("/provider/celebration");
      }
    } catch (error) {
      console.error("Error saving provider:", error);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getRequiredFieldsForStep = (step: number) => {
    switch (step) {
      case 0: return ["name", "description", "address", "zipCode", "phone", "email"];
      case 1: return ["type", "ageRangeMin", "ageRangeMax", "capacity"];
      case 2: return ["hoursOpen", "hoursClose"];
      case 3: return [];
      case 4: return [];
      case 5: return [];
      default: return [];
    }
  };

  // Image upload functions
  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} is larger than 5MB`,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const newImage = {
            url: e.target.result as string,
            caption: file.name.split('.')[0], // Use filename without extension as default caption
            isPrimary: uploadedImages.length === 0
          };
          setUploadedImages(prev => [...prev, newImage]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    processFiles(files);
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleAddImageUrl = async () => {
    if (!imageUrlInput.trim()) return;
    
    // Validate URL format
    try {
      new URL(imageUrlInput);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive",
      });
      return;
    }

    const newImage = {
      url: imageUrlInput.trim(),
      caption: "",
      isPrimary: uploadedImages.length === 0
    };

    // If we have a provider ID, upload immediately
    if (existingProvider?.id) {
      try {
        await addImageMutation.mutateAsync({
          providerId: existingProvider.id,
          imageData: {
            imageUrl: newImage.url,
            caption: newImage.caption,
            isPrimary: newImage.isPrimary
          }
        });
      } catch (error) {
        return; // Error already handled by mutation
      }
    }

    setUploadedImages(prev => [...prev, newImage]);
    setImageUrlInput("");
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index: number) => {
    setUploadedImages(prev => 
      prev.map((img, i) => ({ ...img, isPrimary: i === index }))
    );
  };

  const updateImageCaption = (index: number, caption: string) => {
    setUploadedImages(prev => 
      prev.map((img, i) => i === index ? { ...img, caption } : img)
    );
  };

  const renderStepContent = () => {
    const stepId = ONBOARDING_STEPS[currentStep].id;
    const tips = COMPLETION_TIPS[stepId as keyof typeof COMPLETION_TIPS];

    switch (stepId) {
      case "basic_info":
        return (
          <StepBasicInfo
            formData={formData as any}
            locations={locations}
            onFormDataChange={(updates) => setFormData(prev => ({ ...prev, ...updates as any }))}
            onLocationsChange={setLocations}
            tips={tips}
          />
        );
      case "service_details":
        return (
          <StepServiceDetails
            formData={formData as any}
            followupData={followupData}
            onFormDataChange={(updates) => {
              setFormData(prev => ({ ...prev, ...updates as any }));
              setHasUnsavedChanges(true);
            }}
            onFollowupDataChange={(data) => {
              setFollowupData(data);
              setHasUnsavedChanges(true);
            }}
          />
        );
      case "schedule_pricing":
        return (
          <StepSchedulePricing
            formData={formData as any}
            onFormDataChange={(updates) => setFormData(prev => ({ ...prev, ...updates as any }))}
            tips={tips}
          />
        );
      case "media_photos":
        return (
          <StepMediaPhotos
            uploadedImages={uploadedImages}
            imageUrlInput={imageUrlInput}
            isDragOver={isDragOver}
            addImageMutationPending={addImageMutation.isPending}
            onImageUrlInputChange={setImageUrlInput}
            onAddImageUrl={handleAddImageUrl}
            onFileUpload={handleFileUpload}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onRemoveImage={removeImage}
            onSetPrimaryImage={setPrimaryImage}
            onUpdateCaption={updateImageCaption}
            tips={tips}
          />
        );
      case "verification":
        return (
          <StepVerification
            formData={formData as any}
            onFormDataChange={(updates) => setFormData(prev => ({ ...prev, ...updates as any }))}
            tips={tips}
          />
        );
      case "review":
        return (
          <StepReview
            formData={formData as any}
            formatAgeRange={formatAgeRange}
          />
        );
      default:
        return null;
    }
  };

  // Track form changes
  useEffect(() => {
    // Check if form has any data that's not saved
    const hasFormData = Object.values(formData).some(value => {
      if (Array.isArray(value)) return value.length > 0;
      return value && value.toString().trim() !== "";
    });
    setHasUnsavedChanges(hasFormData && calculateCompleteness() < 100);
  }, [formData]);

  // Navigation warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const completeness = calculateCompleteness();
  const currentStepInfo = ONBOARDING_STEPS[currentStep];



  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-evergreen mb-2">
            Set Up Your Provider Profile
          </h1>
          <p className="text-gray-600">
            Complete your profile to start connecting with families in your area
          </p>
        </div>

        {/* Progress Tracker */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Profile Completeness</span>
              <span className="text-sm text-gray-600">{completeness}%</span>
            </div>
            <Progress value={completeness} className="mb-4" />
            
            {/* Step Indicators */}

            {/* Mobile: compact "Step N of M — Title" so the tracker fits any phone */}
            <div className="flex sm:hidden items-center gap-3 py-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-action-teal text-white">
                {currentStep < currentStep ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  (() => { const Icon = ONBOARDING_STEPS[currentStep].icon; return <Icon className="h-5 w-5" />; })()
                )}
              </div>
              <div>
                <p className="text-xs text-text-muted font-medium">
                  Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                </p>
                <p className="text-sm font-semibold text-brand-evergreen">
                  {ONBOARDING_STEPS[currentStep].title}
                </p>
              </div>
            </div>

            {/* Desktop: full horizontal tracker */}
            <div className="hidden sm:flex items-start justify-between gap-1 pb-1">
              {ONBOARDING_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                  <TooltipProvider key={step.id}>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isCompleted
                              ? "bg-action-teal text-white"
                              : isActive
                                ? "bg-action-teal text-white"
                                : "bg-brand-sage text-text-muted"
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <Icon className="h-5 w-5" />
                            )}
                          </div>
                          <span className="text-xs mt-2 text-center font-medium max-w-16">
                            {step.title}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{step.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Premium Features Card - Compact */}
        <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-900">Premium Features Available</h3>
                  <p className="text-sm text-yellow-700">Get 3x more inquiries with advanced analytics & priority ranking</p>
                </div>
              </div>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
                onClick={() => setShowPremiumModal(true)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Grow Faster
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={createProviderMutation.isPending}
            className="flex items-center"
          >
            {currentStep === ONBOARDING_STEPS.length - 1 ? "Complete Setup" : "Next Step"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
      
      <PremiumFeaturesModal 
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={() => {
          toast({
            title: "Coming Soon",
            description: "Premium subscription features will be available soon!",
          });
          setShowPremiumModal(false);
        }}
      />
    </div>
  );
}