import { AuthService } from "@/types/auth";
import { HouseholdService } from "@/types/household";
import {
  BadgeService,
  CalendarService,
  ChatService,
  NotificationService,
  PollService,
  TaskService,
} from "@/types/services";
import { ProdAuthService } from "./auth/auth.service";
import { ProdBadgeService } from "./badge/badge.service";
import { ProdCalendarService } from "./calendar/calendar.service";
import { ProdChatService } from "./chat/chat.service";
import { ProdHouseholdService } from "./household/household.service";
import { ProdNotificationService } from "./notification/notification.service";
import { ProdPollService } from "./poll/poll.service";
import { ProdTaskService } from "./task/task.service";

// Singleton instances
let authService: AuthService | null = null;
let notificationService: NotificationService | null = null;
let badgeService: BadgeService | null = null;
let householdService: HouseholdService | null = null;
let calendarService: CalendarService | null = null;
let chatService: ChatService | null = null;
let taskService: TaskService | null = null;
let pollService: PollService | null = null;

// Current household tracking
let currentHouseholdId: string | null = null;

export const setCurrentHouseholdId = (householdId: string | null) => {
  if (currentHouseholdId !== householdId) {
    currentHouseholdId = householdId;

    // Update household ID in all services
    if (notificationService) notificationService.setCurrentHousehold(householdId);
    if (badgeService) badgeService.setCurrentHousehold(householdId);
    if (calendarService) calendarService.setCurrentHousehold(householdId);
    if (chatService) chatService.setCurrentHousehold(householdId);
    if (taskService) taskService.setCurrentHousehold(householdId);
    if (pollService) pollService.setCurrentHousehold(householdId);
  }
};

export const getAuth = (): AuthService => {
  if (!authService) {
    authService = new ProdAuthService();
  }
  return authService;
};

export const getNotifications = (): NotificationService => {
  if (!notificationService) {
    notificationService = new ProdNotificationService();
    notificationService.setCurrentHousehold(currentHouseholdId);
  }
  return notificationService;
};

export const getBadges = (): BadgeService => {
  if (!badgeService) {
    badgeService = new ProdBadgeService();
    badgeService.setCurrentHousehold(currentHouseholdId);
  }
  return badgeService;
};

export const getHouseholds = (): HouseholdService => {
  if (!householdService) {
    householdService = new ProdHouseholdService();
  }
  return householdService;
};

export const getCalendar = (): CalendarService => {
  if (!calendarService) {
    calendarService = new ProdCalendarService();
    calendarService.setCurrentHousehold(currentHouseholdId);
  }
  return calendarService;
};

export const getChat = (): ChatService => {
  if (!chatService) {
    chatService = new ProdChatService();
    chatService.setCurrentHousehold(currentHouseholdId);
  }
  return chatService;
};

export const getTasks = (): TaskService => {
  if (!taskService) {
    taskService = new ProdTaskService();
    taskService.setCurrentHousehold(currentHouseholdId);
  }
  return taskService;
};

export const getPolls = (): PollService => {
  if (!pollService) {
    pollService = new ProdPollService();
    pollService.setCurrentHousehold(currentHouseholdId);
  }
  return pollService;
};
