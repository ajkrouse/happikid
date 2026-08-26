import { describe, expect, it, beforeEach, vi } from "vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Provider, Review } from "@shared/schema";

const authState = {
  isAuthenticated: false,
  signIn: vi.fn(),
  user: null as { role: "parent" | "provider" | "admin" } | null,
};
const toastMock = vi.hoisted(() => vi.fn());
const apiRequestMock = vi.hoisted(() => vi.fn());
const invalidateQueriesMock = vi.hoisted(() => vi.fn());
const getQueryDataMock = vi.hoisted(() => vi.fn());
const setQueryDataMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: apiRequestMock,
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(({ queryKey }: { queryKey: string[] }) => ({
    data: queryKey[0] === "/api/providers/1"
      ? providerQueryData
      : undefined,
    isLoading: false,
  })),
  useMutation: vi.fn((options: {
    mutationFn: () => Promise<unknown>;
    onSuccess?: (value: unknown) => void;
    onError?: (error: unknown) => void;
  }) => ({
    isPending: false,
    mutate: () => {
      options.mutationFn().then(options.onSuccess).catch(options.onError);
    },
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: invalidateQueriesMock,
    getQueryData: getQueryDataMock,
    setQueryData: setQueryDataMock,
  })),
}));

vi.mock("@/components/ProviderContributions", () => ({
  ProviderContributions: () => null,
}));

vi.mock("@/components/ReviewVoting", () => ({
  ReviewVoting: () => null,
}));

import ProviderModal from "@/components/ProviderModal";

const existingReview: Review = {
  id: 11,
  providerId: 1,
  userId: "another-parent",
  rating: 4,
  title: "A caring team",
  content: "Our child is happy every day.",
  isVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const providerWithReviews = {
  id: 1,
  name: "Sunny Day Childcare",
  description: "A welcoming program.",
  address: "123 Main St",
  borough: "Brooklyn",
  city: "Brooklyn",
  state: "NY",
  zipCode: "11201",
  phone: null,
  email: null,
  website: null,
  type: "daycare",
  ageRangeMin: 6,
  ageRangeMax: 60,
  capacity: null,
  monthlyPrice: "1200",
  monthlyPriceMin: null,
  monthlyPriceMax: null,
  showExactPrice: true,
  hoursOpen: null,
  hoursClose: null,
  schedule: null,
  features: [],
  minAgeMonths: null,
  maxAgeMonths: null,
  totalCapacity: null,
  featuresNew: [],
  featuresCustom: [],
  details: {},
  rating: "4.00",
  reviewCount: 1,
  enrollmentStatus: "accepting",
  closureNote: null,
  acceptsSubsidies: false,
  isPremium: false,
  isVerified: true,
  images: [],
  reviews: [existingReview],
} as unknown as Provider & { reviews: Review[] };
let providerQueryData = providerWithReviews;

function renderModal() {
  return render(
    <ProviderModal
      provider={providerWithReviews}
      isOpen={true}
      onClose={vi.fn()}
    />,
  );
}

describe("ProviderModal review submission", () => {
  beforeEach(() => {
    authState.isAuthenticated = false;
    authState.user = null;
    authState.signIn.mockReset();
    toastMock.mockReset();
    apiRequestMock.mockReset();
    invalidateQueriesMock.mockReset();
    getQueryDataMock.mockReset();
    setQueryDataMock.mockReset();
    providerQueryData = providerWithReviews;
    getQueryDataMock.mockImplementation(() => providerQueryData);
    setQueryDataMock.mockImplementation((_queryKey, data) => {
      providerQueryData = typeof data === "function"
        ? data(providerQueryData)
        : data;
    });
  });

  it("requires sign-in before opening the review form", () => {
    renderModal();

    fireEvent.click(screen.getByRole("button", { name: /write a review/i }));

    expect(screen.queryByLabelText("Your review *")).not.toBeInTheDocument();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "Sign in required",
    }));
    expect(toastMock.mock.calls[0][0].action).toBeTruthy();
  });

  it("validates the rating and review text before making a request", () => {
    authState.isAuthenticated = true;
    authState.user = { role: "parent" };
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /write a review/i }));

    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "Rating required",
    }));
    expect(apiRequestMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("radio", { name: "5 stars" }));
    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "Review text required",
    }));
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("submits a review and refreshes the provider detail cache", async () => {
    authState.isAuthenticated = true;
    authState.user = { role: "parent" };
    const newReview = {
      ...existingReview,
      id: 12,
      userId: "parent",
      rating: 5,
      title: "Wonderful care",
      content: "The teachers are kind and communicative.",
    };
    apiRequestMock.mockResolvedValue({
      json: () => Promise.resolve(newReview),
    });

    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /write a review/i }));
    fireEvent.click(screen.getByRole("radio", { name: "5 stars" }));
    fireEvent.change(screen.getByLabelText("Review title (optional)"), {
      target: { value: "Wonderful care" },
    });
    fireEvent.change(screen.getByLabelText("Your review *"), {
      target: { value: "The teachers are kind and communicative." },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));

    await waitFor(() => expect(apiRequestMock).toHaveBeenCalledWith(
      "POST",
      "/api/providers/1/reviews",
      {
        rating: 5,
        title: "Wonderful care",
        content: "The teachers are kind and communicative.",
      },
    ));
    expect(setQueryDataMock).toHaveBeenCalledWith(
      ["/api/providers/1"],
      expect.objectContaining({
        rating: "4.50",
        reviewCount: 2,
        reviews: [newReview, existingReview],
      }),
    );
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["/api/providers/1"],
    });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["/api/providers"],
    });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "Review submitted!",
    }));
    expect(screen.queryByLabelText("Your review *")).not.toBeInTheDocument();
    expect(screen.getByText("Wonderful care")).toBeInTheDocument();
    expect(screen.getByText("The teachers are kind and communicative.")).toBeInTheDocument();
  });

  it("shows a clear duplicate-review message", async () => {
    authState.isAuthenticated = true;
    authState.user = { role: "parent" };
    apiRequestMock.mockRejectedValue(new Error(
      '409: {"ok":false,"message":"You have already reviewed this provider"}',
    ));

    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /write a review/i }));
    fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    fireEvent.change(screen.getByLabelText("Your review *"), {
      target: { value: "A second review attempt." },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));

    await waitFor(() => expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "Review already submitted",
      variant: "destructive",
    })));
  });

  it("shows a clear message when submission fails", async () => {
    authState.isAuthenticated = true;
    authState.user = { role: "parent" };
    apiRequestMock.mockRejectedValue(new Error("500: service unavailable"));

    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /write a review/i }));
    fireEvent.click(screen.getByRole("radio", { name: "3 stars" }));
    fireEvent.change(screen.getByLabelText("Your review *"), {
      target: { value: "A thoughtful review." },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));

    await waitFor(() => expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "Unable to submit review",
      variant: "destructive",
    })));
  });

  it.each(["provider", "admin"] as const)(
    "does not open the review form for a signed-in %s account",
    (role) => {
      authState.isAuthenticated = true;
      authState.user = { role };

      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /write a review/i }));

      expect(screen.queryByLabelText("Your review *")).not.toBeInTheDocument();
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
        title: "Parent account required",
        variant: "destructive",
      }));
      expect(apiRequestMock).not.toHaveBeenCalled();
    },
  );
});