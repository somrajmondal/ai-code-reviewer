
import time
from collections import defaultdict, deque
from functools import wraps
from flask import request, jsonify


class RateLimiter:
    def __init__(self, max_calls: int, window_seconds: int):
        self.max_calls = max_calls
        self.window    = window_seconds
        self._store: dict[str, deque] = defaultdict(deque)

    def is_allowed(self, key: str) -> tuple[bool, int]:
        """Returns (allowed, retry_after_seconds)."""
        now    = time.time()
        window = self._store[key]

        # Evict expired timestamps
        while window and window[0] < now - self.window:
            window.popleft()

        if len(window) >= self.max_calls:
            retry_after = int(self.window - (now - window[0])) + 1
            return False, retry_after

        window.append(now)
        return True, 0


# Global limiters
review_limiter = RateLimiter(max_calls=10, window_seconds=60)   # 10/min per IP
global_limiter = RateLimiter(max_calls=100, window_seconds=60)  # 100/min total


def rate_limit(limiter: RateLimiter = None):
    """Decorator that applies rate limiting by client IP."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            ip = request.headers.get("X-Forwarded-For", request.remote_addr or "unknown").split(",")[0].strip()

            # Per-IP limit
            lim = limiter or review_limiter
            allowed, retry = lim.is_allowed(ip)
            if not allowed:
                return jsonify({
                    "error": f"Rate limit exceeded. Try again in {retry} seconds.",
                    "retry_after": retry,
                }), 429

            # Global limit
            g_allowed, g_retry = global_limiter.is_allowed("__global__")
            if not g_allowed:
                return jsonify({
                    "error": "Service under high load. Try again shortly.",
                    "retry_after": g_retry,
                }), 429

            return f(*args, **kwargs)
        return wrapper
    return decorator
