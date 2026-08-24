import type { ProviderImage } from "@shared/schema";
import { DEFAULT_PROVIDER_IMAGE, getProviderImages } from "@/lib/providerImages";

interface ProviderImageGalleryProps {
  providerName: string;
  images?: ProviderImage[];
}

export function ProviderImageGallery({ providerName, images }: ProviderImageGalleryProps) {
  const providerImages = getProviderImages({ images });
  const galleryImages = providerImages.length > 0
    ? providerImages.slice(0, 3)
    : [{ id: 0, imageUrl: DEFAULT_PROVIDER_IMAGE, caption: null, isPrimary: true }];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {galleryImages.map((image, index) => (
        <img
          key={image.id}
          src={image.imageUrl}
          alt={image.caption || `${providerName} ${index === 0 ? "photo" : `photo ${index + 1}`}`}
          className="rounded-lg object-cover h-48 w-full"
        />
      ))}
    </div>
  );
}