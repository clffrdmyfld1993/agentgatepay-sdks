# AgentGatePay SDKs

Official JavaScript/TypeScript and Python SDKs for [AgentGatePay](https://api.agentgatepay.com) - Secure multi-chain cryptocurrency payment gateway for AI agents and autonomous systems.

[![npm version](https://badge.fury.io/js/agentgatepay-sdk.svg)](https://www.npmjs.com/package/agentgatepay-sdk)
[![PyPI version](https://badge.fury.io/py/agentgatepay-sdk.svg)](https://pypi.org/project/agentgatepay-sdk/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

AgentGatePay enables AI agents to make and accept cryptocurrency payments with multi-chain support (Ethereum, Base, Polygon, Arbitrum) for stablecoins (USDC, USDT, DAI).

**Key Features:**
- 🤖 Built for AI agents and autonomous systems
- 🛡️ **AIF (Agent Interaction Firewall)** - First firewall built for AI agents
- ⛓️ Multi-chain support (Ethereum, Base, Polygon, Arbitrum)
- 💰 Multiple stablecoins (USDC on all chains, USDT/DAI on most)
- 🔐 AP2 mandate protocol for budget-controlled payments
- 🔌 MCP (Model Context Protocol) integration
- 📊 Real-time analytics and webhooks
- ⚡ Sub-5 second payment verification

## SDKs

### JavaScript/TypeScript SDK

**Installation:**
```bash
npm install agentgatepay-sdk
```

**Quick Start:**
```typescript
import { AgentGatePay } from 'agentgatepay-sdk';

const client = new AgentGatePay({
  apiKey: 'pk_live_...',
  apiUrl: 'https://api.agentgatepay.com'
});

// Issue a mandate (budget tracks spending in USD equivalent)
const mandate = await client.mandates.issue(
  'my-agent-123',                           // subject
  100.0,                                    // budget in USD (tracks value across USDC/USDT/DAI)
  'resource.read,payment.execute',          // scope
  1440                                      // ttl_minutes
);

// Make a payment (client pays in stablecoins: USDC, USDT, or DAI)
const payment = await client.payments.submitTxHash(
  mandate.mandateToken,                     // mandate token
  '0x...',                                  // blockchain tx_hash (client sends USDC/USDT/DAI)
  undefined,                                // tx_hash_commission (optional)
  'base',                                   // chain (ethereum, base, polygon, arbitrum)
  'USDC'                                    // token (USDC, USDT, or DAI)
);
```

📚 **[Full JavaScript Documentation](./javascript/README.md)**

---

### Python SDK

**Installation:**
```bash
pip install agentgatepay-sdk
```

**Quick Start:**
```python
from agentgatepay_sdk import AgentGatePay

client = AgentGatePay(
    api_key='pk_live_...',
    api_url='https://api.agentgatepay.com'
)

# Issue a mandate (budget tracks spending in USD equivalent)
mandate = client.mandates.issue(
    subject='my-agent-123',
    budget=100.0,                            # budget in USD (tracks value across USDC/USDT/DAI)
    scope='resource.read,payment.execute',
    ttl_minutes=1440
)

# Make a payment (client pays in stablecoins: USDC, USDT, or DAI)
payment = client.payments.submit_tx_hash(
    mandate=mandate['mandateToken'],         # mandate token
    tx_hash='0x...',                         # blockchain tx_hash (client sends USDC/USDT/DAI)
    chain='base',                            # chain (ethereum, base, polygon, arbitrum)
    token='USDC'                             # token (USDC, USDT, or DAI)
)
```

📚 **[Full Python Documentation](./python/README.md)**

---

## Features by Module

| Module | JavaScript | Python | Description |
|--------|------------|--------|-------------|
| **Auth** | ✅ | ✅ | User signup, API key management, wallet management |
| **Mandates** | ✅ | ✅ | Issue and verify AP2 budget mandates |
| **Payments** | ✅ | ✅ | Submit payments, verify transactions, payment history |
| **Webhooks** | ✅ | ✅ | Configure payment notifications |
| **Analytics** | ✅ | ✅ | Revenue tracking, spending analytics |
| **MCP Tools** | ✅ | ✅ | Model Context Protocol integration |
| **Audit** | ✅ | ✅ | Access audit logs and transaction history |

---

## Supported Chains & Tokens

| Token | Ethereum | Base | Polygon | Arbitrum |
|-------|----------|------|---------|----------|
| **USDC** | ✅ (6 decimals) | ✅ (6 decimals) | ✅ (6 decimals) | ✅ (6 decimals) |
| **USDT** | ✅ (6 decimals) | ❌ | ✅ (6 decimals) | ✅ (6 decimals) |
| **DAI** | ✅ (18 decimals) | ✅ (18 decimals) | ✅ (18 decimals) | ✅ (18 decimals) |

**Chain Details:**
- **Ethereum** (Chain ID: 1) - Ethereum Mainnet
- **Base** (Chain ID: 8453) - Base (USDT not supported)
- **Polygon** (Chain ID: 137) - Polygon PoS
- **Arbitrum** (Chain ID: 42161) - Arbitrum One

---

## 🛡️ Security & Rate Limits (AIF)

**AIF (Agent Interaction Firewall)** is the first firewall built specifically for AI agents, protecting agents from other agents in the autonomous economy.

### Rate Limits

| User Type | Rate Limit | Benefits |
|-----------|------------|----------|
| **Anonymous** | 20 requests/min | Basic access, no signup required |
| **With Account** | 100 requests/min | **5x more requests**, payment history, reputation tracking |

**Per-Endpoint Limits:**
- `/health` - 60 requests/min
- `/mandates/issue` - 20 requests/min
- `/x402/resource` - 60 requests/min
- User signup - 5 per hour per IP

**Rate limit headers** (RFC 6585 compliant):
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
Retry-After: 42
```

### Security Features

**1. Distributed Rate Limiting**
- ✅ Production-ready distributed counters
- ✅ Enforced across all server instances
- ✅ 1-minute fixed windows with automatic TTL cleanup
- ✅ Graceful degradation (fails open on errors)

**2. Replay Protection**
- ✅ TX-hash based nonces (cryptographically unique)
- ✅ 24-hour TTL on used nonces
- ✅ Prevents double-spending at API level
- ✅ Automatic detection: uses `tx_hash` or explicit `nonce`

**3. Agent Reputation System** (Enabled by default)
- Score range: **0-200** (new agents start at 100)
- Blocking thresholds:
  - **0-30**: ❌ Blocked (bad actor)
  - **31-60**: ⚠️ Warning (suspicious)
  - **61-200**: ✅ Allowed (good standing)
- Real-time tracking of agent behavior
- Fail-open design (errors never break payments)
- Manual override available for false positives

**4. Mandatory Mandates** (Breaking change Nov 2024)
- ⚠️ All payments MUST have an AP2 mandate
- Budget tracking and enforcement
- Scope validation (permissions)
- Prevents unauthorized payments

### How to Increase Limits

**Create a free account** to get 5x more requests:

```typescript
// JavaScript
const user = await client.auth.signup({
  email: 'agent@example.com',
  password: 'secure_password',
  account_type: 'agent' // or 'merchant' or 'both'
});

// Auto-generated API key (shown once)
console.log(user.api_key); // pk_live_abc123...
```

```python
# Python
user = client.auth.signup(
    email='agent@example.com',
    password='secure_password',
    account_type='agent'  # or 'merchant' or 'both'
)

# Auto-generated API key (shown once)
print(user['api_key'])  # pk_live_abc123...
```

**Then use your API key:**
```typescript
const client = new AgentGatePayClient({
  apiKey: 'pk_live_abc123...',  // ← 100 requests/min
  baseUrl: 'https://api.agentgatepay.com'
});
```

### Handling Rate Limits

**Best Practices:**
1. **Check response headers** for remaining quota
2. **Implement exponential backoff** on 429 errors
3. **Cache mandate tokens** (reuse for multiple payments)
4. **Respect `Retry-After` header**

**Example:**
```typescript
try {
  const mandate = await client.mandates.issue({...});
} catch (error) {
  if (error.status === 429) {
    const retryAfter = error.headers['retry-after'];
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);
    await sleep(retryAfter * 1000);
    // Retry...
  }
}
```

---

## Framework Integration Guides

- **LangChain**: Coming soon
- **AutoGPT**: Coming soon
- **CrewAI**: Coming soon
- **Vercel AI SDK**: Coming soon
- **Semantic Kernel**: Coming soon
- **AutoGen**: Coming soon
- **Claude Desktop (MCP)**: Coming soon

---

## API Documentation

- **REST API**: https://api.agentgatepay.com
- **MCP Endpoint**: https://mcp.agentgatepay.com
- **Dashboard**: https://api.agentgatepay.com/dashboard

---

## Examples

Check out the [agentgatepay-examples](https://github.com/AgentGatePay/agentgatepay-examples) repository for integration examples with popular AI frameworks.

---

## Development

### JavaScript SDK

```bash
cd javascript
npm install
npm run build
npm test
```

### Python SDK

```bash
cd python
pip install -e ".[dev]"
pytest
black agentgatepay_sdk/
mypy agentgatepay_sdk/
```

---

## Publishing

### JavaScript/TypeScript

```bash
cd javascript
npm version patch|minor|major
npm run build
npm publish
```

### Python

```bash
cd python
python setup.py sdist bdist_wheel
twine upload dist/*
```

---

## Support

- **GitHub Issues**: [AgentGatePay/agentgatepay-sdks](https://github.com/AgentGatePay/agentgatepay-sdks/issues)
- **Examples Repository**: [AgentGatePay/agentgatepay-examples](https://github.com/AgentGatePay/agentgatepay-examples)
- **Email**: support@agentgatepay.com

---

## License

MIT License - see [LICENSE](./javascript/LICENSE) for details.

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

**Built for the agent economy** 🤖⚡💰
