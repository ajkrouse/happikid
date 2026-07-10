import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Info, Shield } from "lucide-react";
import type { OnboardingFormData } from "@/types/onboarding";

interface StepVerificationProps {
  formData: OnboardingFormData;
  onFormDataChange: (updates: Partial<OnboardingFormData>) => void;
  tips?: string[];
}

export function StepVerification({ formData, onFormDataChange, tips }: StepVerificationProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verification & Credentials
          </CardTitle>
          <CardDescription>Add your licensing and accreditation information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="licenseNumber">License Number</Label>
            <Input
              id="licenseNumber"
              value={formData.licenseNumber}
              onChange={(e) => onFormDataChange({ licenseNumber: e.target.value })}
              placeholder="NYC DOH License #123456"
            />
          </div>

          <div>
            <Label htmlFor="accreditationDetails">Accreditation Details</Label>
            <Textarea
              id="accreditationDetails"
              value={formData.accreditationDetails}
              onChange={(e) => onFormDataChange({ accreditationDetails: e.target.value })}
              placeholder="NAEYC Accredited, CPR Certified Staff, etc."
            />
          </div>
        </CardContent>
      </Card>

      {tips && tips.length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <Info className="h-4 w-4 text-red-600 mr-2" />
              <span className="font-medium text-red-900">Pro Tips</span>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {tips.map((tip, i) => <li key={i}>• {tip}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
