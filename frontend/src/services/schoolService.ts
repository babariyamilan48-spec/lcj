/**
 * School Service
 * Partner-school free access: active school dropdown + access-code redemption
 */

import axios from 'axios';
import { getApiBaseUrl } from '@/config/api';
import { tokenStore } from './token';

export interface SchoolActive {
  id: string;
  name: string;
}

export interface RedeemSchoolCodeResponse {
  success: boolean;
  school_name: string;
}

class SchoolService {
  private baseUrl = '/api/v1/auth_service';

  private getApiClient() {
    const client = axios.create({
      baseURL: getApiBaseUrl(),
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const token = tokenStore.getAccessToken();
    if (token) {
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    return client;
  }

  /**
   * Active schools for the student dropdown (names only — no codes exposed).
   * Returns [] when the feature is toggled off server-side.
   */
  async getActiveSchools(): Promise<SchoolActive[]> {
    try {
      const client = this.getApiClient();
      const response = await client.get<SchoolActive[]>(`${this.baseUrl}/schools/active`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching active schools:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Redeem a school access code to unlock free test access.
   * Server errors (400 wrong code / 403 disabled / 409 other school / 429 rate limit)
   * are surfaced as Error(message) for inline display.
   */
  async redeemSchoolCode(schoolId: string, code: string): Promise<RedeemSchoolCodeResponse> {
    try {
      const client = this.getApiClient();
      const response = await client.post<RedeemSchoolCodeResponse>(
        `${this.baseUrl}/school-code/redeem`,
        { school_id: schoolId, code }
      );
      return response.data;
    } catch (error: any) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;

      if (status === 429) {
        throw new Error('Too many attempts. Please wait a minute and try again.');
      }
      if (status === 409) {
        throw new Error(detail || 'Your account is already linked to a different school.');
      }
      if (status === 403) {
        throw new Error(detail || 'Partner school access is currently disabled.');
      }
      if (status === 400 || status === 404) {
        throw new Error(detail || 'Invalid access code for the selected school.');
      }
      if (status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(detail || error.message || 'Failed to redeem school code');
    }
  }
}

export const schoolService = new SchoolService();
