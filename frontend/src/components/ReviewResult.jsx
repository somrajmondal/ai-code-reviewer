import ScoreGauge from "./ScoreGauge";
import IssueCard   from "./IssueCard";
import "./ReviewResult.css";

const SECTIONS = [
  { key: "bugs",        label: "Bugs",        icon: "🐛", color: "var(--red)" },
  { key: "security",    label: "Security",    icon: "🔒", color: "var(--orange)" },
  { key: "performance", label: "Performance", icon: "⚡", color: "var(--gold)" },
  { key: "style",       label: "Style",       icon: "✨", color: "var(--blue)" },
];

export default function ReviewResult({ result, onReset }) {
  const totalIssues = SECTIONS.reduce((s, sec) => s + (result[sec.key]?.length || 0), 0);

  return (
    <div className="review-result fade-up">

      {/* ── Hero bar ── */}
      <div className="rr-hero">
        <ScoreGauge score={result.overall_score} verdict={result.verdict} />
        <div className="rr-hero-info">
          <div className="rr-lang-badge">
            {result.language}
          </div>
          <p className="rr-summary">{result.summary}</p>
          <div className="rr-counts">
            {SECTIONS.map(sec => (
              <div key={sec.key} className="rr-count">
                <span className="rr-count-n" style={{ color: sec.color }}>
                  {result[sec.key]?.length || 0}
                </span>
                <span className="rr-count-label">{sec.label}</span>
              </div>
            ))}
          </div>
        </div>
        <button className="btn-reset" onClick={onReset}>← New Review</button>
      </div>

      {/* ── Positives ── */}
      {result.positives?.length > 0 && (
        <div className="rr-section">
          <h3 className="rr-section-title" style={{ color: "var(--green)" }}>
            ✅ What's Good
          </h3>
          <ul className="rr-positives">
            {result.positives.map((p, i) => (
              <li key={i} className="rr-positive fade-up">{p}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Issue sections ── */}
      {SECTIONS.map(sec => {
        const items = result[sec.key] || [];
        if (!items.length) return null;
        return (
          <div key={sec.key} className="rr-section">
            <h3 className="rr-section-title" style={{ color: sec.color }}>
              {sec.icon} {sec.label}
              <span className="rr-section-count">{items.length}</span>
            </h3>
            <div className="rr-issue-list">
              {items.map((item, i) => (
                <IssueCard key={i} issue={item} type={sec.key} />
              ))}
            </div>
          </div>
        );
      })}

      {/* ── Improved snippet ── */}
      {result.improved_snippet && (
        <div className="rr-section">
          <h3 className="rr-section-title" style={{ color: "var(--gold)" }}>
            🔧 Suggested Rewrite
          </h3>
          <pre className="rr-snippet">{result.improved_snippet}</pre>
        </div>
      )}

      {/* ── No issues ── */}
      {totalIssues === 0 && (
        <div className="rr-clean">
          <span className="rr-clean-icon">🏆</span>
          <p>No issues found. This is clean, production-ready code.</p>
        </div>
      )}
    </div>
  );
}
