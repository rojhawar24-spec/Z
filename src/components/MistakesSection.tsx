/**
 * MistakesSection — "Fout-plek"
 * Toon alle fouten die de gebruiker heeft gemaakt en laat ze opnieuw oefenen.
 */

import { useState, useMemo, useEffect } from "react";
import { useApp } from "../context/AppContext";
import {
  AlertCircle, CheckCircle, XCircle, Sparkles,
  Trash2, Trophy, ArrowRight, Target, Award, Lightbulb
} from "lucide-react";
import {
  getMistakes, getAllMistakes, markMistakeAttempt, clearMistake,
  getMistakeStats, Mistake
} from "../utils/mistakes";
import { addXP } from "../auth";
import AIExplain from "./AIExplain";
import { shuffle } from "../utils/shuffle";

export default function MistakesSection() {
  const { language, theme, account, setAccount } = useApp();
  const isDark = theme === "dark";

  const [reseed, setReseed] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [aiTopic, setAiTopic] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [streakCorrect, setStreakCorrect] = useState(0);

  // Get mistakes for this language
  const mistakes = useMemo(() => {
    const list = filter === "pending" ? getMistakes(language) : getAllMistakes(language);
    return shuffle(list);
  }, [language, reseed, filter]);

  const stats = useMemo(() => getMistakeStats(language), [language, reseed]);

  const current = mistakes[currentIdx];

  // Reset on filter change
  useEffect(() => {
    setCurrentIdx(0);
    setUserAnswer("");
    setSelectedOption(null);
    setChecked(false);
  }, [filter, reseed]);

  if (mistakes.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className={`rounded-3xl p-10 text-center ${isDark ? "bg-gray-900 border border-gray-800" : "bg-white border border-gray-200 shadow-lg"}`}>
          <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-green-500/30">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className={`text-2xl font-extrabold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            Geen fouten! 🎉
          </h2>
          <p className={`text-base mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {filter === "pending"
              ? "Je hebt geen openstaande fouten — geweldig gedaan! Maak eerst toetsen of oefeningen om fouten te verzamelen."
              : "Je hebt nog geen fouten gemaakt. Begin met een toets of oefening!"}
          </p>
          {filter === "pending" && stats.mastered > 0 && (
            <button
              onClick={() => setFilter("all")}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${isDark ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-800"}`}
            >
              Bekijk afgeronde fouten ({stats.mastered})
            </button>
          )}
        </div>
      </div>
    );
  }

  const isToets = current.type === "toets";

  const checkAnswer = () => {
    let correct = false;
    if (isToets && selectedOption !== null && current.options) {
      correct = current.options[selectedOption] === current.correctAnswer;
    } else {
      const ua = userAnswer.trim().toLowerCase().replace(/[.,!?]/g, "");
      const ca = current.correctAnswer.trim().toLowerCase().replace(/[.,!?]/g, "");
      correct = ua === ca;
    }
    markMistakeAttempt(current.id, language, correct);
    setChecked(true);
    if (correct) {
      setStreakCorrect(s => s + 1);
      // Award XP for fixing a mistake (worth more than normal!)
      if (account) {
        try { setAccount(addXP(account.uid, 15)); } catch {}
      }
    } else {
      setStreakCorrect(0);
    }
  };

  const next = () => {
    if (currentIdx < mistakes.length - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      setReseed(r => r + 1);
      setCurrentIdx(0);
    }
    setUserAnswer("");
    setSelectedOption(null);
    setChecked(false);
  };

  const removeMistake = (m: Mistake) => {
    clearMistake(m.id, language);
    setReseed(r => r + 1);
  };

  const isCorrect = checked && (
    isToets && selectedOption !== null && current.options
      ? current.options[selectedOption] === current.correctAnswer
      : userAnswer.trim().toLowerCase().replace(/[.,!?]/g, "") === current.correctAnswer.trim().toLowerCase().replace(/[.,!?]/g, "")
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* AI Explain modal */}
      {aiTopic && <AIExplain topic={aiTopic} onClose={() => setAiTopic(null)} />}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-orange-400" : "text-orange-600"}`}>
              Fout-plek · Mistake Practice
            </p>
            <h1 className={`text-2xl sm:text-3xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Oefen je fouten
            </h1>
          </div>
        </div>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Hier vind je alle vragen die je fout hebt beantwoord. Beantwoord ze 2x correct om ze te 'beheersen'!
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        <div className={`rounded-2xl p-3 sm:p-4 border ${isDark ? "bg-orange-900/20 border-orange-800/30" : "bg-orange-50 border-orange-200"}`}>
          <p className={`text-xs font-bold ${isDark ? "text-orange-400" : "text-orange-600"}`}>Open</p>
          <p className={`text-2xl font-extrabold ${isDark ? "text-orange-300" : "text-orange-700"}`}>{stats.pending}</p>
        </div>
        <div className={`rounded-2xl p-3 sm:p-4 border ${isDark ? "bg-green-900/20 border-green-800/30" : "bg-green-50 border-green-200"}`}>
          <p className={`text-xs font-bold ${isDark ? "text-green-400" : "text-green-600"}`}>Beheerst</p>
          <p className={`text-2xl font-extrabold ${isDark ? "text-green-300" : "text-green-700"}`}>{stats.mastered}</p>
        </div>
        <div className={`rounded-2xl p-3 sm:p-4 border ${isDark ? "bg-yellow-900/20 border-yellow-800/30" : "bg-yellow-50 border-yellow-200"}`}>
          <p className={`text-xs font-bold ${isDark ? "text-yellow-400" : "text-yellow-600"}`}>Streak</p>
          <p className={`text-2xl font-extrabold ${isDark ? "text-yellow-300" : "text-yellow-700"}`}>🔥 {streakCorrect}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setFilter("pending")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
            filter === "pending"
              ? "bg-orange-600 text-white shadow-md"
              : isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Open ({stats.pending})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
            filter === "all"
              ? "bg-indigo-600 text-white shadow-md"
              : isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Alles ({stats.total})
        </button>
      </div>

      {/* Question card */}
      <div className={`rounded-3xl overflow-hidden shadow-xl border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
        {/* Header banner */}
        <div className="px-5 sm:px-7 py-4" style={{ background: "linear-gradient(135deg,#f97316,#dc2626)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white text-xs font-bold uppercase tracking-wider">
                {isToets ? "📝 Toets-vraag" : "✏️ Oefening-vraag"}
              </span>
              {current.lastCorrect && (
                <span className="text-[10px] bg-green-400/20 text-green-100 border border-green-400/30 px-2 py-0.5 rounded-full font-bold">
                  ✓ Vorige correct (1/2)
                </span>
              )}
            </div>
            <span className="text-white/80 text-xs">
              {currentIdx + 1} / {mistakes.length}
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          {/* Question */}
          <div className="flex items-start gap-3 mb-5">
            <AlertCircle className="w-6 h-6 text-orange-500 shrink-0 mt-1" />
            <h3 className={`flex-1 text-lg sm:text-xl font-bold leading-snug ${isDark ? "text-white" : "text-gray-900"}`}>
              {current.question}
            </h3>
            <button
              onClick={() => setAiTopic(current.question)}
              title="AI uitleg"
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all hover:scale-105 shadow-md shadow-purple-500/30"
            >
              <Sparkles className="w-3 h-3 text-yellow-300" />
              AI
            </button>
          </div>

          {/* Previous wrong answer reminder */}
          <div className={`rounded-xl p-3 mb-5 border ${isDark ? "bg-red-900/15 border-red-800/30" : "bg-red-50 border-red-200"}`}>
            <p className={`text-xs font-bold mb-1 ${isDark ? "text-red-400" : "text-red-600"}`}>
              ❌ Je had ingevuld:
            </p>
            <p className={`text-sm ${isDark ? "text-red-300" : "text-red-700"}`}>
              "{current.userAnswer}"
            </p>
          </div>

          {/* Answer area */}
          {isToets && current.options ? (
            <div className="space-y-2">
              {current.options.map((opt, i) => {
                const isSelected = selectedOption === i;
                const isCorrectOpt = checked && opt === current.correctAnswer;
                const isWrongSelected = checked && isSelected && !isCorrectOpt;

                return (
                  <button
                    key={i}
                    onClick={() => !checked && setSelectedOption(i)}
                    disabled={checked}
                    className={`w-full px-4 py-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                      isCorrectOpt
                        ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-300"
                        : isWrongSelected
                        ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300"
                        : isSelected
                        ? "border-indigo-500 bg-indigo-500/10"
                        : isDark
                        ? "border-gray-700 hover:border-gray-600 text-gray-200"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold ${
                        isCorrectOpt ? "bg-green-500 text-white" : isWrongSelected ? "bg-red-500 text-white" : isDark ? "bg-gray-800" : "bg-gray-100"
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCorrectOpt && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {isWrongSelected && <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                disabled={checked}
                onKeyDown={e => e.key === "Enter" && !checked && checkAnswer()}
                placeholder="Typ jouw antwoord…"
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                  checked
                    ? isCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200"
                }`}
              />
            </div>
          )}

          {/* Result feedback */}
          {checked && (
            <div className={`mt-5 p-4 rounded-2xl border ${
              isCorrect
                ? isDark ? "bg-green-900/20 border-green-700/40" : "bg-green-50 border-green-200"
                : isDark ? "bg-red-900/20 border-red-700/40" : "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-start gap-3">
                {isCorrect ? <CheckCircle className="w-6 h-6 text-green-500 shrink-0" /> : <XCircle className="w-6 h-6 text-red-500 shrink-0" />}
                <div>
                  <p className={`font-extrabold mb-1 ${isCorrect ? (isDark ? "text-green-300" : "text-green-700") : (isDark ? "text-red-300" : "text-red-700")}`}>
                    {isCorrect
                      ? (current.lastCorrect
                          ? "🎉 Beheerst! Deze fout is weg!"
                          : "✓ Correct! Nog 1x voor 'beheerst'.")
                      : "✗ Niet correct"}
                  </p>
                  <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    <strong>Juiste antwoord:</strong> {current.correctAnswer}
                  </p>
                  {current.explanation && (
                    <div className={`mt-2 flex items-start gap-2 text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                      <span>{current.explanation}</span>
                    </div>
                  )}
                  {isCorrect && <p className="text-xs mt-2 text-yellow-500 font-bold">⚡ +15 XP</p>}
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-5">
            {!checked ? (
              <button
                onClick={checkAnswer}
                disabled={isToets ? selectedOption === null : !userAnswer.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" />
                Controleer
              </button>
            ) : (
              <>
                <button
                  onClick={next}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  Volgende fout
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeMistake(current)}
                  title="Verwijder deze fout"
                  className={`px-3 py-3 rounded-xl transition border ${isDark ? "bg-gray-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400 border-gray-700" : "bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 border-gray-200"}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className={`mt-5 rounded-2xl p-4 flex items-start gap-3 ${isDark ? "bg-indigo-900/15 border border-indigo-800/30" : "bg-indigo-50 border border-indigo-100"}`}>
        <span className="text-xl">💡</span>
        <p className={`text-xs sm:text-sm ${isDark ? "text-indigo-300" : "text-indigo-700"}`}>
          <strong>Tip:</strong> Je moet een vraag <strong>2x achter elkaar correct</strong> beantwoorden om hem als 'beheerst' te markeren. Zo onthoud je het écht!
        </p>
      </div>
    </div>
  );
}
