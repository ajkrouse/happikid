import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProviderImageGallery } from "@/components/ProviderImageGallery";

describe("ProviderImageGallery", () => {
  it("renders finalized public image URLs in primary-first order with captions as alt text", () => {
    render(
      <ProviderImageGallery
        providerName="Sunshine Center"
        images={[
          {
            id: 19,
            imageUrl: "/api/providers/7/images/19/content",
            caption: "Outdoor play space",
            isPrimary: false,
          },
          {
            id: 20,
            imageUrl: "/api/providers/7/images/20/content",
            caption: "Bright classroom",
            isPrimary: true,
          },
        ] as any}
      />,
    );

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "/api/providers/7/images/20/content");
    expect(images[0]).toHaveAccessibleName("Bright classroom");
    expect(images[1]).toHaveAttribute("src", "/api/providers/7/images/19/content");
    expect(images[1]).toHaveAccessibleName("Outdoor play space");
  });

  it("uses the stock image only when no public images are available", () => {
    render(<ProviderImageGallery providerName="Sunshine Center" images={[]} />);

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      expect.stringContaining("pexels.com/photos/8613311"),
    );
  });
});