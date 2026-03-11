import { useState } from "react";
import ScoreRing from "../ui/ScoreRing";
import IssueCard from "../ui/IssueCard";
import { exportAsMarkdown } from "../../utils/api";
import "./ReviewPanel.css";

const TABS = [
  { id: "overview",    label: "Overview",    icon: "◈" },
  { id: "bugs",        label: "Bugs",        icon: "🐛" },
  { id: "security",    label: "Security",    icon: "🔒" },
  { id: "performance", label: "Performance", icon: "⚡" },
  { id: "style",       label: "Style",       icon: "✨" },
  { id: "snippet",     label: "Rewrite",     icon: "🔧" },
];

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const sortBySev = (arr) =>
  [...(arr || [])].sort((a, b) => (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9));

export default function ReviewPanel({ result, filename, onNewReview }) {
  const [tab, setTab] = useState("overview");

  const counts = {
    bugs:        result.bugs?.length        || 0,
    security:    result.security?.length    || 0,
    performance: result.performance?.length || 0,
    style:       result.style?.length       || 0,
  };

  const criticalCount = [
    ...(result.bugs     || []),
    ...(result.security || []),
  ].filter(i => i.severity === "critical").length;

  return (
    <div className="rp fade-up">

      {/* Header */}
      <div className="rp-header">
        <div className="rp-header-left">
          <span className="rp-filename">{filename || "review"}</span>
          <span className="rp-lang">{result.language}</span>
          {result.complexity && (
            <span className="rp-complexity">complexity: {result.complexity}</span>
          )}
        </div>
        <div className="rp-header-right">
          <button className="rp-btn" onClick={() => exportAsMarkdown(result, filename)}>
            ↓ Export .md
          </button>
          <button className="rp-btn primary" onClick={onNewReview}>
            + New Review
          </button>
        </div>
      </div>

      {/* Critical alert */}
      {criticalCount > 0 && (
        <div className="rp-alert">
          ⚠ {criticalCount} critical issue{criticalCount > 1 ? "s" : ""} found — review immediately before deploying
        </div>
      )}

      {/* Tabs */}
      <div className="rp-tabs">
        {TABS.map(t => {
          const count = counts[t.id];
          const skip  = t.id === "snippet" && !result.improved_snippet;
          if (skip) return null;
          return (
            <button
              key={t.id}
              className={`rp-tab ${tab === t.id ? "active" : ""} ${count > 0 ? "has-items" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label}
              {count > 0 && <span className="rp-tab-badge">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="rp-content">

        {/* Overview */}
        {tab === "overview" && (
          <div className="rp-overview slide-in">
            <div className="rp-score-block">
              <ScoreRing score={result.overall_score} size={110} />
              <div className="rp-summary-block">
                <p className="rp-summary">{result.summary}</p>
                <div className="rp-issue-counts">
                  {Object.entries(counts).map(([k, v]) => (
                    <div key={k} className={`rp-count ${v > 0 ? "has" : "none"}`}>
                      <span className="rp-count-n">{v}</span>
                      <span className="rp-count-k">{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {result.positives?.length > 0 && (
              <div className="rp-section">
                <h3 className="rp-section-title green">✅ What's Good</h3>
                <ul className="rp-positives">
                  {result.positives.map((p, i) => (
                    <li key={i} className="rp-positive fade-up" style={{ animationDelay: `${i * .05}s` }}>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.test_suggestions?.length > 0 && (
              <div className="rp-section">
                <h3 className="rp-section-title purple">🧪 Test Suggestions</h3>
                <ul className="rp-positives">
                  {result.test_suggestions.map((t, i) => (
                    <li key={i} className="rp-positive fade-up" style={{ animationDelay: `${i * .05}s`, borderColor:"rgba(179,136,255,.2)", background:"rgba(179,136,255,.04)" }}>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Issues tabs */}
        {["bugs", "security", "performance", "style"].includes(tab) && (
          <div className="rp-issues slide-in">
            {!result[tab]?.length ? (
              <div className="rp-empty">
                <span className="rp-empty-icon">✓</span>
                <p>No {tab} issues found.</p>
              </div>
            ) : (
              sortBySev(result[tab]).map((item, i) => (
                <IssueCard key={i} item={item} />
              ))
            )}
          </div>
        )}

        {/* Rewrite snippet */}
        {tab === "snippet" && result.improved_snippet && (
          <div className="rp-snippet slide-in">
            <div className="rp-snippet-header">
              <span>Suggested rewrite of most critical section</span>
              <button
                className="rp-btn"
                onClick={() => navigator.clipboard.writeText(result.improved_snippet)}
              >
                Copy
              </button>
            </div>
            <pre className="rp-snippet-code">{result.improved_snippet}</pre>
          </div>
        )}

      </div>
    </div>
  );
}
