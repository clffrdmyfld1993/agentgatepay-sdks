# agentgatepay-sdk

Official JavaScript/TypeScript SDK for [AgentGatePay](https://agentgatepay.io) - Payment gateway for AI agents.

[![npm version](https://img.shields.io/npm/v/agentgatepay-sdk.svg)](https://www.npmjs.com/package/agentgatepay-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **5-minute integration** - From signup to first payment in under 5 minutes
- **Full TypeScript support** - Complete type definitions with IntelliSense
- **Web3 integration** - Built-in ethers.js helpers for blockchain payments
- **Multi-chain** - Support for Ethereum, Base, Polygon, and Arbitrum
- **Multi-token** - USDC, USDT, and DAI
- **Webhooks** - Real-time payment notifications with HMAC verification
- **Analytics** - Built-in revenue and spending tracking
- **Zero dependencies** (except axios) - Lightweight and fast

## Installation

```bash
npm install agentgatepay-sdk
```

Optional (for Web3 features):
```bash
npm install ethers@^6.0.0
```

## Quick Start

> **🔥 NEW: ConfigLoader** - Simplify integration with automatic mandate management! See [ConfigLoader section](#configloader-automatic-mandate-management).

### For AI Agents (Making Payments)

#### Option 1: With ConfigLoader (Recommended - No-Code Mandate Management)

```typescript
import { AgentPayGW, ConfigLoader } from 'agentgatepay-sdk';

// 1. Load configuration (secrets from environment variables)
const configLoader = new ConfigLoader('./agentpay.config.json');
const client = new AgentPayGW({ apiKey: configLoader.getApiKey() });

// 2. Get valid mandate (auto-created if needed)
const mandateToken = await configLoader.ensureMandateValid(client);

// 3. Submit payment
const payment = await client.payments.submitTxHash(mandateToken, '0x...');
console.log(`Payment ${payment.status}: $${payment.amountUsd}`);
```

#### Option 2: Manual (Full Control)

```typescript
import { AgentPayGW } from 'agentgatepay-sdk';

const client = new AgentPayGW({
  apiKey: 'pk_live_...', // Optional but recommended
  agentId: 'my-ai-agent'
});

// 1. Issue mandate manually
const mandate = await client.mandates.issue(
  'agent@example.com', // Subject
  100,                 // Budget: $100 USD
  '*',                 // Scope: all resources
  1440                 // TTL: 24 hours
);

// 2. Submit payment
const payment = await client.payments.submitTxHash(
  mandate.mandateToken,
  '0x...' // Your blockchain transaction hash
);

console.log(`Payment ${payment.status}: $${payment.amountUsd}`);
```

### For Merchants (Accepting Payments)

```typescript
import { AgentPayGW } from 'agentgatepay-sdk';

const client = new AgentPayGW({
  apiKey: 'pk_live_...', // Required for merchant features
});

// 1. Verify payment
const verification = await client.payments.verify('0x...');
console.log(`Valid: ${verification.isValid}, Amount: $${verification.amountUsd}`);

// 2. Setup webhook
const webhook = await client.webhooks.create(
  'https://myserver.com/webhook',
  ['payment.completed', 'payment.failed'],
  'webhook-secret-123'
);

// 3. Get revenue analytics
const revenue = await client.analytics.getRevenue('2025-11-01', '2025-11-07');
console.log(`Total revenue: $${revenue.totalRevenueUsd}`);
```

## Documentation

### Table of Contents

- [ConfigLoader (Automatic Mandate Management)](#configloader-automatic-mandate-management)
- [Authentication](#authentication)
- [Mandates (AP2)](#mandates-ap2)
- [Payments (x402)](#payments-x402)
- [Webhooks](#webhooks)
- [Analytics](#analytics)
- [Error Handling](#error-handling)
- [Web3 Integration](#web3-integration)
- [TypeScript Types](#typescript-types)

---

## ConfigLoader (Automatic Mandate Management)

ConfigLoader simplifies integration by:
- ✅ Loading configuration from JSON file (safe to commit)
- ✅ Loading secrets from environment variables (never from JSON!)
- ✅ Auto-creating mandates on first use
- ✅ Auto-renewing mandates when budget exhausted or expired
- ✅ Perfect for AI tools, no-code platforms, and production apps

### Setup

**1. Create configuration file** (public settings - safe to commit):

```json
// agentpay.config.json
{
  "agentId": "my-agent@example.com",
  "mandate": {
    "budgetUsd": 100,
    "ttlMinutes": 10080
  }
}
```

**2. Set environment variables** (secrets - NEVER commit):

```bash
export AGENTPAY_API_KEY=pk_live_...
export AGENTPAY_WALLET_PRIVATE_KEY=0x...
```

**3. Use ConfigLoader**:

```typescript
import { AgentPayGW, ConfigLoader } from 'agentgatepay-sdk';

// Load configuration
const configLoader = new ConfigLoader('./agentpay.config.json');
const client = new AgentPayGW({ apiKey: configLoader.getApiKey() });

// Get valid mandate (auto-creates if needed)
const mandateToken = await configLoader.ensureMandateValid(client);

// Make payments - ConfigLoader handles mandate lifecycle automatically!
const payment = await client.payments.submitTxHash(mandateToken, '0x...');
```

### Security Best Practices

**✅ DO:**
- Store configuration in JSON file (agentId, budget, TTL)
- Store secrets in environment variables (API key, wallet private key)
- Add `.env` to `.gitignore`
- Use separate agent wallet with limited funds ($10-20)

**❌ DON'T:**
- Put API keys or private keys in JSON files
- Commit `.env` files to Git
- Use main wallet for agents (security risk!)
- Hardcode secrets in code

### Configuration Options

```json
{
  "agentId": "my-agent@example.com",
  "mandate": {
    "budgetUsd": 100,           // Required: Budget in USD
    "ttlMinutes": 10080,        // Optional: Time-to-live (default: 30 days)
    "scope": "resource.read payment.execute"  // Required: Permissions
  }
  // NOTE: Chain/token NOT configured here!
  // Gateway automatically detects from merchant's 402 response
  // Supports: Ethereum, Base, Polygon, Arbitrum
  // Supports: USDC, USDT, DAI (see table above for chain/token matrix)
}
```

**Why no chain/token config?**
- Merchant specifies chain/token in 402 response
- Gateway automatically routes to correct network
- Gateway uses correct RPC endpoint and contract address
- Agent doesn't need blockchain knowledge!

### Auto-Renewal

ConfigLoader automatically renews mandates when:
1. Budget exhausted (< $0.01 remaining)
2. Mandate expired (past TTL)
3. Mandate invalid (verification fails)

Just call `ensureMandateValid()` before each payment - ConfigLoader handles the rest!

### Example

See [examples/config-loader-example.ts](./examples/config-loader-example.ts) for complete working example.

---

## Authentication

### Sign Up

```typescript
const signup = await client.auth.signup(
  'user@example.com',
  'SecurePassword123',
  'agent' // 'agent' | 'merchant' | 'both'
);

console.log(signup.apiKey); // Save this! Shown only once
client.setApiKey(signup.apiKey); // Update client
```

### Add Wallet Address

```typescript
await client.auth.addWallet('base', '0x742d35...');
```

### Manage API Keys

```typescript
// Create new API key
const newKey = await client.auth.createAPIKey('Production Server');
console.log(newKey.apiKey); // Save this!

// List all keys
const keys = await client.auth.listAPIKeys();

// Revoke key
await client.auth.revokeAPIKey('key_abc123');
```

---

## Mandates (AP2)

### Issue Mandate

```typescript
const mandate = await client.mandates.issue(
  'agent@example.com', // Subject
  100,                 // Budget in USD
  '*',                 // Scope (optional, defaults to '*')
  43200                // TTL in minutes (optional, defaults to 30 days)
);

console.log(mandate.mandateToken); // Use this in payment requests
```

### Verify Mandate

```typescript
const verification = await client.mandates.verify(mandateToken);

if (verification.valid) {
  console.log(`Budget remaining: $${verification.payload.budget_remaining}`);
} else {
  console.error(verification.error);
}
```

### Check Remaining Budget

```typescript
const remaining = await client.mandates.checkBudget(mandateToken);
console.log(`Budget remaining: $${remaining}`);
```

---

## Payments (x402)

### Submit Payment with Transaction Hash

```typescript
const payment = await client.payments.submitTxHash(
  mandateToken,
  '0x1234...', // Blockchain transaction hash
  'base',      // Chain (optional, defaults to 'base')
  'USDC'       // Token (optional, defaults to 'USDC')
);

console.log(payment.status);        // 'completed' | 'pending' | 'failed'
console.log(payment.budgetRemaining); // Remaining mandate budget
```

### Pay with ethers.js Wallet

```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const wallet = new ethers.Wallet(privateKey, provider);

const payment = await client.payments.payWithWallet(
  mandateToken,
  wallet,
  '0x742d35...', // Recipient address
  0.01,          // Amount in USD
  'base',        // Chain
  'USDC'         // Token
);

console.log(`Payment sent: ${payment.txHash}`);
```

### Verify Payment (Merchant)

```typescript
const verification = await client.payments.verify('0x1234...');

console.log(verification.isValid);     // true/false
console.log(verification.amountUsd);   // Payment amount
console.log(verification.sender);      // Sender address
console.log(verification.chain);       // Network
console.log(verification.token);       // Token symbol
```

### Get Payment Status

```typescript
const status = await client.payments.getStatus('0x1234...');
console.log(status.status); // 'completed' | 'pending' | 'failed'
```

### List Payments (Merchant)

```typescript
const payments = await client.payments.list({
  startDate: '2025-11-01',
  endDate: '2025-11-07',
  limit: 100,
  offset: 0
});

console.log(`Found ${payments.length} payments`);
```

### Wait for Confirmation

```typescript
// Poll for transaction confirmation (useful for fast chains like Base)
const verification = await client.payments.waitForConfirmation(
  '0x1234...',
  30,    // Max attempts (default: 30)
  2000   // Interval in ms (default: 2000)
);

console.log('Transaction confirmed!');
```

---

## Webhooks

### Create Webhook

```typescript
const webhook = await client.webhooks.create(
  'https://myserver.com/webhook',
  ['payment.completed', 'payment.failed'],
  'my-webhook-secret'
);

console.log(webhook.webhookId);
```

### List Webhooks

```typescript
const webhooks = await client.webhooks.list();
```

### Test Webhook

```typescript
await client.webhooks.test(webhookId);
```

### Delete Webhook

```typescript
await client.webhooks.delete(webhookId);
```

### Verify Webhook Signature

```typescript
// In your webhook handler
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-agentpay-signature'];
  const rawBody = req.rawBody; // Raw request body as string

  try {
    const payload = client.webhooks.verifyAndParse(
      rawBody,
      signature,
      'my-webhook-secret'
    );

    console.log(`Event: ${payload.type}`);
    console.log(`Amount: $${payload.data.amountUsd}`);

    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: 'Invalid signature' });
  }
});
```

---

## Analytics

### Public Analytics

```typescript
const analytics = await client.analytics.getPublic();

console.log(analytics.totalTransactions);
console.log(analytics.totalVolumeUsd);
console.log(analytics.chainDistribution);
```

### User Analytics

```typescript
const myAnalytics = await client.analytics.getMe();

console.log(myAnalytics.totalAmountUsd);
console.log(myAnalytics.averageTransactionUsd);
console.log(myAnalytics.recentTransactions);
```

### Revenue Analytics (Merchant)

```typescript
const revenue = await client.analytics.getRevenue(
  '2025-11-01',
  '2025-11-07'
);

console.log(`Total revenue: $${revenue.totalRevenueUsd}`);
console.log(`Transactions: ${revenue.transactionCount}`);
console.log(`Top sender: ${revenue.topSenders[0].address}`);
```

---

## Error Handling

The SDK provides specific error types for better error handling:

```typescript
import {
  AgentPayGW,
  RateLimitError,
  AuthenticationError,
  InvalidTransactionError,
  MandateError
} from 'agentgatepay-sdk';

try {
  const payment = await client.payments.submitTxHash(...);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
    console.log(`Limit: ${error.limit}, Remaining: ${error.remaining}`);
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid or missing API key');
  } else if (error instanceof InvalidTransactionError) {
    console.log(`Transaction error: ${error.reason}`);
  } else if (error instanceof MandateError) {
    console.log(`Mandate error: ${error.reason}`);
  } else {
    console.log(`Error: ${error.message}`);
  }
}
```

---

## Web3 Integration

### Using with ethers.js

The SDK provides `payWithWallet()` helper that handles multi-chain/token payments:

```typescript
import { AgentPayGW } from 'agentgatepay-sdk';
import { ethers } from 'ethers';

const client = new AgentPayGW({ apiKey: 'pk_live_...' });

// Configure chain and token
const chain = 'base';        // Options: base, ethereum, polygon, arbitrum
const token = 'USDC';        // Options: USDC, USDT, DAI

// Initialize provider for selected chain
const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const wallet = new ethers.Wallet(privateKey, provider);

// The SDK handles transaction building and submission
const payment = await client.payments.payWithWallet(
  mandateToken,
  wallet,
  recipientAddress,
  0.01,    // USD amount
  chain,
  token
);
```

**Changing Chain and Token:**

```typescript
// Example 1: DAI on Ethereum
const provider = new ethers.JsonRpcProvider('https://eth-mainnet.public.blastapi.io');
await client.payments.payWithWallet(mandateToken, wallet, recipient, 0.01, 'ethereum', 'DAI');

// Example 2: USDT on Polygon
const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com');
await client.payments.payWithWallet(mandateToken, wallet, recipient, 0.01, 'polygon', 'USDT');

// Example 3: USDC on Arbitrum
const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
await client.payments.payWithWallet(mandateToken, wallet, recipient, 0.01, 'arbitrum', 'USDC');
```

### Local Signing with ethers.js (Manual Control)

For advanced use cases where you need full control over transaction signing:

```typescript
import { ethers } from 'ethers';

// Multi-chain and multi-token configuration
const TOKENS = {
  USDC: {
    decimals: 6,
    contracts: {
      base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      polygon: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
    }
  },
  USDT: {
    decimals: 6,
    contracts: {
      ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      arbitrum: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'
    }
  },
  DAI: {
    decimals: 18,
    contracts: {
      base: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      ethereum: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      polygon: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      arbitrum: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
    }
  }
};

const RPCS = {
  base: 'https://mainnet.base.org',
  ethereum: 'https://eth-mainnet.public.blastapi.io',
  polygon: 'https://polygon-rpc.com',
  arbitrum: 'https://arb1.arbitrum.io/rpc'
};

// Configure payment (change these for different chains/tokens)
const chain = 'base';           // Options: base, ethereum, polygon, arbitrum
const token = 'USDC';           // Options: USDC, USDT, DAI
const amountUsd = 0.01;         // Payment amount in USD

// Get token configuration
const tokenConfig = TOKENS[token];
const tokenAddress = tokenConfig.contracts[chain];
const decimals = tokenConfig.decimals;

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(RPCS[chain]);
const wallet = new ethers.Wallet(privateKey, provider);

// Token contract
const erc20Abi = ['function transfer(address to, uint256 amount) returns (bool)'];
const contract = new ethers.Contract(tokenAddress, erc20Abi, wallet);

// Calculate amounts in atomic units (handles different decimals automatically)
const totalAmount = BigInt(Math.floor(amountUsd * (10 ** decimals)));
const commission = totalAmount * BigInt(5) / BigInt(1000);  // 0.5%
const merchantAmount = totalAmount - commission;

// Execute commission transfer
const tx1 = await contract.transfer(commissionAddress, commission);
await tx1.wait();

// Execute merchant transfer
const tx2 = await contract.transfer(merchantAddress, merchantAmount);
await tx2.wait();

// Submit payment to AgentGatePay
const payment = await client.payments.submitTxHash(
  mandateToken,
  tx2.hash,
  chain,
  token
);
```

**Key Features:**
- Automatically handles different decimal places (6 for USDC/USDT, 18 for DAI)
- Two-transaction model (commission + merchant)
- Works with all 4 supported blockchains
- Easily switch chains/tokens by changing 3 variables

### Supported Chains & Tokens

ConfigLoader and SDK automatically work with all supported chains and tokens. The gateway handles RPC endpoints and contract addresses - you just configure budget and the agent handles the rest!

**Supported Networks:**
- ✅ **Ethereum** (Mainnet)
- ✅ **Base** (L2, low fees, recommended)
- ✅ **Polygon** (L2, low fees)
- ✅ **Arbitrum** (L2, low fees)

**Supported Tokens:**

| Token | Ethereum | Base | Polygon | Arbitrum |
|-------|----------|------|---------|----------|
| **USDC** (6 decimals) | ✅ | ✅ | ✅ | ✅ |
| **USDT** (6 decimals) | ✅ | ❌ | ✅ | ✅ |
| **DAI** (18 decimals) | ✅ | ✅ | ✅ | ✅ |

**How It Works:**
- Merchant specifies chain/token in 402 response
- Gateway automatically uses correct RPC endpoint
- Gateway handles contract addresses and decimals
- Agent doesn't need to configure anything blockchain-specific!

---

## TypeScript Types

The SDK is written in TypeScript and provides full type definitions:

```typescript
import type {
  AgentPayConfig,
  IssueMandateResponse,
  SubmitPaymentResponse,
  PaymentVerification,
  Webhook,
  RevenueAnalytics
} from 'agentgatepay-sdk';

const config: AgentPayConfig = {
  apiKey: 'pk_live_...',
  debug: true
};
```

---

## Examples

See the [examples](./examples) directory for complete working examples:

- `quickstart-agent.ts` - Agent quickstart (5 minutes to first payment)
- `quickstart-merchant.ts` - Merchant quickstart (5 minutes to integration)
- `full-payment-flow.ts` - Complete flow with ethers.js
- `webhook-server.ts` - Express.js webhook handler

---

## Configuration

### Environment Variables

```bash
# API key (optional but recommended)
AGENTPAY_API_KEY=pk_live_...

# Agent ID (optional, defaults to 'sdk-client')
AGENTPAY_AGENT_ID=my-agent

# API URL (optional, defaults to production)
AGENTPAY_API_URL=https://api.agentgatepay.io

# Webhook secret (for webhook verification)
WEBHOOK_SECRET=my-secret-123

# Private key (for ethers.js integration)
PRIVATE_KEY=0x...
```

### Client Options

```typescript
const client = new AgentPayGW({
  apiKey: 'pk_live_...',      // API key (optional)
  agentId: 'my-agent',        // Agent ID (optional)
  apiUrl: 'https://...',      // API URL (optional)
  timeout: 30000,             // Request timeout in ms (default: 30000)
  debug: true                 // Enable debug logging (default: false)
});
```

---

## Rate Limits & Security (AIF)

**AIF (Agent Interaction Firewall)** - The first firewall built specifically for AI agents.

### Rate Limits

| User Type | Rate Limit | Benefits |
|-----------|------------|----------|
| **Anonymous** | 20 req/min | Basic access, no signup |
| **With Account** | 100 req/min | **5x more requests**, payment history, reputation tracking |

**Create a free account to increase your limits:**
```typescript
const user = await client.auth.signup(
  'agent@example.com',
  'secure_password',
  'agent' // or 'merchant' or 'both'
);
console.log(user.apiKey); // Use this for 5x rate limit!
```

### Security Features

- ✅ **Distributed rate limiting** (DynamoDB atomic counters)
- ✅ **Replay protection** (TX-hash nonces, 24h TTL)
- ✅ **Agent reputation system** (0-200 score, enabled by default)
- ✅ **Mandatory mandates** (budget & scope enforcement)

Rate limit info is included in error messages:

```typescript
catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Retry after: ${error.retryAfter} seconds`);
    console.log(`Limit: ${error.limit}`);
    console.log(`Remaining: ${error.remaining}`);
  }
}
```

---

## Support

- **Documentation:** https://docs.agentgatepay.io
- **SDK Repository:** https://github.com/AgentGatePay/agentgatepay-sdks
- **Issues:** https://github.com/AgentGatePay/agentgatepay-sdks/issues
- **Email:** support@agentgatepay.com

---

## License

MIT License - see [LICENSE](LICENSE) file for details

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

**Built with ❤️ for the agent economy**
