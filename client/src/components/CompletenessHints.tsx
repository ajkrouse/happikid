import { CheckCircle, Circle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CompletenessHintsProps {
  providerType: string;
  formData: any;
  followupData: any;
  className?: string;
}

interface ScoringCriteria {
  field: string;
  label: string;
  points: number;
  validator: (data: any, followup: any) => boolean;
}

const SCORING_TEMPLATES: Record<string, ScoringCriteria[]> = {
  daycare: [
    { field: 'license_photo', label: 'License photo uploaded', points: 10, validator: (d, f) => !!d.details?.daycare?.license_photo_url },
    { field: 'license_id', label: 'License ID provided', points: 10, validator: (d, f) => !!d.details?.daycare?.state_license_id },
    { field: 'staff_ratio', label: 'Staff-to-child ratio set', points: 10, validator: (d, f) => !!d.details?.daycare?.staff_to_child_ratio },
    { field: 'inspection', label: 'Last inspection date', points: 6, validator: (d, f) => !!d.details?.daycare?.last_inspection_date },
    { field: 'age_range', label: 'Age range specified', points: 8, validator: (d, f) => d.minAgeMonths != null && d.maxAgeMonths != null },
    { field: 'capacity', label: 'Licensed capacity set', points: 8, validator: (d, f) => !!d.totalCapacity },
    { field: 'features', label: '5+ features selected', points: 8, validator: (d, f) => (d.featuresNew?.length || 0) >= 5 },
    { field: 'languages', label: 'Languages spoken listed', points: 6, validator: (d, f) => (d.details?.daycare?.languages_spoken?.length || 0) > 0 },
    { field: 'meals', label: 'Meal options specified', points: 6, validator: (d, f) => !!d.details?.daycare?.meals_provided },
    { field: 'description', label: 'Complete description', points: 12, validator: (d, f) => (d.description?.length || 0) >= 100 },
    { field: 'photos', label: 'Photos uploaded', points: 14, validator: (d, f) => false } // Placeholder for photos step
  ],
  afterschool: [
    { field: 'schedule', label: 'Weekdays & times set', points: 18, validator: (d, f) => (d.details?.afterschool?.weekdays?.length || 0) > 0 },
    { field: 'transportation', label: 'Transportation details', points: 8, validator: (d, f) => d.details?.afterschool?.pickup_transportation !== undefined },
    { field: 'homework_level', label: 'Homework support level', points: 8, validator: (d, f) => !!d.details?.afterschool?.homework_support_level },
    { field: 'age_range', label: 'Age range specified', points: 8, validator: (d, f) => d.minAgeMonths != null && d.maxAgeMonths != null },
    { field: 'capacity', label: 'Total capacity set', points: 8, validator: (d, f) => !!d.totalCapacity },
    { field: 'features', label: '5+ features selected', points: 8, validator: (d, f) => (d.featuresNew?.length || 0) >= 5 },
    { field: 'tutoring', label: 'Tutoring subjects (if applicable)', points: 6, validator: (d, f) => d.details?.afterschool?.homework_support_level !== 'tutoring' || (f.tutoring_subjects?.length || 0) > 0 },
    { field: 'description', label: 'Complete description', points: 12, validator: (d, f) => (d.description?.length || 0) >= 100 },
    { field: 'photos', label: 'Photos uploaded', points: 14, validator: (d, f) => false }
  ],
  camp: [
    { field: 'sessions', label: 'At least 1 session', points: 30, validator: (d, f) => (d.details?.camp?.sessions?.length || 0) >= 1 },
    { field: 'extended_care', label: 'Extended care options', points: 8, validator: (d, f) => d.details?.camp?.extended_care_am || d.details?.camp?.extended_care_pm },
    { field: 'water_safety', label: 'Water safety (if applicable)', points: 6, validator: (d, f) => !d.details?.camp?.water_activities || d.details?.camp?.lifeguard_certified },
    { field: 'age_range', label: 'Age range specified', points: 8, validator: (d, f) => d.minAgeMonths != null && d.maxAgeMonths != null },
    { field: 'capacity', label: 'Total capacity set', points: 8, validator: (d, f) => !!d.totalCapacity },
    { field: 'features', label: '5+ features selected', points: 8, validator: (d, f) => (d.featuresNew?.length || 0) >= 5 },
    { field: 'description', label: 'Complete description', points: 12, validator: (d, f) => (d.description?.length || 0) >= 100 },
    { field: 'photos', label: 'Photos uploaded', points: 10, validator: (d, f) => false }
  ],
  school: [
    { field: 'accreditation', label: 'Accreditation listed', points: 12, validator: (d, f) => (d.details?.school?.accreditations?.length || 0) > 0 },
    { field: 'tuition', label: 'Tuition range set', points: 12, validator: (d, f) => d.details?.school?.tuition_min && d.details?.school?.tuition_max },
    { field: 'student_ratio', label: 'Student:teacher ratio', points: 10, validator: (d, f) => !!d.details?.school?.student_teacher_ratio },
    { field: 'class_sizes', label: 'Class sizes specified', points: 8, validator: (d, f) => d.details?.school?.class_size_min && d.details?.school?.class_size_max },
    { field: 'grade_range', label: 'Grade range specified', points: 8, validator: (d, f) => !!d.details?.school?.grade_range },
    { field: 'care_programs', label: 'Before/after-care programs', points: 8, validator: (d, f) => d.details?.school?.before_care || d.details?.school?.after_care },
    { field: 'features', label: '6+ features selected', points: 10, validator: (d, f) => (d.featuresNew?.length || 0) >= 6 },
    { field: 'programs', label: 'Academic/support programs', points: 12, validator: (d, f) => (d.details?.school?.language_programs?.length || 0) + (d.details?.school?.advanced_programs?.length || 0) + (d.details?.school?.support_services?.length || 0) >= 3 },
    { field: 'description', label: 'Complete description', points: 10, validator: (d, f) => (d.description?.length || 0) >= 100 }
  ]
};

export function CompletenessHints({ providerType, formData, followupData, className }: CompletenessHintsProps) {
  if (!providerType || !SCORING_TEMPLATES[providerType]) {
    return null;
  }

  const criteria = SCORING_TEMPLATES[providerType];
  const results = criteria.map(criterion => ({
    ...criterion,
    completed: criterion.validator(formData, followupData)
  }));

  const completedPoints = results.filter(r => r.completed).reduce((sum, r) => sum + r.points, 0);
  const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
  const completionPercent = Math.round((completedPoints / totalPoints) * 100);

  // Get top 3 missing items with highest points
  const missingItems = results
    .filter(r => !r.completed)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  return (
    <div className={className}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-blue-900">Profile Completeness</h4>
          <Badge variant={completionPercent >= 80 ? "default" : "secondary"}>
            {completionPercent}%
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-blue-100 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        {missingItems.length > 0 ? (
          <div>
            <p className="text-sm text-blue-800 font-medium mb-2">
              Next steps to improve your profile:
            </p>
            <div className="space-y-2">
              {missingItems.map((item, index) => (
                <div key={item.field} className="flex items-center gap-2">
                  <Circle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700">{item.label}</span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    +{item.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">All core requirements completed!</span>
          </div>
        )}

        {completionPercent < 70 && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            <AlertCircle className="h-3 w-3 inline mr-1" />
            Profiles with 70%+ completion get 3x more parent views
          </div>
        )}
      </div>
    </div>
  );
}