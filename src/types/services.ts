import { AnalyticsPermissionError, AnalyticsResponse, UserBadge } from "./analytics";
import {
  AwardBadgeResponse,
  Badge,
  BadgeAwardResponse,
  BadgeProgress,
  BadgeType,
  CreateBadgeResponse,
  HouseholdBadgeResponse,
  LeaderboardResponse,
} from "./badge";
import { CalendarEvent, CreateEventRequest, CreateEventResponse } from "./calendar";
import { ChatResponse, NewMessageEvent, UserJoinedEvent, UserOfflineEvent, WebSocketEvent } from "./chat";
import {
  GetNotificationsParams,
  MarkAllAsReadRequest,
  MarkAllAsReadResponse,
  MarkAsReadResponse,
  NotificationResponse,
  NotificationSettings,
  UnreadCountResponse,
} from "./notification";
import { CreatePollRequest, CreatePollResponse, Poll, PollResponse, VoteRequest, VoteResponse } from "./poll";
import {
  CompleteTaskResponse,
  CreateTaskRequest,
  CreateTaskResponse,
  SwapTaskResponse,
  Task,
  TaskResponse,
  TaskStatus,
  UpdateTaskRequest,
} from "./task";

export interface DateRange {
  start: string;
  end: string;
}

export interface BaseService {
  setCurrentHousehold(householdId: string | null): void;
  clearCache(): void;
}

export interface TaskService extends BaseService {
  tasks: Task[];

  createTask(householdId: string, request: CreateTaskRequest): Promise<CreateTaskResponse>;
  getTasks(
    householdId: string,
    params?: {
      status?: string;
      assignedTo?: string;
      frequency?: string;
      page?: number;
      per_page?: number;
      include_completed?: boolean;
    }
  ): Promise<TaskResponse>;
  getTask(taskId: string): Promise<Task>;
  updateTask(taskId: string, request: UpdateTaskRequest): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
  updateStatus(taskId: string, status: TaskStatus): Promise<TaskResponse>;
  getUserTasks(userId: string): Promise<TaskResponse>;
  completeTask(taskId: string): Promise<CompleteTaskResponse>;
  swapTask(taskId: string, newAssigneeId: string): Promise<SwapTaskResponse>;
}

export interface AnalyticsService extends BaseService {
  /**
   * Get comprehensive analytics for a household including task, user, and household metrics
   * @throws {AnalyticsPermissionError} If user is not a member of the household
   */
  getHouseholdAnalytics(householdId: string, dateRange?: DateRange): Promise<AnalyticsResponse>;

  /**
   * Get badges for a specific user
   * @throws {AnalyticsPermissionError} If user is not authorized to view badges
   */
  getUserBadges(userId: string): Promise<UserBadge[]>;
}

export interface CalendarService extends BaseService {
  events: CalendarEvent[];
  createEvent(householdId: string, request: CreateEventRequest): Promise<CreateEventResponse>;
  getEvents(householdId: string, dateRange?: DateRange): Promise<CalendarEvent[]>;
  getUserEvents(): Promise<CalendarEvent[]>;
  updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
}

export interface ChatService extends BaseService {
  getMessages(householdId: string, params?: { limit?: number; before?: string }): Promise<ChatResponse>;

  // WebSocket methods
  connect(token: string): void;
  disconnect(): void;
  joinHousehold(householdId: string): void;
  leaveHousehold(householdId: string): void;
  sendMessage(householdId: string, content: string, isAnnouncement?: boolean): void;
  editMessage(messageId: string, content: string): void;
  deleteMessage(messageId: string): void;
  startTyping(householdId: string): void;
  stopTyping(householdId: string): void;

  // Event listeners
  on(event: string, handler: (event: WebSocketEvent) => void): void;
  off(event: string, handler: (event: WebSocketEvent) => void): void;

  onNewMessage(callback: (message: NewMessageEvent) => void): () => void;
  onUserJoined(callback: (event: UserJoinedEvent) => void): () => void;
  onUserOffline(callback: (event: UserOfflineEvent) => void): () => void;
  onError(callback: (event: ErrorEvent) => void): () => void;
}

export interface NotificationService extends BaseService {
  getNotifications(params?: GetNotificationsParams): Promise<NotificationResponse>;
  markAsRead(notificationId: string): Promise<MarkAsReadResponse>;
  markAllAsRead(request?: MarkAllAsReadRequest): Promise<MarkAllAsReadResponse>;
  getUnreadCount(householdId?: string): Promise<UnreadCountResponse>;
  updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings>;
  getSettings(): Promise<NotificationSettings>;
  deleteNotification(notificationId: string): Promise<{ success: boolean; message: string }>;
}

export interface BadgeService extends BaseService {
  badges: Badge[];
  progress: BadgeProgress[];

  getBadges(type?: BadgeType): Promise<Badge[]>;
  getUserBadges(userId?: string): Promise<Badge[]>;
  getHouseholdBadges(householdId: string): Promise<HouseholdBadgeResponse>;
  getBadgeProgress(): Promise<BadgeProgress[]>;
  checkBadges(): Promise<BadgeAwardResponse>;
  getLeaderboard(householdId: string): Promise<LeaderboardResponse>;

  // Admin methods
  createBadge(badge: { type: BadgeType; name: string; description?: string }): Promise<CreateBadgeResponse>;
  awardBadge(badgeId: string, userId: string): Promise<AwardBadgeResponse>;
}

export interface PollService extends BaseService {
  polls: Poll[];

  createPoll(householdId: string, request: CreatePollRequest): Promise<CreatePollResponse>;
  getPolls(
    householdId: string,
    params?: {
      status?: "active" | "expired" | "all";
      page?: number;
      per_page?: number;
    }
  ): Promise<PollResponse[]>;
  getPoll(pollId: string): Promise<PollResponse>;
  vote(pollId: string, request: VoteRequest): Promise<VoteResponse>;
  deletePoll(pollId: string): Promise<void>;

  // WebSocket event handlers
  on(event: string, handler: (event: WebSocketEvent) => void): void;
  off(event: string, handler: (event: WebSocketEvent) => void): void;
}

export type {
  DeleteNotificationResponse,
  GetNotificationsParams,
  MarkAllAsReadRequest,
  MarkAllAsReadResponse,
  MarkAsReadResponse,
  NotificationResponse,
  NotificationSettings,
  UnreadCountResponse,
} from "./notification";
