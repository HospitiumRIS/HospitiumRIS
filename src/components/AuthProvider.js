'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Handle client-side mounting first
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize auth state from localStorage on mount (only on client)
  useEffect(() => {
    if (isClient) {
      checkAuthStatus();
    }
  }, [isClient]);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      // Only check URL params on client side
      let isOrcidLogin = false;
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        isOrcidLogin = urlParams.get('login') === 'success';
      }
      
      // First, always try to validate session with backend
      // This handles both regular sessions and ORCID login
      const isValid = await validateSession();
      
      if (isValid) {
        // validateSession already updated the user data and state
        setIsAuthenticated(true);
        
        // Clean up ORCID login URL parameter
        if (isOrcidLogin && typeof window !== 'undefined') {
          const url = new URL(window.location);
          url.searchParams.delete('login');
          window.history.replaceState({}, '', url);
        }
      } else {
        // No valid session found
        clearAuthData();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const validateSession = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Include cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Update user data from server
          const userData = data.user;
          if (typeof window !== 'undefined') {
            localStorage.setItem('hospitium_user', JSON.stringify(userData));
          }
          setUser(userData);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  };

  const login = async (userData) => {
    try {
      // Store user data in localStorage (only on client)
      if (typeof window !== 'undefined') {
        localStorage.setItem('hospitium_user', JSON.stringify(userData));
      }
      
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async (options = {}) => {
    try {
      // Call logout endpoint to clear server-side session cookie
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include', // Include cookies for server-side session clearing
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            preserveRememberMe: options.preserveRememberMe || false
          })
        });
      } catch (error) {
        console.error('Logout API error:', error);
        // Continue with local logout even if API fails
      }
      
      // Clear auth data (but optionally preserve remember me preference)
      clearAuthData(options.preserveRememberMe);
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data on error
      clearAuthData();
      return { success: false, error: error.message };
    }
  };

  const clearAuthData = (preserveRememberMe = false) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hospitium_user');
      // Only clear remember me preference if explicitly requested
      if (!preserveRememberMe) {
        // Note: We usually want to preserve the remember me preference
        // so users don't have to check it again next time they login
      }
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData };
    if (typeof window !== 'undefined') {
      localStorage.setItem('hospitium_user', JSON.stringify(newUserData));
    }
    setUser(newUserData);
  };

  // Get user role for routing
  const getUserRole = () => {
    if (!user) return null;
    return user.accountType?.toLowerCase();
  };

  // Get dashboard route based on user role
  const getDashboardRoute = () => {
    const role = getUserRole();
    if (!role) return '/';
    
    switch (role) {
      case 'researcher':
        return '/researcher';
      case 'research_admin':
        return '/institution';
      case 'foundation_admin':
        return '/foundation';
      case 'super_admin':
        return '/super-admin';
      default:
        return '/dashboard';
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    isClient,
    login,
    logout,
    updateUser,
    getUserRole,
    getDashboardRoute,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
