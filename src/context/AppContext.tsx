import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, Theme } from "../types";
import { Account, getCurrentSession, checkPremiumExpiry } from "../auth";

interface AppContextType {
  language: Language;
  setLanguage: (l: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
  account: Account | null;
  setAccount: (a: Account | null) => void;
  refreshAccount: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() =>
    (localStorage.getItem("lingua_lang") as Language) || "nl"
  );
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem("lingua_theme") as Theme) || "dark"
  );
  const [account, setAccount] = useState<Account | null>(() => {
    try {
      const s = getCurrentSession();
      if (!s) return null;
      return checkPremiumExpiry(s.uid);
    } catch { return null; }
  });

  // Persist language
  useEffect(() => { localStorage.setItem("lingua_lang", language); }, [language]);

  // Apply theme to <html>
  useEffect(() => {
    localStorage.setItem("lingua_theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Apply on mount
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  const refreshAccount = () => {
    if (!account) return;
    try { setAccount(checkPremiumExpiry(account.uid)); } catch {}
  };

  return (
    <AppContext.Provider value={{ language, setLanguage, theme, toggleTheme, account, setAccount, refreshAccount }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
};
