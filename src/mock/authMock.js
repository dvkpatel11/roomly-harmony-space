
export const mockAuth = {
  currentUser: {
    id: 'user-1',
    email: 'demo@example.com',
    role: 'member',
    preferences: {
      notifications: true,
      theme: 'light'
    },
    createdAt: '2023-01-15T08:00:00Z'
  },
  
  login: (email, password) => {
    // Simulate successful login with demo credentials
    if (email === 'demo@example.com' && password === 'password') {
      return Promise.resolve({
        success: true,
        token: 'mock-jwt-token',
        user_id: 'user-1',
        role: 'member'
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
      success: true,
      token: 'mock-jwt-token',
      user_id: 'user-new'
    });
  },
  
  getProfile: () => {
    return Promise.resolve({
      data: {
        id: 'user-1',
        email: 'demo@example.com',
        role: 'member',
        preferences: {
          notifications: true,
          theme: 'light'
        },
        createdAt: '2023-01-15T08:00:00Z'
      }
    });
  }
};
