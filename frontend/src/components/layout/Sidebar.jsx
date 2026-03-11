import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { clearHistory, fetchHistory } from "../../utils/api";
import "./Sidebar.css";

const VERDICT_COLOR = {
  Excellent: "var(--green)",
  Good:      "var(--yellow)",
  "Needs Work": "var(--orange)",
  Poor:      "var(--red)",
};

function timeAgo(ts) {
  const diff = Date.now() / 1000 - ts;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function Sidebar({ onSelectHistory }) {
  const { history, refreshHistory, sidebarOpen, setSidebarOpen } = useApp();
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    await clearHistory();
    await refreshHistory();
    setClearing(false);
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
      <div className="sb-header">
        <span className="sb-title">History</span>
        <div style={{ display:"flex", gap:6 }}>
          {history.length > 0 && (
            <button className="sb-icon-btn" onClick={handleClear} title="Clear history" disabled={clearing}>
              🗑
            </button>
          )}
          <button className="sb-icon-btn" onClick={() => setSidebarOpen(o => !o)} title="Toggle sidebar">
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div className="sb-body">
          {history.length === 0 ? (
            <div className="sb-empty">
              <p>No reviews yet.</p>
              <p>Paste code and hit Review.</p>
            </div>
          ) : (
            history.map(item => (
              <button
                key={item.id}
                className="sb-item"
                onClick={() => onSelectHistory(item)}
              >
                <div className="sb-item-top">
                  <span className="sb-item-file">{item.filename}</span>
                  <span className="sb-item-time">{timeAgo(item.timestamp)}</span>
                </div>
                <div className="sb-item-bottom">
                  <span className="sb-item-lang">{item.language}</span>
                  {item.score != null && (
                    <span
                      className="sb-item-score"
                      style={{ color: VERDICT_COLOR[item.verdict] || "var(--text2)" }}
                    >
                      {item.score}/100
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </aside>
  );
}
