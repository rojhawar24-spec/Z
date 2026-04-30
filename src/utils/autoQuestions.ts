/**
 * autoQuestions.ts
 * ──────────────────────────
 * Automatically generate 10 quiz questions and 10 exercises from any lesson's
 * own data (rules + examples). Free, no AI needed.
 *
 * Premium users can use AI for infinite NEW questions.
 */

import { GrammarLesson } from "../data/grammarData";
import { LessonQuiz, LessonExercise } from "../data/lessonQuestions";
import { shuffle } from "./shuffle";

/**
 * Generate quiz questions automatically from a lesson.
 * Uses rules + examples to make varied questions.
 */
export function autoGenerateQuiz(lesson: GrammarLesson): LessonQuiz[] {
  const questions: LessonQuiz[] = [];
  const idPrefix = lesson.id;

  // ── Type A: "Which rule is correct?" — based on the lesson rules ──
  // For each rule, create a multiple-choice question with 3 fake distractors
  lesson.rules.forEach((rule, i) => {
    const distractors = [
      "Geen van bovenstaande is correct",
      "Het tegenovergestelde van wat hierboven staat",
      "Dit geldt alleen in het meervoud",
    ];
    const allOptions = shuffle([rule, ...distractors]);
    const correctIdx = allOptions.findIndex(o => o === rule);

    questions.push({
      id: `${idPrefix}-auto-q${i + 1}`,
      question: `Welke regel hoort bij "${lesson.title}"?`,
      options: allOptions,
      correct: correctIdx,
      explanation: `Dit is regel ${i + 1} van deze les: "${rule}".`,
    });
  });

  // ── Type B: "What is the translation?" — using examples ──
  lesson.examples.forEach((ex, i) => {
    // Pick 3 random other example sentences as distractors
    const otherExamples = lesson.examples.filter((_, j) => j !== i);
    const distractors = shuffle(otherExamples).slice(0, 3).map(e => e.translation);
    while (distractors.length < 3) {
      distractors.push("Geen vertaling beschikbaar");
    }

    const allOptions = shuffle([ex.translation, ...distractors]);
    const correctIdx = allOptions.findIndex(o => o === ex.translation);

    questions.push({
      id: `${idPrefix}-auto-tr${i + 1}`,
      question: `Wat betekent: "${ex.sentence}"?`,
      options: allOptions,
      correct: correctIdx,
      explanation: `Dit voorbeeld komt uit de les "${lesson.title}".`,
    });
  });

  // ── Type C: "Which sentence demonstrates this rule?" ──
  if (lesson.examples.length >= 2) {
    lesson.examples.slice(0, 2).forEach((ex, i) => {
      const wrongSentences = [
        "Een willekeurige zin zonder regel.",
        "Dit is een fout voorbeeld.",
        "Geen toepassing van de regel.",
      ];
      const allOptions = shuffle([ex.sentence, ...wrongSentences]);
      const correctIdx = allOptions.findIndex(o => o === ex.sentence);

      questions.push({
        id: `${idPrefix}-auto-ex${i + 1}`,
        question: `Welke zin past bij de regels van "${lesson.title}"?`,
        options: allOptions,
        correct: correctIdx,
        explanation: `Deze zin is een correct voorbeeld uit de les.`,
      });
    });
  }

  // Take first 10, shuffled
  return shuffle(questions).slice(0, 10);
}

/**
 * Generate exercises automatically from a lesson.
 */
export function autoGenerateExercises(lesson: GrammarLesson): LessonExercise[] {
  const exercises: LessonExercise[] = [];
  const idPrefix = lesson.id;

  // ── Type A: Translation exercises (sentence ↔ translation) ──
  lesson.examples.forEach((ex, i) => {
    // Translate from example sentence to translation
    exercises.push({
      id: `${idPrefix}-auto-ex-tr${i + 1}`,
      type: "translate",
      instruction: "Vertaal de zin",
      question: ex.sentence,
      answer: ex.translation,
      hint: `Uit les: ${lesson.title}`,
    });
  });

  // ── Type B: Reverse translation ──
  lesson.examples.slice(0, 3).forEach((ex, i) => {
    exercises.push({
      id: `${idPrefix}-auto-ex-rtr${i + 1}`,
      type: "translate",
      instruction: "Vertaal terug naar de doeltaal",
      question: ex.translation,
      answer: ex.sentence,
      hint: `Originele zin uit les: ${lesson.title}`,
    });
  });

  // ── Type C: Word order exercises ──
  lesson.examples.slice(0, 3).forEach((ex, i) => {
    const cleaned = ex.sentence.replace(/[.,!?]/g, "").trim();
    const words = cleaned.split(/\s+/);
    if (words.length >= 3 && words.length <= 8) {
      exercises.push({
        id: `${idPrefix}-auto-ex-ord${i + 1}`,
        type: "order",
        instruction: "Zet woorden in juiste volgorde",
        question: shuffle(words).join(" / "),
        words: shuffle(words),
        answer: cleaned.toLowerCase(),
        hint: `Originele zin uit "${lesson.title}"`,
      });
    }
  });

  // ── Type D: Fill-in based on examples ──
  lesson.examples.slice(0, 3).forEach((ex, i) => {
    const words = ex.sentence.replace(/[.,!?]/g, "").split(/\s+/);
    if (words.length >= 3) {
      // Pick a "key" word (usually the longest or middle one)
      const keyIdx = Math.floor(words.length / 2);
      const keyWord = words[keyIdx];
      const blanked = [...words];
      blanked[keyIdx] = "___";

      // Make 3 distractors (other words from other examples)
      const otherWords = lesson.examples
        .flatMap(e => e.sentence.replace(/[.,!?]/g, "").split(/\s+/))
        .filter(w => w.toLowerCase() !== keyWord.toLowerCase() && w.length >= 2);
      const distractors = shuffle(otherWords).slice(0, 3);
      while (distractors.length < 3) distractors.push("een");

      exercises.push({
        id: `${idPrefix}-auto-ex-fill${i + 1}`,
        type: "fill",
        instruction: "Vul het juiste woord in",
        question: blanked.join(" "),
        blanks: shuffle([keyWord, ...distractors]),
        answer: keyWord,
        hint: `Uit voorbeeld: "${ex.sentence}"`,
      });
    }
  });

  // Take first 10, shuffled
  return shuffle(exercises).slice(0, 10);
}
