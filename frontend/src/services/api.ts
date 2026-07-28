import type { ApplicantData } from '../types/applicant';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const adminAuthService = {
  login: async (username: string, password: string): Promise<{ token: string; admin: { id: number; username: string; name: string } }> => {
    const res = await fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'เข้าสู่ระบบไม่สำเร็จ');
    }
    const data = await res.json();
    localStorage.setItem('admin_token', data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_applicants_cache');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('admin_token');
  },

  getMe: async () => {
    const res = await fetch(`${API_URL}/api/admin/me`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  }
};

export const applicantService = {
  getAllApplicants: async (): Promise<ApplicantData[]> => {
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
