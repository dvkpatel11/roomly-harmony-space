
export const mockNotifications = {
  notifications: [
    {
      id: 'notif-1',
      type: 'task_reminder',
      content: 'Your task "Clean kitchen" is due today',
      isRead: false,
      createdAt: '2023-06-15T08:00:00Z',
      userId: 'user-1',
      householdId: 'household-1',
      referenceType: 'task',
      referenceId: 'task-1'
    },
    {
      id: 'notif-2',
      type: 'poll_update',
      content: 'New poll: "What should we have for dinner on Saturday?"',
      isRead: true,
      createdAt: '2023-06-15T10:05:00Z',
      userId: 'user-1',
      householdId: 'household-1',
      referenceType: 'poll',
      referenceId: 'poll-1'
    },
    {
      id: 'notif-3',
      type: 'announcement',
      content: 'Demo User posted an announcement: "We need to discuss the cleaning schedule this weekend"',
      isRead: false,
      createdAt: '2023-06-13T18:20:00Z',
      userId: 'user-1',
      householdId: 'household-1',
      referenceType: 'message',
      referenceId: 'msg-3'
    },
    {
      id: 'notif-4',
      type: 'badge_earned',
      content: 'You earned the "5-Day Streak" badge!',
      isRead: true,
      createdAt: '2023-05-20T14:35:00Z',
      userId: 'user-1',
      householdId: 'household-1',
      referenceType: 'badge',
      referenceId: 'badge-1'
    },
    {
      id: 'notif-5',
      type: 'task_assigned',
      content: 'You have been assigned a new task: "Water plants"',
      isRead: false,
      createdAt: '2023-06-11T09:05:00Z',
      userId: 'user-1',
      householdId: 'household-1',
      referenceType: 'task',
      referenceId: 'task-4'
    }
  ],
  
  getNotifications: (params = {}) => {
    let notifications = [...mockNotifications.notifications];
    
    // Filter by read status if provided
    if (params.isRead !== undefined) {
      notifications = notifications.filter(notif => notif.isRead === params.isRead);
    }
    
    // Sort by createdAt descending
    notifications.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Apply limit if provided
    if (params.limit) {
      notifications = notifications.slice(0, params.limit);
    }
    
    return Promise.resolve({
      data: notifications
    });
  },
  
  markAsRead: (notificationId) => {
    // Mark single notification as read
    return Promise.resolve({
      data: {
        success: true
      }
    });
  },
  
  markAllAsRead: () => {
    // Mark all notifications as read
    return Promise.resolve({
      data: {
        success: true,
        count: mockNotifications.notifications.filter(n => !n.isRead).length
      }
    });
  },
  
  getUnreadCount: () => {
    const count = mockNotifications.notifications.filter(n => !n.isRead).length;
    
    return Promise.resolve({
      data: {
        count
      }
    });
  },
  
  createNotification: (notificationData) => {
    const newNotification = {
      id: `notif-${Date.now()}`,
      type: notificationData.type,
      content: notificationData.content,
      isRead: false,
      createdAt: new Date().toISOString(),
      userId: notificationData.userId,
      householdId: notificationData.householdId,
      referenceType: notificationData.referenceType || null,
      referenceId: notificationData.referenceId || null
    };
    
    return Promise.resolve({
      data: newNotification
    });
  },
  
  deleteNotification: (notificationId) => {
    return Promise.resolve({
      data: {
        success: true
      }
    });
  }
};
