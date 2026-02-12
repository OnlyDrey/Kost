import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../services/api';
import authService from '../services/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load auth state from storage
    const storedAuth = authService.getStoredAuth();
    if (storedAuth.isAuthenticated) {
      setUser(storedAuth.user);
      setToken(storedAuth.token);

      // Verify token is still valid
      authService.getCurrentUser().then((currentUser) => {
        if (currentUser) {
          setUser(currentUser);
        } else {
          setUser(null);
          setToken(null);
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    authService.setAuth(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!(token && user),
    isLoading,
    login,
    logout,
    isAdmin: authService.isAdmin(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
