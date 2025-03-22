export type BadgeType = "5_day_streak" | "10_day_streak" | "task_master" | "top_contributor";

export interface Badge {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  awarded_at?: string | null;
}

export interface BadgeProgress {
  badge_id: string;
  badge_name: string;
  badge_type: BadgeType;
  description: string;
  progress: number;
  target: number;
  percentage: number;
}

export interface BadgeCategory {
  id: string;
  name: string;
  description: string;
  badges: Badge[];
}

export interface BadgeAwardResponse {
  message: string;
  badges: Badge[];
}

export interface BadgeCheckResponse {
  message: string;
  badges: Badge[];
}

export interface HouseholdBadgeResponse {
  members: {
    [userId: string]: {
      email: string;
      first_name: string;
      last_name: string;
      full_name: string;
      badges: Badge[];
    };
  };
}

export interface LeaderboardEntry {
  user_id: string;
  email: string;
  name: string;
  tasks_completed: number;
  badge_count: number;
  current_streak: number;
  rank: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  update_time: string;
}

// Admin responses
export interface CreateBadgeResponse {
  message: string;
  badge_id: string;
}

export interface AwardBadgeResponse {
  message: string;
  badge_name: string;
  user_email: string;
}
