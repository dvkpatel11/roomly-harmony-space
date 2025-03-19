
import { UserRole } from "./auth";

export interface Household {
  id: string;
  name: string;
  role?: UserRole;
  memberCount?: number;
  admin_id: string;
  createdAt: string;
}

export interface HouseholdMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  joined_at: string;
}

export interface CreateHouseholdRequest {
  name: string;
}

export interface CreateHouseholdResponse {
  message: string;
  household: {
    id: string;
    name: string;
    role: UserRole;
  };
}

export interface JoinHouseholdRequest {
  code: string;
}

export interface JoinHouseholdResponse {
  message: string;
  household: {
    id: string;
    name: string;
  };
}

export interface UpdateRoleRequest {
  user_id: string;
  role: UserRole;
}

export interface HouseholdResponse {
  households: Household[];
  active_household_id?: string;
}

export interface HouseholdDetailsResponse {
  id: string;
  name: string;
  members: HouseholdMember[];
  admin_id: string;
  createdAt: string;
  invite_code?: string;
}

export interface HouseholdService {
  householdsList: Household[];
  currentHousehold: Household;
  members: HouseholdMember[];
  createHousehold(request: CreateHouseholdRequest): Promise<CreateHouseholdResponse>;
  joinHousehold(inviteCode: string): Promise<JoinHouseholdResponse>;
  getHouseholds(): Promise<HouseholdResponse>;
  getHouseholdDetails(householdId: string): Promise<HouseholdDetailsResponse>;
  getActiveHousehold(): Promise<HouseholdDetailsResponse | null>;
  setActiveHousehold(householdId: string): Promise<boolean>;
  updateMemberRole(householdId: string, request: UpdateRoleRequest): Promise<void>;
  leaveHousehold(householdId: string): Promise<void>;
  removeMember(householdId: string, userId: string): Promise<void>;
  updateHousehold(householdId: string, updates: { name: string }): Promise<void>;
  generateInvitationCode(householdId: string): Promise<{ code: string; expires_at: string }>;
}
