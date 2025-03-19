
// This file is a placeholder for actual service implementations
// In a real app, these would connect to your backend APIs

import { 
  AuthService, 
  HouseholdService, 
  TaskService,
  NotificationService,
  BadgeService,
  PollService,
  ChatService
} from "@/types/index";
import { TaskMockService } from "./task/task-mock.service";

// Auth service
export const getAuthService = (): AuthService => {
  throw new Error("Real auth service not implemented");
};

// Household service
export const getHouseholdService = (): HouseholdService => {
  throw new Error("Real household service not implemented");
};

// Task service
export const getTaskService = (): TaskService => {
  return new TaskMockService();
};

// Notification service
export const getNotificationService = (): NotificationService => {
  throw new Error("Real notification service not implemented");
};

// Badge service
export const getBadgeService = (): BadgeService => {
  throw new Error("Real badge service not implemented");
};

// Poll service
export const getPollService = (): PollService => {
  throw new Error("Real poll service not implemented");
};

// Chat service
export const getChatService = (): ChatService => {
  throw new Error("Real chat service not implemented");
};

// Calendar service
export const getCalendarService = () => {
  throw new Error("Real calendar service not implemented");
};
