const BASE = process.env.NODE_ENV === "production" ? "" : "http://localhost:5000";

// ── Session management (persisted in localStorage) ────────────────────────────
export function getSessionId() {
  return localStorage.getItem("codelens_sid");
}

export async function ensureSession() {
  let sid = getSessionId();
  if (sid) return sid;
  try {
    const res  = await fetch(`${BASE}/api/session`, { method: "POST" });
    const data = await res.json();
    sid = data.session_id;
    localStorage.setItem("codelens_sid", sid);
    return sid;
  } catch {
    return null;
  }
}

// ── Stream review ─────────────────────────────────────────────────────────────
export async function streamReview(params, onToken) {
  const sid = await ensureSession();
  const res = await fetch(`${BASE}/api/review`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ ...params, session_id: sid }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full   = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep incomplete line

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") return full;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.token) {
          full += parsed.token;
          onToken(parsed.token);
        }
      } catch (e) {
        if (e.message && !e.message.includes("JSON")) throw e;
      }
    }
  }
  return full;
}

// ── History ───────────────────────────────────────────────────────────────────
export async function fetchHistory() {
  const sid = getSessionId();
  if (!sid) return { history: [], count: 0 };
  const res = await fetch(`${BASE}/api/history/${sid}`);
  if (!res.ok) return { history: [], count: 0 };
  return res.json();
}

export async function fetchReviewById(rid) {
  const sid = getSessionId();
  if (!sid) return null;
  const res = await fetch(`${BASE}/api/history/${sid}/${rid}`);
  if (!res.ok) return null;
  return res.json();
}

export async function clearHistory() {
  const sid = getSessionId();
  if (!sid) return;
  await fetch(`${BASE}/api/history/${sid}`, { method: "DELETE" });
}

// ── Meta ──────────────────────────────────────────────────────────────────────
export async function fetchLanguages() {
  const res = await fetch(`${BASE}/api/languages`);
  return res.json();
}

export async function fetchFocuses() {
  const res = await fetch(`${BASE}/api/focuses`);
  return res.json();
}

// ── Export review as markdown ─────────────────────────────────────────────────
export function exportAsMarkdown(result, filename = "review") {
  const { language, overall_score, verdict, summary,
          bugs, security, performance, style, positives,
          improved_snippet, test_suggestions } = result;

  const section = (title, items, hasfix = true) => {
    if (!items?.length) return "";
    const rows = items.map(i =>
      `### Line ${i.line ?? "—"} · ${i.severity ? `[${i.severity.toUpperCase()}]` : ""}\n**Issue:** ${i.issue}\n${hasfix ? `**Fix:** ${i.fix}` : ""}`
    ).join("\n\n");
    return `## ${title}\n\n${rows}\n\n`;
  };

  const md = `# Code Review — ${filename}

**Language:** ${language}  
**Score:** ${overall_score}/100 · ${verdict}  
**Summary:** ${summary}

---

${section("🐛 Bugs", bugs)}
${section("🔒 Security", security)}
${section("⚡ Performance", performance)}
${section("✨ Style", style, false)}
${positives?.length ? `## ✅ Positives\n\n${positives.map(p => `- ${p}`).join("\n")}\n\n` : ""}
${improved_snippet ? `## 🔧 Improved Snippet\n\n\`\`\`\n${improved_snippet}\n\`\`\`\n\n` : ""}
${test_suggestions?.length ? `## 🧪 Test Suggestions\n\n${test_suggestions.map(t => `- ${t}`).join("\n")}` : ""}
`;

  const blob = new Blob([md], { type: "text/markdown" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `codelens-review-${filename}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
