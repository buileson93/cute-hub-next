// ============================================================================
// P9 — Nguyên tắc CHỈ-ĐỌC của Sổ lý lịch theo LAYER.
//
// Sổ lý lịch chỉ tường thuật lịch sử; mọi ô chỉnh sửa nghiệp vụ phải quay về
// đúng LAYER sở hữu (tài sản `tb`, hệ thống `ht`, thành phần `tp`). Module
// này là hàm THUẦN — không React, không Supabase — để 3 view (cây, bảng,
// mindmap) và Sổ lý lịch dùng chung tiêu chí "field thuộc layer nào".
//
// Nguồn tri thức:
//   • THIET_BI_PHYS_GROUPS  → khoá layer `tb`
//   • HE_THONG_PHYS_GROUPS  → khoá layer `ht`
//   • `tp` (thành phần) hiện chưa có nhóm cột vật lý riêng; sổ lý lịch của
//     thành phần đọc từ bảng `he_thong_thanh_phan` — quy về entity table
//     dưới cùng file.
// ============================================================================

import {
  THIET_BI_PHYS_GROUPS,
  HE_THONG_PHYS_GROUPS,
  type PhysGroup,
} from "./editable-columns";
import type { ChangeEvent } from "./change-log";
import type { ChangeTimelineEvent } from "./record-timeline";

export type SoLyLichLayer = "tb" | "ht" | "tp";

/** Bảng entity (audit_log.entity) ↔ layer sở hữu. */
export const ENTITY_TO_LAYER: Record<string, SoLyLichLayer> = {
  thiet_bi: "tb",
  dm_he_thong: "ht",
  he_thong_thanh_phan: "tp",
};

function keysOf(groups: PhysGroup[]): Set<string> {
  const s = new Set<string>();
  for (const g of groups) for (const c of g.cols) s.add(c.key);
  return s;
}

const TB_KEYS = keysOf(THIET_BI_PHYS_GROUPS);
const HT_KEYS = keysOf(HE_THONG_PHYS_GROUPS);

/** Tập khoá vật lý mỗi layer sở hữu. */
export const KEYS_BY_LAYER: Record<SoLyLichLayer, Set<string>> = {
  tb: TB_KEYS,
  ht: HT_KEYS,
  tp: new Set<string>(), // thành phần dùng cột chung; không sở hữu field riêng
};

/**
 * Field `key` có thuộc layer khác với `currentLayer` không?
 * Dùng để tô "chỉ-đọc" các đổi field xuyên layer khi hiển thị trong sổ lý
 * lịch — sổ này KHÔNG mở đường sửa nghiệp vụ trùng với view sở hữu.
 */
export function isReadOnlyOnLayer(currentLayer: SoLyLichLayer, key: string): boolean {
  const owned = KEYS_BY_LAYER[currentLayer]?.has(key) ?? false;
  if (owned) return false;
  // Field không thuộc layer hiện tại nhưng thuộc một layer khác → chỉ-đọc.
  for (const [layer, keys] of Object.entries(KEYS_BY_LAYER) as [SoLyLichLayer, Set<string>][]) {
    if (layer !== currentLayer && keys.has(key)) return true;
  }
  return false;
}

/**
 * Quy đổi 1 ChangeEvent (từ `useChangeLog`) sang ChangeTimelineEvent để hoà
 * vào `buildRecordTimeline`. Nếu bất kỳ trường thay đổi nào thuộc layer khác,
 * gắn tiền tố `[chỉ đọc từ layer khác]` vào mô tả để UX rõ ràng — không tự
 * ngắt sự kiện, chỉ đánh dấu để không hiển thị nút chỉnh trực tiếp.
 */
export function mapChangeEventForLayer(
  ev: ChangeEvent,
  currentLayer: SoLyLichLayer,
): ChangeTimelineEvent {
  const changesText = ev.changes
    .map((c) => `${c.label}: ${String(c.from ?? "∅")} → ${String(c.to ?? "∅")}`)
    .join(" · ");
  const hasCrossLayer = ev.changes.some((c) => isReadOnlyOnLayer(currentLayer, c.key));
  return {
    at: ev.at,
    action: ev.action,
    userName: ev.userName,
    changesCount: ev.changes.length,
    changesText: hasCrossLayer ? `[chỉ đọc từ layer khác] ${changesText}` : changesText,
  };
}
