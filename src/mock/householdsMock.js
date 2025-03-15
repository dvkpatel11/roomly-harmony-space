
export const mockHouseholds = {
  householdsList: [
    {
      id: 'household-1',
      name: 'Apartment 42',
      role: 'admin',
      memberCount: 4,
      description: 'Our shared apartment in downtown',
      createdAt: '2023-01-20T10:30:00Z'
    },
    {
      id: 'household-2',
      name: 'Beach House',
      role: 'member',
      memberCount: 6,
      description: 'Summer vacation home',
      createdAt: '2023-03-15T14:20:00Z'
    },
    {
      id: 'household-3',
      name: 'College Dorm',
      role: 'member',
      memberCount: 3,
      description: 'University accommodation',
      createdAt: '2023-05-10T09:15:00Z'
    }
  ],
  
  currentHousehold: {
    id: 'household-1',
    name: 'Apartment 42',
    role: 'admin',
    memberCount: 4,
    description: 'Our shared apartment in downtown',
    createdAt: '2023-01-20T10:30:00Z'
  },
  
  members: [
    {
      id: 'user-1',
      email: 'demo@example.com',
      username: 'DemoUser',
      firstName: 'Demo',
      lastName: 'User',
      role: 'admin',
      joinedAt: '2023-01-20T10:30:00Z',
      avatarUrl: null
    },
    {
      id: 'user-2',
      email: 'jane@example.com',
      username: 'JaneDoe',
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'member',
      joinedAt: '2023-01-21T08:45:00Z',
      avatarUrl: null
    },
    {
      id: 'user-3',
      email: 'sam@example.com',
      username: 'SamSmith',
      firstName: 'Sam',
      lastName: 'Smith',
      role: 'member',
      joinedAt: '2023-01-23T16:20:00Z',
      avatarUrl: null
    },
    {
      id: 'user-4',
      email: 'alex@example.com',
      username: 'AlexJones',
      firstName: 'Alex',
      lastName: 'Jones',
      role: 'member',
      joinedAt: '2023-02-05T11:10:00Z',
      avatarUrl: null
    }
  ],
  
  getHouseholds: () => {
    return Promise.resolve({
      data: mockHouseholds.householdsList
    });
  },
  
  getHouseholdMembers: (householdId) => {
    return Promise.resolve({
      data: mockHouseholds.members
    });
  },
  
  createHousehold: (data) => {
    const newHousehold = {
      id: `household-${Date.now()}`,
      name: data.name,
      description: data.description || '',
      role: 'admin',
      memberCount: 1,
      createdAt: new Date().toISOString()
    };
    
    return Promise.resolve({
      data: newHousehold
    });
  },
  
  generateInvitation: () => {
    return Promise.resolve({
      data: {
        code: 'MOCK-INVITE-1234',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      }
    });
  }
};
