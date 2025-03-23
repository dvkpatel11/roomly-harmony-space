import {
  getAuth,
  getBadges,
  getCalendar,
  getChat,
  getHouseholds,
  getNotifications,
  getPolls,
  getTasks,
} from "@/services/service-factory";
import { useMemo } from "react";

export function useServiceFactory() {
  return useMemo(
    () => ({
      getAuthService: getAuth,
      getBadgeService: getBadges,
      getCalendarService: getCalendar,
      getChatService: getChat,
      getHouseholdService: getHouseholds,
      getNotificationService: getNotifications,
      getPollService: getPolls,
      getTaskService: getTasks,
    }),
    []
  );
}
