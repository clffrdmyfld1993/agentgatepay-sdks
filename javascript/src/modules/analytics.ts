/**
 * Analytics Module
 * Handles platform analytics and revenue tracking
 */

import { HttpClient } from '../utils/http';
import {
  PublicAnalytics,
  UserAnalytics,
  RevenueAnalytics
} from '../types';

export class AnalyticsModule {
  constructor(private http: HttpClient) {}

  /**
   * Get public platform analytics
   * No authentication required, 15-minute cache
   *
   * @returns Public aggregate statistics
   */
  async getPublic(): Promise<PublicAnalytics> {
    const response = await this.http.get<PublicAnalytics>('/v1/analytics/public');

    if (!response.data) {
      throw new Error('Failed to get public analytics');
    }

    return response.data;
  }

  /**
   * Get user-specific analytics (agent or merchant)
   * Requires API key authentication
   *
   * For agents: spending analytics
   * For merchants: revenue analytics
   * For both: combined view
   *
   * @returns User analytics based on account type
   */
  async getMe(): Promise<UserAnalytics> {
    const response = await this.http.get<UserAnalytics>('/v1/analytics/me');

    if (!response.data) {
      throw new Error('Failed to get user analytics');
    }

    return response.data;
  }

  /**
   * Get merchant revenue analytics
   * Requires API key authentication (merchant account)
   *
   * @param startDate - Optional start date (YYYY-MM-DD)
   * @param endDate - Optional end date (YYYY-MM-DD)
   * @returns Detailed revenue breakdown
   */
  async getRevenue(startDate?: string, endDate?: string): Promise<RevenueAnalytics> {
    const params = new URLSearchParams();

    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const url = `/v1/merchant/revenue?${params.toString()}`;
    const response = await this.http.get<RevenueAnalytics>(url);

    if (!response.data) {
      throw new Error('Failed to get revenue analytics');
    }

    return response.data;
  }
}
