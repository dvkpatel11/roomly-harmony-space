
export const mockNotifications = {
  notifications: [
    {
      id: 'notif-1',
      type: 'task_reminder',
      content: 'Your task "Clean kitchen" is due today',
      is_read: false,
      created_at: '2023-06-15T08:00:00Z',
      user_id: 'user-1',
      household_id: 'household-1',
      reference_type: 'task',
      reference_id: 'task-1'
    },
    {
      id: 'notif-2',
      type: 'poll_created',
      content: 'New poll: "What should we have for dinner on Saturday?"',
      is_read: true,
      created_at: '2023-06-15T10:05:00Z',
      user_id: 'user-1',
      household_id: 'household-1',
      reference_type: 'poll',
      reference_id: 'poll-1'
    },
    {
      id: 'notif-3',
      type: 'chat_mention',
      content: 'Demo User posted an announcement: "We need to discuss the cleaning schedule this weekend"',
      is_read: false,
      created_at: '2023-06-13T18:20:00Z',
      user_id: 'user-1',
      household_id: 'household-1',
      reference_type: 'message',
      reference_id: 'msg-3'
    },
    {
      id: 'notif-4',
      type: 'badge_earned',
      content: 'You earned the "5-Day Streak" badge!',
      is_read: true,
      created_at: '2023-05-20T14:35:00Z',
      user_id: 'user-1',
      household_id: 'household-1',
      reference_type: 'badge',
      reference_id: 'badge-1'
    },
    {
      id: 'notif-5',
      type: 'task_assignment',
      content: 'You have been assigned a new task: "Water plants"',
      is_read: false,
      created_at: '2023-06-11T09:05:00Z',
      user_id: 'user-1',
      household_id: 'household-1',
      reference_type: 'task',
      reference_id: 'task-4'
    }
  ],
  
  getNotifications: (params = {}) => {
    let notifications = [...mockNotifications.notifications];
    
    // Filter by read status if provided
    if (params.is_read !== undefined) {
      notifications = notifications.filter(notif => notif.is_read === params.is_read);
    }
    
    // Sort by createdAt descending
    notifications.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    // Apply limit if provided
    if (params.limit) {
      notifications = notifications.slice(0, params.limit);
    }
    
    return Promise.resolve({
      notifications,
      total: notifications.length,
      unread_count: mockNotifications.notifications.filter(n => !n.is_read).length
    });
  },
  
  markAsRead: (notificationId) => {
    return Promise.resolve({
      message: 'Notification marked as read'
    });
  },
  
  markAllAsRead: () => {
    return Promise.resolve({
      message: 'All notifications marked as read'
    });
  },
  
  deleteNotification: (notificationId) => {
    return Promise.resolve();
  }
};
