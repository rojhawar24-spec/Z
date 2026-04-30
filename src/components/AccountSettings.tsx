/**
 * AccountSettings — Export/Import account between devices
 * + view profile info
 */

import { useState } from "react";
import { useApp } from "../context/AppContext";
import { exportAccount, importAccount } from "../auth";
import {
  Shield, ArrowLeft, Copy, Check, Upload,
  Crown, Zap, Flame, Download, AlertCircle, ExternalLink
} from "lucide-react";

interface AccountSettingsProps {
  onBack: () => void;
}

export default function AccountSettings({ onBack }: AccountSettingsProps) {
  const { theme, account, setAccount } = useApp();
  const isDark = theme === "dark";

  const [tab, setTab] = useState<"profile" | "export" | "import">("profile");

  const [exportPassword, setExportPassword] = useState("");
  const [exportCode, setExportCode] = useState("");
  const [exportError, setExportError] = useState("");
  const [exportDone, setExportDone] = useState(false);
  const [copied, setCopied] = useState(false);

  const [importCode, setImportCode] = useState("");
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);
  const [importImporting, setImportImporting] = useState(false);

  if (!account) return null;

  const handleExport = () => {
    setExportError("");
    try {
      const code = exportAccount(account.uid, exportPassword);
      setExportCode(code);
      setExportDone(true);
    } catch (err: any) {
      setExportError(err.message);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleImport = () => {
    setImportError("");
    setImportImporting(true);
    try {
      const result = importAccount(importCode.trim());
      setAccount(result.account);
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        setImportCode("");
      }, 3000);
    } catch (err: any) {
      setImportError("Ongeldige backup code. Controleer of de code correct is.");
    } finally {
      setImportImporting(false);
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Profiel", emoji: "👤" },
    { id: "export" as const, label: "Exporteer", emoji: "📤" },
    { id: "import" as const, label: "Importeer", emoji: "📥" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Terug</span>
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
            Account instellingen
          </p>
          <h1 className={`text-2xl sm:text-3xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`} style={{ fontFamily:"Georgia, serif" }}>
            👤 Mijn Account
          </h1>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
              tab === t.id
                ? "bg-indigo-600 text-white shadow-md"
                : isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {tab === "profile" && (
        <div className={`rounded-3xl overflow-hidden border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
          {/* Profile header */}
          <div className="px-6 py-8 text-center"
            style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4c1d95 100%)" }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-3xl shadow-xl">
              {account.photoURL
                ? <img src={account.photoURL} alt="" className="w-full h-full object-cover rounded-2xl" />
                : account.displayName[0]?.toUpperCase()
              }
            </div>
            <h2 className={`text-2xl font-extrabold text-white mb-1`}>{account.displayName}</h2>
            <p className="text-purple-200 text-sm">{account.email}</p>
            {account.isPremium && (
              <div className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-bold">
                <Crown className="w-3.5 h-3.5" /> Premium Actief
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="p-6 grid grid-cols-3 gap-4">
            <div className={`rounded-2xl p-4 text-center ${isDark ? "bg-gray-800" : "bg-orange-50"}`}>
              <Flame className={`w-6 h-6 mx-auto mb-1 ${isDark ? "text-orange-400" : "text-orange-600"}`} />
              <p className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>{account.streak}</p>
              <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>dag streak</p>
            </div>
            <div className={`rounded-2xl p-4 text-center ${isDark ? "bg-gray-800" : "bg-yellow-50"}`}>
              <Zap className={`w-6 h-6 mx-auto mb-1 ${isDark ? "text-yellow-400" : "text-yellow-600"}`} />
              <p className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>{account.xp}</p>
              <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>totaal XP</p>
            </div>
            <div className={`rounded-2xl p-4 text-center ${isDark ? "bg-gray-800" : "bg-green-50"}`}>
              <Shield className={`w-6 h-6 mx-auto mb-1 ${isDark ? "text-green-400" : "text-green-600"}`} />
              <p className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>{account.totalDaysActive}</p>
              <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>dagen actief</p>
            </div>
          </div>

          {/* Info */}
          <div className={`px-6 pb-6 space-y-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            <div className="flex justify-between py-2 border-b" style={{ borderColor: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.15)" }}>
              <span className="text-sm font-medium">Account type</span>
              <span className="text-sm">{account.provider === "google" ? "Google" : "Email"}</span>
            </div>
            <div className="flex justify-between py-2 border-b" style={{ borderColor: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.15)" }}>
              <span className="text-sm font-medium">Sessie</span>
              <span className="text-sm">Opgeslagen in deze browser</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm font-medium">Gemaakt op</span>
              <span className="text-sm">{new Date(account.createdAt).toLocaleDateString("nl-NL")}</span>
            </div>
          </div>

          {/* Tip box */}
          <div className={`mx-6 mb-6 p-4 rounded-2xl border ${isDark ? "bg-indigo-900/15 border-indigo-800/30" : "bg-indigo-50 border-indigo-100"}`}>
            <p className={`text-sm flex items-center gap-2 ${isDark ? "text-indigo-300" : "text-indigo-700"}`}>
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span>Wil je dit account op een <b>ander apparaat</b> gebruiken? Klik op <b>"Exporteer"</b> voor een backup code.</span>
            </p>
          </div>
        </div>
      )}

      {/* ── EXPORT TAB ── */}
      {tab === "export" && (
        <div className={`rounded-3xl border overflow-hidden ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
          <div className="px-6 py-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? "bg-gradient-to-br from-blue-600 to-indigo-700" : "bg-gradient-to-br from-blue-500 to-indigo-600"}`}>
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>📤 Exporteer Account</h2>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Maak een backup code om je account op een ander apparaat te gebruiken
                </p>
              </div>
            </div>

            {!exportDone ? (
              <div className="space-y-3 mt-4">
                <div className={`rounded-2xl p-4 border ${isDark ? "bg-yellow-900/10 border-yellow-700/30" : "bg-yellow-50 border-yellow-200"}`}>
                  <p className={`text-sm ${isDark ? "text-yellow-200" : "text-yellow-800"}`}>
                    ⚠️ De backup code bevat al je accountgegevens. Deel deze code <b>ALLEEN</b> met apparaten die je vertrouwt!
                  </p>
                </div>

                {account.provider === "email" && (
                  <div>
                    <label className={`text-xs font-bold mb-1 block ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Voer je wachtwoord in om te bevestigen
                    </label>
                    <input
                      type="password"
                      value={exportPassword}
                      onChange={e => setExportPassword(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleExport()}
                      placeholder="Jouw wachtwoord"
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                        isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                      }`}
                    />
                  </div>
                )}

                {exportError && (
                  <div className={`px-4 py-3 rounded-xl border text-sm ${isDark ? "bg-red-900/20 border-red-800/40 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
                    <AlertCircle className="w-4 h-4 inline mr-1" /> {exportError}
                  </div>
                )}

                <button
                  onClick={handleExport}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl transition hover:scale-[1.01] flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Backup Code Maken
                </button>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                <div className={`rounded-2xl p-4 border border-green-500/40 ${isDark ? "bg-green-900/20" : "bg-green-50"}`}>
                  <p className="text-green-400 font-bold text-sm mb-1">✅ Backup code gegenereerd!</p>
                  <p className={`text-xs ${isDark ? "text-green-300" : "text-green-700"}`}>
                    Kopieer deze code en plak hem op je andere apparaat bij "Importeer Account".
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border-2 ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                  <p className={`text-xs font-mono break-all select-all leading-relaxed ${isDark ? "text-green-300" : "text-green-700"}`}>
                    {exportCode}
                  </p>
                </div>

                <button
                  onClick={handleCopy}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-xl transition hover:scale-[1.01] flex items-center justify-center gap-2"
                >
                  {copied ? <><Check className="w-4 h-4" /> Gekopieerd!</> : <><Copy className="w-4 h-4" /> Kopieer Code</>}
                </button>

                <button
                  onClick={() => { setExportDone(false); setExportCode(""); setExportPassword(""); setExportError(""); }}
                  className={`w-full py-2 text-sm transition ${isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
                >
                  ← Opnieuw
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── IMPORT TAB ── */}
      {tab === "import" && (
        <div className={`rounded-3xl border overflow-hidden ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
          <div className="px-6 py-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? "bg-gradient-to-br from-emerald-600 to-green-700" : "bg-gradient-to-br from-emerald-500 to-green-600"}`}>
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>📥 Importeer Account</h2>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Plak de backup code van een ander apparaat om je account te importeren
                </p>
              </div>
            </div>

            {importSuccess ? (
              <div className={`rounded-2xl p-6 text-center ${isDark ? "bg-green-900/20 border border-green-700/30" : "bg-green-50 border border-green-200"}`}>
                <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className={`font-extrabold text-lg ${isDark ? "text-green-300" : "text-green-700"}`}>
                  ✅ Account geïmporteerd!
                </p>
                <p className={`text-sm mt-1 ${isDark ? "text-green-200" : "text-green-600"}`}>
                  Je bent nu ingelogd met het geïmporteerde account 🎉
                </p>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                <div className={`rounded-2xl p-4 border ${isDark ? "bg-indigo-900/10 border-indigo-700/30" : "bg-indigo-50 border-indigo-200"}`}>
                  <p className={`text-sm ${isDark ? "text-indigo-200" : "text-indigo-800"}`}>
                    📱 <b>Stap 1:</b> Op je ANDERE apparaat ga naar "Exporteer" en maak een backup code.<br />
                    📋 <b>Stap 2:</b> Kopieer de code.<br />
                    🔄 <b>Stap 3:</b> Plak de code hieronder.
                  </p>
                </div>

                <div>
                  <label className={`text-xs font-bold mb-1 block ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Backup code (begint met LLSAVE_)
                  </label>
                  <textarea
                    value={importCode}
                    onChange={e => setImportCode(e.target.value)}
                    placeholder="Plak hier de backup code..."
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                      isDark ? "bg-gray-800 border-gray-700 text-white placeholder-gray-600" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                    }`}
                  />
                </div>

                {importError && (
                  <div className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-sm ${isDark ? "bg-red-900/20 border-red-800/40 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {importError}
                  </div>
                )}

                <button
                  onClick={handleImport}
                  disabled={!importCode.trim().startsWith("LLSAVE_") || importImporting}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                >
                  {importImporting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Importeren...
                    </span>
                  ) : (
                    <><Upload className="w-4 h-4" /> Importeer Account</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info footer */}
      <div className={`mt-5 rounded-2xl p-4 flex items-start gap-3 border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
        <Shield className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? "text-green-400" : "text-green-600"}`} />
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          <strong>Hoe backup werkt:</strong> Jouw account wordt versleuteld opgeslagen in een code.
          Deze code kan je kopiëren naar een ander apparaat. Daarna kan je inloggen met hetzelfde account.
          Premium, XP en streak worden allemaal meegenomen!
        </p>
      </div>
    </div>
  );
}
