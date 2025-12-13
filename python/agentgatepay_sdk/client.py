"""Main AgentGatePay client"""

from typing import Optional
from .http_client import HttpClient
from .modules.auth import AuthModule
from .modules.mandates import MandatesModule
from .modules.payments import PaymentsModule
from .modules.webhooks import WebhooksModule
from .modules.analytics import AnalyticsModule
from .modules.audit import AuditModule
from .modules.mcp import MCPModule


class AgentGatePay:
    """
    AgentGatePay Client

    Main entry point for the AgentGatePay SDK

    Example:
        >>> from agentgatepay_sdk import AgentGatePay
        >>>
        >>> client = AgentGatePay(api_key='pk_live_...', agent_id='my-agent')
        >>>
        >>> # Issue mandate
        >>> mandate = client.mandates.issue('agent@example.com', 100)
        >>>
        >>> # Submit payment
        >>> payment = client.payments.submit_tx_hash(mandate['mandate_token'], '0x...')
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        agent_id: str = "sdk-client",
        api_url: Optional[str] = None,
        timeout: int = 30,
        debug: bool = False,
    ):
        """
        Initialize AgentGatePay client

        Args:
            api_key: API key for authentication (optional but recommended)
            agent_id: Agent identifier for tracking (default: 'sdk-client')
            api_url: Base API URL (required - specify your AgentGatePay endpoint)
            timeout: Request timeout in seconds (default: 30)
            debug: Enable debug logging (default: False)

        Raises:
            ValueError: If api_url is not provided

        Example:
            >>> client = AgentGatePay(
            ...     api_url='https://your-api.execute-api.region.amazonaws.com',
            ...     api_key='pk_live_...'
            ... )
        """
        import os

        # Get API URL from parameter or environment variable
        final_api_url = api_url or os.getenv('AGENTPAY_API_URL')

        if not final_api_url:
            raise ValueError(
                'API URL is required. Provide it via api_url parameter or environment variable AGENTPAY_API_URL.\n'
                'Example: AgentGatePay(api_url="https://your-api.execute-api.region.amazonaws.com", api_key="...")'
            )

        # Build headers
        headers = {"x-agent-id": agent_id}

        if api_key:
            headers["x-api-key"] = api_key

        # Initialize HTTP client
        self._http = HttpClient(
            base_url=final_api_url,
            timeout=timeout,
            headers=headers,
            debug=debug,
        )

        # Initialize modules
        self.auth = AuthModule(self._http)
        self.mandates = MandatesModule(self._http)
        self.payments = PaymentsModule(self._http)
        self.webhooks = WebhooksModule(self._http)
        self.analytics = AnalyticsModule(self._http)
        self.audit = AuditModule(self._http)
        self.mcp = MCPModule(self._http)

    def set_api_key(self, api_key: str) -> None:
        """
        Update API key (for setting key after signup)

        Args:
            api_key: New API key
        """
        self._http.set_header("x-api-key", api_key)

    def set_agent_id(self, agent_id: str) -> None:
        """
        Update agent ID

        Args:
            agent_id: New agent ID
        """
        self._http.set_header("x-agent-id", agent_id)

    def health(self) -> dict:
        """
        Health check

        Returns:
            System health status
        """
        return self._http.get("/health")

    @staticmethod
    def version() -> str:
        """Get SDK version"""
        return "1.1.6"
