import { useState, useEffect } from "react";
import { simpleAuth, type User } from "@/lib/simpleAuth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(simpleAuth.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = simpleAuth.subscribe((newUser) => {
      setUser(newUser);
      setIsLoading(false);
    });

    // Initial check
    setUser(simpleAuth.getCurrentUser());
    setIsLoading(false);

    return unsubscribe;
  }, []);

  const signIn = async (email?: string, firstName?: string, lastName?: string) => {
    try {
      await simpleAuth.signIn(email, firstName, lastName);
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await simpleAuth.signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: simpleAuth.isAuthenticated(),
    signIn,
    signOut,
  };
}