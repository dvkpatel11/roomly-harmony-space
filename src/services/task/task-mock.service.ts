
import { 
  CompleteTaskResponse, 
  CreateTaskRequest, 
  CreateTaskResponse, 
  SwapTaskRequest, 
  SwapTaskResponse, 
  Task, 
  TaskFilters, 
  TaskResponse, 
  TaskService 
} from "@/types";
import { mockTasks } from "@/mock/tasksMock";
import { BaseMockService } from "../base-mock.service";

export class TaskMockService extends BaseMockService implements TaskService {
  async createTask(householdId: string, request: CreateTaskRequest): Promise<CreateTaskResponse> {
    await this.delay();
    return mockTasks.createTask(householdId, request);
  }

  async updateTask(taskId: string, request: UpdateTaskRequest): Promise<void> {
    await this.delay();
    return mockTasks.updateTask(taskId, request);
  }

  async getTasks(householdId: string, filters?: TaskFilters): Promise<TaskResponse> {
    await this.delay();
    return mockTasks.getTasks(householdId, filters);
  }

  async getUserTasks(userId: string): Promise<Task[]> {
    await this.delay();
    return mockTasks.getUserTasks(userId);
  }

  async completeTask(taskId: string): Promise<CompleteTaskResponse> {
    await this.delay();
    return mockTasks.completeTask(taskId);
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.delay();
    return mockTasks.deleteTask(taskId);
  }

  async swapTask(taskId: string, request: SwapTaskRequest): Promise<SwapTaskResponse> {
    await this.delay();
    return mockTasks.swapTask(taskId, request);
  }
}
