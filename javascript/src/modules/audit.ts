/**
 * Audit Module
 * Handles audit log retrieval and statistics
 */

import { HttpClient } from '../utils/http';
import { validateRequired } from '../utils/validation';

export interface AuditLog {
  id: string;
  timestamp: number;
  event_type: string;
  client_id: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditStats {
  total_events: number;
  event_types: Record<string, number>;
  time_range: {
    start: number;
    end: number;
  };
}

export interface AuditLogsQuery {
  limit?: number;
  event_type?: string;
  client_id?: string;
  start_time?: number;
  end_time?: number;
  last_key?: string;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  last_key?: string;
  count: number;
}

export class AuditModule {
  constructor(private http: HttpClient) {}

  /**
   * List audit logs with filtering and pagination
   * Requires API key authentication
   * Users can see their own logs by email or wallet address
   *
   * @param query - Optional query parameters
   * @returns Paginated audit logs
   */
  async list(query?: AuditLogsQuery): Promise<AuditLogsResponse> {
    const params = new URLSearchParams();

    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.event_type) params.append('event_type', query.event_type);
    if (query?.client_id) params.append('client_id', query.client_id);
    if (query?.start_time) params.append('start_time', query.start_time.toString());
    if (query?.end_time) params.append('end_time', query.end_time.toString());
    if (query?.last_key) params.append('last_key', query.last_key);

    const url = `/audit/logs?${params.toString()}`;
    const response = await this.http.get<AuditLogsResponse>(url);

    if (!response.data) {
      throw new Error('Failed to list audit logs');
    }

    return response.data;
  }

  /**
   * Get audit statistics
   * Requires API key authentication
   *
   * @param startTime - Optional start time (Unix timestamp)
   * @param endTime - Optional end time (Unix timestamp)
   * @returns Audit statistics
   */
  async getStats(startTime?: number, endTime?: number): Promise<AuditStats> {
    const params = new URLSearchParams();

    if (startTime) params.append('start_time', startTime.toString());
    if (endTime) params.append('end_time', endTime.toString());

    const url = `/audit/stats?${params.toString()}`;
    const response = await this.http.get<AuditStats>(url);

    if (!response.data) {
      throw new Error('Failed to get audit stats');
    }

    return response.data;
  }

  /**
   * Get a specific audit log by ID
   * Requires API key authentication
   *
   * @param logId - Audit log ID
   * @returns Audit log
   */
  async getById(logId: string): Promise<AuditLog> {
    validateRequired(logId, 'logId');

    const response = await this.http.get<AuditLog>(`/audit/logs/${logId}`);

    if (!response.data) {
      throw new Error('Failed to get audit log');
    }

    return response.data;
  }

  /**
   * Get audit logs for a specific blockchain transaction
   * Requires API key authentication
   *
   * @param txHash - Blockchain transaction hash
   * @returns Array of audit logs
   */
  async getByTransaction(txHash: string): Promise<AuditLog[]> {
    validateRequired(txHash, 'txHash');

    const response = await this.http.get<{ logs: AuditLog[] }>(`/audit/logs/transaction/${txHash}`);

    if (!response.data) {
      throw new Error('Failed to get audit logs for transaction');
    }

    return response.data.logs;
  }

  /**
   * Get audit logs for a specific agent
   * Requires API key authentication
   *
   * @param agentId - Agent ID or email
   * @returns Array of audit logs
   */
  async getByAgent(agentId: string): Promise<AuditLog[]> {
    validateRequired(agentId, 'agentId');

    const response = await this.http.get<{ logs: AuditLog[] }>(`/audit/logs/agent/${agentId}`);

    if (!response.data) {
      throw new Error('Failed to get audit logs for agent');
    }

    return response.data.logs;
  }
}
