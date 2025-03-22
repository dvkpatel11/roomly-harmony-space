import { Notification } from "@/types/notification";
import {
  DeleteNotificationResponse,
  GetNotificationsParams,
  MarkAllAsReadRequest,
  MarkAllAsReadResponse,
  MarkAsReadResponse,
  NotificationResponse,
  NotificationService,
  NotificationSettings,
  UnreadCountResponse,
} from "@/types/services";
import { BaseService } from "../base.service";

export class ProdNotificationService extends BaseService implements NotificationService {
  private _notifications: Notification[] = [];

  get notifications(): Notification[] {
    return this._notifications;
  }

  async getNotifications(params?: GetNotificationsParams): Promise<NotificationResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.per_page) queryParams.append("per_page", params.per_page.toString());
      if (params.is_read !== undefined) queryParams.append("is_read", params.is_read.toString());
      if (params.household_id) queryParams.append("household_id", params.household_id);
    }

    const response = await this.handleRequest<NotificationResponse>(() =>
      fetch(`${this.apiUrl}/notifications?${queryParams}`, {
        headers: this.getHeaders(),
      })
    );

    this._notifications = response.notifications;
    return response;
  }

  async markAsRead(notificationId: string): Promise<MarkAsReadResponse> {
    const response = await this.handleRequest<MarkAsReadResponse>(
      () =>
        fetch(`${this.apiUrl}/notifications/${notificationId}/read`, {
          method: "POST",
          headers: this.getHeaders(),
        }),
      "Notification marked as read"
    );

    // Update local notification if it exists
    const notificationIndex = this._notifications.findIndex((n) => n.id === notificationId);
    if (notificationIndex !== -1) {
      this._notifications[notificationIndex] = {
        ...this._notifications[notificationIndex],
        is_read: true,
      };
    }

    return response;
  }

  async markAllAsRead(request?: MarkAllAsReadRequest): Promise<MarkAllAsReadResponse> {
    const response = await this.handleRequest<MarkAllAsReadResponse>(
      () =>
        fetch(`${this.apiUrl}/notifications/read-all`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(request || {}),
        }),
      "All notifications marked as read"
    );

    // Update all local notifications
    this._notifications = this._notifications.map((n) => ({ ...n, is_read: true }));

    return response;
  }

  async getUnreadCount(householdId?: string): Promise<UnreadCountResponse> {
    const queryParams = new URLSearchParams();
    if (householdId) {
      queryParams.append("household_id", householdId);
    }

    return this.handleRequest<UnreadCountResponse>(() =>
      fetch(`${this.apiUrl}/notifications/unread-count?${queryParams}`, {
        headers: this.getHeaders(),
      })
    );
  }

  async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    return this.handleRequest<NotificationSettings>(
      () =>
        fetch(`${this.apiUrl}/notifications/settings`, {
          method: "PATCH",
          headers: this.getHeaders(),
          body: JSON.stringify(settings),
        }),
      "Notification settings updated"
    );
  }

  async getSettings(): Promise<NotificationSettings> {
    return this.handleRequest<NotificationSettings>(() =>
      fetch(`${this.apiUrl}/notifications/settings`, {
        headers: this.getHeaders(),
      })
    );
  }

  async deleteNotification(notificationId: string): Promise<DeleteNotificationResponse> {
    const response = await this.handleRequest<DeleteNotificationResponse>(
      () =>
        fetch(`${this.apiUrl}/notifications/${notificationId}`, {
          method: "DELETE",
          headers: this.getHeaders(),
        }),
      "Notification deleted"
    );

    // Remove notification from local state
    this._notifications = this._notifications.filter((n) => n.id !== notificationId);

    return response;
  }
}
