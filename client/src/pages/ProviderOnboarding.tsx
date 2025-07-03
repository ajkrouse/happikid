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
  Star
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";

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

  const calculateCompleteness = () => {
    const requiredFields = [
      "name", "description", "address", "borough", "zipCode", "phone", "email",
      "type", "ageRangeMin", "ageRangeMax", "capacity", "hoursOpen", "hoursClose"
    ];
    
    const filledFields = requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData];
      return value && value.toString().trim() !== "";
    });
    
    const baseCompletion = (filledFields.length / requiredFields.length) * 70;
    
    // Bonus points for optional fields
    let bonusPoints = 0;
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
    const missingFields = requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData];
      return !value || value.toString().trim() === "";
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
      onboardingStep: ONBOARDING_STEPS[Math.min(currentStep + 1, ONBOARDING_STEPS.length - 1)].id
    };

    try {
      await createProviderMutation.mutateAsync(providerData);
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
      case 0: return ["name", "description", "address", "borough", "zipCode", "phone", "email"];
      case 1: return ["type", "ageRangeMin", "ageRangeMax", "capacity"];
      case 2: return ["hoursOpen", "hoursClose"];
      case 3: return [];
      case 4: return [];
      case 5: return [];
      default: return [];
    }
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="123 Main Street"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="borough">Borough *</Label>
                    <Select value={formData.borough} onValueChange={(value) => setFormData(prev => ({ ...prev, borough: value }))}>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="New York"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="NY"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                      placeholder="10001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
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

                <div>
                  <Label>Features & Amenities</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {FEATURES_OPTIONS.map((feature) => (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hoursOpen">Opening Time *</Label>
                    <Input
                      id="hoursOpen"
                      type="time"
                      value={formData.hoursOpen}
                      onChange={(e) => setFormData(prev => ({ ...prev, hoursOpen: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="hoursClose">Closing Time *</Label>
                    <Input
                      id="hoursClose"
                      type="time"
                      value={formData.hoursClose}
                      onChange={(e) => setFormData(prev => ({ ...prev, hoursClose: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="monthlyPrice">Monthly Price (Optional)</Label>
                  <Input
                    id="monthlyPrice"
                    value={formData.monthlyPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyPrice: e.target.value }))}
                    placeholder="$1,200"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    💡 Providers with transparent pricing get 80% more inquiries
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
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Upload Photos</p>
                  <p className="text-sm text-gray-600 mb-4">
                    Add photos of your facility, activities, and happy children
                  </p>
                  <Button variant="outline">
                    Choose Photos
                  </Button>
                </div>
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

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const completeness = calculateCompleteness();
  const currentStepInfo = ONBOARDING_STEPS[currentStep];

  // Navigation warning for incomplete profile
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (completeness < 100) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [completeness]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
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
                Upgrade
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