import type {
  Provider,
  ProviderImage,
  ProviderPhoto,
  ProviderUpdate,
  Review,
} from "@shared/schema";
import {
  isStoredProviderImagePath,
  providerImageContentUrl,
} from "./providerImageUpload";

type PricingProvider = Pick<
  Provider,
  "monthlyPrice" | "monthlyPriceMin" | "monthlyPriceMax" | "showExactPrice"
>;

export type PublicPricing = {
  monthlyPrice: string | null;
  monthlyPriceMin: string | null;
  monthlyPriceMax: string | null;
  hasPublicPricing: boolean;
};

function isPositiveAmount(value: unknown): value is string {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

/**
 * Exact tuition is public only when the provider opted in and supplied a
 * complete, valid fixed amount or range. This is deliberately the single
 * policy used by family DTOs and AI-facing public context.
 */
export function getPublicPricing(provider: PricingProvider): PublicPricing {
  if (provider.showExactPrice === false) {
    return {
      monthlyPrice: null,
      monthlyPriceMin: null,
      monthlyPriceMax: null,
      hasPublicPricing: false,
    };
  }

  const hasPublicRange =
    isPositiveAmount(provider.monthlyPriceMin) &&
    isPositiveAmount(provider.monthlyPriceMax) &&
    Number(provider.monthlyPriceMin) <= Number(provider.monthlyPriceMax);
  const hasPublicFixedPrice = isPositiveAmount(provider.monthlyPrice);

  return {
    monthlyPrice: hasPublicFixedPrice ? provider.monthlyPrice : null,
    monthlyPriceMin: hasPublicRange ? provider.monthlyPriceMin : null,
    monthlyPriceMax: hasPublicRange ? provider.monthlyPriceMax : null,
    hasPublicPricing: hasPublicRange || hasPublicFixedPrice,
  };
}

export function hasPublicPricing(provider: PricingProvider): boolean {
  return getPublicPricing(provider).hasPublicPricing;
}

/**
 * A provider is family-visible only after it is active, license-confirmed, and
 * explicitly published. Keep this rule in one place so public routes cannot
 * accidentally expose drafts, rejected listings, or hidden profiles.
 */
export function isPublicProvider(provider: Pick<
  Provider,
  "isActive" | "licenseStatus" | "isProfileVisible" | "isProfilePublic"
>): boolean {
  return (
    provider.isActive === true &&
    provider.licenseStatus === "confirmed" &&
    provider.isProfileVisible === true &&
    provider.isProfilePublic === true
  );
}

/**
 * Claims transfer provider control to ownerUserId. Direct-created, unclaimed
 * listings keep userId as their owner.
 */
export function getCanonicalProviderOwnerUserId(
  provider: Pick<Provider, "ownerUserId" | "userId">,
): string | null {
  return provider.ownerUserId ?? provider.userId ?? null;
}

export function isCanonicalProviderOwner(
  provider: Pick<Provider, "ownerUserId" | "userId">,
  userId: string | undefined | null,
): boolean {
  return !!userId && getCanonicalProviderOwnerUserId(provider) === userId;
}

/**
 * Whitelist fields that are safe to show to families. Database provider rows
 * contain internal ownership, licensing, import, claim, and analytics fields;
 * public endpoints must never return those raw records.
 */
export function toPublicProvider(provider: Provider & Record<string, unknown>) {
  const pricing = getPublicPricing(provider);
  const publicProvider = {
    id: provider.id,
    name: provider.name,
    description: provider.description,
    address: provider.address,
    borough: provider.borough,
    city: provider.city,
    state: provider.state,
    zipCode: provider.zipCode,
    phone: provider.phone,
    email: provider.email,
    website: provider.website,
    type: provider.type,
    ageRangeMin: provider.ageRangeMin,
    ageRangeMax: provider.ageRangeMax,
    capacity: provider.capacity,
    monthlyPrice: pricing.monthlyPrice,
    monthlyPriceMin: pricing.monthlyPriceMin,
    monthlyPriceMax: pricing.monthlyPriceMax,
    showExactPrice: provider.showExactPrice,
    hoursOpen: provider.hoursOpen,
    hoursClose: provider.hoursClose,
    schedule: provider.schedule,
    features: provider.features,
    minAgeMonths: provider.minAgeMonths,
    maxAgeMonths: provider.maxAgeMonths,
    totalCapacity: provider.totalCapacity,
    featuresNew: provider.featuresNew,
    featuresCustom: provider.featuresCustom,
    details: provider.details,
    rating: provider.rating,
    reviewCount: provider.reviewCount,
    programHighlights: provider.programHighlights,
    uniqueSellingPoints: provider.uniqueSellingPoints,
    faqs: provider.faqs,
    isPremium: provider.isPremium,
    // This is a family-facing badge, not internal verification metadata.
    // Public providers are license-confirmed by the visibility policy.
    isVerified: provider.licenseStatus === "confirmed",
    acceptsSubsidies: provider.acceptsSubsidies,
    enrollmentStatus: provider.enrollmentStatus,
    closureNote: provider.closureNote,
    closedDates: provider.closedDates,
    lat: provider.lat,
    lng: provider.lng,
    badges: Array.isArray(provider.badges) ? provider.badges : undefined,
    images: Array.isArray(provider.images)
      ? provider.images.map((image) => toPublicProviderImage(image as ProviderImage, provider.id))
      : undefined,
  };

  return publicProvider;
}

export function toPublicProviderImage(image: ProviderImage, providerId = image.providerId) {
  return {
    id: image.id,
    imageUrl: isStoredProviderImagePath(image.imageUrl)
      ? providerImageContentUrl(providerId, image.id)
      : image.imageUrl,
    caption: image.caption,
    isPrimary: image.isPrimary,
  };
}

export function toPublicReview(review: Review) {
  return {
    id: review.id,
    rating: review.rating,
    title: review.title,
    content: review.content,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

export function toPublicProviderUpdate(update: ProviderUpdate) {
  return {
    id: update.id,
    updateType: update.updateType,
    field: update.field,
    newValue: update.newValue,
    createdAt: update.createdAt,
  };
}

export function toPublicProviderPhoto(photo: ProviderPhoto) {
  return {
    id: photo.id,
    imageUrl: photo.imageUrl,
    caption: photo.caption,
    photoType: photo.photoType,
    createdAt: photo.createdAt,
  };
}

export function toPublicProviderDetail(
  provider: Provider & { images: ProviderImage[]; reviews: Review[] } & Record<string, unknown>,
) {
  return {
    ...toPublicProvider(provider),
    images: (provider.images ?? []).map((image) => toPublicProviderImage(image, provider.id)),
    reviews: (provider.reviews ?? []).map(toPublicReview),
  };
}