import { useState, useCallback, useRef } from "react";
import { streamReview } from "../utils/api";

export function useReview() {
  const [status,  setStatus]  = useState("idle");
  const [rawJson, setRawJson] = useState("");
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState("");
  const aborted = useRef(false);

  const review = useCallback(async (params) => {
    aborted.current = false;
    setStatus("streaming");
    setRawJson("");
    setResult(null);
    setError("");

    try {
      const full = await streamReview(params, (token) => {
        if (aborted.current) return;
        setRawJson(prev => prev + token);
      });

      if (aborted.current) return;

      const clean  = full.trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/,      "")
        .replace(/```\s*$/,      "")
        .trim();

      const parsed = JSON.parse(clean);
      setResult(parsed);
      setStatus("done");
    } catch (e) {
      if (!aborted.current) {
        setError(e.message || "Unknown error");
        setStatus("error");
      }
    }
  }, []);

  const reset = useCallback(() => {
    aborted.current = true;
    setStatus("idle");
    setRawJson("");
    setResult(null);
    setError("");
  }, []);

  return { status, rawJson, result, error, review, reset };
}
