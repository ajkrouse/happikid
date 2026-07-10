export interface LocationEntry {
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
}

export interface UploadedImage {
  id?: number;
  url: string;
  caption: string;
  isPrimary: boolean;
}

export interface OnboardingFormData {
  name: string;
  description: string;
  address: string;
  borough: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  type: string;
  ageRangeMin: string;
  ageRangeMax: string;
  minAgeMonths?: number;
  maxAgeMonths?: number;
  totalCapacity?: number;
  featuresNew: string[];
  featuresCustom: string[];
  details: Record<string, any>;
  capacity: string;
  monthlyPrice: string;
  monthlyPriceMin: string;
  monthlyPriceMax: string;
  showExactPrice: boolean;
  hoursOpen: string;
  hoursClose: string;
  schedule: Record<string, { open: string; close: string; isOpen: boolean }>;
  features: string[];
  customFeatures: string[];
  licenseNumber: string;
  accreditationDetails: string;
  programHighlights: string[];
  uniqueSellingPoints: string[];
  faqs: { question: string; answer: string }[];
}
