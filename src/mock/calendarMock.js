
export const mockCalendar = {
  events: [
    {
      id: 'event-1',
      title: 'House Meeting',
      start_time: '2023-06-18T19:00:00Z',
      end_time: '2023-06-18T20:00:00Z',
      recurrence_rule: null,
      household_id: 'household-1',
      created_by: 'user-1',
      created_at: '2023-06-10T14:30:00Z'
    },
    {
      id: 'event-2',
      title: 'Movie Night',
      start_time: '2023-06-20T20:00:00Z',
      end_time: '2023-06-20T22:30:00Z',
      recurrence_rule: null,
      household_id: 'household-1',
      created_by: 'user-2',
      created_at: '2023-06-12T10:15:00Z'
    },
    {
      id: 'event-3',
      title: 'Rent Due',
      start_time: '2023-07-01T00:00:00Z',
      end_time: '2023-07-01T23:59:59Z',
      recurrence_rule: 'FREQ=MONTHLY;BYMONTHDAY=1',
      household_id: 'household-1',
      created_by: 'user-1',
      created_at: '2023-06-15T09:00:00Z'
    },
    {
      id: 'event-4',
      title: 'Utility Bills Payment',
      start_time: '2023-06-25T00:00:00Z',
      end_time: '2023-06-25T23:59:59Z',
      recurrence_rule: 'FREQ=MONTHLY;BYMONTHDAY=25',
      household_id: 'household-1',
      created_by: 'user-1',
      created_at: '2023-06-15T09:15:00Z'
    },
    {
      id: 'event-5',
      title: 'Sam\'s Birthday Party',
      start_time: '2023-06-30T18:00:00Z',
      end_time: '2023-06-30T23:00:00Z',
      recurrence_rule: null,
      household_id: 'household-1',
      created_by: 'user-3',
      created_at: '2023-06-16T11:30:00Z'
    }
  ],
  
  getEvents: (householdId, startDate, endDate) => {
    const events = mockCalendar.events.filter(event => event.household_id === householdId);
    
    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      
      return Promise.resolve({
        data: events.filter(event => {
          const eventStart = new Date(event.start_time).getTime();
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
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      recurrence_rule: eventData.recurrence_rule || null,
      household_id: eventData.household_id,
      created_by: 'user-1',
      created_at: new Date().toISOString()
    };
    
    return Promise.resolve({
      data: newEvent
    });
  }
};
