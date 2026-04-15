// Shared utilities

let idCounter = 0;

export function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}

export function jaccardSimilarity(text1: string, text2: string): number {
  const set1 = new Set(text1.split(/\s+/));
  const set2 = new Set(text2.split(/\s+/));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size > 0 ? intersection.size / union.size : 0;
}
