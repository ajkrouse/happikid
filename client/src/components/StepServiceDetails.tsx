import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Users, Building2, Clock, DollarSign, Calendar } from "lucide-react";
import { AgeRangeChips } from "@/components/AgeRangeChips";
import { ChipInput } from "@/components/ChipInput";
import { FeatureSelector } from "@/components/FeatureSelector";
import { TimeByDayEditor } from "@/components/TimeByDayEditor";
import { SessionRepeater } from "@/components/SessionRepeater";
import { UploadField } from "@/components/UploadField";
import { CompletenessHints } from "@/components/CompletenessHints";

interface FormData {
  type: string;
  minAgeMonths?: number;
  maxAgeMonths?: number;
  totalCapacity?: number;
  featuresNew: string[];
  featuresCustom: string[];
  details: Record<string, any>;
  description: string;
}

interface StepServiceDetailsProps {
  formData: FormData;
  followupData: Record<string, any>;
  onFormDataChange: (data: Partial<FormData>) => void;
  onFollowupDataChange: (data: Record<string, any>) => void;
  className?: string;
}

export function StepServiceDetails({
  formData,
  followupData,
  onFormDataChange,
  onFollowupDataChange,
  className
}: StepServiceDetailsProps) {

  const updateDetails = (typeKey: string, field: string, value: any) => {
    const newDetails = {
      ...formData.details,
      [typeKey]: {
        ...formData.details[typeKey],
        [field]: value
      }
    };
    onFormDataChange({ details: newDetails });
  };

  const renderTypeSpecificFields = () => {
    const typeData = formData.details[formData.type] || {};

    switch (formData.type) {
      case "daycare":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Licensing & Safety</CardTitle>
                <CardDescription>State licensing and safety information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="license-id">State License ID *</Label>
                    <Input
                      id="license-id"
                      value={typeData.state_license_id || ''}
                      onChange={(e) => updateDetails('daycare', 'state_license_id', e.target.value)}
                      placeholder="e.g., NJ1234567"
                      data-testid="input-license-id"
                    />
                  </div>
                  <div>
                    <Label htmlFor="inspection-date">Last Inspection Date</Label>
                    <Input
                      id="inspection-date"
                      type="date"
                      value={typeData.last_inspection_date || ''}
                      onChange={(e) => updateDetails('daycare', 'last_inspection_date', e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      data-testid="input-inspection-date"
                    />
                    <p className="text-xs text-gray-500 mt-1">Most recent state/local inspection</p>
                  </div>
                </div>

                <UploadField
                  label="License Photo"
                  value={typeData.license_photo_url || ''}
                  onChange={(url) => updateDetails('daycare', 'license_photo_url', url)}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="staff-ratio">Staff-to-Child Ratio *</Label>
                    <Input
                      id="staff-ratio"
                      type="number"
                      step="0.1"
                      value={typeData.staff_to_child_ratio || ''}
                      onChange={(e) => updateDetails('daycare', 'staff_to_child_ratio', parseFloat(e.target.value) || '')}
                      placeholder="e.g., 4.0"
                      data-testid="input-staff-ratio"
                    />
                    <p className="text-xs text-gray-500 mt-1">Typical 3–4 yrs 1:10–1:12; infants 1:3–1:4 (varies by state)</p>
                  </div>
                  <div>
                    <Label htmlFor="group-size">Max Group Size</Label>
                    <Input
                      id="group-size"
                      type="number"
                      value={typeData.max_group_size || ''}
                      onChange={(e) => updateDetails('daycare', 'max_group_size', parseInt(e.target.value) || '')}
                      placeholder="12"
                      data-testid="input-group-size"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Care Details</CardTitle>
                <CardDescription>Age groups and specialized care options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Care Types Offered</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {['infant', 'toddler', 'preschool', 'pre_k'].map(careType => (
                      <div key={careType} className="flex items-center space-x-2">
                        <Checkbox
                          id={`care-${careType}`}
                          checked={(typeData.care_types || []).includes(careType)}
                          onCheckedChange={(checked) => {
                            const currentTypes = typeData.care_types || [];
                            const newTypes = checked 
                              ? [...currentTypes, careType]
                              : currentTypes.filter(t => t !== careType);
                            updateDetails('daycare', 'care_types', newTypes);
                          }}
                          data-testid={`checkbox-care-${careType}`}
                        />
                        <Label htmlFor={`care-${careType}`} className="capitalize">
                          {careType.replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {(typeData.care_types || []).includes('infant') && (
                  <div>
                    <Label htmlFor="crib-count">Number of Cribs *</Label>
                    <Input
                      id="crib-count"
                      type="number"
                      value={typeData.crib_count || ''}
                      onChange={(e) => updateDetails('daycare', 'crib_count', parseInt(e.target.value) || '')}
                      placeholder="6"
                      min="1"
                      required
                      data-testid="input-crib-count"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="diapering"
                      checked={typeData.diapering_supported || false}
                      onCheckedChange={(checked) => updateDetails('daycare', 'diapering_supported', checked)}
                      data-testid="checkbox-diapering"
                    />
                    <Label htmlFor="diapering">Diapering Support</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="potty-training"
                      checked={typeData.potty_training_support || false}
                      onCheckedChange={(checked) => updateDetails('daycare', 'potty_training_support', checked)}
                      data-testid="checkbox-potty-training"
                    />
                    <Label htmlFor="potty-training">Potty Training Support</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="meals">Meals Provided</Label>
                  <Select
                    value={typeData.meals_provided || ''}
                    onValueChange={(value) => updateDetails('daycare', 'meals_provided', value)}
                  >
                    <SelectTrigger data-testid="select-meals">
                      <SelectValue placeholder="Select meal options" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No meals provided</SelectItem>
                      <SelectItem value="snacks">Snacks only</SelectItem>
                      <SelectItem value="breakfast_lunch">Breakfast & Lunch</SelectItem>
                      <SelectItem value="all_meals">All meals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <ChipInput
                  label="Languages Spoken"
                  value={typeData.languages_spoken || []}
                  onChange={(languages) => updateDetails('daycare', 'languages_spoken', languages)}
                  placeholder="e.g., Spanish, French, Mandarin"
                  maxItems={5}
                />
              </CardContent>
            </Card>
          </div>
        );

      case "afterschool":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Schedule & Operations</CardTitle>
                <CardDescription>Operating days and hours</CardDescription>
              </CardHeader>
              <CardContent>
                <TimeByDayEditor
                  label="Operating Days & Hours"
                  selectedDays={typeData.weekdays || []}
                  timeData={typeData.start_time_by_day && typeData.end_time_by_day ? 
                    Object.keys(typeData.start_time_by_day).reduce((acc, day) => {
                      acc[day] = {
                        start_time: typeData.start_time_by_day[day],
                        end_time: typeData.end_time_by_day[day]
                      };
                      return acc;
                    }, {} as Record<string, any>) : {}
                  }
                  onDaysChange={(days) => updateDetails('afterschool', 'weekdays', days)}
                  onTimeChange={(timeData) => {
                    const startTimes = {} as Record<string, string>;
                    const endTimes = {} as Record<string, string>;
                    Object.entries(timeData).forEach(([day, times]) => {
                      startTimes[day] = times.start_time;
                      endTimes[day] = times.end_time;
                    });
                    updateDetails('afterschool', 'start_time_by_day', startTimes);
                    updateDetails('afterschool', 'end_time_by_day', endTimes);
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transportation & Pickup</CardTitle>
                <CardDescription>School pickup and transportation services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="transportation"
                    checked={typeData.pickup_transportation || false}
                    onCheckedChange={(checked) => updateDetails('afterschool', 'pickup_transportation', checked)}
                    data-testid="checkbox-transportation"
                  />
                  <Label htmlFor="transportation">We provide school pickup/transportation</Label>
                </div>

                {typeData.pickup_transportation && (
                  <ChipInput
                    label="Schools We Serve"
                    value={followupData.pickup_schools || []}
                    onChange={(schools) => onFollowupDataChange({ ...followupData, pickup_schools: schools })}
                    placeholder="e.g., Washington Elementary, Lincoln Middle School"
                    required
                    maxItems={10}
                  />
                )}

                <div>
                  <Label htmlFor="late-pickup">Late Pickup Policy</Label>
                  <Textarea
                    id="late-pickup"
                    value={typeData.late_pickup_policy || ''}
                    onChange={(e) => updateDetails('afterschool', 'late_pickup_policy', e.target.value)}
                    placeholder="Describe your late pickup policy and any associated fees..."
                    rows={3}
                    data-testid="textarea-late-pickup"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Academic Support</CardTitle>
                <CardDescription>Homework help and tutoring services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="homework-level">Homework Support Level *</Label>
                  <Select
                    value={typeData.homework_support_level || ''}
                    onValueChange={(value) => updateDetails('afterschool', 'homework_support_level', value)}
                  >
                    <SelectTrigger data-testid="select-homework-level">
                      <SelectValue placeholder="Select support level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light supervision (quiet study time)</SelectItem>
                      <SelectItem value="structured">Structured homework time with help</SelectItem>
                      <SelectItem value="tutoring">One-on-one tutoring available</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {typeData.homework_support_level === 'tutoring' && (
                  <ChipInput
                    label="Tutoring Subjects"
                    value={followupData.tutoring_subjects || []}
                    onChange={(subjects) => onFollowupDataChange({ ...followupData, tutoring_subjects: subjects })}
                    placeholder="e.g., Math, Science, Reading, Writing"
                    required
                    maxItems={8}
                  />
                )}

                <div>
                  <Label htmlFor="seasonal">Seasonal Availability</Label>
                  <Select
                    value={typeData.seasonal_availability || ''}
                    onValueChange={(value) => updateDetails('afterschool', 'seasonal_availability', value)}
                  >
                    <SelectTrigger data-testid="select-seasonal">
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="school_year">School year only</SelectItem>
                      <SelectItem value="year_round">Year-round</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "camp":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Camp Sessions</CardTitle>
                <CardDescription>Define your camp sessions with dates, pricing, and age groups</CardDescription>
              </CardHeader>
              <CardContent>
                <SessionRepeater
                  sessions={typeData.sessions || []}
                  onChange={(sessions) => updateDetails('camp', 'sessions', sessions)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Extended Care Options</CardTitle>
                <CardDescription>Before and after regular camp hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Checkbox
                        id="extended-am"
                        checked={typeData.extended_care_am || false}
                        onCheckedChange={(checked) => updateDetails('camp', 'extended_care_am', checked)}
                        data-testid="checkbox-extended-am"
                      />
                      <Label htmlFor="extended-am" className="font-medium">Morning Extended Care</Label>
                    </div>
                    {typeData.extended_care_am && (
                      <div className="ml-6 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="am-start">Start Time</Label>
                            <Input
                              id="am-start"
                              type="time"
                              value={typeData.extended_care_am_start || ''}
                              onChange={(e) => updateDetails('camp', 'extended_care_am_start', e.target.value)}
                              data-testid="input-am-start"
                            />
                          </div>
                          <div>
                            <Label htmlFor="am-end">End Time</Label>
                            <Input
                              id="am-end"
                              type="time"
                              value={typeData.extended_care_am_end || ''}
                              onChange={(e) => updateDetails('camp', 'extended_care_am_end', e.target.value)}
                              data-testid="input-am-end"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="am-fee">Additional Fee</Label>
                          <div className="flex">
                            <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md">
                              <DollarSign className="h-4 w-4 text-gray-500" />
                            </div>
                            <Input
                              id="am-fee"
                              type="number"
                              value={typeData.extended_care_am_fee || ''}
                              onChange={(e) => updateDetails('camp', 'extended_care_am_fee', parseFloat(e.target.value) || '')}
                              placeholder="25"
                              className="rounded-l-none"
                              data-testid="input-am-fee"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Checkbox
                        id="extended-pm"
                        checked={typeData.extended_care_pm || false}
                        onCheckedChange={(checked) => updateDetails('camp', 'extended_care_pm', checked)}
                        data-testid="checkbox-extended-pm"
                      />
                      <Label htmlFor="extended-pm" className="font-medium">Afternoon Extended Care</Label>
                    </div>
                    {typeData.extended_care_pm && (
                      <div className="ml-6 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="pm-start">Start Time</Label>
                            <Input
                              id="pm-start"
                              type="time"
                              value={typeData.extended_care_pm_start || ''}
                              onChange={(e) => updateDetails('camp', 'extended_care_pm_start', e.target.value)}
                              data-testid="input-pm-start"
                            />
                          </div>
                          <div>
                            <Label htmlFor="pm-end">End Time</Label>
                            <Input
                              id="pm-end"
                              type="time"
                              value={typeData.extended_care_pm_end || ''}
                              onChange={(e) => updateDetails('camp', 'extended_care_pm_end', e.target.value)}
                              data-testid="input-pm-end"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="pm-fee">Additional Fee</Label>
                          <div className="flex">
                            <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md">
                              <DollarSign className="h-4 w-4 text-gray-500" />
                            </div>
                            <Input
                              id="pm-fee"
                              type="number"
                              value={typeData.extended_care_pm_fee || ''}
                              onChange={(e) => updateDetails('camp', 'extended_care_pm_fee', parseFloat(e.target.value) || '')}
                              placeholder="30"
                              className="rounded-l-none"
                              data-testid="input-pm-fee"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Safety & Special Programs</CardTitle>
                <CardDescription>Water activities and overnight programs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="water-activities"
                    checked={typeData.water_activities || false}
                    onCheckedChange={(checked) => updateDetails('camp', 'water_activities', checked)}
                    data-testid="checkbox-water-activities"
                  />
                  <Label htmlFor="water-activities">Water activities (swimming, water sports)</Label>
                </div>

                {typeData.water_activities && (
                  <div className="ml-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="lifeguard"
                        checked={typeData.lifeguard_certified || false}
                        onCheckedChange={(checked) => updateDetails('camp', 'lifeguard_certified', checked)}
                        data-testid="checkbox-lifeguard"
                        required
                      />
                      <Label htmlFor="lifeguard">Lifeguard certified staff present *</Label>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overnight"
                    checked={typeData.overnight || false}
                    onCheckedChange={(checked) => updateDetails('camp', 'overnight', checked)}
                    data-testid="checkbox-overnight"
                  />
                  <Label htmlFor="overnight">Overnight programs available</Label>
                </div>

                {typeData.overnight && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <Label htmlFor="lodging">Lodging Description</Label>
                      <Textarea
                        id="lodging"
                        value={typeData.lodging_description || ''}
                        onChange={(e) => updateDetails('camp', 'lodging_description', e.target.value)}
                        placeholder="Describe cabin arrangements, amenities, supervision..."
                        rows={3}
                        data-testid="textarea-lodging"
                      />
                    </div>
                    <div>
                      <Label htmlFor="overnight-ratio">Overnight Staff-to-Camper Ratio</Label>
                      <Input
                        id="overnight-ratio"
                        type="number"
                        step="0.1"
                        value={typeData.overnight_ratio || ''}
                        onChange={(e) => updateDetails('camp', 'overnight_ratio', parseFloat(e.target.value) || '')}
                        placeholder="e.g., 8.0"
                        data-testid="input-overnight-ratio"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "school":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">School Details</CardTitle>
                <CardDescription>Basic school information and accreditation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ChipInput
                  label="Accreditations"
                  value={typeData.accreditations || []}
                  onChange={(accreditations) => updateDetails('school', 'accreditations', accreditations)}
                  placeholder="e.g., NAIS, State, Cognia, AdvancED"
                  maxItems={5}
                />

                <div>
                  <Label htmlFor="grade-range">Grade Range *</Label>
                  <Select
                    value={typeData.grade_range || ''}
                    onValueChange={(value) => updateDetails('school', 'grade_range', value)}
                  >
                    <SelectTrigger data-testid="select-grade-range">
                      <SelectValue placeholder="Select grade range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PK-5">Pre-K through 5th grade</SelectItem>
                      <SelectItem value="K-8">Kindergarten through 8th grade</SelectItem>
                      <SelectItem value="6-12">6th through 12th grade</SelectItem>
                      <SelectItem value="9-12">9th through 12th grade (High School)</SelectItem>
                      <SelectItem value="K-12">Kindergarten through 12th grade</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tuition-min">Tuition Range (Annual) *</Label>
                    <div className="flex">
                      <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input
                        id="tuition-min"
                        type="number"
                        value={typeData.tuition_min || ''}
                        onChange={(e) => updateDetails('school', 'tuition_min', parseInt(e.target.value) || '')}
                        placeholder="15000"
                        className="rounded-none"
                        data-testid="input-tuition-min"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tuition-max">to</Label>
                    <div className="flex">
                      <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input
                        id="tuition-max"
                        type="number"
                        value={typeData.tuition_max || ''}
                        onChange={(e) => updateDetails('school', 'tuition_max', parseInt(e.target.value) || '')}
                        placeholder="35000"
                        className="rounded-l-none"
                        data-testid="input-tuition-max"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="financial-aid"
                    checked={typeData.financial_aid_available || false}
                    onCheckedChange={(checked) => updateDetails('school', 'financial_aid_available', checked)}
                    data-testid="checkbox-financial-aid"
                  />
                  <Label htmlFor="financial-aid">Financial aid available</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Class Structure</CardTitle>
                <CardDescription>Student ratios and class sizes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="student-ratio">Student-to-Teacher Ratio *</Label>
                  <Input
                    id="student-ratio"
                    type="number"
                    step="0.1"
                    value={typeData.student_teacher_ratio || ''}
                    onChange={(e) => updateDetails('school', 'student_teacher_ratio', parseFloat(e.target.value) || '')}
                    placeholder="e.g., 12.0"
                    data-testid="input-student-ratio"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="class-min">Class Size Range *</Label>
                    <Input
                      id="class-min"
                      type="number"
                      value={typeData.class_size_min || ''}
                      onChange={(e) => updateDetails('school', 'class_size_min', parseInt(e.target.value) || '')}
                      placeholder="8"
                      data-testid="input-class-min"
                    />
                  </div>
                  <div>
                    <Label htmlFor="class-max">to</Label>
                    <Input
                      id="class-max"
                      type="number"
                      value={typeData.class_size_max || ''}
                      onChange={(e) => updateDetails('school', 'class_size_max', parseInt(e.target.value) || '')}
                      placeholder="18"
                      data-testid="input-class-max"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Extended Care Programs</CardTitle>
                <CardDescription>Before and after school care options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id="before-care"
                      checked={typeData.before_care || false}
                      onCheckedChange={(checked) => updateDetails('school', 'before_care', checked)}
                      data-testid="checkbox-before-care"
                    />
                    <Label htmlFor="before-care" className="font-medium">Before School Care</Label>
                  </div>
                  {typeData.before_care && (
                    <div className="ml-6 grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="before-start">Start Time</Label>
                        <Input
                          id="before-start"
                          type="time"
                          value={typeData.before_care_start || ''}
                          onChange={(e) => updateDetails('school', 'before_care_start', e.target.value)}
                          data-testid="input-before-start"
                        />
                      </div>
                      <div>
                        <Label htmlFor="before-end">End Time</Label>
                        <Input
                          id="before-end"
                          type="time"
                          value={typeData.before_care_end || ''}
                          onChange={(e) => updateDetails('school', 'before_care_end', e.target.value)}
                          data-testid="input-before-end"
                        />
                      </div>
                      <div>
                        <Label htmlFor="before-fee">Fee</Label>
                        <Input
                          id="before-fee"
                          type="number"
                          value={typeData.before_care_fee || ''}
                          onChange={(e) => updateDetails('school', 'before_care_fee', parseFloat(e.target.value) || '')}
                          placeholder="150"
                          data-testid="input-before-fee"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id="after-care"
                      checked={typeData.after_care || false}
                      onCheckedChange={(checked) => updateDetails('school', 'after_care', checked)}
                      data-testid="checkbox-after-care"
                    />
                    <Label htmlFor="after-care" className="font-medium">After School Care</Label>
                  </div>
                  {typeData.after_care && (
                    <div className="ml-6 grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="after-start">Start Time</Label>
                        <Input
                          id="after-start"
                          type="time"
                          value={typeData.after_care_start || ''}
                          onChange={(e) => updateDetails('school', 'after_care_start', e.target.value)}
                          data-testid="input-after-start"
                        />
                      </div>
                      <div>
                        <Label htmlFor="after-end">End Time</Label>
                        <Input
                          id="after-end"
                          type="time"
                          value={typeData.after_care_end || ''}
                          onChange={(e) => updateDetails('school', 'after_care_end', e.target.value)}
                          data-testid="input-after-end"
                        />
                      </div>
                      <div>
                        <Label htmlFor="after-fee">Fee</Label>
                        <Input
                          id="after-fee"
                          type="number"
                          value={typeData.after_care_fee || ''}
                          onChange={(e) => updateDetails('school', 'after_care_fee', parseFloat(e.target.value) || '')}
                          placeholder="200"
                          data-testid="input-after-fee"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Academic Programs</CardTitle>
                <CardDescription>Languages, advanced programs, and support services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ChipInput
                  label="Language Programs"
                  value={typeData.language_programs || []}
                  onChange={(programs) => updateDetails('school', 'language_programs', programs)}
                  placeholder="e.g., Spanish, French, Mandarin, Latin"
                  maxItems={8}
                />

                <ChipInput
                  label="Advanced Programs"
                  value={typeData.advanced_programs || []}
                  onChange={(programs) => updateDetails('school', 'advanced_programs', programs)}
                  placeholder="e.g., AP, IB, Honors, Dual Enrollment"
                  maxItems={6}
                />

                <ChipInput
                  label="Support Services"
                  value={typeData.support_services || []}
                  onChange={(services) => updateDetails('school', 'support_services', services)}
                  placeholder="e.g., Counseling, Learning Support, Speech Therapy"
                  maxItems={8}
                />
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Please select a provider type first to see specific details</p>
          </div>
        );
    }
  };

  return (
    <div className={className}>
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
        <CardContent className="space-y-6">
          {/* Provider Type */}
          <div>
            <Label htmlFor="type">Provider Type *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => onFormDataChange({ type: value })}
            >
              <SelectTrigger data-testid="select-provider-type">
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

          {/* Age Range */}
          <AgeRangeChips
            minAgeMonths={formData.minAgeMonths}
            maxAgeMonths={formData.maxAgeMonths}
            onChange={(min, max) => onFormDataChange({ minAgeMonths: min, maxAgeMonths: max })}
          />

          {/* Capacity */}
          <div>
            <Label htmlFor="capacity">
              {formData.type === 'daycare' ? 'Licensed Capacity' : 'Total Capacity'} *
            </Label>
            <Input
              id="capacity"
              type="number"
              value={formData.totalCapacity || ''}
              onChange={(e) => onFormDataChange({ totalCapacity: parseInt(e.target.value) || undefined })}
              placeholder="24"
              min="1"
              data-testid="input-total-capacity"
            />
          </div>

          {/* Features */}
          <FeatureSelector
            providerType={formData.type}
            selectedFeatures={formData.featuresNew || []}
            followupData={followupData}
            onChange={(features, followupData) => {
              onFormDataChange({ featuresNew: features });
              onFollowupDataChange(followupData);
            }}
          />

          {/* Custom Features */}
          <ChipInput
            label="Additional Features"
            value={formData.featuresCustom || []}
            onChange={(features) => onFormDataChange({ featuresCustom: features })}
            placeholder="Add unique features not listed above..."
            maxItems={5}
          />
        </CardContent>
      </Card>

      {/* Type-specific fields */}
      {formData.type && renderTypeSpecificFields()}

      {/* Completeness hints */}
      <CompletenessHints
        providerType={formData.type}
        formData={formData}
        followupData={followupData}
      />
    </div>
  );
}