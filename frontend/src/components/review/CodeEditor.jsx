import { useState, useRef } from "react";
import { useApp } from "../../context/AppContext";
import "./CodeEditor.css";

const SAMPLE = `def my_decorator(func):
    def wrapper(*args, **kwargs):
        print("Something happens before the function runs.")
        result = func(*args, **kwargs)
        print("Something happens after the function runs.")
        return result
    return wrapper

@my_decorator
def say_hello(name):
    print(f"Hello, {name}!")
    return "Greeting complete"

say_hello("Alice")

`;

export default function CodeEditor({ onSubmit, isLoading }) {
  const { languages, focuses } = useApp();
  const [code,     setCode]     = useState("");
  const [language, setLanguage] = useState("auto");
  const [focus,    setFocus]    = useState("all");
  const [filename, setFilename] = useState("");
  const fileRef = useRef();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFilename(file.name);
    const ext = file.name.split(".").pop().toLowerCase();
    const langMap = { py:"python", js:"javascript", ts:"typescript",
                      sql:"sql", java:"java", go:"go", rs:"rust",
                      cpp:"cpp", cs:"csharp", php:"php", rb:"ruby", sh:"bash" };
    if (langMap[ext]) setLanguage(langMap[ext]);
    const reader = new FileReader();
    reader.onload = e => setCode(e.target.result);
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (!code.trim() || isLoading) return;
    onSubmit({ code, language, focus, filename: filename || "untitled" });
  };

  const lineCount = code.split("\n").length;
  const charCount = code.length;

  return (
    <div className="ce">

      {/* Toolbar */}
      <div className="ce-toolbar">
        <div className="ce-toolbar-left">
          {/* Language */}
          <div className="ce-field">
            <label className="ce-label">Language</label>
            <select
              className="ce-select"
              value={language}
              onChange={e => setLanguage(e.target.value)}
              disabled={isLoading}
            >
              {languages.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Focus */}
          <div className="ce-field">
            <label className="ce-label">Focus</label>
            <div className="ce-focus-tabs">
              {focuses.map(f => (
                <button
                  key={f.value}
                  className={`ce-focus ${focus === f.value ? "active" : ""}`}
                  onClick={() => setFocus(f.value)}
                  disabled={isLoading}
                  title={f.desc}
                >
                  {f.icon} {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="ce-toolbar-right">
          <input
            ref={fileRef}
            type="file"
            accept=".py,.js,.ts,.sql,.java,.go,.rs,.cpp,.cs,.php,.rb,.sh,.txt"
            style={{ display:"none" }}
            onChange={handleFileUpload}
          />
          <button className="ce-btn outline" onClick={() => fileRef.current.click()} disabled={isLoading}>
            ↑ Upload File
          </button>
          <button className="ce-btn ghost" onClick={() => { setCode(SAMPLE); setFilename("sample.py"); setLanguage("python"); }} disabled={isLoading}>
            Load Sample
          </button>
        </div>
      </div>

      {/* Filename */}
      <div className="ce-filename-bar">
        <span className="ce-dot red" /><span className="ce-dot yellow" /><span className="ce-dot green" />
        <input
          className="ce-filename-input"
          value={filename}
          onChange={e => setFilename(e.target.value)}
          placeholder="filename.py"
          disabled={isLoading}
        />
      </div>

      {/* Editor */}
      <div className="ce-editor-wrap">
        <div className="ce-gutter">
          {(code || " ").split("\n").map((_, i) => (
            <span key={i} className="ce-gn">{i + 1}</span>
          ))}
        </div>
        <textarea
          className="ce-textarea"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder={"// Paste your code here…\n// Or upload a file using the button above"}
          disabled={isLoading}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          onKeyDown={e => {
            if (e.key === "Tab") {
              e.preventDefault();
              const s = e.target.selectionStart;
              const v = code;
              setCode(v.substring(0, s) + "    " + v.substring(s));
              setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s + 4; }, 0);
            }
          }}
        />
      </div>

      {/* Footer */}
      <div className="ce-footer">
        <span className="ce-stats">{lineCount} lines · {charCount} chars {charCount > 8000 ? "⚠ approaching limit" : ""}</span>
        <button
          className="ce-submit"
          onClick={handleSubmit}
          disabled={isLoading || !code.trim()}
        >
          {isLoading ? (
            <><span className="ce-spinner" /> Analysing…</>
          ) : (
            <>Review Code <span className="ce-kbd">⌘↵</span></>
          )}
        </button>
      </div>
    </div>
  );
}
