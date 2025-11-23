"""Auth module"""

from typing import TYPE_CHECKING, Literal

if TYPE_CHECKING:
    from ..http_client import HttpClient

UserType = Literal["agent", "merchant", "both"]


class AuthModule:
    """Handles user authentication and API key management"""

    def __init__(self, http: "HttpClient"):
        self._http = http

    def signup(self, email: str, password: str, user_type: UserType) -> dict:
        """Register a new user account"""
        data = {"email": email, "password": password, "userType": user_type}
        return self._http.post("/v1/users/signup", data)

    def get_me(self) -> dict:
        """Get current user information (requires API key)"""
        return self._http.get("/v1/users/me")

    def add_wallet(self, chain: str, address: str) -> dict:
        """Add a wallet address to user account"""
        data = {"chain": chain, "address": address}
        return self._http.post("/v1/users/wallets/add", data)

    def create_api_key(self, name: str = None) -> dict:
        """Create a new API key"""
        data = {"name": name} if name else {}
        return self._http.post("/v1/api-keys/create", data)

    def list_api_keys(self) -> list:
        """List all API keys for current user"""
        result = self._http.get("/v1/api-keys/list")
        return result.get("keys", [])

    def revoke_api_key(self, key_id: str) -> dict:
        """Revoke an API key"""
        return self._http.post("/v1/api-keys/revoke", {"keyId": key_id})

    def configure_signing_service(
        self,
        signing_service_url: str,
        gateway_wallet_address: str,
        test_connection: bool = False,
    ) -> dict:
        """
        Configure signing service (Render/Railway deployment)

        Args:
            signing_service_url: HTTPS URL of your signing service
            gateway_wallet_address: Ethereum address of gateway wallet
            test_connection: Optional: test connectivity to signing service

        Returns:
            Configuration result
        """
        if not signing_service_url.startswith("https://"):
            raise ValueError("Signing service URL must use HTTPS")

        return self._http.post(
            "/v1/users/configure-signer",
            {
                "signing_service_url": signing_service_url,
                "gateway_wallet_address": gateway_wallet_address,
                "test_connection": test_connection,
            },
        )
