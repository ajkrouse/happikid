import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { mockAuth, type MockUser } from "@/lib/mockAuth";

export function useAuth() {
  const [mockUser, setMockUser] = useState<MockUser | null>(mockAuth.getCurrentUser());
  const [useMockAuth] = useState(true); // Using mock auth to bypass Replit Auth issues

  // Subscribe to mock auth changes
  useEffect(() => {
    if (useMockAuth) {
      const unsubscribe = mockAuth.subscribe(setMockUser);
      return unsubscribe;
    }
  }, [useMockAuth]);

  // Real auth query (disabled when using mock)
  const { data: realUser, isLoading: realIsLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !useMockAuth,
  });

  // Mock auth functions
  const signIn = async () => {
    if (useMockAuth) {
      await mockAuth.signIn();
    } else {
      window.location.href = "/api/login";
    }
  };

  const signOut = async () => {
    if (useMockAuth) {
      await mockAuth.signOut();
    } else {
      window.location.href = "/api/logout";
    }
  };

  if (useMockAuth) {
    return {
      user: mockUser,
      isLoading: false,
      isAuthenticated: !!mockUser,
      signIn,
      signOut,
      isMockAuth: true,
    };
  }

  return {
    user: realUser,
    isLoading: realIsLoading,
    isAuthenticated: !!realUser,
    signIn,
    signOut,
    isMockAuth: false,
  };
}
