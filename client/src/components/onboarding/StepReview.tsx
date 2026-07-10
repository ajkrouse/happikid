import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Star } from "lucide-react";
import type { OnboardingFormData } from "@/types/onboarding";

interface StepReviewProps {
  formData: OnboardingFormData;
  formatAgeRange: (min: number, max: number) => string;
}

export function StepReview({ formData, formatAgeRange }: StepReviewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Review & Publish
          </CardTitle>
          <CardDescription>Review your profile and make it live for parents to find</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-brand-sage p-4 rounded-lg border border-action-teal/30">
            <div className="flex items-center mb-2">
              <CheckCircle className="h-5 w-5 text-action-teal mr-2" />
              <span className="font-medium text-brand-evergreen">Profile Complete!</span>
            </div>
            <p className="text-sm text-text-muted">
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
}
