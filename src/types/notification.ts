export interface Notification {
  id: string;
  type: NotificationType;
  content: string;
  is_read: boolean;
  created_at: string;
  reference_type?: "task" | "poll" | "message";
  reference_id?: string;
  household_id: string;
  user_id: string;
}

export type NotificationType =
  | "task_assigned"
  | "task_completed"
  | "task_overdue"
  | "household_invitation"
  | "household_joined"
  | "event_reminder"
  | "event_invitation"
  | "poll_created"
  | "badge_earned"
  | "announcement";

export interface NotificationData {
  task_id?: string;
  event_id?: string;
  poll_id?: string;
  badge_id?: string;
  household_id?: string;
  user_id?: string;
  invitation_id?: string;
}

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  notification_types: {
    task_assigned: boolean;
    task_completed: boolean;
    task_overdue: boolean;
    household_invitation: boolean;
    household_joined: boolean;
    event_reminder: boolean;
    event_invitation: boolean;
    poll_created: boolean;
    badge_earned: boolean;
    announcement: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start_time?: string;
    end_time?: string;
  };
}

export interface GetNotificationsParams {
  page?: number;
  per_page?: number;
  is_read?: boolean;
  household_id?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface MarkAsReadResponse {
  success: boolean;
}

export interface MarkAllAsReadRequest {
  household_id?: string;
}

export interface MarkAllAsReadResponse {
  success: boolean;
  count: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface DeleteNotificationResponse {
  success: boolean;
  message: string;
}
