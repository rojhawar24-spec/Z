/**
 * LessonPicker — show all lessons with quiz/exercise badges
 * Used by Toets and Oefening tabs
 */

import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { grammarData } from "../data/grammarData";
import { hasLessonQuestions } from "../data/lessonQuestions";
import { Search, ChevronRight, X, Trophy, Crown, Lock } from "lucide-react";
import LessonPractice from "./LessonPractice";

interface LessonPickerProps {
  mode: "toets";
  onUpgradeRequest?: () => void;
}

export default function LessonPicker({ mode, onUpgradeRequest }: LessonPickerProps) {
  const { language, theme, account } = useApp();
  const isDark = theme === "dark";
  const isPremium = account?.isPremium || false;
  const lessons = grammarData[language];

  const [search, setSearch] = useState("");
  const [selectedLesson, setSelectedLesson] = useState<{ id: string; title: string } | null>(null);

  const filtered = useMemo(() =>
    lessons.filter(l =>
      !search || l.title.toLowerCase().includes(search.toLowerCase())
    ), [lessons, search]
  );

  // Practice mode active
  if (selectedLesson) {
    return (
      <LessonPractice
        lessonId={selectedLesson.id}
        lessonTitle={selectedLesson.title}
        isPremium={isPremium}
        onBack={() => setSelectedLesson(null)}
        onUpgrade={() => onUpgradeRequest?.()}
      />
    );
  }

  const modeConfig = mode === "toets"
    ? {
        emoji: "📝",
        title: "Toets per Les",
        subtitle: "Kies een les en doe 10 multiple-choice vragen",
        gradient: "linear-gradient(90deg,#3b82f6,#1e40af)",
        bg: isDark ? "from-blue-900/40 to-indigo-900/40" : "from-blue-100 to-indigo-100",
        text: isDark ? "text-blue-400" : "text-blue-600",
      }
    : {
        emoji: "✏️",
        title: "Oefening per Les",
        subtitle: "Kies een les en doe 10 invul/vertaal/volgorde-oefeningen",
        gradient: "linear-gradient(90deg,#a855f7,#7c3aed)",
        bg: isDark ? "from-purple-900/40 to-pink-900/40" : "from-purple-100 to-pink-100",
        text: isDark ? "text-purple-400" : "text-purple-600",
      };

  // ALL lessons are available — those with fixed questions get a special badge
  const allLessons = filtered;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className={`rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden bg-gradient-to-br ${modeConfig.bg}`}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-5xl">{modeConfig.emoji}</div>
            <div>
              <p className={`text-[10px] font-extrabold uppercase tracking-widest ${modeConfig.text}`}>
                {mode === "toets" ? "Test je kennis" : "Praktijk oefenen"}
              </p>
              <h1 className={`text-2xl sm:text-3xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`} style={{ fontFamily:"Georgia, serif" }}>
                {modeConfig.title}
              </h1>
            </div>
          </div>
          <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            {modeConfig.subtitle}
          </p>

          {/* Premium badge */}
          {isPremium ? (
            <div className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-xl w-fit ${isDark ? "bg-yellow-900/30 border border-yellow-700/40" : "bg-yellow-100 border border-yellow-200"}`}>
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className={`text-xs font-bold ${isDark ? "text-yellow-300" : "text-yellow-700"}`}>
                Premium actief — oneindig nieuwe AI-vragen
              </span>
            </div>
          ) : (
            <button
              onClick={() => onUpgradeRequest?.()}
              className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? "bg-yellow-900/20 border border-yellow-700/30 hover:bg-yellow-900/30" : "bg-yellow-50 border border-yellow-200 hover:bg-yellow-100"} transition`}
            >
              <Lock className="w-4 h-4 text-yellow-500" />
              <span className={`text-xs font-bold ${isDark ? "text-yellow-300" : "text-yellow-700"}`}>
                Upgrade voor oneindig nieuwe AI-vragen
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
        <input
          type="search"
          placeholder="Zoek een les…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`w-full pl-11 pr-10 py-3 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${isDark ? "bg-gray-900 border-gray-800 text-white placeholder-gray-600" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 shadow-sm"}`}
        />
        {search && (
          <button onClick={() => setSearch("")} className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ALL Lessons — same structure as Grammar tab */}
      {allLessons.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className={`w-4 h-4 ${modeConfig.text}`} />
            <p className={`text-xs font-extrabold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Alle artikelen ({allLessons.length})
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allLessons.map(lesson => {
              const realIdx = lessons.findIndex(l => l.id === lesson.id);
              const hasFixed = hasLessonQuestions(lesson.id);
              return (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedLesson({ id: lesson.id, title: lesson.title })}
                  className={`group relative flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-xl overflow-hidden ${
                    hasFixed
                      ? isDark
                        ? "bg-gray-900 border-gray-800 hover:border-indigo-600/60"
                        : "bg-white border-gray-200 hover:border-indigo-400 shadow-sm"
                      : isDark
                        ? "bg-gray-900/70 border-gray-800 hover:border-purple-600/40"
                        : "bg-white border-gray-200 hover:border-purple-300"
                  }`}
                >
                  {/* Top stripe — different for fixed vs auto */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: hasFixed ? modeConfig.gradient : "linear-gradient(90deg,#a855f7,#6366f1,#06b6d4)" }}
                  />
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-extrabold shrink-0 transition ${
                    isDark
                      ? "bg-gray-800 text-gray-300 group-hover:bg-indigo-600 group-hover:text-white"
                      : "bg-gray-100 text-gray-700 group-hover:bg-indigo-600 group-hover:text-white"
                  }`}>
                    {realIdx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                      {lesson.title}
                    </p>
                    <p className={`text-[11px] mt-1 flex items-center gap-1.5 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                      {hasFixed ? (
                        <>
                          <Trophy className="w-3 h-3 text-green-500" />
                          10 vaste {mode === "toets" ? "vragen" : "oefeningen"}
                        </>
                      ) : (
                        <>
                          <Crown className="w-3 h-3 text-purple-500" />
                          10 auto {mode === "toets" ? "vragen" : "oefeningen"}
                        </>
                      )}
                      {isPremium && " · ∞ AI"}
                    </p>
                  </div>
                  <ChevronRight className={`w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform ${modeConfig.text}`} />
                </button>
              );
            })}
          </div>
        </>
      )}

      {filtered.length === 0 && (
        <div className={`text-center py-16 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Geen lessen gevonden</p>
        </div>
      )}
    </div>
  );
}
