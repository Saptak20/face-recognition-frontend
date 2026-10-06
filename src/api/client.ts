import type { HealthResponse, RegistrationResponse, AuthenticationResponse, ApiError } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api/v1';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData: ApiError = await response.json();
        errorDetail = errorData.detail || errorDetail;
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(errorDetail);
    }

    return response.json();
  }

  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  async registerFrame(
    userId: string,
    name: string,
    imageBlob: Blob,
    email?: string,
    phone?: string,
    minQualityScore: number = 0.7
  ): Promise<RegistrationResponse> {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('name', name);
    formData.append('file', imageBlob, 'frame.jpg');
    formData.append('min_quality_score', minQualityScore.toString());
    if (email) formData.append('email', email);
    if (phone) formData.append('phone', phone);

    return this.request<RegistrationResponse>('/register-frame', {
      method: 'POST',
      body: formData,
    });
  }

  async authenticateFrame(imageBlob: Blob): Promise<AuthenticationResponse> {
    const formData = new FormData();
    formData.append('file', imageBlob, 'frame.jpg');

    return this.request<AuthenticationResponse>('/authenticate-frame', {
      method: 'POST',
      body: formData,
    });
  }
}

export const api = new ApiClient();