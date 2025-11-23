"""
AgentGatePay ConfigLoader - Configuration and Mandate Lifecycle Management

Simplifies integration by:
- Loading public configuration from JSON file
- Reading secrets from environment variables (NEVER from JSON)
- Auto-creating mandates on first use
- Auto-renewing mandates when budget exhausted or expired

Security: API keys and wallet private keys MUST be in environment variables,
NOT in JSON configuration files.
"""

import os
import json
from typing import Dict, Optional, Any
from datetime import datetime
from pathlib import Path


class ConfigLoader:
    """
    ConfigLoader - Manages AgentGatePay configuration and mandate lifecycle

    SECURITY MODEL:
    - Public config (agentId, budget, etc.) → JSON file (can be committed to Git)
    - Secrets (API key, wallet private key) → Environment variables ONLY

    USAGE:

    1. Create agentpay.config.json:
       {
         "agentId": "my-agent@example.com",
         "mandate": { "budgetUsd": 100, "ttlMinutes": 10080 }
       }

    2. Set environment variables:
       export AGENTPAY_API_KEY=pk_live_...
       export AGENTPAY_WALLET_PRIVATE_KEY=0x...

    3. Use ConfigLoader:
       config_loader = ConfigLoader('./agentpay.config.json')
       client = AgentGatePay(api_key=config_loader.get_api_key())
       mandate_token = await config_loader.ensure_mandate_valid(client)
    """

    def __init__(self, config_path: str):
        """
        Create ConfigLoader instance

        Args:
            config_path: Path to agentpay.config.json (public configuration)

        Raises:
            ValueError: If config file not found or secrets not in environment
        """
        # Load public configuration from JSON file
        config_file = Path(config_path)
        if not config_file.exists():
            raise ValueError(f"Configuration file not found: {config_path}")

        with open(config_file, 'r') as f:
            self.config: Dict[str, Any] = json.load(f)

        # Validate public configuration
        if 'agentId' not in self.config:
            raise ValueError('agentId is required in configuration file')

        if 'mandate' not in self.config or 'budgetUsd' not in self.config['mandate']:
            raise ValueError('mandate.budgetUsd is required in configuration file')

        if not isinstance(self.config['mandate']['budgetUsd'], (int, float)) or \
           self.config['mandate']['budgetUsd'] <= 0:
            raise ValueError('mandate.budgetUsd must be a positive number')

        # Load secrets from ENVIRONMENT VARIABLES (NEVER from JSON!)
        self.api_key = os.getenv('AGENTPAY_API_KEY', '')
        self.wallet_private_key = os.getenv('AGENTPAY_WALLET_PRIVATE_KEY', '')

        # Validate secrets exist
        if not self.api_key:
            raise ValueError(
                'AGENTPAY_API_KEY not found in environment variables. '
                'Set it with: export AGENTPAY_API_KEY=pk_live_...'
            )

        if not self.wallet_private_key:
            raise ValueError(
                'AGENTPAY_WALLET_PRIVATE_KEY not found in environment variables. '
                'Set it with: export AGENTPAY_WALLET_PRIVATE_KEY=0x...'
            )

        # Validate API key format
        if not self.api_key.startswith('pk_live_') and not self.api_key.startswith('pk_test_'):
            raise ValueError(
                'Invalid AGENTPAY_API_KEY format. Expected: pk_live_... or pk_test_...'
            )

        # Validate wallet private key format
        if not self.wallet_private_key.startswith('0x') or len(self.wallet_private_key) != 66:
            raise ValueError(
                'Invalid AGENTPAY_WALLET_PRIVATE_KEY format. '
                'Expected: 0x followed by 64 hex characters'
            )

        # Mandate cache
        self._cached_mandate_token: Optional[str] = None
        self._mandate_expires_at: Optional[int] = None

    def get_api_key(self) -> str:
        """
        Get AgentGatePay API key (from environment variable)
        This is the backend authentication credential (format: pk_live_...)
        """
        return self.api_key

    def get_wallet_private_key(self) -> str:
        """
        Get wallet private key (from environment variable)
        This is used for signing blockchain transactions
        """
        return self.wallet_private_key

    def get_agent_id(self) -> str:
        """Get agent identifier (from config file)"""
        return self.config['agentId']

    def get_mandate_config(self) -> Dict[str, Any]:
        """Get mandate configuration settings (from config file)"""
        return {
            'subject': self.config['agentId'],
            'budget_usd': self.config['mandate']['budgetUsd'],
            'ttl_minutes': self.config['mandate'].get('ttlMinutes', 10080),  # Default: 7 days
            'scope': self.config['mandate'].get('scope', '*')  # Default: all resources
        }

    async def ensure_mandate_valid(self, client: Any) -> str:
        """
        Ensure a valid mandate token exists

        This method:
        1. Checks if cached mandate is still valid (not expired, budget > 0)
        2. If valid, returns cached mandate token
        3. If invalid/missing, creates NEW mandate and returns token

        This enables "set and forget" mandate management - just call this
        method before each payment and it handles everything automatically.

        Args:
            client: AgentGatePay client instance

        Returns:
            Valid mandate token (JWT format)

        Example:
            config_loader = ConfigLoader('./agentpay.config.json')
            client = AgentGatePay(api_key=config_loader.get_api_key())

            # First call: Creates new mandate
            mandate_token = await config_loader.ensure_mandate_valid(client)

            # Subsequent calls: Reuses existing mandate (until budget exhausted)
            mandate_token2 = await config_loader.ensure_mandate_valid(client)
        """
        # Check if cached mandate exists and is not expired
        if self._cached_mandate_token and self._mandate_expires_at:
            current_time_ms = int(datetime.now().timestamp() * 1000)

            if self._mandate_expires_at > current_time_ms:
                try:
                    # Verify mandate is still valid (checks signature + budget)
                    verification = await client.mandates.verify(self._cached_mandate_token)

                    if verification.get('valid'):
                        budget_remaining = float(verification['payload']['budget_remaining'])

                        # Check if budget is sufficient (> $0.01 threshold)
                        if budget_remaining > 0.01:
                            print(f"✓ Reusing existing mandate (budget remaining: ${budget_remaining:.2f})")
                            return self._cached_mandate_token
                        else:
                            print(f"⚠ Mandate budget exhausted (${budget_remaining:.2f} remaining), creating new mandate...")
                except Exception as e:
                    print(f"⚠ Cached mandate verification failed, creating new mandate...")
            else:
                print(f"⚠ Cached mandate expired, creating new mandate...")

        # Create new mandate
        mandate_config = self.get_mandate_config()
        print(f"→ Creating new mandate (budget: ${mandate_config['budget_usd']}, TTL: {mandate_config['ttl_minutes']} minutes)...")

        mandate = await client.mandates.issue(
            mandate_config['subject'],
            mandate_config['budget_usd'],
            mandate_config['scope'],
            mandate_config['ttl_minutes']
        )

        # Cache mandate token and expiration
        self._cached_mandate_token = mandate['mandateToken']
        self._mandate_expires_at = mandate['expiresAt'] * 1000  # Convert to milliseconds

        expires_date = datetime.fromtimestamp(mandate['expiresAt'])
        print(f"✓ Mandate created successfully (expires: {expires_date.isoformat()})")

        return self._cached_mandate_token

    def get_preferred_chain(self) -> str:
        """
        Get preferred blockchain chain (from config file)
        Returns 'base' if not specified
        """
        return self.config.get('chains', {}).get('preferred', 'base')

    def get_fallback_chains(self) -> list:
        """
        Get fallback blockchain chains (from config file)
        Returns ['ethereum', 'polygon', 'arbitrum'] if not specified
        """
        return self.config.get('chains', {}).get('fallback', ['ethereum', 'polygon', 'arbitrum'])

    def get_preferred_token(self) -> str:
        """
        Get preferred token (from config file)
        Returns 'USDC' if not specified
        """
        return self.config.get('tokens', {}).get('preferred', 'USDC')
