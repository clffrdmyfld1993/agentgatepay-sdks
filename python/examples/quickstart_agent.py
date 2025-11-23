"""
AgentGatePay Python SDK - Agent Quickstart Example

Time to first payment: ~5 minutes
"""

import os
from agentgatepay_sdk import AgentGatePay

def main():
    # Initialize client
    client = AgentGatePay(
        api_key=os.getenv("AGENTPAY_API_KEY"),  # Optional
        agent_id="my-ai-agent",
        debug=True
    )

    print("=== AgentGatePay Agent Quickstart ===\n")

    # Step 1: Issue a mandate
    print("Step 1: Issuing mandate...")
    mandate = client.mandates.issue(
        subject="my-ai-agent@example.com",
        budget=100,  # $100 USD
        scope="*",
        ttl_minutes=1440  # 24 hours
    )

    print("Mandate issued!")
    print(f"  Token: {mandate['mandateToken'][:50]}...")
    print(f"  Expires: {mandate['expiresAt']}\n")

    # Step 2: Submit payment with existing transaction
    print("Step 2: Submitting payment...")
    payment = client.payments.submit_tx_hash(
        mandate=mandate["mandateToken"],
        tx_hash="0x1234567890abcdef..."  # Your blockchain transaction hash
    )

    print("Payment submitted!")
    print(f"  Status: {payment.get('status')}")
    print(f"  Amount: ${payment.get('amountUsd')}")
    print(f"  Budget remaining: ${payment.get('budgetRemaining')}\n")

    print("✓ Complete! Your AI agent can now make payments.\n")


if __name__ == "__main__":
    main()
