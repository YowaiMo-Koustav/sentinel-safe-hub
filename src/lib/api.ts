const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  createdAt: string;
}

export interface Incident {
  id: string;
  type: string;
  severity: string;
  status: string;
  zone: string;
  room?: string;
  note?: string;
  source: string;
  reporter_id: string;
  reporter_name?: string;
  reporter_display_name?: string;
  assigned_to?: string;
  assigned_name?: string;
  assigned_display_name?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  events?: IncidentEvent[];
}

export interface IncidentEvent {
  id: string;
  incident_id: string;
  actor_id?: string;
  actor_name?: string;
  actor_display_name?: string;
  event_type: string;
  message: string;
  created_at: string;
}

export interface Zone {
  id: string;
  name: string;
  building?: string;
  floor?: string;
  capacity?: number;
  status: string;
  evacuation_path_id?: string;
  evacuation_path_name?: string;
  evacuation_path_status?: string;
  created_at: string;
  updated_at: string;
}

export interface EvacuationPath {
  id: string;
  name: string;
  from_zone: string;
  to_zone: string;
  steps: any[];
  status: string;
  estimated_seconds?: number;
  created_at: string;
  updated_at: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, displayName: string, role: string = 'guest') {
    return this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName, role }),
    });
  }

  async getProfile() {
    return this.request<User>('/auth/profile');
  }

  async updateProfile(displayName: string) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ displayName }),
    });
  }

  // Incident endpoints
  async getIncidents(params?: {
    status?: string;
    severity?: string;
    zone?: string;
    own_only?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString();
    return this.request<Incident[]>(`/incidents${query ? `?${query}` : ''}`);
  }

  async getIncident(id: string) {
    return this.request<Incident>(`/incidents/${id}`);
  }

  async createIncident(incident: Partial<Incident>) {
    return this.request<{ incident: Incident }>('/incidents', {
      method: 'POST',
      body: JSON.stringify(incident),
    });
  }

  async updateIncident(id: string, updates: Partial<Incident>) {
    return this.request<{ incident: Incident }>(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async claimIncident(id: string) {
    return this.request<{ incident: Incident }>(`/incidents/${id}/claim`, {
      method: 'POST',
    });
  }

  async addIncidentComment(id: string, message: string) {
    return this.request<{ events: IncidentEvent[] }>(`/incidents/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Venue endpoints
  async getZones(params?: { status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status) {
      searchParams.append('status', params.status);
    }

    const query = searchParams.toString();
    return this.request<Zone[]>(`/venue/zones${query ? `?${query}` : ''}`);
  }

  async getZone(id: string) {
    return this.request<Zone>(`/venue/zones/${id}`);
  }

  async createZone(zone: Partial<Zone>) {
    return this.request<{ zone: Zone }>('/venue/zones', {
      method: 'POST',
      body: JSON.stringify(zone),
    });
  }

  async updateZone(id: string, updates: Partial<Zone>) {
    return this.request<{ zone: Zone }>(`/venue/zones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteZone(id: string) {
    return this.request<{ zone: Zone }>(`/venue/zones/${id}`, {
      method: 'DELETE',
    });
  }

  async getEvacuationPaths(params?: { status?: string; from_zone?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString();
    return this.request<EvacuationPath[]>(`/venue/evacuation-paths${query ? `?${query}` : ''}`);
  }

  async getEvacuationPath(id: string) {
    return this.request<EvacuationPath>(`/venue/evacuation-paths/${id}`);
  }

  async createEvacuationPath(path: Partial<EvacuationPath>) {
    return this.request<{ path: EvacuationPath }>('/venue/evacuation-paths', {
      method: 'POST',
      body: JSON.stringify(path),
    });
  }

  async updateEvacuationPath(id: string, updates: Partial<EvacuationPath>) {
    return this.request<{ path: EvacuationPath }>(`/venue/evacuation-paths/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteEvacuationPath(id: string) {
    return this.request<{ path: EvacuationPath }>(`/venue/evacuation-paths/${id}`, {
      method: 'DELETE',
    });
  }

  // User management endpoints (admin only)
  async getUsers(params?: { role?: string; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString();
    return this.request<User[]>(`/users${query ? `?${query}` : ''}`);
  }

  async getUser(id: string) {
    return this.request<User>(`/users/${id}`);
  }

  async updateUser(id: string, updates: Partial<User>) {
    return this.request<{ user: User }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async addUserRole(id: string, role: string) {
    return this.request<{ user: User }>(`/users/${id}/roles`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }

  async removeUserRole(id: string, role: string) {
    return this.request<{ user: User }>(`/users/${id}/roles/${role}`, {
      method: 'DELETE',
    });
  }

  async deleteUser(id: string) {
    return this.request<{ user: User }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserStats() {
    return this.request('/users/stats/overview');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
