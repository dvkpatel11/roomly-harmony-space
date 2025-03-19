
export type TaskStatus = "pending" | "completed" | "overdue";

export type TaskFrequency = "one_time" | "daily" | "weekly" | "monthly";

export interface Task {
  id: string;
  title: string;
  household_id: string;
  created_by: string;
  assigned_to: string;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  frequency: TaskFrequency;
  created_at: string;
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
  task_id: string;
  assigned_to: string;
}

export interface UpdateTaskRequest {
  title?: string;
  due_date?: string;
  assigned_to?: string;
}

export interface CompleteTaskResponse {
  message: string;
  streak: number;
}

export interface SwapTaskRequest {
  new_assignee_id: string;
}

export interface SwapTaskResponse {
  message: string;
  new_assignee: string;
}

export interface TaskResponse {
  tasks: Task[];
  total: number;
  page: number;
  per_page: number;
}

export interface TaskFilters {
  status?: "all" | "completed" | "pending";
  assignedTo?: string;
  frequency?: TaskFrequency | "all";
  page?: number;
  per_page?: number;
  include_completed?: boolean;
}

export interface TaskService {
  createTask(householdId: string, request: CreateTaskRequest): Promise<CreateTaskResponse>;
  updateTask(taskId: string, request: UpdateTaskRequest): Promise<void>;
  getTasks(householdId: string, filters?: TaskFilters): Promise<TaskResponse>;
  getUserTasks(userId: string): Promise<Task[]>;
  completeTask(taskId: string): Promise<CompleteTaskResponse>;   
  deleteTask(taskId: string): Promise<void>;
  swapTask(taskId: string, request: SwapTaskRequest): Promise<SwapTaskResponse>;
}
