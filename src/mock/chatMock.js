
export const mockChat = {
  messages: [
    {
      id: 'msg-1',
      content: 'Did anyone see my charger?',
      sender_id: 'user-2',
      sender_email: 'jane@example.com',
      household_id: 'household-1',
      created_at: '2023-06-14T10:45:00Z',
      is_announcement: false
    },
    {
      id: 'msg-2',
      content: 'I\'ll be late tonight',
      sender_id: 'user-3',
      sender_email: 'sam@example.com',
      household_id: 'household-1',
      created_at: '2023-06-14T09:30:00Z',
      is_announcement: false
    },
    {
      id: 'msg-3',
      content: 'We need to discuss the cleaning schedule this weekend',
      sender_id: 'user-1',
      sender_email: 'demo@example.com',
      household_id: 'household-1',
      created_at: '2023-06-13T18:15:00Z',
      is_announcement: true
    },
    {
      id: 'msg-4',
      content: 'I bought some milk, it\'s in the fridge',
      sender_id: 'user-4',
      sender_email: 'alex@example.com',
      household_id: 'household-1',
      created_at: '2023-06-13T15:20:00Z',
      is_announcement: false
    },
    {
      id: 'msg-5',
      content: 'Anyone want to order takeout tonight?',
      sender_id: 'user-2',
      sender_email: 'jane@example.com',
      household_id: 'household-1',
      created_at: '2023-06-13T12:10:00Z',
      is_announcement: false
    }
  ],
  
  getMessages: (householdId, params = {}) => {
    const messages = mockChat.messages.filter(msg => msg.household_id === householdId);
    
    // Sort by createdAt descending
    const sortedMessages = [...messages].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    // Paginate
    const limit = params.limit || 20;
    const paginatedMessages = sortedMessages.slice(0, limit);
    
    return Promise.resolve({
      messages: paginatedMessages,
      total: messages.length,
      page: 1,
      per_page: limit
    });
  },
  
  sendMessage: (householdId, message) => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      content: message.content,
      sender_id: 'user-1',
      sender_email: 'demo@example.com',
      household_id: householdId,
      created_at: new Date().toISOString(),
      is_announcement: message.is_announcement || false
    };
    
    return Promise.resolve(newMessage);
  },
  
  // WebSocket methods
  connect: () => Promise.resolve(),
  disconnect: () => {},
  joinHousehold: (householdId) => Promise.resolve(),
  leaveHousehold: (householdId) => Promise.resolve(),
  
  // Event listeners
  onNewMessage: (callback) => {
    // Setup mock listener
    // For now, return cleanup function
    return () => {};
  },
  onUserJoined: (callback) => {
    return () => {};
  },
  onUserOffline: (callback) => {
    return () => {};
  },
  onError: (callback) => {
    return () => {};
  }
};
