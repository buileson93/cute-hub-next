// ============================================================================
// checklist-repo.ts — Repository cho mẫu dạng BẢNG KIỂM (checklist).
//
// Tách 2 tầng:
//   • Mapper THUẦN (raw DB row → ChecklistSection/Item) — test được.
//   • Hàm fetch dùng supabase client — dùng trong hook/loader.
// ============================================================================

import { supabase } from "@/integrations/backend/client";
import type {
  ChecklistItem,
  ChecklistSection,
  ResultKind,
} from "@/lib/mirats/checklist";
import { parseItemOptions } from "@/lib/mirats/checklist-item-options";

const RESULT_KINDS: ResultKind[] = ["so", "dat_khong_dat", "chon", "text"];

function toResultKind(v: unknown): ResultKind {
  return RESULT_KINDS.includes(v as ResultKind) ? (v as ResultKind) : "text";
}

function toStringArray(v: unknown): string[] | null {
  if (Array.isArray(v)) return v.map((x) => String(x));
  return null;
}

export type RawSectionRow = {
  id: string;
  ma_section: string;
  ten: string;
  mo_ta?: string | null;
  position?: number | null;
};

export type RawItemRow = {
  id: string;
  section_id: string;
  item_code: string;
  ten: string;
  huong_dan?: string | null;
  result_kind?: string | null;
  don_vi?: string | null;
  tieu_chuan?: string | null;
  tuy_chon?: unknown;
  bat_buoc?: boolean | null;
  position?: number | null;
  metric_key?: string | null;
  nguong_min?: number | null;
  nguong_max?: number | null;
  nguong_op?: string | null;
  chu_ky?: string | null;
};

/** Mapper THUẦN: gộp raw section + item rows → cây ChecklistSection[]. */
export function buildSections(
  sectionRows: readonly RawSectionRow[] | null | undefined,
  itemRows: readonly RawItemRow[] | null | undefined,
): ChecklistSection[] {
  const bySection = new Map<string, ChecklistItem[]>();
  for (const r of itemRows ?? []) {
    const options = parseItemOptions(r.tuy_chon);
    const item: ChecklistItem = {
      item_code: r.item_code,
      ten: r.ten,
      huong_dan: r.huong_dan ?? null,
      result_kind: toResultKind(r.result_kind),
      don_vi: r.don_vi ?? null,
      tieu_chuan: r.tieu_chuan ?? null,
      tuy_chon: options.choices ?? toStringArray(r.tuy_chon),
      bat_buoc: r.bat_buoc ?? false,
      position: typeof r.position === "number" ? r.position : 0,
      options,
      metric_key: r.metric_key ?? null,
      nguong_min: r.nguong_min ?? null,
      nguong_max: r.nguong_max ?? null,
      nguong_op: (r.nguong_op as ChecklistItem["nguong_op"]) ?? null,
      chu_ky: (r.chu_ky as ChecklistItem["chu_ky"]) ?? null,
    };
    const list = bySection.get(r.section_id) ?? [];
    list.push(item);
    bySection.set(r.section_id, list);
  }

  const sections = (sectionRows ?? []).map((s): ChecklistSection => {
    const items = (bySection.get(s.id) ?? []).slice().sort((a, b) => a.position - b.position);
    return {
      ma_section: s.ma_section,
      ten: s.ten,
      mo_ta: s.mo_ta ?? null,
      position: typeof s.position === "number" ? s.position : 0,
      items,
    };
  });
  sections.sort((a, b) => a.position - b.position);
  return sections;
}

/** Có phải mẫu dạng checklist? (có ít nhất 1 section) */
export function isChecklistTemplate(sections: readonly ChecklistSection[] | null | undefined): boolean {
  return !!sections && sections.length > 0;
}

/** Fetch toàn bộ section + item của 1 mẫu → cây ChecklistSection[]. */
export async function fetchTemplateSections(templateId: string): Promise<ChecklistSection[]> {
  const [{ data: secs, error: e1 }, { data: items, error: e2 }] = await Promise.all([
    supabase.from("form_section").select("*").eq("template_id", templateId).order("position"),
    supabase.from("form_check_item").select("*").eq("template_id", templateId).order("position"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return buildSections((secs ?? []) as RawSectionRow[], (items ?? []) as RawItemRow[]);
}

/**
 * Parse mảng section đã BIÊN DỊCH (compiled_schema.sections) → ChecklistSection[].
 * Chuẩn hoá kiểu để dùng chung với dữ liệu đọc trực tiếp từ DB. Trả null nếu
 * không có/không hợp lệ (để caller fallback về mẫu hiện tại).
 */
export function parseCompiledSections(schema: unknown): ChecklistSection[] | null {
  if (!schema || typeof schema !== "object") return null;
  const raw = (schema as Record<string, unknown>).sections;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const sections = raw.map((s, si): ChecklistSection => {
    const o = (s ?? {}) as Record<string, unknown>;
    const items = Array.isArray(o.items) ? o.items : [];
    return {
      ma_section: String(o.ma_section ?? `sec-${si}`),
      ten: String(o.ten ?? o.ma_section ?? `Nhóm ${si + 1}`),
      mo_ta: o.mo_ta == null ? null : String(o.mo_ta),
      position: typeof o.position === "number" ? o.position : si,
      items: items.map((it, ii): ChecklistItem => {
        const r = (it ?? {}) as Record<string, unknown>;
        const options = parseItemOptions(r.tuy_chon);
        return {
          item_code: String(r.item_code ?? `item-${si}-${ii}`),
          ten: String(r.ten ?? r.item_code ?? ""),
          huong_dan: r.huong_dan == null ? null : String(r.huong_dan),
          result_kind: toResultKind(r.result_kind),
          don_vi: r.don_vi == null ? null : String(r.don_vi),
          tieu_chuan: r.tieu_chuan == null ? null : String(r.tieu_chuan),
          tuy_chon: options.choices ?? toStringArray(r.tuy_chon),
          bat_buoc: Boolean(r.bat_buoc),
          position: typeof r.position === "number" ? r.position : ii,
          options,
        };
      }),
    };
  });
  sections.sort((a, b) => a.position - b.position);
  return sections;
}

/**
 * Lấy section để LẬP phiếu: ưu tiên bản đã biên dịch của version PUBLISHED
 * (đã giải include, VD PL04 = PL02 + PL03 + PL01 + phần riêng); fallback về
 * section riêng của mẫu (mẫu chưa có version). Trả kèm version đã dùng (nếu có)
 * để phiếu GHIM template_version_id.
 */
export async function fetchCompiledSectionsForTemplate(
  templateId: string,
): Promise<{ sections: ChecklistSection[]; versionId: string | null }> {
  const { data: ver } = await supabase
    .from("form_template_version")
    .select("id, compiled_schema")
    .eq("template_id", templateId)
    .eq("status", "published")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const compiled = ver ? parseCompiledSections(ver.compiled_schema) : null;
  if (compiled && compiled.length > 0) {
    return { sections: compiled, versionId: (ver!.id as string) ?? null };
  }
  return { sections: await fetchTemplateSections(templateId), versionId: null };
}

export type RawItemResultRow = {
  section_code: string;
  section_ten?: string | null;
  item_code: string;
  ten: string;
  result_kind?: string | null;
  gia_tri_so?: number | null;
  gia_tri_text?: string | null;
  don_vi?: string | null;
  tieu_chuan?: string | null;
  ket_qua?: string | null;
  ghi_chu?: string | null;
  hanh_dong?: string | null;
  position?: number | null;
};

/** Fetch kết quả checklist đã lưu của 1 phiếu (đã sắp xếp). */
export async function fetchSubmissionItemResults(
  submissionId: string,
): Promise<RawItemResultRow[]> {
  const { data, error } = await supabase
    .from("form_submission_item_result")
    .select("*")
    .eq("submission_id", submissionId)
    .order("position");
  if (error) throw error;
  return (data ?? []) as RawItemResultRow[];
}

// ---------------------------------------------------------------------------
// Dựng lại cây section + giá trị từ KẾT QUẢ đã lưu (dùng cho trang chi tiết,
// khi định nghĩa mẫu có thể đã đổi — ưu tiên snapshot trong kết quả).
// ---------------------------------------------------------------------------
import type { ItemInput } from "@/lib/mirats/checklist";

export function sectionsFromResults(
  results: readonly RawItemResultRow[] | null | undefined,
): ChecklistSection[] {
  const order: string[] = [];
  const map = new Map<string, ChecklistSection>();
  (results ?? []).forEach((r, i) => {
    let sec = map.get(r.section_code);
    if (!sec) {
      sec = {
        ma_section: r.section_code,
        ten: r.section_ten ?? r.section_code,
        mo_ta: null,
        position: order.length,
        items: [],
      };
      map.set(r.section_code, sec);
      order.push(r.section_code);
    }
    sec.items.push({
      item_code: r.item_code,
      ten: r.ten,
      huong_dan: null,
      result_kind: toResultKind(r.result_kind),
      don_vi: r.don_vi ?? null,
      tieu_chuan: r.tieu_chuan ?? null,
      tuy_chon: null,
      bat_buoc: false,
      position: typeof r.position === "number" ? r.position : i,
    });
  });
  return order.map((c) => map.get(c)!);
}

export function inputsFromResults(
  results: readonly RawItemResultRow[] | null | undefined,
): Record<string, ItemInput> {
  const out: Record<string, ItemInput> = {};
  for (const r of results ?? []) {
    out[r.item_code] = {
      gia_tri_so: r.gia_tri_so ?? null,
      gia_tri_text: r.gia_tri_text ?? null,
      ket_qua: (r.ket_qua ?? null) as ItemInput["ket_qua"],
      ghi_chu: r.ghi_chu ?? null,
      hanh_dong: r.hanh_dong ?? null,
    };
  }
  return out;
}
