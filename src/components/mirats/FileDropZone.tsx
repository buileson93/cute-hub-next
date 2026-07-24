// ============================================================================
// Vùng kéo-thả file (CSV/XLSX) cho luồng nhập. Bọc quanh nút "Nhập CSV/XLSX"
// để người dùng có thể thả file trực tiếp thay vì bấm chọn.
// ============================================================================

import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type FileDropZoneProps = {
  onFile: (file: File) => void;
  /** Đuôi file chấp nhận (case-insensitive). Mặc định: .csv, .xlsx. */
  accept?: string[];
  disabled?: boolean;
  /** Nhãn hiển thị khi đang kéo file vào vùng. */
  hint?: string;
  className?: string;
  children: ReactNode;
};

export function FileDropZone({
  onFile,
  accept = [".csv", ".xlsx"],
  disabled,
  hint,
  className,
  children,
}: FileDropZoneProps) {
  const [over, setOver] = useState(false);
  // Dùng counter vì dragenter/leave fire nhiều lần cho các phần tử con.
  const counter = useRef(0);

  return (
    <div
      role="group"
      aria-label={hint ?? `Kéo-thả file ${accept.join("/")} vào đây`}
      aria-disabled={disabled || undefined}
      data-drop-over={over || undefined}
      onDragEnter={(e) => {
        if (disabled) return;
        if (!Array.from(e.dataTransfer.types ?? []).includes("Files")) return;
        e.preventDefault();
        counter.current += 1;
        setOver(true);
      }}
      onDragOver={(e) => {
        if (disabled) return;
        if (!Array.from(e.dataTransfer.types ?? []).includes("Files")) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => {
        counter.current = Math.max(0, counter.current - 1);
        if (counter.current === 0) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        counter.current = 0;
        setOver(false);
        if (disabled) return;
        const files = Array.from(e.dataTransfer.files ?? []);
        if (files.length === 0) return;
        const match = files.find((f) => accept.some((a) => f.name.toLowerCase().endsWith(a.toLowerCase())));
        if (!match) {
          toast.error(`Chỉ nhận file ${accept.join(", ")}. Đã bỏ qua "${files[0].name}".`);
          return;
        }
        onFile(match);
      }}
      className={cn(
        "relative inline-flex rounded-md transition-colors",
        over && "outline-2 outline-dashed outline-primary bg-primary/5",
        className,
      )}
    >
      {children}
      {over && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-primary/10 text-[11px] font-medium text-primary"
        >
          Thả {accept.join("/")} để nhập
        </div>
      )}
    </div>
  );
}
