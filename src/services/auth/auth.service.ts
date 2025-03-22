import { toast } from "../../hooks/use-toast";
import {
  AuthService,
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  TokenManager,
  UpdateProfileRequest,
  UpdateProfileResponse,
  User,
  UserProfileResponse,
} from "../../types/auth";
import { BaseService } from "../base.service";

export class ProdAuthService extends BaseService implements AuthService, TokenManager {
  private _currentUser: User | null = null;
  private _accessToken: string | null = null;
  private _refreshToken: string | null = null;
  private _isAuthenticated: boolean = false;
  private authStateListeners: (() => void)[] = [];

  constructor() {
    super(false); // This service is not household-specific
    // Load tokens from storage on initialization
    this._accessToken = localStorage.getItem("access_token");
    this._refreshToken = localStorage.getItem("refresh_token");

    // If we have tokens, verify the session
    if (this._accessToken) {
      this.verifySession();
    }
  }

  private async verifySession() {
    try {
      const user = await this.getCurrentUser();
      this._currentUser = user;
      this._isAuthenticated = true;
    } catch (error) {
      // If verification fails, clear everything
      this.clearTokens();
      this._currentUser = null;
      this._isAuthenticated = false;
    }
  }

  get currentUser(): User {
    if (!this._currentUser) {
      throw new Error("No user is currently logged in");
    }
    return this._currentUser;
  }

  getToken(): string | null {
    return this._accessToken;
  }

  getRefreshToken(): string | null {
    return this._refreshToken;
  }

  public setTokens(accessToken: string, refreshToken: string) {
    this._accessToken = accessToken;
    this._refreshToken = refreshToken;
    this._isAuthenticated = true;
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    this.notifyAuthStateChange();
  }

  public clearTokens() {
    this._accessToken = null;
    this._refreshToken = null;
    this._isAuthenticated = false;
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    this.notifyAuthStateChange();
  }

  private notifyAuthStateChange() {
    this.authStateListeners.forEach((listener) => listener());
  }

  onAuthStateChanged(callback: () => void): () => void {
    this.authStateListeners.push(callback);
    return () => {
      this.authStateListeners = this.authStateListeners.filter((listener) => listener !== callback);
    };
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.handleRequest<LoginResponse>(
      () =>
        fetch(`${this.apiUrl}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
        }),
      "Successfully logged in"
    );

    this._currentUser = response.user;
    this.setTokens(response.access_token, response.refresh_token);
    return response;
  }

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    const response = await this.handleRequest<RegisterResponse>(
      () =>
        fetch(`${this.apiUrl}/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        }),
      "Successfully registered"
    );

    this._currentUser = response.user;
    this.setTokens(response.access_token, response.refresh_token);
    return response;
  }

  async getCurrentUser(): Promise<UserProfileResponse> {
    const response = await this.handleRequest<UserProfileResponse>(() =>
      fetch(`${this.apiUrl}/me`, {
        method: "GET",
        headers: this.getHeaders(),
      })
    );

    this._currentUser = response;
    return response;
  }

  async updateProfile(updates: UpdateProfileRequest): Promise<User> {
    const response = await this.handleRequest<UpdateProfileResponse>(
      () =>
        fetch(`${this.apiUrl}/auth/profile`, {
          method: "PUT",
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        }),
      "Profile updated successfully"
    );

    const user: User = {
      id: response.id,
      email: response.email,
      first_name: response.first_name,
      last_name: response.last_name,
      full_name: `${response.first_name} ${response.last_name}`,
    };
    this._currentUser = user;
    return user;
  }

  async refreshToken(): Promise<void> {
    if (!this._refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await this.handleRequest<RefreshTokenResponse>(() =>
        fetch(`${this.apiUrl}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this._refreshToken}`,
          },
        })
      );

      this.setTokens(response.access_token, response.refresh_token);
    } catch (error) {
      // If refresh fails, clear everything and force re-login
      this.clearTokens();
      this._currentUser = null;
      throw error;
    }
  }

  async logout(): Promise<void> {
    if (this._accessToken) {
      try {
        await fetch(`${this.apiUrl}/auth/logout`, {
          method: "POST",
          headers: this.getHeaders(),
        });
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }

    this._currentUser = null;
    this.clearTokens();

    toast({
      title: "Success",
      description: "Successfully logged out",
      variant: "default",
    });
  }

  isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  protected getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this._accessToken) {
      headers["Authorization"] = `Bearer ${this._accessToken}`;
    }

    return headers;
  }
}
