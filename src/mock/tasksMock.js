
export const mockTasks = {
  tasksList: [
    {
      id: 'task-1',
      title: 'Clean kitchen',
      frequency: 'weekly',
      dueDate: '2023-06-15T18:00:00Z',
      completed: false,
      completedAt: null,
      createdAt: '2023-06-10T10:00:00Z',
      householdId: 'household-1',
      createdBy: 'user-1',
      assignedTo: 'user-1'
    },
    {
      id: 'task-2',
      title: 'Take out trash',
      frequency: 'daily',
      dueDate: '2023-06-14T20:00:00Z',
      completed: true,
      completedAt: '2023-06-14T19:30:00Z',
      createdAt: '2023-06-10T10:15:00Z',
      householdId: 'household-1',
      createdBy: 'user-1',
      assignedTo: 'user-2'
    },
    {
      id: 'task-3',
      title: 'Grocery shopping',
      frequency: 'weekly',
      dueDate: '2023-06-17T19:00:00Z',
      completed: false,
      completedAt: null,
      createdAt: '2023-06-10T10:30:00Z',
      householdId: 'household-1',
      createdBy: 'user-3',
      assignedTo: 'user-3'
    },
    {
      id: 'task-4',
      title: 'Water plants',
      frequency: 'weekly',
      dueDate: '2023-06-16T10:00:00Z',
      completed: false,
      completedAt: null,
      createdAt: '2023-06-11T09:00:00Z',
      householdId: 'household-1',
      createdBy: 'user-2',
      assignedTo: 'user-4'
    },
    {
      id: 'task-5',
      title: 'Clean bathroom',
      frequency: 'weekly',
      dueDate: '2023-06-18T12:00:00Z',
      completed: false,
      completedAt: null,
      createdAt: '2023-06-11T09:15:00Z',
      householdId: 'household-1',
      createdBy: 'user-1',
      assignedTo: 'user-2'
    }
  ],
  
  recurringRules: [
    {
      id: 'rule-1',
      taskId: 'task-1',
      intervalDays: 7, // weekly
      anchorDate: '2023-06-08T18:00:00Z',
      endDate: null
    },
    {
      id: 'rule-2',
      taskId: 'task-2',
      intervalDays: 1, // daily
      anchorDate: '2023-06-13T20:00:00Z',
      endDate: null
    }
  ],
  
  getTasks: (householdId, filters = {}) => {
    let filteredTasks = mockTasks.tasksList.filter(task => task.householdId === householdId);
    
    // Apply status filter if provided
    if (filters.status === 'completed') {
      filteredTasks = filteredTasks.filter(task => task.completed);
    } else if (filters.status === 'incomplete') {
      filteredTasks = filteredTasks.filter(task => !task.completed);
    }
    
    // Apply assignment filter if provided
    if (filters.assignedTo) {
      filteredTasks = filteredTasks.filter(task => task.assignedTo === filters.assignedTo);
    }
    
    return Promise.resolve({
      data: filteredTasks
    });
  },
  
  createTask: (taskData) => {
    const newTask = {
      id: `task-${Date.now()}`,
      title: taskData.title,
      frequency: taskData.frequency || 'one_time',
      dueDate: taskData.dueDate || null,
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      householdId: taskData.householdId,
      createdBy: taskData.createdBy,
      assignedTo: taskData.assignedTo
    };
    
    return Promise.resolve({
      data: newTask
    });
  },
  
  completeTask: (taskId) => {
    return Promise.resolve({
      data: {
        success: true,
        streakCount: 3
      }
    });
  },
  
  swapTask: (taskId, newAssigneeId) => {
    return Promise.resolve({
      data: {
        success: true,
        newAssignee: {
          id: newAssigneeId,
          email: 'jane@example.com',
          firstName: 'Jane'
        }
      }
    });
  }
};
