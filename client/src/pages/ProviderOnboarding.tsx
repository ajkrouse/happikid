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
  Camera,
  Shield,
  Star
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocation } from "wouter";

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
    capacity: "",
    monthlyPrice: "",
    hoursOpen: "",
    hoursClose: "",
    features: [] as string[],
    licenseNumber: "",
    accreditationDetails: "",
    programHighlights: [] as string[],
    uniqueSellingPoints: [] as string[],
    faqs: [] as { question: string; answer: string }[]
  });

  // Check if user is authenticated and is a provider
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
      return;
    }
  }, [isAuthenticated, setLocation]);

  // Load existing provider data if available
  const { data: existingProvider, isLoading } = useQuery({
    queryKey: ["/api/providers/mine"],
    enabled: isAuthenticated,
  });

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
        hoursOpen: existingProvider.hoursOpen || "",
        hoursClose: existingProvider.hoursClose || "",
        features: existingProvider.features || [],
        licenseNumber: existingProvider.licenseNumber || "",
        accreditationDetails: existingProvider.accreditationDetails || "",
        programHighlights: existingProvider.programHighlights || [],
        uniqueSellingPoints: existingProvider.uniqueSellingPoints || [],
        faqs: existingProvider.faqs || []
      });
      
      // Set current step based on onboarding progress
      const stepIndex = ONBOARDING_STEPS.findIndex(step => step.id === existingProvider.onboardingStep);
      setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
    }
  }, [existingProvider]);

  const createProviderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/providers", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Progress saved",
        description: "Your provider profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/providers/mine"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  const calculateCompleteness = () => {
    const required = {
      basic_info: ["name", "description", "address", "borough", "zipCode", "phone", "email"],
      service_details: ["type", "ageRangeMin", "ageRangeMax"],
      schedule_pricing: ["hoursOpen", "hoursClose"],
      media_photos: [], // Will be handled separately
      verification: [], // Will be handled separately
    };

    let completed = 0;
    let total = 0;

    Object.entries(required).forEach(([step, fields]) => {
      fields.forEach(field => {
        total++;
        if (formData[field as keyof typeof formData]) {
          completed++;
        }
      });
    });

    // Add features and other array fields
    if (formData.features.length > 0) completed++;
    total++;

    return Math.round((completed / total) * 100);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleNext = async () => {
    // Save current progress
    const currentStepId = ONBOARDING_STEPS[currentStep].id;
    const providerData = {
      ...formData,
      ageRangeMin: parseInt(formData.ageRangeMin) || 0,
      ageRangeMax: parseInt(formData.ageRangeMax) || 18,
      capacity: parseInt(formData.capacity) || null,
      onboardingStep: currentStepId,
      profileCompleteness: calculateCompleteness(),
    };

    try {
      await createProviderMutation.mutateAsync(providerData);
      if (currentStep < ONBOARDING_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Completed onboarding
        setLocation("/provider/dashboard");
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    const step = ONBOARDING_STEPS[currentStep];
    
    switch (step.id) {
      case "basic_info":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Little Learners Daycare"
                />
              </div>
              <div>
                <Label htmlFor="type">Service Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daycare">Daycare Center</SelectItem>
                    <SelectItem value="afterschool">After-School Program</SelectItem>
                    <SelectItem value="camp">Summer Camp</SelectItem>
                    <SelectItem value="school">Private School</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Tell parents about your approach to childcare, your philosophy, and what makes your program special..."
                rows={4}
              />
              <p className="text-sm text-gray-500 mt-1">
                Tip: Mention your educational philosophy, staff qualifications, and unique programs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="info@littlelearners.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="borough">Borough *</Label>
                <Select value={formData.borough} onValueChange={(value) => handleInputChange("borough", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select borough" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manhattan">Manhattan</SelectItem>
                    <SelectItem value="Brooklyn">Brooklyn</SelectItem>
                    <SelectItem value="Queens">Queens</SelectItem>
                    <SelectItem value="Bronx">Bronx</SelectItem>
                    <SelectItem value="Staten Island">Staten Island</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="New York"
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  placeholder="10001"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website">Website (Optional)</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="https://www.littlelearners.com"
              />
            </div>
          </div>
        );

      case "service_details":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ageRangeMin">Minimum Age (months) *</Label>
                <Input
                  id="ageRangeMin"
                  type="number"
                  value={formData.ageRangeMin}
                  onChange={(e) => handleInputChange("ageRangeMin", e.target.value)}
                  placeholder="6"
                />
              </div>
              <div>
                <Label htmlFor="ageRangeMax">Maximum Age (months) *</Label>
                <Input
                  id="ageRangeMax"
                  type="number"
                  value={formData.ageRangeMax}
                  onChange={(e) => handleInputChange("ageRangeMax", e.target.value)}
                  placeholder="60"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="capacity">Capacity (Optional)</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => handleInputChange("capacity", e.target.value)}
                placeholder="30"
              />
              <p className="text-sm text-gray-500 mt-1">
                Total number of children you can accommodate
              </p>
            </div>

            <div>
              <Label>Features & Amenities</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {FEATURES_OPTIONS.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature}
                      checked={formData.features.includes(feature)}
                      onCheckedChange={() => handleFeatureToggle(feature)}
                    />
                    <Label htmlFor={feature} className="text-sm">{feature}</Label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Select all features that apply to your program
              </p>
            </div>
          </div>
        );

      case "schedule_pricing":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hoursOpen">Opening Time *</Label>
                <Input
                  id="hoursOpen"
                  type="time"
                  value={formData.hoursOpen}
                  onChange={(e) => handleInputChange("hoursOpen", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="hoursClose">Closing Time *</Label>
                <Input
                  id="hoursClose"
                  type="time"
                  value={formData.hoursClose}
                  onChange={(e) => handleInputChange("hoursClose", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="monthlyPrice">Monthly Rate (Optional)</Label>
              <Input
                id="monthlyPrice"
                value={formData.monthlyPrice}
                onChange={(e) => handleInputChange("monthlyPrice", e.target.value)}
                placeholder="1500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter your base monthly rate in dollars. You can always update this later.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Info className="h-4 w-4 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">Pricing Tips</span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Be transparent about your pricing to build trust</li>
                <li>• Consider offering different rate options (full-time, part-time)</li>
                <li>• Extended hours can justify premium pricing</li>
              </ul>
            </div>
          </div>
        );

      case "media_photos":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Photos Coming Soon</h3>
              <p className="text-gray-600 mb-4">
                Photo upload functionality will be available in the full dashboard. 
                For now, you can proceed to the next step.
              </p>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Info className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="font-medium text-yellow-900">Photo Guidelines</span>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1 text-left">
                  <li>• Show children actively learning and playing</li>
                  <li>• Include shots of your facilities and outdoor areas</li>
                  <li>• Feature staff interacting with children</li>
                  <li>• Ensure all photos have proper permissions</li>
                  <li>• High-quality images perform 60% better</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case "verification":
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                placeholder="Enter your childcare license number"
              />
            </div>

            <div>
              <Label htmlFor="accreditationDetails">Accreditations & Certifications</Label>
              <Textarea
                id="accreditationDetails"
                value={formData.accreditationDetails}
                onChange={(e) => handleInputChange("accreditationDetails", e.target.value)}
                placeholder="List any accreditations, certifications, or special qualifications..."
                rows={3}
              />
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Shield className="h-4 w-4 text-green-600 mr-2" />
                <span className="font-medium text-green-900">Verification Benefits</span>
              </div>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Verified providers receive 3x more inquiries</li>
                <li>• Trust badges increase parent confidence</li>
                <li>• Higher search ranking in results</li>
                <li>• Profile becomes publicly visible</li>
              </ul>
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                Profile Complete!
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Business Name:</p>
                  <p className="text-gray-600">{formData.name}</p>
                </div>
                <div>
                  <p className="font-medium">Service Type:</p>
                  <p className="text-gray-600">{formData.type}</p>
                </div>
                <div>
                  <p className="font-medium">Location:</p>
                  <p className="text-gray-600">{formData.borough}, {formData.zipCode}</p>
                </div>
                <div>
                  <p className="font-medium">Age Range:</p>
                  <p className="text-gray-600">{formData.ageRangeMin}-{formData.ageRangeMax} months</p>
                </div>
              </div>
            </div>

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

  if (!isAuthenticated || isLoading) {
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
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set Up Your Provider Profile
          </h1>
          <p className="text-gray-600">
            Complete your profile to start connecting with families in your area
          </p>
        </div>

        {/* Progress Bar */}
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
                          <span className={`text-xs mt-1 hidden md:block ${
                            isActive ? "font-medium" : ""
                          }`}>
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <currentStepInfo.icon className="h-5 w-5 mr-2" />
                  {currentStepInfo.title}
                </CardTitle>
                <CardDescription>
                  Complete this step to improve your profile visibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderStepContent()}
              </CardContent>
            </Card>
          </div>

          {/* Tips Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tips for Success</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {COMPLETION_TIPS[currentStepInfo.id as keyof typeof COMPLETION_TIPS]?.map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Premium Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">Premium</Badge>
                    <span>Competitive insights</span>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">Premium</Badge>
                    <span>Advanced analytics</span>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">Premium</Badge>
                    <span>Priority in search results</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setShowPremiumModal(true)}>
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

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
          // TODO: Implement subscription flow
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