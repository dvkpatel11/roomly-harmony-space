
import { TaskFrequency } from '../types';

export const mockTasks = {
  tasksList: [
    {
      id: 'task-1',
      title: 'Clean kitchen',
      household_id: 'household-1',
      created_by: 'user-1',
      assigned_to: 'user-1',
      due_date: '2023-06-15T18:00:00Z',
      completed: false,
      completed_at: null,
      frequency: 'weekly',
      created_at: '2023-06-10T10:00:00Z'
    },
    {
      id: 'task-2',
      title: 'Take out trash',
      household_id: 'household-1',
      created_by: 'user-1',
      assigned_to: 'user-2',
      due_date: '2023-06-14T20:00:00Z',
      completed: true,
      completed_at: '2023-06-14T19:30:00Z',
      frequency: 'daily',
      created_at: '2023-06-10T10:15:00Z'
    },
    {
      id: 'task-3',
      title: 'Grocery shopping',
      household_id: 'household-1',
      created_by: 'user-3',
      assigned_to: 'user-3',
      due_date: '2023-06-17T19:00:00Z',
      completed: false,
      completed_at: null,
      frequency: 'weekly',
      created_at: '2023-06-10T10:30:00Z'
    },
    {
      id: 'task-4',
      title: 'Water plants',
      household_id: 'household-1',
      created_by: 'user-2',
      assigned_to: 'user-4',
      due_date: '2023-06-16T10:00:00Z',
      completed: false,
      completed_at: null,
      frequency: 'weekly',
      created_at: '2023-06-11T09:00:00Z'
    },
    {
      id: 'task-5',
      title: 'Clean bathroom',
      household_id: 'household-1',
      created_by: 'user-1',
      assigned_to: 'user-2',
      due_date: '2023-06-18T12:00:00Z',
      completed: false,
      completed_at: null,
      frequency: 'weekly',
      created_at: '2023-06-11T09:15:00Z'
    }
  ],
  
  recurringRules: [
    {
      id: 'rule-1',
      taskId: 'task-1',
      interval_days: 7, // weekly
      end_date: null
    },
    {
      id: 'rule-2',
      taskId: 'task-2',
      interval_days: 1, // daily
      end_date: null
    }
  ],
  
  getTasks: (householdId, filters = {}) => {
    let filteredTasks = mockTasks.tasksList.filter(task => task.household_id === householdId);
    
    // Apply status filter if provided
    if (filters.status === 'completed') {
      filteredTasks = filteredTasks.filter(task => task.completed);
    } else if (filters.status === 'pending') {
      filteredTasks = filteredTasks.filter(task => !task.completed);
    }
    
    // Apply assignment filter if provided
    if (filters.assignedTo) {
      filteredTasks = filteredTasks.filter(task => task.assigned_to === filters.assignedTo);
    }

    // Apply frequency filter if provided
    if (filters.frequency && filters.frequency !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.frequency === filters.frequency);
    }
    
    return Promise.resolve({
      tasks: filteredTasks,
      total: filteredTasks.length,
      page: filters.page || 1,
      per_page: filters.per_page || 20
    });
  },
  
  getUserTasks: (userId) => {
    const userTasks = mockTasks.tasksList.filter(task => task.assigned_to === userId);
    return Promise.resolve(userTasks);
  },
  
  createTask: (householdId, taskData) => {
    return Promise.resolve({
      message: 'Task created successfully',
      task_id: `task-${Date.now()}`,
      assigned_to: taskData.preferred_assignee || 'user-1'
    });
  },
  
  updateTask: (taskId, request) => {
    return Promise.resolve();
  },
  
  completeTask: (taskId) => {
    return Promise.resolve({
      message: 'Task completed successfully',
      streak: 3
    });
  },
  
  deleteTask: (taskId) => {
    return Promise.resolve();
  },
  
  swapTask: (taskId, request) => {
    return Promise.resolve({
      message: 'Task swapped successfully',
      new_assignee: request.new_assignee_id
    });
  }
};
