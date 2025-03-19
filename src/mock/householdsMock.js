
import { UserRole } from '../types';

export const mockHouseholds = {
  householdsList: [
    {
      id: 'household-1',
      name: 'Apartment 42',
      role: 'admin',
      memberCount: 4,
      admin_id: 'user-1',
      createdAt: '2023-01-20T10:30:00Z'
    },
    {
      id: 'household-2',
      name: 'Beach House',
      role: 'member',
      memberCount: 6,
      admin_id: 'user-5',
      createdAt: '2023-03-15T14:20:00Z'
    },
    {
      id: 'household-3',
      name: 'College Dorm',
      role: 'member',
      memberCount: 3,
      admin_id: 'user-8',
      createdAt: '2023-05-10T09:15:00Z'
    }
  ],
  
  currentHousehold: {
    id: 'household-1',
    name: 'Apartment 42',
    role: 'admin',
    memberCount: 4,
    admin_id: 'user-1',
    createdAt: '2023-01-20T10:30:00Z'
  },
  
  members: [
    {
      id: 'user-1',
      email: 'demo@example.com',
      name: 'Demo User',
      avatar: null,
      role: 'admin',
      joined_at: '2023-01-20T10:30:00Z'
    },
    {
      id: 'user-2',
      email: 'jane@example.com',
      name: 'Jane Doe',
      avatar: null,
      role: 'member',
      joined_at: '2023-01-21T08:45:00Z'
    },
    {
      id: 'user-3',
      email: 'sam@example.com',
      name: 'Sam Smith',
      avatar: null,
      role: 'member',
      joined_at: '2023-01-23T16:20:00Z'
    },
    {
      id: 'user-4',
      email: 'alex@example.com',
      name: 'Alex Jones',
      avatar: null,
      role: 'member',
      joined_at: '2023-02-05T11:10:00Z'
    }
  ],
  
  getHouseholds: () => {
    return Promise.resolve({
      households: mockHouseholds.householdsList,
      active_household_id: 'household-1'
    });
  },
  
  getHouseholdDetails: (householdId) => {
    return Promise.resolve({
      id: 'household-1',
      name: 'Apartment 42',
      members: mockHouseholds.members,
      admin_id: 'user-1',
      createdAt: '2023-01-20T10:30:00Z',
      invite_code: 'MOCK-INVITE-1234'
    });
  },
  
  getActiveHousehold: () => {
    return Promise.resolve({
      id: 'household-1',
      name: 'Apartment 42',
      members: mockHouseholds.members,
      admin_id: 'user-1',
      createdAt: '2023-01-20T10:30:00Z'
    });
  },
  
  createHousehold: (data) => {
    const newHousehold = {
      message: 'Household created successfully',
      household: {
        id: `household-${Date.now()}`,
        name: data.name,
        role: 'admin'
      }
    };
    
    return Promise.resolve(newHousehold);
  },
  
  generateInvitationCode: (householdId) => {
    return Promise.resolve({
      code: 'MOCK-INVITE-1234',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    });
  },
  
  joinHousehold: (inviteCode) => {
    return Promise.resolve({
      message: 'Successfully joined household',
      household: {
        id: 'household-4',
        name: 'New Household'
      }
    });
  },
  
  setActiveHousehold: (householdId) => {
    return Promise.resolve(true);
  },
  
  updateMemberRole: (householdId, request) => {
    return Promise.resolve();
  },
  
  leaveHousehold: (householdId) => {
    return Promise.resolve();
  },
  
  removeMember: (householdId, userId) => {
    return Promise.resolve();
  },
  
  updateHousehold: (householdId, updates) => {
    return Promise.resolve();
  }
};
