
export const mockPolls = {
  polls: [
    {
      id: 'poll-1',
      question: 'What should we have for dinner on Saturday?',
      options: {
        'Italian': 2,
        'Mexican': 1,
        'Chinese': 0
      },
      expiresAt: '2023-06-17T20:00:00Z',
      createdAt: '2023-06-15T10:00:00Z',
      householdId: 'household-1',
      creator: {
        id: 'user-1',
        firstName: 'Demo',
        lastName: 'User'
      }
    },
    {
      id: 'poll-2',
      question: 'When should we schedule the deep cleaning?',
      options: {
        'This Saturday': 3,
        'Next Saturday': 1,
        'Split over weekdays': 0
      },
      expiresAt: '2023-06-20T18:00:00Z',
      createdAt: '2023-06-16T09:30:00Z',
      householdId: 'household-1',
      creator: {
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Doe'
      }
    },
    {
      id: 'poll-3',
      question: 'Movie genre for movie night?',
      options: {
        'Action': 1,
        'Comedy': 2,
        'Horror': 0,
        'Sci-Fi': 1
      },
      expiresAt: '2023-06-19T19:00:00Z',
      createdAt: '2023-06-17T12:15:00Z',
      householdId: 'household-1',
      creator: {
        id: 'user-4',
        firstName: 'Alex',
        lastName: 'Jones'
      }
    }
  ],
  
  userVotes: {
    'poll-1': 'Italian',
    'poll-3': 'Comedy'
  },
  
  getPolls: (householdId, status = 'active') => {
    const now = new Date().toISOString();
    const polls = mockPolls.polls.filter(poll => poll.householdId === householdId);
    
    // Filter by status
    if (status === 'active') {
      return Promise.resolve({
        data: polls.filter(poll => poll.expiresAt > now)
      });
    } else if (status === 'expired') {
      return Promise.resolve({
        data: polls.filter(poll => poll.expiresAt <= now)
      });
    }
    
    return Promise.resolve({
      data: polls
    });
  },
  
  getPoll: (pollId) => {
    const poll = mockPolls.polls.find(p => p.id === pollId);
    
    if (!poll) {
      return Promise.reject({
        error: 'Poll not found'
      });
    }
    
    return Promise.resolve({
      data: {
        ...poll,
        userVote: mockPolls.userVotes[pollId] || null
      }
    });
  },
  
  createPoll: (pollData) => {
    const options = {};
    pollData.options.forEach(option => {
      options[option] = 0;
    });
    
    const newPoll = {
      id: `poll-${Date.now()}`,
      question: pollData.question,
      options,
      expiresAt: pollData.expiresAt,
      createdAt: new Date().toISOString(),
      householdId: pollData.householdId,
      creator: {
        id: 'user-1',
        firstName: 'Demo',
        lastName: 'User'
      }
    };
    
    return Promise.resolve({
      data: newPoll
    });
  },
  
  vote: (pollId, option) => {
    return Promise.resolve({
      data: {
        success: true,
        option
      }
    });
  }
};
