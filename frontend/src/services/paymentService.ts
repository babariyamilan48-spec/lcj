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
}

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  razorpay_key_id: string;
  environment: 'test' | 'live';
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
}

export interface PaymentStatusResponse {
  payment_completed: boolean;
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
   * Create a Razorpay order
   */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const client = this.getApiClient();
      console.log('📝 Creating order with request:', request);
      console.log('📍 API Base URL:', getApiBaseUrl());
      console.log('📍 Full URL:', `${getApiBaseUrl()}${this.baseUrl}/create-order`);
      
      const response = await client.post<CreateOrderResponse>(
        `${this.baseUrl}/create-order`,
        request
      );
      console.log('✅ Order created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating order:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error message:', error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to create order');
    }
  }

  /**
   * Verify payment signature
   */
  async verifyPayment(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    try {
      const client = this.getApiClient();
      const response = await client.post<VerifyPaymentResponse>(
        `${this.baseUrl}/verify`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      throw error;
    }
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
