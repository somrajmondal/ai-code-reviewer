import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Blueprint, request, jsonify
from utils.history_store import store

history_bp = Blueprint("history", __name__)


@history_bp.route("/api/session", methods=["POST"])
def create_session():
    sid = store.new_session()
    return jsonify({"session_id": sid})


@history_bp.route("/api/history/<sid>", methods=["GET"])
def get_history(sid):
    if not store.session_exists(sid):
        return jsonify({"error": "Session not found"}), 404
    history = store.get_history(sid)
    # Don't send full result in list — just metadata
    light = [{k: v for k, v in r.items() if k != "result"} for r in history]
    return jsonify({"history": light, "count": len(light)})


@history_bp.route("/api/history/<sid>/<rid>", methods=["GET"])
def get_review(sid, rid):
    review = store.get_review(sid, rid)
    if not review:
        return jsonify({"error": "Review not found"}), 404
    return jsonify(review)


@history_bp.route("/api/history/<sid>", methods=["DELETE"])
def clear_history(sid):
    store.clear_session(sid)
    return jsonify({"cleared": True})
