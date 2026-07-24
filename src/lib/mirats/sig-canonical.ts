// ============================================================================
// sig-canonical.ts — Chuẩn hoá dữ liệu biên bản để hash & ký.
//
// Nguyên tắc: cùng một submission → luôn ra CÙNG một chuỗi canonical
// (không phụ thuộc thứ tự khoá trong JSON), rồi SHA-256 để làm "vân tay".
// Chữ ký Ed25519 ký trên chuỗi hash này.
//
// Module THUẦN — không phụ thuộc React/DB → test được, chạy được cả 2 phía.
// ============================================================================
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

/** Canonicalize JSON (RFC 8785 rút gọn): sort keys, không space, giữ number/string thô. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalize(obj[k])).join(",") + "}";
}

/** Nội dung "được ký" của 1 submission. Chỉ chọn field bất biến để tránh flap khi audit. */
export type SignablePayload = {
  submission_id: string;
  template_id: string;
  template_code: string;
  template_version_id: string | null;
  don_vi_id: string | null;
  thiet_bi_id: string | null;
  ky_bao_cao: string | null;
  tieu_de: string | null;
  data: Record<string, unknown>;
  signatures_visual: unknown; // ảnh chữ ký tay từ canvas (đã upload)
};

/** Trả về hash hex (SHA-256) trên chuỗi canonical của payload. */
export function hashPayload(p: SignablePayload): string {
  const s = canonicalize(p);
  const h = sha256(new TextEncoder().encode(s));
  return bytesToHex(h);
}

/** Rút gọn hash cho hiển thị: 8-8-8. */
export function shortHash(hex: string): string {
  const s = (hex || "").replace(/[^0-9a-f]/gi, "").toLowerCase();
  if (s.length < 24) return s;
  return `${s.slice(0, 8)}…${s.slice(-8)}`;
}
