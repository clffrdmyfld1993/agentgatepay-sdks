/**
 * HTTP Client Utility
 * Handles all HTTP requests with error handling, retries, and rate limit awareness
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import {
  APIResponse,
  AgentPayError,
  RateLimitError,
  AuthenticationError,
  InvalidTransactionError
} from '../types';

export interface HttpClientConfig {
  baseURL: string;
  timeout: number;
  headers?: Record<string, string>;
  debug?: boolean;
}

export class HttpClient {
  private client: AxiosInstance;
  private debug: boolean;

  constructor(config: HttpClientConfig) {
    this.debug = config.debug || false;

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        if (this.debug) {
          console.log(`[AgentPay SDK] ${config.method?.toUpperCase()} ${config.url}`);
          if (config.data) {
            console.log(`[AgentPay SDK] Request body:`, config.data);
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        if (this.debug) {
          console.log(`[AgentPay SDK] Response ${response.status}:`, response.data);
        }
        return response;
      },
      (error) => this.handleError(error)
    );
  }

  private handleError(error: AxiosError): never {
    if (this.debug) {
      console.error('[AgentPay SDK] Error:', error.message);
      if (error.response) {
        console.error('[AgentPay SDK] Response data:', error.response.data);
      }
    }

    // No response from server
    if (!error.response) {
      throw new AgentPayError(
        error.message || 'Network error - unable to reach AgentPay gateway',
        'NETWORK_ERROR',
        undefined,
        { originalError: error.message }
      );
    }

    const { status, data } = error.response;
    const errorMessage = (data as any)?.error || error.message;

    // Rate limit error (429)
    if (status === 429) {
      const headers = error.response.headers;
      const retryAfter = parseInt(headers['retry-after'] || '60');
      const limit = parseInt(headers['x-ratelimit-limit'] || '0');
      const remaining = parseInt(headers['x-ratelimit-remaining'] || '0');

      throw new RateLimitError(
        errorMessage || 'Rate limit exceeded',
        retryAfter,
        limit,
        remaining
      );
    }

    // Authentication error (401)
    if (status === 401) {
      throw new AuthenticationError(
        errorMessage || 'Authentication failed - invalid or missing API key'
      );
    }

    // Invalid transaction error (400)
    if (status === 400 && errorMessage.includes('transaction')) {
      throw new InvalidTransactionError(
        errorMessage,
        (data as any)?.reason || 'Unknown reason'
      );
    }

    // Generic error
    throw new AgentPayError(
      errorMessage || 'An error occurred',
      'API_ERROR',
      status,
      data
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    const response = await this.client.get<T>(url, config);
    return this.wrapResponse(response);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    const response = await this.client.post<T>(url, data, config);
    return this.wrapResponse(response);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    const response = await this.client.put<T>(url, data, config);
    return this.wrapResponse(response);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    const response = await this.client.delete<T>(url, config);
    return this.wrapResponse(response);
  }

  private wrapResponse<T>(response: AxiosResponse<T>): APIResponse<T> {
    return {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
      statusCode: response.status,
      headers: response.headers as Record<string, string>
    };
  }

  setHeader(key: string, value: string): void {
    this.client.defaults.headers.common[key] = value;
  }

  removeHeader(key: string): void {
    delete this.client.defaults.headers.common[key];
  }
}
