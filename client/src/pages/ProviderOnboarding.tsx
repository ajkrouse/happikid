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
import { StepServiceDetails } from "@/components/StepServiceDetails";

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

  // Check if user is authenticated and is a provider
  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login with returnTo parameter to come back here
      window.location.href = "/api/login?returnTo=" + encodeURIComponent("/provider/onboarding");
      return;
    }
  }, [isAuthenticated, setLocation]);

  // Fetch existing provider profile if exists
  const { data: existingProvider } = useQuery({
    queryKey: ["/api/providers/mine"],
    enabled: isAuthenticated
  });

  // Update form with existing data
  useEffect(() => {
    if (existingProvider) {
      setFormData({
        name: existingProvider.name || "",
        description: existingProvider.description || "",
        address: existingProvider.address || "",
        borough: existingProvider.borough || "",
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
        monthlyPrice: existingProvider.monthlyPrice || "",
        monthlyPriceMin: existingProvider.monthlyPriceMin || "",
        monthlyPriceMax: existingProvider.monthlyPriceMax || "",
        hoursOpen: existingProvider.hoursOpen || "",
        hoursClose: existingProvider.hoursClose || "",
        schedule: existingProvider.schedule || {
          monday: { open: "", close: "", isOpen: true },
          tuesday: { open: "", close: "", isOpen: true },
          wednesday: { open: "", close: "", isOpen: true },
          thursday: { open: "", close: "", isOpen: true },
          friday: { open: "", close: "", isOpen: true },
          saturday: { open: "", close: "", isOpen: false },
          sunday: { open: "", close: "", isOpen: false }
        },
        features: existingProvider.features || [],
        customFeatures: [],
        licenseNumber: existingProvider.licenseNumber || "",
        accreditationDetails: existingProvider.accreditationDetails || "",
        programHighlights: existingProvider.programHighlights || [],
        uniqueSellingPoints: existingProvider.uniqueSellingPoints || [],
        faqs: existingProvider.faqs || [],
        showExactPrice: existingProvider.showExactPrice || false
      });
      
      // Set current step based on onboarding progress
      const stepIndex = ONBOARDING_STEPS.findIndex(step => step.id === existingProvider.onboardingStep);
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
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Start with the foundation of your provider profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Provider Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Little Sprouts Daycare"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell parents about your childcare philosophy, approach, and what makes you special..."
                    className="min-h-[100px]"
                  />
                </div>

                {/* Multiple Locations Management */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Locations *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLocations(prev => [...prev, {
                        name: `Location ${prev.length + 1}`,
                        address: "",
                        borough: "",
                        city: "New York",
                        state: "NY",
                        zipCode: "",
                        phone: "",
                        capacity: "",
                        isPrimary: false
                      }])}
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
                              const newLocations = [...locations];
                              newLocations[index].name = e.target.value;
                              setLocations(newLocations);
                            }}
                            placeholder="Location Name"
                            className="w-48"
                          />
                          {location.isPrimary && (
                            <Badge variant="default">Primary</Badge>
                          )}
                        </div>
                        {locations.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newLocations = locations.filter((_, i) => i !== index);
                              if (location.isPrimary && newLocations.length > 0) {
                                newLocations[0].isPrimary = true;
                              }
                              setLocations(newLocations);
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
                              const newLocations = [...locations];
                              newLocations[index].address = e.target.value;
                              setLocations(newLocations);
                            }}
                            placeholder="123 Main Street"
                          />
                        </div>
                        
                        <div>
                          <Label>Borough / Area</Label>
                          <Select value={location.borough} onValueChange={(value) => {
                            const newLocations = [...locations];
                            newLocations[index].borough = value;
                            setLocations(newLocations);
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select if in NYC area" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Manhattan">Manhattan</SelectItem>
                              <SelectItem value="Brooklyn">Brooklyn</SelectItem>
                              <SelectItem value="Queens">Queens</SelectItem>
                              <SelectItem value="Bronx">Bronx</SelectItem>
                              <SelectItem value="Staten Island">Staten Island</SelectItem>
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
                              const newLocations = [...locations];
                              newLocations[index].city = e.target.value;
                              setLocations(newLocations);
                            }}
                            placeholder="New York"
                          />
                        </div>
                        
                        <div>
                          <Label>State *</Label>
                          <Input
                            value={location.state}
                            onChange={(e) => {
                              const newLocations = [...locations];
                              newLocations[index].state = e.target.value;
                              setLocations(newLocations);
                            }}
                            placeholder="NY"
                          />
                        </div>
                        
                        <div>
                          <Label>ZIP Code *</Label>
                          <Input
                            value={location.zipCode}
                            onChange={(e) => {
                              const newLocations = [...locations];
                              newLocations[index].zipCode = e.target.value;
                              setLocations(newLocations);
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
                              const newLocations = [...locations];
                              newLocations[index].phone = e.target.value;
                              setLocations(newLocations);
                            }}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        
                        <div>
                          <Label>Capacity</Label>
                          <Input
                            value={location.capacity}
                            onChange={(e) => {
                              const newLocations = [...locations];
                              newLocations[index].capacity = e.target.value;
                              setLocations(newLocations);
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
                              const newLocations = [...locations];
                              newLocations.forEach(loc => loc.isPrimary = false);
                              newLocations[index].isPrimary = true;
                              setLocations(newLocations);
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
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@littlesprouts.com"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://www.littlesprouts.com"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <Info className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900">Pro Tips</span>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  {tips?.map((tip, index) => (
                    <li key={index}>• {tip}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        );

      case "service_details":
        return (
          <StepServiceDetails
            formData={formData}
            followupData={followupData}
            onFormDataChange={(updates) => {
              setFormData(prev => ({ ...prev, ...updates }));
              setHasUnsavedChanges(true);
            }}
            onFollowupDataChange={(updates) => {
              setFollowupData(updates);
              setHasUnsavedChanges(true);
            }}
          />
        );

      case "old_service_details":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Service Details
                </CardTitle>
                <CardDescription>
                  Define your services and target age groups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="type">Provider Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daycare">Daycare</SelectItem>
                      <SelectItem value="afterschool">After-School Program</SelectItem>
                      <SelectItem value="camp">Camp</SelectItem>
                      <SelectItem value="school">Private School</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ageRangeMin">Minimum Age (months) *</Label>
                    <Input
                      id="ageRangeMin"
                      type="number"
                      value={formData.ageRangeMin}
                      onChange={(e) => setFormData(prev => ({ ...prev, ageRangeMin: e.target.value }))}
                      placeholder="6"
                      min="0"
                      max="216"
                    />
                    {formData.ageRangeMin && (
                      <p className="text-sm text-gray-500 mt-1">
                        {parseInt(formData.ageRangeMin) < 12 
                          ? `${formData.ageRangeMin} months` 
                          : `${Math.floor(parseInt(formData.ageRangeMin) / 12)} years ${parseInt(formData.ageRangeMin) % 12 > 0 ? `${parseInt(formData.ageRangeMin) % 12} months` : ''}`
                        }
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="ageRangeMax">Maximum Age (months) *</Label>
                    <Input
                      id="ageRangeMax"
                      type="number"
                      value={formData.ageRangeMax}
                      onChange={(e) => setFormData(prev => ({ ...prev, ageRangeMax: e.target.value }))}
                      placeholder="60"
                      min="0"
                      max="216"
                    />
                    {formData.ageRangeMax && (
                      <p className="text-sm text-gray-500 mt-1">
                        {parseInt(formData.ageRangeMax) < 12 
                          ? `${formData.ageRangeMax} months` 
                          : `${Math.floor(parseInt(formData.ageRangeMax) / 12)} years ${parseInt(formData.ageRangeMax) % 12 > 0 ? `${parseInt(formData.ageRangeMax) % 12} months` : ''}`
                        }
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="capacity">Total Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                    placeholder="24"
                    min="1"
                  />
                </div>

                {/* Dynamic Features based on Provider Type */}
                <div>
                  <Label className="text-base font-medium">Features & Amenities</Label>
                  <p className="text-sm text-gray-600 mb-4">
                    Select features that apply to your {formData.type || 'provider'} services
                  </p>
                  
                  {formData.type && FEATURES_BY_TYPE[formData.type] && (
                    <div className="space-y-6">
                      {Object.entries(FEATURES_BY_TYPE[formData.type]).map(([category, features]) => (
                        <div key={category} className="space-y-2">
                          <h4 className="font-medium capitalize text-sm text-gray-700">
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {features.map((feature) => (
                              <div key={feature} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`feature-${feature}`}
                                  checked={formData.features.includes(feature)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFormData(prev => ({
                                        ...prev,
                                        features: [...prev.features, feature]
                                      }));
                                    } else {
                                      setFormData(prev => ({
                                        ...prev,
                                        features: prev.features.filter(f => f !== feature)
                                      }));
                                    }
                                  }}
                                />
                                <Label htmlFor={`feature-${feature}`} className="text-sm">
                                  {feature}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!formData.type && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Please select a provider type first to see relevant features</p>
                    </div>
                  )}
                  
                  {/* Custom Features */}
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Custom Features</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const customFeature = prompt("Enter a custom feature:");
                          if (customFeature && customFeature.trim()) {
                            setFormData(prev => ({
                              ...prev,
                              customFeatures: [...prev.customFeatures, customFeature.trim()]
                            }));
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Custom Feature
                      </Button>
                    </div>
                    
                    {formData.customFeatures.length > 0 && (
                      <div className="space-y-2">
                        {formData.customFeatures.map((feature, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{feature}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  customFeatures: prev.customFeatures.filter((_, i) => i !== index)
                                }));
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Add any unique features specific to your provider that aren't listed above
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <Info className="h-4 w-4 text-green-600 mr-2" />
                  <span className="font-medium text-green-900">Pro Tips</span>
                </div>
                <ul className="text-sm text-green-700 space-y-1">
                  {tips?.map((tip, index) => (
                    <li key={index}>• {tip}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        );

      case "schedule_pricing":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Schedule & Pricing
                </CardTitle>
                <CardDescription>
                  Set your operating hours and pricing information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Flexible Weekly Schedule */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Weekly Schedule *</Label>
                  <p className="text-sm text-gray-600">Set your operating hours for each day of the week</p>
                  
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-24">
                        <Checkbox
                          id={`${day}-open`}
                          checked={formData.schedule[day]?.isOpen || false}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            schedule: { 
                              ...prev.schedule, 
                              [day]: { ...prev.schedule[day], isOpen: checked }
                            }
                          }))}
                        />
                        <Label htmlFor={`${day}-open`} className="ml-2 capitalize">
                          {day}
                        </Label>
                      </div>
                      
                      {formData.schedule[day]?.isOpen && (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={formData.schedule[day]?.open || ''}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              schedule: { 
                                ...prev.schedule, 
                                [day]: { ...prev.schedule[day], open: e.target.value }
                              }
                            }))}
                            className="w-32"
                          />
                          <span className="text-sm text-gray-500">to</span>
                          <Input
                            type="time"
                            value={formData.schedule[day]?.close || ''}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              schedule: { 
                                ...prev.schedule, 
                                [day]: { ...prev.schedule[day], close: e.target.value }
                              }
                            }))}
                            className="w-32"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pricing Options */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Pricing *</Label>
                  <p className="text-sm text-gray-600">Choose how you want to display your pricing</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Pricing Type</Label>
                      <Select 
                        value={formData.monthlyPriceMin ? 'range' : 'fixed'}
                        onValueChange={(value) => {
                          if (value === 'range') {
                            setFormData(prev => ({ 
                              ...prev, 
                              monthlyPriceMin: prev.monthlyPrice || '',
                              monthlyPriceMax: ''
                            }));
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              monthlyPriceMin: '',
                              monthlyPriceMax: ''
                            }));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select pricing type" />
                        </SelectTrigger>
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
                          onChange={(e) => setFormData(prev => ({ ...prev, monthlyPriceMin: e.target.value }))}
                          placeholder="1000"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="monthlyPriceMax">Maximum Monthly Price *</Label>
                        <Input
                          id="monthlyPriceMax"
                          type="number"
                          value={formData.monthlyPriceMax}
                          onChange={(e) => setFormData(prev => ({ ...prev, monthlyPriceMax: e.target.value }))}
                          placeholder="1500"
                          min="0"
                          step="0.01"
                          required
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
                        onChange={(e) => setFormData(prev => ({ ...prev, monthlyPrice: e.target.value }))}
                        placeholder="1200"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 mt-3">
                    <Checkbox
                      id="showExactPrice"
                      checked={formData.showExactPrice !== false}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showExactPrice: checked !== false }))}
                    />
                    <Label htmlFor="showExactPrice" className="text-sm">
                      Show exact price on my profile
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Your price helps us show accurate $$ cost meters to parents. If unchecked, we'll only show the cost level ($$) without the exact amount.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <Info className="h-4 w-4 text-orange-600 mr-2" />
                  <span className="font-medium text-orange-900">Pro Tips</span>
                </div>
                <ul className="text-sm text-orange-700 space-y-1">
                  {tips?.map((tip, index) => (
                    <li key={index}>• {tip}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        );

      case "media_photos":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Photos & Media
                </CardTitle>
                <CardDescription>
                  Add photos to showcase your facility and programs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload Section */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    isDragOver 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className="text-lg font-medium text-brand-evergreen mb-2">
                    {isDragOver ? 'Drop photos here' : 'Upload Photos'}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Drag and drop photos here, or click to browse (JPG, PNG, GIF up to 5MB)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button 
                    variant="outline" 
                    type="button" 
                    className="pointer-events-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Choose Photos
                  </Button>
                </div>

                {/* URL Upload Section */}
                <div className="border border-brand-evergreen/10 rounded-lg p-4">
                  <Label className="text-sm font-medium mb-2 block">Or add image from URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleAddImageUrl}
                      disabled={!imageUrlInput.trim() || addImageMutation.isPending}
                    >
                      {addImageMutation.isPending ? "Adding..." : "Add"}
                    </Button>
                  </div>
                </div>

                {/* Uploaded Images Display */}
                {uploadedImages.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Uploaded Images</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="border rounded-lg p-3 space-y-3">
                          <div className="relative">
                            <img
                              src={image.url}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-32 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.35em' fill='%23374151'%3EImage Error%3C/text%3E%3C/svg%3E";
                              }}
                            />
                            {image.isPrimary && (
                              <Badge className="absolute top-2 left-2 bg-blue-600">
                                Primary
                              </Badge>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => removeImage(index)}
                            >
                              ×
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <Input
                              value={image.caption}
                              onChange={(e) => updateImageCaption(index, e.target.value)}
                              placeholder="Add a caption..."
                              className="text-sm"
                            />
                            
                            {!image.isPrimary && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPrimaryImage(index)}
                                className="w-full"
                              >
                                Set as Primary
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadedImages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Camera className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No photos uploaded yet</p>
                    <p className="text-sm">Add some photos to make your profile more appealing</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <Info className="h-4 w-4 text-purple-600 mr-2" />
                  <span className="font-medium text-purple-900">Pro Tips</span>
                </div>
                <ul className="text-sm text-purple-700 space-y-1">
                  {tips?.map((tip, index) => (
                    <li key={index}>• {tip}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        );

      case "verification":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Verification & Credentials
                </CardTitle>
                <CardDescription>
                  Add your licensing and accreditation information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    placeholder="NYC DOH License #123456"
                  />
                </div>

                <div>
                  <Label htmlFor="accreditationDetails">Accreditation Details</Label>
                  <Textarea
                    id="accreditationDetails"
                    value={formData.accreditationDetails}
                    onChange={(e) => setFormData(prev => ({ ...prev, accreditationDetails: e.target.value }))}
                    placeholder="NAEYC Accredited, CPR Certified Staff, etc."
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <Info className="h-4 w-4 text-red-600 mr-2" />
                  <span className="font-medium text-red-900">Pro Tips</span>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {tips?.map((tip, index) => (
                    <li key={index}>• {tip}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Review & Publish
                </CardTitle>
                <CardDescription>
                  Review your profile and make it live for parents to find
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-900">Profile Complete!</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Your provider profile is ready to go live and start connecting with families.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Basic Information</h4>
                    <p><strong>Name:</strong> {formData.name}</p>
                    <p><strong>Type:</strong> {formData.type}</p>
                    <p><strong>Address:</strong> {formData.address}, {formData.borough}</p>
                    <p><strong>Contact:</strong> {formData.phone}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Service Details</h4>
                    {formData.ageRangeMin && formData.ageRangeMax && (
                      <p><strong>Ages:</strong> {formatAgeRange(parseInt(formData.ageRangeMin), parseInt(formData.ageRangeMax))}</p>
                    )}
                    <p><strong>Capacity:</strong> {formData.capacity} children</p>
                    <p><strong>Hours:</strong> {formData.hoursOpen} - {formData.hoursClose}</p>
                    {formData.monthlyPrice && <p><strong>Price:</strong> {formData.monthlyPrice}/month</p>}
                  </div>
                </div>

                {formData.features.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.features.map((feature) => (
                        <Badge key={feature} variant="secondary">{feature}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-900">Next Steps</span>
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Complete verification to make your profile visible</li>
                <li>• Add photos to increase parent engagement</li>
                <li>• Set up your dashboard to track inquiries</li>
                <li>• Consider premium features for better visibility</li>
              </ul>
            </div>
          </div>
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
            <div className="flex items-center justify-between">
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
                              ? "bg-green-600 text-white" 
                              : isActive 
                                ? "bg-blue-600 text-white" 
                                : "bg-gray-200 text-gray-600"
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