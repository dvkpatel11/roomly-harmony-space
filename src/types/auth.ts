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
  first_name: string;
  last_name: string;
  full_name: string;
  role?: UserRole;
  preferences?: UserPreferences;
  avatar?: string;
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
  first_name: string;
  last_name: string;
  preferences?: UserPreferences;
}

export interface RegisterResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  preferences?: Partial<UserPreferences>;
  password?: string;
}

export interface UpdateProfileResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  preferences: UserPreferences;
  households: string[];
}

export interface AuthService {
  currentUser: User;

  // Public methods
  login(data: LoginRequest): Promise<LoginResponse>;
  register(data: RegisterRequest): Promise<RegisterResponse>;
  getCurrentUser(): Promise<User | null>;
  updateProfile(data: UpdateProfileRequest): Promise<User>;
  refreshToken(): Promise<void>;
  logout(): Promise<void>;
  isAuthenticated(): boolean;
  onAuthStateChanged(callback: () => void): () => void;
  getToken(): string | null;
}

export interface TokenManager {
  setTokens(access: string, refresh: string): void;
  clearTokens(): void;
  getToken(): string | null;
}
