
export const mockCalendar = {
  events: [
    {
      id: 'event-1',
      title: 'House Meeting',
      startTime: '2023-06-18T19:00:00Z',
      endTime: '2023-06-18T20:00:00Z',
      recurrenceRule: null,
      privacy: 'public',
      createdAt: '2023-06-10T14:30:00Z',
      householdId: 'household-1',
      userId: 'user-1',
      creator: {
        id: 'user-1',
        firstName: 'Demo',
        lastName: 'User'
      }
    },
    {
      id: 'event-2',
      title: 'Movie Night',
      startTime: '2023-06-20T20:00:00Z',
      endTime: '2023-06-20T22:30:00Z',
      recurrenceRule: null,
      privacy: 'public',
      createdAt: '2023-06-12T10:15:00Z',
      householdId: 'household-1',
      userId: 'user-2',
      creator: {
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Doe'
      }
    },
    {
      id: 'event-3',
      title: 'Rent Due',
      startTime: '2023-07-01T00:00:00Z',
      endTime: '2023-07-01T23:59:59Z',
      recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=1',
      privacy: 'public',
      createdAt: '2023-06-15T09:00:00Z',
      householdId: 'household-1',
      userId: 'user-1',
      creator: {
        id: 'user-1',
        firstName: 'Demo',
        lastName: 'User'
      }
    },
    {
      id: 'event-4',
      title: 'Utility Bills Payment',
      startTime: '2023-06-25T00:00:00Z',
      endTime: '2023-06-25T23:59:59Z',
      recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=25',
      privacy: 'public',
      createdAt: '2023-06-15T09:15:00Z',
      householdId: 'household-1',
      userId: 'user-1',
      creator: {
        id: 'user-1',
        firstName: 'Demo',
        lastName: 'User'
      }
    },
    {
      id: 'event-5',
      title: 'Sam\'s Birthday Party',
      startTime: '2023-06-30T18:00:00Z',
      endTime: '2023-06-30T23:00:00Z',
      recurrenceRule: null,
      privacy: 'public',
      createdAt: '2023-06-16T11:30:00Z',
      householdId: 'household-1',
      userId: 'user-3',
      creator: {
        id: 'user-3',
        firstName: 'Sam',
        lastName: 'Smith'
      }
    }
  ],
  
  getEvents: (householdId, startDate, endDate) => {
    const events = mockCalendar.events.filter(event => event.householdId === householdId);
    
    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      
      return Promise.resolve({
        data: events.filter(event => {
          const eventStart = new Date(event.startTime).getTime();
          return eventStart >= start && eventStart <= end;
        })
      });
    }
    
    return Promise.resolve({
      data: events
    });
  },
  
  createEvent: (eventData) => {
    const newEvent = {
      id: `event-${Date.now()}`,
      title: eventData.title,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      recurrenceRule: eventData.recurrenceRule || null,
      privacy: eventData.privacy || 'public',
      createdAt: new Date().toISOString(),
      householdId: eventData.householdId,
      userId: eventData.userId,
      creator: {
        id: eventData.userId,
        firstName: 'Demo',
        lastName: 'User'
      }
    };
    
    return Promise.resolve({
      data: newEvent
    });
  }
};
