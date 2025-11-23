"""Analytics module"""

from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from ..http_client import HttpClient


class AnalyticsModule:
    """Handles platform analytics and revenue tracking"""

    def __init__(self, http: "HttpClient"):
        self._http = http

    def get_public(self) -> dict:
        """Get public platform analytics (no authentication required)"""
        return self._http.get("/v1/analytics/public")

    def get_me(self) -> dict:
        """Get user-specific analytics (requires API key)"""
        return self._http.get("/v1/analytics/me")

    def get_revenue(
        self, start_date: Optional[str] = None, end_date: Optional[str] = None
    ) -> dict:
        """
        Get merchant revenue analytics (requires API key)

        Args:
            start_date: Optional start date (YYYY-MM-DD)
            end_date: Optional end date (YYYY-MM-DD)

        Returns:
            Detailed revenue breakdown
        """
        params = {}
        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date

        return self._http.get("/v1/merchant/revenue", params if params else None)
