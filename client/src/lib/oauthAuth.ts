import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

export class OAuthAuth {
  private user: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    this.checkSession();
  }

  private async checkSession() {
    try {
      const user = await apiRequest("GET", "/api/auth/user");
      this.setUser(user);
    } catch (error) {
      this.setUser(null);
    }
  }

  private setUser(user: User | null) {
    this.user = user;
    this.listeners.forEach(listener => listener(user));
  }

  // Google Sign In
  signInWithGoogle(): void {
    window.location.href = "/api/auth/google";
  }

  // Apple Sign In (for mobile apps via JavaScript SDK)
  async signInWithApple(): Promise<User | null> {
    try {
      // This would integrate with Apple's JavaScript SDK
      // For now, redirect to a page that can handle Apple Sign In
      if (typeof window !== 'undefined' && (window as any).AppleID) {
        const response = await (window as any).AppleID.auth.signIn();
        
        // Send the token to our backend for verification
        const result = await apiRequest("POST", "/api/auth/apple/verify", {
          id_token: response.authorization.id_token,
          user: response.user
        });
        
        this.setUser(result.user);
        return result.user;
      } else {
        throw new Error('Apple Sign In SDK not loaded');
      }
    } catch (error) {
      console.error("Apple Sign In failed:", error);
      throw error;
    }
  }

  // Email Sign In (existing simple auth)
  async signInWithEmail(email?: string, firstName?: string, lastName?: string): Promise<User> {
    try {
      const userData = {
        email: email || 'parent@example.com',
        firstName: firstName || 'Parent',
        lastName: lastName || ''
      };

      const response = await apiRequest("POST", "/api/auth/signin", userData);
      this.setUser(response.user);
      return response.user;
    } catch (error) {
      console.error("Email sign in failed:", error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      this.setUser(null);
    }
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.user !== null;
  }

  subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

export const oauthAuth = new OAuthAuth();