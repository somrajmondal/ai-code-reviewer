import "./StreamingIndicator.css";

export default function StreamingIndicator({ rawJson }) {
  const lines = rawJson.split("\n").slice(-6); // last 6 lines

  return (
    <div className="streaming-wrap fade-up">
      <div className="streaming-header">
        <span className="streaming-dot" />
        <span className="streaming-label">Analysing your code…</span>
      </div>
      <pre className="streaming-preview">
        {lines.map((line, i) => (
          <span key={i} className="stream-line">{line}{"\n"}</span>
        ))}
        <span className="stream-cursor">▌</span>
      </pre>
    </div>
  );
}
