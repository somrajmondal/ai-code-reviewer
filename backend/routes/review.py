import os
import json
from flask import Blueprint, request, Response, jsonify
from openai import OpenAI

# Absolute imports for utils
from backend.utils.rate_limiter import rate_limit, review_limiter
from backend.utils.prompts import SYSTEM_PROMPT, build_user_prompt, FOCUS_DESCRIPTIONS
from backend.utils.history_store import store

review_bp = Blueprint("review", __name__)

_api_key = os.environ.get("OPENAI_API_KEY")
client = OpenAI(api_key=_api_key) if _api_key else None

def _validate(data: dict) -> tuple[str | None, int]:
    code = (data.get("code") or "").strip()
    if not code:
        return "No code provided.", 400
    if len(code) > 10_000:
        return "Code exceeds 10,000 character limit.", 400
    focus = data.get("focus", "all")
    if focus not in FOCUS_DESCRIPTIONS:
        return f"Invalid focus '{focus}'. Choose from: {', '.join(FOCUS_DESCRIPTIONS)}", 400
    if not client:
        return "OPENAI_API_KEY is not configured on the server.", 503
    return None, 200

@review_bp.route("/api/review", methods=["POST"])
@rate_limit(review_limiter)
def review():
    data = request.get_json(silent=True) or {}
    err, status = _validate(data)
    if err:
        return jsonify({"error": err}), status

    code     = data["code"].strip()
    language = (data.get("language") or "auto").strip()
    focus    = data.get("focus", "all")
    filename = (data.get("filename") or "").strip() or None
    sid      = data.get("session_id")

    user_prompt = build_user_prompt(code, language, focus, filename)
    accumulated = []

    def generate():
        try:
            stream = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": user_prompt},
                ],
                stream=True,
                temperature=0.15,
                max_tokens=2500,
            )

            for chunk in stream:
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    token = delta.content
                    accumulated.append(token)
                    yield f"data: {json.dumps({'token': token})}\n\n"

            full = "".join(accumulated)
            try:
                clean  = full.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
                parsed = json.loads(clean)
                if sid and store.session_exists(sid):
                    store.add_review(sid, {
                        "filename": filename or "untitled",
                        "language": parsed.get("language", language),
                        "focus":    focus,
                        "score":    parsed.get("overall_score"),
                        "verdict":  parsed.get("verdict"),
                        "code_len": len(code),
                        "result":   parsed,
                    })
            except Exception:
                pass

            yield "data: [DONE]\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "X-Accel-Buffering": "no",
            "Connection":        "keep-alive",
        },
    )