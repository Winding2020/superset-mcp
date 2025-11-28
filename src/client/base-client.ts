import axios, { AxiosInstance } from "axios";
import { SupersetConfig, CsrfTokenResponse } from "../types/index.js";
import { getErrorMessage, formatAuthError } from "../utils/error.js";

/**
 * Base Superset API client that handles authentication and CSRF tokens
 */
export class BaseSuperset {
  protected api: AxiosInstance;
  protected config: SupersetConfig;
  protected isAuthenticated = false;
  protected csrfToken?: string;
  private isRefreshing = false; // Prevent concurrent token refresh
  private refreshPromise?: Promise<void>; // Store refresh promise for reuse

  constructor(config: SupersetConfig) {
    this.config = config;
    this.api = axios.create({
      baseURL: config.baseUrl,
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Enable cookie support to maintain session
      // Prevent axios from automatically parsing JSON to handle non-JSON responses gracefully
      transformResponse: [(data, headers) => {
        const contentType = headers['content-type'] || '';
        
        // If response is JSON, parse it
        if (contentType.includes('application/json')) {
          try {
            return JSON.parse(data);
          } catch (e) {
            // If JSON parsing fails, return raw data
            return data;
          }
        }
        
        // For non-JSON responses, return raw data
        return data;
      }],
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor: add authentication token
    this.api.interceptors.request.use((config) => {
      if (this.config.accessToken) {
        config.headers.Authorization = `Bearer ${this.config.accessToken}`;
      }
      return config;
    });

    // Response interceptor: handle token expiration and response validation
    this.api.interceptors.response.use(
      (response) => {
        // Validate that we got the expected JSON response for API calls
        const contentType = response.headers['content-type'] || '';
        const isApiCall = response.config.url?.includes('/api/');
        
        if (isApiCall && !contentType.includes('application/json')) {
          // Log warning for non-JSON API responses
          console.warn(`API call returned non-JSON response: ${response.config.url}, Content-Type: ${contentType}`);
        }
        
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        
        // Check if it's a 401 error and not the login request itself
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url?.includes('/api/v1/security/login')) {
          
          originalRequest._retry = true;
          
          try {
            // If token refresh is in progress, wait for completion
            if (this.isRefreshing && this.refreshPromise) {
              await this.refreshPromise;
            } else {
              // Start token refresh
              await this.refreshToken();
            }
            
            // Update Authorization header of original request
            if (this.config.accessToken) {
              originalRequest.headers.Authorization = `Bearer ${this.config.accessToken}`;
            }
            
            // Retry original request
            return this.api.request(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear authentication state
            this.clearAuthState();
            throw error;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Refresh token
  private async refreshToken(): Promise<void> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();
    
    try {
      await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = undefined;
    }
  }

  // Perform token refresh
  private async performTokenRefresh(): Promise<void> {
    // Clear current authentication state
    this.isAuthenticated = false;
    this.csrfToken = undefined;
    
    // Re-authenticate
    await this.authenticate();
  }

  // Clear authentication state
  private clearAuthState(): void {
    this.isAuthenticated = false;
    this.config.accessToken = undefined;
    this.csrfToken = undefined;
  }

  // Authentication login
  async authenticate(): Promise<void> {
    if (this.config.accessToken && this.isAuthenticated) {
      return;
    }

    if (!this.config.username || !this.config.password) {
      throw new Error("Username and password or access token required");
    }

    try {
      const response = await this.api.post('/api/v1/security/login', {
        username: this.config.username,
        password: this.config.password,
        provider: this.config.authProvider || 'db',
        refresh: true,
      });

      this.config.accessToken = response.data.access_token;
      this.isAuthenticated = true;
    } catch (error) {
      const errorMessage = formatAuthError(error);
      console.error('Authentication failed:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  // Get CSRF token
  private async getCsrfToken(): Promise<CsrfTokenResponse> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get('/api/v1/security/csrf_token/');
      const token = response.data.result;
      const sessionCookie = response.headers['set-cookie']?.find((cookie: string) => 
        cookie.startsWith('session=')
      )?.split(';')[0]?.split('=')[1] || '';
      
      this.csrfToken = token;
      return { token, sessionCookie };
    } catch (error) {
      throw new Error(`Failed to get CSRF token: ${getErrorMessage(error)}`);
    }
  }

  // Ensure authenticated
  protected async ensureAuthenticated(): Promise<void> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }
  }

  // Ensure CSRF token exists
  private async ensureCsrfToken(): Promise<CsrfTokenResponse> {
    if (!this.csrfToken) {
      return await this.getCsrfToken();
    }
    // If token exists, re-fetch to ensure session cookie is up to date
    return await this.getCsrfToken();
  }

  // Execute CSRF-protected request
  protected async makeProtectedRequest(config: any): Promise<any> {
    await this.ensureAuthenticated();
    const { token, sessionCookie } = await this.ensureCsrfToken();
    
    // Create a new axios instance to handle this specific request
    const protectedApi = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.accessToken}`,
        'X-CSRFToken': token,
        'Referer': this.config.baseUrl,
        ...config.headers,
      },
      withCredentials: true,
    });

    // If session cookie exists, add it to the request
    if (sessionCookie) {
      protectedApi.defaults.headers.common['Cookie'] = `session=${sessionCookie}`;
    }

    // Add response interceptor for token expiration handling
    protectedApi.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Check if it's a 401 error and not the login request itself
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url?.includes('/api/v1/security/login')) {
          
          originalRequest._retry = true;
          
          try {
            // Refresh token
            await this.refreshToken();
            
            // Re-obtain CSRF token
            const { token: newToken, sessionCookie: newSessionCookie } = await this.ensureCsrfToken();
            
            // Update request headers
            originalRequest.headers.Authorization = `Bearer ${this.config.accessToken}`;
            originalRequest.headers['X-CSRFToken'] = newToken;
            if (newSessionCookie) {
              originalRequest.headers['Cookie'] = `session=${newSessionCookie}`;
            }
            
            // Retry original request
            return protectedApi.request(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear authentication state
            this.clearAuthState();
            throw error;
          }
        }
        
        return Promise.reject(error);
      }
    );

    return protectedApi.request(config);
  }
} 