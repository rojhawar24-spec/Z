/**
 * lessonQuestions — minimale stub voor compatibiliteit
 * Vaste vragen per les (optioneel)
 */

import { Language } from "../types";

export interface LessonQuiz {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface LessonExercise {
  id: string;
  type: "fill" | "translate" | "order";
  instruction: string;
  question: string;
  blanks?: string[];
  words?: string[];
  answer: string;
  hint?: string;
}

export interface LessonQuestionSet {
  quiz: LessonQuiz[];
  exercises: LessonExercise[];
}

export const lessonQuestions: Record<string, LessonQuestionSet> = {};

export function getLessonQuiz(lessonId: string): LessonQuiz[] {
  return lessonQuestions[lessonId]?.quiz || [];
}

export function getLessonExercises(lessonId: string): LessonExercise[] {
  return lessonQuestions[lessonId]?.exercises || [];
}

export function hasLessonQuestions(lessonId: string): boolean {
  return !!lessonQuestions[lessonId];
}

export function getLessonsWithQuestions(language: Language): string[] {
  return Object.keys(lessonQuestions).filter(id => id.startsWith(language + "-"));
}
