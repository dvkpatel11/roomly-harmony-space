import {
  CreateHouseholdRequest,
  CreateHouseholdResponse,
  Household,
  HouseholdDetailsResponse,
  HouseholdMember,
  HouseholdResponse,
  HouseholdService,
  JoinHouseholdResponse,
  UpdateRoleRequest,
} from "../../types/household";
import { BaseService } from "../base.service";
import { setCurrentHouseholdId } from "../service-factory";

export class ProdHouseholdService extends BaseService implements HouseholdService {
  private _householdsList: Household[] = [];
  private _currentHousehold: Household | null = null;
  private _members: HouseholdMember[] = [];

  constructor() {
    super(false); // Not household-specific
  }

  get householdsList(): Household[] {
    return this._householdsList;
  }

  get currentHousehold(): Household {
    if (!this._currentHousehold) {
      throw new Error("No active household selected");
    }
    return this._currentHousehold;
  }

  get members(): HouseholdMember[] {
    return this._members;
  }

  async createHousehold(request: CreateHouseholdRequest): Promise<CreateHouseholdResponse> {
    const response = await this.handleRequest<CreateHouseholdResponse>(
      () =>
        fetch(`${this.apiUrl}/households`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(request),
        }),
      "Household created successfully"
    );

    // Ensure response.household has all required Household properties
    const household: Household = {
      id: response.household.id,
      name: response.household.name,
      admin_id: response.household.admin_id,
      createdAt: response.household.createdAt,
    };

    this._householdsList = [...this._householdsList, household];
    return response;
  }

  async joinHousehold(inviteCode: string): Promise<JoinHouseholdResponse> {
    return this.handleRequest<JoinHouseholdResponse>(
      () =>
        fetch(`${this.apiUrl}/households/join-by-invitation`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({ invitation_code: inviteCode }),
        }),
      "Successfully joined household"
    );
  }

  async getHouseholds(): Promise<HouseholdResponse[]> {
    const response = await this.handleRequest<HouseholdResponse[]>(() =>
      fetch(`${this.apiUrl}/households`, {
        headers: this.getHeaders(),
      })
    );

    this._householdsList = response;
    return response;
  }

  async getHouseholdDetails(householdId: string): Promise<HouseholdDetailsResponse> {
    const response = await this.handleRequest<HouseholdDetailsResponse>(() =>
      fetch(`${this.apiUrl}/households/${householdId}`, {
        headers: this.getHeaders(),
      })
    );

    this._members = response.members;
    return response;
  }

  async getActiveHousehold(): Promise<HouseholdDetailsResponse | null> {
    try {
      const response = await this.handleRequest<HouseholdDetailsResponse>(() =>
        fetch(`${this.apiUrl}/households/active`, {
          headers: this.getHeaders(),
        })
      );

      this._currentHousehold = {
        id: response.id,
        name: response.name,
        admin_id: response.admin_id,
        createdAt: response.createdAt,
      };
      this._members = response.members;

      return response;
    } catch (error) {
      if ((error as any)?.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async setActiveHousehold(householdId: string): Promise<boolean> {
    try {
      // Find the household in our list
      const household = this._householdsList.find((h) => h.id === householdId);
      if (!household) {
        throw new Error("Selected household not found");
      }

      // Update current household
      this._currentHousehold = household;

      // Update current household ID in all services
      setCurrentHouseholdId(householdId);

      return true;
    } catch (error) {
      console.error("Failed to set active household:", error);
      throw error;
    }
  }

  async updateMemberRole(householdId: string, memberId: string, request: UpdateRoleRequest): Promise<void> {
    await this.handleRequest(
      () =>
        fetch(`${this.apiUrl}/households/${householdId}/members/${memberId}/role`, {
          method: "PATCH",
          headers: this.getHeaders(),
          body: JSON.stringify(request),
        }),
      "Member role updated successfully"
    );
  }

  async leaveHousehold(householdId: string): Promise<void> {
    await this.handleRequest(
      () =>
        fetch(`${this.apiUrl}/households/${householdId}/members/me`, {
          method: "DELETE",
          headers: this.getHeaders(),
        }),
      "Successfully left household"
    );

    this._householdsList = this._householdsList.filter((h) => h.id !== householdId);
    if (this._currentHousehold?.id === householdId) {
      this._currentHousehold = null;
    }
  }

  async removeMember(householdId: string, memberId: string): Promise<void> {
    await this.handleRequest(
      () =>
        fetch(`${this.apiUrl}/households/${householdId}/members/${memberId}`, {
          method: "DELETE",
          headers: this.getHeaders(),
        }),
      "Member removed successfully"
    );

    this._members = this._members.filter((m) => m.id !== memberId);
  }

  async updateHousehold(householdId: string, updates: { name: string }): Promise<void> {
    await this.handleRequest(
      () =>
        fetch(`${this.apiUrl}/households/${householdId}`, {
          method: "PATCH",
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        }),
      "Household updated successfully"
    );

    if (this._currentHousehold?.id === householdId) {
      this._currentHousehold = { ...this._currentHousehold, ...updates };
    }
  }

  async generateInvitationCode(householdId: string): Promise<{ invitation_code: string }> {
    return this.handleRequest<{ invitation_code: string }>(
      () =>
        fetch(`${this.apiUrl}/households/${householdId}/invitations`, {
          method: "POST",
          headers: this.getHeaders(),
        }),
      "Invitation code generated successfully"
    );
  }

  async deleteHousehold(householdId: string): Promise<void> {
    await this.handleRequest(
      () =>
        fetch(`${this.apiUrl}/households/${householdId}`, {
          method: "DELETE",
          headers: this.getHeaders(),
        }),
      "Household deleted successfully"
    );

    this._householdsList = this._householdsList.filter((h) => h.id !== householdId);
    if (this._currentHousehold?.id === householdId) {
      this._currentHousehold = null;
    }
  }
}
