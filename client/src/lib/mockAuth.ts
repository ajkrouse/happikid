// Temporary authentication mock for development/testing
// This allows us to test the contribution features while resolving the Replit Auth setup

export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  role: string;
}

const MOCK_USER_KEY = 'happikid_mock_user';

export class MockAuth {
  private static instance: MockAuth;
  private user: MockUser | null = null;
  private listeners: Array<(user: MockUser | null) => void> = [];

  static getInstance(): MockAuth {
    if (!MockAuth.instance) {
      MockAuth.instance = new MockAuth();
    }
    return MockAuth.instance;
  }

  constructor() {
    // Load user from localStorage if exists
    this.loadUser();
  }

  private loadUser() {
    try {
      const stored = localStorage.getItem(MOCK_USER_KEY);
      if (stored) {
        this.user = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load mock user from localStorage:', error);
    }
  }

  private saveUser() {
    try {
      if (this.user) {
        localStorage.setItem(MOCK_USER_KEY, JSON.stringify(this.user));
      } else {
        localStorage.removeItem(MOCK_USER_KEY);
      }
    } catch (error) {
      console.warn('Failed to save mock user to localStorage:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.user));
  }

  signIn(): Promise<void> {
    return new Promise((resolve) => {
      // Create a mock user for testing
      this.user = {
        id: 'test_user_' + Date.now(),
        email: 'parent@example.com',
        firstName: 'Test',
        lastName: 'Parent',
        profileImageUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
        role: 'parent'
      };
      
      this.saveUser();
      this.notifyListeners();
      
      // Simulate async auth process
      setTimeout(resolve, 500);
    });
  }

  signOut(): Promise<void> {
    return new Promise((resolve) => {
      this.user = null;
      this.saveUser();
      this.notifyListeners();
      
      // Simulate async logout process
      setTimeout(resolve, 200);
    });
  }

  getCurrentUser(): MockUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.user !== null;
  }

  subscribe(listener: (user: MockUser | null) => void) {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Mock API request helper that includes auth headers
  async mockApiRequest(method: string, url: string, data?: any) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.user) {
      headers['X-Mock-User-Id'] = this.user.id;
      headers['X-Mock-User-Email'] = this.user.email;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

export const mockAuth = MockAuth.getInstance();