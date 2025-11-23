/**
 * AgentGatePay SDK
 * Official JavaScript/TypeScript SDK for AgentGatePay - Payment gateway for AI agents
 *
 * @packageDocumentation
 */

// Main client
export { AgentGatePay } from './client';

// Type exports
export type {
  // Configuration
  AgentPayConfig,
  Chain,
  Token,
  UserType,

  // Authentication
  SignupRequest,
  SignupResponse,
  User,
  WalletAddress,
  AddWalletRequest,
  APIKey,
  CreateAPIKeyRequest,
  CreateAPIKeyResponse,

  // Mandates
  IssueMandateRequest,
  IssueMandateResponse,
  VerifyMandateResponse,
  MandatePayload,

  // Payments
  PaymentRequirement,
  PaymentAccept,
  SubmitPaymentRequest,
  SubmitPaymentResponse,
  PayWithWalletRequest,
  Payment,
  PaymentListQuery,
  PaymentVerification,
  PaymentStatus,

  // Webhooks
  WebhookConfig,
  Webhook,
  WebhookPayload,
  WebhookEvent,
  TestWebhookRequest,

  // Analytics
  PublicAnalytics,
  UserAnalytics,
  RevenueAnalytics,

  // Responses
  APIResponse
} from './types';

// Error exports
export {
  AgentPayError,
  RateLimitError,
  AuthenticationError,
  InvalidTransactionError,
  MandateError
} from './types';

// Validation exports (useful for advanced users)
export {
  validateEmail,
  validateEthereumAddress,
  validateChain,
  validateToken,
  validateAmount,
  validateUrl,
  validateApiKey,
  validateMandateToken,
  validateTxHash,
  SUPPORTED_CHAINS,
  SUPPORTED_TOKENS
} from './utils/validation';
