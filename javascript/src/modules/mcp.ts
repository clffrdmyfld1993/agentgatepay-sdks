/**
 * MCP (Model Context Protocol) Module
 * Direct access to AgentGatePay MCP endpoints using JSON-RPC 2.0 format
 */

import { HttpClient } from '../utils/http';
import { Chain, Token } from '../types';

export interface MCPToolCallRequest {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolCallResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export interface MCPSubmitPaymentArgs {
  mandate_token: string;
  tx_hash: string;
  tx_hash_commission?: string;
  chain?: Chain;
  token?: Token;
  price_usd?: number;
}

export class MCPModule {
  constructor(private http: HttpClient) {}

  /**
   * Call an MCP tool using JSON-RPC 2.0 format
   *
   * @param toolName - MCP tool name
   * @param args - Tool arguments
   * @returns Tool execution result
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    const response = await this.http.post<MCPToolCallResponse>('/mcp', request);

    if (!response.data || !response.data.content || !response.data.content[0]) {
      throw new Error('Invalid MCP response format');
    }

    // Parse JSON from text content
    const resultText = response.data.content[0].text;
    try {
      return JSON.parse(resultText);
    } catch (error) {
      return { raw: resultText };
    }
  }

  /**
   * Submit payment using MCP endpoint
   *
   * Supports two-transaction model:
   * - tx_hash: Primary payment transaction
   * - tx_hash_commission: Optional commission transaction (if gateway requires commission split)
   *
   * @param args - Payment arguments
   * @returns Payment result
   */
  async submitPayment(args: MCPSubmitPaymentArgs): Promise<any> {
    return await this.callTool('agentpay_submit_payment', {
      mandate_token: args.mandate_token,
      tx_hash: args.tx_hash,
      tx_hash_commission: args.tx_hash_commission,
      chain: args.chain || 'base',
      token: args.token || 'USDC',
      price_usd: args.price_usd?.toString()
    });
  }

  /**
   * Create payment requirements using MCP endpoint
   *
   * @param resourcePath - Resource path
   * @param amountUsd - Amount in USD
   * @param chain - Optional chain
   * @param token - Optional token
   * @returns Payment requirements
   */
  async createPayment(
    resourcePath: string,
    amountUsd: number,
    chain?: Chain,
    token?: Token
  ): Promise<any> {
    return await this.callTool('agentpay_create_payment', {
      resource_path: resourcePath,
      amount_usd: amountUsd,
      chain: chain || 'base',
      token: token || 'USDC'
    });
  }

  /**
   * Issue mandate using MCP endpoint
   *
   * @param subject - Mandate subject
   * @param budgetUsd - Budget in USD
   * @param scope - Optional scope
   * @param ttlMinutes - Optional TTL in minutes
   * @returns Mandate token
   */
  async issueMand(
    subject: string,
    budgetUsd: number,
    scope?: string,
    ttlMinutes?: number
  ): Promise<any> {
    return await this.callTool('agentpay_issue_mandate', {
      subject,
      budget_usd: budgetUsd,
      scope: scope || '*',
      ttl_minutes: ttlMinutes
    });
  }

  /**
   * Verify mandate using MCP endpoint
   *
   * @param mandateToken - Mandate token to verify
   * @returns Verification result
   */
  async verifyMandate(mandateToken: string): Promise<any> {
    return await this.callTool('agentpay_verify_mandate', {
      mandate_token: mandateToken
    });
  }

  /**
   * List available MCP tools
   *
   * @returns Array of available tools
   */
  async listTools(): Promise<any> {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/list',
      params: {}
    };

    const response = await this.http.post<any>('/mcp', request);
    return response.data;
  }
}
