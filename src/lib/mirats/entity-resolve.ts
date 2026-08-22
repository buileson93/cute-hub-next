// ============================================================================
// Đối chiếu thực thể (entity resolution) cho nhập liệu — HÀM THUẦN, dễ test.
//
// Nguyên tắc an toàn (khớp yêu cầu):
//   * CHỈ khớp DUY NHẤT & CHÍNH XÁC mới tự "resolved" (id, mã unique,
//     serial+model+nhà sản xuất unique, hoặc alias đã xác nhận).
//   * MỌI khả năng trùng (nhiều ứng viên, tên gần giống, độ tin cậy thấp) đều
//     phải "needs_review" — KHÔNG bao giờ tự merge.
//   * Danh mục "guard" (quan trọng): KHÔNG tự tạo từ typo chưa xác nhận —
//     có ứng viên gần đúng thì buộc review, không create.
//
// File client-safe: không import module server-only.
// ============================================================================

import { noAccent } from "@/lib/mirats/import-config";

export type MatchKind =
  | "exact_id"
  | "exact_code"
  | "serial_model_mfr"
  | "alias"
  | "near_name"
  | "low_confidence"
  | "none";

/** resolved = xác định chắc chắn; needs_review = phải người xác nhận; create = tạo mới an toàn. */
export type MatchDecision = "resolved" | "needs_review" | "create";

export interface Candidate {
  id: string;
  ma?: string | null;
  ten?: string | null;
  ma_serial?: string | null;
  model_id?: string | null;
  nha_san_xuat_id?: string | null;
}

export interface ResolveInput {
  id?: string | null;
  ma?: string | null;
  ten?: string | null;
  ma_serial?: string | null;
  model_id?: string | null;
  nha_san_xuat_id?: string | null;
}

/** Một mục trong từ điển alias (đã chuẩn hoá & đã xác nhận). */
export interface AliasEntry {
  /** Văn bản đầu vào (đã noAccent) trỏ tới bản ghi chuẩn. */
  alias: string;
  canonical_id: string;
  entity: string;
  scope?: string | null;
}

export interface ResolveOptions {
  entity: string;
  scope?: string | null;
  /** Bảng danh mục quan trọng: không tự tạo từ typo chưa xác nhận. */
  guard?: boolean;
  /** Ngưỡng "gần giống" (mặc định 0.82). */
  nearThreshold?: number;
  /** Ngưỡng "tin cậy thấp" (mặc định 0.55). */
  lowThreshold?: number;
}

export interface MatchResult {
  decision: MatchDecision;
  kind: MatchKind;
  /** 0..1 — độ tin cậy của ứng viên tốt nhất. */
  confidence: number;
  /** Ứng viên tốt nhất (nếu có). */
  candidate: Candidate | null;
  /** Mọi ứng viên khả dĩ (dùng để review / merge). */
  candidates: Candidate[];
  reason: string;
}

/** Khoảng cách Levenshtein giữa hai chuỗi. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array<number>(b.length + 1);
  const cur = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return prev[b.length];
}

/** Tỉ lệ giống nhau 0..1 (1 = giống hệt) trên chuỗi đã chuẩn hoá không dấu. */
export function similarity(a: string, b: string): number {
  const x = noAccent(a);
  const y = noAccent(b);
  if (!x && !y) return 1;
  if (!x || !y) return 0;
  const maxLen = Math.max(x.length, y.length);
  return 1 - levenshtein(x, y) / maxLen;
}

function norm(v?: string | null): string {
  return noAccent(String(v ?? "")).trim();
}

/**
 * Đối chiếu MỘT dòng đầu vào với tập ứng viên hiện có + từ điển alias.
 * Trả về quyết định an toàn (resolved / needs_review / create).
 */
export function resolveEntity(
  input: ResolveInput,
  candidates: Candidate[],
  aliases: AliasEntry[],
  opts: ResolveOptions,
): MatchResult {
  const nearT = opts.nearThreshold ?? 0.82;
  const lowT = opts.lowThreshold ?? 0.55;

  // 1) Khớp theo ID nội bộ (chắc chắn nhất).
  if (input.id) {
    const byId = candidates.filter((c) => c.id === input.id);
    if (byId.length === 1)
      return {
        decision: "resolved",
        kind: "exact_id",
        confidence: 1,
        candidate: byId[0],
        candidates: byId,
        reason: "Khớp ID duy nhất",
      };
    if (byId.length === 0)
      return {
        decision: "needs_review",
        kind: "none",
        confidence: 0,
        candidate: null,
        candidates: [],
        reason: "ID không tồn tại",
      };
  }

  // 2) Khớp theo mã (khóa tự nhiên).
  const maN = norm(input.ma);
  if (maN) {
    const byMa = candidates.filter((c) => norm(c.ma) === maN);
    if (byMa.length === 1)
      return {
        decision: "resolved",
        kind: "exact_code",
        confidence: 1,
        candidate: byMa[0],
        candidates: byMa,
        reason: "Khớp mã duy nhất",
      };
    if (byMa.length > 1)
      return {
        decision: "needs_review",
        kind: "exact_code",
        confidence: 1,
        candidate: null,
        candidates: byMa,
        reason: "Mã trùng ở nhiều bản ghi — cần xác nhận",
      };
  }

  // 3) Khớp serial + model + nhà sản xuất (bộ ba định danh tài sản).
  const serialN = norm(input.ma_serial);
  if (serialN) {
    const bySerial = candidates.filter((c) => norm(c.ma_serial) === serialN);
    if (input.model_id && input.nha_san_xuat_id) {
      const triple = bySerial.filter(
        (c) => c.model_id === input.model_id && c.nha_san_xuat_id === input.nha_san_xuat_id,
      );
      if (triple.length === 1)
        return {
          decision: "resolved",
          kind: "serial_model_mfr",
          confidence: 1,
          candidate: triple[0],
          candidates: triple,
          reason: "Khớp serial + model + nhà sản xuất duy nhất",
        };
      if (triple.length > 1)
        return {
          decision: "needs_review",
          kind: "serial_model_mfr",
          confidence: 1,
          candidate: null,
          candidates: triple,
          reason: "Nhiều bản ghi cùng serial+model+NSX — cần xác nhận",
        };
    }
    // Serial trùng nhưng model/NSX khác (hoặc thiếu) → nghi trùng, buộc review.
    if (bySerial.length >= 1)
      return {
        decision: "needs_review",
        kind: "serial_model_mfr",
        confidence: 0.9,
        candidate: bySerial.length === 1 ? bySerial[0] : null,
        candidates: bySerial,
        reason: "Serial trùng nhưng chưa đủ model/NSX để chắc chắn",
      };
  }

  // 4) Khớp theo alias ĐÃ XÁC NHẬN (tên/mã đầu vào → bản ghi chuẩn).
  const tenN = norm(input.ten);
  const aliasKeys = [tenN, maN].filter(Boolean);
  for (const entry of aliases) {
    if (entry.entity !== opts.entity) continue;
    if ((opts.scope ?? null) !== (entry.scope ?? null) && entry.scope != null) continue;
    if (aliasKeys.includes(norm(entry.alias))) {
      const target = candidates.find((c) => c.id === entry.canonical_id) ?? null;
      if (target)
        return {
          decision: "resolved",
          kind: "alias",
          confidence: 1,
          candidate: target,
          candidates: [target],
          reason: "Khớp alias đã xác nhận",
        };
    }
  }

  // 5) Gần giống theo tên → luôn cần review (không tự merge).
  if (tenN) {
    const scored = candidates
      .map((c) => ({ c, s: similarity(tenN, norm(c.ten)) }))
      .filter((x) => x.s >= lowT)
      .sort((a, b) => b.s - a.s);

    if (scored.length) {
      const best = scored[0];
      const near = scored.filter((x) => x.s >= nearT);
      if (near.length) {
        return {
          decision: "needs_review",
          kind: "near_name",
          confidence: best.s,
          candidate: near.length === 1 ? near[0].c : null,
          candidates: near.map((x) => x.c),
          reason: `Tên gần giống (${Math.round(best.s * 100)}%) — cần xác nhận, không tự gộp`,
        };
      }
      // Tin cậy thấp: có ứng viên mờ → vẫn review để tránh tạo trùng do typo.
      return {
        decision: "needs_review",
        kind: "low_confidence",
        confidence: best.s,
        candidate: null,
        candidates: scored.map((x) => x.c),
        reason: `Độ tin cậy thấp (${Math.round(best.s * 100)}%) — cần xác nhận`,
      };
    }
  }

  // 6) Không có ứng viên nào.
  if (opts.guard) {
    return {
      decision: "needs_review",
      kind: "none",
      confidence: 0,
      candidate: null,
      candidates: [],
      reason: "Danh mục quan trọng: không tự tạo, cần xác nhận",
    };
  }
  return {
    decision: "create",
    kind: "none",
    confidence: 0,
    candidate: null,
    candidates: [],
    reason: "Không tìm thấy — tạo mới",
  };
}
