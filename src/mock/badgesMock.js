
export const mockBadges = {
  badges: [
    {
      id: 'badge-1',
      type: '5_day_streak',
      name: '5-Day Streak',
      description: 'Completed tasks for 5 consecutive days'
    },
    {
      id: 'badge-2',
      type: '10_day_streak',
      name: '10-Day Streak',
      description: 'Completed tasks for 10 consecutive days'
    },
    {
      id: 'badge-3',
      type: 'top_contributor',
      name: 'Top Contributor',
      description: 'Completed the most tasks in a month'
    },
    {
      id: 'badge-4',
      type: 'early_bird',
      name: 'Early Bird',
      description: 'Completed 5 tasks before their due dates'
    },
    {
      id: 'badge-5',
      type: 'household_founder',
      name: 'Household Founder',
      description: 'Created a household'
    }
  ],
  
  userBadges: [
    {
      badgeId: 'badge-1',
      userId: 'user-1',
      awardedAt: '2023-05-20T14:30:00Z'
    },
    {
      badgeId: 'badge-5',
      userId: 'user-1',
      awardedAt: '2023-01-20T10:35:00Z'
    }
  ],
  
  householdBadges: {
    'user-1': ['badge-1', 'badge-5'],
    'user-2': ['badge-1', 'badge-3', 'badge-4'],
    'user-3': ['badge-1', 'badge-2'],
    'user-4': ['badge-4']
  },
  
  getUserBadges: (userId) => {
    const userBadgeIds = mockBadges.userBadges
      .filter(ub => ub.userId === userId)
      .map(ub => ub.badgeId);
    
    const badges = mockBadges.badges
      .filter(badge => userBadgeIds.includes(badge.id))
      .map(badge => ({
        ...badge,
        awardedAt: mockBadges.userBadges.find(ub => ub.badgeId === badge.id && ub.userId === userId).awardedAt
      }));
    
    return Promise.resolve({
      data: badges
    });
  },
  
  getHouseholdBadges: (householdId) => {
    const result = {};
    
    Object.keys(mockBadges.householdBadges).forEach(userId => {
      const memberBadges = mockBadges.householdBadges[userId].map(badgeId => {
        const badge = mockBadges.badges.find(b => b.id === badgeId);
        return {
          ...badge,
          awardedAt: mockBadges.userBadges.find(
            ub => ub.badgeId === badgeId && ub.userId === userId
          )?.awardedAt || '2023-01-01T00:00:00Z'
        };
      });
      
      result[userId] = memberBadges;
    });
    
    return Promise.resolve({
      data: result
    });
  },
  
  checkBadges: () => {
    return Promise.resolve({
      data: {
        newBadges: [
          {
            id: 'badge-3',
            type: 'top_contributor',
            name: 'Top Contributor',
            description: 'Completed the most tasks in a month'
          }
        ]
      }
    });
  }
};
