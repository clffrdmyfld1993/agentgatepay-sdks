/**
 * ConfigLoader Example - Automatic Mandate Management
 *
 * This example demonstrates how to use ConfigLoader for simplified integration:
 * 1. Load configuration from JSON file (public settings)
 * 2. Load secrets from environment variables (never from JSON!)
 * 3. Auto-create mandate on first use
 * 4. Auto-renew mandate when budget exhausted
 *
 * Setup:
 * 1. Copy agentpay.config.json.example to agentpay.config.json
 * 2. Copy .env.example to .env
 * 3. Fill in your API key and wallet private key in .env
 * 4. Run: npm install && npx ts-node config-loader-example.ts
 */

import { AgentGatePay } from '../src';
import { ConfigLoader } from '../src/config-loader';

async function main() {
  console.log('=== ConfigLoader Example ===\n');

  // STEP 1: Load configuration
  console.log('→ Loading configuration...');
  const configLoader = new ConfigLoader('./examples/agentpay.config.json');
  console.log(`✓ Configuration loaded for agent: ${configLoader.getAgentId()}\n`);

  // STEP 2: Initialize AgentGatePay client
  console.log('→ Initializing AgentGatePay client...');
  const client = new AgentGatePay({
    apiKey: configLoader.getApiKey(),
    agentId: configLoader.getAgentId()
  });
  console.log('✓ Client initialized\n');

  // STEP 3: Ensure mandate is valid (auto-creates if needed)
  console.log('→ Ensuring mandate is valid...');
  const mandateToken = await configLoader.ensureMandateValid(client);
  console.log(`✓ Mandate token obtained: ${mandateToken.substring(0, 50)}...\n`);

  // STEP 4: Verify mandate
  console.log('→ Verifying mandate...');
  const verification = await client.mandates.verify(mandateToken);
  console.log('✓ Mandate verified:');
  console.log(`  - Subject: ${verification.payload.sub}`);
  console.log(`  - Budget Total: $${verification.payload.budget_usd}`);
  console.log(`  - Budget Remaining: $${verification.payload.budget_remaining}`);
  console.log(`  - Expires: ${new Date(verification.payload.exp * 1000).toISOString()}\n`);

  // STEP 5: Make payment (example - requires real merchant)
  // Uncomment when you have a real merchant to pay
  /*
  console.log('→ Making payment...');
  const payment = await client.payments.submitTxHash(
    mandateToken,
    '0xYOUR_BLOCKCHAIN_TX_HASH',
    'base',
    'USDC'
  );
  console.log('✓ Payment successful:');
  console.log(`  - Status: ${payment.status}`);
  console.log(`  - Amount: $${payment.amountUsd}`);
  console.log(`  - Budget Remaining: $${payment.budgetRemaining}\n`);
  */

  // STEP 6: Demonstrate auto-renewal
  console.log('→ ConfigLoader will auto-renew mandate when:');
  console.log('  1. Budget exhausted (< $0.01 remaining)');
  console.log('  2. Mandate expired');
  console.log('  3. Next call to ensureMandateValid() will create new mandate\n');

  console.log('=== Example Complete ===');
  console.log('\nKey Takeaways:');
  console.log('✓ Configuration in JSON file (safe to commit)');
  console.log('✓ Secrets in environment variables (never committed)');
  console.log('✓ Mandate auto-created on first use');
  console.log('✓ Mandate auto-renewed when needed');
  console.log('✓ No manual mandate management required!');
}

// Run example
main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
