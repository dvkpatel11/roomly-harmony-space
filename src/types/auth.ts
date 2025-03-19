
export type UserRole = "member" | "admin";

export type Theme = "light" | "dark" | "system";

export interface UserPreferences {
  notifications?: boolean;
  theme?: Theme;
  active_household?: string;
  [key: string]: any;
}

export interface User {
  id: string;
  email: string;
  role?: UserRole;
  preferences?: UserPreferences;
  households?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  preferences?: UserPreferences;
}

export interface RegisterResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface UpdateProfileRequest {
  preferences?: Partial<UserPreferences>;
  password?: string;
}

export interface UpdateProfileResponse {
  message: string;
}

export interface RefreshTokenResponse {
  access_token: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  role: UserRole;
  preferences: UserPreferences;
  households: string[];
}

export interface AuthService {
  currentUser: User;
  login(credentials: LoginRequest): Promise<LoginResponse>;
  register(request: RegisterRequest): Promise<RegisterResponse>;
  getCurrentUser(): Promise<UserProfileResponse>;
  updateProfile(updates: UpdateProfileRequest): Promise<UpdateProfileResponse>;
  refreshToken(): Promise<RefreshTokenResponse>;
  logout(): Promise<void>;
  isAuthenticated(): boolean;
}
