/**
 * Vietnamese text post-processing rules.
 */

/**
 * Normalizes Vietnamese text for searching.
 * Removes accents and folds characters.
 */
export function normalizeViForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

/**
 * Regex for technical patterns that should NEVER be auto-corrected.
 * - Serial numbers: S/N: 123456
 * - Part numbers: P/N: ABC-123
 * - Coordinates: 10°12'30"N
 * - Units: 100kW, 50Hz, 220V
 */
const TECHNICAL_PATTERN = /\b(S\/N|P\/N|Serial|Model|Type|Unit|Qty|WGS84)\s*[:=]?\s*[A-Z0-9\-/.]+|\d+\s*(kW|MW|Hz|V|A|kVA|kg|m|cm|mm|°|')/gi;

/**
 * Resets technical pattern regex for global state issues.
 */
function testTechnicalPattern(text: string): boolean {
  // We avoid the global flag issues by using match or a fresh regex
  return !!text.match(/\b(S\/N|P\/N|Serial|Model|Type|Unit|Qty|WGS84)\s*[:=]?\s*[A-Z0-9\-/.]+|\d+\s*(kW|MW|Hz|V|A|kVA|kg|m|cm|mm|°|')/i);
}



/**
 * Creates a "corrected" version of the text using simple Vietnamese dictionary heuristic.
 * This does NOT overwrite the raw text.
 */
export function getCorrectedText(text: string): string {
  // Logic for dictionary correction would go here.
  // For now, we just return the original text but marked as "potentially corrected"
  // if we were to implement a spell checker.
  return text;
}

/**
 * Determines if a string segment is likely technical data.
 */
export function isTechnicalSegment(segment: string): boolean {
  return testTechnicalPattern(segment);
}

