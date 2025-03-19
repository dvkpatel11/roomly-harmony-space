
import { Theme } from '../types';

export const mockAuth = {
  currentUser: {
    id: 'user-1',
    email: 'demo@example.com',
    role: 'member',
    preferences: {
      notifications: true,
      theme: 'light',
      active_household: 'household-1'
    },
    households: ['household-1', 'household-2', 'household-3'],
    createdAt: '2023-01-15T08:00:00Z'
  },
  
  login: (email, password) => {
    // Simulate successful login with demo credentials
    if (email === 'demo@example.com' && password === 'password') {
      return Promise.resolve({
        success: true,
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'user-1',
          email: 'demo@example.com',
          role: 'member',
          preferences: {
            notifications: true,
            theme: 'light',
            active_household: 'household-1'
          },
          households: ['household-1', 'household-2', 'household-3']
        }
      });
    }
    
    // Simulate failed login
    return Promise.resolve({ 
      success: false, 
      error: 'Invalid email or password' 
    });
  },
  
  register: (userData) => {
    return Promise.resolve({
      message: 'User registered successfully',
      access_token: 'mock-jwt-token',
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'user-new',
        email: userData.email,
        role: 'member',
        preferences: userData.preferences || {
          notifications: true,
          theme: 'light',
          active_household: null
        },
        households: []
      }
    });
  },
  
  getCurrentUser: () => {
    return Promise.resolve({
      id: 'user-1',
      email: 'demo@example.com',
      role: 'member',
      preferences: {
        notifications: true,
        theme: 'light',
        active_household: 'household-1'
      },
      households: ['household-1', 'household-2', 'household-3']
    });
  },
  
  updateProfile: (updates) => {
    return Promise.resolve({
      message: 'Profile updated successfully'
    });
  },
  
  refreshToken: () => {
    return Promise.resolve({
      access_token: 'new-mock-jwt-token'
    });
  },
  
  logout: () => {
    return Promise.resolve();
  },
  
  isAuthenticated: () => {
    return true;
  }
};
