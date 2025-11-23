/**
 * AgentGatePay SDK - Merchant Quickstart Example
 *
 * This example shows how a merchant can:
 * 1. Verify payments
 * 2. Configure webhooks for payment notifications
 * 3. Get revenue analytics
 *
 * Time to integration: ~5 minutes
 */

import { AgentGatePay } from '../src';

async function main() {
  // Initialize client (API key required for merchant features)
  const client = new AgentGatePay({
    apiKey: process.env.AGENTPAY_API_KEY!, // Required: 'pk_live_...'
    agentId: 'my-merchant',
    debug: true
  });

  console.log('=== AgentPay Merchant Quickstart ===\n');

  // Step 1: Verify a payment (public endpoint, no auth needed)
  console.log('Step 1: Verifying payment...');
  const verification = await client.payments.verify(
    '0x1234567890abcdef...' // Transaction hash from customer
  );

  console.log('Payment verified!');
  console.log(`  Valid: ${verification.isValid}`);
  console.log(`  Amount: $${verification.amountUsd}`);
  console.log(`  From: ${verification.sender}`);
  console.log(`  Token: ${verification.token} on ${verification.chain}\n`);

  // Step 2: Configure webhook for automatic notifications
  console.log('Step 2: Configuring webhook...');
  const webhook = await client.webhooks.create(
    'https://myserver.com/agentpay-webhook',
    ['payment.completed', 'payment.failed'],
    'my-webhook-secret-123' // Secret for HMAC verification
  );

  console.log('Webhook configured!');
  console.log(`  ID: ${webhook.webhookId}`);
  console.log(`  URL: ${webhook.url}`);
  console.log(`  Events: ${webhook.events.join(', ')}\n`);

  // Step 3: Get revenue analytics
  console.log('Step 3: Getting revenue analytics...');
  const revenue = await client.analytics.getRevenue(
    '2025-11-01', // Start date
    '2025-11-07'  // End date
  );

  console.log('Revenue analytics:');
  console.log(`  Total revenue: $${revenue.totalRevenueUsd}`);
  console.log(`  Transactions: ${revenue.transactionCount}`);
  console.log(`  Average: $${revenue.averageTransactionUsd}\n`);

  console.log('✓ Complete! You can now accept payments from AI agents.\n');
}

main().catch(console.error);
