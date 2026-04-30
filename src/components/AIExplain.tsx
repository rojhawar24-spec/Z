/**
 * AIExplain — Complete AI uitleg in één mooie scroll
 * Volgorde: Uitleg (lang) → Voorbeelden → Korte samenvatting → Pro regels
 */

import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import {
  Sparkles, Loader2, AlertCircle, X, BookOpen,
  Zap, MessageSquare, Award, ArrowUp
} from "lucide-react";

const CLAUDE_API_KEY = import.meta.env.VITE_ANTHROPIC_KEY as string;

interface AIExplainProps {
  topic: string;
  onClose: () => void;
}

interface Section {
  long: string;
  examples: string;
  short: string;
  pro: string;
}

const langName: Record<string, string> = {
  en: "English", nl: "Dutch", fr: "French", es: "Spanish", de: "German",
};

export default function AIExplain({ topic, onClose }: AIExplainProps) {
  const { theme, language } = useApp();
  const isDark = theme === "dark";

  const [sections, setSections] = useState<Section | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setHasFetched] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-fetch on mount
  useEffect(() => { fetchExplanation(); }, []);

  const fetchExplanation = async () => {
    setLoading(true);
    setError("");
    try {
      const langN = langName[language] || "Dutch";

      const prompt = `Je bent een ervaren ${langN} taaldocent die zeer uitgebreide en duidelijke uitleg geeft. Onderwerp: "${topic}"

Geef je antwoord in EXACT dit JSON formaat (geen extra tekst):
{
  "long": "Een ZEER UITGEBREIDE uitleg in HET ${langN === "Dutch" ? "Nederlands" : langN}. Minimaal 8-12 alinea's. Behandel:\\n- Wat is het precies?\\n- Waarom bestaat het?\\n- Hoe werkt het stap voor stap?\\n- Alle uitzonderingen en valkuilen\\n- Vergelijkingen met andere talen\\n- Historische achtergrond indien relevant\\n- Veelgemaakte fouten en hoe ze te vermijden\\n- Praktische tips voor leerlingen\\n\\nGebruik korte alinea's (gescheiden door dubbele newlines \\\\n\\\\n). Schrijf duidelijk en menselijk, alsof je het uitlegt aan een vriend. Wees grondig en educatief.",

  "examples": "Geef 12 voorbeeldzinnen, elk op een nieuwe regel. Format: '${langN === "Dutch" ? "NL zin" : langN + " zin"} → English translation'. Begin simpel en bouw op naar gevorderd. Toon variatie in gebruik. Geen nummering vooraan.",

  "short": "Een KORTE krachtige samenvatting in 2-3 zinnen die de absolute essentie vat. Voor wie snel wil leren of herhalen.",

  "pro": "12 PRO-regels en gevorderde valkuilen die zelfs gevorderde studenten vaak fout doen. Format: één regel per regel, beginnend met '• '. Geef praktische tips, uitzonderingen en geheime trucs."
}

KRITISCH: Antwoord ALLEEN met geldige JSON, geen markdown, geen extra tekst.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-calls": "true",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 8000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data.content?.[0]?.text || "";

      let parsed: Section;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        parsed = {
          long: text,
          short: "AI gaf onvolledige output. Bekijk lange uitleg.",
          examples: "Geen voorbeelden beschikbaar.",
          pro: "Geen pro regels beschikbaar.",
        };
      }

      setSections(parsed);
      setHasFetched(true);
    } catch (err: any) {
      setError(err.message || "Er ging iets mis bij het ophalen.");
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      setShowScrollTop(scrollRef.current.scrollTop > 300);
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`relative w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col ${
          isDark ? "bg-gray-950 border border-gray-800" : "bg-white"
        }`}
        style={{ maxHeight: "95dvh" }}
      >

        {/* ── HEADER ── */}
        <div
          className="relative shrink-0 px-5 sm:px-7 py-5 flex items-center gap-4"
          style={{
            background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 30%,#4c1d95 65%,#7c3aed 100%)"
          }}
        >
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative w-14 h-14 bg-white/15 border border-white/25 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
            <Sparkles className="w-7 h-7 text-yellow-300" />
          </div>
          <div className="relative flex-1 min-w-0">
            <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-0.5">
              ✨ AI Uitleg · Volledig
            </p>
            <h2 className="text-white font-extrabold text-lg sm:text-2xl leading-tight">
              {topic}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="relative w-10 h-10 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── QUICK NAV BAR ── */}
        {sections && !loading && (
          <div className={`shrink-0 flex items-center gap-1.5 px-4 sm:px-6 py-2.5 border-b overflow-x-auto ${isDark ? "bg-gray-900 border-gray-800" : "bg-gray-50 border-gray-200"}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider mr-1 shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              Spring naar:
            </span>
            {[
              { id: "uitleg", label: "Uitleg", icon: BookOpen, color: "text-indigo-400" },
              { id: "voorbeelden", label: "Voorbeelden", icon: MessageSquare, color: "text-purple-400" },
              { id: "kort", label: "Kort", icon: Zap, color: "text-blue-400" },
              { id: "pro", label: "Pro", icon: Award, color: "text-yellow-400" },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 shrink-0 ${
                  isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                <item.icon className={`w-3 h-3 ${item.color}`} />
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* ── INITIAL LOADING ── */}
        {loading && !sections && (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-indigo-500/40 animate-pulse">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <Loader2 className="absolute -top-3 -right-3 w-9 h-9 text-yellow-400 animate-spin" />
            </div>
            <p className={`text-xl font-extrabold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              AI denkt na…
            </p>
            <p className={`text-sm text-center max-w-md ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Een complete uitleg wordt voor je gemaakt:<br/>
              <span className="font-semibold">📖 Lange uitleg → 💬 Voorbeelden → ⚡ Samenvatting → 🏆 Pro regels</span>
            </p>
            <div className="flex gap-2 mt-6">
              {[0, 0.2, 0.4].map(d => (
                <div key={d} className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className={`flex items-start gap-3 p-5 rounded-2xl border max-w-md ${isDark ? "bg-red-900/20 border-red-800/40 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Er ging iets mis</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchExplanation}
              className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition"
            >
              🔄 Opnieuw proberen
            </button>
          </div>
        )}

        {/* ── ALL SECTIONS IN ONE SCROLL ── */}
        {sections && (
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto relative"
          >
            <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-10">

              {/* ─── 1. LANGE UITLEG ─── */}
              <section id="uitleg">
                {/* Section header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? "bg-indigo-900/40 border border-indigo-700/40" : "bg-indigo-100 border border-indigo-200"}`}>
                    <BookOpen className={`w-6 h-6 ${isDark ? "text-indigo-300" : "text-indigo-600"}`} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                      Sectie 1
                    </p>
                    <h3 className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>
                      📖 Volledige Uitleg
                    </h3>
                  </div>
                </div>

                {/* Big content card */}
                <div className={`rounded-3xl overflow-hidden shadow-xl ${isDark ? "border border-indigo-500/20" : "border border-indigo-100"}`}>
                  {/* Decorative top */}
                  <div className="h-2" style={{ background: "linear-gradient(90deg,#4f46e5,#7c3aed,#9333ea)" }} />

                  <div className={`px-6 sm:px-10 py-8 ${isDark ? "bg-gray-900" : "bg-white"}`}>
                    {sections.long.split(/\n\n+/).map((paragraph, i) => (
                      <p
                        key={i}
                        className={`text-base sm:text-lg leading-[1.8] mb-5 last:mb-0 ${isDark ? "text-gray-200" : "text-gray-800"}`}
                      >
                        {paragraph.split('\n').map((line, li) => (
                          <span key={li}>
                            {line}
                            {li < paragraph.split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    ))}
                  </div>
                </div>
              </section>

              {/* ─── 2. VOORBEELDEN ─── */}
              <section id="voorbeelden">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? "bg-purple-900/40 border border-purple-700/40" : "bg-purple-100 border border-purple-200"}`}>
                    <MessageSquare className={`w-6 h-6 ${isDark ? "text-purple-300" : "text-purple-600"}`} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-purple-400" : "text-purple-600"}`}>
                      Sectie 2
                    </p>
                    <h3 className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>
                      💬 Voorbeelden in actie
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sections.examples.split(/\n+/).filter(l => l.trim()).map((line, i) => {
                    const cleaned = line.replace(/^[•\-\*\d.\s]+/, "").trim();
                    const parts = cleaned.split(/\s*[→\->]+\s*/);
                    const sentence = parts[0]?.trim() || cleaned;
                    const translation = parts[1]?.trim() || "";
                    return (
                      <div
                        key={i}
                        className={`group rounded-2xl overflow-hidden border transition-all hover:scale-[1.02] hover:shadow-xl ${
                          isDark ? "border-gray-800 bg-gray-900 hover:border-purple-600/50" : "border-gray-200 bg-white hover:border-purple-300 shadow-sm"
                        }`}
                      >
                        {/* Header with number */}
                        <div className={`flex items-center gap-2 px-4 pt-3 ${isDark ? "" : ""}`}>
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-extrabold ${isDark ? "bg-purple-900/60 text-purple-300" : "bg-purple-100 text-purple-700"}`}>
                            {i + 1}
                          </span>
                          <div className={`flex-1 h-px ${isDark ? "bg-gray-800" : "bg-gray-100"}`} />
                        </div>
                        {/* Sentence */}
                        <div className="px-4 py-3">
                          <p className={`text-base font-bold leading-snug ${isDark ? "text-white" : "text-gray-900"}`}>
                            {sentence}
                          </p>
                          {translation && (
                            <p className={`text-sm mt-2 italic flex items-start gap-1.5 ${isDark ? "text-purple-300/70" : "text-purple-600/80"}`}>
                              <span className="text-xs mt-0.5">↳</span>
                              {translation}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ─── 3. KORTE SAMENVATTING ─── */}
              <section id="kort">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? "bg-blue-900/40 border border-blue-700/40" : "bg-blue-100 border border-blue-200"}`}>
                    <Zap className={`w-6 h-6 ${isDark ? "text-blue-300" : "text-blue-600"}`} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                      Sectie 3
                    </p>
                    <h3 className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>
                      ⚡ Korte Samenvatting
                    </h3>
                  </div>
                </div>

                <div
                  className={`rounded-3xl p-7 sm:p-9 relative overflow-hidden border-2 ${
                    isDark ? "border-blue-700/40" : "border-blue-200"
                  }`}
                  style={{
                    background: isDark
                      ? "linear-gradient(135deg, rgba(30,58,138,0.3) 0%, rgba(30,27,75,0.4) 100%)"
                      : "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)"
                  }}
                >
                  {/* Quote mark */}
                  <div className={`absolute top-3 left-4 text-7xl leading-none font-serif opacity-20 ${isDark ? "text-blue-300" : "text-blue-500"}`}>
                    "
                  </div>
                  <p className={`relative text-lg sm:text-xl leading-relaxed font-medium pl-6 sm:pl-10 ${isDark ? "text-blue-100" : "text-blue-900"}`}>
                    {sections.short}
                  </p>
                </div>
              </section>

              {/* ─── 4. PRO REGELS ─── */}
              <section id="pro">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? "bg-yellow-900/30 border border-yellow-700/40" : "bg-yellow-100 border border-yellow-200"}`}>
                    <Award className={`w-6 h-6 ${isDark ? "text-yellow-300" : "text-yellow-600"}`} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-yellow-400" : "text-yellow-600"}`}>
                      Sectie 4
                    </p>
                    <h3 className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>
                      🏆 Pro Regels
                    </h3>
                  </div>
                </div>

                {/* Pro intro card */}
                <div className={`mb-4 rounded-2xl p-5 border-l-4 border-yellow-500 ${isDark ? "bg-yellow-900/15" : "bg-yellow-50"}`}>
                  <p className={`font-bold text-sm mb-1 ${isDark ? "text-yellow-300" : "text-yellow-800"}`}>
                    💡 Voor gevorderden
                  </p>
                  <p className={`text-sm ${isDark ? "text-yellow-200/80" : "text-yellow-700"}`}>
                    Deze regels worden vaak fout gemaakt. Leer ze uit je hoofd om écht goed te worden!
                  </p>
                </div>

                {/* Pro rules list */}
                <div className="space-y-2.5">
                  {sections.pro.split(/\n+/).filter(l => l.trim()).map((line, i) => {
                    const cleaned = line.replace(/^[•\-\*\d.\s]+/, "").trim();
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.005] ${
                          isDark
                            ? "bg-gray-900 border-gray-800 hover:border-yellow-600/40"
                            : "bg-white border-gray-200 hover:border-yellow-300 shadow-sm hover:shadow-md"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 mt-0.5 shadow-md ${
                            isDark
                              ? "bg-gradient-to-br from-yellow-500 to-orange-600 text-yellow-900 shadow-yellow-500/30"
                              : "bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-yellow-500/30"
                          }`}
                        >
                          {i + 1}
                        </div>
                        <p className={`flex-1 text-sm sm:text-base leading-relaxed font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                          {cleaned}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Footer */}
              <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                <p className={`text-xs flex items-center gap-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  Gegenereerd door Claude AI
                </p>
                <button
                  onClick={fetchExplanation}
                  disabled={loading}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                    isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  } disabled:opacity-50`}
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" /> : "🔄 "}
                  Opnieuw genereren
                </button>
              </div>
            </div>

            {/* Scroll-to-top button */}
            {showScrollTop && (
              <button
                onClick={scrollToTop}
                className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 hover:scale-110 active:scale-95 transition-all z-10"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
