import type { ApplicantData } from '../types/applicant';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface AdminUserData {
  id: number;
  username: string;
  name: string;
}

export interface LoginResponse {
  message?: string;
  token?: string;
  admin?: AdminUserData;
  require_2fa?: boolean;
  is_totp_setup?: boolean;
  temp_token?: string;
  qr_code_url?: string;
  secret?: string;
  username?: string;
}

export const adminAuthService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'เข้าสู่ระบบไม่สำเร็จ');
    }
    const data: LoginResponse = await res.json();
    if (data.token) {
      localStorage.setItem('admin_token', data.token);
    }
    return data;
  },

  setup2FA: async (tempToken: string, secret: string, code: string): Promise<{ token: string; admin: AdminUserData }> => {
    const res = await fetch(`${API_URL}/api/admin/2fa/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temp_token: tempToken, secret, code }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'การยืนยันรหัส 2FA ไม่สำเร็จ');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('admin_token', data.token);
    }
    return data;
  },

  verify2FA: async (tempToken: string, code: string): Promise<{ token: string; admin: AdminUserData }> => {
    const res = await fetch(`${API_URL}/api/admin/2fa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temp_token: tempToken, code }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'รหัสยืนยันไม่ถูกต้อง หรือหมดอายุ');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('admin_token', data.token);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_applicants_cache');
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('admin_token');
    if (!token) return false;
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return false;
      const decoded = JSON.parse(atob(payloadBase64));
      // ตรวจสอบวันหมดอายุของ Token (8 ชั่วโมง) หากหมดอายุให้เคลียร์ session ทันที
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        adminAuthService.logout();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  getMe: async (): Promise<AdminUserData> => {
    const res = await fetch(`${API_URL}/api/admin/me`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  }
};

export interface AdminUser {
  id: number;
  username: string;
  name: string;
  totp_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAdminPayload {
  username: string;
  password: string;
  name: string;
}

export interface UpdateAdminPayload {
  name?: string;
  password?: string;
}

export const adminUserService = {
  getAllAdmins: async (): Promise<AdminUser[]> => {
    const res = await fetch(`${API_URL}/api/admins`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      if (res.status === 401) {
        adminAuthService.logout();
        throw new Error('UNAUTHORIZED');
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch admin users');
    }
    return res.json();
  },

  createAdmin: async (data: CreateAdminPayload): Promise<AdminUser> => {
    const res = await fetch(`${API_URL}/api/admins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create admin user');
    }
    return res.json();
  },

  updateAdmin: async (id: number, data: UpdateAdminPayload): Promise<AdminUser> => {
    const res = await fetch(`${API_URL}/api/admins/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update admin user');
    }
    return res.json();
  },

  deleteAdmin: async (id: number): Promise<void> => {
    const res = await fetch(`${API_URL}/api/admins/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete admin user');
    }
  },

  reset2FA: async (id: number): Promise<{ message: string; admin: AdminUser }> => {
    const res = await fetch(`${API_URL}/api/admins/${id}/reset-2fa`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to reset 2FA');
    }
    return res.json();
  },
};

export const applicantService = {
  getAllApplicants: async (forceRefresh = false): Promise<ApplicantData[]> => {
    if (forceRefresh) {
      sessionStorage.removeItem('admin_applicants_cache');
    }

    // Try reading from sessionStorage cache first
    const cached = sessionStorage.getItem('admin_applicants_cache');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        // Cache valid for 30 seconds
        if (Date.now() - timestamp < 30000) {
          return data;
        }
      } catch (e) {
        sessionStorage.removeItem('admin_applicants_cache');
      }
    }

    const res = await fetch(`${API_URL}/api/applicants`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      if (res.status === 401) {
        adminAuthService.logout();
        throw new Error('UNAUTHORIZED');
      }
      throw new Error('Failed to fetch applicants');
    }

    const data = await res.json();
    sessionStorage.setItem('admin_applicants_cache', JSON.stringify({ data, timestamp: Date.now() }));
    return data;
  },

  getApplicantByIdCard: async (idCard: string): Promise<ApplicantData | null> => {
    try {
      const res = await fetch(`${API_URL}/api/applicants/${idCard}`);
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      return res.json();
    } catch (error) {
      throw error;
    }
  },

  saveApplicant: async (data: ApplicantData): Promise<any> => {
    const response = await fetch(`${API_URL}/api/applicants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }

    // Clear session cache so admin sees new data immediately
    sessionStorage.removeItem('admin_applicants_cache');
    return response.json();
  },

  sendToLine: async (idCard: string): Promise<any> => {
    const response = await fetch(`${API_URL}/api/applicants/${idCard}/send-line`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการส่งข้อมูลเข้า Line');
    }

    sessionStorage.removeItem('admin_applicants_cache');
    return response.json();
  },

  getLineQuota: async (): Promise<{ usage: number; limit: number }> => {
    const response = await fetch(`${API_URL}/api/line/quota`, {
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch LINE quota');
    }
    return response.json();
  }
};
