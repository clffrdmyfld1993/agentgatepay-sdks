/**
 * Validation Utilities
 * Input validation helpers for SDK methods
 */

import { Chain, Token } from '../types';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const SUPPORTED_CHAINS: Chain[] = ['ethereum', 'base', 'polygon', 'arbitrum'];
export const SUPPORTED_TOKENS: Token[] = ['USDC', 'USDT', 'DAI'];

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new ValidationError(`Invalid email address: ${email}`);
  }
}

export function validateEthereumAddress(address: string): void {
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!address || !addressRegex.test(address)) {
    throw new ValidationError(`Invalid Ethereum address: ${address}`);
  }
}

export function validateChain(chain: string): asserts chain is Chain {
  if (!SUPPORTED_CHAINS.includes(chain as Chain)) {
    throw new ValidationError(
      `Unsupported chain: ${chain}. Supported chains: ${SUPPORTED_CHAINS.join(', ')}`
    );
  }
}

export function validateToken(token: string): asserts token is Token {
  if (!SUPPORTED_TOKENS.includes(token as Token)) {
    throw new ValidationError(
      `Unsupported token: ${token}. Supported tokens: ${SUPPORTED_TOKENS.join(', ')}`
    );
  }
}

export function validateAmount(amount: number, fieldName: string = 'amount'): void {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    throw new ValidationError(`${fieldName} must be a positive number, got: ${amount}`);
  }
}

export function validateUrl(url: string): void {
  try {
    new URL(url);
  } catch {
    throw new ValidationError(`Invalid URL: ${url}`);
  }
}

export function validateApiKey(apiKey: string): void {
  // AgentPay API keys format: pk_live_{32_hex_chars} or pk_test_{32_hex_chars}
  const apiKeyRegex = /^pk_(live|test)_[a-fA-F0-9]{32}$/;
  if (!apiKey || !apiKeyRegex.test(apiKey)) {
    throw new ValidationError(
      'Invalid API key format. Expected: pk_live_... or pk_test_...'
    );
  }
}

export function validateMandateToken(token: string): void {
  if (!token || typeof token !== 'string' || token.length < 10) {
    throw new ValidationError('Invalid mandate token');
  }

  // AP2 tokens are JWT-like: header.payload.signature
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new ValidationError('Invalid mandate token format (expected JWT-like structure)');
  }
}

export function validateTxHash(txHash: string): void {
  // Ethereum transaction hash: 0x + 64 hex characters
  const txHashRegex = /^0x[a-fA-F0-9]{64}$/;
  if (!txHash || !txHashRegex.test(txHash)) {
    throw new ValidationError(`Invalid transaction hash: ${txHash}`);
  }
}

export function validateRequired<T>(value: T | undefined | null, fieldName: string): asserts value is T {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
}
