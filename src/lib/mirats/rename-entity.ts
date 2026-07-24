// ============================================================================
// SSoT tên & trường: primitive dùng chung cho mọi view (Cây, Bảng, Danh mục,
// MindMap). Mọi thao tác ghi tên đi qua `renameEntity`, mọi thao tác ghi 1
// trường đi qua `updateEntityField` — không component nào tự viết SQL update
// thẳng vào bảng gốc.
//
// - pl → dm_phan_loai.ten (id)
// - nh → dm_nhom_he_thong.ten (id)         [fallback: cay_node_edit nếu là nháp]
// - ht → dm_he_thong.ten (id)
// - tb → thiet_bi.ten_thiet_bi (ma_thiet_bi)
// - md → dm_model.ten (id)
// - nsx → dm_nha_san_xuat.ten (id)
// - ncc → dm_nha_cung_cap.ten (id)
// - loai → dm_loai_thiet_bi.ten (id)
// - dv → dm_don_vi.ten (id)
// - vt → dm_vi_tri.ten (id)
//
// Không đụng vào cay_node_edit cho node THẬT — bảng đó chỉ còn giữ metadata
// sơ đồ (màu, thứ tự, ghi chú) và bản nháp nhóm chưa promote.
// ============================================================================

import { supabase } from "@/integrations/supabase/client";

export type RenameKind =
  | "pl"
  | "nh"
  | "ht"
  | "tb"
  | "md"
  | "nsx"
  | "ncc"
  | "loai"
  | "dv"
  | "vt";

interface TargetSpec {
  table: string;
  keyCol: string;
  nameCol: string;
}

const TARGETS: Record<RenameKind, TargetSpec> = {
  pl: { table: "dm_phan_loai", keyCol: "id", nameCol: "ten" },
  nh: { table: "dm_nhom_he_thong", keyCol: "id", nameCol: "ten" },
  ht: { table: "dm_he_thong", keyCol: "id", nameCol: "ten" },
  tb: { table: "thiet_bi", keyCol: "ma_thiet_bi", nameCol: "ten_thiet_bi" },
  md: { table: "dm_model", keyCol: "id", nameCol: "ten" },
  nsx: { table: "dm_nha_san_xuat", keyCol: "id", nameCol: "ten" },
  ncc: { table: "dm_nha_cung_cap", keyCol: "id", nameCol: "ten" },
  loai: { table: "dm_loai_thiet_bi", keyCol: "id", nameCol: "ten" },
  dv: { table: "dm_don_vi", keyCol: "id", nameCol: "ten" },
  vt: { table: "dm_vi_tri", keyCol: "id", nameCol: "ten" },
};

export function getTargetSpec(kind: RenameKind): TargetSpec {
  const t = TARGETS[kind];
  if (!t) throw new Error(`Không hỗ trợ kind=${kind}`);
  return t;
}

export interface RenameInput {
  kind: RenameKind;
  /** Khoá bảng gốc: uuid với hầu hết kind, ma_thiet_bi với tb; mã nhóm nháp với draft. */
  id: string;
  ten: string;
  /**
   * Bật khi node CHƯA có bản ghi thật (chỉ áp dụng cho `nh` — nhóm hệ thống
   * nháp còn nằm trong cay_node_edit chờ promote qua dm_nhom_he_thong).
   */
  draft?: boolean;
}

export async function renameEntity(input: RenameInput): Promise<void> {
  const ten = (input.ten ?? "").trim();
  const id = (input.id ?? "").trim();
  if (!ten) throw new Error("Tên không được để trống");
  if (!id) throw new Error("Thiếu định danh bản ghi để đổi tên");

  if (input.draft) {
    if (input.kind !== "nh") {
      throw new Error(
        `Chỉ nhóm hệ thống (nh) có khái niệm nháp — không hỗ trợ draft cho kind=${input.kind}`,
      );
    }
    const { error } = await supabase
      .from("cay_node_edit")
      .upsert(
        { kind: "nh", ma: id, ten } as never,
        { onConflict: "kind,ma" },
      );
    if (error) throw error;
    return;
  }

  const target = getTargetSpec(input.kind);
  const { error } = await supabase
    .from(target.table as never)
    .update({ [target.nameCol]: ten } as never)
    .eq(target.keyCol, id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// updateEntityField — primitive ghi 1 trường (không phải tên) cho mọi kind.
// Dùng chung ở CatalogTable, các trang danh mục và StandardTable inline edit.
// ---------------------------------------------------------------------------
export interface UpdateFieldInput {
  kind: RenameKind;
  id: string;
  /** Tên cột trong bảng gốc (không được là cột tên — dùng `renameEntity`). */
  col: string;
  value: string | number | boolean | null;
}

export async function updateEntityField(input: UpdateFieldInput): Promise<void> {
  const id = (input.id ?? "").trim();
  const col = (input.col ?? "").trim();
  if (!id) throw new Error("Thiếu định danh bản ghi");
  if (!col) throw new Error("Thiếu tên cột cần cập nhật");
  const target = getTargetSpec(input.kind);
  if (col === target.nameCol) {
    throw new Error(
      `Không ghi cột tên qua updateEntityField — dùng renameEntity thay thế (kind=${input.kind})`,
    );
  }
  const { error } = await supabase
    .from(target.table as never)
    .update({ [col]: input.value } as never)
    .eq(target.keyCol, id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// updateEntityRow — batch update nhiều trường trong 1 round-trip.
// Dùng cho form Danh mục (Thêm/Sửa) và các trang _app.danh-muc.*.tsx.
// Nếu payload có `ten`/`ten_thiet_bi`, đảm bảo route qua renameEntity semantics
// (trim, chặn rỗng) trước khi hợp nhất vào UPDATE.
// ---------------------------------------------------------------------------
export interface UpdateRowInput {
  kind: RenameKind;
  id: string;
  patch: Record<string, string | number | boolean | null>;
}

export async function updateEntityRow(input: UpdateRowInput): Promise<void> {
  const id = (input.id ?? "").trim();
  if (!id) throw new Error("Thiếu định danh bản ghi");
  const target = getTargetSpec(input.kind);
  const patch: Record<string, string | number | boolean | null> = { ...input.patch };
  if (target.nameCol in patch) {
    const ten = String(patch[target.nameCol] ?? "").trim();
    if (!ten) throw new Error("Tên không được để trống");
    patch[target.nameCol] = ten;
  }
  const { error } = await supabase
    .from(target.table as never)
    .update(patch as never)
    .eq(target.keyCol, id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Model inheritance — mirror trigger `thiet_bi_inherit_model` để UI có thể
// tính optimistic patch khi sửa dm_model. Chỉ ghi đè khi giá trị mới KHÁC NULL
// (giống trigger). Trả về map { col: newValue } — rỗng nếu không cần đổi.
// ---------------------------------------------------------------------------
export interface ModelSnapshot {
  loai_thiet_bi_id?: string | null;
  nha_san_xuat_id?: string | null;
  field_set_id?: string | null;
  p_n?: string | null;
}

/** Các trường mà trigger `thiet_bi_inherit_model` ghi đè xuống thiet_bi. */
export const MODEL_INHERITED_COLS = [
  "loai_thiet_bi_id",
  "nha_san_xuat_id",
  "field_set_id",
  "p_n",
] as const;

export function computeInheritedThietBiPatch(
  oldModel: ModelSnapshot,
  newModel: ModelSnapshot,
): Record<string, string | null> {
  const patch: Record<string, string | null> = {};
  for (const col of MODEL_INHERITED_COLS) {
    const before = (oldModel as Record<string, string | null | undefined>)[col] ?? null;
    const after = (newModel as Record<string, string | null | undefined>)[col] ?? null;
    // Trigger chỉ ghi đè khi giá trị mới KHÁC NULL và KHÁC giá trị hiện có.
    // p_n bổ sung điều kiện `<> ''`.
    if (after === null || after === undefined) continue;
    if (col === "p_n" && after === "") continue;
    if (before === after) continue;
    patch[col] = after;
  }
  return patch;
}
