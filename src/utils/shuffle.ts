/**
 * Fisher-Yates shuffle - returns new shuffled array
 */
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Pick N random elements from an array
 */
export function pickRandom<T>(array: T[], n: number): T[] {
  return shuffle(array).slice(0, Math.min(n, array.length));
}
