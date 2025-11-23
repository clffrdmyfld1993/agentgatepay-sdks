"""
MCP (Model Context Protocol) Module
Direct access to AgentGatePay MCP endpoints using JSON-RPC 2.0 format
"""

from typing import TYPE_CHECKING, Optional, Dict, Any, Literal
import time

if TYPE_CHECKING:
    from ..http_client import HttpClient

Chain = Literal["ethereum", "base", "polygon", "arbitrum"]
Token = Literal["USDC", "USDT", "DAI"]


class MCPModule:
    """Handles MCP (Model Context Protocol) operations using JSON-RPC 2.0"""

    def __init__(self, http: "HttpClient"):
        self._http = http

    def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """
        Call an MCP tool using JSON-RPC 2.0 format

        Args:
            tool_name: MCP tool name
            arguments: Tool arguments

        Returns:
            Tool execution result
        """
        request = {
            "jsonrpc": "2.0",
            "id": int(time.time() * 1000),
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }

        response = self._http.post("/mcp", request)

        if not response or "content" not in response or not response["content"]:
            raise ValueError("Invalid MCP response format")

        # Parse JSON from text content
        result_text = response["content"][0]["text"]
        import json
        try:
            return json.loads(result_text)
        except json.JSONDecodeError:
            return {"raw": result_text}

    def submit_payment(
        self,
        mandate_token: str,
        tx_hash: str,
        tx_hash_commission: Optional[str] = None,
        chain: Chain = "base",
        token: Token = "USDC",
        price_usd: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Submit payment using MCP endpoint

        Supports two-transaction model:
        - tx_hash: Primary payment transaction
        - tx_hash_commission: Optional commission transaction (if gateway requires commission split)

        Args:
            mandate_token: AP2 mandate token
            tx_hash: Primary transaction hash
            tx_hash_commission: Optional commission transaction hash
            chain: Blockchain network
            token: Token symbol
            price_usd: Optional explicit price in USD

        Returns:
            Payment result
        """
        args = {
            "mandate_token": mandate_token,
            "tx_hash": tx_hash,
            "chain": chain,
            "token": token,
        }

        if tx_hash_commission:
            args["tx_hash_commission"] = tx_hash_commission

        if price_usd is not None:
            args["price_usd"] = str(price_usd)

        return self.call_tool("agentpay_submit_payment", args)

    def create_payment(
        self,
        resource_path: str,
        amount_usd: float,
        chain: Chain = "base",
        token: Token = "USDC",
    ) -> Dict[str, Any]:
        """
        Create payment requirements using MCP endpoint

        Args:
            resource_path: Resource path
            amount_usd: Amount in USD
            chain: Blockchain network
            token: Token symbol

        Returns:
            Payment requirements
        """
        return self.call_tool("agentpay_create_payment", {
            "resource_path": resource_path,
            "amount_usd": amount_usd,
            "chain": chain,
            "token": token
        })

    def issue_mandate(
        self,
        subject: str,
        budget_usd: float,
        scope: str = "*",
        ttl_minutes: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Issue mandate using MCP endpoint

        Args:
            subject: Mandate subject
            budget_usd: Budget in USD
            scope: Optional scope
            ttl_minutes: Optional TTL in minutes

        Returns:
            Mandate token
        """
        args = {
            "subject": subject,
            "budget_usd": budget_usd,
            "scope": scope,
        }

        if ttl_minutes is not None:
            args["ttl_minutes"] = ttl_minutes

        return self.call_tool("agentpay_issue_mandate", args)

    def verify_mandate(self, mandate_token: str) -> Dict[str, Any]:
        """
        Verify mandate using MCP endpoint

        Args:
            mandate_token: Mandate token to verify

        Returns:
            Verification result
        """
        return self.call_tool("agentpay_verify_mandate", {
            "mandate_token": mandate_token
        })

    def list_tools(self) -> Dict[str, Any]:
        """
        List available MCP tools

        Returns:
            Array of available tools
        """
        request = {
            "jsonrpc": "2.0",
            "id": int(time.time() * 1000),
            "method": "tools/list",
            "params": {}
        }

        return self._http.post("/mcp", request)
