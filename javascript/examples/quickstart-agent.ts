/**
 * AgentGatePay SDK - Agent Quickstart Example
 *
 * This example shows how an AI agent can:
 * 1. Issue a mandate for delegated spending
 * 2. Submit a payment using an existing transaction
 *
 * Time to first payment: ~5 minutes
 */

import { AgentGatePay } from '../src';

async function main() {
  // Initialize client (API key is optional but recommended for production)
  const client = new AgentGatePay({
    apiKey: process.env.AGENTPAY_API_KEY, // Optional: 'pk_live_...'
    agentId: 'my-ai-agent',
    debug: true // Enable debug logging
  });

  console.log('=== AgentPay Agent Quickstart ===\n');

  // Step 1: Issue a mandate
  console.log('Step 1: Issuing mandate...');
  const mandate = await client.mandates.issue(
    'my-ai-agent@example.com', // Subject (your agent ID)
    100,                         // Budget: $100 USD
    '*',                         // Scope: all resources
    1440                         // TTL: 24 hours
  );

  console.log('Mandate issued!');
  console.log(`  Token: ${mandate.mandateToken.substring(0, 50)}...`);
  console.log(`  Expires: ${new Date(mandate.expiresAt * 1000).toISOString()}\n`);

  // Step 2: Submit payment with existing blockchain transaction
  console.log('Step 2: Submitting payment...');
  const payment = await client.payments.submitTxHash(
    mandate.mandateToken,
    '0x1234567890abcdef...' // Your blockchain transaction hash
  );

  console.log('Payment submitted!');
  console.log(`  Status: ${payment.status}`);
  console.log(`  Amount: $${payment.amountUsd}`);
  console.log(`  Budget remaining: $${payment.budgetRemaining}\n`);

  console.log('✓ Complete! Your AI agent can now make payments.\n');
}

main().catch(console.error);
