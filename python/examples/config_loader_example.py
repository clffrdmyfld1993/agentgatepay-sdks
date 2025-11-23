"""
ConfigLoader Example - Automatic Mandate Management

This example demonstrates how to use ConfigLoader for simplified integration:
1. Load configuration from JSON file (public settings)
2. Load secrets from environment variables (never from JSON!)
3. Auto-create mandate on first use
4. Auto-renew mandate when budget exhausted

Setup:
1. Copy agentpay.config.json.example to agentpay.config.json
2. Copy .env.example to .env
3. Fill in your API key and wallet private key in .env
4. Run: pip install python-dotenv && python config_loader_example.py
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from agentgatepay_sdk import AgentGatePay
from agentgatepay_sdk.config_loader import ConfigLoader


async def main():
    print('=== ConfigLoader Example ===\n')

    # STEP 1: Load configuration
    print('→ Loading configuration...')
    config_loader = ConfigLoader('./examples/agentpay.config.json')
    print(f"✓ Configuration loaded for agent: {config_loader.get_agent_id()}\n")

    # STEP 2: Initialize AgentGatePay client
    print('→ Initializing AgentGatePay client...')
    client = AgentGatePay(
        api_key=config_loader.get_api_key(),
        agent_id=config_loader.get_agent_id()
    )
    print('✓ Client initialized\n')

    # STEP 3: Ensure mandate is valid (auto-creates if needed)
    print('→ Ensuring mandate is valid...')
    mandate_token = await config_loader.ensure_mandate_valid(client)
    print(f"✓ Mandate token obtained: {mandate_token[:50]}...\n")

    # STEP 4: Verify mandate
    print('→ Verifying mandate...')
    verification = await client.mandates.verify(mandate_token)
    print('✓ Mandate verified:')
    print(f"  - Subject: {verification['payload']['sub']}")
    print(f"  - Budget Total: ${verification['payload']['budget_usd']}")
    print(f"  - Budget Remaining: ${verification['payload']['budget_remaining']}")

    from datetime import datetime
    expires_date = datetime.fromtimestamp(verification['payload']['exp'])
    print(f"  - Expires: {expires_date.isoformat()}\n")

    # STEP 5: Make payment (example - requires real merchant)
    # Uncomment when you have a real merchant to pay
    """
    print('→ Making payment...')
    payment = await client.payments.submit_tx_hash(
        mandate_token,
        '0xYOUR_BLOCKCHAIN_TX_HASH',
        'base',
        'USDC'
    )
    print('✓ Payment successful:')
    print(f"  - Status: {payment['status']}")
    print(f"  - Amount: ${payment['amountUsd']}")
    print(f"  - Budget Remaining: ${payment['budgetRemaining']}\n")
    """

    # STEP 6: Demonstrate auto-renewal
    print('→ ConfigLoader will auto-renew mandate when:')
    print('  1. Budget exhausted (< $0.01 remaining)')
    print('  2. Mandate expired')
    print('  3. Next call to ensure_mandate_valid() will create new mandate\n')

    print('=== Example Complete ===')
    print('\nKey Takeaways:')
    print('✓ Configuration in JSON file (safe to commit)')
    print('✓ Secrets in environment variables (never committed)')
    print('✓ Mandate auto-created on first use')
    print('✓ Mandate auto-renewed when needed')
    print('✓ No manual mandate management required!')


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except Exception as error:
        print(f'Error: {error}')
        sys.exit(1)
