"""
In-memory review history store.
Keyed by session_id (stored in browser localStorage).
Max 20 reviews per session, 500 sessions total.
"""
import time
import uuid
from collections import OrderedDict


class HistoryStore:
    MAX_SESSIONS = 500
    MAX_PER_SESSION = 20

    def __init__(self):
        self._store: OrderedDict[str, list] = OrderedDict()

    def new_session(self) -> str:
        sid = str(uuid.uuid4())
        if len(self._store) >= self.MAX_SESSIONS:
            # Evict oldest session
            self._store.popitem(last=False)
        self._store[sid] = []
        return sid

    def session_exists(self, sid: str) -> bool:
        return sid in self._store

    def add_review(self, sid: str, entry: dict) -> str:
        if sid not in self._store:
            raise KeyError(f"Session {sid} not found")
        reviews = self._store[sid]
        if len(reviews) >= self.MAX_PER_SESSION:
            reviews.pop(0)
        rid = str(uuid.uuid4())[:8]
        reviews.append({
            "id":        rid,
            "timestamp": time.time(),
            "filename":  entry.get("filename", "untitled"),
            "language":  entry.get("language", "unknown"),
            "focus":     entry.get("focus", "all"),
            "score":     entry.get("score"),
            "verdict":   entry.get("verdict"),
            "code_len":  entry.get("code_len", 0),
            "result":    entry.get("result"),
        })
        return rid

    def get_history(self, sid: str) -> list:
        if sid not in self._store:
            return []
        return list(reversed(self._store[sid]))  # newest first

    def get_review(self, sid: str, rid: str) -> dict | None:
        for r in self._store.get(sid, []):
            if r["id"] == rid:
                return r
        return None

    def clear_session(self, sid: str):
        if sid in self._store:
            self._store[sid] = []


# Singleton
store = HistoryStore()
