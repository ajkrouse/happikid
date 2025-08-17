import { useState, useEffect } from "react";
import { oauthAuth, type User } from "@/lib/oauthAuth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(oauthAuth.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = oauthAuth.subscribe((newUser) => {
      setUser(newUser);
      setIsLoading(false);
    });

    // Initial check
    setUser(oauthAuth.getCurrentUser());
    setIsLoading(false);

    return unsubscribe;
  }, []);

  const signIn = async (email?: string, firstName?: string, lastName?: string) => {
    try {
      await oauthAuth.signInWithEmail(email, firstName, lastName);
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    }
  };

  const signInWithGoogle = () => {
    oauthAuth.signInWithGoogle();
  };

  const signInWithApple = async () => {
    try {
      return await oauthAuth.signInWithApple();
    } catch (error) {
      console.error("Apple Sign In failed:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await oauthAuth.signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: oauthAuth.isAuthenticated(),
    signIn,
    signInWithGoogle,
    signInWithApple,
    signOut,
  };
}