// Nhật ký thay đổi dữ liệu từng trường (đọc từ bảng audit_log).
// Dùng cho Sổ lý lịch tài sản & hệ thống: hiển thị ai đã sửa trường gì, từ giá trị nào sang giá trị nào.
// Mọi thay đổi (sửa trực tiếp, sửa trên sơ đồ, hoặc nhập liệu hàng loạt) đều được trigger audit_row_change ghi lại,
// nên nhập liệu hàng loạt tự động xuất hiện ở đây kèm đúng các trường đã thay đổi.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { THIET_BI_PHYS_GROUPS, HE_THONG_PHYS_GROUPS } from "./editable-columns";

// ---- Nhãn cột thân thiện ----
const EXTRA_LABELS: Record<string, string> = {
  ten: "Tên",
  ma_thiet_bi: "Mã tài sản",
  ten_he_thong: "Tên hệ thống",
  ten_hien_thi: "Tên hiển thị",
  trang_thai: "Trạng thái",
  don_vi: "Đơn vị",
  ghi_chu: "Ghi chú",
  vi_tri: "Vị trí",
  noi_lap_dat: "Nơi lắp đặt",
  nha_san_xuat: "Nhà sản xuất",
  nha_cung_cap: "Nhà cung cấp",
  model: "Model",
  mo_ta: "Mô tả",
  serial: "Số serial",
  ma_serial: "Số serial",
  p_n: "P/N (Part number)",
  phan_loai: "Phân loại",
  nhom_he_thong: "Nhóm hệ thống",
};

const LABELS: Record<string, string> = (() => {
  const m: Record<string, string> = { ...EXTRA_LABELS };
  for (const g of [...THIET_BI_PHYS_GROUPS, ...HE_THONG_PHYS_GROUPS]) {
    for (const c of g.cols) if (!m[c.key]) m[c.key] = c.label;
  }
  return m;
})();

function prettify(key: string): string {
  return key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function fieldLabel(key: string): string {
  return LABELS[key] || prettify(key);
}

// ---- Cột bỏ qua (nhiễu / kỹ thuật / khoá ngoại uuid có cột chữ tương ứng) ----
const IGNORE = new Set([
  "id",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "tsv",
  "search_text",
  "search_vec",
  "search",
  "qr_code",
]);
const isIgnored = (key: string) =>
  IGNORE.has(key) || /_id$/.test(key) || /^search/.test(key) || /_tsv$/.test(key);

export function formatVal(v: unknown): string {
  if (v === null || v === undefined || v === "") return "(trống)";
  if (typeof v === "boolean") return v ? "Có" : "Không";
  if (typeof v === "object") {
    try {
      const s = JSON.stringify(v);
      return s.length > 120 ? s.slice(0, 117) + "…" : s;
    } catch {
      return String(v);
    }
  }
  const s = String(v);
  return s.length > 120 ? s.slice(0, 117) + "…" : s;
}

export interface FieldChange {
  key: string;
  label: string;
  from: unknown;
  to: unknown;
}

const eq = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export function computeChanges(
  oldObj: Record<string, any> | null | undefined,
  newObj: Record<string, any> | null | undefined,
): FieldChange[] {
  const changes: FieldChange[] = [];
  const o = oldObj || {};
  const n = newObj || {};
  const keys = new Set([...Object.keys(o), ...Object.keys(n)]);
  for (const key of keys) {
    if (isIgnored(key)) continue;
    if (key === "thuoc_tinh") {
      const oa = (o.thuoc_tinh || {}) as Record<string, any>;
      const na = (n.thuoc_tinh || {}) as Record<string, any>;
      const attrKeys = new Set([...Object.keys(oa), ...Object.keys(na)]);
      for (const ak of attrKeys) {
        if (!eq(oa[ak], na[ak]))
          changes.push({ key: ak, label: fieldLabel(ak), from: oa[ak], to: na[ak] });
      }
      continue;
    }
    if (!eq(o[key], n[key]))
      changes.push({ key, label: fieldLabel(key), from: o[key], to: n[key] });
  }
  return changes.sort((a, b) => a.label.localeCompare(b.label, "vi"));
}

export type ChangeAction = "insert" | "update" | "delete";

export interface ChangeEvent {
  id: string;
  at: string;
  action: ChangeAction;
  userName: string;
  changes: FieldChange[];
}

/** Đọc nhật ký thay đổi cho một thực thể (entity = tên bảng, entityId = id bản ghi). */
export function useChangeLog(entity: string, entityId: string | null | undefined) {
  return useQuery({
    queryKey: ["change-log", entity, entityId],
    enabled: Boolean(entityId),
    queryFn: async (): Promise<ChangeEvent[]> => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("id, action, detail, created_at, user_id")
        .eq("entity", entity)
        .eq("entity_id", entityId as string)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const rows = (data || []) as Array<{
        id: string;
        action: string;
        detail: any;
        created_at: string;
        user_id: string | null;
      }>;

      // Tra tên người sửa
      const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean))) as string[];
      const nameMap = new Map<string, string>();
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, ho_ten, email")
          .in("id", userIds);
        for (const p of (profs || []) as Array<{
          id: string;
          ho_ten: string | null;
          email: string;
        }>) {
          nameMap.set(p.id, p.ho_ten || p.email);
        }
      }

      const events: ChangeEvent[] = [];
      for (const r of rows) {
        const action: ChangeAction = r.action?.startsWith("insert")
          ? "insert"
          : r.action?.startsWith("delete")
            ? "delete"
            : "update";
        const changes =
          action === "update"
            ? computeChanges(r.detail?.old, r.detail?.new)
            : action === "insert"
              ? []
              : [];
        // Bỏ qua các lần cập nhật không thực sự đổi trường nào (nhập liệu hàng loạt không thay đổi)
        if (action === "update" && changes.length === 0) continue;
        events.push({
          id: r.id,
          at: r.created_at,
          action,
          userName: r.user_id ? nameMap.get(r.user_id) || "Người dùng" : "Hệ thống",
          changes,
        });
      }
      return events;
    },
  });
}
