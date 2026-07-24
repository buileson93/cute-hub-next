// ============================================================================
// ReferenceCell — renderer duy nhất cho các CỘT tham chiếu danh mục (dm_*).
//
// P5: mọi trường có `PhysCol.type === "reference"` phải render Combobox chọn
// từ bảng danh mục nguồn (refTable) và LƯU uuid. Áp dụng đồng nhất cho cả 3
// view (tree/table/mindmap) qua sheet biên tập dùng chung.
// ============================================================================
import * as React from "react";
import { Combobox } from "@/components/mirats/Combobox";
import { useReferenceIdOptions } from "@/lib/mirats/reference-sources";

export interface ReferenceCellProps {
  /** Bảng danh mục nguồn (dm_*). Giá trị lưu là id (uuid) của bản ghi. */
  refTable: string;
  /** uuid hiện tại (rỗng = chưa chọn). */
  value: string;
  /** Nhận uuid đã chọn — nhất quyết là id, không phải chuỗi tên. */
  onChange: (uuid: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  /** Cho phép nội dung theo sau (nút "Thêm nhanh…" ở trường model). */
  after?: React.ReactNode;
}

/**
 * Ô chọn danh mục. Không bao giờ render `<input type="text">` — chỉ Combobox
 * để chặn nhập tay. Xem `PhysCol.type === "reference"` trong editable-columns.
 */
export function ReferenceCell({
  refTable,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "Tìm…",
  className,
  after,
}: ReferenceCellProps) {
  const { data: options = [], isLoading } = useReferenceIdOptions(refTable);
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <div className="min-w-0 flex-1">
        <Combobox
          options={options}
          value={value}
          onChange={onChange}
          placeholder={placeholder ?? (isLoading ? "Đang tải…" : "— Chọn —")}
          searchPlaceholder={searchPlaceholder}
        />
      </div>
      {after}
    </div>
  );
}
