"""
AgentGatePay Python SDK
Official Python SDK for AgentGatePay - Payment gateway for AI agents
"""

from .client import AgentGatePay
from .exceptions import (
    AgentGatePayError,
    RateLimitError,
    AuthenticationError,
    InvalidTransactionError,
    MandateError,
)

__version__ = "1.1.6"
__all__ = [
    "AgentGatePay",
    "AgentGatePayError",
    "RateLimitError",
    "AuthenticationError",
    "InvalidTransactionError",
    "MandateError",
]
