/**
 * LinguaLearn Auth System
 * ─────────────────────
 * Accounts worden opgeslagen in localStorage.
 * Dit werkt PER BROWSER/APPARAAT.
 * 
 * Om in te loggen op een ANDER apparaat:
 *   1. Ga naar Profiel → "Exporteer Account"
 *   2. Je krijgt een BACKUP CODE
 *   3. Op ander apparaat: Login → "Importeer Account"
 *   4. Plak de backup code → account is gekopieerd
 * 
 * Premium status wordt ook meegenomen in backup!
 */

export interface Account {
  uid: string;
  email: string;
  displayName: string;
  password: string; // hashed
  photoURL?: string;
  provider: "email" | "google";
  isPremium: boolean;
  premiumExpiry?: number;
  createdAt: number;
  streak: number;
  lastActiveDate: string;
  longestStreak: number;
  totalDaysActive: number;
  xp: number;
}

const ACCOUNTS_KEY = "ll_accounts_v3";
const SESSION_KEY = "ll_session_v3";

export function getAccounts(): Account[] {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]"); }
  catch { return []; }
}

export function saveAccounts(a: Account[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(a));
}

function saveSession(uid: string) {
  localStorage.setItem(SESSION_KEY, uid);
}

function hash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h |= 0;
  }
  return `h_${Math.abs(h).toString(16)}_${str.length}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function updateStreak(acc: Account): Account {
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (acc.lastActiveDate === today) return acc;
  let newStreak = acc.streak;
  if (acc.lastActiveDate === yesterday) newStreak = acc.streak + 1;
  else if (acc.lastActiveDate !== today) newStreak = 1;
  return {
    ...acc,
    streak: newStreak,
    longestStreak: Math.max(acc.longestStreak || 0, newStreak),
    lastActiveDate: today,
    totalDaysActive: (acc.totalDaysActive || 0) + 1,
    xp: (acc.xp || 0) + 10,
  };
}

function saveAndReturn(accounts: Account[], idx: number): Account {
  saveAccounts(accounts);
  saveSession(accounts[idx].uid);
  return accounts[idx];
}

export function registerWithEmail(email: string, password: string, displayName: string): Account {
  const accounts = getAccounts();
  if (accounts.find(a => a.email.toLowerCase() === email.toLowerCase())) throw new Error("EMAIL_EXISTS");
  if (password.length < 6) throw new Error("WEAK_PASSWORD");
  if (!displayName.trim()) throw new Error("NAME_EMPTY");
  let acc: Account = {
    uid: `uid_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    email: email.toLowerCase().trim(),
    displayName: displayName.trim(),
    password: hash(password),
    provider: "email",
    isPremium: false,
    createdAt: Date.now(),
    streak: 1,
    lastActiveDate: todayStr(),
    longestStreak: 1,
    totalDaysActive: 1,
    xp: 10,
  };
  accounts.push(acc);
  return saveAndReturn(accounts, accounts.length - 1);
}

export function loginWithEmail(email: string, password: string): Account {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.email.toLowerCase() === email.toLowerCase().trim() && a.provider === "email");
  if (idx === -1) throw new Error("USER_NOT_FOUND");
  if (accounts[idx].password !== hash(password)) throw new Error("WRONG_PASSWORD");
  accounts[idx] = updateStreak(accounts[idx]);
  return saveAndReturn(accounts, idx);
}

export function loginWithGoogle(googleEmail: string, googleName: string, googlePhoto: string): Account {
  const accounts = getAccounts();
  let idx = accounts.findIndex(a => a.email.toLowerCase() === googleEmail.toLowerCase() && a.provider === "google");
  if (idx === -1) {
    const acc: Account = {
      uid: `google_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      email: googleEmail.toLowerCase(),
      displayName: googleName,
      password: "",
      photoURL: googlePhoto,
      provider: "google",
      isPremium: false,
      createdAt: Date.now(),
      streak: 1,
      lastActiveDate: todayStr(),
      longestStreak: 1,
      totalDaysActive: 1,
      xp: 10,
    };
    accounts.push(acc);
    idx = accounts.length - 1;
  } else {
    accounts[idx] = updateStreak(accounts[idx]);
    accounts[idx].photoURL = googlePhoto;
    accounts[idx].displayName = googleName;
  }
  return saveAndReturn(accounts, idx);
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentSession(): Account | null {
  try {
    const uid = localStorage.getItem(SESSION_KEY);
    if (!uid) return null;
    return getAccounts().find(a => a.uid === uid) || null;
  } catch { return null; }
}

export function addXP(uid: string, amount: number): Account {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.uid === uid);
  if (idx === -1) throw new Error("USER_NOT_FOUND");
  accounts[idx].xp = (accounts[idx].xp || 0) + amount;
  accounts[idx] = updateStreak(accounts[idx]);
  saveAccounts(accounts);
  return accounts[idx];
}

export function activatePremium(uid: string, months: number): Account {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.uid === uid);
  if (idx === -1) throw new Error("USER_NOT_FOUND");
  const now = Date.now();
  const base = (accounts[idx].premiumExpiry || 0) > now ? accounts[idx].premiumExpiry! : now;
  accounts[idx].isPremium = true;
  accounts[idx].premiumExpiry = base + months * 30 * 24 * 60 * 60 * 1000;
  saveAccounts(accounts);
  return accounts[idx];
}

export function checkPremiumExpiry(uid: string): Account {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.uid === uid);
  if (idx === -1) throw new Error("USER_NOT_FOUND");
  if (accounts[idx].isPremium && accounts[idx].premiumExpiry && Date.now() > accounts[idx].premiumExpiry!) {
    accounts[idx].isPremium = false;
    accounts[idx].premiumExpiry = undefined;
    saveAccounts(accounts);
  }
  return accounts[idx];
}

export function formatExpiry(ts: number): string {
  return new Date(ts).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 30) return "🔥🔥🔥";
  if (streak >= 14) return "🔥🔥";
  if (streak >= 7) return "🔥";
  if (streak >= 3) return "⚡";
  return "✨";
}

/* ════════════════════════════════════════
   EXPORT / IMPORT ACCOUNT BETWEEN DEVICES
   ════════════════════════════════════════ */

function generateSalt(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let salt = "";
  for (let i = 0; i < 16; i++) salt += chars.charAt(Math.floor(Math.random() * chars.length));
  return salt;
}

/**
 * Export account data as a backup code
 * The backup code contains: Salt + encrypted account data
 * This can be transferred to another device
 */
export function exportAccount(uid: string, password: string): string {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.uid === uid);
  if (idx === -1) throw new Error("USER_NOT_FOUND");

  // Verify password first
  if (accounts[idx].provider === "email") {
    if (accounts[idx].password !== hash(password)) throw new Error("WRONG_PASSWORD");
  }

  const salt = generateSalt();
  const raw = {
    email: accounts[idx].email,
    password: accounts[idx].password,
    displayName: accounts[idx].displayName,
    photoURL: accounts[idx].photoURL,
    provider: accounts[idx].provider,
    isPremium: accounts[idx].isPremium,
    premiumExpiry: accounts[idx].premiumExpiry,
    xp: accounts[idx].xp,
    streak: accounts[idx].streak,
    longestStreak: accounts[idx].longestStreak,
  };

  // Simple XOR-like encoding with salt (not military grade but keeps casual eyes out)
  const json = JSON.stringify(raw);
  const encoded = btoa(json).split("").map((c, i) => {
    const sc = salt.charCodeAt(i % salt.length);
    return String.fromCharCode(c.charCodeAt(0) ^ (sc % 95) + 32);
  }).join("");

  return `LLSAVE_${salt}_${btoa(encoded)}`;
}

/**
 * Import an account from a backup code (another device copy)
 * Only imports if email doesn't already exist locally
 */
export function importAccount(backupCode: string): { account: Account; merged: boolean; localEmailExists: boolean } {
  try {
    if (!backupCode.startsWith("LLSAVE_")) throw new Error("INVALID_CODE");

    const parts = backupCode.split("_");
    if (parts.length < 3) throw new Error("INVALID_CODE");

    const salt = parts[1];
    const encrypted = parts.slice(2).join("");

    const decoded = atob(encrypted);
    const json = decoded.split("").map((c, i) => {
      const sc = salt.charCodeAt(i % salt.length);
      return String.fromCharCode(c.charCodeAt(0) ^ (sc % 95) + 32);
    }).join("");

    const raw = JSON.parse(atob(json));

    const accounts = getAccounts();

    // Check if email already exists locally
    const existing = accounts.findIndex(a => a.email.toLowerCase() === raw.email.toLowerCase());
    if (existing !== -1) {
      // Merge data (keep local, but add premium/XP if backup is better)
      const merged = updateStreak(accounts[existing]);
      if (raw.isPremium && raw.premiumExpiry) {
        if (!merged.isPremium || (merged.premiumExpiry || 0) < raw.premiumExpiry) {
          merged.isPremium = true;
          merged.premiumExpiry = raw.premiumExpiry;
        }
      }
      merged.xp = Math.max(merged.xp, raw.xp);
      merged.longestStreak = Math.max(merged.longestStreak, raw.streak);
      if (raw.streak > merged.streak) merged.streak = raw.streak;
      accounts[existing] = merged;
      saveAccounts(accounts);
      saveSession(accounts[existing].uid);
      return { account: accounts[existing], merged: true, localEmailExists: true };
    }

    // Create new account from backup
    const newAccount: Account = {
      uid: `uid_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      email: raw.email,
      displayName: raw.displayName,
      password: raw.password,
      photoURL: raw.photoURL,
      provider: raw.provider,
      isPremium: raw.isPremium || false,
      premiumExpiry: raw.premiumExpiry,
      createdAt: Date.now(),
      streak: raw.streak || 1,
      lastActiveDate: todayStr(),
      longestStreak: raw.longestStreak || 1,
      totalDaysActive: 1,
      xp: raw.xp || 0,
    };
    accounts.push(newAccount);
    saveAccounts(accounts);
    saveSession(newAccount.uid);
    return { account: newAccount, merged: false, localEmailExists: false };
  } catch (e) {
    throw new Error("INVALID_CODE");
  }
}

/**
 * Delete all accounts from localStorage (for testing)
 */
export function clearAllAccounts() {
  localStorage.removeItem(ACCOUNTS_KEY);
  localStorage.removeItem(SESSION_KEY);
}
