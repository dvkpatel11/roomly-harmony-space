
export const mockPolls = {
  polls: [
    {
      id: 'poll-1',
      question: 'What should we have for dinner on Saturday?',
      options: ['Italian', 'Mexican', 'Chinese'],
      expires_at: '2023-06-17T20:00:00Z',
      created_at: '2023-06-15T10:00:00Z',
      household_id: 'household-1',
      created_by: 'user-1'
    },
    {
      id: 'poll-2',
      question: 'When should we schedule the deep cleaning?',
      options: ['This Saturday', 'Next Saturday', 'Split over weekdays'],
      expires_at: '2023-06-20T18:00:00Z',
      created_at: '2023-06-16T09:30:00Z',
      household_id: 'household-1',
      created_by: 'user-2'
    },
    {
      id: 'poll-3',
      question: 'Movie genre for movie night?',
      options: ['Action', 'Comedy', 'Horror', 'Sci-Fi'],
      expires_at: '2023-06-19T19:00:00Z',
      created_at: '2023-06-17T12:15:00Z',
      household_id: 'household-1',
      created_by: 'user-4'
    }
  ],
  
  userVotes: {
    'poll-1': 0, // Italian
    'poll-3': 1  // Comedy
  },
  
  pollVotes: {
    'poll-1': [
      { option_index: 0, count: 2 }, // Italian
      { option_index: 1, count: 1 }, // Mexican
      { option_index: 2, count: 0 }  // Chinese
    ],
    'poll-2': [
      { option_index: 0, count: 3 }, // This Saturday
      { option_index: 1, count: 1 }, // Next Saturday
      { option_index: 2, count: 0 }  // Split over weekdays
    ],
    'poll-3': [
      { option_index: 0, count: 1 }, // Action
      { option_index: 1, count: 2 }, // Comedy
      { option_index: 2, count: 0 }, // Horror
      { option_index: 3, count: 1 }  // Sci-Fi
    ]
  },
  
  getPolls: (householdId, params = {}) => {
    const now = new Date().toISOString();
    let polls = mockPolls.polls.filter(poll => poll.household_id === householdId);
    
    // Filter by active status if provided
    if (params.active === true) {
      polls = polls.filter(poll => poll.expires_at > now);
    } else if (params.active === false) {
      polls = polls.filter(poll => poll.expires_at <= now);
    }
    
    const response = {
      id: polls[0]?.id,
      question: polls[0]?.question,
      options: polls[0]?.options,
      votes: mockPolls.pollVotes[polls[0]?.id] || [],
      created_by: polls[0]?.created_by,
      created_at: polls[0]?.created_at,
      expires_at: polls[0]?.expires_at
    };
    
    return Promise.resolve(response);
  },
  
  getPoll: (pollId) => {
    const poll = mockPolls.polls.find(p => p.id === pollId);
    
    if (!poll) {
      return Promise.reject({
        error: 'Poll not found'
      });
    }
    
    return Promise.resolve({
      id: poll.id,
      question: poll.question,
      options: poll.options,
      votes: mockPolls.pollVotes[poll.id] || [],
      created_by: poll.created_by,
      created_at: poll.created_at,
      expires_at: poll.expires_at
    });
  },
  
  getPollResults: (pollId) => {
    const poll = mockPolls.polls.find(p => p.id === pollId);
    const votes = mockPolls.pollVotes[pollId] || [];
    
    if (!poll) {
      return Promise.reject({
        error: 'Poll not found'
      });
    }
    
    const totalVotes = votes.reduce((sum, vote) => sum + vote.count, 0);
    const results = poll.options.map((option, index) => {
      const voteCount = votes.find(v => v.option_index === index)?.count || 0;
      return {
        option,
        count: voteCount,
        percentage: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0,
        voters: [
          { user_id: 'user-1', email: 'demo@example.com' },
          { user_id: 'user-2', email: 'jane@example.com' }
        ]
      };
    });
    
    return Promise.resolve({
      poll,
      votes: results
    });
  },
  
  createPoll: (householdId, pollData) => {
    const newPoll = {
      message: 'Poll created successfully',
      poll_id: `poll-${Date.now()}`
    };
    
    return Promise.resolve(newPoll);
  },
  
  vote: (pollId, request) => {
    return Promise.resolve({
      message: 'Vote recorded successfully'
    });
  },
  
  deletePoll: (pollId) => {
    return Promise.resolve();
  },
  
  subscribeToPollUpdates: (pollId, callback) => {
    // This would set up a subscription to poll updates
    // For mock purposes, we'll return a cleanup function
    return () => {};
  }
};
