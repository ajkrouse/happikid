import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

export class SimpleAuth {
  private user: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    // Try to get user from session on load
    this.checkSession();
  }

  private async checkSession() {
    try {
      const user = await apiRequest("GET", "/api/auth/user");
      this.setUser(user);
    } catch (error) {
      // Not signed in, that's fine
      this.setUser(null);
    }
  }

  private setUser(user: User | null) {
    this.user = user;
    this.listeners.forEach(listener => listener(user));
  }

  async signIn(email?: string, firstName?: string, lastName?: string): Promise<User> {
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
      console.error("Sign in failed:", error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await apiRequest("POST", "/api/auth/signout");
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

export const simpleAuth = new SimpleAuth();