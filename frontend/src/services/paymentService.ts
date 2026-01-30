/**
 * Payment Service
 * Handles all payment-related API calls to the backend
 */

import axios from 'axios';
import { getApiBaseUrl } from '@/config/api';
import { tokenStore } from './token';

export interface CreateOrderRequest {
  user_id: string;
  amount?: number;
  plan_type: string;
  coupon_code?: string;
}

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  razorpay_key_id: string;
  environment: 'test' | 'live';
  plan_type: string;
  coupon_applied?: boolean;
  applied_coupon_code?: string | null;
  paid?: boolean;
}

export interface VerifyPaymentRequest {
  user_id: string;
  order_id: string;
  payment_id: string;
  signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  payment_completed: boolean;
  payment_id?: string;
  paid?: boolean;
}

export interface PaymentStatusResponse {
  payment_completed: boolean;
  plan_type?: string;
  last_payment_date?: string;
  payment_id?: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  order_id: string;
  payment_id?: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed';
  created_at: string;
  updated_at: string;
}

class PaymentService {
  private baseUrl = '/api/v1/auth_service/payment';

  private getApiClient() {
    const client = axios.create({
      baseURL: getApiBaseUrl(),
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token if available
    const token = tokenStore.getAccessToken();
    if (token) {
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    return client;
  }

  /**
   * Create a Razorpay order with retry logic
   */
  async createOrder(request: CreateOrderRequest, maxRetries: number = 3): Promise<CreateOrderResponse> {
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const client = this.getApiClient();
        console.log(`📝 Creating order (attempt ${attempt}/${maxRetries})...`);
        console.log('📍 API Base URL:', getApiBaseUrl());
        console.log('📍 Full URL:', `${getApiBaseUrl()}${this.baseUrl}/create-order`);

        const response = await client.post<CreateOrderResponse>(
          `${this.baseUrl}/create-order`,
          request,
          { timeout: 15000 }  // 15 second timeout
        );
        console.log('✅ Order created:', response.data);
        return response.data;
      } catch (error: any) {
        lastError = error;
        console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);

        // Log detailed error info
        console.error('❌ Error response:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);
        console.error('❌ Error message:', error.message);

        // Don't retry on 404, 400, or 401 errors
        if (error.response?.status === 404 || error.response?.status === 400 || error.response?.status === 401) {
          const errorMsg = error.response?.data?.detail || error.message || 'Failed to create order';
          // Include status code in error message for 401 handling
          if (error.response?.status === 401) {
            throw new Error(`401 - ${errorMsg}`);
          }
          throw new Error(errorMsg);
        }

        // Retry on network errors or 5xx errors
        if (attempt < maxRetries) {
          const delay = 500 * attempt; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    // All retries failed
    const errorMsg = lastError?.response?.data?.detail || lastError?.message || 'Failed to create order after multiple attempts';
    console.error('❌ All retries failed:', errorMsg);
    throw new Error(errorMsg);
  }

  /**
   * Verify payment signature with retry logic
   */
  async verifyPayment(request: VerifyPaymentRequest, maxRetries: number = 3): Promise<VerifyPaymentResponse> {
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const client = this.getApiClient();
        console.log(`🔐 Verifying payment (attempt ${attempt}/${maxRetries})...`);

        const response = await client.post<VerifyPaymentResponse>(
          `${this.baseUrl}/verify`,
          request,
          { timeout: 15000 }  // 15 second timeout
        );
        console.log('✅ Payment verified:', response.data);
        return response.data;
      } catch (error: any) {
        lastError = error;
        console.warn(`⚠️ Verification attempt ${attempt} failed:`, error.message);

        // Don't retry on 400 or 401 errors (invalid signature or auth)
        if (error.response?.status === 400 || error.response?.status === 401) {
          const errorMsg = error.response?.data?.detail || error.message || 'Payment verification failed';
          // Include status code in error message for 401 handling
          if (error.response?.status === 401) {
            throw new Error(`401 - ${errorMsg}`);
          }
          throw new Error(errorMsg);
        }

        // Retry on network errors or 5xx errors
        if (attempt < maxRetries) {
          const delay = 500 * attempt;
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    // All retries failed
    const errorMsg = lastError?.response?.data?.detail || lastError?.message || 'Payment verification failed after multiple attempts';
    console.error('❌ All verification retries failed:', errorMsg);
    throw new Error(errorMsg);
  }

  /**
   * Check payment status for a user
   */
  async checkPaymentStatus(userId: string): Promise<PaymentStatusResponse> {
    try {
      const client = this.getApiClient();
      console.log('📍 Checking payment status for user:', userId);
      console.log('📍 API Base URL:', getApiBaseUrl());
      console.log('📍 Full URL:', `${getApiBaseUrl()}${this.baseUrl}/status?user_id=${userId}`);

      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await client.get<PaymentStatusResponse>(
        `${this.baseUrl}/status`,
        {
          params: {
            user_id: userId,
            _t: timestamp  // Cache buster
          }
        }
      );
      console.log('✅ Payment status received:', response.data);
      console.log('✅ Payment completed flag:', response.data.payment_completed);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error checking payment status:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);

      // Check for 401 Unauthorized
      if (error.response?.status === 401) {
        const errorMsg = error.response?.data?.detail || error.message || 'Session expired';
        throw new Error(`401 - ${errorMsg}`);
      }
      throw error;
    }
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(userId: string, limit: number = 10): Promise<{
    user_id: string;
    total_payments: number;
    payments: PaymentRecord[];
  }> {
    try {
      const client = this.getApiClient();
      const response = await client.get(
        `${this.baseUrl}/history`,
        {
          params: {
            user_id: userId,
            limit
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching payment history:', error);
      throw error;
    }
  }

  /**
   * Check if user has completed payment (cached)
   */
  async isPaymentCompleted(userId: string): Promise<boolean> {
    try {
      const status = await this.checkPaymentStatus(userId);
      return status.payment_completed;
    } catch (error) {
      console.error('❌ Error checking if payment completed:', error);
      return false;
    }
  }
}

export const paymentService = new PaymentService();
