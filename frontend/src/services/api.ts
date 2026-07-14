import type { ApplicantData } from '../types/applicant';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const applicantService = {
  getAllApplicants: async (): Promise<ApplicantData[]> => {
    const res = await fetch(`${API_URL}/api/applicants`);
    if (!res.ok) throw new Error('Failed to fetch applicants');
    return res.json();
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
    return response.json();
  },

  sendToLine: async (idCard: string): Promise<any> => {
    const response = await fetch(`${API_URL}/api/applicants/${idCard}/send-line`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการส่งข้อมูลเข้า Line');
    }
    return response.json();
  }
};
