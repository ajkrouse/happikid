import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Baby, MapPin, Clock, DollarSign, Heart, Check, ChevronRight, ChevronLeft, 
  X, Plus, Sparkles
} from "lucide-react";
import type { FamilyProfile } from "@shared/schema";

interface FamilyProfileWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const STEPS = [
  { id: "children", title: "Your Children", icon: Baby, description: "Tell us about your little ones" },
  { id: "location", title: "Location", icon: MapPin, description: "Where are you looking for care?" },
  { id: "schedule", title: "Schedule", icon: Clock, description: "What's your ideal schedule?" },
  { id: "budget", title: "Budget", icon: DollarSign, description: "What's your budget range?" },
  { id: "preferences", title: "Preferences", icon: Heart, description: "Any must-haves or nice-to-haves?" },
];

const BOROUGHS = ["Brooklyn", "Manhattan", "Queens", "Bronx", "Staten Island"];

const SCHEDULE_TYPES = [
  { value: "full_time", label: "Full-Time", description: "5 days/week, full day" },
  { value: "part_time", label: "Part-Time", description: "2-3 days/week or half days" },
  { value: "after_school", label: "After School", description: "Afternoons only" },
  { value: "flexible", label: "Flexible", description: "Varies week to week" },
];

const MUST_HAVE_FEATURES = [
  { id: "accepts_subsidies", label: "Accepts Subsidies/CCAP" },
  { id: "outdoor_space", label: "Outdoor Play Space" },
  { id: "meals_included", label: "Meals Included" },
  { id: "certified_teachers", label: "Certified Teachers" },
  { id: "extended_hours", label: "Extended Hours" },
  { id: "transportation", label: "Transportation Available" },
];

const SPECIAL_NEEDS = [
  { id: "speech_therapy", label: "Speech Therapy" },
  { id: "wheelchair_accessible", label: "Wheelchair Accessible" },
  { id: "sensory_friendly", label: "Sensory-Friendly" },
  { id: "behavioral_support", label: "Behavioral Support" },
];

const LANGUAGES = [
  { id: "spanish", label: "Spanish" },
  { id: "mandarin", label: "Mandarin" },
  { id: "cantonese", label: "Cantonese" },
  { id: "russian", label: "Russian" },
  { id: "arabic", label: "Arabic" },
  { id: "french", label: "French" },
];

interface ChildAge {
  age: number;
  ageUnit: "months" | "years";
}

export function FamilyProfileWizard({ isOpen, onClose, onComplete }: FamilyProfileWizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form state
  const [childrenAges, setChildrenAges] = useState<ChildAge[]>([{ age: 3, ageUnit: "years" }]);
  const [preferredBorough, setPreferredBorough] = useState("");
  const [preferredZipCode, setPreferredZipCode] = useState("");
  const [maxDistanceMiles, setMaxDistanceMiles] = useState(5);
  const [scheduleType, setScheduleType] = useState("");
  const [budgetMin, setBudgetMin] = useState(500);
  const [budgetMax, setBudgetMax] = useState(2000);
  const [needsSubsidy, setNeedsSubsidy] = useState(false);
  const [mustHaveFeatures, setMustHaveFeatures] = useState<string[]>([]);
  const [specialNeeds, setSpecialNeeds] = useState<string[]>([]);
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);

  // Fetch existing profile
  const { data: existingProfile } = useQuery<FamilyProfile | null>({
    queryKey: ['/api/family-profile'],
    enabled: isOpen,
  });

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (profile: Partial<FamilyProfile>) => {
      return apiRequest('POST', '/api/family-profile', profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/family-profile'] });
      toast({
        title: "Profile saved!",
        description: "We'll use this to find your perfect matches.",
      });
      onComplete?.();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error saving profile",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    saveProfileMutation.mutate({
      childrenAges: childrenAges as any,
      preferredBorough,
      preferredZipCode,
      maxDistanceMiles,
      scheduleType: scheduleType as any,
      budgetMin,
      budgetMax,
      needsSubsidy,
      mustHaveFeatures: mustHaveFeatures as any,
      specialNeeds: specialNeeds as any,
      preferredLanguages: preferredLanguages as any,
      isComplete: true,
      completedSteps: STEPS.map(s => s.id) as any,
    });
  };

  const addChild = () => {
    setChildrenAges([...childrenAges, { age: 1, ageUnit: "years" }]);
  };

  const removeChild = (index: number) => {
    setChildrenAges(childrenAges.filter((_, i) => i !== index));
  };

  const updateChild = (index: number, field: keyof ChildAge, value: any) => {
    const updated = [...childrenAges];
    updated[index] = { ...updated[index], [field]: value };
    setChildrenAges(updated);
  };

  const toggleArrayItem = (array: string[], setArray: (arr: string[]) => void, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case "children":
        return (
          <div className="space-y-6">
            <p className="text-text-muted">
              Add all children who will need care. This helps us find providers with the right age ranges.
            </p>
            
            {childrenAges.map((child, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-brand-sage/30 rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                      type="number"
                      min={0}
                      max={child.ageUnit === "months" ? 36 : 18}
                      value={child.age}
                      onChange={(e) => updateChild(index, "age", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <RadioGroup 
                      value={child.ageUnit} 
                      onValueChange={(v) => updateChild(index, "ageUnit", v)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="months" id={`months-${index}`} />
                        <Label htmlFor={`months-${index}`}>Months</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="years" id={`years-${index}`} />
                        <Label htmlFor={`years-${index}`}>Years</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                {childrenAges.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeChild(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button variant="outline" onClick={addChild} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Add Another Child
            </Button>
          </div>
        );

      case "location":
        return (
          <div className="space-y-6">
            <p className="text-text-muted">
              We'll prioritize providers close to your preferred location.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Preferred Borough</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BOROUGHS.map((borough) => (
                    <Button
                      key={borough}
                      variant={preferredBorough === borough ? "default" : "outline"}
                      onClick={() => setPreferredBorough(borough)}
                      className={preferredBorough === borough ? "bg-action-teal hover:bg-action-teal/90" : ""}
                    >
                      {borough}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Zip Code (optional)</Label>
                <Input
                  placeholder="e.g., 11201"
                  value={preferredZipCode}
                  onChange={(e) => setPreferredZipCode(e.target.value)}
                  maxLength={5}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Maximum Distance: {maxDistanceMiles} miles</Label>
                <Slider
                  value={[maxDistanceMiles]}
                  onValueChange={(v) => setMaxDistanceMiles(v[0])}
                  min={1}
                  max={15}
                  step={1}
                  className="py-4"
                />
              </div>
            </div>
          </div>
        );

      case "schedule":
        return (
          <div className="space-y-6">
            <p className="text-text-muted">
              What kind of schedule works best for your family?
            </p>
            
            <RadioGroup value={scheduleType} onValueChange={setScheduleType} className="space-y-3">
              {SCHEDULE_TYPES.map((type) => (
                <div key={type.value} className="flex items-start space-x-3">
                  <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                  <Label htmlFor={type.value} className="cursor-pointer">
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-text-muted">{type.description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case "budget":
        return (
          <div className="space-y-6">
            <p className="text-text-muted">
              Set your monthly budget range. We'll show providers within your range first.
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum ($/month)</Label>
                  <Input
                    type="number"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum ($/month)</Label>
                  <Input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(parseInt(e.target.value) || 0)}
                    min={budgetMin}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-brand-sage/30 rounded-lg">
                <Checkbox
                  id="needsSubsidy"
                  checked={needsSubsidy}
                  onCheckedChange={(checked) => setNeedsSubsidy(!!checked)}
                />
                <Label htmlFor="needsSubsidy" className="cursor-pointer">
                  <div className="font-medium">I need a provider that accepts subsidies</div>
                  <div className="text-sm text-text-muted">CCAP, vouchers, or government assistance</div>
                </Label>
              </div>
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-6">
            <p className="text-text-muted">
              Select any features that are important to you. Must-haves will filter results.
            </p>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Must-Have Features</Label>
                <div className="flex flex-wrap gap-2">
                  {MUST_HAVE_FEATURES.map((feature) => (
                    <Badge
                      key={feature.id}
                      variant={mustHaveFeatures.includes(feature.id) ? "default" : "outline"}
                      className={`cursor-pointer py-2 px-3 ${
                        mustHaveFeatures.includes(feature.id) 
                          ? "bg-action-teal hover:bg-action-teal/90" 
                          : "hover:bg-brand-sage/50"
                      }`}
                      onClick={() => toggleArrayItem(mustHaveFeatures, setMustHaveFeatures, feature.id)}
                    >
                      {mustHaveFeatures.includes(feature.id) && <Check className="h-3 w-3 mr-1" />}
                      {feature.label}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Special Needs Support</Label>
                <div className="flex flex-wrap gap-2">
                  {SPECIAL_NEEDS.map((need) => (
                    <Badge
                      key={need.id}
                      variant={specialNeeds.includes(need.id) ? "default" : "outline"}
                      className={`cursor-pointer py-2 px-3 ${
                        specialNeeds.includes(need.id) 
                          ? "bg-action-teal hover:bg-action-teal/90" 
                          : "hover:bg-brand-sage/50"
                      }`}
                      onClick={() => toggleArrayItem(specialNeeds, setSpecialNeeds, need.id)}
                    >
                      {specialNeeds.includes(need.id) && <Check className="h-3 w-3 mr-1" />}
                      {need.label}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Preferred Languages (besides English)</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <Badge
                      key={lang.id}
                      variant={preferredLanguages.includes(lang.id) ? "default" : "outline"}
                      className={`cursor-pointer py-2 px-3 ${
                        preferredLanguages.includes(lang.id) 
                          ? "bg-action-teal hover:bg-action-teal/90" 
                          : "hover:bg-brand-sage/50"
                      }`}
                      onClick={() => toggleArrayItem(preferredLanguages, setPreferredLanguages, lang.id)}
                    >
                      {preferredLanguages.includes(lang.id) && <Check className="h-3 w-3 mr-1" />}
                      {lang.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const CurrentIcon = STEPS[currentStep].icon;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-action-teal/10 rounded-lg">
              <CurrentIcon className="h-5 w-5 text-action-teal" />
            </div>
            <div>
              <DialogTitle className="text-xl text-brand-evergreen">
                {STEPS[currentStep].title}
              </DialogTitle>
              <DialogDescription>
                {STEPS[currentStep].description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-1 my-4">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-1 rounded-full transition-colors ${
                index <= currentStep ? "bg-action-teal" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="py-4">
          {renderStepContent()}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={currentStep === 0 ? onClose : handleBack}
          >
            {currentStep === 0 ? (
              "Skip for now"
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </>
            )}
          </Button>
          
          <Button
            onClick={isLastStep ? handleComplete : handleNext}
            disabled={saveProfileMutation.isPending}
            className="bg-action-clay hover:bg-action-clay/90"
          >
            {saveProfileMutation.isPending ? (
              "Saving..."
            ) : isLastStep ? (
              <>
                <Sparkles className="h-4 w-4 mr-2" /> Find My Matches
              </>
            ) : (
              <>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
