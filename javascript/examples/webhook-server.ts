/**
 * AgentGatePay SDK - Webhook Server Example
 *
 * Express.js server that handles AgentPay webhooks
 *
 * Requires: npm install express body-parser
 */

import express from 'express';
import bodyParser from 'body-parser';
import { AgentGatePay } from '../src';

const app = express();
const PORT = 3000;

// IMPORTANT: Use raw body parser for webhook signature verification
app.use(bodyParser.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

// Initialize AgentPay client
const client = new AgentGatePay({
  apiKey: process.env.AGENTPAY_API_KEY!
});

// Webhook secret (get this from webhook configuration)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'my-webhook-secret-123';

/**
 * Webhook endpoint
 * Receives payment notifications from AgentPay
 */
app.post('/agentpay-webhook', async (req, res) => {
  try {
    // Get signature from header
    const signature = req.headers['x-agentpay-signature'] as string;

    if (!signature) {
      console.error('Missing signature header');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Verify and parse webhook payload
    const payload = client.webhooks.verifyAndParse(
      (req as any).rawBody,
      signature,
      WEBHOOK_SECRET
    );

    console.log(`\n=== Webhook Received: ${payload.type} ===`);
    console.log(`TX Hash: ${payload.data.txHash}`);
    console.log(`Amount: $${payload.data.amountUsd}`);
    console.log(`From: ${payload.data.sender}`);
    console.log(`To: ${payload.data.recipient}`);
    console.log(`Token: ${payload.data.token} on ${payload.data.chain}`);
    console.log(`Timestamp: ${payload.data.timestamp}\n`);

    // Handle different event types
    switch (payload.type) {
      case 'payment.completed':
        await handlePaymentCompleted(payload.data);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload.data);
        break;

      case 'payment.pending':
        await handlePaymentPending(payload.data);
        break;

      default:
        console.log(`Unknown event type: ${payload.type}`);
    }

    // Respond with success
    res.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Handle completed payment
 */
async function handlePaymentCompleted(data: any) {
  console.log('✓ Payment completed - granting access to service');

  // TODO: Your business logic here
  // - Grant access to resource
  // - Update database
  // - Send confirmation email
  // - etc.
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(data: any) {
  console.log('✗ Payment failed - notifying user');

  // TODO: Your business logic here
  // - Notify user
  // - Log failure
  // - etc.
}

/**
 * Handle pending payment
 */
async function handlePaymentPending(data: any) {
  console.log('⏳ Payment pending - waiting for confirmation');

  // TODO: Your business logic here
  // - Show pending status
  // - Wait for completion
  // - etc.
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Test webhook configuration
 */
app.post('/test-webhook', async (req, res) => {
  try {
    // Configure webhook
    const webhook = await client.webhooks.create(
      `http://localhost:${PORT}/agentpay-webhook`,
      ['payment.completed', 'payment.failed'],
      WEBHOOK_SECRET
    );

    console.log('Webhook configured:', webhook.webhookId);

    // Test webhook delivery
    await client.webhooks.test(webhook.webhookId);

    res.json({
      success: true,
      webhookId: webhook.webhookId,
      message: 'Webhook configured and tested'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n=== AgentPay Webhook Server ===`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/agentpay-webhook`);
  console.log(`\nReady to receive payment notifications!\n`);
});
