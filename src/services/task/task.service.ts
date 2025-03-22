import { TaskService } from "@/types/services";
import {
  CompleteTaskResponse,
  CreateTaskRequest,
  CreateTaskResponse,
  SwapTaskResponse,
  Task,
  TaskResponse,
  TaskStatus,
  UpdateTaskRequest,
} from "../../types/task";
import { BaseService } from "../base.service";

export class ProdTaskService extends BaseService implements TaskService {
  private _tasks: Task[] = [];

  get tasks(): Task[] {
    return this._tasks;
  }

  async createTask(householdId: string, request: CreateTaskRequest): Promise<CreateTaskResponse> {
    return this.handleRequest<CreateTaskResponse>(
      () =>
        fetch(`${this.apiUrl}/households/${householdId}/tasks`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(request),
        }),
      "Task created successfully"
    );
  }

  async getTasks(
    householdId: string,
    params?: {
      status?: string;
      assignedTo?: string;
      frequency?: string;
      page?: number;
      per_page?: number;
      include_completed?: boolean;
    }
  ): Promise<TaskResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.status) queryParams.append("status", params.status);
      if (params.assignedTo) queryParams.append("assignedTo", params.assignedTo);
      if (params.frequency) queryParams.append("frequency", params.frequency);
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.per_page) queryParams.append("per_page", params.per_page.toString());
      if (params.include_completed !== undefined)
        queryParams.append("include_completed", params.include_completed.toString());
    }

    const response = await this.handleRequest<TaskResponse>(() =>
      fetch(`${this.apiUrl}/households/${householdId}/tasks?${queryParams}`, {
        headers: this.getHeaders(),
      })
    );

    this._tasks = response.tasks;
    return response;
  }

  async getUserTasks(userId: string): Promise<TaskResponse> {
    const response = await this.handleRequest<TaskResponse>(() =>
      fetch(`${this.apiUrl}/users/${userId}/tasks`, {
        headers: this.getHeaders(),
      })
    );

    this._tasks = response.tasks;
    return response;
  }

  async completeTask(taskId: string): Promise<CompleteTaskResponse> {
    return this.handleRequest<CompleteTaskResponse>(
      () =>
        fetch(`${this.apiUrl}/tasks/${taskId}/complete`, {
          method: "PATCH",
          headers: this.getHeaders(),
        }),
      "Task completed successfully"
    );
  }

  async swapTask(taskId: string, newAssigneeId: string): Promise<SwapTaskResponse> {
    return this.handleRequest<SwapTaskResponse>(
      () =>
        fetch(`${this.apiUrl}/tasks/${taskId}/swap`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({ new_assignee_id: newAssigneeId }),
        }),
      "Task reassigned successfully"
    );
  }

  async updateTask(taskId: string, updates: UpdateTaskRequest): Promise<void> {
    await this.handleRequest(
      () =>
        fetch(`${this.apiUrl}/tasks/${taskId}`, {
          method: "PATCH",
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        }),
      "Task updated successfully"
    );

    // Update local task if it exists
    const taskIndex = this._tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      this._tasks[taskIndex] = { ...this._tasks[taskIndex], ...updates };
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.handleRequest(
      () =>
        fetch(`${this.apiUrl}/tasks/${taskId}`, {
          method: "DELETE",
          headers: this.getHeaders(),
        }),
      "Task deleted successfully"
    );

    // Remove task from local state
    this._tasks = this._tasks.filter((t) => t.id !== taskId);
  }

  async getTask(taskId: string): Promise<Task> {
    const response = await this.handleRequest<{ task: Task }>(
      () =>
        fetch(`${this.apiUrl}/tasks/${taskId}`, {
          headers: this.getHeaders(),
        }),
      "Task fetched successfully"
    );
    return response.task;
  }

  async updateStatus(taskId: string, status: TaskStatus): Promise<TaskResponse> {
    const response = await this.handleRequest<TaskResponse>(
      () =>
        fetch(`${this.apiUrl}/tasks/${taskId}/status`, {
          method: "PATCH",
          headers: this.getHeaders(),
          body: JSON.stringify({ status }),
        }),
      "Task status updated successfully"
    );

    // Update local task if it exists
    const taskIndex = this._tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      this._tasks[taskIndex] = { ...this._tasks[taskIndex], status };
    }

    return response;
  }
}
