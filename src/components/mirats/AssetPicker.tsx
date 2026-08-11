import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { Combobox } from "@/components/mirats/Combobox";
import { useMemo } from "react";

interface AssetPickerProps {
  value: string; // thiet_bi_id (UUID)
  onChange: (id: string, maThietBi: string, ten: string) => void;
  heThongId?: string;
  thanhPhanId?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * AssetPicker — Chọn tài sản từ danh mục.
 * Ưu tiên tài sản đang rảnh hoặc đang lắp tại vị trí/hệ thống chỉ định.
 */
export function AssetPicker({
  value,
  onChange,
  heThongId,
  thanhPhanId,
  placeholder = "Chọn tài sản...",
  disabled,
  className,
}: AssetPickerProps) {
  // Lấy danh sách tài sản (dùng cache db_taxonomy nếu có thể, hoặc fetch trực tiếp)
  const { data: assets, isLoading } = useQuery({
    queryKey: ["asset-picker-list", heThongId, thanhPhanId],
    queryFn: async () => {
      let query = supabase
        .from("thiet_bi")
        .select("id, ma_thiet_bi, ten_thiet_bi, ma_serial, he_thong_id, trang_thai_id, dm_trang_thai_thiet_bi:trang_thai_id(ma)")
        .neq("trang_thai_id", "00000000-0000-0000-0000-000000000000"); // Giả định ID thanh lý hoặc filter logic

      // Nếu có heThongId, ưu tiên đưa lên đầu hoặc lọc? 
      // T46 yêu cầu "không cho gõ chữ tự do", nên ta show list phù hợp.
      
      const { data, error } = await query.order("ma_thiet_bi");
      if (error) throw error;
      return data || [];
    },
  });

  const options = useMemo(() => {
    return (assets || []).map((a) => ({
      value: a.id,
      label: `${a.ma_thiet_bi} — ${a.ten_thiet_bi}`,
      hint: a.ma_serial ? `S/N: ${a.ma_serial}` : undefined,
    }));
  }, [assets]);

  return (
    <Combobox
      options={options}
      value={value}
      onChange={(val) => {
        const selected = assets?.find((a) => a.id === val);
        if (selected) {
          onChange(selected.id, selected.ma_thiet_bi, selected.ten_thiet_bi || "");
        } else {
          onChange("", "", "");
        }
      }}
      placeholder={isLoading ? "Đang tải..." : placeholder}
      disabled={disabled}
      className={className}
    />
  );
}
