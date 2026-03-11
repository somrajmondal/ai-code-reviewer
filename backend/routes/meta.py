import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Blueprint, jsonify

meta_bp = Blueprint("meta", __name__)
_start_time = time.time()


@meta_bp.route("/api/health")
def health():
    return jsonify({
        "status":  "ok",
        "uptime":  round(time.time() - _start_time),
        "version": "2.0.0",
    })


@meta_bp.route("/api/languages")
def languages():
    return jsonify([
        {"value": "auto",       "label": "Auto Detect"},
        {"value": "python",     "label": "Python"},
        {"value": "javascript", "label": "JavaScript"},
        {"value": "typescript", "label": "TypeScript"},
        {"value": "sql",        "label": "SQL"},
        {"value": "java",       "label": "Java"},
        {"value": "go",         "label": "Go"},
        {"value": "rust",       "label": "Rust"},
        {"value": "cpp",        "label": "C++"},
        {"value": "csharp",     "label": "C#"},
        {"value": "php",        "label": "PHP"},
        {"value": "ruby",       "label": "Ruby"},
        {"value": "bash",       "label": "Bash/Shell"},
        {"value": "yaml",       "label": "YAML"},
        {"value": "dockerfile", "label": "Dockerfile"},
    ])


@meta_bp.route("/api/focuses")
def focuses():
    return jsonify([
        {"value": "all",         "label": "Full Review",   "icon": "◈", "desc": "Bugs, security, performance & style"},
        {"value": "bugs",        "label": "Bugs Only",     "icon": "🐛", "desc": "Logic errors & incorrect behaviour"},
        {"value": "security",    "label": "Security",      "icon": "🔒", "desc": "Vulnerabilities & attack vectors"},
        {"value": "performance", "label": "Performance",   "icon": "⚡", "desc": "Speed, memory & complexity"},
        {"value": "style",       "label": "Style & Clean", "icon": "✨", "desc": "Readability & best practices"},
    ])
