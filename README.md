# AgentGatePay SDKs

Official JavaScript/TypeScript and Python SDKs for [AgentGatePay](https://api.agentgatepay.com) - Payment gateway for the agent economy.

[![npm version](https://badge.fury.io/js/agentgatepay-sdk.svg)](https://www.npmjs.com/package/agentgatepay-sdk)
[![PyPI version](https://badge.fury.io/py/agentgatepay-sdk.svg)](https://pypi.org/project/agentgatepay-sdk/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

AgentGatePay enables AI agents to make and accept cryptocurrency payments with multi-chain support (Ethereum, Base, Polygon, Arbitrum) for USDC, USDT, and DAI.

**Key Features:**
- 🤖 Built for AI agents and autonomous systems
- ⛓️ Multi-chain support (Ethereum, Base, Polygon, Arbitrum)
- 💰 Multiple stablecoins (USDC, USDT, DAI)
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
import { AgentGatePayClient } from 'agentgatepay-sdk';

const client = new AgentGatePayClient({
  apiKey: 'pk_live_...',
  baseUrl: 'https://api.agentgatepay.com'
});

// Issue a mandate
const mandate = await client.mandates.issue({
  subject: 'my-agent-123',
  budget_usd: 100.0,
  scope: 'resource.read,payment.execute',
  ttl_minutes: 1440
});

// Make a payment
const payment = await client.payments.submitPayment({
  mandate_token: mandate.token,
  tx_hash: '0x...',
  chain: 'base',
  token: 'USDC'
});
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
from agentgatepay_sdk import AgentGatePayClient

client = AgentGatePayClient(
    api_key='pk_live_...',
    base_url='https://api.agentgatepay.com'
)

# Issue a mandate
mandate = client.mandates.issue(
    subject='my-agent-123',
    budget_usd=100.0,
    scope='resource.read,payment.execute',
    ttl_minutes=1440
)

# Make a payment
payment = client.payments.submit_payment(
    mandate_token=mandate['token'],
    tx_hash='0x...',
    chain='base',
    token='USDC'
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

| Chain | Networks | Tokens |
|-------|----------|--------|
| **Ethereum** | Mainnet | USDC, USDT, DAI |
| **Base** | Mainnet | USDC, USDT, DAI |
| **Polygon** | Mainnet | USDC, USDT, DAI |
| **Arbitrum** | One | USDC, USDT, DAI |

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

- **Issues**: [GitHub Issues](https://github.com/AgentGatePay/agentgatepay-sdks/issues)
- **Email**: support@agentgatepay.io
- **Documentation**: https://docs.agentgatepay.io

---

## License

MIT License - see [LICENSE](./javascript/LICENSE) for details.

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

**Built for the agent economy** 🤖⚡💰
