
import config from "@/lib/config";
import { 
  AuthService, 
  HouseholdService, 
  TaskService,
  NotificationService,
  BadgeService,
  PollService,
  ChatService
} from "@/types/index";
import { 
  mockAuth, 
  mockHouseholds, 
  mockTasks, 
  mockNotifications, 
  mockBadges, 
  mockPolls, 
  mockChat,
  mockCalendar
} from "@/mock";
import { 
  getAuthService, 
  getHouseholdService, 
  getTaskService,
  getNotificationService,
  getBadgeService,
  getPollService,
  getChatService,
  getCalendarService
} from "./service-factory";

// Auth service provider
export const getAuth = (): AuthService => {
  return config.useMockData ? mockAuth : getAuthService();
};

// Household service provider
export const getHouseholds = (): HouseholdService => {
  return config.useMockData ? mockHouseholds : getHouseholdService();
};

// Task service provider
export const getTasks = (): TaskService => {
  return config.useMockData ? mockTasks : getTaskService();
};

// Notification service provider
export const getNotifications = (): NotificationService => {
  return config.useMockData ? mockNotifications : getNotificationService();
};

// Badge service provider
export const getBadges = (): BadgeService => {
  return config.useMockData ? mockBadges : getBadgeService();
};

// Poll service provider
export const getPolls = (): PollService => {
  return config.useMockData ? mockPolls : getPollService();
};

// Chat service provider
export const getChat = (): ChatService => {
  return config.useMockData ? mockChat : getChatService();
};

// Calendar service provider
export const getCalendar = () => {
  return config.useMockData ? mockCalendar : getCalendarService();
};
