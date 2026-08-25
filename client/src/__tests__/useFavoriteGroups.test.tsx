import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null as { id: string } | null,
}));
const apiRequestMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: apiRequestMock,
}));

import { useFavoriteGroups } from "@/hooks/useFavoriteGroups";

function response(body: unknown) {
  return { json: async () => body } as Response;
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useFavoriteGroups", () => {
  beforeEach(() => {
    localStorage.clear();
    authState.isAuthenticated = false;
    authState.user = null;
    apiRequestMock.mockReset();
    toastMock.mockReset();
  });

  it("keeps guest groups locally without requiring an account", async () => {
    const { result } = renderHook(() => useFavoriteGroups(), { wrapper });

    await act(async () => {
      await result.current.saveGroups({ "Local picks": [7, 7, 8] });
    });

    expect(result.current.groups).toEqual({ "Local picks": [7, 8] });
    expect(JSON.parse(localStorage.getItem("favoriteGroups") || "{}")).toEqual({
      "Local picks": [7, 8],
    });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("imports guest groups after sign-in, then clears local storage only after success", async () => {
    localStorage.setItem("favoriteGroups", JSON.stringify({ "From this device": [7, 8] }));
    authState.isAuthenticated = true;
    authState.user = { id: "parent-1" };
    apiRequestMock.mockImplementation(async (method: string) => {
      if (method === "GET") return response({ groups: [], revision: 0 });
      if (method === "POST") {
        return response({ revision: 1, groups: [{
          id: "group-1",
          name: "From this device",
          providerIds: [7, 8],
          providers: [],
          createdAt: "2026-08-25T00:00:00.000Z",
          updatedAt: "2026-08-25T00:00:00.000Z",
        }] });
      }
      throw new Error(`Unexpected ${method}`);
    });

    const { result } = renderHook(() => useFavoriteGroups(), { wrapper });

    await waitFor(() => expect(apiRequestMock).toHaveBeenCalledWith(
      "POST",
      "/api/favorite-groups/import",
      { groups: [{ name: "From this device", providerIds: [7, 8] }] },
    ));
    await waitFor(() => expect(result.current.groups).toEqual({ "From this device": [7, 8] }));

    expect(localStorage.getItem("favoriteGroups")).toBeNull();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Saved groups restored" }));
  });
});