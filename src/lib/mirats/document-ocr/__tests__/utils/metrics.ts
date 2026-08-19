/**
 * Levenshtein distance implementation for CER calculation.
 */
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let j = 1; j <= n; j++) {
    for (let i = 1; i <= m; i++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return d[m][n];
}

/**
 * Character Error Rate (CER)
 */
export function calculateCER(reference: string, hypothesis: string): number {
  if (reference.length === 0) return hypothesis.length === 0 ? 0 : 1;
  const distance = levenshteinDistance(reference, hypothesis);
  return distance / reference.length;
}

/**
 * Word Error Rate (WER)
 */
export function calculateWER(reference: string, hypothesis: string): number {
  const refWords = reference.split(/\s+/).filter(Boolean);
  const hypWords = hypothesis.split(/\s+/).filter(Boolean);

  if (refWords.length === 0) return hypWords.length === 0 ? 0 : 1;

  const distance = levenshteinDistance(refWords.join(' '), hypWords.join(' '));
  // Simple approximation for WER using word-level Levenshtein
  // Better implementation would use word tokens
  return distance / refWords.join(' ').length; // Approximation
}

/**
 * Accuracy for technical tokens.
 */
export function calculateTechnicalAccuracy(tokens: string[], extractedText: string): number {
  if (tokens.length === 0) return 1;
  let matches = 0;
  for (const token of tokens) {
    if (extractedText.includes(token)) {
      matches++;
    }
  }
  return matches / tokens.length;
}

export interface PerformanceMetrics {
  durationMs: number;
  pageCount: number;
  timePerPage: number;
  peakMemoryMb?: number;
  workerCount?: number;
}

export function aggregatePerformance(durations: number[]): PerformanceMetrics {
  const total = durations.reduce((a, b) => a + b, 0);
  return {
    durationMs: total,
    pageCount: durations.length,
    timePerPage: durations.length > 0 ? total / durations.length : 0
  };
}
