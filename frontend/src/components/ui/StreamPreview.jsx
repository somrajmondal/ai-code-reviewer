import "./StreamPreview.css";

export default function StreamPreview({ rawJson }) {
  const lines = rawJson.split("\n").slice(-8);
  return (
    <div className="sp">
      <div className="sp-top">
        <span className="sp-dot" />
        <span className="sp-label">Analysing your code…</span>
        <span className="sp-anim">
          <span /><span /><span />
        </span>
      </div>
      <pre className="sp-body">
        {lines.map((l, i) => (
          <span key={i} className="sp-line">{l + "\n"}</span>
        ))}
        <span className="sp-cursor">▌</span>
      </pre>
    </div>
  );
}
