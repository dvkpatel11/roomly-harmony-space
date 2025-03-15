
export const mockChat = {
  messages: [
    {
      id: 'msg-1',
      content: 'Did anyone see my charger?',
      isAnnouncement: false,
      createdAt: '2023-06-14T10:45:00Z',
      householdId: 'household-1',
      userId: 'user-2',
      sender: {
        id: 'user-2',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe'
      }
    },
    {
      id: 'msg-2',
      content: 'I\'ll be late tonight',
      isAnnouncement: false,
      createdAt: '2023-06-14T09:30:00Z',
      householdId: 'household-1',
      userId: 'user-3',
      sender: {
        id: 'user-3',
        email: 'sam@example.com',
        firstName: 'Sam',
        lastName: 'Smith'
      }
    },
    {
      id: 'msg-3',
      content: 'We need to discuss the cleaning schedule this weekend',
      isAnnouncement: true,
      createdAt: '2023-06-13T18:15:00Z',
      householdId: 'household-1',
      userId: 'user-1',
      sender: {
        id: 'user-1',
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User'
      }
    },
    {
      id: 'msg-4',
      content: 'I bought some milk, it\'s in the fridge',
      isAnnouncement: false,
      createdAt: '2023-06-13T15:20:00Z',
      householdId: 'household-1',
      userId: 'user-4',
      sender: {
        id: 'user-4',
        email: 'alex@example.com',
        firstName: 'Alex',
        lastName: 'Jones'
      }
    },
    {
      id: 'msg-5',
      content: 'Anyone want to order takeout tonight?',
      isAnnouncement: false,
      createdAt: '2023-06-13T12:10:00Z',
      householdId: 'household-1',
      userId: 'user-2',
      sender: {
        id: 'user-2',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe'
      }
    }
  ],
  
  getMessages: (householdId, page = 1, limit = 20) => {
    const messages = mockChat.messages.filter(msg => msg.householdId === householdId);
    
    // Sort by createdAt descending
    const sortedMessages = [...messages].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Paginate
    const start = (page - 1) * limit;
    const end = page * limit;
    const paginatedMessages = sortedMessages.slice(start, end);
    
    return Promise.resolve({
      data: paginatedMessages,
      pagination: {
        page,
        limit,
        total: messages.length,
        totalPages: Math.ceil(messages.length / limit)
      }
    });
  },
  
  sendMessage: (householdId, content, isAnnouncement = false) => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      content,
      isAnnouncement,
      createdAt: new Date().toISOString(),
      householdId,
      userId: 'user-1',
      sender: {
        id: 'user-1',
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User'
      }
    };
    
    return Promise.resolve({
      data: newMessage
    });
  }
};
