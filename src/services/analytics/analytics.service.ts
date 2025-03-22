import {
  AnalyticsPermissionError,
  AnalyticsResponse,
  AnalyticsService,
  DateRange,
  TaskAnalytics,
  UserAnalytics,
  UserBadge,
} from "@/types";
import { BaseService } from "../base.service";

export class ProdAnalyticsService extends BaseService implements AnalyticsService {
  async getTaskAnalytics(householdId: string, dateRange?: DateRange): Promise<TaskAnalytics> {
    const queryParams = new URLSearchParams();
    if (dateRange) {
      if (dateRange.start) queryParams.append("start_date", dateRange.start);
      if (dateRange.end) queryParams.append("end_date", dateRange.end);
    }

    return this.handleRequest<TaskAnalytics>(() =>
      fetch(`${this.apiUrl}/analytics/${householdId}/tasks?${queryParams}`, {
        headers: this.getHeaders(),
      })
    );
  }

  async getUserAnalytics(householdId: string, dateRange?: DateRange): Promise<UserAnalytics> {
    const queryParams = new URLSearchParams();
    if (dateRange) {
      if (dateRange.start) queryParams.append("start_date", dateRange.start);
      if (dateRange.end) queryParams.append("end_date", dateRange.end);
    }

    return this.handleRequest<UserAnalytics>(() =>
      fetch(`${this.apiUrl}/analytics/${householdId}/users?${queryParams}`, {
        headers: this.getHeaders(),
      })
    );
  }

  async getHouseholdAnalytics(householdId: string, dateRange?: DateRange): Promise<AnalyticsResponse> {
    const queryParams = new URLSearchParams();
    if (dateRange) {
      if (dateRange.start) queryParams.append("start_date", dateRange.start);
      if (dateRange.end) queryParams.append("end_date", dateRange.end);
    }

    return this.handleRequest<AnalyticsResponse>(async () => {
      const response = await fetch(`${this.apiUrl}/households/${householdId}/analytics?${queryParams}`, {
        headers: this.getHeaders(),
      });
      if (response.status === 403) {
        throw {
          error: "Not a household member",
          code: 403,
        } as AnalyticsPermissionError;
      }
      return response;
    });
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return this.handleRequest<UserBadge[]>(async () => {
      const response = await fetch(`${this.apiUrl}/users/${userId}/badges`, {
        headers: this.getHeaders(),
      });
      if (response.status === 403) {
        throw {
          error: "Unauthorized access",
          code: 403,
        } as AnalyticsPermissionError;
      }
      return response;
    });
  }
}
