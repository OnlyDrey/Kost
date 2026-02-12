import { authApi, User } from './api';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Request magic link
  async requestMagicLink(email: string): Promise<void> {
    await authApi.requestMagicLink(email);
  }

  // Verify token from magic link
  async verifyToken(token: string): Promise<{ user: User; token: string }> {
    const response = await authApi.verifyToken(token);
    this.setAuth(response.data.token, response.data.user);
    return response.data;
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await authApi.getCurrentUser();
      return response.data;
    } catch (error) {
      this.clearAuth();
      return null;
    }
  }

  // Set authentication data
  setAuth(token: string, user: User): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Get stored auth data
  getStoredAuth(): AuthState {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    return {
      token,
      user,
      isAuthenticated: !!(token && user),
    };
  }

  // Clear authentication data
  clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  // Logout
  logout(): void {
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
