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
  const { data: assets, isLoading } = useQuery({
    queryKey: ["asset-picker-list", heThongId, thanhPhanId],
    queryFn: async () => {
      const query = supabase
        .from("thiet_bi")
        .select(
          `
          id, ma_thiet_bi, ten_thiet_bi, ma_serial, he_thong_id, trang_thai_id,
          dm_trang_thai_thiet_bi:trang_thai_id(ma, ten, yeu_cau_gan_slot)
        `,
        )
        // N53: Có thể lọc theo yeu_cau_gan_slot tại đây nếu cần quy trình nghiêm ngặt.
        // Hiện tại chỉ loại bỏ các bản ghi không hợp lệ cơ bản.
        .neq("trang_thai_id", "00000000-0000-0000-0000-000000000000");

      const { data, error } = await query.order("ma_thiet_bi");
      if (error) throw error;
      return data || [];
    },
  });

  const options = useMemo(() => {
    return (assets || []).map((a) => {
      const status = a.dm_trang_thai_thiet_bi as any;
      const canSlot = status?.yeu_cau_gan_slot;

      return {
        value: a.id,
        label: `${a.ma_thiet_bi} — ${a.ten_thiet_bi}`,
        hint: [
          a.ma_serial ? `S/N: ${a.ma_serial}` : "",
          status?.ten ? `TT: ${status.ten}` : "",
          canSlot === false ? "⚠️ Chưa sẵn sàng lắp" : "",
        ]
          .filter(Boolean)
          .join(" · "),
      };
    });
  }, [assets]);

  return (
    <div className={className}>
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
        loading={isLoading}
      />
      {disabled && (
        <div className="pointer-events-none absolute inset-0 opacity-50 bg-background/50" />
      )}
    </div>
  );
}
