/**
 * AgentGatePay SDK - Full Payment Flow with ethers.js
 *
 * Complete example showing:
 * 1. User signup
 * 2. Mandate issuance
 * 3. Payment with ethers.js wallet
 * 4. Transaction confirmation
 *
 * Requires: npm install ethers@^6.0.0
 */

import { AgentGatePay } from '../src';
import { ethers } from 'ethers';

async function main() {
  console.log('=== AgentPay Full Payment Flow ===\n');

  // Step 1: Sign up (optional, but gets you 5x higher rate limits)
  console.log('Step 1: User signup...');
  let client = new AgentGatePay({ debug: true });

  const signup = await client.auth.signup(
    'agent@example.com',
    'SecurePassword123',
    'agent'
  );

  console.log('Signup successful!');
  console.log(`  User ID: ${signup.user.userId}`);
  console.log(`  API Key: ${signup.apiKey.substring(0, 16)}... (SAVE THIS!)\n`);

  // Update client with API key
  client.setApiKey(signup.apiKey);

  // Step 2: Add wallet address
  console.log('Step 2: Adding wallet address...');
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  await client.auth.addWallet('base', walletAddress);
  console.log(`  Wallet added: ${walletAddress}\n`);

  // Step 3: Issue mandate
  console.log('Step 3: Issuing mandate...');
  const mandate = await client.mandates.issue(
    'agent@example.com',
    100,  // $100 budget
    '*',
    43200 // 30 days
  );

  console.log('Mandate issued!');
  console.log(`  Token: ${mandate.mandateToken.substring(0, 50)}...`);
  console.log(`  Expires: ${new Date(mandate.expiresAt * 1000).toISOString()}\n`);

  // Step 4: Create ethers wallet (for demo, use a test wallet)
  console.log('Step 4: Setting up ethers.js wallet...');
  const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
  const wallet = new ethers.Wallet(
    process.env.PRIVATE_KEY || '0x' + '1'.repeat(64), // Replace with real key
    provider
  );

  console.log(`  Wallet address: ${wallet.address}`);
  console.log(`  Balance: ${ethers.formatEther(await provider.getBalance(wallet.address))} ETH\n`);

  // Step 5: Make payment using SDK's payWithWallet helper
  console.log('Step 5: Making payment with ethers.js...');
  const recipientAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  const payment = await client.payments.payWithWallet(
    mandate.mandateToken,
    wallet,
    recipientAddress,
    0.01,  // $0.01 USD
    'base',
    'USDC'
  );

  console.log('Payment completed!');
  console.log(`  Status: ${payment.status}`);
  console.log(`  TX Hash: ${payment.txHash}`);
  console.log(`  Amount: $${payment.amountUsd}`);
  console.log(`  Budget remaining: $${payment.budgetRemaining}\n`);

  // Step 6: Verify on blockchain
  console.log('Step 6: Verifying on blockchain...');
  const verification = await client.payments.verify(payment.txHash);

  console.log('Blockchain verification:');
  console.log(`  Valid: ${verification.isValid}`);
  console.log(`  Block: ${verification.blockNumber}`);
  console.log(`  Timestamp: ${verification.timestamp}\n`);

  // Step 7: Check remaining budget
  console.log('Step 7: Checking remaining budget...');
  const remainingBudget = await client.mandates.checkBudget(mandate.mandateToken);

  console.log(`  Budget remaining: $${remainingBudget}\n`);

  console.log('✓ Complete! Full payment flow executed successfully.\n');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
