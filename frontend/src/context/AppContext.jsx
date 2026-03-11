import { createContext, useContext, useState, useEffect } from "react";
import { fetchLanguages, fetchFocuses, fetchHistory, ensureSession } from "../utils/api";

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [languages, setLanguages] = useState([]);
  const [focuses,   setFocuses]   = useState([]);
  const [history,   setHistory]   = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    ensureSession();
    fetchLanguages().then(setLanguages).catch(() => {});
    fetchFocuses().then(setFocuses).catch(() => {});
    refreshHistory();
  }, []);

  const refreshHistory = () => {
    fetchHistory().then(d => setHistory(d.history || [])).catch(() => {});
  };

  return (
    <AppCtx.Provider value={{ languages, focuses, history, refreshHistory, sidebarOpen, setSidebarOpen }}>
      {children}
    </AppCtx.Provider>
  );
}

export const useApp = () => useContext(AppCtx);
