/**
 * Webhooks Module
 * Handles webhook configuration, testing, and HMAC verification (Merchant use case)
 */

import { createHmac } from 'crypto';
import { HttpClient } from '../utils/http';
import { validateRequired, validateUrl } from '../utils/validation';
import {
  WebhookConfig,
  Webhook,
  WebhookPayload,
  WebhookEvent,
  TestWebhookRequest
} from '../types';

export class WebhooksModule {
  constructor(private http: HttpClient) {}

  /**
   * Configure a new webhook for payment notifications
   * Requires API key authentication
   *
   * @param url - Webhook URL to receive notifications
   * @param events - Array of events to subscribe to
   * @param secret - Optional secret for HMAC signature verification
   * @returns Webhook configuration
   */
  async create(
    url: string,
    events: WebhookEvent[],
    secret?: string
  ): Promise<Webhook> {
    validateRequired(url, 'url');
    validateRequired(events, 'events');
    validateUrl(url);

    if (events.length === 0) {
      throw new Error('At least one event must be specified');
    }

    const validEvents: WebhookEvent[] = ['payment.completed', 'payment.failed', 'payment.pending'];
    for (const event of events) {
      if (!validEvents.includes(event)) {
        throw new Error(`Invalid event: ${event}. Valid events: ${validEvents.join(', ')}`);
      }
    }

    const config: WebhookConfig = {
      url,
      events,
      secret
    };

    const response = await this.http.post<Webhook>('/v1/webhooks/configure', config);

    if (!response.data) {
      throw new Error('Failed to create webhook');
    }

    return response.data;
  }

  /**
   * List all webhooks for current user
   * Requires API key authentication
   *
   * @returns Array of webhooks
   */
  async list(): Promise<Webhook[]> {
    const response = await this.http.get<{ webhooks: Webhook[] }>('/v1/webhooks/list');

    if (!response.data) {
      throw new Error('Failed to list webhooks');
    }

    return response.data.webhooks;
  }

  /**
   * Test webhook delivery
   * Sends a test payload to verify webhook is working
   *
   * @param webhookId - ID of the webhook to test
   */
  async test(webhookId: string): Promise<void> {
    validateRequired(webhookId, 'webhookId');

    const request: TestWebhookRequest = { webhookId };

    await this.http.post('/v1/webhooks/test', request);
  }

  /**
   * Delete a webhook
   *
   * @param webhookId - ID of the webhook to delete
   */
  async delete(webhookId: string): Promise<void> {
    validateRequired(webhookId, 'webhookId');

    await this.http.delete(`/v1/webhooks/${webhookId}`);
  }

  /**
   * Verify webhook HMAC signature
   * Use this in your webhook handler to ensure the request came from AgentPay
   *
   * @param payload - Raw webhook payload (request body as string)
   * @param signature - Signature from x-agentpay-signature header
   * @param secret - Your webhook secret
   * @returns true if signature is valid
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    validateRequired(payload, 'payload');
    validateRequired(signature, 'signature');
    validateRequired(secret, 'secret');

    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Verify and parse webhook payload
   * Convenience method that verifies signature and parses JSON
   *
   * @param payload - Raw webhook payload (request body as string)
   * @param signature - Signature from x-agentpay-signature header
   * @param secret - Your webhook secret
   * @returns Parsed WebhookPayload
   * @throws Error if signature is invalid
   */
  verifyAndParse(payload: string, signature: string, secret: string): WebhookPayload {
    if (!this.verifySignature(payload, signature, secret)) {
      throw new Error('Invalid webhook signature');
    }

    try {
      return JSON.parse(payload) as WebhookPayload;
    } catch (error) {
      throw new Error('Invalid webhook payload JSON');
    }
  }
}
