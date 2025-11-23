"""Payments module - x402 payment operations"""

from typing import TYPE_CHECKING, Optional, Literal

if TYPE_CHECKING:
    from ..http_client import HttpClient

Chain = Literal["ethereum", "base", "polygon", "arbitrum"]
Token = Literal["USDC", "USDT", "DAI"]


class PaymentsModule:
    """Handles x402 payment submission and verification"""

    def __init__(self, http: "HttpClient"):
        self._http = http

    def submit_tx_hash(
        self,
        mandate: str,
        tx_hash: str,
        tx_hash_commission: Optional[str] = None,
        chain: Chain = "base",
        token: Token = "USDC",
        price_usd: Optional[float] = None,
    ) -> dict:
        """
        Submit a payment using an existing blockchain transaction

        Supports two-transaction model:
        - tx_hash: Primary payment transaction
        - tx_hash_commission: Optional commission transaction (if gateway requires commission split)

        Args:
            mandate: AP2 mandate token
            tx_hash: Primary transaction hash (0x...)
            tx_hash_commission: Optional commission transaction hash (0x...)
            chain: Blockchain network (default: 'base')
            token: Token symbol (default: 'USDC')
            price_usd: Optional explicit price in USD (defaults to endpoint price)

        Returns:
            Payment result with resource access
        """
        import json

        # Build payment payload
        payment_payload = {
            "scheme": "eip3009",
            "tx_hash": tx_hash
        }

        # Add commission tx if provided
        if tx_hash_commission:
            payment_payload["tx_hash_commission"] = tx_hash_commission

        headers = {
            "x-mandate": mandate,
            "x-payment": json.dumps(payment_payload),
        }

        # Build URL with query params
        url = f"/x402/resource?chain={chain}&token={token}"
        if price_usd is not None:
            url += f"&price_usd={price_usd}"

        # Make request with custom headers
        response = self._http.session.get(
            f"{self._http.base_url}{url}",
            headers={**self._http.session.headers, **headers},
            timeout=self._http.timeout,
        )

        if response.status_code >= 400:
            self._http._handle_error(response)

        return response.json()

    def verify(self, tx_hash: str) -> dict:
        """
        Verify a payment by transaction hash (Merchant use case)

        Args:
            tx_hash: Blockchain transaction hash

        Returns:
            Payment verification details
        """
        return self._http.get(f"/v1/payments/verify/{tx_hash}")

    def get_status(self, tx_hash: str) -> dict:
        """
        Get payment status by transaction hash

        Args:
            tx_hash: Blockchain transaction hash

        Returns:
            Payment status
        """
        return self._http.get(f"/v1/payments/status/{tx_hash}")

    def list_payments(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list:
        """
        List payment history for merchant wallet

        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            limit: Maximum number of results
            offset: Pagination offset

        Returns:
            Array of payments
        """
        params = {"limit": limit, "offset": offset}

        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date

        result = self._http.get("/v1/payments/list", params)
        return result.get("payments", [])
