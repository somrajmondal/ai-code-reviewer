export default function ScoreRing({ score, size = 100 }) {
  const r    = size * 0.42;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const cx   = size / 2;

  const color = score >= 80 ? "var(--green)"
              : score >= 60 ? "var(--yellow)"
              : score >= 40 ? "var(--orange)"
              : "var(--red)";

  const verdict = score >= 80 ? "Excellent"
                : score >= 60 ? "Good"
                : score >= 40 ? "Needs Work"
                : "Poor";

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--border2)" strokeWidth={size*0.07} />
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={color}
          strokeWidth={size*0.07}
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: "stroke-dasharray 1.2s ease" }}
        />
        <text x={cx} y={cx - 4} textAnchor="middle"
          style={{ fontFamily:"var(--font-code)", fontSize: size*0.2, fontWeight:600, fill:color }}>
          {score}
        </text>
        <text x={cx} y={cx + size*0.14} textAnchor="middle"
          style={{ fontFamily:"var(--font-code)", fontSize: size*0.09, fill:"var(--muted)" }}>
          / 100
        </text>
      </svg>
      <span style={{ fontFamily:"var(--font-ui)", fontSize:".85rem", color, fontWeight:700 }}>
        {verdict}
      </span>
    </div>
  );
}
