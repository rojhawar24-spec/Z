/**
 * AISection — Premium AI Tutor Chat
 * 
 * ── FLOW ──
 * 1. Not premium → shows paywall with plan selection → PaymentModal
 * 2. Payment succeeds → activates premium → shows chat
 * 3. Premium → shows chat immediately
 * 
 * ── API KEY ──
 * First tries from .env (VITE_ANTHROPIC_KEY)
 * Falls back to hardcoded key for GitHub Pages deployment
 */

import { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { translations } from "../types";
import {
  Send, Bot, User, Loader2, Lock, Sparkles, Shield,
  AlertCircle, Clock, Zap, RefreshCw
} from "lucide-react";
import { formatExpiry } from "../auth";
import PaymentModal from "./PaymentModal";

// API key — fallback voor GitHub Pages. Lokaal via .env
const CLAUDE_API_KEY = import.meta.env.VITE_ANTHROPIC_KEY;
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AISectionProps {
  isPremium: boolean;
  premiumExpiry?: number;
  onSubscribe: (months: number) => void;
}

export default function AISection({ isPremium, premiumExpiry, onSubscribe }: AISectionProps) {
  const { language, theme, account } = useApp();
  const t = translations[language];
  const isDark = theme === "dark";

  const [chatKey, setChatKey] = useState(0);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [, setRetryCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const langName: Record<string, string> = {
    en: "English", nl: "Dutch", fr: "French", es: "Spanish", de: "German",
  };

  const systemPrompt = `You are "Lingo", a warm and friendly native ${langName[language]} speaker who is also an expert language teacher.

PERSONALITY:
- Talk like a real person — natural, warm, with personality.
- Use casual speech, contractions, and real-life examples.
- Show interest. Ask follow-up questions.
- React emotionally: "Oh nice!", "That's interesting!", "Haha, I get it!"

TEACHING:
- ALWAYS respond primarily in ${langName[language]}.
- Gently correct mistakes — only the most important ones.
- After correcting, explain WHY in 1 sentence.
- Suggest a more natural way to say something.
- Match the user's level.

CONVERSATION:
- Keep replies SHORT (2-4 sentences usually).
- Use 1-2 emojis per message.
- If user writes in their native language, gently respond in ${langName[language]}.
- Make it FUN — joke lightly, compliment progress.

You are a warm friend who happens to be an expert teacher.`;

  // Reset chat when premium is just activated
  useEffect(() => {
    if (isPremium && messages.length === 0) {
      setChatKey(k => k + 1);
      setInput("");
      setApiError("");

      const firstName = account?.displayName?.split(" ")[0] || "";
      const greetings: Record<string, string> = {
        en: `Hello${firstName ? " " + firstName : ""}! 👋 I'm Lingo, your personal AI ${langName[language]} tutor. Let's practice together!\n\nYou can ask me anything — grammar, vocabulary, have a conversation, or get corrections.\n\nWhat would you like to do today? 😊`,
        nl: `Hallo${firstName ? " " + firstName : ""}! 👋 Ik ben Lingo, je persoonlijke AI-taaldocent voor ${langName[language]}. Laten we samen oefenen!\n\nJe kunt me alles vragen — grammatica, woordenschat, een gesprek voeren, of zinnen laten corrigeren.\n\nWaar wil je mee beginnen? 😊`,
        fr: `Bonjour${firstName ? " " + firstName : ""}! 👋 Je suis Lingo, votre tuteur IA pour le ${langName[language]}. Pratiquons ensemble!\n\nPosez-moi des questions de grammaire, de vocabulaire, ou faisons simplement la conversation.\n\nPar quoi voulez-vous commencer? 😊`,
        es: `¡Hola${firstName ? " " + firstName : ""}! 👋 Soy Lingo, tu tutor de IA para ${langName[language]}. ¡Practiquemos juntos!\n\nPregúntame sobre gramática, vocabulario, o simplemente conversemos.\n\n¿Qué quieres practicar hoy? 😊`,
        de: `Hallo${firstName ? " " + firstName : ""}! 👋 Ich bin Lingo, dein persönlicher KI-Sprachtutor für ${langName[language]}. Lass uns üben!\n\nFrag mich alles über Grammatik, Vokabeln, oder lass uns einfach ein Gespräch führen.\n\nWomit möchtest du beginnen? 😊`,
      };
      setMessages([{ role: "assistant", content: greetings[language] || greetings.en }]);
    }
  }, [isPremium]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    // Check API key
    if (!CLAUDE_API_KEY || CLAUDE_API_KEY === "YOUR_ANTHROPIC_KEY_HERE") {
      setApiError("⚠️ AI is niet geconfigureerd. De API key ontbreekt in de .env.");
      return;
    }

    const userMsg = input.trim();
    setInput("");
    setApiError("");

    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
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
          max_tokens: 600,
          system: systemPrompt,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson.error?.message || errJson.type || `HTTP ${res.status}`;
        if (res.status === 401) throw new Error("🔑 API key is ongeldig. Neem contact op met de beheerder.");
        if (res.status === 429) throw new Error("⚠️ Te veel aanvragen. Wacht even en probeer opnieuw.");
        throw new Error(errMsg);
      }

      const data = await res.json();
      const reply = data.content?.[0]?.text;
      if (!reply) throw new Error("Leeg antwoord van AI. Probeer opnieuw.");

      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      setRetryCount(0);
    } catch (err: any) {
      setApiError(err.message || "Verbindingsfout. Controleer je internet en probeer opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleRetry = () => {
    setApiError("");
  };

  // ── PAYMENT MODAL ──
  if (showPayment) {
    return (
      <PaymentModal
        onClose={() => setShowPayment(false)}
        onSuccess={(months) => {
          onSubscribe(months);
          setShowPayment(false);
          setMessages([]);
          setApiError("");
          setRetryCount(0);
        }}
      />
    );
  }

  // ── NOT PREMIUM — Show paywall ──
  if (!isPremium) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="rounded-3xl overflow-hidden mb-6"
          style={{ background: "linear-gradient(145deg,#0f0c29,#302b63,#24243e)" }}
        >
          <div className="relative p-8 sm:p-12 text-center">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-white/15 shadow-2xl">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">{t.premiumRequired}</h2>
              <p className="text-purple-200 text-sm sm:text-base max-w-sm mx-auto leading-relaxed">{t.premiumDesc}</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className={`rounded-2xl p-5 mb-5 border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
          <h3 className={`font-bold mb-4 text-center ${isDark ? "text-white" : "text-gray-900"}`}>
            { { nl:"Wat zit er in Premium?", en:"What's included?", fr:"Qu'est-ce qui est inclus?", es:"¿Qué incluye?", de:"Was ist enthalten?" }[language] }
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon:"🤖", t: { nl:"Persoonlijke AI-tutor", en:"Personal AI tutor", fr:"Tuteur IA personnel", es:"Tutor IA personal", de:"Persönlicher KI-Tutor" } },
              { icon:"💬", t: { nl:"Echte gesprekken oefenen", en:"Practice real conversations", fr:"Pratiquer de vraies conversations", es:"Practicar conversaciones reales", de:"Echte Gespräche üben" } },
              { icon:"✏️", t: { nl:"Live grammaticacorrecties", en:"Live grammar corrections", fr:"Corrections grammaticales", es:"Correcciones en vivo", de:"Live-Grammatikkorrekturen" } },
              { icon:"🌍", t: { nl:"Alle 5 talen", en:"All 5 languages", fr:"5 langues incluses", es:"5 idiomas incluidos", de:"Alle 5 Sprachen" } },
              { icon:"⚡", t: { nl:"24/7 beschikbaar", en:"24/7 available", fr:"Disponible 24h/24", es:"Disponible 24/7", de:"24/7 verfügbar" } },
              { icon:"🎯", t: { nl:"Aangepast aan jouw niveau", en:"Adapts to your level", fr:"Adapté à votre niveau", es:"Adaptado a tu nivel", de:"Angepasst an dein Niveau" } },
            ].map((f, i) => (
              <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
                <span className="text-xl shrink-0">{f.icon}</span>
                <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{f.t[language]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Price + Pay button */}
        <div className={`rounded-2xl p-6 text-center border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
          <p className={`text-sm mb-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            { { nl:"Vanaf slechts", en:"Starting from only", fr:"À partir de seulement", es:"Desde solo", de:"Ab nur" }[language] }
          </p>
          <div className="flex items-baseline justify-center gap-1 mb-5">
            <span className={`text-5xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>$3</span>
            <span className={isDark ? "text-gray-400" : "text-gray-500"}>{t.perMonth}</span>
          </div>

          <button
            onClick={() => setShowPayment(true)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-500/25 text-base mb-4"
          >
            <Sparkles className="w-5 h-5 text-yellow-300" />
            {t.subscribe}
          </button>

          {/* Payment method logos */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#003087] bg-[#003087]/10 px-3 py-1.5 rounded-full border border-[#003087]/20">PayPal</div>
            {["Visa","Mastercard","Amex","iDEAL"].map(c => (
              <span key={c} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${isDark ? "border-gray-700 text-gray-500" : "border-gray-200 text-gray-400"}`}>{c}</span>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            <p className={`text-xs ${isDark ? "text-gray-600" : "text-gray-400"}`}>
              { { nl:"Veilig betalen · Geld direct naar PayPal wallet", en:"Secure payment · Money goes to your PayPal", fr:"Paiement sécurisé · Argent vers votre PayPal", es:"Pago seguro · Dinero a tu PayPal", de:"Sichere Zahlung · Geld geht zu PayPal" }[language] }
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── PREMIUM — Chat UI ──
  return (
    <div key={chatKey} className="max-w-3xl mx-auto px-3 sm:px-4 py-3 flex flex-col" style={{ height: "calc(100vh - 64px)" }}>

      {/* Chat header */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-3 border shrink-0 ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
          <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className={`font-bold text-sm sm:text-base ${isDark ? "text-white" : "text-gray-900"}`}>
              AI {langName[language]} Tutor
            </h2>
            <span className="flex items-center gap-1 text-[10px] bg-green-500/12 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-bold">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              ONLINE
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className={`w-3 h-3 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
            <p className={`text-xs truncate ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              { { nl:"Actief tot", en:"Active until", fr:"Actif jusqu'au", es:"Activo hasta", de:"Aktiv bis" }[language] }
              {" "}{premiumExpiry ? formatExpiry(premiumExpiry) : "—"}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-[10px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 px-2 py-1 rounded-full font-bold">⭐ PREMIUM</span>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto rounded-2xl p-3 sm:p-4 space-y-3 mb-3 ${isDark ? "bg-gray-900/80 border border-gray-800" : "bg-gray-50 border border-gray-200"}`}>
        {messages.length === 0 && !loading && !apiError && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bot className={`w-10 h-10 mx-auto mb-3 ${isDark ? "text-gray-700" : "text-gray-300"}`} />
              <p className={`text-sm ${isDark ? "text-gray-600" : "text-gray-400"}`}>AI start op…</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 sm:gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-md">
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
            )}
            <div className={`max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-sm shadow-md"
                : isDark
                  ? "bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700/50"
                  : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"
            }`}>
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 mt-1 overflow-hidden shadow-md">
                {account?.photoURL
                  ? <img src={account.photoURL} alt="" className="w-full h-full object-cover" />
                  : <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                }
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-md">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className={`px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2 ${isDark ? "bg-gray-800 border border-gray-700/50" : "bg-white border border-gray-100 shadow-sm"}`}>
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Lingo denkt na…</span>
            </div>
          </div>
        )}

        {apiError && (
          <div className={`flex items-start gap-3 mx-auto text-sm px-4 py-3 rounded-xl border max-w-md ${isDark ? "bg-red-900/20 border-red-800/40 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{apiError}</span>
              <button onClick={handleRetry} className="mt-2 flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition">
                <RefreshCw className="w-3 h-3" /> Opnieuw proberen
              </button>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`flex gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-2xl border shrink-0 ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={{ nl:"Typ je bericht…", en:"Type your message…", fr:"Tapez votre message…", es:"Escribe tu mensaje…", de:"Schreib deine Nachricht…" }[language]}
          rows={1}
          className={`flex-1 resize-none text-sm focus:outline-none bg-transparent leading-relaxed ${isDark ? "text-white placeholder-gray-600" : "text-gray-900 placeholder-gray-400"}`}
          style={{ maxHeight: "100px" }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all hover:scale-105 shrink-0 self-end shadow-md"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
      <p className={`text-center text-[11px] mt-1.5 flex items-center justify-center gap-1 ${isDark ? "text-gray-700" : "text-gray-400"}`}>
        <Zap className="w-3 h-3" />
        Enter ↵ { { nl:"versturen", en:"to send", fr:"envoyer", es:"enviar", de:"senden" }[language] } · Shift+Enter { { nl:"nieuwe regel", en:"new line", fr:"nouvelle ligne", es:"nueva línea", de:"neue Zeile" }[language] }
      </p>
    </div>
  );
}
