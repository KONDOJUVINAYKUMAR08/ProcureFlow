import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthResponse } from '../types';
import { authApi } from '../services/endpoints';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  const loadProfile = useCallback(async () => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      try {
        const userData = await authApi.getProfile();
        setUser(userData);
        setToken(savedToken);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setToken(null);
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    const authData = await authApi.login(email, password);
    const { user: userData, token: authToken, refreshToken } = authData;
    localStorage.setItem('token', authToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
    authApi.logout().catch(() => {});
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
