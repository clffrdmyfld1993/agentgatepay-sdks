"""
AgentGatePay Python SDK - Merchant Quickstart Example

Time to integration: ~5 minutes
"""

import os
from agentgatepay_sdk import AgentGatePay

def main():
    # Initialize client (API key required for merchant features)
    client = AgentGatePay(
        api_key=os.getenv("AGENTPAY_API_KEY"),
        agent_id="my-merchant",
        debug=True
    )

    print("=== AgentGatePay Merchant Quickstart ===\n")

    # Step 1: Verify a payment
    print("Step 1: Verifying payment...")
    verification = client.payments.verify("0x1234567890abcdef...")

    print("Payment verified!")
    print(f"  Valid: {verification.get('isValid')}")
    print(f"  Amount: ${verification.get('amountUsd')}")
    print(f"  From: {verification.get('sender')}")
    print(f"  Token: {verification.get('token')} on {verification.get('chain')}\n")

    # Step 2: Configure webhook
    print("Step 2: Configuring webhook...")
    webhook = client.webhooks.create(
        url="https://myserver.com/agentpay-webhook",
        events=["payment.completed", "payment.failed"],
        secret="my-webhook-secret-123"
    )

    print("Webhook configured!")
    print(f"  ID: {webhook['webhookId']}")
    print(f"  URL: {webhook['url']}")
    print(f"  Events: {', '.join(webhook['events'])}\n")

    # Step 3: Get revenue analytics
    print("Step 3: Getting revenue analytics...")
    revenue = client.analytics.get_revenue(
        start_date="2025-11-01",
        end_date="2025-11-07"
    )

    print("Revenue analytics:")
    print(f"  Total revenue: ${revenue['totalRevenueUsd']}")
    print(f"  Transactions: {revenue['transactionCount']}")
    print(f"  Average: ${revenue['averageTransactionUsd']}\n")

    print("✓ Complete! You can now accept payments from AI agents.\n")


if __name__ == "__main__":
    main()
