import "./IssueCard.css";

const SEV_COLOR = {
  critical: "var(--red)",
  high:     "var(--orange)",
  medium:   "var(--gold)",
  low:      "var(--muted)",
};

export default function IssueCard({ issue, type }) {
  const color = SEV_COLOR[issue.severity] || "var(--muted)";

  return (
    <div className="issue-card fade-up" style={{ "--accent": color }}>
      <div className="issue-top">
        {issue.severity && (
          <span className="issue-sev" style={{ color, borderColor: color }}>
            {issue.severity}
          </span>
        )}
        {issue.line != null && (
          <span className="issue-line">line {issue.line}</span>
        )}
      </div>
      <p className="issue-text">{issue.issue}</p>
      {issue.fix && (
        <div className="issue-fix">
          <span className="issue-fix-label">Fix →</span>
          <span className="issue-fix-text">{issue.fix}</span>
        </div>
      )}
    </div>
  );
}
