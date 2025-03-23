export type TaskStatus = "pending" | "completed" | "overdue";

export type TaskFrequency = "once" | "daily" | "weekly" | "monthly";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  created_by: string;
  assigned_to: string | null;
  assigned_to_name?: string;
  household_id: string;
  household?: {
    id: string;
    name: string;
    admin_id: string;
  };
  frequency: TaskFrequency;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  frequency?: TaskFrequency;
  due_date?: string;
  preferred_assignee?: string;
  is_recurring?: boolean;
  interval_days?: number;
  end_date?: string;
}

export interface CreateTaskResponse {
  message: string;
  task_id: string;
  assigned_to: string;
}

export interface TaskResponse {
  tasks: Task[];
  total: number;
  page: number;
  per_page: number;
}

export interface CompleteTaskResponse {
  message: string;
  streak: number;
}

export interface SwapTaskResponse {
  message: string;
  new_assignee: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  due_date?: string | null;
  frequency?: TaskFrequency;
  assigned_to?: string | null;
  is_recurring?: boolean;
  interval_days?: number;
  end_date?: string | null;
}

// Task-related WebSocket events
export interface TaskAssignedEvent {
  type: "task_assigned";
  task_id: string;
  assigned_to: string;
  assigned_to_name: string;
}

export interface TaskCompletedEvent {
  type: "task_completed";
  task_id: string;
  completed_by: string;
  completed_at: string;
  streak: number;
}

export interface TaskUpdatedEvent {
  type: "task_updated";
  task: Task;
}

export interface TaskDeletedEvent {
  type: "task_deleted";
  task_id: string;
}
