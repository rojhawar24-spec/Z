/**
 * PaymentModal — LinguaLearn
 * ──────────────────────────
 * Echte PayPal betaling via @paypal/react-paypal-js
 * Client ID geladen uit .env (nooit hardcoded)
 * Geld gaat direct naar PayPal account: rojhawar24@gmail.com
 *
 * Ondersteunde betaalmethoden:
 *   • PayPal wallet (saldo)
 *   • Creditcard (Visa, Mastercard, Amex)
 *   • Debetkaart
 *   • iDEAL, Bancontact (afhankelijk van land koper)
 */

import { useState } from "react";
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import { useApp } from "../context/AppContext";
import { Language } from "../types";
import {
  X, Check, Sparkles, Shield, ChevronRight,
  Loader2, Calendar, AlertCircle, Lock,
} from "lucide-react";

/* ── Helpers ── */
const L = (map: Record<Language, string>, lang: Language): string =>
  map[lang] ?? map["nl"];

// PayPal Client ID — fallback voor GitHub Pages. Lokaal via .env
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
interface Plan {
  months: number;
  label: string;
  price: number;
  priceStr: string;
  badge: string | null;
  save: string | null;
  perMonth: string;
}

interface PaymentModalProps {
  onClose: () => void;
  onSuccess: (months: number) => void;
}

/* ── Inner component that uses PayPal hooks ── */
function PayPalCheckout({
  plan,
  language,
  isDark,
  onSuccess,
  onBack,
}: {
  plan: Plan;
  language: Language;
  isDark: boolean;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState("");
  const [payDone, setPayDone] = useState(false);

  if (payDone) {
    return (
      <div className="py-8 text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
          <Check className="w-9 h-9 text-white" strokeWidth={3} />
        </div>
        <h3 className={`text-lg font-extrabold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
          {L({ nl:"Betaling geslaagd! 🎉", en:"Payment successful! 🎉", fr:"Paiement réussi! 🎉", es:"¡Pago exitoso! 🎉", de:"Zahlung erfolgreich! 🎉" }, language)}
        </h3>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          {L({ nl:"Je AI-tutor wordt nu geactiveerd…", en:"Activating your AI tutor…", fr:"Activation de votre tuteur IA…", es:"Activando tu tutor IA…", de:"KI-Tutor wird aktiviert…" }, language)}
        </p>
        <div className="flex justify-center mt-4">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Order summary */}
      <div className={`rounded-2xl px-4 py-4 border flex items-center justify-between ${isDark ? "bg-gray-800/60 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
        <div>
          <p className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
            LinguaLearn Premium · {plan.label}
          </p>
          <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            AI {L({ nl:"Taaldocent", en:"Language Tutor", fr:"Tuteur", es:"Tutor", de:"Sprachtutor" }, language)}
            {plan.months > 1 && ` · ${plan.perMonth}`}
          </p>
        </div>
        <p className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>{plan.priceStr}</p>
      </div>

      {/* Error */}
      {payError && (
        <div className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-sm ${isDark ? "bg-red-900/20 border-red-800/40 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{payError}</span>
        </div>
      )}

      {/* PayPal buttons area */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-gray-800/40 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className={`px-4 pt-4 pb-2 text-center`}>
          <p className={`text-xs font-semibold mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {L({ nl:"Kies hoe je wil betalen", en:"Choose how to pay", fr:"Choisissez comment payer", es:"Elige cómo pagar", de:"Zahlungsmethode wählen" }, language)}
          </p>
        </div>

        <div className="px-4 pb-4">
          {/* Loading state */}
          {isPending && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {L({ nl:"PayPal laden…", en:"Loading PayPal…", fr:"Chargement PayPal…", es:"Cargando PayPal…", de:"PayPal lädt…" }, language)}
              </span>
            </div>
          )}

          {/* SDK load error */}
          {isRejected && (
            <div className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-sm mb-3 ${isDark ? "bg-red-900/20 border-red-800/40 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {L({ nl:"PayPal kon niet laden. Controleer je internet.", en:"PayPal failed to load. Check your internet.", fr:"PayPal n'a pas pu charger. Vérifiez votre connexion.", es:"PayPal no pudo cargar. Verifica tu internet.", de:"PayPal konnte nicht geladen werden." }, language)}
              </span>
            </div>
          )}

          {/* Processing overlay */}
          {processing && (
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                {L({ nl:"Betaling verwerken…", en:"Processing payment…", fr:"Traitement en cours…", es:"Procesando pago…", de:"Zahlung wird verarbeitet…" }, language)}
              </span>
            </div>
          )}

          {/* Real PayPal Buttons — shows PayPal + Credit/Debit Card */}
          {!processing && !isPending && !isRejected && (
            <PayPalButtons
              style={{
                layout: "vertical",   // stacks PayPal + Card buttons
                color: "gold",        // PayPal gold button
                shape: "rect",
                label: "pay",
                height: 50,
              }}
              // fundingSource undefined = show ALL methods automatically
              // PayPal SDK decides which are eligible per country:
              // PayPal wallet, credit card, debit card, iDEAL, Bancontact, etc.
              createOrder={(_data, actions) => {
                setPayError("");
                return actions.order.create({
                  intent: "CAPTURE",
                  purchase_units: [
                    {
                      amount: {
                        currency_code: "USD",
                        value: plan.price.toFixed(2),
                      },
                      description: `LinguaLearn Premium – ${plan.label} – AI Tutor`,
                      // ✅ Geld gaat naar jouw PayPal account (rojhawar24@gmail.com)
                    },
                  ],
                  application_context: {
                    brand_name: "LinguaLearn",
                    shipping_preference: "NO_SHIPPING",
                    user_action: "PAY_NOW",
                    return_url: window.location.href,
                    cancel_url: window.location.href,
                  },
                });
              }}
              onApprove={async (_data, actions) => {
                setProcessing(true);
                setPayError("");
                try {
                  if (!actions.order) throw new Error("No order actions");
                  const details = await actions.order.capture();
                  if (details.status === "COMPLETED") {
                    setPayDone(true);
                    // Activate premium after short delay (show success first)
                    setTimeout(() => {
                      onSuccess();
                    }, 2500);
                  } else {
                    throw new Error(`Order status: ${details.status}`);
                  }
                } catch (err: unknown) {
                  console.error("PayPal capture error:", err);
                  setPayError(L({
                    nl: "Betaling kon niet worden verwerkt. Probeer opnieuw.",
                    en: "Payment could not be processed. Please try again.",
                    fr: "Le paiement n'a pas pu être traité. Réessayez.",
                    es: "El pago no se pudo procesar. Inténtalo de nuevo.",
                    de: "Zahlung konnte nicht verarbeitet werden. Erneut versuchen.",
                  }, language));
                } finally {
                  setProcessing(false);
                }
              }}
              onError={(err) => {
                console.error("PayPal SDK error:", err);
                setPayError(L({
                  nl: "Er is een fout opgetreden. Controleer je kaartgegevens en probeer opnieuw.",
                  en: "An error occurred. Check your card details and try again.",
                  fr: "Une erreur s'est produite. Vérifiez vos données et réessayez.",
                  es: "Ocurrió un error. Verifica tus datos e inténtalo de nuevo.",
                  de: "Ein Fehler ist aufgetreten. Kartendaten prüfen und erneut versuchen.",
                }, language));
                setProcessing(false);
              }}
              onCancel={() => {
                setPayError(L({
                  nl: "Betaling geannuleerd. Probeer opnieuw als je wil.",
                  en: "Payment cancelled. Try again when you're ready.",
                  fr: "Paiement annulé. Réessayez quand vous voulez.",
                  es: "Pago cancelado. Inténtalo de nuevo cuando quieras.",
                  de: "Zahlung abgebrochen. Erneut versuchen wenn gewünscht.",
                }, language));
              }}
              onInit={() => {
                // Buttons initialized successfully
                setPayError("");
              }}
            />
          )}
        </div>

        {/* Accepted cards row */}
        <div className={`flex items-center justify-center gap-2 flex-wrap px-4 py-3 border-t ${isDark ? "border-gray-700 bg-gray-800/20" : "border-gray-100 bg-gray-50"}`}>
          {/* PayPal badge */}
          <div className="flex items-center gap-1 text-[10px] font-bold text-[#003087] bg-[#003087]/8 px-2 py-1 rounded border border-[#003087]/15">
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#003087]">
              <path d="M7.5 21.5H3.3L5.8 5h4.2c2.3 0 4 .5 5 1.6 1 1 1.3 2.4.9 4.2-.4 1.8-1.3 3.2-2.7 4.1-1.4.9-3 1.3-5 1.3H7l-.5 5.3z"/>
            </svg>
            PayPal
          </div>
          {/* Card network badges */}
          {["Visa", "Mastercard", "Amex", "Maestro"].map(c => (
            <span key={c} className={`text-[10px] font-bold px-2 py-1 rounded border ${isDark ? "border-gray-600 text-gray-500" : "border-gray-200 text-gray-400"}`}>
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${isDark ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
      >
        ← {L({ nl:"Terug naar plannen", en:"Back to plans", fr:"Retour aux plans", es:"Volver a los planes", de:"Zurück zu den Plänen" }, language)}
      </button>

      {/* Security footer */}
      <div className="flex items-center justify-center gap-2">
        <Lock className="w-3.5 h-3.5 text-green-500 shrink-0" />
        <p className={`text-[11px] text-center ${isDark ? "text-gray-600" : "text-gray-400"}`}>
          {L({
            nl: "256-bit SSL · Veilig via PayPal · Geld direct naar jouw account",
            en: "256-bit SSL · Secured by PayPal · Money goes to your account",
            fr: "SSL 256-bit · Sécurisé par PayPal · Argent sur votre compte",
            es: "SSL 256-bit · Seguro por PayPal · Dinero en tu cuenta",
            de: "256-bit SSL · Gesichert durch PayPal · Geld auf Ihr Konto",
          }, language)}
        </p>
      </div>
    </div>
  );
}

/* ── Main modal component ── */
export default function PaymentModal({ onClose, onSuccess }: PaymentModalProps) {
  const { theme, language } = useApp();
  const isDark = theme === "dark";

  const [selectedMonths, setSelectedMonths] = useState(1);
  const [step, setStep] = useState<"plan" | "pay">("plan");

  const plans: Plan[] = [
    {
      months: 1,
      label: L({ nl:"1 Maand", en:"1 Month", fr:"1 Mois", es:"1 Mes", de:"1 Monat" }, language),
      price: 3.00,
      priceStr: "$3",
      badge: null,
      save: null,
      perMonth: "$3/mo",
    },
    {
      months: 3,
      label: L({ nl:"3 Maanden", en:"3 Months", fr:"3 Mois", es:"3 Meses", de:"3 Monate" }, language),
      price: 8.00,
      priceStr: "$8",
      badge: L({ nl:"Populair 🔥", en:"Popular 🔥", fr:"Populaire 🔥", es:"Popular 🔥", de:"Beliebt 🔥" }, language),
      save: L({ nl:"Bespaar 11%", en:"Save 11%", fr:"Économisez 11%", es:"Ahorra 11%", de:"11% sparen" }, language),
      perMonth: "$2.67/mo",
    },
    {
      months: 12,
      label: L({ nl:"1 Jaar", en:"1 Year", fr:"1 An", es:"1 Año", de:"1 Jahr" }, language),
      price: 24.00,
      priceStr: "$24",
      badge: L({ nl:"Beste waarde ⭐", en:"Best value ⭐", fr:"Meilleure offre ⭐", es:"Mejor valor ⭐", de:"Bestes Angebot ⭐" }, language),
      save: L({ nl:"Bespaar 33%", en:"Save 33%", fr:"Économisez 33%", es:"Ahorra 33%", de:"33% sparen" }, language),
      perMonth: "$2/mo",
    },
  ];

  const selectedPlan = plans.find(p => p.months === selectedMonths)!;

  const features = [
    L({ nl:"Onbeperkte AI-gesprekken", en:"Unlimited AI conversations", fr:"Conversations IA illimitées", es:"Conversaciones IA ilimitadas", de:"Unbegrenzte KI-Gespräche" }, language),
    L({ nl:"Alle 5 talen inbegrepen", en:"All 5 languages included", fr:"5 langues incluses", es:"5 idiomas incluidos", de:"Alle 5 Sprachen" }, language),
    L({ nl:"Live grammaticacorrecties", en:"Live grammar corrections", fr:"Corrections grammaticales", es:"Correcciones gramaticales", de:"Live-Grammatikkorrekturen" }, language),
    L({ nl:"24/7 beschikbaar", en:"24/7 available", fr:"Disponible 24h/24", es:"Disponible 24/7", de:"24/7 verfügbar" }, language),
  ];

  const stepLabels = [
    L({ nl:"Plan", en:"Plan", fr:"Plan", es:"Plan", de:"Plan" }, language),
    L({ nl:"Betaling", en:"Payment", fr:"Paiement", es:"Pago", de:"Zahlung" }, language),
  ];

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col ${
          isDark ? "bg-gray-900 border border-gray-800" : "bg-white"
        }`}
        style={{ maxHeight: "95dvh" }}
      >
        {/* ── HEADER gradient ── */}
        <div
          className="relative shrink-0 px-6 pt-6 pb-5 text-center"
          style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4c1d95 70%,#6d28d9 100%)" }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon */}
          <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl">
            <Sparkles className="w-7 h-7 text-yellow-300" />
          </div>

          <h2 className="text-xl font-extrabold text-white mb-1">
            {L({ nl:"AI Tutor Premium", en:"AI Tutor Premium", fr:"IA Tuteur Premium", es:"IA Tutor Premium", de:"KI-Tutor Premium" }, language)}
          </h2>
          <p className="text-purple-200 text-sm">
            {L({ nl:"Leer talen met je persoonlijke AI-docent", en:"Learn languages with your personal AI tutor", fr:"Apprenez avec votre tuteur IA", es:"Aprende con tu tutor IA", de:"Lerne mit deinem KI-Tutor" }, language)}
          </p>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  (i === 0 && step === "plan") ? "bg-white border-white text-purple-800"
                  : (i === 1 && step === "pay") ? "bg-white border-white text-purple-800"
                  : i === 0 && step === "pay" ? "bg-green-400 border-green-400 text-white"
                  : "bg-white/10 border-white/30 text-white/40"
                }`}>
                  {i === 0 && step === "pay" ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-medium ${
                  (i === 0 && step === "plan") || (i === 1 && step === "pay")
                    ? "text-white" : "text-white/40"
                }`}>{label}</span>
                {i === 0 && <ChevronRight className="w-3 h-3 text-white/30" />}
              </div>
            ))}
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">

          {/* ── STEP 1: PLAN ── */}
          {step === "plan" && (
            <>
              {/* Plan cards */}
              <div className="space-y-2.5">
                {plans.map(plan => (
                  <button
                    key={plan.months}
                    onClick={() => setSelectedMonths(plan.months)}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 transition-all text-left ${
                      selectedMonths === plan.months
                        ? isDark ? "border-indigo-500 bg-indigo-500/10" : "border-indigo-500 bg-indigo-50"
                        : isDark ? "border-gray-700 hover:border-gray-600 bg-gray-800/30" : "border-gray-200 hover:border-indigo-300 bg-white"
                    }`}
                  >
                    {/* Radio dot */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      selectedMonths === plan.months
                        ? "border-indigo-500 bg-indigo-500"
                        : isDark ? "border-gray-600" : "border-gray-300"
                    }`}>
                      {selectedMonths === plan.months && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>

                    {/* Labels */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                          {plan.label}
                        </span>
                        {plan.badge && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            plan.months === 3
                              ? "bg-blue-500/15 text-blue-400"
                              : "bg-green-500/15 text-green-400"
                          }`}>{plan.badge}</span>
                        )}
                      </div>
                      {plan.save && (
                        <p className={`text-xs mt-0.5 font-semibold ${isDark ? "text-green-400" : "text-green-600"}`}>
                          {plan.save}
                        </p>
                      )}
                      <p className={`text-[11px] mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                        {plan.perMonth}
                      </p>
                    </div>

                    {/* Price */}
                    <p className={`text-xl font-extrabold shrink-0 ${isDark ? "text-white" : "text-gray-900"}`}>
                      {plan.priceStr}
                    </p>
                  </button>
                ))}
              </div>

              {/* Features checklist */}
              <div className={`rounded-2xl p-4 border ${isDark ? "bg-gray-800/40 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-green-400" strokeWidth={3} />
                      </div>
                      <span className={`text-xs font-medium leading-tight ${isDark ? "text-gray-300" : "text-gray-700"}`}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continue CTA */}
              <button
                onClick={() => setStep("pay")}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                {selectedPlan.priceStr} — {L({ nl:"Doorgaan", en:"Continue", fr:"Continuer", es:"Continuar", de:"Weiter" }, language)}
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Trust line */}
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  {L({ nl:"Veilig · Opzeggen altijd mogelijk", en:"Secure · Cancel anytime", fr:"Sécurisé · Annulez quand vous voulez", es:"Seguro · Cancela cuando quieras", de:"Sicher · Jederzeit kündbar" }, language)}
                </p>
              </div>
            </>
          )}

          {/* ── STEP 2: PAYPAL PAYMENT ── */}
          {step === "pay" && (
            <PayPalScriptProvider
              options={{
                // ✅ Jouw echte PayPal live Client ID
                clientId: PAYPAL_CLIENT_ID,
                currency: "USD",
                intent: "capture",
                // "buttons" = PayPal + creditcard/debitcard via PayPal
                components: "buttons",
                // Enables credit & debit card payment through PayPal
                // "enable-funding" shows extra methods based on buyer location
                "enable-funding": "card,credit",
                "disable-funding": "",
              }}
            >
              <PayPalCheckout
                plan={selectedPlan}
                language={language}
                isDark={isDark}
                onSuccess={() => onSuccess(selectedMonths)}
                onBack={() => setStep("plan")}
              />
            </PayPalScriptProvider>
          )}
        </div>
      </div>
    </div>
  );
}
