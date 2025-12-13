/**
 * AgentGatePay - Main SDK Client
 * Official JavaScript/TypeScript SDK for AgentGatePay Gateway
 */

import { HttpClient } from './utils/http';
import { validateApiKey } from './utils/validation';
import { AgentPayConfig } from './types';

// Import modules
import { AuthModule } from './modules/auth';
import { MandatesModule } from './modules/mandates';
import { PaymentsModule } from './modules/payments';
import { WebhooksModule } from './modules/webhooks';
import { AnalyticsModule } from './modules/analytics';
import { AuditModule } from './modules/audit';
import { MCPModule } from './modules/mcp';

/**
 * AgentGatePay Client
 *
 * Main entry point for the AgentGatePay Gateway SDK
 *
 * @example
 * ```typescript
 * import { AgentGatePay } from 'agentgatepay-sdk';
 *
 * const client = new AgentGatePay({
 *   apiKey: 'pk_live_...',
 *   agentId: 'my-agent'
 * });
 *
 * // Issue mandate
 * const mandate = await client.mandates.issue('agent@example.com', 100);
 *
 * // Submit payment
 * const payment = await client.payments.submitTxHash(mandate.mandateToken, '0x...');
 * ```
 */
export class AgentGatePay {
  private http: HttpClient;

  // Public modules
  public readonly auth: AuthModule;
  public readonly mandates: MandatesModule;
  public readonly payments: PaymentsModule;
  public readonly webhooks: WebhooksModule;
  public readonly analytics: AnalyticsModule;
  public readonly audit: AuditModule;
  public readonly mcp: MCPModule;

  /**
   * Create a new AgentGatePay client
   *
   * @param config - Configuration options
   */
  constructor(config: AgentPayConfig = {}) {
    const {
      apiKey,
      agentId = 'sdk-client',
      apiUrl, // No default - client must specify or use env var
      timeout = 30000,
      debug = false
    } = config;

    // Get API URL from config, environment variable, or throw error
    const finalApiUrl = apiUrl || process.env.AGENTPAY_API_URL;

    if (!finalApiUrl) {
      throw new Error(
        'API URL is required. Provide it via config.apiUrl or environment variable AGENTPAY_API_URL.\n' +
        'Example: new AgentGatePay({ apiUrl: "https://your-api.execute-api.region.amazonaws.com", apiKey: "..." })'
      );
    }

    // Validate API key if provided
    if (apiKey) {
      validateApiKey(apiKey);
    }

    // Build headers
    const headers: Record<string, string> = {
      'x-agent-id': agentId
    };

    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    // Initialize HTTP client
    this.http = new HttpClient({
      baseURL: finalApiUrl,
      timeout,
      headers,
      debug
    });

    // Initialize modules
    this.auth = new AuthModule(this.http);
    this.mandates = new MandatesModule(this.http);
    this.payments = new PaymentsModule(this.http);
    this.webhooks = new WebhooksModule(this.http);
    this.analytics = new AnalyticsModule(this.http);
    this.audit = new AuditModule(this.http);
    this.mcp = new MCPModule(this.http);
  }

  /**
   * Update API key (for setting key after signup)
   * @param apiKey - New API key
   */
  setApiKey(apiKey: string): void {
    validateApiKey(apiKey);
    this.http.setHeader('x-api-key', apiKey);
  }

  /**
   * Update agent ID
   * @param agentId - New agent ID
   */
  setAgentId(agentId: string): void {
    this.http.setHeader('x-agent-id', agentId);
  }

  /**
   * Health check
   * @returns System health status
   */
  async health(): Promise<any> {
    const response = await this.http.get('/health');
    return response.data;
  }

  /**
   * Get SDK version
   */
  static get version(): string {
    return '1.1.6';
  }
}
