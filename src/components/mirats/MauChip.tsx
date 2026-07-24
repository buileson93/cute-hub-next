// ============================================================================
// MauChip — chip màu dùng chung cho Chủng loại & Nhãn tài sản.
// Nhận { ten, mau }; render badge nền nhạt + chữ/viền theo `mauTheoToken`.
// mau null / không hợp lệ → màu xám fallback.
//
// Bonus: MauSwatchPicker — bảng chọn màu (12 preset) dùng trong FormDialog.
// ============================================================================

import * as React from "react";
import { Check } from "lucide-react";
import { BANG_MAU, mauTheoToken } from "@/lib/mirats/mau-sac";
import { cn } from "@/lib/utils";

export interface MauChipProps {
  ten: string;
  mau?: string | null;
  className?: string;
  title?: string;
}

/** Chip màu hiển thị tên (dùng cho Chủng loại / Nhãn tài sản). */
export function MauChip({ ten, mau, className, title }: MauChipProps) {
  const preset = mauTheoToken(mau);
  return (
    <span
      data-testid="mau-chip"
      data-mau-token={preset.token}
      title={title ?? ten}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        preset.lop,
        className,
      )}
    >
      {ten}
    </span>
  );
}

/** Ô chọn màu: 12 swatch từ BANG_MAU + nút "Không đặt" (null). */
export function MauSwatchPicker({
  value,
  onChange,
  disabled,
  allowClear = true,
}: {
  value: string | null | undefined;
  onChange: (mau: string | null) => void;
  disabled?: boolean;
  allowClear?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Chọn màu">
      {BANG_MAU.map((m) => {
        const active = value === m.token;
        return (
          <button
            key={m.token}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={m.ten}
            title={m.ten}
            disabled={disabled}
            onClick={() => onChange(m.token)}
            data-testid={`mau-swatch-${m.token}`}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-full border transition",
              m.lop,
              active ? "ring-2 ring-offset-1 ring-primary" : "hover:brightness-95",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {active && <Check className="h-3.5 w-3.5" />}
          </button>
        );
      })}
      {allowClear && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className={cn(
            "ml-1 rounded-md border px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted",
            disabled && "cursor-not-allowed opacity-50",
          )}
          title="Bỏ đặt màu (mặc định xám)"
        >
          Bỏ đặt
        </button>
      )}
    </div>
  );
}
