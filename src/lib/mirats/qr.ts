// ============================================================================
// N7 — QR thiết bị (thuần, không side-effect).
// - `buildAssetQrPayload`: dựng URL/path cho tem QR (reuse `nhan-qr` để không drift).
// - `parseQr`: parse URL/chuỗi quét ra hành động điều hướng chuẩn.
// QR trên nhãn chỉ chứa URL deep-link `/q/<ma_thiet_bi>`, không PII, không token.
// ============================================================================
import { buildLabelPath, buildLabelUrl } from "./nhan-qr";

export interface QrPayload {
  origin: string;
  maThietBi: string;
}

export type QrTarget =
  | { kind: "asset"; maThietBi: string; path: `/q/${string}` }
  | { kind: "legacy_id"; id: string; path: `/qr/thiet-bi/${string}` }
  | { kind: "unknown"; raw: string };

/** Dựng URL đầy đủ + path cho tem QR của một tài sản. */
export function buildAssetQrPayload(input: { origin: string; maThietBi: string }): {
  url: string;
  path: string;
  ma: string;
} {
  const ma = (input.maThietBi ?? "").trim();
  if (!ma) throw new Error("buildAssetQrPayload: maThietBi rỗng — không được in tem không có mã");
  return {
    url: buildLabelUrl(input.origin, ma),
    path: buildLabelPath(ma),
    ma,
  };
}

const ASSET_RE = /^\/q\/([^/?#]+)\/?$/;
const LEGACY_RE = /^\/qr\/thiet-bi\/([^/?#]+)\/?$/;

/** Trả về path đã strip query/hash để so khớp regex ổn định. */
function toPath(raw: string): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  // Path tuyệt đối / tương đối:
  if (s.startsWith("/")) return s.split(/[?#]/)[0];
  try {
    const u = new URL(s);
    return u.pathname;
  } catch {
    return null;
  }
}

/**
 * Parse một chuỗi quét được (URL đầy đủ hoặc path) thành QrTarget.
 * KHÔNG fetch — chỉ trả cấu trúc điều hướng; điều hướng do UI làm.
 */
export function parseQr(raw: string): QrTarget {
  const path = toPath(raw);
  if (path) {
    const m1 = ASSET_RE.exec(path);
    if (m1) {
      const ma = decodeURIComponent(m1[1]);
      return { kind: "asset", maThietBi: ma, path: `/q/${encodeURIComponent(ma)}` };
    }
    const m2 = LEGACY_RE.exec(path);
    if (m2) {
      const id = decodeURIComponent(m2[1]);
      return { kind: "legacy_id", id, path: `/qr/thiet-bi/${encodeURIComponent(id)}` };
    }
  }
  return { kind: "unknown", raw: (raw ?? "").toString() };
}
