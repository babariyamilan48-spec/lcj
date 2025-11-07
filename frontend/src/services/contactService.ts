/**
 * Contact service for handling contact form submissions
 */

import { getApiBaseUrl } from '../config/api';

// Use dynamic API base URL
const getApiUrl = () => getApiBaseUrl();

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  inquiry_type: 'general' | 'technical' | 'billing' | 'partnership' | 'feedback';
}

export interface ContactResponse {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  inquiry_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ContactService {
  private getBaseUrl(): string {
    return `${getApiUrl()}/api/v1/contact_service`;
  }

  /**
   * Submit a contact form
   */
  async submitContact(formData: ContactFormData): Promise<ApiResponse<ContactResponse>> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/contacts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('Contact submission error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit contact form',
      };
    }
  }

  /**
   * Get all contacts (admin only)
   */
  async getContacts(page: number = 1, perPage: number = 10, status?: string): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`${this.getBaseUrl()}/contacts/?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header when implementing auth
          // 'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('Get contacts error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get contacts',
      };
    }
  }

  /**
   * Get contact by ID (admin only)
   */
  async getContact(contactId: number): Promise<ApiResponse<ContactResponse>> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/contacts/${contactId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header when implementing auth
          // 'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('Get contact error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get contact',
      };
    }
  }

  /**
   * Update contact status (admin only)
   */
  async updateContactStatus(contactId: number, status: string): Promise<ApiResponse<ContactResponse>> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header when implementing auth
          // 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('Update contact status error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update contact status',
      };
    }
  }

  /**
   * Delete contact (admin only)
   */
  async deleteContact(contactId: number): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/contacts/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header when implementing auth
          // 'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Delete contact error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete contact',
      };
    }
  }

  /**
   * Get contact statistics (admin only)
   */
  async getContactStats(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/contact-stats/overview`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header when implementing auth
          // 'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('Get contact stats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get contact stats',
      };
    }
  }
}

export const contactService = new ContactService();
