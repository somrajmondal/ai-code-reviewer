
import pytest, sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app import app as flask_app
from utils.rate_limiter import RateLimiter
from utils.history_store import HistoryStore
from utils.prompts import build_user_prompt, FOCUS_DESCRIPTIONS


@pytest.fixture
def client():
    flask_app.config["TESTING"] = True
    with flask_app.test_client() as c:
        yield c


# ── Meta endpoints ─────────────────────────────────────────────────────────────

def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    data = r.get_json()
    assert data["status"] == "ok"
    assert "uptime" in data


def test_languages(client):
    r = client.get("/api/languages")
    assert r.status_code == 200
    langs = r.get_json()
    assert isinstance(langs, list)
    values = [l["value"] for l in langs]
    assert "python" in values
    assert "auto" in values


def test_focuses(client):
    r = client.get("/api/focuses")
    assert r.status_code == 200
    focuses = r.get_json()
    values = [f["value"] for f in focuses]
    assert set(FOCUS_DESCRIPTIONS.keys()) == set(values)


# ── Review validation ──────────────────────────────────────────────────────────

def test_review_rejects_empty_code(client):
    r = client.post("/api/review", json={"code": ""})
    assert r.status_code == 400
    assert "error" in r.get_json()


def test_review_rejects_oversized_code(client):
    r = client.post("/api/review", json={"code": "x" * 11000})
    assert r.status_code == 400


def test_review_rejects_invalid_focus(client):
    r = client.post("/api/review", json={"code": "print('hi')", "focus": "invalid_focus"})
    assert r.status_code == 400


def test_review_missing_api_key(client):
    import routes.review as rr
    original = rr.client
    rr.client = None
    r = client.post("/api/review", json={"code": "print('hi')"})
    assert r.status_code == 503
    rr.client = original


# ── Rate limiter ───────────────────────────────────────────────────────────────

def test_rate_limiter_allows_within_limit():
    rl = RateLimiter(max_calls=3, window_seconds=60)
    for _ in range(3):
        allowed, _ = rl.is_allowed("test-ip")
        assert allowed


def test_rate_limiter_blocks_over_limit():
    rl = RateLimiter(max_calls=3, window_seconds=60)
    for _ in range(3):
        rl.is_allowed("test-ip")
    allowed, retry = rl.is_allowed("test-ip")
    assert not allowed
    assert retry > 0


def test_rate_limiter_different_keys_independent():
    rl = RateLimiter(max_calls=2, window_seconds=60)
    rl.is_allowed("ip-a")
    rl.is_allowed("ip-a")
    blocked, _ = rl.is_allowed("ip-a")
    assert not blocked
    # ip-b is independent
    allowed, _ = rl.is_allowed("ip-b")
    assert allowed


# ── History store ──────────────────────────────────────────────────────────────

def test_history_store_create_session():
    hs = HistoryStore()
    sid = hs.new_session()
    assert hs.session_exists(sid)


def test_history_store_add_and_retrieve():
    hs  = HistoryStore()
    sid = hs.new_session()
    rid = hs.add_review(sid, {
        "filename": "test.py",
        "language": "Python",
        "focus":    "all",
        "score":    82,
        "verdict":  "Good",
        "code_len": 100,
        "result":   {"overall_score": 82},
    })
    history = hs.get_history(sid)
    assert len(history) == 1
    assert history[0]["id"] == rid
    assert history[0]["score"] == 82


def test_history_store_max_per_session():
    hs  = HistoryStore()
    sid = hs.new_session()
    for i in range(HistoryStore.MAX_PER_SESSION + 5):
        hs.add_review(sid, {"score": i, "result": {}})
    assert len(hs.get_history(sid)) == HistoryStore.MAX_PER_SESSION


def test_history_store_clear():
    hs  = HistoryStore()
    sid = hs.new_session()
    hs.add_review(sid, {"score": 90, "result": {}})
    hs.clear_session(sid)
    assert hs.get_history(sid) == []


def test_history_invalid_session(client):
    r = client.get("/api/history/nonexistent-session")
    assert r.status_code == 404


# ── Prompt builder ─────────────────────────────────────────────────────────────

def test_prompt_includes_code():
    p = build_user_prompt("def foo(): pass", "python", "all")
    assert "def foo(): pass" in p


def test_prompt_includes_language():
    p = build_user_prompt("code", "Python", "bugs")
    assert "Python" in p


def test_prompt_includes_filename():
    p = build_user_prompt("code", "auto", "all", "main.py")
    assert "main.py" in p


def test_prompt_all_focuses_valid():
    for focus in FOCUS_DESCRIPTIONS:
        p = build_user_prompt("x = 1", "python", focus)
        assert len(p) > 10
