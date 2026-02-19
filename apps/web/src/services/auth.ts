import { authApi, User } from './api';

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Login with email and password
  async loginWithPassword(email: string, password: string): Promise<User> {
    const response = await authApi.loginWithPassword(email, password);
    const user = response.data.user;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  // Register with name, email and password
  async registerWithPassword(name: string, email: string, password: string): Promise<User> {
    const response = await authApi.registerWithPassword(name, email, password);
    const user = response.data.user;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  // Get current user from server (uses HTTP-only cookie)
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await authApi.getCurrentUser();
      const user = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch {
      this.clearAuth();
      return null;
    }
  }

  // Get stored user data
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Clear authentication data
  clearAuth(): void {
    localStorage.removeItem('user');
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    }
    this.clearAuth();
    window.location.href = '/login';
  }

  // Check if user is admin
  isAdmin(user: User | null): boolean {
    return user?.role === 'ADMIN';
  }
}

export const authService = AuthService.getInstance();
export default authService;
