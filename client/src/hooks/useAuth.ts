import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error, isError } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (Unauthorized) errors
      if (error?.message?.includes('401')) {
        return false;
      }
      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const response = await fetch('/api/auth/user');
      if (response.status === 401) {
        // Don't throw an error for 401, just return null
        return null;
      }
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  // User is authenticated if we have user data and no error
  const isAuthenticated = !!user && !isError;
  // Only show loading on initial load, not on auth errors
  const authLoading = isLoading && !isError;

  return {
    user,
    isLoading: authLoading,
    isAuthenticated,
  };
}