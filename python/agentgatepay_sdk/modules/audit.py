"""Audit module - audit log retrieval and statistics"""

from typing import TYPE_CHECKING, Optional, List, Dict, Any

if TYPE_CHECKING:
    from ..http_client import HttpClient


class AuditModule:
    """Handles audit log retrieval and statistics"""

    def __init__(self, http: "HttpClient"):
        self._http = http

    def list(
        self,
        limit: Optional[int] = None,
        event_type: Optional[str] = None,
        client_id: Optional[str] = None,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None,
        last_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List audit logs with filtering and pagination
        Requires API key authentication

        Args:
            limit: Number of results (default 50, max 100)
            event_type: Filter by event type
            client_id: Filter by client/agent ID (email or wallet address)
            start_time: Unix timestamp for start range
            end_time: Unix timestamp for end range
            last_key: Pagination token from previous response

        Returns:
            Paginated audit logs with last_key for next page
        """
        params = {}

        if limit is not None:
            params["limit"] = limit
        if event_type:
            params["event_type"] = event_type
        if client_id:
            params["client_id"] = client_id
        if start_time is not None:
            params["start_time"] = start_time
        if end_time is not None:
            params["end_time"] = end_time
        if last_key:
            params["last_key"] = last_key

        return self._http.get("/audit/logs", params if params else None)

    def get_stats(
        self, start_time: Optional[int] = None, end_time: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get audit statistics
        Requires API key authentication

        Args:
            start_time: Optional start time (Unix timestamp)
            end_time: Optional end time (Unix timestamp)

        Returns:
            Audit statistics including event counts by type
        """
        params = {}

        if start_time is not None:
            params["start_time"] = start_time
        if end_time is not None:
            params["end_time"] = end_time

        return self._http.get("/audit/stats", params if params else None)

    def get_by_id(self, log_id: str) -> Dict[str, Any]:
        """
        Get a specific audit log by ID
        Requires API key authentication

        Args:
            log_id: Audit log ID

        Returns:
            Audit log details
        """
        return self._http.get(f"/audit/logs/{log_id}")

    def get_by_transaction(self, tx_hash: str) -> List[Dict[str, Any]]:
        """
        Get audit logs for a specific blockchain transaction
        Requires API key authentication

        Args:
            tx_hash: Blockchain transaction hash

        Returns:
            Array of audit logs
        """
        result = self._http.get(f"/audit/logs/transaction/{tx_hash}")
        return result.get("logs", [])

    def get_by_agent(self, agent_id: str) -> List[Dict[str, Any]]:
        """
        Get audit logs for a specific agent
        Requires API key authentication

        Args:
            agent_id: Agent ID or email

        Returns:
            Array of audit logs
        """
        result = self._http.get(f"/audit/logs/agent/{agent_id}")
        return result.get("logs", [])
