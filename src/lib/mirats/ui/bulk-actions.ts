// ============================================================================
// Task 32 — Bulk actions: thao tác hàng loạt an toàn trên StandardTable.
//
// Nguyên tắc:
// - Pure logic — không gọi network. Component runtime dùng payload để gọi RPC.
// - PREVIEW trước khi ghi: đếm áp dụng / bỏ qua + cảnh báo, KHÔNG bao giờ tự
//   sửa dữ liệu ở đây.
// - Ràng buộc tái dùng: vòng đời trạng thái (Task 3, su-co-state / cong-viec-state),
//   mốc đóng sự cố (Task 3 — canClose).
// - Field nhạy cảm chặn ở tầng inline-edit; bulk chỉ cho các hành động nghiệp vụ
//   đã liệt kê (chuyển trạng thái / gán danh mục / gán người).
// ============================================================================

import { canTransition as canTransitionSuCo, canClose } from "@/lib/mirats/su-co-state";
import { canTransition as canTransitionCongViec } from "@/lib/mirats/cong-viec-state";
import type { Loai } from "@/lib/mirats/ui/inline-edit";

export type BulkKieu = "chuyen_trang_thai" | "gan_danh_muc" | "gan_nguoi";

export interface BulkHanhDong {
  kieu: BulkKieu;
  giaTri: unknown;
  /** Tên field FK khi kieu = gan_danh_muc / gan_nguoi (VD: dm_loai_id, nguoi_phu_trach). */
  field?: string;
}

export interface BulkPreviewChiTiet {
  id: string;
  apDung: boolean;
  lyDo?: string;
}

export interface BulkPreview {
  apDung: number;
  boQua: number;
  canhBao: string[];
  chiTiet: BulkPreviewChiTiet[];
}

export interface BulkPayload {
  rpc: string;
  args: Record<string, unknown>;
}

export interface RowLike {
  id: string;
  trang_thai?: string | null;
  thoi_diem_khac_phuc?: string | null;
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

function validateOne(loai: Loai, row: RowLike, h: BulkHanhDong): { ok: boolean; lyDo?: string } {
  if (h.kieu === "chuyen_trang_thai") {
    const to = typeof h.giaTri === "string" ? h.giaTri : "";
    const from = typeof row.trang_thai === "string" ? row.trang_thai : "";
    if (!to) return { ok: false, lyDo: "Thiếu trạng thái đích" };
    if (from === to) return { ok: false, lyDo: "Đã ở trạng thái này" };

    if (loai === "su_co") {
      if (!canTransitionSuCo(from, to)) {
        return { ok: false, lyDo: `Không được chuyển "${from}" → "${to}"` };
      }
      // Ràng buộc mốc: chỉ "Đã khắc phục" khi có thoi_diem_khac_phuc.
      if (to === "Đã khắc phục" && !canClose(row)) {
        return { ok: false, lyDo: "Thiếu mốc khắc phục" };
      }
      return { ok: true };
    }
    if (loai === "cong_viec") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!canTransitionCongViec(from as any, to as any)) {
        return { ok: false, lyDo: `Không được chuyển "${from}" → "${to}"` };
      }
      return { ok: true };
    }
    return { ok: false, lyDo: `Loại "${loai}" không có vòng đời trạng thái` };
  }

  if (h.kieu === "gan_danh_muc" || h.kieu === "gan_nguoi") {
    if (!h.field) return { ok: false, lyDo: "Thiếu field đích" };
    if (h.giaTri === null || h.giaTri === undefined || h.giaTri === "") {
      return { ok: false, lyDo: "Thiếu giá trị gán" };
    }
    const cur = row[h.field];
    if (cur === h.giaTri) return { ok: false, lyDo: "Đã trùng giá trị hiện tại" };
    return { ok: true };
  }

  return { ok: false, lyDo: "Hành động không hỗ trợ" };
}

/**
 * Preview tác động của bulk action: đếm áp dụng/bỏ qua + cảnh báo.
 * KHÔNG ghi CSDL; UI phải gọi RPC sau khi người dùng xác nhận.
 */
export function previewBulk(
  loai: Loai,
  rows: readonly RowLike[],
  hanhDong: BulkHanhDong,
): BulkPreview {
  const chiTiet: BulkPreviewChiTiet[] = [];
  const canhBaoSet = new Set<string>();
  let apDung = 0;
  let boQua = 0;

  for (const r of rows) {
    const v = validateOne(loai, r, hanhDong);
    if (v.ok) {
      apDung++;
      chiTiet.push({ id: r.id, apDung: true });
    } else {
      boQua++;
      chiTiet.push({ id: r.id, apDung: false, lyDo: v.lyDo });
      if (v.lyDo) canhBaoSet.add(v.lyDo);
    }
  }

  return { apDung, boQua, canhBao: [...canhBaoSet], chiTiet };
}

// ---------------------------------------------------------------------------
// Build payload
// ---------------------------------------------------------------------------

/**
 * Xây payload RPC theo lô. Component runtime sẽ gọi supabase.rpc(rpc, args).
 * Quy ước RPC:
 * - chuyen_trang_thai → `bulk_chuyen_trang_thai_<loai>` (p_ids, p_trang_thai, p_nguon)
 * - gan_danh_muc / gan_nguoi → `bulk_gan_field_<loai>` (p_ids, p_field, p_gia_tri, p_nguon)
 */
export function buildBulkPayload(
  loai: Loai,
  ids: readonly string[],
  hanhDong: BulkHanhDong,
  nguon: string = "ui_bulk",
): BulkPayload {
  if (ids.length === 0) throw new Error("Danh sách ID rỗng");

  if (hanhDong.kieu === "chuyen_trang_thai") {
    return {
      rpc: `bulk_chuyen_trang_thai_${loai}`,
      args: {
        p_ids: [...ids],
        p_trang_thai: hanhDong.giaTri,
        p_nguon: nguon,
      },
    };
  }

  if (hanhDong.kieu === "gan_danh_muc" || hanhDong.kieu === "gan_nguoi") {
    if (!hanhDong.field) throw new Error("Thiếu field đích cho hành động gán");
    return {
      rpc: `bulk_gan_field_${loai}`,
      args: {
        p_ids: [...ids],
        p_field: hanhDong.field,
        p_gia_tri: hanhDong.giaTri,
        p_nguon: nguon,
      },
    };
  }

  throw new Error(`Hành động "${hanhDong.kieu}" không hỗ trợ`);
}

// ---------------------------------------------------------------------------
// Undo plan — khôi phục giá trị CŨ theo từng nhóm giá trị (audit đủ N dòng).
// ---------------------------------------------------------------------------

export interface UndoSnapshotItem {
  id: string;
  oldValue: unknown;
}

/**
 * Lập kế hoạch hoàn tác PURE (không gọi network): nhóm các dòng theo `oldValue`
 * rồi sinh 1 BulkPayload cho mỗi nhóm với nguồn audit `ui_bulk_undo`.
 *
 * Đảm bảo mỗi dòng khôi phục ĐÚNG giá trị cũ của nó — không "san bằng" toàn bộ
 * về 1 giá trị. Số RPC = số nhóm giá trị cũ (thường nhỏ hơn N nhiều).
 */
export function buildUndoPlan(
  loai: Loai,
  hanhDong: BulkHanhDong,
  snapshot: readonly UndoSnapshotItem[],
): BulkPayload[] {
  if (snapshot.length === 0) return [];
  const groups = new Map<string, { oldValue: unknown; ids: string[] }>();
  for (const s of snapshot) {
    const k = JSON.stringify(s.oldValue ?? null);
    const g = groups.get(k);
    if (g) g.ids.push(s.id);
    else groups.set(k, { oldValue: s.oldValue, ids: [s.id] });
  }
  const plan: BulkPayload[] = [];
  for (const g of groups.values()) {
    const undoAction: BulkHanhDong =
      hanhDong.kieu === "chuyen_trang_thai"
        ? { kieu: "chuyen_trang_thai", giaTri: g.oldValue }
        : { kieu: hanhDong.kieu, field: hanhDong.field, giaTri: g.oldValue };
    plan.push(buildBulkPayload(loai, g.ids, undoAction, "ui_bulk_undo"));
  }
  return plan;
}
