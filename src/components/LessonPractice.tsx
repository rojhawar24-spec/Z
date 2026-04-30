import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import {
  ArrowLeft, CheckCircle, XCircle, ChevronRight, RefreshCw,
  Sparkles, Loader2, Crown, Trophy, Award, AlertCircle
} from "lucide-react";
import {
  getLessonQuiz, hasLessonQuestions, LessonQuiz
} from "../data/lessonQuestions";
import { grammarData } from "../data/grammarData";
import { autoGenerateQuiz } from "../utils/autoQuestions";
// import { generateAIQuestions } from "../utils/aiQuestionGen";
import { shuffle } from "../utils/shuffle";
import { addMistake } from "../utils/mistakes";
import { addXP } from "../auth";
import AIExplain from "./AIExplain";

interface LessonPracticeProps {
  lessonId: string;
  lessonTitle: string;
  isPremium: boolean;
  onBack: () => void;
  onUpgrade: () => void;
}

export default function LessonPractice({
  lessonId, lessonTitle, isPremium, onBack, onUpgrade
}: LessonPracticeProps) {
  const { language, theme, account, setAccount } = useApp();
  const isDark = theme === "dark";

  const [reseed, setReseed] = useState(0);
  const [aiQuiz, setAiQuiz] = useState<LessonQuiz[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiTopic, setAiTopic] = useState<string | null>(null);

  const baseList: any[] = useMemo(() => {
    if (hasLessonQuestions(lessonId)) {
      const fixed = getLessonQuiz(lessonId);
      if (fixed.length > 0) return shuffle(fixed as any[]);
    }
    const lesson = grammarData[language].find(l => l.id === lessonId);
    if (lesson) return autoGenerateQuiz(lesson);
    return [];
  }, [lessonId, reseed, language]);

  const questions: any[] = aiQuiz ?? baseList;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = questions[currentIdx];

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className={`rounded-3xl p-10 text-center ${isDark ? "bg-gray-900 border border-gray-800" : "bg-white border border-gray-200 shadow-lg"}`}>
          <div className="text-5xl mb-4">😕</div>
          <h2 className={`text-2xl font-extrabold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Geen vragen</h2>
          <button onClick={onBack} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl">← Terug</button>
        </div>
      </div>
    );
  }

  const generateAI = async () => {
    if (!isPremium) { onUpgrade(); return; }
    setAiLoading(true); setAiError("");
    try {
      setAiError("AI vragen genereren is tijdelijk uitgeschakeld. Gebruik de standaard toetsvragen.");
    } catch (err: any) {
      setAiError(err.message || "Er ging iets mis");
    } finally { setAiLoading(false); }
  };

  const reset = () => { setReseed(r => r + 1); setAiQuiz(null); setCurrentIdx(0); setSelected(null); setChecked(false); setScore(0); setFinished(false); };

  const checkAnswer = () => {
    if (selected === null) return;
    const correct = selected === current.correct;
    setChecked(true);
    if (correct) {
      setScore(s => s + 1);
      if (account) { try { setAccount(addXP(account.uid, 5)); } catch {} }
    } else {
      addMistake({ id: current.id, language, type: "toets", question: current.question, correctAnswer: current.options[current.correct], userAnswer: current.options[selected], explanation: current.explanation, options: current.options });
    }
  };

  const next = () => {
    if (currentIdx < questions.length - 1) { setCurrentIdx(i => i + 1); setSelected(null); setChecked(false); }
    else { setFinished(true); }
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const grade = pct >= 80 ? "🏆" : pct >= 60 ? "⭐" : "📖";
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        {aiTopic && <AIExplain topic={aiTopic} onClose={() => setAiTopic(null)} />}
        <div className={`rounded-3xl p-8 sm:p-10 text-center shadow-2xl ${isDark ? "bg-gray-900 border border-gray-800" : "bg-white border border-gray-200"}`}>
          <div className="text-7xl mb-3">{grade}</div>
          <h2 className={`text-3xl font-extrabold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>{pct >= 80 ? "Uitstekend!" : pct >= 60 ? "Goed gedaan!" : "Blijf oefenen!"}</h2>
          <p className={`text-lg mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{score}/{questions.length} correct ({pct}%)</p>
          <div className="w-32 h-32 mx-auto mb-6 relative">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke={isDark ? "#1f2937" : "#e5e7eb"} strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke={pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444"} strokeWidth="10" strokeDasharray={`${(pct / 100) * 251.2} 251.2`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center"><span className={`text-3xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>{pct}%</span></div>
          </div>
          <button onClick={reset} className="flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl mx-auto mb-3">
            <RefreshCw className="w-4 h-4" /> Opnieuw
          </button>
          {isPremium ? (
            <button onClick={generateAI} disabled={aiLoading} className="flex items-center gap-2 py-3 px-6 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-2xl mx-auto">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-200" />} Nieuwe AI vragen
            </button>
          ) : (
            <button onClick={onUpgrade} className="flex items-center gap-2 py-3 px-6 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-2xl mx-auto">
              <Crown className="w-4 h-4" /> Premium voor ∞ vragen
            </button>
          )}
          <button onClick={onBack} className={`block mt-4 text-sm font-medium mx-auto ${isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}>← Terug naar les</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {aiTopic && <AIExplain topic={aiTopic} onClose={() => setAiTopic(null)} />}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
          <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Terug</span>
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>📝 Toets</p>
          <h1 className={`font-extrabold text-base sm:text-xl truncate ${isDark ? "text-white" : "text-gray-900"}`}>{lessonTitle}</h1>
        </div>
        {isPremium ? (
          <button onClick={generateAI} disabled={aiLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-md disabled:opacity-60">
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} AI
          </button>
        ) : (
          <button onClick={onUpgrade} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border ${isDark ? "border-yellow-700/40 text-yellow-400" : "border-yellow-300 text-yellow-700"}`}>
            <Crown className="w-3.5 h-3.5" /> Premium
          </button>
        )}
      </div>

      <div className={`h-2 rounded-full mb-2 ${isDark ? "bg-gray-800" : "bg-gray-200"}`}>
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
      </div>
      <div className="flex justify-between text-xs mb-5">
        <span className={isDark ? "text-gray-500" : "text-gray-400"}>Vraag {currentIdx + 1} / {questions.length}</span>
        <span className={isDark ? "text-green-400" : "text-green-600"}>✓ {score} correct</span>
      </div>

      {aiError && <div className={`mb-4 flex items-start gap-2 px-4 py-3 rounded-xl border text-sm ${isDark ? "bg-red-900/20 border-red-800/40 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{aiError}</div>}

      {aiLoading && (
        <div className={`mb-4 flex items-center justify-center gap-3 py-8 rounded-2xl ${isDark ? "bg-yellow-900/15 border border-yellow-800/30" : "bg-yellow-50 border border-yellow-200"}`}>
          <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
          <span className={`text-sm font-bold ${isDark ? "text-yellow-300" : "text-yellow-700"}`}>AI maakt nieuwe vragen...</span>
        </div>
      )}

      {current && !aiLoading && (
        <div className={`rounded-3xl overflow-hidden shadow-xl border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
          <div className="h-1.5" style={{ background: "linear-gradient(90deg,#4f46e5,#7c3aed,#ec4899)" }} />
          <div className="p-5 sm:p-7">
            <div className="flex items-start gap-3 mb-5">
              <Trophy className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
              <h3 className={`flex-1 text-lg sm:text-xl font-bold leading-snug ${isDark ? "text-white" : "text-gray-900"}`}>{current.question}</h3>
              <button onClick={() => setAiTopic(current.question)} className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md">
                <Sparkles className="w-3 h-3 text-yellow-300" /> AI
              </button>
            </div>

            <div className="space-y-2">
              {current.options.map((opt: string, i: number) => {
                const isSel = selected === i;
                const isCor = checked && i === current.correct;
                const isWrong = checked && isSel && !isCor;
                return (
                  <button key={i} onClick={() => !checked && setSelected(i)} disabled={checked}
                    className={`w-full px-4 py-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                      isCor ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-300"
                      : isWrong ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300"
                      : isSel ? "border-indigo-500 bg-indigo-500/10"
                      : isDark ? "border-gray-700 hover:border-gray-600 text-gray-200" : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold ${isCor ? "bg-green-500 text-white" : isWrong ? "bg-red-500 text-white" : isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCor && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {isWrong && <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {checked && (
              <div className={`mt-5 p-4 rounded-2xl border ${selected === current.correct ? isDark ? "bg-green-900/20 border-green-700/40" : "bg-green-50 border-green-200" : isDark ? "bg-red-900/20 border-red-700/40" : "bg-red-50 border-red-200"}`}>
                <p className={`font-extrabold mb-1 ${selected === current.correct ? isDark ? "text-green-300" : "text-green-700" : isDark ? "text-red-300" : "text-red-700"}`}>
                  {selected === current.correct ? "✓ Correct!" : "✗ Niet correct"}
                </p>
                {current.explanation && <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>💡 {current.explanation}</p>}
              </div>
            )}

            <div className="mt-5">
              {!checked ? (
                <button onClick={checkAnswer} disabled={selected === null} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                  <Award className="w-4 h-4" /> Controleer
                </button>
              ) : (
                <button onClick={next} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                  {currentIdx === questions.length - 1 ? "Klaar 🏁" : "Volgende"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!isPremium && (
        <div className={`mt-5 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:scale-[1.01] transition ${isDark ? "bg-yellow-900/15 border border-yellow-700/30" : "bg-yellow-50 border border-yellow-200"}`} onClick={onUpgrade}>
          <Crown className="w-6 h-6 text-yellow-500 shrink-0" />
          <p className={`text-sm ${isDark ? "text-yellow-300" : "text-yellow-700"}`}>
            <strong>💎 Premium ($3/maand):</strong> Krijg ONEINDIG nieuwe vragen door AI gegenereerd voor elke les!
          </p>
        </div>
      )}
    </div>
  );
}
