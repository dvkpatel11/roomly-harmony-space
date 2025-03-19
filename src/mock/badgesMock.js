
export const mockBadges = {
  badges: [
    {
      id: 'badge-1',
      type: '5_day_streak',
      name: '5-Day Streak',
      description: 'Completed tasks for 5 consecutive days',
      icon: 'streak-5',
      awarded_at: '2023-05-20T14:30:00Z',
      requirements: {
        target_value: 5,
        current_value: 5
      }
    },
    {
      id: 'badge-2',
      type: '10_day_streak',
      name: '10-Day Streak',
      description: 'Completed tasks for 10 consecutive days',
      icon: 'streak-10',
      awarded_at: null,
      requirements: {
        target_value: 10,
        current_value: 6
      }
    },
    {
      id: 'badge-3',
      type: 'top_contributor',
      name: 'Top Contributor',
      description: 'Completed the most tasks in a month',
      icon: 'trophy',
      awarded_at: null,
      requirements: {
        target_value: 1,
        current_value: 0
      }
    },
    {
      id: 'badge-4',
      type: 'early_bird',
      name: 'Early Bird',
      description: 'Completed 5 tasks before their due dates',
      icon: 'early-bird',
      awarded_at: null,
      requirements: {
        target_value: 5,
        current_value: 3
      }
    },
    {
      id: 'badge-5',
      type: 'household_founder',
      name: 'Household Founder',
      description: 'Created a household',
      icon: 'founder',
      awarded_at: '2023-01-20T10:35:00Z',
      requirements: {
        target_value: 1,
        current_value: 1
      }
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
  
  getAllBadges: () => {
    return Promise.resolve({
      badges: mockBadges.badges,
      total: mockBadges.badges.length
    });
  },
  
  getUserBadges: (userId) => {
    const userBadgeIds = mockBadges.userBadges
      .filter(ub => ub.userId === userId)
      .map(ub => ub.badgeId);
    
    const badges = mockBadges.badges
      .filter(badge => userBadgeIds.includes(badge.id))
      .map(badge => ({
        ...badge,
        awarded_at: mockBadges.userBadges.find(ub => ub.badgeId === badge.id && ub.userId === userId).awardedAt
      }));
    
    return Promise.resolve({
      badges,
      total: badges.length
    });
  },
  
  getBadgeProgress: (badgeId) => {
    const badge = mockBadges.badges.find(b => b.id === badgeId);
    
    return Promise.resolve({
      badge_id: badgeId,
      current_value: badge.requirements.current_value,
      target_value: badge.requirements.target_value,
      percentage: Math.round((badge.requirements.current_value / badge.requirements.target_value) * 100)
    });
  }
};
