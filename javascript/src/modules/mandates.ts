/**
 * Mandates Module
 * Handles AP2 mandate issuance and verification
 */

import { HttpClient } from '../utils/http';
import {
  validateRequired,
  validateAmount,
  validateMandateToken
} from '../utils/validation';
import {
  IssueMandateRequest,
  IssueMandateResponse,
  VerifyMandateResponse,
  MandateError
} from '../types';

export class MandatesModule {
  constructor(private http: HttpClient) {}

  /**
   * Issue an AP2 mandate for delegated spending
   * @param subject - Subject identifier for the mandate (e.g., agent email or ID)
   * @param budget - Budget in USD
   * @param scope - Optional scope (defaults to '*')
   * @param ttlMinutes - Time to live in minutes (defaults to 30 days = 43200 minutes)
   * @returns Mandate token and metadata
   */
  async issue(
    subject: string,
    budget: number,
    scope: string = '*',
    ttlMinutes: number = 43200
  ): Promise<IssueMandateResponse> {
    // Validate inputs
    validateRequired(subject, 'subject');
    validateAmount(budget, 'budget');

    if (ttlMinutes <= 0) {
      throw new MandateError('ttlMinutes must be positive', 'INVALID_TTL');
    }

    const request: IssueMandateRequest = {
      subject,
      budget,
      scope,
      ttlMinutes
    };

    const response = await this.http.post<IssueMandateResponse>('/mandates/issue', request);

    if (!response.data) {
      throw new MandateError('Failed to issue mandate', 'ISSUE_FAILED');
    }

    return response.data;
  }

  /**
   * Verify an AP2 mandate token
   * @param mandateToken - The AP2 mandate token to verify
   * @returns Verification result with payload if valid
   */
  async verify(mandateToken: string): Promise<VerifyMandateResponse> {
    validateRequired(mandateToken, 'mandateToken');
    validateMandateToken(mandateToken);

    const response = await this.http.post<VerifyMandateResponse>('/mandates/verify', {
      mandateToken
    });

    if (!response.data) {
      throw new MandateError('Failed to verify mandate', 'VERIFY_FAILED');
    }

    if (!response.data.valid && response.data.error) {
      throw new MandateError(
        `Mandate verification failed: ${response.data.error}`,
        'VERIFICATION_FAILED'
      );
    }

    return response.data;
  }

  /**
   * Check remaining budget for a mandate
   * @param mandateToken - The AP2 mandate token
   * @returns Remaining budget in USD
   */
  async checkBudget(mandateToken: string): Promise<number> {
    const verification = await this.verify(mandateToken);

    if (!verification.valid || !verification.payload) {
      throw new MandateError('Cannot check budget for invalid mandate', 'INVALID_MANDATE');
    }

    return parseFloat(verification.payload.budget_remaining);
  }
}
