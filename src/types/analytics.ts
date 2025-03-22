export interface TaskAnalytics {
  completion_rate: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  average_completion_time: number; // in hours
}

export interface UserAnalytics {
  tasks_completed: number;
  current_streak: number;
  longest_streak: number;
  badges_earned: number;
  contribution_score: number;
  rank_in_household: number;
}

export interface HouseholdAnalytics {
  total_members: number;
  active_members: number;
  total_tasks_created: number;
  total_tasks_completed: number;
  average_completion_rate: number;
  most_active_member: {
    user_id: string;
    email: string;
    tasks_completed: number;
  };
}

export interface ActivityData {
  activity_over_time: Array<{
    date: string;
    value: number;
  }>;
  activity_heatmap: Array<{
    date: string;
    count: number;
  }>;
}

export interface AnalyticsResponse {
  task_analytics: TaskAnalytics;
  user_analytics: UserAnalytics;
  household_analytics: HouseholdAnalytics;
  activity_over_time: ActivityData["activity_over_time"];
  activity_heatmap: ActivityData["activity_heatmap"];
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  awarded_at: string | null;
}

export interface AnalyticsError {
  error: string;
  code?: number;
}

export type AnalyticsPermissionError = {
  error: "Not a household member" | "Unauthorized access";
  code: 403;
};
