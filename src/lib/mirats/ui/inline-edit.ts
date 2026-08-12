// ============================================================================
// Task 31 — Inline edit: validate + build update payload dùng chung.
//
// Nguyên tắc:
// - Field nhạy cảm (ID bất biến, tồn kho…) TỪ CHỐI ghi qua đường này (Task 14/18/15).
// - Trạng thái phải tuân vòng đời (Task 3 / su-co-state, cong-viec-state).
// - Mọi cập nhật đi qua "logical RPC" — component runtime chọn đường ghi cụ thể
//   (RPC nghiệp vụ / update bảng có guard) → giữ CSDL là nguồn sự thật.
// - Không ghi client-only: hàm này KHÔNG gọi network, chỉ pure logic để test.
// ============================================================================

import { canTransition as canTransitionSuCo } from "@/lib/mirats/su-co-state";
import { canTransition as canTransitionCongViec } from "@/lib/mirats/cong-viec-state";

export interface InlineEditResult {
  hopLe: boolean;
  loi: string[];
  giaTriChuan: unknown;
}

export interface UpdatePayload {
  rpc: string;
  args: Record<string, unknown>;
}

export type Loai =
  | "thiet_bi"
  | "su_co"
  | "van_de"
  | "cong_viec"
  | "hong_hoc"
  | "ban_giao"
  | "giay_phep"
  | "vat_tu"
  | "kho";

/**
 * Field CHỈ-ĐỌC theo `loai` — không được sửa qua inline edit dù người dùng có
 * quyền. Bao gồm: mã bất biến (Task 18), serial UNIQUE (Task 14), tồn kho
 * (Task 15 — chỉ ghi qua kho_nhap/kho_xuat).
 */
const READ_ONLY: Record<Loai, readonly string[]> = {
  thiet_bi: ["id", "ma_thiet_bi", "ma_serial", "created_at", "updated_at"],
  su_co: ["id", "ma_su_co", "created_at"],
  van_de: ["id", "ma_van_de", "created_at"],
  cong_viec: ["id", "ma_cong_viec", "created_at"],
  hong_hoc: ["id", "ma_hong_hoc", "created_at"],
  ban_giao: ["id", "ma_ban_giao", "created_at"],
  giay_phep: ["id", "so_giay_phep", "created_at"],
  vat_tu: ["id", "ma_vat_tu", "so_luong_ton", "so_luong", "ton_kho", "created_at"],
  // Kho là sổ append-only — mọi cột đều chỉ-đọc qua inline edit.
  kho: ["*"],
};

/** Domain có state machine (Task 3). Field trạng thái được kiểm bằng canTransition. */
const STATUS_FIELD: Partial<Record<Loai, string>> = {
  su_co: "trang_thai",
  cong_viec: "trang_thai",
};

/** True nếu `field` là chỉ-đọc với `loai`. */
export function isReadOnlyField(loai: Loai, field: string): boolean {
  const list = READ_ONLY[loai] ?? [];
  if (list.includes("*")) return true;
  return list.includes(field);
}

/**
 * Kiểm tra `giaTri` có hợp lệ cho `field` của `loai` không.
 * - Field chỉ-đọc → từ chối.
 * - Field trạng thái → tuân vòng đời (Task 3). `truoc` là trạng thái hiện tại
 *   để so sánh chuyển tiếp; nếu không truyền, coi như tạo mới → chỉ chấp nhận
 *   giá trị hợp lệ của domain.
 * - Field khác → chuẩn hoá cơ bản (trim string, null nếu rỗng).
 */
export function validateField(
  loai: Loai,
  field: string,
  giaTri: unknown,
  truoc?: unknown,
): InlineEditResult {
  const loi: string[] = [];

  if (isReadOnlyField(loai, field)) {
    return {
      hopLe: false,
      loi: [`Trường "${field}" là bất biến/chỉ-đọc, không sửa qua inline edit`],
      giaTriChuan: giaTri,
    };
  }

  // Trạng thái: kiểm chuyển tiếp
  if (STATUS_FIELD[loai] === field) {
    const to = typeof giaTri === "string" ? giaTri : "";
    const from = typeof truoc === "string" ? truoc : "";
    const ok =
      loai === "su_co"
        ? canTransitionSuCo(from, to)
        : loai === "cong_viec"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? canTransitionCongViec(from, to as any)
          : false;
    if (!ok) {
      loi.push(`Không được chuyển trạng thái từ "${from || "?"}" sang "${to || "?"}"`);
    }
    return { hopLe: loi.length === 0, loi, giaTriChuan: to };
  }

  // Chuẩn hoá chung
  let chuan: unknown = giaTri;
  if (typeof giaTri === "string") {
    const t = giaTri.trim();
    chuan = t.length === 0 ? null : t;
  }
  return { hopLe: true, loi, giaTriChuan: chuan };
}

/**
 * Xây payload cập nhật.
 * - Field trạng thái → RPC chuyển trạng thái nghiệp vụ.
 * - Field thường → RPC update field chuẩn (`cap_nhat_field_<loai>`) — runtime
 *   sẽ ánh xạ sang UPDATE có guard hoặc RPC tương ứng.
 * Ném lỗi nếu `field` chỉ-đọc — chặn ngay ở tầng logic.
 */
export function buildUpdatePayload(
  loai: Loai,
  id: string,
  field: string,
  giaTri: unknown,
): UpdatePayload {
  if (isReadOnlyField(loai, field)) {
    throw new Error(`Field "${field}" của "${loai}" không được sửa qua inline edit`);
  }
  if (STATUS_FIELD[loai] === field) {
    return {
      rpc: `chuyen_trang_thai_${loai}`,
      args: { p_id: id, p_trang_thai: giaTri },
    };
  }
  return {
    rpc: `cap_nhat_field_${loai}`,
    args: { p_id: id, p_field: field, p_gia_tri: giaTri },
  };
}

// ============================================================================
// P6 — Resolver "intent" cho inline-edit tại 3 view (Danh sách / Bảng / Sơ đồ).
//
// 3 view (tree/table/mindmap) trong _app.he-thong.cay.tsx cùng gọi hook
// `useCellEditor` — hook đọc intent ở đây rồi dispatch sang đúng đường ghi
// (renameEntity / saveCell / saveNode). Nhờ đó cùng 1 (kind, ma, field, value)
// sửa từ view nào cũng ghi vào cùng một đích, không lệch.
// ============================================================================

/** Layer nghiệp vụ cho cây hệ thống — khớp với `EditKind` ở route. */
export type CayKind = "pl" | "nh" | "ht" | "tb" | "tp" | "root" | "vtg" | "vt";


/** View gốc chỉ để log/telemetry; KHÔNG dùng để đổi đích ghi. */
export type CayView = "tree" | "table" | "mindmap";

export type CellEditIntent =
  /** Đổi tên node THẬT — đi qua renameEntity() (SSoT bảng gốc). */
  | { target: "renameEntity"; kind: CayKind; id: string; ten: string }
  /** Sửa 1 cột vật lý của tài sản — UPDATE thẳng bảng `thiet_bi`. */
  | { target: "saveCell"; ma: string; col: string; value: string | number | null }
  /**
   * Rơi vào saveNode: hoặc node nháp (không có bản ghi thật) đổi tên,
   * hoặc field/du_lieu khác cột vật lý của layer tài sản.
   */
  | { target: "saveNode"; kind: CayKind; ma: string; field: string; value: unknown; isReal: boolean };

export interface ResolveEditInput {
  kind: CayKind;
  ma: string;
  /** Tên field/cột được sửa. "ten" ⇒ đổi tên; ngoài ra ⇒ cột vật lý/du_lieu. */
  field: string;
  value: unknown;
  /** true nếu node có bản ghi thật ở bảng gốc (pl/nh/ht/tb). */
  isReal: boolean;
  /** id/ma dùng cho renameEntity (uuid với pl/nh/ht, mã với tb). */
  realId?: string;
  /**
   * Cột được đăng ký là "cột vật lý của thiet_bi" — do route cấp qua
   * `PHYS_TABLE_BY_LAYER`. Nếu không truyền, mọi field non-"ten" của layer tb
   * đều đi qua saveCell (đơn giản hoá đường ghi cho bảng).
   */
  physCols?: readonly string[];
}

/**
 * Ánh xạ (kind, field, value) → intent ghi duy nhất.
 * Cùng input ⇒ cùng output bất kể view gốc — đây là điểm hội tụ của 3 view.
 */
export function resolveEditIntent(input: ResolveEditInput): CellEditIntent {
  const { kind, ma, field, value, isReal, realId, physCols } = input;

  // 1) Đổi tên
  if (field === "ten") {
    const ten = typeof value === "string" ? value.trim() : "";
    if (isReal && realId) {
      return { target: "renameEntity", kind, id: realId, ten };
    }
    // Node nháp / override — saveNode giữ tên đè
    return { target: "saveNode", kind, ma, field: "ten", value: ten, isReal: false };
  }

  // 2) Cột vật lý của tài sản → saveCell (UPDATE thiet_bi)
  if (kind === "tb" && (!physCols || physCols.includes(field))) {
    const v =
      typeof value === "string"
        ? value.trim().length === 0
          ? null
          : value.trim()
        : (value as string | number | null);
    return { target: "saveCell", ma, col: field, value: v };
  }

  // 3) Còn lại — saveNode (du_lieu / cột layer khác)
  return { target: "saveNode", kind, ma, field, value, isReal };
}

