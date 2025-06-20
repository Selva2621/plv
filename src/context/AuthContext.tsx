import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import apiService from '../services/api';

interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (updates: any) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token and get user profile
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('Checking authentication status...');
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        console.log('Auth token found, fetching user profile...');
        const userData = await apiService.getProfile();
        console.log('User profile loaded:', userData.email);
        setUser(userData);
      } else {
        console.log('No auth token found');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid token
      await SecureStore.deleteItemAsync('auth_token');
      console.log('Invalid auth token cleared');
    } finally {
      setLoading(false);
      console.log('Auth check completed');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiService.login(email, password);
      setUser(response.user);
      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);

      // More detailed error handling
      let errorMessage = 'Login failed. Please try again.';

      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your internet connection and ensure the server is running.';
      } else if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check if the server is running.';
      }

      return {
        error: {
          message: errorMessage
        }
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      setLoading(true);
      const response = await apiService.register(email, password, userData?.full_name);
      setUser(response.user);
      return { error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return {
        error: {
          message: error.response?.data?.message || 'Registration failed. Please try again.'
        }
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    // This would need to be implemented in the backend
    return { error: { message: 'Password reset not implemented yet' } };
  };

  const updateProfile = async (updates: any) => {
    try {
      if (!user) return { error: { message: 'No user logged in' } };

      const updatedUser = await apiService.updateUser(user.id, updates);
      setUser(updatedUser);
      return { error: null };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return {
        error: {
          message: error.response?.data?.message || 'Profile update failed'
        }
      };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
