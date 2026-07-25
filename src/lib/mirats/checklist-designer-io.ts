// ============================================================================
// checklist-designer-io.ts — Save/validate cây section+item của mẫu bảng kiểm.
// Chiến lược: xoá toàn bộ section của template (cascade xoá item) rồi chèn lại.
// Đơn giản, tránh diff phức tạp; UI đã có xác nhận & autosave gate.
// ============================================================================
import { supabase } from "@/integrations/supabase/client";
import type { ChecklistSection } from "@/lib/mirats/checklist";
import { serializeItemOptions, type ChecklistItemOptions } from "@/lib/mirats/checklist-item-options";

export type DesignerItem = ChecklistSection["items"][number] & {
  // options luôn tồn tại trong designer (khác optional trên ChecklistItem).
  options: ChecklistItemOptions;
};

export type DesignerSection = Omit<ChecklistSection, "items"> & {
  items: DesignerItem[];
};

export type ChecklistIssue = {
  level: "error" | "warning";
  message: string;
  section_index?: number;
  item_index?: number;
};

export function validateChecklist(sections: readonly DesignerSection[]): ChecklistIssue[] {
  const out: ChecklistIssue[] = [];
  const secCodes = new Set<string>();
  const itemCodes = new Set<string>();
  sections.forEach((s, si) => {
    if (!s.ma_section?.trim()) out.push({ level: "error", section_index: si, message: `Nhóm #${si + 1}: thiếu mã` });
    else if (secCodes.has(s.ma_section)) out.push({ level: "error", section_index: si, message: `Trùng mã nhóm: ${s.ma_section}` });
    else secCodes.add(s.ma_section);
    if (!s.ten?.trim()) out.push({ level: "warning", section_index: si, message: `Nhóm ${s.ma_section}: chưa đặt tên` });
    if (s.items.length === 0) out.push({ level: "warning", section_index: si, message: `Nhóm ${s.ma_section}: chưa có hạng mục` });
    s.items.forEach((it, ii) => {
      if (!it.item_code?.trim()) out.push({ level: "error", section_index: si, item_index: ii, message: `Hạng mục #${ii + 1}: thiếu mã` });
      else if (itemCodes.has(it.item_code)) out.push({ level: "error", section_index: si, item_index: ii, message: `Trùng mã hạng mục: ${it.item_code}` });
      else itemCodes.add(it.item_code);
      if (!it.ten?.trim()) out.push({ level: "warning", section_index: si, item_index: ii, message: `${it.item_code}: chưa đặt tên` });
      if (it.result_kind === "so") {
        const { tieu_chuan_min: mn, tieu_chuan_max: mx } = it.options;
        if (mn != null && mx != null && mn > mx) {
          out.push({ level: "error", section_index: si, item_index: ii, message: `${it.item_code}: ngưỡng min > max` });
        }
      }
      if (it.result_kind === "chon" && (it.options.choices ?? []).length === 0) {
        out.push({ level: "warning", section_index: si, item_index: ii, message: `${it.item_code}: chưa có lựa chọn` });
      }
    });
  });
  return out;
}

export function hasBlocking(issues: readonly ChecklistIssue[]): boolean {
  return issues.some((x) => x.level === "error");
}

/** Xoá toàn bộ section+item của template rồi chèn lại theo cây designer. */
export async function saveChecklistDesigner(
  templateId: string,
  sections: readonly DesignerSection[],
): Promise<void> {
  // Xoá cũ (cascade xoá item).
  const del = await supabase.from("form_section").delete().eq("template_id", templateId);
  if (del.error) throw del.error;

  if (sections.length === 0) return;

  // Chèn section, giữ map ma_section → id để chèn item ngay sau đó.
  const secRows = sections.map((s, i) => ({
    template_id: templateId,
    ma_section: s.ma_section,
    ten: s.ten || s.ma_section,
    mo_ta: s.mo_ta ?? null,
    position: i,
    col_layout: 1,
    repeatable: false,
  }));
  const { data: insSecs, error: e1 } = await supabase.from("form_section").insert(secRows).select("id, ma_section");
  if (e1) throw e1;
  const idByMa = new Map((insSecs ?? []).map((r) => [r.ma_section as string, r.id as string]));

  type ItemRow = {
    section_id: string;
    template_id: string;
    item_code: string;
    ten: string;
    huong_dan: string | null;
    result_kind: ChecklistSection["items"][number]["result_kind"];
    don_vi: string | null;
    tieu_chuan: string | null;
    tuy_chon: import("@/integrations/supabase/types").Json;
    bat_buoc: boolean;
    position: number;
  };
  const itemRows: ItemRow[] = [];
  sections.forEach((s, si) => {
    const sid = idByMa.get(s.ma_section);
    if (!sid) return;
    s.items.forEach((it, ii) => {
      itemRows.push({
        section_id: sid,
        template_id: templateId,
        item_code: it.item_code,
        ten: it.ten || it.item_code,
        huong_dan: it.huong_dan ?? null,
        result_kind: it.result_kind,
        don_vi: it.don_vi ?? null,
        tieu_chuan: it.tieu_chuan ?? null,
      tuy_chon: (serializeItemOptions({
          ...it.options,
          // đảm bảo choices cho kiểu "chon" đồng bộ từ tuy_chon phẳng.
          choices: it.options.choices ?? it.tuy_chon ?? null,
        }) ?? null) as import("@/integrations/supabase/types").Json,
        bat_buoc: !!it.bat_buoc,
        position: si * 1000 + ii,
      });
    });
  });
  if (itemRows.length > 0) {
    const { error: e2 } = await supabase.from("form_check_item").insert(itemRows);
    if (e2) throw e2;
  }
}