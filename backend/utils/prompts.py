"""
Builds structured OpenAI prompts for code review.
Centralised here so prompts are versioned and testable.
"""

FOCUS_DESCRIPTIONS = {
    "all":         "Review everything: bugs, security, performance, style, and best practices.",
    "bugs":        "Focus primarily on bugs, logic errors, and incorrect behaviour. Still flag critical security issues.",
    "security":    "Focus primarily on security vulnerabilities (injection, auth, crypto, etc.). Still flag critical bugs.",
    "performance": "Focus primarily on performance bottlenecks, algorithmic complexity, and memory usage. Still flag critical bugs.",
    "style":       "Focus primarily on code style, readability, naming, structure, and maintainability.",
}

SYSTEM_PROMPT = """You are a principal engineer at a top-tier tech company conducting a thorough code review.
You review code with precision, honesty, and depth — like a Google/Meta/Amazon staff engineer.

You MUST respond with ONLY a valid JSON object matching this exact schema. No markdown, no preamble, no explanation outside the JSON:

{
  "language":      "detected programming language",
  "overall_score": <integer 0-100>,
  "verdict":       "Excellent | Good | Needs Work | Poor",
  "summary":       "2-3 sentence executive summary of code quality",
  "complexity":    "O(?) time complexity of the main logic if determinable, else null",
  "bugs": [
    {
      "line":     <integer or null>,
      "severity": "critical | high | medium | low",
      "issue":    "clear description of the bug",
      "fix":      "concrete fix with example if possible"
    }
  ],
  "security": [
    {
      "line":     <integer or null>,
      "severity": "critical | high | medium | low",
      "issue":    "security vulnerability description",
      "fix":      "concrete remediation"
    }
  ],
  "performance": [
    {
      "line":     <integer or null>,
      "severity": "high | medium | low",
      "issue":    "performance problem description",
      "fix":      "optimisation with Big-O impact if possible"
    }
  ],
  "style": [
    {
      "line":     <integer or null>,
      "issue":    "style / readability issue",
      "fix":      "specific improvement"
    }
  ],
  "positives":         ["concrete thing done well", "..."],
  "improved_snippet":  "rewritten version of the most problematic section, as a string — or null",
  "test_suggestions":  ["test case to add", "..."]
}

Scoring guide:
- 90-100: Exceptional production-ready code
- 70-89:  Good code with minor issues
- 50-69:  Functional but needs significant improvement
- 30-49:  Multiple serious issues
- 0-29:   Fundamentally broken or dangerous

Be direct. Never invent issues to seem thorough. If something is clean, say so."""


def build_user_prompt(code: str, language: str, focus: str, filename: str = None) -> str:
    lang_hint   = f"Language: {language}." if language and language != "auto" else "Detect the language automatically."
    focus_instr = FOCUS_DESCRIPTIONS.get(focus, FOCUS_DESCRIPTIONS["all"])
    file_hint   = f"Filename: {filename}." if filename else ""

    return f"""{lang_hint} {file_hint}
{focus_instr}

Code to review:
```
{code}
```

Respond with ONLY the JSON object. No other text."""
