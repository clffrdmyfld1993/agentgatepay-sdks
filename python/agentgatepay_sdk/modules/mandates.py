"""Mandates module - AP2 mandate operations"""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..http_client import HttpClient


class MandatesModule:
    """Handles AP2 mandate issuance and verification"""

    def __init__(self, http: "HttpClient"):
        self._http = http

    def issue(
        self,
        subject: str,
        budget: float,
        scope: str = "*",
        ttl_minutes: int = 43200,
    ) -> dict:
        """
        Issue an AP2 mandate for delegated spending

        Args:
            subject: Subject identifier (e.g., agent email or ID)
            budget: Budget in USD
            scope: Scope (default: '*')
            ttl_minutes: Time to live in minutes (default: 30 days)

        Returns:
            Mandate token and metadata
        """
        data = {
            "subject": subject,
            "budget_usd": budget,
            "scope": scope,
            "ttl_minutes": ttl_minutes,
        }

        return self._http.post("/mandates/issue", data)

    def verify(self, mandate_token: str) -> dict:
        """
        Verify an AP2 mandate token

        Args:
            mandate_token: The AP2 mandate token to verify

        Returns:
            Verification result with payload if valid
        """
        data = {"mandate_token": mandate_token}

        return self._http.post("/mandates/verify", data)

    def check_budget(self, mandate_token: str) -> float:
        """
        Check remaining budget for a mandate

        Args:
            mandate_token: The AP2 mandate token

        Returns:
            Remaining budget in USD
        """
        result = self.verify(mandate_token)

        if not result.get("valid"):
            raise ValueError("Cannot check budget for invalid mandate")

        return float(result["payload"]["budget_remaining"])
