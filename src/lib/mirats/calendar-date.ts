/**
 * Utility for handling dates in the business timezone (Asia/Saigon).
 * Prevents the "off-by-one-day" error common with new Date().toISOString().
 */

export const ASIA_SAIGON_OFFSET = 7 * 60; // UTC+7 in minutes

/**
 * Returns today's date in YYYY-MM-DD format in Asia/Saigon.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const localTime = now.getTime();
  const localOffset = now.getTimezoneOffset() * 60000;
  const utc = localTime + localOffset;
  const saigonTime = new Date(utc + 3600000 * 7);
  return saigonTime.toISOString().slice(0, 10);
}

/**
 * Validates that start_date is before or equal to due_date.
 */
export function isValidDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
): boolean {
  if (!start || !end) return true;
  return new Date(start) <= new Date(end);
}

/**
 * Normalizes a string for search by removing Vietnamese diacritics.
 */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}
