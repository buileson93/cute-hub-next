// ============================================================================
// MẪU "ALL-IN-ONE" (.xlsx) — một file duy nhất, nhiều sheet theo từng lớp dữ
// liệu, khai được toàn bộ hệ thống tài sản trong 1 lần:
//
//   1. Phân loại · 2. Nhóm hệ thống · 3. Nhà sản xuất · 4. Nhà cung cấp ·
//   5. Chủng loại · 6. Đơn vị · 7. Vị trí · 8. Model ·
//   9. Hệ thống · 10. Tài sản
//
// Đặc điểm:
//   * Mỗi sheet là một entity trong import-config (NGUỒN SỰ THẬT duy nhất) →
//     cột không bao giờ lệch với luồng nhập hàng loạt.
//   * Ô tham chiếu (danh mục) có Data Validation (dropdown) đổ từ CSDL thật.
//   * Xuất kèm dữ liệu hiện có (mã đầy đủ) → nhập lại là CẬP NHẬT, không nhân
//     bản (idempotent theo khóa `ma`).
//   * Nếu giá trị danh mục CHƯA CÓ (vd chủng loại mới) → cứ gõ tay vào ô,
//     hệ thống tự tạo khi ghi (với danh mục cho phép create).
//
// Khắc phục nhược điểm "dropdown tĩnh": khi nhập lại, mọi ô đều được đối chiếu
// với CSDL SỐNG ở bước Xem trước (khớp mã → ten → gần đúng). Giá trị ngoài danh
// mục không bị chặn cứng: hoặc khớp gần đúng, hoặc tạo mới có kiểm soát.
//
// File client-safe: chỉ dùng exceljs + supabase client (browser).
// ============================================================================

import ExcelJS from "exceljs";
import { unzipSync, zipSync } from "fflate";
import { supabase } from "@/integrations/backend/client";
import {
  findEntity, fieldMap, noAccent, compactFields, type EntityDef, type FieldDef,
} from "@/lib/mirats/import-config";

// --------------------------------------------------------------------------
// META & CỘT KỸ THUẬT
// --------------------------------------------------------------------------
// Phiên bản cấu trúc mẫu — gắn với import-config (NGUỒN SỰ THẬT). Đổi khi
// thêm/bớt lớp hoặc đổi ý nghĩa cột kỹ thuật để bên nhập biết cách đọc.
export const SCHEMA_VERSION = "mirats-allinone/2025.07";

/** Tên sheet META ẩn — mang siêu dữ liệu về lần xuất (không phải dữ liệu nghiệp vụ). */
export const META_SHEET = "_MIRATS_META";

/**
 * Cột kỹ thuật (ẩn + khóa) thêm vào ĐẦU mỗi sheet lớp:
 *   _record_id  — id bản ghi CSDL (để nhập lại là CẬP NHẬT đúng dòng, không dựa mã).
 *   _row_version— dấu thời gian phiên bản (updated_at) để phát hiện xung đột về sau.
 *   _action     — hành động dự kiến: create/update/skip/delete.
 *   _source_row — số dòng gốc trong sheet (giúp báo lỗi đúng dòng khi nhập lại).
 */
export const TECH_COLS = ["_record_id", "_row_version", "_action", "_source_row"] as const;
export type TechColKey = (typeof TECH_COLS)[number];
const TECH_COL_SET = new Set<string>(TECH_COLS);
const TECH_OFFSET = TECH_COLS.length;
const ACTION_VALUES = ["create", "update", "skip", "delete"] as const;

/** Tên sheet AI_RULES ẩn — JSON một dòng ở A1 để AI agent parse trực tiếp. */
export const AI_RULES_SHEET = "③ AI_RULES";

/** Các "block header" bắt buộc phải xuất hiện trên sheet ① Hướng dẫn (skill card). */
export const GUIDE_BLOCKS = [
  "# ROLE",
  "# INVARIANTS",
  "# WORKFLOW",
  "# LAYER_MAP",
  "# FIELD_HINTS",
  "# ANOMALY_RULES",
  "# SELF_CHECK",
  "# EXAMPLES",
  "# ERROR_RECOVERY",
] as const;

const TECH_NOTE: Record<TechColKey, string> = {
  _record_id: "Kỹ thuật — id bản ghi CSDL. KHÔNG sửa/xóa: dùng để nhập lại đúng dòng (cập nhật, không nhân bản).",
  _row_version: "Kỹ thuật — phiên bản dòng (updated_at) lúc xuất. Dùng phát hiện xung đột khi nhập lại. KHÔNG sửa.",
  _action: "Kỹ thuật — hành động: create/update/skip/delete. Mặc định 'update' cho dòng có sẵn.",
  _source_row: "Kỹ thuật — số dòng gốc trong sheet để báo lỗi đúng vị trí. KHÔNG sửa.",
};

/** Siêu dữ liệu ghi vào (và đọc ra từ) sheet META ẩn. */
export interface AllInOneMeta {
  export_id: string;
  schema_version: string;
  generated_at: string;
  /** Mô tả phạm vi đã xuất (mode + lựa chọn từng lớp). */
  scope: string;
  /** Hành động cho phép khi nhập lại file này. */
  allowed_actions: string[];
}



// --------------------------------------------------------------------------
// Thứ tự lớp (cha trước, con sau) — đúng thứ tự phụ thuộc khi ghi.
// --------------------------------------------------------------------------
export type Layer = {
  /** id entity trong import-config ("danh_muc" | "dm_model" | "dm_he_thong" | "thiet_bi"). */
  entity: string;
  /** Với danh mục nền: tên bảng cụ thể. */
  catTable?: string;
  /** Tên sheet trong file (≤ 31 ký tự). */
  sheet: string;
  /** Mô tả ngắn in ở sheet Hướng dẫn. */
  desc: string;
};

/** Nhóm lớp — quyết định màu tab & màu nền tiêu đề (phân biệt trực quan). */
export type LayerGroup = "catalog" | "structure" | "asset" | "operational";

export const ALLINONE_LAYERS: (Layer & { group: LayerGroup })[] = [
  { entity: "danh_muc", catTable: "dm_phan_loai", sheet: "1. Phân loại", group: "catalog", desc: "Nhóm 1/2/3 — gốc phân cấp tài sản." },
  { entity: "danh_muc", catTable: "dm_nhom_he_thong", sheet: "2. Nhóm hệ thống", group: "catalog", desc: "VHF/VCCS… (thuộc một Phân loại)." },
  { entity: "danh_muc", catTable: "dm_nha_san_xuat", sheet: "3. Nhà sản xuất", group: "catalog", desc: "Hãng sản xuất tài sản." },
  { entity: "danh_muc", catTable: "dm_nha_cung_cap", sheet: "4. Nhà cung cấp", group: "catalog", desc: "Đơn vị cung cấp/bán hàng." },
  { entity: "danh_muc", catTable: "dm_loai_thiet_bi", sheet: "5. Chủng loại", group: "catalog", desc: "Máy tính, Switch, Máy UHF…" },
  { entity: "danh_muc", catTable: "dm_don_vi", sheet: "6. Đơn vị", group: "catalog", desc: "Đơn vị quản lý (phân cấp)." },
  { entity: "danh_muc", catTable: "dm_vi_tri", sheet: "7. Vị trí", group: "catalog", desc: "Vị trí địa lý (Đài/Phòng…)." },
  { entity: "dm_model", sheet: "8. Model", group: "structure", desc: "Model — kế thừa NSX/Loại; tài sản trỏ tới đây." },
  { entity: "dm_he_thong", sheet: "9. Hệ thống", group: "structure", desc: "Hệ thống (thuộc Nhóm hệ thống + Đơn vị)." },
  { entity: "giay_phep_khai_thac", sheet: "10. Giấy phép khai thác", group: "structure", desc: "Giấy phép khai thác hệ thống (khoá = gp_so)." },
  { entity: "he_thong_thanh_phan", sheet: "11. Thành phần HT", group: "structure", desc: "Vị trí chức năng trong hệ thống — nơi tài sản được lắp vào." },
  { entity: "thiet_bi", sheet: "12. Tài sản", group: "asset", desc: "Tài sản vật lý — có serial. Cột 'Trạng thái lắp' là CHỈ ĐỌC." },
  { entity: "thiet_bi_khe_linh_kien", sheet: "13. Khe linh kiện", group: "asset", desc: "Khe/slot bên trong tài sản cha — nơi lắp linh kiện." },
  { entity: "vat_tu", sheet: "14. Vật tư", group: "operational", desc: "Vật tư dự phòng/tiêu hao — quản lý kho." },
  { entity: "nhan_vien", sheet: "15. Nhân viên", group: "operational", desc: "Danh sách nhân viên vận hành." },
  { entity: "chung_chi", sheet: "16. Chứng chỉ tài sản", group: "operational", desc: "Chứng chỉ/kiểm định gắn với tài sản." },
  { entity: "bao_tri", sheet: "17. Lịch sử bảo trì", group: "operational", desc: "Bản ghi bảo trì đã thực hiện." },
];

/** Bảng màu theo nhóm lớp — dùng cho tab, tiêu đề, banding, legend. */
const GROUP_STYLE: Record<LayerGroup, {
  label: string; tab: string; header: string; headerReq: string; band: string; accent: string;
}> = {
  catalog:     { label: "Danh mục nền",         tab: "FF60A5FA", header: "FFDBEAFE", headerReq: "FFFDE68A", band: "FFF1F5F9", accent: "FF1D4ED8" },
  structure:   { label: "Cấu trúc HT",          tab: "FF34D399", header: "FFDCFCE7", headerReq: "FFFDE68A", band: "FFF0FDF4", accent: "FF047857" },
  asset:       { label: "Tài sản",              tab: "FFF59E0B", header: "FFFEF3C7", headerReq: "FFFDE68A", band: "FFFFFBEB", accent: "FF92400E" },
  operational: { label: "Vận hành & vòng đời",  tab: "FFA78BFA", header: "FFEDE9FE", headerReq: "FFFDE68A", band: "FFF5F3FF", accent: "FF6D28D9" },
};

/** Cột hiển thị của mỗi bảng tham chiếu trong dropdown & khi xuất ô ref. */
const REF_DISPLAY: Record<string, "ma" | "ten"> = {
  dm_he_thong: "ma",
  dm_model: "ma",
  thiet_bi: "ma",
};
const refDisplayCol = (table: string): "ma" | "ten" => REF_DISPLAY[table] ?? "ten";

/** A, B, …, AA… cho công thức Data Validation. */
function colLetter(n: number): string {
  let s = "", x = n;
  while (x > 0) { const r = (x - 1) % 26; s = String.fromCharCode(65 + r) + s; x = Math.floor((x - 1) / 26); }
  return s;
}

function entOf(layer: Layer): EntityDef {
  const e = findEntity(layer.entity, layer.catTable);
  if (!e) throw new Error(`Không tìm thấy entity cho sheet "${layer.sheet}"`);
  return e;
}

/** Ô Excel → chuỗi an toàn (rich text/hyperlink/số/ngày). */
function cellStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())}`;
  }
  const o = v as Record<string, unknown>;
  if (typeof o.text === "string") return o.text.trim();
  if (typeof o.result === "string") return o.result.trim();
  if (Array.isArray((o as { richText?: unknown }).richText)) {
    return ((o as { richText: Array<{ text?: string }> }).richText).map((r) => r.text ?? "").join("").trim();
  }
  if (typeof o.hyperlink === "string") return String(o.hyperlink).trim();
  return "";
}

// --------------------------------------------------------------------------
// Nạp dữ liệu danh mục tham chiếu (id → {ma,ten}) + danh sách hiển thị.
// --------------------------------------------------------------------------
type RefMap = { byId: Map<string, { ma: string; ten: string }>; list: string[] };

export type RefConfig = { table: string; keyCol: string; nameCol: string };

async function loadRefMaps(configs: RefConfig[]): Promise<Record<string, RefMap>> {
  // Gom cấu hình duy nhất theo bảng — nếu nhiều ref cùng trỏ 1 bảng, lấy cái đầu.
  const uniq = new Map<string, { keyCol: string; nameCol: string }>();
  for (const c of configs) if (!uniq.has(c.table)) uniq.set(c.table, { keyCol: c.keyCol, nameCol: c.nameCol });
  const out: Record<string, RefMap> = {};
  await Promise.all(
    [...uniq.entries()].map(async ([t, { keyCol, nameCol }]) => {
      // Alias PostgREST: đảm bảo record luôn có {id, ma, ten} bất kể tên cột thật.
      const sel = keyCol === nameCol
        ? `id, ma:${keyCol}, ten:${nameCol}`
        : `id, ma:${keyCol}, ten:${nameCol}`;
      const { data } = await supabase.from(t as never).select(sel).limit(20000);
      const byId = new Map<string, { ma: string; ten: string }>();
      const disp = refDisplayCol(t);
      const set = new Set<string>();
      for (const r of (data ?? []) as Array<Record<string, unknown>>) {
        const ma = String(r.ma ?? "").trim();
        const ten = String(r.ten ?? "").trim();
        if (r.id) byId.set(String(r.id), { ma, ten });
        const shown = (disp === "ma" ? ma : ten) || ma || ten;
        if (shown) set.add(shown);
      }
      out[t] = { byId, list: Array.from(set).sort((a, b) => a.localeCompare(b, "vi")) };
    }),
  );
  return out;
}

/** Khóa lớp = tên bảng (mọi layer map 1-1 tới một bảng). */
export function layerTable(l: Layer): string {
  return entOf(l).table;
}

/** Một bản ghi thô → mảng chuỗi theo đúng thứ tự `fields` (mặc định mọi trường của entity). */
function mapRowToCells(
  r: Record<string, unknown>,
  ent: EntityDef,
  refMaps: Record<string, RefMap>,
  fields: FieldDef[] = ent.fields,
): string[] {
  return fields.map((f) => {
    if (f.kind === "ref" && f.ref) {
      const id = r[f.ref.idCol];
      if (!id) return "";
      const hit = refMaps[f.ref.table]?.byId.get(String(id));
      if (!hit) return "";
      const disp = refDisplayCol(f.ref.table);
      return (disp === "ma" ? hit.ma : hit.ten) || hit.ma || hit.ten || "";
    }
    const v = r[f.col ?? f.key];
    return v == null ? "" : String(v);
  });
}

const KIND_LABEL: Record<FieldDef["kind"], string> = {
  text: "Chuỗi", int: "Số nguyên", num: "Số", date: "Ngày (YYYY-MM-DD)", ref: "Danh mục (chọn)",
};

// ==========================================================================
// PICKER: nạp danh sách bản ghi từng lớp để người dùng chọn phạm vi xuất
// ==========================================================================
export type PickerRecord = { id: string; ma: string; ten: string };
export type PickerLayer = { table: string; sheet: string; label: string; count: number; records: PickerRecord[] };

/** Cột tên hiển thị của một entity ("ten" hoặc "ten_thiet_bi"). */
function nameColOf(ent: EntityDef): string {
  const f = ent.fields.find((x) => ["ten", "ten_thiet_bi", "ho_ten"].includes(x.key));
  return f?.col ?? f?.key ?? ent.naturalKey;
}

/** Nạp danh sách bản ghi (id/mã/tên) cho mọi lớp để dựng giao diện chọn phạm vi. */
export async function loadAllInOnePickerData(): Promise<PickerLayer[]> {
  return Promise.all(
    ALLINONE_LAYERS.map(async (layer) => {
      const ent = entOf(layer);
      const keyCol = ent.naturalKey;
      const nameCol = nameColOf(ent);
      const sel = Array.from(new Set(["id", keyCol, nameCol])).join(",");
      const { data } = await supabase.from(ent.table as never).select(sel).limit(20000);
      const records: PickerRecord[] = ((data ?? []) as Array<Record<string, unknown>>)
        .map((r) => ({ id: String(r.id), ma: String(r[keyCol] ?? ""), ten: String(r[nameCol] ?? "") }))
        .sort((a, b) => (a.ma || a.ten).localeCompare(b.ma || b.ten, "vi"));
      return { table: ent.table, sheet: layer.sheet, label: ent.label, count: records.length, records };
    }),
  );
}

// ==========================================================================
// XUẤT FILE ALL-IN-ONE
// ==========================================================================
/** Lựa chọn xuất cho một lớp (theo tên bảng). */
export type LayerPick =
  | { mode: "all" }
  | { mode: "none" }
  | { mode: "some"; ids: string[] };

export type ExportAllInOneOpts = {
  /** true = kèm dữ liệu hiện có (để cập nhật); false = chỉ khung trống (khai mới). */
  withData: boolean;
  /** Lựa chọn theo từng lớp (khóa = tên bảng). Thiếu = "all" (xuất hết). */
  picks?: Record<string, LayerPick>;
  /** Tự động kèm ĐẦY ĐỦ mọi danh mục mà dữ liệu đã chọn tham chiếu tới. Mặc định true. */
  autoDeps?: boolean;
  /** true = MẪU RÚT GỌN: chỉ cột bắt buộc + hay dùng (giảm gánh nặng nhập liệu). */
  compact?: boolean;
  fileName?: string;
};

/** Mô tả phạm vi xuất (ghi vào META) từ chế độ + lựa chọn từng lớp. */
function describeScope(withData: boolean, picks?: Record<string, LayerPick>): string {
  if (!withData) return "template-empty";
  const entries = Object.entries(picks ?? {});
  if (entries.length === 0) return "snapshot:all";
  const parts = entries.map(([t, p]) =>
    p.mode === "all" ? `${t}:all` : p.mode === "none" ? `${t}:none` : `${t}:${p.ids.length}`,
  );
  return `snapshot:${parts.join(";")}`;
}

/**
 * Dựng workbook All-in-one (KHÔNG tải file) — tách riêng để kiểm thử được nội
 * dung mà không cần DOM. Mọi truy vấn dữ liệu đi qua supabase client của trình
 * duyệt nên CHỊU RLS: người dùng chỉ xuất được dữ liệu trong phạm vi được phép.
 */
export async function buildAllInOneWorkbook(
  { withData, picks, autoDeps = true, compact = false }: Omit<ExportAllInOneOpts, "fileName">,
): Promise<{ wb: ExcelJS.Workbook; meta: AllInOneMeta }> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "MIRATS";
  wb.created = new Date();

  const meta: AllInOneMeta = {
    export_id:
      (typeof globalThis.crypto?.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `exp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`),
    schema_version: SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    scope: describeScope(withData, picks),
    allowed_actions: withData ? ["create", "update", "skip", "delete"] : ["create"],
  };

  const thin = { style: "thin" as const, color: { argb: "FFCBD5E1" } };
  const border = { top: thin, left: thin, bottom: thin, right: thin };


  // Tập hợp mọi bảng tham chiếu dùng trong toàn bộ layer (kèm keyCol/nameCol).
  const refConfigs: RefConfig[] = [];
  for (const layer of ALLINONE_LAYERS) {
    for (const f of entOf(layer).fields) {
      if (f.kind === "ref" && f.ref) {
        refConfigs.push({
          table: f.ref.table,
          keyCol: f.ref.keyCol ?? "ma",
          nameCol: f.ref.nameCol ?? "ten",
        });
      }
    }
  }
  const refMaps = await loadRefMaps(refConfigs);

  // ---- Nạp dữ liệu thô + tính phạm vi hiệu lực cho từng lớp ----
  const rawByTable: Record<string, Array<Record<string, unknown>>> = {};
  // undefined = xuất tất cả; Set (kể cả rỗng) = tập id cụ thể.
  const eff: Record<string, Set<string> | undefined> = {};
  if (withData) {
    const tables = Array.from(new Set(ALLINONE_LAYERS.map((l) => entOf(l).table)));
    await Promise.all(
      tables.map(async (t) => {
        const { data } = await supabase.from(t as never).select("*").limit(20000);
        rawByTable[t] = (data ?? []) as Array<Record<string, unknown>>;
      }),
    );

    for (const l of ALLINONE_LAYERS) {
      const t = entOf(l).table;
      const p = picks?.[t] ?? { mode: "all" };
      eff[t] = p.mode === "all" ? undefined : p.mode === "none" ? new Set<string>() : new Set(p.ids);
    }

    // Cascade XUỐNG theo phân cấp: Phân loại → Nhóm hệ thống → Hệ thống → Tài sản.
    // Chỉ thu hẹp lớp con đang để "tất cả" (undefined); tôn trọng lựa chọn tường minh.
    const narrow = (childT: string, fk: string, parent?: Set<string>) => {
      if (!parent) return;
      if (eff[childT] !== undefined) return;
      const s = new Set<string>();
      for (const r of rawByTable[childT] ?? []) if (parent.has(String(r[fk] ?? ""))) s.add(String(r.id));
      eff[childT] = s;
    };
    narrow("dm_nhom_he_thong", "phan_loai_id", eff["dm_phan_loai"]);
    if (eff["dm_nhom_he_thong"]) narrow("dm_he_thong", "nhom_he_thong_id", eff["dm_nhom_he_thong"]);
    else narrow("dm_he_thong", "phan_loai_id", eff["dm_phan_loai"]);
    narrow("he_thong_thanh_phan", "he_thong_id", eff["dm_he_thong"]);
    narrow("thiet_bi", "he_thong_id", eff["dm_he_thong"]);
    narrow("giay_phep_khai_thac", "he_thong_id", eff["dm_he_thong"]);
    narrow("thiet_bi_khe_linh_kien", "thiet_bi_id", eff["thiet_bi"]);
    narrow("chung_chi_thiet_bi", "thiet_bi_id", eff["thiet_bi"]);

    // Tự động kèm danh mục phụ thuộc: gom mọi id mà dòng đã chọn tham chiếu tới,
    // bơm vào các lớp danh mục đang bị giới hạn (lớp "tất cả" thì vốn đã đủ).
    // Duyệt NGƯỢC thứ tự (con trước, cha sau) để phụ thuộc lan truyền lên trên.
    if (autoDeps) {
      for (let i = ALLINONE_LAYERS.length - 1; i >= 0; i--) {
        const ent = entOf(ALLINONE_LAYERS[i]);
        const t = ent.table;
        const set = eff[t];
        const rows = set ? (rawByTable[t] ?? []).filter((r) => set.has(String(r.id))) : rawByTable[t] ?? [];
        if (rows.length === 0) continue;
        for (const f of ent.fields) {
          if (f.kind !== "ref" || !f.ref) continue;
          const rt = f.ref.table;
          const target = eff[rt];
          if (target === undefined) continue; // lớp danh mục đang "tất cả" → khỏi cần bơm
          for (const r of rows) { const id = r[f.ref.idCol]; if (id) target.add(String(id)); }
        }
      }
    }
  }

  // ---- Sheet ① Hướng dẫn ----
  const guide = wb.addWorksheet("① Hướng dẫn");
  guide.getCell("A1").value = "MẪU KHAI HỆ THỐNG THIẾT BỊ (ALL-IN-ONE) — điền lần lượt các sheet theo thứ tự";
  guide.getCell("A1").font = { bold: true, size: 13, color: { argb: "FF1E3A8A" } };
  guide.mergeCells("A1:D1");
  const gTips = [
    "• Điền TỪ TRÊN XUỐNG: cha trước, con sau (Phân loại → … → Mẫu → Hệ thống → Tài sản).",
    "• Ô 'Danh mục' có mũi tên CHỌN — nên chọn để tránh gõ sai. Chưa có trong danh sách? Cứ gõ tay, hệ thống tự tạo khi ghi (với danh mục cho phép).",
    "• Cột 'ma' là KHÓA: giữ nguyên để CẬP NHẬT bản ghi cũ; xóa/để trống = tạo mới (tự sinh mã).",
    "• Ô để trống khi cập nhật = GIỮ NGUYÊN giá trị cũ. Số serial không được trùng.",
    "• Model (sheet 8) tự kế thừa Nhà SX & Loại xuống tài sản — tài sản chỉ cần trỏ 'model'.",
    "• Khi nhập lại: mọi ô được đối chiếu với dữ liệu SỐNG ở bước Xem trước (khớp mã/tên/gần đúng), không sợ dropdown cũ.",
    "• DÙNG AI AGENT khai Model (sheet 8): với mỗi mẫu, tra cứu Google theo 'tên mẫu + P/N + nhà sản xuất', mở trang chính hãng/datasheet rồi điền Nhà SX, Loại, Mô tả & thông số kỹ thuật. Ưu tiên nguồn chính hãng; không chắc thì để trống, KHÔNG bịa.",
  ];
  gTips.forEach((t, i) => {
    const c = guide.getCell(`A${i + 3}`);
    c.value = t;
    c.font = { color: { argb: "FF334155" } };
    guide.mergeCells(`A${i + 3}:D${i + 3}`);
  });
  const gHeadIdx = gTips.length + 4;
  guide.getCell(`A${gHeadIdx}`).value = "Thứ tự";
  guide.getCell(`B${gHeadIdx}`).value = "Sheet";
  guide.getCell(`C${gHeadIdx}`).value = "Nội dung";
  guide.getCell(`D${gHeadIdx}`).value = "Số dòng";
  guide.getRow(gHeadIdx).font = { bold: true };
  guide.getRow(gHeadIdx).eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
    c.border = border;
  });

  // ---- Sheet DanhMuc (ẩn) — nguồn dropdown ----
  const dm = wb.addWorksheet("DanhMuc");
  const dmColOf: Record<string, number> = {};
  Array.from(new Set(refConfigs.map((c) => c.table))).forEach((t, i) => {
    const colIdx = i + 1;
    dmColOf[t] = colIdx;
    dm.getCell(1, colIdx).value = t;
    dm.getColumn(colIdx).width = 28;
    (refMaps[t]?.list ?? []).forEach((v, r) => { dm.getCell(r + 2, colIdx).value = v; });
  });
  dm.state = "hidden";

  // ---- Sheet _MIRATS_META (ẩn) — siêu dữ liệu lần xuất ----
  const metaWs = wb.addWorksheet(META_SHEET);
  metaWs.addRow(["key", "value"]);
  metaWs.addRow(["export_id", meta.export_id]);
  metaWs.addRow(["schema_version", meta.schema_version]);
  metaWs.addRow(["generated_at", meta.generated_at]);
  metaWs.addRow(["scope", meta.scope]);
  metaWs.addRow(["allowed_actions", meta.allowed_actions.join(",")]);
  metaWs.getColumn(1).width = 18;
  metaWs.getColumn(2).width = 60;
  metaWs.getRow(1).font = { bold: true };
  metaWs.state = "hidden";

  // Lookup vị trí đang lắp (chỉ khi có dữ liệu tài sản) — dùng cho 2 cột chỉ đọc.
  const installMap = new Map<string, { tp_ma: string }>();
  if (withData) {
    // Xây bản đồ TP-id → mã thành phần từ dữ liệu đã nạp.
    const tpMa = new Map<string, string>();
    for (const r of rawByTable["he_thong_thanh_phan"] ?? []) {
      tpMa.set(String(r.id), String(r.ma_thanh_phan ?? r.ma ?? ""));
    }
    try {
      const { data: gcRows } = await supabase
        .from("gan_chuc_nang")
        .select("thiet_bi_id, thanh_phan_id")
        .is("den_ngay", null)
        .limit(50000);
      for (const g of (gcRows ?? []) as Array<Record<string, unknown>>) {
        const tbId = String(g.thiet_bi_id ?? "");
        if (!tbId) continue;
        const tp = tpMa.get(String(g.thanh_phan_id ?? "")) ?? "";
        installMap.set(tbId, { tp_ma: tp });
      }
    } catch {
      // Không cản trở xuất file: bỏ qua nếu bảng chưa tồn tại/không có quyền.
    }
  }

  // ---- Từng sheet lớp dữ liệu ----
  const guideCounts: number[] = [];
  for (const layer of ALLINONE_LAYERS) {
    const ent = entOf(layer);
    // Mẫu rút gọn: chỉ giữ trường bắt buộc + hay dùng để giảm gánh nặng nhập liệu.
    const fields = compact ? compactFields(ent) : ent.fields;
    const fm = fieldMap(ent);
    const ws = wb.addWorksheet(layer.sheet);
    const gs = GROUP_STYLE[layer.group];
    // Tab màu theo nhóm — người dùng nhận diện nhanh Danh mục / Cấu trúc / Tài sản.
    (ws as unknown as { properties: { tabColor: { argb: string } } }).properties.tabColor = { argb: gs.tab };

    // Cột "ảo" chỉ-đọc thêm ở lớp Tài sản (không có trong entity, không ghi khi nhập).
    const isThietBi = layer.entity === "thiet_bi";
    const extraLabels = isThietBi ? ["Trạng thái lắp", "Thành phần đang lắp"] : [];

    // Header: [cột kỹ thuật ẩn] + [nhãn trường nghiệp vụ] + [cột chỉ-đọc].
    const labels = [...TECH_COLS, ...fields.map((f) => f.label), ...extraLabels];
    ws.addRow(labels);
    const hr = ws.getRow(1);
    hr.height = 26;
    hr.font = { bold: true };
    hr.eachCell((c, col) => {
      if (col <= TECH_OFFSET) {
        const tk = TECH_COLS[col - 1];
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
        c.font = { bold: true, color: { argb: "FF94A3B8" }, size: 9 };
        c.alignment = { vertical: "middle" };
        c.border = border;
        c.note = TECH_NOTE[tk];
        return;
      }
      const fieldIdx = col - 1 - TECH_OFFSET;
      const f = fields[fieldIdx];
      const isExtra = fieldIdx >= fields.length;
      // Cột chỉ-đọc: nền xám nhạt, chữ nghiêng để phân biệt.
      const fill = isExtra
        ? "FFF1F5F9"
        : (f?.required ? gs.headerReq : gs.header);
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      c.font = { bold: true, color: { argb: isExtra ? "FF64748B" : gs.accent }, italic: isExtra };
      c.alignment = { vertical: "middle", wrapText: true, horizontal: "left" };
      c.border = border;
      if (isExtra) {
        c.note = "Chỉ đọc — tự tính từ CSDL. KHÔNG được nhập; hệ thống bỏ qua khi ghi.";
      } else if (f) {
        c.note = `${f.key} · ${KIND_LABEL[f.kind]}${f.required ? " · BẮT BUỘC" : ""}${f.ghi_chu ? `\n${f.ghi_chu}` : ""}`;
      }
    });
    // Đóng băng tiêu đề + ẩn khối cột kỹ thuật khỏi tầm nhìn ngang.
    ws.views = [{ state: "frozen", ySplit: 1, xSplit: TECH_OFFSET, showGridLines: false }];

    // Ẩn + khóa các cột kỹ thuật (người dùng không sửa nhầm).
    for (let k = 1; k <= TECH_OFFSET; k++) {
      const col = ws.getColumn(k);
      col.hidden = true;
      col.width = 14;
    }

    // Hướng dẫn riêng cho sheet Model: chỉ dẫn AI agent tra cứu Google & điền.
    if (layer.entity === "dm_model") {
      const c = ws.getRow(1).getCell(TECH_OFFSET + 1);
      const base = typeof c.note === "string" ? c.note : "";
      c.note = `${base ? base + "\n\n" : ""}★ HƯỚNG DẪN AI AGENT — TRA CỨU & ĐIỀN MẪU THIẾT BỊ:
1) Với mỗi mẫu: tìm Google theo "tên mẫu + P/N + nhà sản xuất".
2) Mở trang chính hãng / datasheet, điền: Nhà sản xuất, Chủng loại, Mô tả và thông số kỹ thuật.
3) Ưu tiên nguồn chính hãng; không chắc thì để trống, KHÔNG bịa.
4) Giữ nguyên cột 'ma' để CẬP NHẬT mẫu cũ; để trống 'ma' = tạo mới.`;
    }

    // Dữ liệu hiện có (đã áp phạm vi chọn + cascade + phụ thuộc) + cột kỹ thuật.
    let dataCount = 0;
    if (withData) {
      const set = eff[ent.table];
      let rows = rawByTable[ent.table] ?? [];
      if (set) rows = rows.filter((r) => set.has(String(r.id)));
      rows.forEach((raw, idx) => {
        const tech = [
          String(raw.id ?? ""),
          String(raw.updated_at ?? raw.created_at ?? ""),
          "update",
          String(idx + 2),
        ];
        const extras: string[] = [];
        if (isThietBi) {
          const info = installMap.get(String(raw.id ?? ""));
          extras.push(info ? "Đã lắp" : "Chưa lắp");
          extras.push(info?.tp_ma ?? "");
        }
        const excelRow = ws.addRow([...tech, ...mapRowToCells(raw, ent, refMaps, fields), ...extras]);
        // Banding: dòng chẵn tô nền nhóm rất nhạt để dễ đọc.
        if (idx % 2 === 1) {
          const startCol = TECH_OFFSET + 1;
          const endCol = TECH_OFFSET + fields.length + extras.length;
          for (let c = startCol; c <= endCol; c++) {
            excelRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: gs.band } };
          }
        }
        // Tô màu ô "Trạng thái lắp" — xanh nếu Đã lắp, xám nếu Chưa lắp.
        if (isThietBi) {
          const statusCol = TECH_OFFSET + fields.length + 1;
          const cell = excelRow.getCell(statusCol);
          const on = extras[0] === "Đã lắp";
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: on ? "FFBBF7D0" : "FFE5E7EB" } };
          cell.font = { color: { argb: on ? "FF047857" : "FF6B7280" }, bold: true };
          cell.alignment = { horizontal: "center" };
        }
      });
      dataCount = rows.length;
    }
    guideCounts.push(dataCount);

    // Độ rộng cột nghiệp vụ + cột chỉ-đọc.
    fields.forEach((f, i) => {
      const w = Math.max(f.label.length + 4, 12);
      ws.getColumn(i + 1 + TECH_OFFSET).width = Math.min(w, 36);
    });
    extraLabels.forEach((lbl, i) => {
      ws.getColumn(TECH_OFFSET + fields.length + 1 + i).width = Math.max(lbl.length + 4, 18);
    });

    // AutoFilter cho toàn bộ vùng dữ liệu (không tính cột kỹ thuật ẩn).
    const totalCols = TECH_OFFSET + fields.length + extraLabels.length;
    const firstDataCol = colLetter(TECH_OFFSET + 1);
    const lastDataCol = colLetter(totalCols);
    const filterLastRow = Math.max(dataCount + 1, 2);
    ws.autoFilter = { from: `${firstDataCol}1`, to: `${lastDataCol}${filterLastRow}` };

    // Data validation cho các cột ref (dịch cột theo TECH_OFFSET).
    const lastRow = Math.max(dataCount + 1, 500);
    const dv = (ws as unknown as { dataValidations: { add: (r: string, v: unknown) => void } }).dataValidations;
    fields.forEach((f, i) => {
      if (f.kind !== "ref" || !f.ref) return;
      const list = refMaps[f.ref.table]?.list ?? [];
      if (list.length === 0) return;
      const dmCol = colLetter(dmColOf[f.ref.table]);
      const excelCol = colLetter(i + 1 + TECH_OFFSET);
      const allowNew = !!f.ref.create;
      dv.add(
        `${excelCol}2:${excelCol}${lastRow}`,
        {
          type: "list",
          allowBlank: true,
          formulae: [`DanhMuc!$${dmCol}$2:$${dmCol}$${list.length + 1}`],
          showErrorMessage: true,
          errorStyle: "warning",
          errorTitle: "Ngoài danh mục",
          error: allowNew
            ? "Không có trong danh sách? Vẫn được — hệ thống sẽ TẠO MỚI danh mục này khi ghi."
            : "Nên chọn giá trị có sẵn. Nếu gõ tay, bước Xem trước sẽ đối chiếu lại với dữ liệu thật.",
        },
      );
    });

    // Data validation cho các kind khác: int/num (số), date (ngày).
    fields.forEach((f, i) => {
      const excelCol = colLetter(i + 1 + TECH_OFFSET);
      const range = `${excelCol}2:${excelCol}${lastRow}`;
      if (f.kind === "int") {
        dv.add(range, {
          type: "whole", operator: "between", allowBlank: true,
          formulae: [-2147483648, 2147483647],
          showErrorMessage: true, errorStyle: "stop",
          errorTitle: "Sai định dạng", error: `"${f.label}" phải là số nguyên.`,
        });
      } else if (f.kind === "num") {
        dv.add(range, {
          type: "decimal", operator: "between", allowBlank: true,
          formulae: [-1e15, 1e15],
          showErrorMessage: true, errorStyle: "stop",
          errorTitle: "Sai định dạng", error: `"${f.label}" phải là số.`,
        });
      } else if (f.kind === "date") {
        dv.add(range, {
          type: "date", operator: "between", allowBlank: true,
          formulae: [new Date(1900, 0, 1), new Date(2100, 11, 31)],
          showErrorMessage: true, errorStyle: "warning",
          errorTitle: "Sai định dạng ngày",
          error: `"${f.label}" nên nhập ngày (dd/mm/yyyy hoặc yyyy-mm-dd).`,
        });
        ws.getColumn(i + 1 + TECH_OFFSET).numFmt = "dd/mm/yyyy";
      }
    });

    // Conditional formatting: tô đỏ ô rỗng ở cột BẮT BUỘC + vàng dòng _action=delete.
    const cfAny = ws as unknown as {
      addConditionalFormatting: (cfg: { ref: string; rules: Array<Record<string, unknown>> }) => void;
    };
    fields.forEach((f, i) => {
      if (!f.required) return;
      const excelCol = colLetter(i + 1 + TECH_OFFSET);
      const range = `${excelCol}2:${excelCol}${lastRow}`;
      try {
        cfAny.addConditionalFormatting({
          ref: range,
          rules: [{
            type: "containsBlanks",
            priority: 1,
            style: {
              fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFEE2E2" } },
              font: { color: { argb: "FF991B1B" } },
            },
          }],
        });
      } catch { /* bỏ qua nếu không hỗ trợ */ }
    });
    try {
      const firstCol = colLetter(TECH_OFFSET + 1);
      const lastCol = colLetter(TECH_OFFSET + fields.length + extraLabels.length);
      cfAny.addConditionalFormatting({
        ref: `${firstCol}2:${lastCol}${lastRow}`,
        rules: [{
          type: "expression",
          priority: 2,
          formulae: [`$C2="delete"`],
          style: {
            fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFEF3C7" } },
            font: { color: { argb: "FF92400E" }, italic: true },
          },
        }],
      });
    } catch { /* bỏ qua nếu không hỗ trợ */ }

    // Data validation cho cột kỹ thuật _action (create/update/skip/delete).
    const actionCol = colLetter(3); // _action là cột kỹ thuật thứ 3
    dv.add(`${actionCol}2:${actionCol}${lastRow}`, {
      type: "list",
      allowBlank: true,
      formulae: [`"${ACTION_VALUES.join(",")}"`],
      showErrorMessage: false,
    });
    void fm;
  }

  // Điền bảng tổng quan ở sheet Hướng dẫn (kèm số dòng thực xuất, tô màu theo nhóm).
  // ---- # LAYER_MAP (bảng thứ tự lớp) ----
  const layerMapTitle = guide.addRow(["# LAYER_MAP — thứ tự lớp & khoá upsert"]);
  guide.mergeCells(`A${layerMapTitle.number}:D${layerMapTitle.number}`);
  layerMapTitle.getCell(1).font = { bold: true, size: 12, color: { argb: "FF1E3A8A" } };
  layerMapTitle.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
  ALLINONE_LAYERS.forEach((layer, i) => {
    const gs = GROUP_STYLE[layer.group];
    const row = guide.addRow([i + 1, layer.sheet, layer.desc, withData ? guideCounts[i] : 0]);
    row.eachCell((c) => {
      c.border = border;
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: gs.band } };
    });
    // Ô "sheet" tô đậm hơn + chữ theo màu nhóm để trực quan.
    const nameCell = row.getCell(2);
    nameCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: gs.header } };
    nameCell.font = { bold: true, color: { argb: gs.accent } };
  });
  guide.getColumn(1).width = 8;
  guide.getColumn(2).width = 22;
  guide.getColumn(3).width = 60;
  guide.getColumn(4).width = 10;

  // Legend màu: giải thích 3 nhóm tab để người dùng không nhầm.
  guide.addRow([]);
  const legendTitle = guide.addRow(["CHÚ THÍCH MÀU TAB"]);
  guide.mergeCells(`A${legendTitle.number}:D${legendTitle.number}`);
  legendTitle.getCell(1).font = { bold: true, size: 11, color: { argb: "FF334155" } };
  (["catalog", "structure", "asset"] as LayerGroup[]).forEach((g) => {
    const gs = GROUP_STYLE[g];
    const r = guide.addRow(["", gs.label, "", ""]);
    r.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: gs.tab } };
    r.getCell(1).border = border;
    r.getCell(2).font = { bold: true, color: { argb: gs.accent } };
    r.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: gs.header } };
    r.getCell(2).border = border;
  });

  // ---- Khối hướng dẫn AI agent (hiển thị rõ, không phải comment) ----
  guide.addRow([]);
  const aiTitleRow = guide.addRow(["HƯỚNG DẪN DÙNG AI AGENT KHAI 'MẪU THIẾT BỊ' (SHEET 8)"]);
  guide.mergeCells(`A${aiTitleRow.number}:D${aiTitleRow.number}`);
  aiTitleRow.getCell(1).font = { bold: true, size: 12, color: { argb: "FF1E3A8A" } };
  aiTitleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
  const aiLines = [
    "1) Với mỗi model: tìm trên Google theo cụm 'tên mẫu + P/N + nhà sản xuất'.",
    "2) Mở trang chính hãng / datasheet của mẫu đó.",
    "3) Điền các cột: Nhà sản xuất, Chủng loại, Mô tả và các thông số kỹ thuật lấy được.",
    "4) Ưu tiên nguồn CHÍNH HÃNG. Không chắc chắn thì ĐỂ TRỐNG — tuyệt đối không bịa số liệu.",
    "5) Giữ nguyên cột 'ma' để CẬP NHẬT mẫu đã có; để trống 'ma' = tạo mẫu mới.",
    "6) Cùng cách này có thể áp dụng cho Nhà sản xuất (sheet 3) và Chủng loại (sheet 5).",
  ];
  aiLines.forEach((t) => {
    const r = guide.addRow([t]);
    guide.mergeCells(`A${r.number}:D${r.number}`);
    r.getCell(1).font = { color: { argb: "FF334155" } };
    r.getCell(1).alignment = { wrapText: true };
  });

  // ==========================================================================
  // SKILL CARD cho AI AGENT — các block chuẩn hoá để agent định vị bằng string
  // match. Mỗi block bắt đầu bằng "# <TÊN>". Xem thêm sheet ③ AI_RULES (JSON).
  // ==========================================================================
  const CURRENT_YEAR = new Date().getFullYear();
  const addBlock = (title: string, lines: string[]) => {
    guide.addRow([]);
    const t = guide.addRow([title]);
    guide.mergeCells(`A${t.number}:D${t.number}`);
    t.getCell(1).font = { bold: true, size: 12, color: { argb: "FF1E3A8A" } };
    t.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
    for (const line of lines) {
      const r = guide.addRow([line]);
      guide.mergeCells(`A${r.number}:D${r.number}`);
      r.getCell(1).font = { color: { argb: "FF334155" } };
      r.getCell(1).alignment = { wrapText: true };
    }
  };

  addBlock("# ROLE", [
    "Bạn là nhân viên kỹ thuật khai lý lịch thiết bị VATM. Chỉ ghi số liệu có nguồn.",
    "Không đoán, không bịa. Thiếu dữ kiện → để trống hoặc hỏi lại người phụ trách.",
    "Ưu tiên trích dẫn nguồn (datasheet chính hãng, hồ sơ nghiệm thu, hoá đơn).",
  ]);
  addBlock("# INVARIANTS", [
    "• 'ma' là KHOÁ upsert: giữ nguyên → cập nhật, để trống → tạo mới, đổi mã → tạo bản trùng.",
    "• Cha trước, con sau: điền sheet theo đúng thứ tự 1 → N; con chỉ dùng ref đã có ở cha.",
    "• Idempotent: chạy lại cùng file không nhân bản; _record_id/_row_version giữ liên kết dòng.",
    "• Mọi ref phải trỏ giá trị có thật ở sheet cha hoặc snapshot đi kèm.",
  ]);
  addBlock("# WORKFLOW", [
    "1) Đọc sheet _MIRATS_META (phiên bản, scope) + ③ AI_RULES (JSON hints & luật).",
    "2) Quét dữ liệu hiện có ở các sheet cha để làm baseline (mã, tên, model, giá).",
    "3) Điền lần lượt các sheet 1 → N; chỉ dùng ref đã tồn tại.",
    "4) Chạy # SELF_CHECK cho từng dòng trước khi coi là hoàn tất.",
    "5) Đối chiếu # ANOMALY_RULES; nếu warn → thêm ghi chú, nếu block → sửa hoặc bỏ dòng.",
    "6) Đặt _action = create/update/skip/delete cho từng dòng theo hành động thực tế.",
  ]);
  addBlock("# FIELD_HINTS", [
    "Tra cứu chi tiết trong sheet ③ AI_RULES → field_hints[<bảng>][<key>] = {type, required, ref?, min?, max?}.",
    "Ô 'ma_serial' để trống nếu chưa có — không bịa số serial.",
    `Năm sản xuất chấp nhận: 1980 .. ${CURRENT_YEAR + 1}. Ngoài khoảng → cảnh báo year_out_of_range.`,
    "Ngày định dạng dd/mm/yyyy hoặc yyyy-mm-dd; ngày bảo hành ≥ ngày đưa vào sử dụng.",
  ]);
  addBlock("# ANOMALY_RULES", [
    "Luật cảnh báo bất hợp lý — agent PHẢI tự kiểm trước khi ghi. Chi tiết ở ③ AI_RULES.anomaly_rules.",
    "block: duplicate_ma, ref_missing, enum_invalid, orphan_component, date_future, year_vs_ngay_dua_vao.",
    "warn: sn_dup, year_out_of_range, model_mismatch, price_outlier, lifespan_outlier.",
    "So sánh outlier dùng baseline snapshot đi kèm (khi withData=true); mẫu trống → bỏ qua, log 'no baseline'.",
  ]);
  addBlock("# SELF_CHECK", [
    "[ ] Đã có 'ma' hoặc chấp nhận tạo mới có kiểm soát?",
    "[ ] Mọi ref đều tồn tại ở sheet cha / baseline?",
    "[ ] Trường bắt buộc đã điền đủ (ô nền vàng ở header)?",
    "[ ] Định dạng đúng (số, ngày, enum) và không có ký tự lạ?",
    "[ ] Đã đối chiếu # ANOMALY_RULES, không còn block; các warn đã có ghi chú?",
    "[ ] _action phản ánh đúng ý định (create/update/skip/delete)?",
  ]);
  addBlock("# EXAMPLES", [
    "Tạo mới tài sản (sheet Tài sản):",
    "  _action=create · ma=<để trống hoặc mã mới> · ten_thiet_bi='Máy VHF A' · he_thong='HT-001' · model='MDL-XYZ' · nam_san_xuat=2024",
    "Cập nhật tài sản đã có:",
    "  _action=update · giữ nguyên _record_id/ma · chỉ sửa các cột thay đổi · ô để trống = giữ nguyên giá trị cũ.",
  ]);
  addBlock("# ERROR_RECOVERY", [
    "• ref_missing → khai giá trị đó ở sheet cha trước (cùng file), rồi tham chiếu bằng 'ma'.",
    "• duplicate_ma → giữ 1 dòng gốc; các dòng khác đổi _action=skip hoặc dùng mã khác.",
    "• enum_invalid → xem danh sách hợp lệ ở ③ AI_RULES.enums; chọn giá trị đúng.",
    "• sn_dup (warn) → xác minh với hồ sơ; nếu đúng là 2 tài sản khác nhau, đổi ma_serial cho đúng.",
    "• year_vs_ngay_dua_vao → điều chỉnh nam_san_xuat ≤ năm của ngay_dua_vao_su_dung.",
  ]);

  // ---- Sheet ③ AI_RULES (ẩn) — JSON machine-readable ----
  const layersMeta = ALLINONE_LAYERS.map((l) => {
    const ent = entOf(l);
    const refs = Array.from(new Set(ent.fields.filter((f) => f.kind === "ref" && f.ref).map((f) => f.ref!.table)));
    const required = ent.fields.filter((f) => f.required).map((f) => f.key);
    return { sheet: l.sheet, entity: ent.table, key: "ma", refs, required };
  });
  const fieldHints: Record<string, Record<string, { type: string; required?: boolean; ref?: string; min?: number; max?: number }>> = {};
  for (const l of ALLINONE_LAYERS) {
    const ent = entOf(l);
    const h: Record<string, { type: string; required?: boolean; ref?: string; min?: number; max?: number }> = {};
    for (const f of ent.fields) {
      const hint: { type: string; required?: boolean; ref?: string; min?: number; max?: number } = {
        type: f.kind, required: !!f.required,
      };
      if (f.kind === "ref" && f.ref) hint.ref = f.ref.table;
      if (f.key === "nam_san_xuat" || f.key === "nam_dua_vao_khai_thac") {
        hint.min = 1980; hint.max = CURRENT_YEAR + 1;
      }
      h[f.key] = hint;
    }
    fieldHints[ent.table] = h;
  }
  const anomalyRules = [
    { id: "duplicate_ma", severity: "block", scope: "*", explain: "Trùng 'ma' trong cùng sheet" },
    { id: "ref_missing", severity: "block", scope: "*", explain: "Giá trị ref không tồn tại ở sheet cha; gợi ý khớp gần đúng (Levenshtein ≤ 2)" },
    { id: "enum_invalid", severity: "block", scope: "*", explain: "Giá trị ngoài enum cho phép" },
    { id: "orphan_component", severity: "block", scope: "he_thong_thanh_phan", explain: "Thành phần thiếu he_thong cha" },
    { id: "date_future", severity: "block", scope: "thiet_bi", explain: "ngay_bao_hanh_den < ngay_dua_vao_su_dung" },
    { id: "year_vs_ngay_dua_vao", severity: "block", scope: "thiet_bi", explain: "nam_san_xuat > year(ngay_dua_vao_su_dung)" },
    { id: "sn_dup", severity: "warn", scope: "thiet_bi", explain: "ma_serial trùng trong file — cảnh báo, không chặn" },
    { id: "year_out_of_range", severity: "warn", scope: "thiet_bi", explain: `nam_san_xuat < 1980 hoặc > ${CURRENT_YEAR + 1}` },
    { id: "model_mismatch", severity: "warn", scope: "thiet_bi", explain: "Cùng model nhưng khác NSX/chủng loại so với baseline snapshot" },
    { id: "price_outlier", severity: "warn", scope: "thiet_bi", explain: "gia_tri lệch > 3× median cùng model (dựa baseline)" },
    { id: "lifespan_outlier", severity: "warn", scope: "thiet_bi", explain: "nien_han_su_dung lệch > 50% median cùng chủng loại (dựa baseline)" },
  ];
  const aiRules = {
    schema_version: SCHEMA_VERSION,
    generated_at: meta.generated_at,
    baseline_available: !!withData,
    layers: layersMeta,
    field_hints: fieldHints,
    anomaly_rules: anomalyRules,
    enums: { _action: [...ACTION_VALUES] },
  };
  const aiWs = wb.addWorksheet(AI_RULES_SHEET);
  aiWs.getCell("A1").value = JSON.stringify(aiRules);
  aiWs.getColumn(1).width = 120;
  aiWs.state = "hidden";

  guide.views = [{ state: "frozen", ySplit: gHeadIdx }];

  // Mở ở sheet Hướng dẫn.
  wb.views = [{ activeTab: 0, x: 0, y: 0, width: 12000, height: 22000, firstSheet: 0, visibility: "visible" }];

  return { wb, meta };
}

/**
 * Xuất & tải file All-in-one. Giữ nguyên API/nút cũ; chọn mode (mẫu trống hay
 * kèm dữ liệu) qua `withData` và scope tối thiểu qua `picks`.
 */
export async function exportAllInOneXlsx({ withData, picks, autoDeps = true, compact = false, fileName }: ExportAllInOneOpts) {
  const { wb } = await buildAllInOneWorkbook({ withData, picks, autoDeps, compact });
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName ?? (compact
    ? (withData ? "MIRATS_hethong_thietbi_rutgon_du-lieu.xlsx" : "MIRATS_hethong_thietbi_rutgon_mau-trong.xlsx")
    : (withData ? "MIRATS_hethong_thietbi_du-lieu.xlsx" : "MIRATS_hethong_thietbi_mau-trong.xlsx"));
  a.click();
  URL.revokeObjectURL(url);
}

// ==========================================================================
// ĐỌC FILE ALL-IN-ONE → các dòng theo từng lớp (đã ánh xạ về key trường)
// ==========================================================================
export type ParsedLayer = {
  layer: Layer;
  headers: string[];
  /** Dòng đã ánh xạ: key trường CSDL → giá trị chuỗi. */
  rows: Array<Record<string, string>>;
  /** Cột trong sheet không khớp trường nào (bị bỏ qua). Cột kỹ thuật KHÔNG tính vào đây. */
  unmapped: string[];
  /**
   * Cột kỹ thuật (_record_id/_row_version/_action/_source_row) song song với
   * `rows` (cùng thứ tự, cùng độ dài). Dùng cho nhập lại chính xác về sau.
   */
  meta: Array<Record<TechColKey, string>>;
};


// exceljs 4.4.0 có lỗi round-trip với comment/ghi chú: phần comment được ghi ở
// "xl/comments/comment1.xml" nhưng trình đọc lại dò theo "xl/comments1.xml" nên
// không nạp được, trong khi quan hệ (.rels) của worksheet vẫn trỏ tới nó → nạp
// lại chính file mình xuất ra sẽ ném "reading 'comments'". Vì import KHÔNG cần
// comment, ta gỡ bỏ các quan hệ comment/vmlDrawing (và tham chiếu legacyDrawing)
// khỏi zip trước khi đưa vào exceljs.
function sanitizeXlsxRels(buf: ArrayBuffer): ArrayBuffer {
  try {
    const files = unzipSync(new Uint8Array(buf));
    const dec = new TextDecoder();
    const enc = new TextEncoder();
    let changed = false;
    for (const name of Object.keys(files)) {
      // Gỡ quan hệ comment/vmlDrawing trong .rels của worksheet.
      if (/^xl\/worksheets\/_rels\/.*\.rels$/i.test(name)) {
        const xml = dec.decode(files[name]);
        const fixed = xml.replace(
          /<Relationship\b[^>]*Type="[^"]*\/(?:comments|vmlDrawing)"[^>]*\/>/g,
          "",
        );
        if (fixed !== xml) { files[name] = enc.encode(fixed); changed = true; }
        continue;
      }
      // Gỡ thẻ <legacyDrawing/> (trỏ tới vmlDrawing của comment) trong sheet.
      if (/^xl\/worksheets\/sheet\d+\.xml$/i.test(name)) {
        const xml = dec.decode(files[name]);
        const fixed = xml.replace(/<legacyDrawing\b[^>]*\/>/g, "");
        if (fixed !== xml) { files[name] = enc.encode(fixed); changed = true; }
      }
    }
    if (!changed) return buf;
    const out = zipSync(files);
    return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
  } catch {
    return buf; // Nếu vá lỗi thất bại, để exceljs tự xử lý như cũ.
  }
}


export async function parseAllInOneXlsx(file: File): Promise<ParsedLayer[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(sanitizeXlsxRels(await file.arrayBuffer()));

  const out: ParsedLayer[] = [];
  for (const layer of ALLINONE_LAYERS) {
    const ws = wb.getWorksheet(layer.sheet);
    if (!ws) continue;
    const ent = entOf(layer);

    // Chỉ mục tra nhanh: noAccent(key)/noAccent(label) → key.
    const byNorm = new Map<string, string>();
    for (const f of ent.fields) {
      byNorm.set(noAccent(f.key), f.key);
      byNorm.set(noAccent(f.label), f.key);
    }

    const headerRow = ws.getRow(1);
    const headers: string[] = [];
    const colToKey: Array<string | null> = [];
    /** Cột kỹ thuật → tên kỹ thuật (không tính vào unmapped). */
    const colToTech: Array<TechColKey | null> = [];
    const unmapped: string[] = [];
    // Nhãn của các cột "chỉ đọc" thêm khi xuất — phải bỏ qua khi nhập lại.
    const READONLY_LABELS = new Set(["trang thai lap", "thanh phan dang lap"]);
    const maxCol = ws.columnCount;
    for (let c = 1; c <= maxCol; c++) {
      const h = cellStr(headerRow.getCell(c).value);
      headers.push(h);
      if (!h) { colToKey.push(null); colToTech.push(null); continue; }
      // Cột kỹ thuật nhận diện theo tên cố định (ẩn/khóa khi xuất).
      if (TECH_COL_SET.has(h)) { colToKey.push(null); colToTech.push(h as TechColKey); continue; }
      // Cột chỉ đọc: bỏ qua hoàn toàn, không đưa vào unmapped.
      if (READONLY_LABELS.has(noAccent(h))) { colToKey.push(null); colToTech.push(null); continue; }
      const key = byNorm.get(noAccent(h)) ?? null;
      colToKey.push(key);
      colToTech.push(null);
      if (!key) unmapped.push(h);
    }

    const rows: Array<Record<string, string>> = [];
    const meta: Array<Record<TechColKey, string>> = [];
    for (let r = 2; r <= ws.rowCount; r++) {
      const excelRow = ws.getRow(r);
      const obj: Record<string, string> = {};
      const techObj = { _record_id: "", _row_version: "", _action: "", _source_row: "" } as Record<TechColKey, string>;
      let hasAny = false;
      for (let c = 1; c <= maxCol; c++) {
        const v = cellStr(excelRow.getCell(c).value);
        const tech = colToTech[c - 1];
        if (tech) { if (v !== "") techObj[tech] = v; continue; }
        const key = colToKey[c - 1];
        if (!key) continue;
        if (v !== "") { obj[key] = v; hasAny = true; }
      }
      if (hasAny) { rows.push(obj); meta.push(techObj); }
    }

    out.push({ layer, headers, rows, unmapped, meta });
  }
  return out;
}

/** Đọc sheet META ẩn của file All-in-one (null nếu file cũ không có META). */
export async function readAllInOneMeta(file: File): Promise<AllInOneMeta | null> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(sanitizeXlsxRels(await file.arrayBuffer()));
  const ws = wb.getWorksheet(META_SHEET);
  if (!ws) return null;
  const kv: Record<string, string> = {};
  for (let r = 2; r <= ws.rowCount; r++) {
    const k = cellStr(ws.getRow(r).getCell(1).value);
    const v = cellStr(ws.getRow(r).getCell(2).value);
    if (k) kv[k] = v;
  }
  return {
    export_id: kv.export_id ?? "",
    schema_version: kv.schema_version ?? "",
    generated_at: kv.generated_at ?? "",
    scope: kv.scope ?? "",
    allowed_actions: (kv.allowed_actions ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  };
}

