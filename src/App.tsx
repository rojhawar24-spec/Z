import { useState, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Language, Section } from "./types";
import { logout, activatePremium } from "./auth";
import LoginPage from "./components/LoginPage";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import ChoosePractice from "./components/ChoosePractice";
import GrammarSection from "./components/GrammarSection";
import AISection from "./components/AISection";
import MistakesSection from "./components/MistakesSection";
import LessonPicker from "./components/LessonPicker";
import AccountSettings from "./components/AccountSettings";

function MainApp() {
  const { account, setAccount, setLanguage, theme, refreshAccount } = useApp();
  const isDark = theme === "dark";

  // 3-state navigation:
  //  1. activeSection = null + showPracticeChooser = false → Dashboard (pick language)
  //  2. activeSection = null + showPracticeChooser = true → Choose Practice screen
  //  3. activeSection = "grammar"/"toets"/etc → Section content
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [showPracticeChooser, setShowPracticeChooser] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (account) refreshAccount();
  }, []);

  const handleLogout = () => {
    logout();
    setAccount(null);
    setActiveSection(null);
    setShowPracticeChooser(false);
  };

  // Pick language → go to ChoosePractice screen
  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    setActiveSection(null);
    setShowPracticeChooser(true);
  };

  // From ChoosePractice → pick what to do
  const handlePracticeChoice = (mode: Section) => {
    setActiveSection(mode);
    setShowPracticeChooser(false);
  };

  // Back to choose practice mode (after being in a section)
  const handleBackToPractice = () => {
    setActiveSection(null);
    setShowPracticeChooser(true);
  };

  // Back to language picker
  const handleChangeLanguage = () => {
    setActiveSection(null);
    setShowPracticeChooser(false);
  };

  const handleSubscribe = (months: number) => {
    if (!account) return;
    try { setAccount(activatePremium(account.uid, months)); } catch {}
  };

  if (!account) return <LoginPage />;

  const renderContent = () => {
    // If in a section, show that
    if (activeSection) {
      switch (activeSection) {
        case "grammar": return <GrammarSection onUpgradeRequest={() => setActiveSection("ai")} />;
      case "toets": return <LessonPicker mode="toets" onUpgradeRequest={() => setActiveSection("ai")} />;
      case "ai": return (
          <AISection
            isPremium={account.isPremium}
            premiumExpiry={account.premiumExpiry}
            onSubscribe={(months: number) => handleSubscribe(months)}
          />
        );
        case "mistakes": return <MistakesSection />;
        case "account": return <AccountSettings onBack={() => setActiveSection(null)} />;
      }
    }

    // If showing practice chooser
    if (showPracticeChooser) {
      return (
        <ChoosePractice
          onSelect={handlePracticeChoice}
          onChangeLanguage={handleChangeLanguage}
        />
      );
    }

    // Default: Dashboard (pick language)
    return (
      <Dashboard
        onSelectLanguage={handleSelectLanguage}
        onGoToAI={() => { setShowPracticeChooser(false); setActiveSection("ai"); }}
      />
    );
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-950" : "bg-slate-50"}`}>
      <Navbar
        activeSection={activeSection}
        setActiveSection={(s) => {
          if (s === null) {
            // Going to "home" → show practice chooser if language already picked, otherwise dashboard
            handleBackToPractice();
          } else {
            setActiveSection(s);
            setShowPracticeChooser(false);
          }
        }}
        onLogout={handleLogout}
        onHome={handleBackToPractice}
      />
      <main className={activeSection === "ai" ? "" : "pb-20"}>
        {renderContent()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
