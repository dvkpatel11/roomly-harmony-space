export type TaskStatus = "pending" | "completed" | "overdue";

export type TaskFrequency = "one_time" | "daily" | "weekly" | "monthly";

export interface Task {
  id: string;
  title: string;
  description: string;
  frequency: TaskFrequency;
  due_date: string;
  completed: boolean;
  completed_at?: string;
  assigned_to_name?: string;
  created_by: string;
  status: TaskStatus;
}

export interface CreateTaskRequest {
  title: string;
  frequency?: TaskFrequency;
  preferred_assignee?: string;
  due_date?: string;
  is_recurring?: boolean;
  interval_days?: number;
  end_date?: string;
}

export interface CreateTaskResponse {
  message: string;
  task: {
    id: string;
    title: string;
    frequency: TaskFrequency;
    due_date: string;
    assigned_to?: string;
    created_by: string;
  };
}

export interface TaskResponse {
  tasks: Array<Task>;
  total: number;
  page: number;
  per_page: number;
}

export interface CompleteTaskResponse {
  message: string;
  task: {
    id: string;
    completed: boolean;
    completed_at: string;
  };
}

export interface SwapTaskResponse {
  message: string;
  task: {
    id: string;
    assigned_to: string;
  };
}

export interface UpdateTaskRequest {
  title?: string;
  due_date?: string;
  assigned_to?: string;
}
