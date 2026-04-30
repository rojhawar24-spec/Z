/**
 * Mistakes Tracker
 * Slaat fouten op in localStorage zodat de gebruiker ze kan oefenen.
 */

import { Language } from "../types";

export type MistakeType = "toets" | "oefening";

export interface Mistake {
  id: string;
  language: Language;
  type: MistakeType;
  question: string;
  correctAnswer: string;
  userAnswer: string;
  explanation?: string;
  options?: string[]; // for toets
  timestamp: number;
  reviewedCount: number; // how many times user has retried
  mastered: boolean;     // true once user got it right twice in a row
  lastCorrect: boolean;
}

const KEY = "ll_mistakes_v1";

function load(): Mistake[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}

function save(list: Mistake[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getMistakes(language?: Language): Mistake[] {
  const all = load().filter(m => !m.mastered);
  if (language) return all.filter(m => m.language === language);
  return all;
}

export function getAllMistakes(language?: Language): Mistake[] {
  const all = load();
  if (language) return all.filter(m => m.language === language);
  return all;
}

export function addMistake(m: Omit<Mistake, "timestamp" | "reviewedCount" | "mastered" | "lastCorrect">): void {
  const list = load();
  // Avoid duplicates: if same id exists and not mastered, just update
  const idx = list.findIndex(x => x.id === m.id && x.language === m.language);
  if (idx !== -1) {
    list[idx].userAnswer = m.userAnswer;
    list[idx].timestamp = Date.now();
    list[idx].mastered = false;
    list[idx].lastCorrect = false;
  } else {
    list.push({
      ...m,
      timestamp: Date.now(),
      reviewedCount: 0,
      mastered: false,
      lastCorrect: false,
    });
  }
  save(list);
}

export function markMistakeAttempt(id: string, language: Language, correct: boolean): void {
  const list = load();
  const idx = list.findIndex(m => m.id === id && m.language === language);
  if (idx === -1) return;
  list[idx].reviewedCount++;
  // Master it if correct twice in a row
  if (correct && list[idx].lastCorrect) list[idx].mastered = true;
  list[idx].lastCorrect = correct;
  save(list);
}

export function clearMistake(id: string, language: Language): void {
  const list = load().filter(m => !(m.id === id && m.language === language));
  save(list);
}

export function getMistakeStats(language?: Language) {
  const all = load();
  const filtered = language ? all.filter(m => m.language === language) : all;
  return {
    total: filtered.length,
    pending: filtered.filter(m => !m.mastered).length,
    mastered: filtered.filter(m => m.mastered).length,
  };
}
