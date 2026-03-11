import { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { useReview }           from "./hooks/useReview";
import { fetchReviewById }     from "./utils/api";
import Sidebar     from "./components/layout/Sidebar";
import CodeEditor  from "./components/review/CodeEditor";
import ReviewPanel from "./components/review/ReviewPanel";
import StreamPreview from "./components/ui/StreamPreview";
import "./index.css";
import "./App.css";

function Main() {
  const { refreshHistory } = useApp();
  const { status, rawJson, result, error, review, reset } = useReview();
  const [filename, setFilename] = useState("");

  const handleSubmit = (params) => {
    setFilename(params.filename || "untitled");
    review(params);
  };

  const handleNewReview = () => {
    reset();
    refreshHistory();
  };

  const handleSelectHistory = async (item) => {
    // Load full review from history
    const full = await fetchReviewById(item.id);
    if (full?.result) {
      setFilename(full.filename || item.filename);
      // Inject result directly
      review.__forceDone?.(full.result);
    }
  };

  const isStreaming = status === "streaming";
  const isDone      = status === "done";
  const isError     = status === "error";
  const isIdle      = status === "idle";

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-name">CodeLens</span>
          <span className="logo-ver">v2</span>
        </div>
        <div className="app-header-center">
          {isStreaming && (
            <div className="header-status streaming">
              <span className="hs-dot" />
              Analysing with GPT-4o-mini…
            </div>
          )}
          {isDone && (
            <div className="header-status done">
              ✓ Review complete · {result?.language}
            </div>
          )}
        </div>
        <div className="app-header-right">
          <a
            href="https://github.com"
            className="app-header-link"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </header>

      <div className="app-body">
        {/* Sidebar */}
        <Sidebar onSelectHistory={handleSelectHistory} />

        {/* Main area: split editor | results */}
        <div className="app-main">

          {/* Left pane: editor (hidden when result shown on mobile) */}
          <div className={`app-pane editor-pane ${isDone ? "has-result" : ""}`}>
            <CodeEditor onSubmit={handleSubmit} isLoading={isStreaming} />
          </div>

          {/* Right pane: streaming / result / error / empty */}
          <div className="app-pane result-pane">
            {isIdle && (
              <div className="empty-state fade-in">
                <div className="es-icon">⬡</div>
                <h2 className="es-title">Paste code, get instant feedback</h2>
                <p className="es-sub">GPT-4o-mini reviews bugs, security, performance & style</p>
                <ul className="es-features">
                  {[
                    ["🐛", "Bug detection with line numbers"],
                    ["🔒", "Security vulnerability scanning"],
                    ["⚡", "Performance & complexity analysis"],
                    ["✨", "Style & best practice suggestions"],
                    ["🔧", "AI-generated improved code snippet"],
                    ["📥", "Export review as Markdown"],
                  ].map(([icon, text]) => (
                    <li key={text}><span>{icon}</span>{text}</li>
                  ))}
                </ul>
              </div>
            )}

            {isStreaming && <StreamPreview rawJson={rawJson} />}

            {isError && (
              <div className="error-state fade-in">
                <span className="err-icon">⚠</span>
                <div>
                  <p className="err-title">Review Failed</p>
                  <p className="err-msg">{error}</p>
                </div>
                <button className="err-btn" onClick={reset}>Try Again</button>
              </div>
            )}

            {isDone && result && (
              <ReviewPanel
                result={result}
                filename={filename}
                onNewReview={handleNewReview}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
}
