import { OcrPageResult } from "./types";

/**
 * Stop words or common symbols that shouldn't count as "meaningful" 
 * when deciding if a page has enough text.
 */
const NON_MEANINGFUL_WORDS = new Set([
  " ", "\n", "\t", ".", ",", ";", ":", "-", "_", "/", "\\", "|", 
  "(", ")", "[", "]", "{", "}", "<", ">", "!", "?", "@", "#", 
  "$", "%", "^", "&", "*", "+", "=", "~", "`"
]);

export interface ClassificationResult {
  needsOcr: boolean;
  reason?: string;
  meaningfulWordCount: number;
  textLength: number;
  errorRatio: number;
}

/**
 * Classifies if a page's native text layer is sufficient or needs OCR.
 */
export function classifyPageText(
  rawText: string, 
  options: { minChars?: number; minWords?: number } = {}
): ClassificationResult {
  const { minChars = 40, minWords = 5 } = options;
  
  const text = rawText.trim();
  const textLength = text.length;
  
  // Count meaningful words
  const words = text.split(/\s+/);
  const meaningfulWords = words.filter(w => {
    const cleaned = w.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    return cleaned.length > 0 && !NON_MEANINGFUL_WORDS.has(cleaned);
  });
  
  const meaningfulWordCount = meaningfulWords.length;
  
  // Detect placeholder/error characters (e.g. unknown symbols, excessive CID codes)
  const placeholderMatches = text.match(/[\uFFFD]|(cid:\d+)/gi) || [];
  const errorRatio = textLength > 0 ? placeholderMatches.length / textLength : 0;
  
  let needsOcr = false;
  let reason: string | undefined;
  
  if (errorRatio > 0.1) {
    needsOcr = true;
    reason = `High error/placeholder ratio (${(errorRatio * 100).toFixed(1)}%)`;
  } else if (textLength < minChars) {
    needsOcr = true;
    reason = `Insufficient character count (${textLength} < ${minChars})`;
  } else if (meaningfulWordCount < minWords) {
    needsOcr = true;
    reason = `Insufficient meaningful words (${meaningfulWordCount} < ${minWords})`;
  }
  
  return {
    needsOcr,
    reason,
    meaningfulWordCount,
    textLength,
    errorRatio
  };
}
