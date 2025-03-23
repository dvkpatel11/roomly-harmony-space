import { AuthService, TokenManager } from "@/types/auth";
import { getAuth } from "./service-factory";

export interface ErrorResponse {
  error: string;
  message: string;
  code?: number;
}

export abstract class BaseService {
  protected apiUrl: string;
  protected cache: Map<string, { data: any; timestamp: number }>;
  protected currentHouseholdId: string | null = null;
  protected cacheDuration = 5 * 60 * 1000; // 5 minutes
  private isHouseholdSpecific: boolean = true;

  constructor(isHouseholdSpecific: boolean = true) {
    this.apiUrl = import.meta.env.VITE_API_URL || "http://example.com";
    this.cache = new Map();
    this.isHouseholdSpecific = isHouseholdSpecific;
  }

  protected getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const auth = getAuth() as AuthService & TokenManager;
    const token = auth.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Add household header if service is household-specific
    if (this.isHouseholdSpecific && this.currentHouseholdId) {
      headers["X-Household-ID"] = this.currentHouseholdId;
    }

    return headers;
  }

  protected getCacheKey(key: string): string {
    if (!this.isHouseholdSpecific) {
      return `global:${key}`;
    }
    return `${this.currentHouseholdId || "global"}:${key}`;
  }

  protected getFromCache<T>(key: string): T | null {
    const cacheKey = this.getCacheKey(key);
    const cached = this.cache.get(cacheKey);

    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheDuration) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.data as T;
  }

  protected setInCache<T>(key: string, data: T): void {
    // Don't cache if no household is selected for household-specific services
    if (this.isHouseholdSpecific && !this.currentHouseholdId) {
      return;
    }

    const cacheKey = this.getCacheKey(key);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }

  public clearCache(): void {
    if (this.isHouseholdSpecific && this.currentHouseholdId) {
      // Clear only current household data
      const prefix = `${this.currentHouseholdId}:`;
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  public setCurrentHousehold(householdId: string | null): void {
    if (!this.isHouseholdSpecific) return;
    if (this.currentHouseholdId !== householdId) {
      this.currentHouseholdId = householdId;
      this.clearCache();
    }
  }

  protected async handleRequest<T>(requestFn: () => Promise<Response>, successMessage?: string): Promise<T> {
    try {
      // Validate household ID for household-specific services
      if (this.isHouseholdSpecific && !this.currentHouseholdId) {
        const error = new Error("No household selected");
        console.warn("API request skipped:", error.message);
        throw error;
      }

      const response = await requestFn();

      // Handle authentication errors
      if (response.status === 401) {
        try {
          // Try to refresh the token
          await getAuth().refreshToken();
          // Retry the original request with new token
          const retryResponse = await requestFn();
          if (!retryResponse.ok) {
            throw new Error("Request failed after token refresh");
          }
          return await retryResponse.json();
        } catch (error) {
          // If refresh fails, clear auth and throw error
          console.error("Token refresh failed:", error);
          throw new Error(error.error ?? "Authentication failed. Please log in again.");
        }
      }

      // Handle household-specific errors
      if (response.status === 403 && this.isHouseholdSpecific) {
        throw new Error("You don't have access to this household's data");
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Request failed");
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  protected async handleCachedRequest<T>(
    cacheKey: string,
    requestFn: () => Promise<Response>,
    forceFresh = false
  ): Promise<T> {
    if (!forceFresh) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) return cached;
    }

    const data = await this.handleRequest<T>(requestFn);
    this.setInCache(cacheKey, data);
    return data;
  }

  protected getErrorMessage(error: any): string {
    if (typeof error === "string") {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (error?.message) {
      return error.message;
    }

    if (error?.error) {
      return error.error;
    }

    return "An unexpected error occurred";
  }
}
