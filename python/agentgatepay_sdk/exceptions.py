"""Custom exceptions for AgentGatePay SDK"""

from typing import Optional, Dict, Any


class AgentGatePayError(Exception):
    """Base exception for AgentGatePay SDK"""

    def __init__(
        self,
        message: str,
        code: str = "UNKNOWN_ERROR",
        status_code: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class RateLimitError(AgentGatePayError):
    """Raised when rate limit is exceeded"""

    def __init__(
        self,
        message: str,
        retry_after: int,
        limit: int,
        remaining: int,
    ):
        super().__init__(message, "RATE_LIMIT_EXCEEDED", 429)
        self.retry_after = retry_after
        self.limit = limit
        self.remaining = remaining


class AuthenticationError(AgentGatePayError):
    """Raised when authentication fails"""

    def __init__(self, message: str):
        super().__init__(message, "AUTHENTICATION_FAILED", 401)


class InvalidTransactionError(AgentGatePayError):
    """Raised when blockchain transaction is invalid"""

    def __init__(self, message: str, reason: str):
        super().__init__(message, "INVALID_TRANSACTION", 400)
        self.reason = reason


class MandateError(AgentGatePayError):
    """Raised when mandate operation fails"""

    def __init__(self, message: str, reason: str):
        super().__init__(message, "MANDATE_ERROR", 400)
        self.reason = reason
