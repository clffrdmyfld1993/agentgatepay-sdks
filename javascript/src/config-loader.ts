/**
 * AgentGatePay ConfigLoader - Configuration and Mandate Lifecycle Management
 *
 * Simplifies integration by:
 * - Loading public configuration from JSON file
 * - Reading secrets from environment variables (NEVER from JSON)
 * - Auto-creating mandates on first use
 * - Auto-renewing mandates when budget exhausted or expired
 *
 * Security: API keys and wallet private keys MUST be in environment variables,
 * NOT in JSON configuration files.
 */

import * as fs from 'fs';

/**
 * Public configuration structure (safe to commit to Git)
 * Contains ONLY non-sensitive settings
 */
export interface AgentPayPublicConfig {
  /** Agent identifier (email or unique ID) */
  agentId: string;

  /** Mandate pre-configuration settings */
  mandate: {
    /** Budget limit in USD (e.g., 100) */
    budgetUsd: number;
    /** Time-to-live in minutes (e.g., 10080 = 7 days) */
    ttlMinutes?: number;
    /** Scope permissions (default: "*" = all resources) */
    scope?: string;
  };

  /** Optional: Preferred blockchain settings */
  chains?: {
    preferred?: string;
    fallback?: string[];
  };

  /** Optional: Preferred token settings */
  tokens?: {
    preferred?: string;
  };
}

/**
 * ConfigLoader - Manages AgentGatePay configuration and mandate lifecycle
 *
 * SECURITY MODEL:
 * - Public config (agentId, budget, etc.) → JSON file (can be committed to Git)
 * - Secrets (API key, wallet private key) → Environment variables ONLY
 *
 * USAGE:
 *
 * 1. Create agentpay.config.json:
 *    {
 *      "agentId": "my-agent@example.com",
 *      "mandate": { "budgetUsd": 100, "ttlMinutes": 10080 }
 *    }
 *
 * 2. Set environment variables:
 *    export AGENTPAY_API_KEY=pk_live_...
 *    export AGENTPAY_WALLET_PRIVATE_KEY=0x...
 *
 * 3. Use ConfigLoader:
 *    const configLoader = new ConfigLoader('./agentpay.config.json');
 *    const client = new AgentGatePay({ apiKey: configLoader.getApiKey() });
 *    const mandateToken = await configLoader.ensureMandateValid(client);
 */
export class ConfigLoader {
  private config: AgentPayPublicConfig;
  private apiKey: string;
  private walletPrivateKey: string;
  private cachedMandateToken?: string;
  private mandateExpiresAt?: number;

  /**
   * Create ConfigLoader instance
   *
   * @param configPath - Path to agentpay.config.json (public configuration)
   * @throws Error if config file not found or secrets not in environment
   */
  constructor(configPath: string) {
    // Load public configuration from JSON file
    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    this.config = JSON.parse(configContent);

    // Validate public configuration
    if (!this.config.agentId) {
      throw new Error('agentId is required in configuration file');
    }
    if (!this.config.mandate || typeof this.config.mandate.budgetUsd !== 'number') {
      throw new Error('mandate.budgetUsd is required in configuration file');
    }
    if (this.config.mandate.budgetUsd <= 0) {
      throw new Error('mandate.budgetUsd must be greater than 0');
    }

    // Load secrets from ENVIRONMENT VARIABLES (NEVER from JSON!)
    this.apiKey = process.env.AGENTPAY_API_KEY || '';
    this.walletPrivateKey = process.env.AGENTPAY_WALLET_PRIVATE_KEY || '';

    // Validate secrets exist
    if (!this.apiKey) {
      throw new Error(
        'AGENTPAY_API_KEY not found in environment variables. ' +
        'Set it with: export AGENTPAY_API_KEY=pk_live_...'
      );
    }
    if (!this.walletPrivateKey) {
      throw new Error(
        'AGENTPAY_WALLET_PRIVATE_KEY not found in environment variables. ' +
        'Set it with: export AGENTPAY_WALLET_PRIVATE_KEY=0x...'
      );
    }

    // Validate API key format
    if (!this.apiKey.startsWith('pk_live_') && !this.apiKey.startsWith('pk_test_')) {
      throw new Error(
        'Invalid AGENTPAY_API_KEY format. Expected: pk_live_... or pk_test_...'
      );
    }

    // Validate wallet private key format
    if (!this.walletPrivateKey.startsWith('0x') || this.walletPrivateKey.length !== 66) {
      throw new Error(
        'Invalid AGENTPAY_WALLET_PRIVATE_KEY format. Expected: 0x followed by 64 hex characters'
      );
    }
  }

  /**
   * Get AgentGatePay API key (from environment variable)
   * This is the backend authentication credential (format: pk_live_...)
   */
  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Get wallet private key (from environment variable)
   * This is used for signing blockchain transactions
   */
  getWalletPrivateKey(): string {
    return this.walletPrivateKey;
  }

  /**
   * Get agent identifier (from config file)
   */
  getAgentId(): string {
    return this.config.agentId;
  }

  /**
   * Get mandate configuration settings (from config file)
   */
  getMandateConfig() {
    return {
      subject: this.config.agentId,
      budgetUsd: this.config.mandate.budgetUsd,
      ttlMinutes: this.config.mandate.ttlMinutes || 10080, // Default: 7 days
      scope: this.config.mandate.scope || '*' // Default: all resources
    };
  }

  /**
   * Ensure a valid mandate token exists
   *
   * This method:
   * 1. Checks if cached mandate is still valid (not expired, budget > 0)
   * 2. If valid, returns cached mandate token
   * 3. If invalid/missing, creates NEW mandate and returns token
   *
   * This enables "set and forget" mandate management - just call this
   * method before each payment and it handles everything automatically.
   *
   * @param client - AgentGatePay client instance
   * @returns Valid mandate token (JWT format)
   *
   * @example
   * const configLoader = new ConfigLoader('./agentpay.config.json');
   * const client = new AgentGatePay({ apiKey: configLoader.getApiKey() });
   *
   * // First call: Creates new mandate
   * const mandateToken = await configLoader.ensureMandateValid(client);
   *
   * // Subsequent calls: Reuses existing mandate (until budget exhausted)
   * const mandateToken2 = await configLoader.ensureMandateValid(client);
   */
  async ensureMandateValid(client: any): Promise<string> {
    // Check if cached mandate exists and is not expired
    if (this.cachedMandateToken && this.mandateExpiresAt && this.mandateExpiresAt > Date.now()) {
      try {
        // Verify mandate is still valid (checks signature + budget)
        const verification = await client.mandates.verify(this.cachedMandateToken);

        if (verification.valid) {
          const budgetRemaining = parseFloat(verification.payload.budget_remaining);

          // Check if budget is sufficient (> $0.01 threshold)
          if (budgetRemaining > 0.01) {
            console.log(`✓ Reusing existing mandate (budget remaining: $${budgetRemaining.toFixed(2)})`);
            return this.cachedMandateToken;
          } else {
            console.log(`⚠ Mandate budget exhausted ($${budgetRemaining.toFixed(2)} remaining), creating new mandate...`);
          }
        }
      } catch (error) {
        console.log(`⚠ Cached mandate verification failed, creating new mandate...`);
      }
    } else if (this.cachedMandateToken) {
      console.log(`⚠ Cached mandate expired, creating new mandate...`);
    }

    // Create new mandate
    const mandateConfig = this.getMandateConfig();
    console.log(`→ Creating new mandate (budget: $${mandateConfig.budgetUsd}, TTL: ${mandateConfig.ttlMinutes} minutes)...`);

    const mandate = await client.mandates.issue(
      mandateConfig.subject,
      mandateConfig.budgetUsd,
      mandateConfig.scope,
      mandateConfig.ttlMinutes
    );

    // Cache mandate token and expiration
    this.cachedMandateToken = mandate.mandateToken;
    this.mandateExpiresAt = mandate.expiresAt * 1000; // Convert to milliseconds

    const expiresDate = new Date(this.mandateExpiresAt);
    console.log(`✓ Mandate created successfully (expires: ${expiresDate.toISOString()})`);

    return this.cachedMandateToken;
  }

  /**
   * Get preferred blockchain chain (from config file)
   * Returns 'base' if not specified
   */
  getPreferredChain(): string {
    return this.config.chains?.preferred || 'base';
  }

  /**
   * Get fallback blockchain chains (from config file)
   * Returns ['ethereum', 'polygon', 'arbitrum'] if not specified
   */
  getFallbackChains(): string[] {
    return this.config.chains?.fallback || ['ethereum', 'polygon', 'arbitrum'];
  }

  /**
   * Get preferred token (from config file)
   * Returns 'USDC' if not specified
   */
  getPreferredToken(): string {
    return this.config.tokens?.preferred || 'USDC';
  }
}
