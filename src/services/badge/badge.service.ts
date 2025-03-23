import {
  AwardBadgeResponse,
  Badge,
  BadgeAwardResponse,
  BadgeProgress,
  BadgeType,
  CreateBadgeResponse,
  HouseholdBadgeResponse,
  LeaderboardResponse,
} from "@/types/badge";
import { BadgeService } from "@/types/services";
import { BaseService } from "../base.service";

export class ProdBadgeService extends BaseService implements BadgeService {
  private _badges: Badge[] = [];
  private _progress: BadgeProgress[] = [];

  get badges(): Badge[] {
    return this._badges;
  }

  get progress(): BadgeProgress[] {
    return this._progress;
  }

  async getBadges(type?: BadgeType): Promise<Badge[]> {
    const queryParams = new URLSearchParams();
    if (type) {
      queryParams.append("type", type);
    }

    const response = await this.handleRequest<{ badges: Badge[] }>(() =>
      fetch(`${this.apiUrl}/badges?${queryParams}`, {
        headers: this.getHeaders(),
      })
    );

    this._badges = response.badges;
    return response.badges;
  }

  async getUserBadges(userId: string = "me"): Promise<Badge[]> {
    const response = await this.handleRequest<{ badges: Badge[] }>(() =>
      fetch(`${this.apiUrl}/users/me/badges`, {
        headers: this.getHeaders(),
      })
    );

    if (userId === "me") {
      this._badges = response.badges;
    }
    return response.badges;
  }

  async getHouseholdBadges(householdId: string): Promise<HouseholdBadgeResponse> {
    return this.handleRequest<HouseholdBadgeResponse>(() =>
      fetch(`${this.apiUrl}/households/${householdId}/badges`, {
        headers: this.getHeaders(),
      })
    );
  }

  async getBadgeProgress(): Promise<BadgeProgress[]> {
    const response = await this.handleRequest<{ badge_progress: BadgeProgress[] }>(() =>
      fetch(`${this.apiUrl}/users/me/badge-progress`, {
        headers: this.getHeaders(),
      })
    );

    this._progress = response.badge_progress;
    return response.badge_progress;
  }

  async checkBadges(): Promise<BadgeAwardResponse> {
    return this.handleRequest<BadgeAwardResponse>(() =>
      fetch(`${this.apiUrl}/users/check-badges`, {
        method: "POST",
        headers: this.getHeaders(),
      })
    );
  }

  async getLeaderboard(householdId: string): Promise<LeaderboardResponse> {
    return this.handleRequest<LeaderboardResponse>(() =>
      fetch(`${this.apiUrl}/households/${householdId}/leaderboard`, {
        headers: this.getHeaders(),
      })
    );
  }

  // Admin methods
  async createBadge(badge: { type: BadgeType; name: string; description?: string }): Promise<CreateBadgeResponse> {
    return this.handleRequest<CreateBadgeResponse>(
      () =>
        fetch(`${this.apiUrl}/admin/badges`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(badge),
        }),
      "Badge created successfully"
    );
  }

  async awardBadge(badgeId: string, userId: string): Promise<AwardBadgeResponse> {
    return this.handleRequest<AwardBadgeResponse>(
      () =>
        fetch(`${this.apiUrl}/admin/award-badge`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({ badge_id: badgeId, user_id: userId }),
        }),
      "Badge awarded successfully"
    );
  }
}
