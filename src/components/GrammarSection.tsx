import { useState, useMemo, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { grammarData, GrammarLesson } from "../data/grammarData";
import { addXP } from "../auth";
import {
  BookOpen, Lightbulb, Search, ChevronRight, ArrowLeft,
  CheckCircle, X, Award, ChevronLeft, Sparkles, MessageSquare,
  Quote, ArrowUp, Star, Zap, Trophy, AlertTriangle, Code, Crown
} from "lucide-react";
import AIExplain from "./AIExplain";
import LessonPractice from "./LessonPractice";
import { hasLessonQuestions } from "../data/lessonQuestions";

interface GrammarSectionProps {
  onUpgradeRequest?: () => void;
}

export default function GrammarSection({ onUpgradeRequest }: GrammarSectionProps = {}) {
  const { language, theme, account, setAccount } = useApp();
  const lessons = grammarData[language];
  const isDark = theme === "dark";
  const isPremium = account?.isPremium || false;

  const [search, setSearch] = useState("");
  const [openLesson, setOpenLesson] = useState<GrammarLesson | null>(null);
  const [practiceMode, setPracticeMode] = useState<"toets" | null>(null);
  const [aiTopic, setAiTopic] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(`ll_completed_${language}`) || "[]")); }
    catch { return new Set(); }
  });

  const langLabels: Record<string, string> = {
    en: "English Grammar", nl: "Nederlandse Grammatica",
    fr: "Grammaire Française", es: "Gramática Española", de: "Deutsche Grammatik",
  };

  const filtered = useMemo(() =>
    lessons.filter(l =>
      !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.explanation.toLowerCase().includes(search.toLowerCase()) ||
      l.rules.some(r => r.toLowerCase().includes(search.toLowerCase()))
    ), [lessons, search]);

  const completedCount = [...completedIds].filter(id => id.startsWith(language + "-")).length;
  const progress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  const markComplete = (id: string) => {
    if (completedIds.has(id)) return;
    const newSet = new Set(completedIds);
    newSet.add(id);
    setCompletedIds(newSet);
    localStorage.setItem(`ll_completed_${language}`, JSON.stringify([...newSet]));
    if (account) {
      try { setAccount(addXP(account.uid, 20)); } catch {}
    }
  };

  // Reset scroll when opening new lesson
  useEffect(() => {
    if (openLesson && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "auto" });
      setShowScrollTop(false);
    }
  }, [openLesson?.id]);

  const handleScroll = () => {
    if (scrollRef.current) {
      setShowScrollTop(scrollRef.current.scrollTop > 400);
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ─── LESSON FULL-SCREEN VIEW (book-like design) ───
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ─── PRACTICE MODE (full-screen quiz/exercise) ───
  if (openLesson && practiceMode) {
    return (
      <LessonPractice
        lessonId={openLesson.id}
        lessonTitle={openLesson.title}
        isPremium={isPremium}
        onBack={() => setPracticeMode(null)}
        onUpgrade={() => onUpgradeRequest?.()}
      />
    );
  }

  if (openLesson) {
    const lessonIdx = lessons.findIndex(l => l.id === openLesson.id);
    const prevLesson = lessonIdx > 0 ? lessons[lessonIdx - 1] : null;
    const nextLesson = lessonIdx < lessons.length - 1 ? lessons[lessonIdx + 1] : null;
    const isDone = completedIds.has(openLesson.id);
    const pct = Math.round(((lessonIdx + 1) / lessons.length) * 100);



    return (
      <div className={`fixed inset-0 z-[100] flex flex-col ${isDark ? "bg-gray-950" : "bg-gradient-to-br from-amber-50 via-white to-blue-50"}`}>

        {/* AI Explain modal */}
        {aiTopic && <AIExplain topic={aiTopic} onClose={() => setAiTopic(null)} />}

        {/* ── COMPACT TOP BAR ── */}
        <div className={`shrink-0 flex items-center gap-2 px-3 sm:px-6 h-14 border-b backdrop-blur-xl ${isDark ? "bg-gray-900/95 border-gray-800" : "bg-white/95 border-gray-200 shadow-sm"}`}>
          <button
            onClick={() => setOpenLesson(null)}
            className={`flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shrink-0 ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Terug</span>
          </button>

          <div className="flex-1 min-w-0 text-center px-2">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              {langLabels[language]} · {lessonIdx + 1}/{lessons.length}
            </p>
          </div>

          {/* AI button */}
          <button
            onClick={() => setAiTopic(openLesson.title)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-extrabold shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all hover:scale-105 active:scale-95 shadow-md shadow-purple-500/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span className="hidden sm:inline">AI uitleg</span>
            <span className="sm:hidden">AI</span>
          </button>

          {/* Done */}
          {isDone ? (
            <div className={`flex items-center gap-1 h-9 px-2.5 rounded-xl text-xs font-bold shrink-0 ${isDark ? "bg-green-900/40 text-green-400 border border-green-700/40" : "bg-green-50 text-green-700 border border-green-200"}`}>
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Klaar</span>
            </div>
          ) : (
            <button
              onClick={() => markComplete(openLesson.id)}
              className="flex items-center gap-1 h-9 px-2.5 rounded-xl text-xs font-bold shrink-0 bg-green-600 hover:bg-green-500 text-white transition-all hover:scale-105 shadow-md shadow-green-500/25"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+20 XP</span>
              <span className="sm:hidden">XP</span>
            </button>
          )}
        </div>

        {/* Progress line */}
        <div className={`shrink-0 h-1 ${isDark ? "bg-gray-800" : "bg-gray-200"}`}>
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* ── SCROLLABLE BOOK CONTENT ── */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          <article className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12">

            {/* ═══ BOOK HEADER (Hero) ═══ */}
            <header className="mb-12 text-center">
              {/* Chapter label */}
              <div className="inline-flex items-center gap-2 mb-4">
                <div className={`w-12 h-px ${isDark ? "bg-indigo-500/40" : "bg-indigo-300"}`} />
                <span className={`text-xs font-extrabold uppercase tracking-[0.3em] ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                  Hoofdstuk {lessonIdx + 1}
                </span>
                <div className={`w-12 h-px ${isDark ? "bg-indigo-500/40" : "bg-indigo-300"}`} />
              </div>

              {/* Title */}
              <h1
                className={`font-extrabold leading-tight mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
                style={{
                  fontSize: "clamp(2rem, 5vw, 3.5rem)",
                  fontFamily: 'Georgia, "Times New Roman", serif'
                }}
              >
                {openLesson.title}
              </h1>

              {/* Decorative dots */}
              <div className="flex items-center justify-center gap-2 mb-2">
                {[1,2,3].map(i => (
                  <span key={i} className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-indigo-500" : "bg-indigo-400"}`} />
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center gap-3 text-xs flex-wrap mt-4">
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold ${isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  <Lightbulb className="w-3 h-3 text-yellow-400" />
                  {openLesson.rules.length} regels
                </span>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold ${isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  <MessageSquare className="w-3 h-3 text-purple-400" />
                  {openLesson.examples.length} voorbeelden
                </span>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold ${isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  <Star className="w-3 h-3 text-orange-400" />
                  +20 XP
                </span>
              </div>
            </header>

            {/* ════════════════════════════════════════════
                NEW STRUCTURED LAYOUT
                ① Formula  ② Important Note  ③ Long Explanation
                ④ Rules  ⑤ Examples  ⑥ Short Summary  ⑦ Pro Tip
                ════════════════════════════════════════════ */}

            {/* ─── ① FORMULA ─── */}
            {openLesson.formula && (
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isDark ? "bg-gradient-to-br from-cyan-600 to-blue-700" : "bg-gradient-to-br from-cyan-500 to-blue-600"}`}>
                    <Code className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>
                      ① Formule
                    </p>
                    <h2 className={`text-xl sm:text-2xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`} style={{ fontFamily: 'Georgia, serif' }}>
                      Formula
                    </h2>
                  </div>
                </div>
                <div
                  className={`relative rounded-2xl px-6 py-6 sm:px-8 sm:py-7 border-l-[6px] border-cyan-500 ${isDark ? "bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-700/30" : "bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200"}`}
                >
                  <p
                    className={`text-center font-extrabold tracking-wide ${isDark ? "text-cyan-200" : "text-cyan-900"}`}
                    style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)", fontFamily: '"Courier New", monospace' }}
                  >
                    {openLesson.formula}
                  </p>
                </div>
              </section>
            )}

            {/* ─── ② IMPORTANT NOTE ─── */}
            {openLesson.important && (
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isDark ? "bg-gradient-to-br from-red-600 to-orange-700" : "bg-gradient-to-br from-red-500 to-orange-600"}`}>
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-red-400" : "text-red-600"}`}>
                      ② Belangrijk
                    </p>
                    <h2 className={`text-xl sm:text-2xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`} style={{ fontFamily: 'Georgia, serif' }}>
                      Important Note
                    </h2>
                  </div>
                </div>
                <div
                  className={`rounded-2xl p-5 sm:p-6 border-l-[6px] border-red-500 ${isDark ? "bg-red-900/15 border border-red-800/30" : "bg-red-50 border border-red-200"}`}
                >
                  <div className="flex gap-3">
                    <span className={`text-2xl shrink-0 ${isDark ? "text-red-400" : "text-red-500"}`}>⚠️</span>
                    <p className={`leading-relaxed font-semibold ${isDark ? "text-red-200" : "text-red-900"}`}
                      style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)", lineHeight: "1.65" }}
                    >
                      {openLesson.important}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* ─── ③ LONG EXPLANATION (book style) ─── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${isDark ? "bg-gradient-to-br from-indigo-600 to-purple-700" : "bg-gradient-to-br from-indigo-500 to-purple-600"}`}>
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                    ③ Volledige theorie
                  </p>
                  <h2 className={`text-2xl sm:text-3xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`} style={{ fontFamily: 'Georgia, serif' }}>
                    Lange Uitleg
                  </h2>
                </div>
              </div>

              <div className={`relative rounded-3xl overflow-hidden shadow-2xl ${isDark ? "bg-gray-900/60 border border-gray-800" : "bg-white border border-gray-100"}`}>
                <div className="h-1.5" style={{ background: "linear-gradient(90deg,#4f46e5,#7c3aed,#ec4899)" }} />
                <div className="px-6 sm:px-12 lg:px-16 py-10 relative">
                  <Quote className={`absolute top-6 right-6 w-24 h-24 ${isDark ? "text-indigo-500/5" : "text-indigo-500/10"}`} strokeWidth={1} />

                  {(() => {
                    const longText = openLesson.longExplanation || openLesson.explanation;
                    const paragraphs = longText.split(/\n\n+/);
                    return paragraphs.map((para, i) => (
                      <p
                        key={i}
                        className={`mb-6 last:mb-0 ${isDark ? "text-gray-200" : "text-gray-800"}`}
                        style={{
                          fontSize: "clamp(1rem, 1.6vw, 1.2rem)",
                          lineHeight: "1.85",
                          fontFamily: 'Georgia, "Times New Roman", serif',
                        }}
                      >
                        {i === 0 ? (
                          <>
                            <span
                              className={`float-left font-extrabold mr-3 mt-1 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                              style={{ fontSize: "4.5rem", lineHeight: "0.85", fontFamily: 'Georgia, serif' }}
                            >
                              {para.trim().charAt(0)}
                            </span>
                            {para.trim().substring(1)}
                          </>
                        ) : para}
                      </p>
                    ));
                  })()}

                  <div className="flex items-center justify-center gap-3 mt-8 pt-8 border-t border-dashed" style={{ borderColor: "rgba(99,102,241,0.2)" }}>
                    <span className={`text-xl ${isDark ? "text-indigo-400" : "text-indigo-500"}`}>❦</span>
                    <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-600" : "text-gray-400"}`}>Einde uitleg</span>
                    <span className={`text-xl ${isDark ? "text-indigo-400" : "text-indigo-500"}`}>❦</span>
                  </div>
                </div>
              </div>

              {/* Rules under long explanation */}
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? "bg-yellow-900/30 border border-yellow-700/40" : "bg-yellow-100 border border-yellow-200"}`}>
                    <Lightbulb className={`w-4 h-4 ${isDark ? "text-yellow-400" : "text-yellow-600"}`} />
                  </div>
                  <h3 className={`text-lg font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>
                    Belangrijkste regels
                  </h3>
                </div>
                <div className={`rounded-2xl overflow-hidden border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
                  {openLesson.rules.map((rule, i) => (
                    <div key={i} className={`flex items-start gap-4 p-5 ${i !== openLesson.rules.length - 1 ? `border-b ${isDark ? "border-gray-800" : "border-gray-100"}` : ""}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 mt-0.5 shadow-md ${isDark ? "bg-gradient-to-br from-yellow-500 to-orange-600 text-yellow-900" : "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"}`}>
                        {i + 1}
                      </div>
                      <p className={`flex-1 text-base leading-relaxed font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}>{rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ─── ④ EXAMPLES ─── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${isDark ? "bg-gradient-to-br from-purple-600 to-pink-700" : "bg-gradient-to-br from-purple-500 to-pink-600"}`}>
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-purple-400" : "text-purple-600"}`}>
                    ④ In de praktijk
                  </p>
                  <h2 className={`text-2xl sm:text-3xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`} style={{ fontFamily: 'Georgia, serif' }}>
                    Voorbeelden
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {openLesson.examples.map((ex, i) => (
                  <div
                    key={i}
                    className={`group rounded-2xl overflow-hidden border-2 transition-all hover:scale-[1.02] hover:shadow-xl ${isDark ? "bg-gray-900 border-gray-800 hover:border-purple-600/50" : "bg-white border-gray-100 hover:border-purple-300 shadow-sm"}`}
                  >
                    <div className="flex items-center justify-between px-5 pt-4 pb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold ${isDark ? "bg-purple-900/60 text-purple-300" : "bg-purple-100 text-purple-700"}`}>{i + 1}</span>
                        <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-purple-400" : "text-purple-600"}`}>Voorbeeld</span>
                      </div>
                      <Quote className={`w-4 h-4 ${isDark ? "text-purple-700" : "text-purple-300"}`} />
                    </div>
                    <div className="px-5 pb-3">
                      <p className={`font-bold leading-snug ${isDark ? "text-white" : "text-gray-900"}`} style={{ fontSize: "1.125rem", fontFamily: 'Georgia, serif' }}>
                        {ex.sentence}
                      </p>
                    </div>
                    <div className={`px-5 py-3 border-t ${isDark ? "bg-gray-800/40 border-gray-800" : "bg-purple-50/60 border-purple-100"}`}>
                      <div className="flex items-start gap-2">
                        <span className={`text-xs font-bold mt-0.5 ${isDark ? "text-purple-500" : "text-purple-400"}`}>↳</span>
                        <p className={`text-sm italic ${isDark ? "text-gray-400" : "text-gray-600"}`}>{ex.translation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── ⑤ SHORT SUMMARY ─── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${isDark ? "bg-gradient-to-br from-blue-600 to-cyan-700" : "bg-gradient-to-br from-blue-500 to-cyan-600"}`}>
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                    ⑤ Snel onthouden
                  </p>
                  <h2 className={`text-2xl sm:text-3xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`} style={{ fontFamily: 'Georgia, serif' }}>
                    Korte Uitleg
                  </h2>
                </div>
              </div>
              <div
                className={`relative rounded-3xl p-7 sm:p-10 overflow-hidden border-2 ${isDark ? "border-blue-700/40" : "border-blue-200"}`}
                style={{
                  background: isDark
                    ? "linear-gradient(135deg, rgba(30,58,138,0.25), rgba(8,47,73,0.3))"
                    : "linear-gradient(135deg, #dbeafe, #cffafe)"
                }}
              >
                <Quote className={`absolute top-4 left-4 w-12 h-12 opacity-20 ${isDark ? "text-blue-400" : "text-blue-500"}`} strokeWidth={1.5} />
                <p className={`text-center font-bold leading-relaxed px-6 sm:px-12 ${isDark ? "text-blue-100" : "text-blue-900"}`}
                  style={{ fontSize: "clamp(1.05rem, 2.2vw, 1.4rem)", fontFamily: 'Georgia, serif' }}
                >
                  {openLesson.explanation}
                </p>
                <Quote className={`absolute bottom-4 right-4 w-12 h-12 opacity-20 rotate-180 ${isDark ? "text-blue-400" : "text-blue-500"}`} strokeWidth={1.5} />
              </div>
            </section>

            {/* ─── ⑥ PRO TIP ─── */}
            {openLesson.proTip && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${isDark ? "bg-gradient-to-br from-yellow-500 to-amber-600" : "bg-gradient-to-br from-yellow-400 to-amber-500"}`}>
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-yellow-400" : "text-yellow-600"}`}>
                      ⑥ Voor experts
                    </p>
                    <h2 className={`text-2xl sm:text-3xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`} style={{ fontFamily: 'Georgia, serif' }}>
                      Pro Uitleg
                    </h2>
                  </div>
                </div>
                <div
                  className={`relative rounded-3xl p-6 sm:p-8 overflow-hidden border-2 ${isDark ? "border-yellow-700/40" : "border-yellow-300"}`}
                  style={{
                    background: isDark
                      ? "linear-gradient(135deg, rgba(120,53,15,0.2), rgba(146,64,14,0.15))"
                      : "linear-gradient(135deg, #fef3c7, #fde68a)"
                  }}
                >
                  <div className="absolute top-4 right-4 text-3xl opacity-30">👑</div>
                  <div className="flex gap-4 items-start">
                    <span className="text-3xl shrink-0">💡</span>
                    <p className={`flex-1 leading-relaxed font-medium ${isDark ? "text-yellow-100" : "text-yellow-900"}`}
                      style={{ fontSize: "clamp(1rem, 1.7vw, 1.15rem)", lineHeight: "1.75" }}
                    >
                      {openLesson.proTip}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* ═══ PRACTICE BUTTONS — Toets & Oefening ═══ */}
            {hasLessonQuestions(openLesson.id) && (
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${isDark ? "bg-gradient-to-br from-green-600 to-emerald-700" : "bg-gradient-to-br from-green-500 to-emerald-600"}`}>
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-green-400" : "text-green-600"}`}>
                      ⑦ Test je kennis
                    </p>
                    <h2 className={`text-2xl sm:text-3xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`} style={{ fontFamily:'Georgia, serif' }}>
                      Oefen deze les
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* TOETS */}
                  <button
                    onClick={() => setPracticeMode("toets")}
                    className={`group relative rounded-3xl overflow-hidden transition-all hover:scale-[1.03] active:scale-[0.98] hover:shadow-2xl ${isDark ? "bg-gray-900 border border-gray-800 hover:border-blue-600/60" : "bg-white border border-gray-200 hover:border-blue-400 shadow-sm"}`}
                  >
                    <div className="h-1.5" style={{ background:"linear-gradient(90deg,#3b82f6,#1e40af)" }} />
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-2xl shadow-md shadow-blue-500/30">
                          📝
                        </div>
                        <div className="text-left flex-1">
                          <p className={`font-extrabold text-base ${isDark ? "text-white" : "text-gray-900"}`}>Toets</p>
                          <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>10 multiple-choice vragen</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] px-2 py-1 rounded-full font-bold ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700"}`}>
                          🎯 +5 XP per correct
                        </span>
                        <ChevronRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                      </div>
                      {isPremium && (
                        <p className={`mt-3 text-[10px] flex items-center gap-1 font-bold ${isDark ? "text-yellow-400" : "text-yellow-600"}`}>
                          <Crown className="w-3 h-3" /> Premium: oneindig nieuwe AI-vragen
                        </p>
                      )}
                    </div>
                  </button>

                </div>

                {/* Premium upsell banner */}
                {!isPremium && (
                  <div
                    onClick={() => onUpgradeRequest?.()}
                    className={`mt-4 rounded-2xl p-4 cursor-pointer hover:scale-[1.01] transition-all flex items-center gap-3 ${isDark ? "bg-yellow-900/15 border border-yellow-700/30 hover:bg-yellow-900/25" : "bg-yellow-50 border border-yellow-200 hover:bg-yellow-100"}`}
                  >
                    <Crown className="w-7 h-7 text-yellow-500 shrink-0" />
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${isDark ? "text-yellow-300" : "text-yellow-700"}`}>
                        💎 Krijg ONEINDIG nieuwe AI-vragen!
                      </p>
                      <p className={`text-xs ${isDark ? "text-yellow-400/80" : "text-yellow-700/80"}`}>
                        Premium ($3/maand) → AI maakt elke keer verse vragen voor jou
                      </p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${isDark ? "text-yellow-400" : "text-yellow-600"}`} />
                  </div>
                )}
              </section>
            )}

            {/* ═══ AI EXPLAIN CTA ═══ */}
            <section className="mb-12">
              <div
                className="rounded-3xl p-6 sm:p-8 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 35%,#4c1d95 70%,#7c3aed 100%)"
                }}
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />

                <div className="relative flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                  <div className="w-16 h-16 bg-white/15 border border-white/25 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                    <Sparkles className="w-8 h-8 text-yellow-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-extrabold text-xl mb-1">
                      Wil je nóg meer weten?
                    </h3>
                    <p className="text-purple-200 text-sm">
                      Krijg een complete AI uitleg met extra voorbeelden, uitzonderingen en pro tips!
                    </p>
                  </div>
                  <button
                    onClick={() => setAiTopic(openLesson.title)}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 font-extrabold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shrink-0"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    AI uitleg
                  </button>
                </div>
              </div>
            </section>

            {/* ═══ COMPLETE BUTTON ═══ */}
            {!isDone ? (
              <div className={`rounded-3xl p-8 text-center border-2 border-dashed ${isDark ? "border-green-600/30 bg-green-900/10" : "border-green-300 bg-green-50/50"}`}>
                <Trophy className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-green-400" : "text-green-500"}`} />
                <h3 className={`text-xl font-extrabold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Klaar met deze les?
                </h3>
                <p className={`text-sm mb-5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Markeer als voltooid en verdien 20 XP!
                </p>
                <button
                  onClick={() => markComplete(openLesson.id)}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-extrabold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-green-500/30"
                >
                  <Award className="w-5 h-5" />
                  Voltooid! +20 XP
                </button>
              </div>
            ) : (
              <div className={`rounded-3xl p-6 text-center ${isDark ? "bg-green-900/20 border border-green-700/30" : "bg-green-50 border border-green-200"}`}>
                <CheckCircle className={`w-10 h-10 mx-auto mb-2 ${isDark ? "text-green-400" : "text-green-500"}`} />
                <p className={`font-bold ${isDark ? "text-green-300" : "text-green-700"}`}>
                  🎉 Les voltooid! +20 XP verdiend
                </p>
              </div>
            )}
          </article>

          {/* Scroll to top */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-24 right-6 w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 hover:scale-110 active:scale-95 transition-all z-20"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ── BOTTOM NAVIGATION ── */}
        <div className={`shrink-0 flex items-center justify-between gap-3 px-4 sm:px-8 py-3 border-t backdrop-blur-xl ${isDark ? "bg-gray-900/95 border-gray-800" : "bg-white/95 border-gray-200 shadow-lg"}`}>
          <button
            onClick={() => prevLesson && setOpenLesson(prevLesson)}
            disabled={!prevLesson}
            className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Vorige</span>
          </button>

          <div className="flex flex-col items-center gap-1.5">
            <span className={`text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              {lessonIdx + 1} / {lessons.length}
            </span>
            <div className={`h-1.5 w-32 rounded-full overflow-hidden ${isDark ? "bg-gray-800" : "bg-gray-200"}`}>
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <button
            onClick={() => {
              if (nextLesson) setOpenLesson(nextLesson);
              else setOpenLesson(null);
            }}
            className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 ${
              nextLesson
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/30"
                : isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span className="hidden sm:inline">{nextLesson ? "Volgende" : "Klaar"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ─── LESSON LIST VIEW (also redesigned) ───
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* ═══ HERO HEADER ═══ */}
      <div className={`relative rounded-3xl overflow-hidden mb-8 p-6 sm:p-8`}
        style={{
          background: isDark
            ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)"
            : "linear-gradient(135deg, #ede9fe 0%, #fce7f3 100%)"
        }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className={`w-5 h-5 ${isDark ? "text-indigo-300" : "text-indigo-600"}`} />
            <span className={`text-xs font-extrabold uppercase tracking-widest ${isDark ? "text-indigo-300" : "text-indigo-700"}`}>
              {langLabels[language]}
            </span>
          </div>
          <h1
            className={`font-extrabold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontFamily: 'Georgia, serif' }}
          >
            📚 Volledige Grammatica Cursus
          </h1>
          <p className={`text-sm sm:text-base mb-5 ${isDark ? "text-purple-200" : "text-gray-700"}`}>
            {lessons.length} lessen · {completedCount} voltooid · {account?.xp || 0} XP verdiend
          </p>

          {/* Progress */}
          <div className={`h-3 rounded-full overflow-hidden mb-2 ${isDark ? "bg-white/10" : "bg-white/60"}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className={isDark ? "text-purple-300/70" : "text-gray-600"}>Voortgang</span>
            <span className={`font-extrabold ${isDark ? "text-yellow-300" : "text-orange-600"}`}>{progress}%</span>
          </div>
        </div>
      </div>

      {progress === 100 && (
        <div className={`mb-6 flex items-center gap-3 p-4 rounded-2xl ${isDark ? "bg-green-900/20 border border-green-700/30" : "bg-green-50 border border-green-200"}`}>
          <Trophy className="w-7 h-7 text-yellow-500" />
          <p className={`text-sm font-bold ${isDark ? "text-green-300" : "text-green-700"}`}>
            🏆 Alle lessen voltooid! Geweldig gedaan!
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
        <input
          type="search"
          placeholder={{ nl:"Zoek een les…", en:"Search a lesson…", fr:"Rechercher…", es:"Buscar…", de:"Suchen…" }[language]}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`w-full pl-11 pr-10 py-3 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${isDark ? "bg-gray-900 border-gray-800 text-white placeholder-gray-600 focus:border-indigo-600" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-400 shadow-sm"}`}
        />
        {search && (
          <button onClick={() => setSearch("")} className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ═══ LESSON CARDS ═══ */}
      {filtered.length === 0 ? (
        <div className={`text-center py-20 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Geen resultaten voor "{search}"</p>
          <button onClick={() => setSearch("")} className="mt-2 text-indigo-400 text-sm hover:underline">Wis zoekopdracht</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lesson) => {
            const done = completedIds.has(lesson.id);
            const realIdx = lessons.findIndex(l => l.id === lesson.id);
            return (
              <div
                key={lesson.id}
                onClick={() => setOpenLesson(lesson)}
                className={`group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-200 hover:scale-[1.03] active:scale-[0.99] hover:shadow-2xl relative ${
                  done
                    ? isDark ? "bg-green-900/10 border-green-700/30 hover:border-green-600/60" : "bg-green-50/80 border-green-200 hover:border-green-400"
                    : isDark ? "bg-gray-900 border-gray-800 hover:border-indigo-600/60 hover:shadow-indigo-500/20" : "bg-white border-gray-200 hover:border-indigo-400/60 hover:shadow-indigo-200/40"
                }`}
              >
                {/* Top accent bar */}
                <div
                  className="h-1.5"
                  style={{
                    background: done
                      ? "linear-gradient(90deg,#22c55e,#10b981)"
                      : "linear-gradient(90deg,#4f46e5,#7c3aed,#ec4899)"
                  }}
                />

                {/* Card content */}
                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-extrabold shrink-0 transition-all ${
                      done
                        ? "bg-green-500 text-white shadow-md shadow-green-500/30"
                        : isDark
                        ? "bg-gray-800 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-md"
                        : "bg-gray-100 text-gray-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-md"
                    }`}>
                      {done ? <CheckCircle className="w-6 h-6" /> : realIdx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-0.5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                        Hoofdstuk {realIdx + 1}
                      </p>
                      <h3
                        className={`font-bold text-base leading-tight line-clamp-2 ${isDark ? "text-white" : "text-gray-900"}`}
                        style={{ fontFamily: 'Georgia, serif' }}
                      >
                        {lesson.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className={`text-xs leading-relaxed line-clamp-3 mb-3 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                    {lesson.explanation}
                  </p>

                  {/* Footer row */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-dashed"
                    style={{ borderColor: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.2)" }}
                  >
                    <div className="flex gap-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700"}`}>
                        {lesson.rules.length} regels
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isDark ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-700"}`}>
                        {lesson.examples.length} ex.
                      </span>
                    </div>
                    {done ? (
                      <span className="text-[10px] text-green-400 font-extrabold">✓ +20 XP</span>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setAiTopic(lesson.title); }}
                        title="AI uitleg"
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all hover:scale-110 shadow-md shadow-purple-500/30"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                        AI
                      </button>
                    )}
                  </div>
                </div>

                {/* Hover indicator */}
                <div className={`absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Modal */}
      {aiTopic && <AIExplain topic={aiTopic} onClose={() => setAiTopic(null)} />}
    </div>
  );
}
