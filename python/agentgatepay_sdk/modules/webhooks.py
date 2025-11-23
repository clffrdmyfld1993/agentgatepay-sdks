"""Webhooks module"""

import hmac
import hashlib
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from ..http_client import HttpClient


class WebhooksModule:
    """Handles webhook configuration and HMAC verification"""

    def __init__(self, http: "HttpClient"):
        self._http = http

    def create(
        self, url: str, events: List[str], secret: str = None
    ) -> dict:
        """Configure a new webhook for payment notifications"""
        data = {"url": url, "events": events}
        if secret:
            data["secret"] = secret

        return self._http.post("/v1/webhooks/configure", data)

    def list(self) -> list:
        """List all webhooks for current user"""
        result = self._http.get("/v1/webhooks/list")
        return result.get("webhooks", [])

    def test(self, webhook_id: str) -> dict:
        """Test webhook delivery"""
        return self._http.post("/v1/webhooks/test", {"webhookId": webhook_id})

    def delete(self, webhook_id: str) -> dict:
        """Delete a webhook"""
        return self._http.delete(f"/v1/webhooks/{webhook_id}")

    @staticmethod
    def verify_signature(payload: str, signature: str, secret: str) -> bool:
        """
        Verify webhook HMAC signature

        Args:
            payload: Raw webhook payload (request body as string)
            signature: Signature from x-agentpay-signature header
            secret: Your webhook secret

        Returns:
            True if signature is valid
        """
        expected_signature = hmac.new(
            secret.encode(), payload.encode(), hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(signature, expected_signature)
