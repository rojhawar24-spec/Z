/**
 * ChoosePractice — appears AFTER user picks a language.
 * Shows 4 beautiful cards: Grammatica, Toets, Oefening, AI Tutor.
 */

import { useApp } from "../context/AppContext";
import { Language } from "../types";
import {
  BookOpen, ClipboardList, Bot,
  ChevronRight, Crown, Sparkles, ArrowLeft, Target, Zap, Trophy
} from "lucide-react";

interface ChoosePracticeProps {
  onSelect: (mode: "grammar" | "toets" | "ai" | "mistakes") => void;
  onChangeLanguage: () => void;
}

const langInfo: Record<Language, { flag: string; name: string; native: string }> = {
  nl: { flag: "🇳🇱", name: "Nederlands", native: "Dutch" },
  en: { flag: "🇬🇧", name: "English", native: "Engels" },
  fr: { flag: "🇫🇷", name: "Français", native: "Frans" },
  es: { flag: "🇪🇸", name: "Español", native: "Spaans" },
  de: { flag: "🇩🇪", name: "Deutsch", native: "Duits" },
};

export default function ChoosePractice({ onSelect, onChangeLanguage }: ChoosePracticeProps) {
  const { language, theme, account } = useApp();
  const isDark = theme === "dark";
  const isPremium = account?.isPremium || false;
  const lang = langInfo[language];

  const greet = () => {
    const h = new Date().getHours();
    const idx = h < 12 ? 0 : h < 18 ? 1 : 2;
    return ["Goedemorgen", "Goedemiddag", "Goedenavond"][idx];
  };

  const cards = [
    {
      id: "grammar" as const,
      emoji: "📚",
      icon: BookOpen,
      title: "Grammatica",
      subtitle: "Leer alle regels en uitleg",
      description: "65 artikelen met formule, uitleg, voorbeelden en pro-tips",
      color: "from-indigo-500 to-purple-700",
      shadow: "shadow-indigo-500/30",
      hoverBorder: isDark ? "hover:border-indigo-500/60" : "hover:border-indigo-400",
      stats: "65 lessen",
      free: true,
    },
    {
      id: "toets" as const,
      emoji: "📝",
      icon: ClipboardList,
      title: "Toets",
      subtitle: "Test je kennis met multiple-choice",
      description: "Per artikel: 10 vragen — kies de juiste antwoorden",
      color: "from-blue-500 to-cyan-600",
      shadow: "shadow-blue-500/30",
      hoverBorder: isDark ? "hover:border-blue-500/60" : "hover:border-blue-400",
      stats: "10 vragen × 65 lessen",
      free: true,
    },
    {
      id: "ai" as const,
      emoji: "🤖",
      icon: Bot,
      title: "AI Tutor",
      subtitle: "Praat met je persoonlijke AI-leraar",
      description: "Onbeperkte gesprekken + oneindig nieuwe vragen",
      color: "from-yellow-500 to-orange-600",
      shadow: "shadow-orange-500/30",
      hoverBorder: isDark ? "hover:border-yellow-500/60" : "hover:border-yellow-400",
      stats: isPremium ? "✓ Premium actief" : "$3/maand",
      free: false,
      premium: true,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">

      {/* ── HEADER with language flag ── */}
      <div className="mb-8 text-center">
        <button
          onClick={onChangeLanguage}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium mb-4 transition ${
            isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Andere taal kiezen
        </button>

        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-6xl sm:text-7xl">{lang.flag}</span>
          <div className="text-left">
            <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
              {greet()}, {account?.displayName?.split(" ")[0] || ""} 👋
            </p>
            <h1 className={`text-3xl sm:text-5xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}
              style={{ fontFamily:"Georgia, serif" }}
            >
              {lang.name}
            </h1>
          </div>
        </div>
        <p className={`text-base ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Kies hoe je vandaag wil leren
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? "bg-orange-900/30 text-orange-400" : "bg-orange-100 text-orange-700"}`}>
            🔥 {account?.streak || 0} dagen streak
          </span>
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700"}`}>
            <Zap className="w-3 h-3" /> {account?.xp || 0} XP
          </span>
          {isPremium && (
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-700"}`}>
              <Crown className="w-3 h-3" /> Premium
            </span>
          )}
        </div>
      </div>

      {/* ── 4 CHOICE CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-6">
        {cards.map((card) => {
          return (
            <button
              key={card.id}
              onClick={() => onSelect(card.id)}
              className={`group relative rounded-3xl overflow-hidden border-2 text-left transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] hover:shadow-2xl ${
                isDark
                  ? `bg-gray-900 border-gray-800 ${card.hoverBorder}`
                  : `bg-white border-gray-200 ${card.hoverBorder} shadow-sm`
              }`}
            >
              {/* Top gradient accent */}
              <div className={`h-2 bg-gradient-to-r ${card.color}`} />

              {/* Decorative blob */}
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
              />

              <div className="relative p-6 sm:p-7">
                <div className="flex items-start gap-4 mb-4">
                  {/* Icon circle */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shrink-0 shadow-lg ${card.shadow} group-hover:scale-110 transition-transform`}>
                    <span className="text-3xl">{card.emoji}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-extrabold text-2xl ${isDark ? "text-white" : "text-gray-900"}`}
                        style={{ fontFamily:"Georgia, serif" }}
                      >
                        {card.title}
                      </h3>
                      {card.premium && !isPremium && (
                        <span className="text-[10px] bg-yellow-500 text-yellow-900 px-2 py-0.5 rounded-full font-extrabold">
                          PRO
                        </span>
                      )}
                      {card.premium && isPremium && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {card.subtitle}
                    </p>
                  </div>
                </div>

                <p className={`text-sm leading-relaxed mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {card.description}
                </p>

                {/* Footer row */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {card.id === "grammar" && <BookOpen className="w-3.5 h-3.5 text-indigo-400" />}
                    {card.id === "toets" && <Trophy className="w-3.5 h-3.5 text-blue-400" />}
                    {card.id === "ai" && <Sparkles className="w-3.5 h-3.5 text-yellow-400" />}
                    {card.stats}
                  </span>
                  <div className={`flex items-center gap-1 text-xs font-bold transition-all group-hover:translate-x-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                    Start
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── EXTRA: Mistake Place ── */}
      <button
        onClick={() => onSelect("mistakes")}
        className={`w-full rounded-2xl p-5 border-2 text-left transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center gap-4 ${
          isDark
            ? "bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-700/30 hover:border-orange-600/50"
            : "bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 hover:border-orange-300"
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/30">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className={`font-extrabold text-base ${isDark ? "text-white" : "text-gray-900"}`}>
            🎯 Fout-plek (Mistake Practice)
          </p>
          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Oefen alle vragen die je fout had — beheers ze 2x correct!
          </p>
        </div>
        <ChevronRight className={`w-5 h-5 ${isDark ? "text-orange-400" : "text-orange-600"}`} />
      </button>

      {/* ── PREMIUM UPSELL ── */}
      {!isPremium && (
        <div
          onClick={() => onSelect("ai")}
          className={`mt-5 cursor-pointer rounded-2xl p-5 sm:p-6 relative overflow-hidden transition-all hover:scale-[1.01]`}
          style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 35%,#4c1d95 70%,#7c3aed 100%)" }}
        >
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
              <Crown className="w-7 h-7 text-yellow-300" />
            </div>
            <div className="flex-1">
              <p className="text-white font-extrabold text-base sm:text-lg flex items-center gap-2">
                💎 Upgrade naar Premium
                <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-extrabold">$3/maand</span>
              </p>
              <p className="text-purple-200 text-xs sm:text-sm mt-0.5">
                AI Tutor + oneindig nieuwe vragen voor elke les
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70" />
          </div>
        </div>
      )}
    </div>
  );
}
