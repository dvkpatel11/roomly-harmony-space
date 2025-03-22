import { ProdAnalyticsService } from "./analytics/analytics.service";
import { ProdAuthService } from "./auth/auth.service";
import { ProdBadgeService } from "./badge/badge.service";
import { ProdCalendarService } from "./calendar/calendar.service";
import { ProdChatService } from "./chat/chat.service";
import { ProdHouseholdService } from "./household/household.service";
import { ProdNotificationService } from "./notification/notification.service";
import { ProdTaskService } from "./task/task.service";

// Export singleton instances
export const authService = new ProdAuthService();
export const householdService = new ProdHouseholdService();
export const taskService = new ProdTaskService();
export const chatService = new ProdChatService();
export const calendarService = new ProdCalendarService();
export const notificationService = new ProdNotificationService();
export const badgeService = new ProdBadgeService();
export const analyticsService = new ProdAnalyticsService();

// Re-export service types
export * from "../types/services";
