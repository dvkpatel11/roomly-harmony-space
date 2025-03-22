import { UserRole } from "./auth";

export interface Household {
  id: string;
  name: string;
  description?: string;
  role?: UserRole;
  memberCount?: number;
  admin_id: string;
  createdAt: string;
  template_id?: string;
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
  description?: string;
  template_id?: string;
}

export interface CreateHouseholdResponse {
  message: string;
  household: {
    id: string;
    name: string;
    description?: string;
    role: UserRole;
    admin_id: string;
    createdAt: string;
    template_id?: string;
  };
}

export interface JoinHouseholdRequest {
  invitation_code: string;
}

export interface JoinHouseholdResponse {
  message: string;
  household: {
    id: string;
    name: string;
    role: UserRole;
    admin_id: string;
    createdAt: string;
  };
}

export interface UpdateRoleRequest {
  role: UserRole;
}

export interface HouseholdResponse {
  id: string;
  name: string;
  description?: string;
  role: UserRole;
  memberCount: number;
  admin_id: string;
  createdAt: string;
  template_id?: string;
}

export interface HouseholdDetailsResponse {
  id: string;
  name: string;
  description?: string;
  members: HouseholdMember[];
  admin_id: string;
  createdAt: string;
  template_id?: string;
}

export interface HouseholdService {
  householdsList: Household[];
  currentHousehold: Household;
  members: HouseholdMember[];
  createHousehold(request: CreateHouseholdRequest): Promise<CreateHouseholdResponse>;
  joinHousehold(inviteCode: string): Promise<JoinHouseholdResponse>;
  getHouseholds(): Promise<HouseholdResponse[]>;
  getHouseholdDetails(householdId: string): Promise<HouseholdDetailsResponse>;
  getActiveHousehold(): Promise<HouseholdDetailsResponse | null>;
  setActiveHousehold(householdId: string): Promise<boolean>;
  updateMemberRole(householdId: string, memberId: string, request: UpdateRoleRequest): Promise<void>;
  leaveHousehold(householdId: string): Promise<void>;
  removeMember(householdId: string, memberId: string): Promise<void>;
  updateHousehold(householdId: string, updates: { name: string; description?: string }): Promise<void>;
  generateInvitationCode(householdId: string): Promise<{ invitation_code: string }>;
  deleteHousehold(householdId: string): Promise<void>;
}
