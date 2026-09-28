/**
 * CivicPulse API Client
 * Provides typed, secure communication with the FastAPI backend.
 */

export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000';

const TOKEN_KEY = 'civicpulse_jwt_token';

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to save auth token:', e);
    }
  },
  remove: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to remove auth token:', e);
    }
  },
};

// Typed response schemas matching FastAPI backend
export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface ApiLoginResponse {
  access_token: string;
  token_type: string;
  message: string;
  user_id: number;
  name: string;
  email: string;
  role: string;
}

export interface ApiCitizenDashboard {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
}

export interface ApiAuthorityDashboard {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  high_priority: number;
  critical_priority: number;
}

export interface ApiDepartment {
  id: number;
  name: string;
  description?: string | null;
}

export interface ApiComplaint {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  citizen_id: number;
  department_id?: number | null;
  assigned_authority_id?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiComplaintCreate {
  title: string;
  description: string;
  category: string;
  priority?: string;
  status?: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}

export interface ApiComplaintHistory {
  id: number;
  complaint_id: number;
  action: string;
  old_value?: string | null;
  new_value?: string | null;
  performed_by: number;
  created_at: string;
  performed_by_name?: string | null;
}

export interface ApiComplaintEvidence {
  id: number;
  complaint_id: number;
  uploaded_by: number;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface ApiNotification {
  id: number;
  user_id: number;
  complaint_id?: number | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ApiNotificationUnreadCount {
  unread_count: number;
}

export interface ApiNotificationReadAll {
  message: string;
  updated_count: number;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new Error('Unable to connect to CivicPulse server. Please ensure the backend is running.');
  }

  if (response.status === 401) {
    tokenStorage.remove();
    window.dispatchEvent(new CustomEvent('civicpulse:unauthorized'));
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Session expired or invalid credentials. Please log in.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || `Request failed with status ${response.status}`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  auth: {
    login: async (credentials: { email: string; password: string }): Promise<ApiLoginResponse> => {
      const data = await request<ApiLoginResponse>('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (data.access_token) {
        tokenStorage.set(data.access_token);
      }
      return data;
    },
    register: async (userData: {
      name: string;
      email: string;
      password: string;
      role?: string;
    }): Promise<ApiUser> => {
      return request<ApiUser>('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role || 'citizen',
        }),
      });
    },
    getMe: async (): Promise<ApiUser> => {
      return request<ApiUser>('/me', {
        method: 'GET',
      });
    },
    logout: (): void => {
      tokenStorage.remove();
    },
  },

  dashboard: {
    getCitizenStats: async (): Promise<ApiCitizenDashboard> => {
      return request<ApiCitizenDashboard>('/dashboard', {
        method: 'GET',
      });
    },
    getAuthorityStats: async (): Promise<ApiAuthorityDashboard> => {
      return request<ApiAuthorityDashboard>('/dashboard', {
        method: 'GET',
      });
    },
  },

  users: {
    getAll: async (): Promise<ApiUser[]> => {
      return request<ApiUser[]>('/users', {
        method: 'GET',
      });
    },
  },

  departments: {
    getAll: async (): Promise<ApiDepartment[]> => {
      return request<ApiDepartment[]>('/departments', {
        method: 'GET',
      });
    },
  },

  complaints: {
    getAll: async (params?: {
      search?: string;
      status?: string;
      category?: string;
      priority?: string;
      department_id?: string;
      assigned_authority_id?: string;
      start_date?: string;
      end_date?: string;
    }): Promise<ApiComplaint[]> => {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v.trim() !== '' && v !== 'All') {
            query.append(k, v.trim());
          }
        });
      }
      const qs = query.toString();
      return request<ApiComplaint[]>(`/complaints${qs ? `?${qs}` : ''}`, {
        method: 'GET',
      });
    },

    getById: async (id: number): Promise<ApiComplaint> => {
      return request<ApiComplaint>(`/complaints/${id}`, {
        method: 'GET',
      });
    },

    create: async (data: ApiComplaintCreate): Promise<ApiComplaint> => {
      return request<ApiComplaint>('/complaints', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    updateStatus: async (id: number, status: string): Promise<ApiComplaint> => {
      return request<ApiComplaint>(`/complaints/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },

    updatePriority: async (id: number, priority: string): Promise<ApiComplaint> => {
      return request<ApiComplaint>(`/complaints/${id}/priority`, {
        method: 'PATCH',
        body: JSON.stringify({ priority }),
      });
    },

    updateAssignment: async (
      id: number,
      data: { department_id?: number | null; assigned_authority_id?: number | null }
    ): Promise<ApiComplaint> => {
      return request<ApiComplaint>(`/complaints/${id}/assignment`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    getHistory: async (complaintId: number): Promise<ApiComplaintHistory[]> => {
      return request<ApiComplaintHistory[]>(`/complaints/${complaintId}/history`, {
        method: 'GET',
      });
    },

    getEvidence: async (complaintId: number): Promise<ApiComplaintEvidence[]> => {
      return request<ApiComplaintEvidence[]>(`/complaints/${complaintId}/evidence`, {
        method: 'GET',
      });
    },

    uploadEvidence: async (complaintId: number, file: File): Promise<ApiComplaintEvidence> => {
      const formData = new FormData();
      formData.append('file', file);

      return request<ApiComplaintEvidence>(`/complaints/${complaintId}/evidence`, {
        method: 'POST',
        body: formData,
      });
    },

    getEvidenceFileUrl: (complaintId: number, evidenceId: number): string => {
      return `${API_BASE_URL}/complaints/${complaintId}/evidence/${evidenceId}`;
    },
  },

  notifications: {
    getAll: async (): Promise<ApiNotification[]> => {
      return request<ApiNotification[]>('/notifications', {
        method: 'GET',
      });
    },

    getUnreadCount: async (): Promise<ApiNotificationUnreadCount> => {
      return request<ApiNotificationUnreadCount>('/notifications/unread-count', {
        method: 'GET',
      });
    },

    markAsRead: async (notificationId: number): Promise<ApiNotification> => {
      return request<ApiNotification>(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
    },

    markAllAsRead: async (): Promise<ApiNotificationReadAll> => {
      return request<ApiNotificationReadAll>('/notifications/read-all', {
        method: 'PATCH',
      });
    },
  },
};
