import "./IssueCard.css";

const SEV = {
  critical: { color: "var(--red)",    bg: "var(--red-dim)" },
  high:     { color: "var(--orange)", bg: "var(--orange-dim)" },
  medium:   { color: "var(--yellow)", bg: "var(--yellow-dim)" },
  low:      { color: "var(--muted)",  bg: "transparent" },
};

export default function IssueCard({ item }) {
  const sev = SEV[item.severity] || SEV.low;
  return (
    <div className="ic" style={{ "--ac": sev.color, "--bg": sev.bg }}>
      <div className="ic-header">
        {item.severity && (
          <span className="ic-sev">{item.severity}</span>
        )}
        {item.line != null && (
          <span className="ic-line">L{item.line}</span>
        )}
      </div>
      <p className="ic-issue">{item.issue}</p>
      {item.fix && (
        <div className="ic-fix">
          <span className="ic-fix-arrow">→</span>
          <span>{item.fix}</span>
        </div>
      )}
    </div>
  );
}
