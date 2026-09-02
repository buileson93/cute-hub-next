import type { ComponentType, ReactNode, MouseEvent } from "react";
import { MoreHorizontal } from "lucide-react";

import { AppTooltip } from "@/components/mirats/AppTooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Cụm nút thao tác chuẩn cho mọi bảng khu vực Danh mục.
 *
 * Mục tiêu: một hệ phong cách duy nhất (kích thước, bo góc, khoảng cách,
 * hover/focus/disabled, icon size) để các trang không tự chế mỗi nơi một kiểu.
 * Trên mobile nút to hơn để đủ vùng chạm, trên desktop thu gọn lại.
 */

export type RowActionTone = "default" | "warning" | "destructive";

const TONE_CLASS: Record<RowActionTone, string> = {
  default: "text-muted-foreground hover:text-foreground",
  warning: "text-amber-600 hover:text-amber-700 hover:bg-amber-500/10",
  destructive: "text-destructive hover:text-destructive hover:bg-destructive/10",
};

/** Kích thước nút dùng chung: đủ chạm trên mobile (36px), gọn trên desktop (28px). */
export const ROW_ACTION_BUTTON_CLASS =
  "h-9 w-9 rounded-md sm:h-7 sm:w-7 disabled:opacity-40 disabled:pointer-events-none";
/** Icon size dùng chung trong nút thao tác dòng. */
export const ROW_ACTION_ICON_CLASS = "h-4 w-4 sm:h-3.5 sm:w-3.5";

export function RowActionBar({
  children,
  className,
  stopPropagation = true,
}: {
  children: ReactNode;
  className?: string;
  /** Chặn click lan ra hàng (tránh mở chi tiết ngoài ý muốn). */
  stopPropagation?: boolean;
}) {
  return (
    <div
      className={cn("flex items-center justify-end gap-0.5 whitespace-nowrap", className)}
      onClick={stopPropagation ? (e: MouseEvent) => e.stopPropagation() : undefined}
    >
      {children}
    </div>
  );
}

export function RowActionButton({
  icon: Icon,
  label,
  onClick,
  tone = "default",
  disabled,
  /** Tooltip riêng khi cần giải thích lý do disabled; mặc định dùng `label`. */
  tooltip,
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  tone?: RowActionTone;
  disabled?: boolean;
  tooltip?: ReactNode;
  className?: string;
}) {
  const noiDung = tooltip ?? label;
  const btn = (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(ROW_ACTION_BUTTON_CLASS, TONE_CLASS[tone], className)}
    >
      <Icon className={ROW_ACTION_ICON_CLASS} />
    </Button>
  );

  // Radix Tooltip không nhận sự kiện từ nút disabled → bọc span để vẫn hiện lý do.
  if (disabled) {
    return (
      <AppTooltip noiDung={noiDung}>
        <span className="inline-flex">{btn}</span>
      </AppTooltip>
    );
  }
  return <AppTooltip noiDung={noiDung}>{btn}</AppTooltip>;
}

export interface RowActionMenuItem {
  key: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onSelect: () => void;
  tone?: RowActionTone;
  disabled?: boolean;
  /** Chèn đường kẻ phía trên mục này — dùng để tách nhóm thao tác nguy hiểm. */
  separatorBefore?: boolean;
}

/** Menu ba chấm cho các thao tác phụ — dùng khi một dòng có quá nhiều nút. */
export function RowActionMenu({
  items,
  label = "Thao tác khác",
  className,
}: {
  items: RowActionMenuItem[];
  label?: string;
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <DropdownMenu>
      <AppTooltip noiDung={label}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={label}
            className={cn(ROW_ACTION_BUTTON_CLASS, TONE_CLASS.default, className)}
          >
            <MoreHorizontal className={ROW_ACTION_ICON_CLASS} />
          </Button>
        </DropdownMenuTrigger>
      </AppTooltip>
      {/* collisionPadding: menu gần mép viewport/vùng cuộn vẫn lật vào trong, không bị cắt. */}
      <DropdownMenuContent align="end" collisionPadding={12} className="w-56">
        {items.map((it, i) => (
          <Fragment key={it.key}>
            {it.separatorBefore && i > 0 ? <DropdownMenuSeparator /> : null}
          <DropdownMenuItem
            disabled={it.disabled}
            onSelect={(e) => {
              e.preventDefault();
              it.onSelect();
            }}
            className={cn(
              "gap-2 text-sm",
              it.tone === "destructive" && "text-destructive focus:text-destructive",
              it.tone === "warning" && "text-amber-600 focus:text-amber-700",
            )}
          >
            <it.icon className="h-4 w-4" />
            {it.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
