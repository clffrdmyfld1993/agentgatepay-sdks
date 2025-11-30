/**
 * AgentGatePay Gateway SDK - Type Definitions
 * Official TypeScript types for AgentPay payment gateway
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface AgentPayConfig {
  /**
   * AgentGatePay API Key for backend authentication (format: pk_live_...)
   * Optional, but recommended for production (increases rate limit from 20/min to 100/min)
   * Get it from: User signup → auto-generated API key
   */
  apiKey?: string;
  /** Agent ID for tracking (defaults to 'sdk-client') */
  agentId?: string;
  /** Base API URL (defaults to production endpoint) */
  apiUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

export type Chain = 'ethereum' | 'base' | 'polygon' | 'arbitrum';
export type Token = 'USDC' | 'USDT' | 'DAI';
export type UserType = 'agent' | 'merchant' | 'both';

// ============================================================================
// Authentication Types
// ============================================================================

export interface SignupRequest {
  email: string;
  password: string;
  userType: UserType;
}

export interface SignupResponse {
  success: boolean;
  user: User;
  /** AgentGatePay API Key (pk_live_...) - SAVE THIS! Shown only once. */
  apiKey: string;
  keyId: string;
  keyPrefix: string;
  message: string;
}

export interface User {
  userId: string;
  email: string;
  userType: UserType;
  reputationScore: number;
  status: string;
  createdAt: string;
  wallets?: WalletAddress[];
}

export interface WalletAddress {
  chain: Chain;
  address: string;
  addedAt: string;
}

export interface AddWalletRequest {
  chain: Chain;
  address: string;
}

/**
 * AgentGatePay API Key Record
 * NOTE: This is NOT a wallet private key!
 * API Key = Backend authentication (pk_live_...)
 * Wallet Private Key = Transaction signing (0x...)
 * Mandate Token = Spending authorization (JWT)
 */
export interface APIKey {
  keyId: string;
  userId: string;
  keyPrefix: string;
  name?: string;
  createdAt: string;
  lastUsedAt?: string;
  status: 'active' | 'revoked';
}

export interface CreateAPIKeyRequest {
  name?: string;
}

export interface CreateAPIKeyResponse {
  success: boolean;
  /** AgentGatePay API Key (pk_live_...) - SAVE THIS! Shown only once. */
  apiKey: string;
  keyId: string;
  keyPrefix: string;
  message: string;
}

// ============================================================================
// AP2 Mandate Types
// ============================================================================

/**
 * Request to issue an AP2 mandate
 *
 * IMPORTANT: Mandate is a PRE-CONFIGURATION step!
 * User creates mandate ONCE (or when budget runs out), then uses it for multiple payments.
 *
 * Flow:
 * 1. User creates mandate (this request) → Gets mandate token
 * 2. User stores mandate token (valid for ttlMinutes, max budget)
 * 3. Agent uses mandate token in x-mandate header for ALL payments
 * 4. Gateway deducts from mandate budget on each payment
 * 5. When budget exhausted or expired → Create new mandate
 */
export interface IssueMandateRequest {
  subject: string;
  budget_usd: number;
  scope?: string;
  ttl_minutes?: number;
}

export interface IssueMandateResponse {
  mandateId: string;
  /**
   * Mandate Token (JWT format) - SAVE THIS!
   * Use this in x-mandate header for all payments until budget exhausted or expired.
   * Format: eyJhbGc...
   * This is NOT an API key or wallet private key!
   */
  mandateToken: string;
  issuedAt: number;
  expiresAt: number;
}

export interface VerifyMandateResponse {
  valid: boolean;
  payload?: MandatePayload;
  error?: string;
}

export interface MandatePayload {
  sub: string;
  budget_usd: string;
  budget_remaining: string;
  scope: string;
  exp: number;
  iat: number;
  nonce: string;
}

// ============================================================================
// x402 Payment Types
// ============================================================================

export interface PaymentRequirement {
  x402_version: number;
  accepts: PaymentAccept[];
  error: string;
}

export interface PaymentAccept {
  scheme: string;
  network: Chain;
  chain_id: number;
  chain_name: string;
  max_amount_required: string;
  resource: string;
  description: string;
  mime_type: string;
  pay_to: string;
  max_timeout_seconds: number;
  asset: string;
  asset_symbol: Token;
  asset_decimals: number;
  nonce: string;
  explorer_url: string;
}

export interface SubmitPaymentRequest {
  mandate: string;
  txHash: string;
  chain?: Chain;
  token?: Token;
}

export interface SubmitPaymentResponse {
  success: boolean;
  status: 'completed' | 'pending' | 'failed';
  txHash: string;
  txHashCommission?: string;  // Commission transaction hash (two-transaction model)
  amountUsd: number;
  budgetRemaining: number;
  resource?: any;
  error?: string;
}

export interface PayWithWalletRequest {
  mandate: string;
  wallet: any; // ethers.Wallet
  chain?: Chain;
  token?: Token;
  amountUsd: number;
  recipientAddress: string;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface WebhookConfig {
  url: string;
  events: WebhookEvent[];
  secret?: string;
}

export type WebhookEvent = 'payment.completed' | 'payment.failed' | 'payment.pending';

export interface Webhook {
  webhookId: string;
  merchantWallet: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastTriggeredAt?: string;
}

export interface WebhookPayload {
  type: WebhookEvent;
  data: {
    txHash: string;
    sender: string;
    recipient: string;
    amountUsd: number;
    token: Token;
    chain: Chain;
    timestamp: string;
  };
  signature: string;
}

export interface TestWebhookRequest {
  webhookId: string;
}

// ============================================================================
// Payment Verification Types (Merchant)
// ============================================================================

export interface PaymentVerification {
  isValid: boolean;
  txHash: string;
  status: 'completed' | 'pending' | 'failed';
  sender: string;
  recipient: string;
  amountUsd: number;
  token: Token;
  chain: Chain;
  blockNumber?: number;
  timestamp: string;
  error?: string;
}

export interface PaymentStatus {
  status: 'completed' | 'pending' | 'failed';
  txHash: string;
  timestamp: string;
}

export interface PaymentListQuery {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface Payment {
  id: string;
  txHash: string;
  sender: string;
  recipient: string;
  amountUsd: number;
  token: Token;
  chain: Chain;
  status: string;
  createdAt: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface PublicAnalytics {
  totalTransactions: number;
  totalVolumeUsd: number;
  activeUsers: number;
  averageTransactionUsd: number;
  chainDistribution: Record<Chain, number>;
  tokenDistribution: Record<Token, number>;
  timestamp: string;
}

export interface UserAnalytics {
  userType: UserType;
  totalTransactions: number;
  totalAmountUsd: number;
  averageTransactionUsd: number;
  chainDistribution: Record<Chain, number>;
  tokenDistribution: Record<Token, number>;
  recentTransactions: Payment[];
}

export interface RevenueAnalytics {
  startDate: string;
  endDate: string;
  totalRevenueUsd: number;
  transactionCount: number;
  averageTransactionUsd: number;
  chainBreakdown: Record<Chain, { count: number; volumeUsd: number }>;
  tokenBreakdown: Record<Token, { count: number; volumeUsd: number }>;
  topSenders: Array<{ address: string; count: number; volumeUsd: number }>;
}

// ============================================================================
// Error Types
// ============================================================================

export class AgentPayError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AgentPayError';
  }
}

export class RateLimitError extends AgentPayError {
  constructor(
    message: string,
    public retryAfter: number,
    public limit: number,
    public remaining: number
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends AgentPayError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_FAILED', 401);
    this.name = 'AuthenticationError';
  }
}

export class InvalidTransactionError extends AgentPayError {
  constructor(
    message: string,
    public reason: string
  ) {
    super(message, 'INVALID_TRANSACTION', 400);
    this.name = 'InvalidTransactionError';
  }
}

export class MandateError extends AgentPayError {
  constructor(message: string, public reason: string) {
    super(message, 'MANDATE_ERROR', 400);
    this.name = 'MandateError';
  }
}

// ============================================================================
// Response Wrapper
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
  headers?: Record<string, string>;
}
