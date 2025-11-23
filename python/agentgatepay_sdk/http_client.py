"""HTTP Client for AgentGatePay SDK"""

from typing import Dict, Any, Optional
import requests
from .exceptions import (
    AgentGatePayError,
    RateLimitError,
    AuthenticationError,
    InvalidTransactionError,
)


class HttpClient:
    """HTTP client wrapper with error handling and rate limit awareness"""

    def __init__(
        self,
        base_url: str,
        timeout: int = 30,
        headers: Optional[Dict[str, str]] = None,
        debug: bool = False,
    ):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.debug = debug
        self.session = requests.Session()

        if headers:
            self.session.headers.update(headers)

        self.session.headers.update({"Content-Type": "application/json"})

    def _log(self, message: str) -> None:
        """Log debug messages if debug mode is enabled"""
        if self.debug:
            print(f"[AgentGatePay SDK] {message}")

    def _handle_error(self, response: requests.Response) -> None:
        """Handle HTTP errors and raise appropriate exceptions"""
        status_code = response.status_code

        try:
            error_data = response.json()
            error_message = error_data.get("error", response.text)
        except Exception:
            error_message = response.text or f"HTTP {status_code} error"

        # Rate limit error (429)
        if status_code == 429:
            retry_after = int(response.headers.get("retry-after", 60))
            limit = int(response.headers.get("x-ratelimit-limit", 0))
            remaining = int(response.headers.get("x-ratelimit-remaining", 0))

            raise RateLimitError(
                error_message or "Rate limit exceeded",
                retry_after,
                limit,
                remaining,
            )

        # Authentication error (401)
        if status_code == 401:
            raise AuthenticationError(
                error_message or "Authentication failed - invalid or missing API key"
            )

        # Invalid transaction error (400)
        if status_code == 400 and "transaction" in error_message.lower():
            reason = error_data.get("reason", "Unknown reason")
            raise InvalidTransactionError(error_message, reason)

        # Generic error
        raise AgentGatePayError(
            error_message or "An error occurred",
            "API_ERROR",
            status_code,
            error_data if isinstance(error_data, dict) else {},
        )

    def get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Send GET request"""
        url = f"{self.base_url}{path}"
        self._log(f"GET {url}")

        try:
            response = self.session.get(url, params=params, timeout=self.timeout)

            if self.debug:
                self._log(f"Response {response.status_code}: {response.text[:200]}")

            if response.status_code >= 400:
                self._handle_error(response)

            return response.json()

        except requests.exceptions.RequestException as e:
            raise AgentGatePayError(
                f"Network error: {str(e)}",
                "NETWORK_ERROR",
                details={"original_error": str(e)},
            )

    def post(
        self, path: str, data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send POST request"""
        url = f"{self.base_url}{path}"
        self._log(f"POST {url}")

        try:
            response = self.session.post(url, json=data, timeout=self.timeout)

            if self.debug:
                self._log(f"Response {response.status_code}: {response.text[:200]}")

            if response.status_code >= 400:
                self._handle_error(response)

            return response.json()

        except requests.exceptions.RequestException as e:
            raise AgentGatePayError(
                f"Network error: {str(e)}",
                "NETWORK_ERROR",
                details={"original_error": str(e)},
            )

    def put(
        self, path: str, data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send PUT request"""
        url = f"{self.base_url}{path}"
        self._log(f"PUT {url}")

        try:
            response = self.session.put(url, json=data, timeout=self.timeout)

            if response.status_code >= 400:
                self._handle_error(response)

            return response.json()

        except requests.exceptions.RequestException as e:
            raise AgentGatePayError(
                f"Network error: {str(e)}", "NETWORK_ERROR"
            )

    def delete(self, path: str) -> Dict[str, Any]:
        """Send DELETE request"""
        url = f"{self.base_url}{path}"
        self._log(f"DELETE {url}")

        try:
            response = self.session.delete(url, timeout=self.timeout)

            if response.status_code >= 400:
                self._handle_error(response)

            return response.json()

        except requests.exceptions.RequestException as e:
            raise AgentGatePayError(
                f"Network error: {str(e)}", "NETWORK_ERROR"
            )

    def set_header(self, key: str, value: str) -> None:
        """Set a header for all requests"""
        self.session.headers[key] = value

    def remove_header(self, key: str) -> None:
        """Remove a header"""
        self.session.headers.pop(key, None)
