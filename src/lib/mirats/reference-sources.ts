// ============================================================================
// Nguồn "liên kết CSDL" cho trường dữ liệu động (kieu = "reference").
//
// Cho phép admin khai một trường mà giá trị được chọn từ một bảng danh mục
// (dm_*) có sẵn trong CSDL — hiển thị dạng dropdown có tìm kiếm. Giá trị lưu
// vào jsonb `thuoc_tinh` là TÊN danh mục (chuỗi), để dễ đọc & đồng nhất với
// các trường "select".
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import type { ComboOption } from "@/components/mirats/Combobox";

/** Các bảng danh mục có thể liên kết. `value`/`label` đều dùng cột `ten`. */
export const REFERENCE_SOURCES = [
  { key: "dm_don_vi", nhan: "Đơn vị" },
  { key: "dm_vi_tri", nhan: "Vị trí lắp đặt" },
  { key: "dm_loai_thiet_bi", nhan: "Chủng loại" },
  { key: "dm_nha_san_xuat", nhan: "Nhà sản xuất" },
  { key: "dm_nha_cung_cap", nhan: "Nhà cung cấp" },
  { key: "dm_trang_thai_thiet_bi", nhan: "Trạng thái tài sản" },
  { key: "dm_nhom_he_thong", nhan: "Nhóm hệ thống" },

  { key: "dm_he_thong", nhan: "Hệ thống" },
  { key: "dm_noi_cap", nhan: "Nơi cấp giấy phép" },
  { key: "dm_loai_giay_phep", nhan: "Loại giấy phép" },
  { key: "dm_model", nhan: "Model" },
] as const;

export type ReferenceSourceKey = (typeof REFERENCE_SOURCES)[number]["key"];

const SOURCE_KEYS = new Set(REFERENCE_SOURCES.map((s) => s.key));

export function isReferenceSource(v: unknown): v is ReferenceSourceKey {
  return typeof v === "string" && SOURCE_KEYS.has(v as ReferenceSourceKey);
}

export function referenceSourceLabel(key: string): string {
  return REFERENCE_SOURCES.find((s) => s.key === key)?.nhan ?? key;
}

/** Nạp danh sách lựa chọn (ma + ten) từ một bảng danh mục để render Combobox. */
export function useReferenceOptions(source: string | undefined) {
  return useQuery({
    queryKey: ["ref_options", source],
    enabled: isReferenceSource(source),
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<ComboOption[]> => {
      const { data, error } = await supabase
        .from(source as ReferenceSourceKey)
        .select("ma,ten,active")
        .eq("active", true)
        .order("thu_tu", { ascending: true })
        .order("ten", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as Array<{ ma: string | null; ten: string | null }>;
      return rows
        .filter((r) => (r.ten ?? "").trim())
        .map((r) => ({ value: r.ten!.trim(), label: r.ten!.trim(), hint: r.ma ?? undefined }));
    },
  });
}

/**
 * Nạp lựa chọn (id + ten) từ một bảng danh mục — dùng cho CỘT VẬT LÝ khoá ngoại
 * (nha_san_xuat_id, nha_cung_cap_id, model_id). `value` là id (uuid) để ghi FK.
 */
export function useReferenceIdOptions(table: string | undefined) {
  return useQuery({
    queryKey: ["ref_id_options", table],
    enabled: !!table,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<ComboOption[]> => {
      // Model (dm_model) cần thêm P/N để nhận diện — tên không đủ.
      const isModel = table === "dm_model";
      const cols = isModel ? "id,ma,ten,p_n" : "id,ma,ten";
      const { data, error } = await supabase
        .from(table as ReferenceSourceKey)
        .select(cols as never)
        .order("ten", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as unknown as Array<{
        id: string;
        ma: string | null;
        ten: string | null;
        p_n?: string | null;
      }>;
      return rows
        .filter((r) => (r.ten ?? "").trim())
        .map((r) => {
          const ten = r.ten!.trim();
          const pn = (r.p_n ?? "").trim();
          return {
            value: r.id,
            label: isModel && pn ? `${ten} · ${pn}` : ten,
            hint: r.ma ?? undefined,
          };
        });
    },
  });
}
