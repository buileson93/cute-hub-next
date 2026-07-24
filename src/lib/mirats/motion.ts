/**
 * Motion token helpers — GĐ1-01.
 * Đọc CSS var từ :root, fallback nếu chạy trong môi trường không có DOM.
 */
export type MotionDuration = "fast" | "base" | "slow";
export type MotionEase = "standard" | "emphasized";

const FALLBACK_DURATION: Record<MotionDuration, number> = {
  fast: 120,
  base: 200,
  slow: 320,
};

const FALLBACK_EASE: Record<MotionEase, [number, number, number, number]> = {
  standard: [0.2, 0, 0, 1],
  emphasized: [0.3, 0, 0, 1],
};

/** Trả về số giây (dùng cho motion/react). */
export function getMotionDurationSeconds(name: MotionDuration): number {
  if (typeof window === "undefined") return FALLBACK_DURATION[name] / 1000;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(`--duration-${name}`)
    .trim();
  if (!raw) return FALLBACK_DURATION[name] / 1000;
  const ms = raw.endsWith("ms")
    ? parseFloat(raw)
    : raw.endsWith("s")
      ? parseFloat(raw) * 1000
      : parseFloat(raw);
  return Number.isFinite(ms) ? ms / 1000 : FALLBACK_DURATION[name] / 1000;
}

export function getMotionEase(name: MotionEase): [number, number, number, number] {
  return FALLBACK_EASE[name];
}
