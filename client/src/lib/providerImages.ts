import type { ProviderImage } from "@shared/schema";

export const DEFAULT_PROVIDER_IMAGE =
  "https://images.pexels.com/photos/8613311/pexels-photo-8613311.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop";

type ProviderImageSource = {
  images?: Array<Pick<ProviderImage, "id" | "imageUrl" | "isPrimary" | "caption">>;
};

export function getProviderImages(provider: ProviderImageSource): NonNullable<ProviderImageSource["images"]> {
  return [...(provider.images ?? [])].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
}

export function getPrimaryProviderImage(provider: ProviderImageSource): string {
  return getProviderImages(provider)[0]?.imageUrl ?? DEFAULT_PROVIDER_IMAGE;
}