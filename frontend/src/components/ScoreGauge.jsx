import "./ScoreGauge.css";

function getColor(score) {
  if (score >= 80) return "var(--green)";
  if (score >= 60) return "var(--gold)";
  if (score >= 40) return "var(--orange)";
  return "var(--red)";
}

export default function ScoreGauge({ score, verdict }) {
  const r      = 44;
  const circ   = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color  = getColor(score);

  return (
    <div className="gauge-wrap">
      <svg className="gauge-svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} className="gauge-track" />
        <circle
          cx="50" cy="50" r={r}
          className="gauge-fill"
          strokeDasharray={`${filled} ${circ}`}
          transform="rotate(-90 50 50)"
          style={{ stroke: color }}
        />
        <text x="50" y="46" className="gauge-score" style={{ fill: color }}>
          {score}
        </text>
        <text x="50" y="60" className="gauge-label">/100</text>
      </svg>
      <span className="gauge-verdict" style={{ color }}>{verdict}</span>
    </div>
  );
}
