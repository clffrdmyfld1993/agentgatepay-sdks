# agentgatepay-sdk

Official Python SDK for [AgentGatePay](https://agentgatepay.io) - Payment gateway for AI agents.

[![PyPI version](https://img.shields.io/pypi/v/agentgatepay-sdk.svg)](https://pypi.org/project/agentgatepay-sdk/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **5-minute integration** - From signup to first payment in under 5 minutes
- **Type hints** - Full type annotations for better IDE support
- **Multi-chain** - Support for Ethereum, Base, Polygon, and Arbitrum
- **Multi-token** - USDC, USDT, and DAI
- **Webhooks** - Real-time payment notifications with HMAC verification
- **Analytics** - Built-in revenue and spending tracking

## Installation

```bash
pip install agentgatepay-sdk
```

Optional (for Web3 features):
```bash
pip install agentgatepay-sdk[web3]
```

## Quick Start

> **🔥 NEW: ConfigLoader** - Simplify integration with automatic mandate management! See [ConfigLoader section](#configloader-automatic-mandate-management).

### For AI Agents (Making Payments)

#### Option 1: With ConfigLoader (Recommended - No-Code Mandate Management)

```python
from agentgatepay_sdk import AgentGatePay
from agentgatepay_sdk.config_loader import ConfigLoader

# 1. Load configuration (secrets from environment variables)
config_loader = ConfigLoader('./agentpay.config.json')
client = AgentGatePay(api_key=config_loader.get_api_key())

# 2. Get valid mandate (auto-created if needed)
mandate_token = await config_loader.ensure_mandate_valid(client)

# 3. Submit payment
payment = client.payments.submit_tx_hash(mandate_token, '0x...')
print(f"Payment {payment['status']}: ${payment['amountUsd']}")
```

#### Option 2: Manual (Full Control)

```python
from agentgatepay_sdk import AgentGatePay

client = AgentGatePay(
    api_key='pk_live_...',  # Optional but recommended
    agent_id='my-ai-agent'
)

# 1. Issue mandate manually
mandate = client.mandates.issue(
    subject='agent@example.com',
    budget=100,  # $100 USD
    scope='*',
    ttl_minutes=1440  # 24 hours
)

# 2. Submit payment
payment = client.payments.submit_tx_hash(
    mandate=mandate['mandateToken'],
    tx_hash='0x...'  # Your blockchain transaction hash
)

print(f"Payment {payment['status']}: ${payment['amountUsd']}")
```

### For Merchants (Accepting Payments)

```python
from agentgatepay_sdk import AgentGatePay

client = AgentGatePay(api_key='pk_live_...')  # Required for merchant features

# 1. Verify payment
verification = client.payments.verify('0x...')
print(f"Valid: {verification['isValid']}, Amount: ${verification['amountUsd']}")

# 2. Setup webhook
webhook = client.webhooks.create(
    url='https://myserver.com/webhook',
    events=['payment.completed', 'payment.failed'],
    secret='webhook-secret-123'
)

# 3. Get revenue analytics
revenue = client.analytics.get_revenue('2025-11-01', '2025-11-07')
print(f"Total revenue: ${revenue['totalRevenueUsd']}")
```

## Documentation

### ConfigLoader (Automatic Mandate Management)

ConfigLoader simplifies integration by:
- ✅ Loading configuration from JSON file (safe to commit)
- ✅ Loading secrets from environment variables (never from JSON!)
- ✅ Auto-creating mandates on first use
- ✅ Auto-renewing mandates when budget exhausted or expired
- ✅ Perfect for AI tools, no-code platforms, and production apps

#### Setup

**1. Create configuration file** (public settings - safe to commit):

```json
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

```python
from agentgatepay_sdk import AgentGatePay
from agentgatepay_sdk.config_loader import ConfigLoader

# Load configuration
config_loader = ConfigLoader('./agentpay.config.json')
client = AgentGatePay(api_key=config_loader.get_api_key())

# Get valid mandate (auto-creates if needed)
mandate_token = await config_loader.ensure_mandate_valid(client)

# Make payments - ConfigLoader handles mandate lifecycle automatically!
payment = client.payments.submit_tx_hash(mandate_token, '0x...')
```

#### Security Best Practices

**✅ DO:**
- Store configuration in JSON file (agentId, budget, TTL)
- Store secrets in environment variables (API key, wallet private key)
- Use separate agent wallet with limited funds ($10-20)

**❌ DON'T:**
- Put API keys or private keys in JSON files
- Commit secret files to Git
- Use main wallet for agents (security risk!)
- Hardcode secrets in code

#### Supported Chains & Tokens

ConfigLoader automatically works with all supported chains and tokens. The gateway handles RPC endpoints and contract addresses!

**Supported Networks:**
- ✅ Ethereum, Base, Polygon, Arbitrum

**Supported Tokens:**
- ✅ USDC (all 4 chains)
- ✅ USDT (Ethereum, Polygon, Arbitrum - not Base)
- ✅ DAI (all 4 chains)

**Chain/token selected by merchant** in 402 response - agent doesn't configure it!

#### Auto-Renewal

ConfigLoader automatically renews mandates when:
1. Budget exhausted (< $0.01 remaining)
2. Mandate expired (past TTL)
3. Mandate invalid (verification fails)

Just call `ensure_mandate_valid()` before each payment - ConfigLoader handles the rest!

#### Example

See [examples/config_loader_example.py](./examples/config_loader_example.py) for complete working example.

---

### Authentication

```python
# Sign up
signup = client.auth.signup(
    email='user@example.com',
    password='SecurePass123',
    user_type='agent'  # 'agent' | 'merchant' | 'both'
)

print(signup['apiKey'])  # Save this!
client.set_api_key(signup['apiKey'])

# Add wallet
client.auth.add_wallet('base', '0x742d35...')
```

### Mandates (AP2)

```python
# Issue mandate
mandate = client.mandates.issue('agent@example.com', 100)

# Verify mandate
verification = client.mandates.verify(mandate['mandateToken'])

# Check budget
remaining = client.mandates.check_budget(mandate['mandateToken'])
```

### Payments (x402)

#### Submit Payment with Transaction Hash

```python
# Submit payment
payment = client.payments.submit_tx_hash(
    mandate=mandate_token,
    tx_hash='0x...',
    chain='base',  # 'ethereum' | 'base' | 'polygon' | 'arbitrum'
    token='USDC'   # 'USDC' | 'USDT' | 'DAI'
)
```

#### Local Signing with web3.py

```python
from web3 import Web3
from eth_account import Account

# Multi-chain and multi-token configuration
TOKENS = {
    'USDC': {
        'decimals': 6,
        'contracts': {
            'base': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            'ethereum': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            'polygon': '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
            'arbitrum': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
        }
    },
    'USDT': {
        'decimals': 6,
        'contracts': {
            'ethereum': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            'polygon': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
            'arbitrum': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'
        }
    },
    'DAI': {
        'decimals': 18,
        'contracts': {
            'base': '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
            'ethereum': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            'polygon': '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
            'arbitrum': '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
        }
    }
}

RPCS = {
    'base': 'https://mainnet.base.org',
    'ethereum': 'https://eth-mainnet.public.blastapi.io',
    'polygon': 'https://polygon-rpc.com',
    'arbitrum': 'https://arb1.arbitrum.io/rpc'
}

# Configure payment parameters (change these for different chains/tokens)
chain = 'base'          # Options: base, ethereum, polygon, arbitrum
token = 'USDC'          # Options: USDC, USDT, DAI
amount_usd = 0.01       # Payment amount in USD

# Get token configuration
token_config = TOKENS[token]
token_address = token_config['contracts'][chain]
decimals = token_config['decimals']

# Initialize Web3 provider for selected chain
w3 = Web3(Web3.HTTPProvider(RPCS[chain]))
account = Account.from_key(private_key)

# Token contract
token_abi = [{"constant": False, "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "transfer", "outputs": [{"name": "", "type": "bool"}], "type": "function"}]
token_contract = w3.eth.contract(address=token_address, abi=token_abi)

# Calculate amounts in atomic units (handles different decimals automatically)
total_amount = int(amount_usd * (10 ** decimals))
commission = int(total_amount * 0.005)  # 0.5%
merchant_amount = total_amount - commission

# Execute commission transfer
tx1 = token_contract.functions.transfer(
    commission_address,
    commission
).build_transaction({
    'from': account.address,
    'nonce': w3.eth.get_transaction_count(account.address),
    'gas': 100000,
    'gasPrice': w3.eth.gas_price
})
signed_tx1 = account.sign_transaction(tx1)
tx1_hash = w3.eth.send_raw_transaction(signed_tx1.rawTransaction)
w3.eth.wait_for_transaction_receipt(tx1_hash)

# Execute merchant transfer
tx2 = token_contract.functions.transfer(
    merchant_address,
    merchant_amount
).build_transaction({
    'from': account.address,
    'nonce': w3.eth.get_transaction_count(account.address),
    'gas': 100000,
    'gasPrice': w3.eth.gas_price
})
signed_tx2 = account.sign_transaction(tx2)
tx2_hash = w3.eth.send_raw_transaction(signed_tx2.rawTransaction)
w3.eth.wait_for_transaction_receipt(tx2_hash)

# Submit payment to AgentGatePay
payment = client.payments.submit_tx_hash(
    mandate=mandate_token,
    tx_hash=tx2_hash.hex(),
    chain=chain,
    token=token
)
```

**Changing Chain and Token:**

To use a different blockchain or token, simply change the configuration variables:

```python
# Example 1: DAI on Ethereum
chain = 'ethereum'
token = 'DAI'

# Example 2: USDT on Polygon
chain = 'polygon'
token = 'USDT'

# Example 3: USDC on Arbitrum
chain = 'arbitrum'
token = 'USDC'
```

The code automatically handles:
- Correct RPC endpoint for the chain
- Correct token contract address
- Correct decimal places (6 for USDC/USDT, 18 for DAI)

#### Other Payment Operations

```python
# Verify payment (merchant)
verification = client.payments.verify('0x...')

# List payments
payments = client.payments.list_payments(
    start_date='2025-11-01',
    end_date='2025-11-07'
)
```

### Webhooks

```python
# Create webhook
webhook = client.webhooks.create(
    url='https://myserver.com/webhook',
    events=['payment.completed', 'payment.failed'],
    secret='my-secret'
)

# Verify webhook signature (in your webhook handler)
from agentgatepay_sdk.modules.webhooks import WebhooksModule

is_valid = WebhooksModule.verify_signature(
    payload=request.body.decode(),
    signature=request.headers['x-agentpay-signature'],
    secret='my-secret'
)
```

### Analytics

```python
# Public analytics
analytics = client.analytics.get_public()

# User analytics
my_analytics = client.analytics.get_me()

# Revenue analytics (merchant)
revenue = client.analytics.get_revenue('2025-11-01', '2025-11-07')
```

## Error Handling

```python
from agentgatepay_sdk import (
    AgentGatePay,
    RateLimitError,
    AuthenticationError,
    InvalidTransactionError,
    MandateError
)

try:
    payment = client.payments.submit_tx_hash(...)
except RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after} seconds")
except AuthenticationError as e:
    print("Invalid or missing API key")
except InvalidTransactionError as e:
    print(f"Transaction error: {e.reason}")
except MandateError as e:
    print(f"Mandate error: {e.reason}")
```

## Examples

See the [examples](./examples) directory:
- `quickstart_agent.py` - Agent integration (5 minutes)
- `quickstart_merchant.py` - Merchant integration (5 minutes)

## Configuration

### Environment Variables

```bash
# API key
export AGENTPAY_API_KEY=pk_live_...

# Agent ID
export AGENTPAY_AGENT_ID=my-agent

# API URL (optional)
export AGENTPAY_API_URL=https://api.agentgatepay.io
```

### Client Options

```python
client = AgentGatePay(
    api_key='pk_live_...',  # API key (optional)
    agent_id='my-agent',    # Agent ID (optional)
    api_url='https://...',  # API URL (optional)
    timeout=30,             # Request timeout in seconds
    debug=True              # Enable debug logging
)
```

## Rate Limits & Security (AIF)

**AIF (Agent Interaction Firewall)** - The first firewall built specifically for AI agents.

### Rate Limits

| User Type | Rate Limit | Benefits |
|-----------|------------|----------|
| **Anonymous** | 20 req/min | Basic access, no signup |
| **With Account** | 100 req/min | **5x more requests**, payment history, reputation tracking |

**Create a free account to increase your limits:**
```python
user = client.auth.signup(
    email='agent@example.com',
    password='secure_password',
    user_type='agent'  # or 'merchant' or 'both'
)
print(user['apiKey'])  # Use this for 5x rate limit!
```

### Security Features

- ✅ **Distributed rate limiting** (DynamoDB atomic counters)
- ✅ **Replay protection** (TX-hash nonces, 24h TTL)
- ✅ **Agent reputation system** (0-200 score, enabled by default)
- ✅ **Mandatory mandates** (budget & scope enforcement)

## Support

- **Documentation:** https://docs.agentgatepay.io
- **SDK Repository:** https://github.com/AgentGatePay/agentgatepay-sdks
- **Issues:** https://github.com/AgentGatePay/agentgatepay-sdks/issues
- **Email:** support@agentgatepay.io

## License

MIT License - see [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

**Built with ❤️ for the agent economy**
