import { Check, Eye, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import type { HeThongEditModeApi } from "@/lib/mirats/he-thong/edit-mode";

/**
 * Nút chuyển View mode ↔ Edit mode dùng chung cho khu vực Hệ thống.
 * Không render gì khi người dùng không có quyền chỉnh sửa (chỉ hiện nhãn "Chế độ xem").
 */
export function EditModeToggle({
  mode,
  className,
  hienNhan = true,
}: {
  mode: HeThongEditModeApi;
  className?: string;
  /** Hiện nhãn trạng thái bên cạnh nút. */
  hienNhan?: boolean;
}) {
  if (!mode.allowEdit) {
    return (
      <AppTooltip noiDung="Tài khoản của bạn chỉ được tra cứu dữ liệu Hệ thống.">
        <span
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-dashed px-2.5 text-meta font-semibold uppercase tracking-tight text-muted-foreground",
            className,
          )}
        >
          <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Chế độ xem
        </span>
      </AppTooltip>
    );
  }

  return (
    <AppTooltip
      noiDung={
        mode.editMode
          ? "Hoàn tất chỉnh sửa và quay lại chế độ xem"
          : "Bật chế độ chỉnh sửa để thêm/sửa/xoá dữ liệu Hệ thống"
      }
    >
      <Button
        size="sm"
        variant={mode.editMode ? "default" : "outline"}
        aria-pressed={mode.editMode}
        aria-label={mode.editMode ? "Hoàn tất chỉnh sửa" : "Bật chế độ chỉnh sửa"}
        onClick={mode.toggle}
        className={cn(
          "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 text-meta font-semibold uppercase tracking-tight",
          className,
        )}
      >
        {mode.editMode ? (
          <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        )}
        {hienNhan && <span className="truncate">{mode.editMode ? "Hoàn tất" : "Chỉnh sửa"}</span>}
      </Button>
    </AppTooltip>
  );
}
