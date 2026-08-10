// ============================================================================
// Task 29 — EntityHoverCard: hover popup dùng chung cho MỌI thực thể.
//
// - Nội dung lấy từ display registry (Task 27) → chỉ cần truyền {loai, row}.
// - Header: tiêu đề (tieuDe) + dòng phụ (phu) + StatusBadge (Task 25) nếu có.
// - Khối HIGHLIGHT: các field then chốt, hiển thị đậm.
// - InfoGrid `chiTiet` cho phần còn lại.
// - ExpiringBadge tự bật ở các field loai='expiring'.
// - A11y: hover + focus trigger đều mở, delay hợp lý, không che nội dung.
// ============================================================================
import * as React from "react";
import {
  HoverCard, HoverCardContent, HoverCardTrigger,
} from "@/components/ui/hover-card";
import { StatusBadge } from "@/components/mirats/StatusBadge";
import { InfoGrid } from "@/components/mirats/InfoGrid";
import {
  entityView, renderField,
} from "@/lib/mirats/display/registry";
import type { EntityLoai } from "@/lib/mirats/display/types";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

/** Thumb cho model - dùng lại logic từ catalog model */
function ModelThumbSmall({ url, ten }: { url?: string | null; ten: string }) {
  if (!url) return null;
  return (
    <div className="shrink-0">
      <img
        src={url}
        alt={ten}
        className="h-12 w-12 rounded border bg-white object-contain p-0.5 shadow-sm"
      />
    </div>
  );
}


export interface EntityHoverCardProps {
  loai: EntityLoai;
  row: Record<string, unknown> | null | undefined;
  children: React.ReactNode;
  /** Trễ mở (ms). Mặc định 250 — đủ để không mở khi lướt qua. */
  treMo?: number;
  ben?: "top" | "right" | "bottom" | "left";
  className?: string;
}

/**
 * Bọc bất kỳ trigger nào (span mã tài sản, link sự cố...) để hiện hover
 * popup thông tin đầy đủ của thực thể.
 */
export function EntityHoverCard({
  loai, row, children, treMo = 250, ben = "bottom", className,
}: EntityHoverCardProps) {
  // Không có dữ liệu → render trigger trần, không mở HoverCard.
  if (!row) return <>{children}</>;

  const view = entityView(loai);
  const tieuDe = view.tieuDe(row) || view.ten;
  const phu = view.phu?.(row) ?? "";
  const highlightFields = view.highlight.map((f) => renderField(f, row));
  const chiTietFields = view.chiTiet.map((f) => renderField(f, row));
  const badgeCode = view.badgeTrangThai
    ? (row[view.badgeTrangThai.key] as string | null | undefined)
    : null;

  return (
    <HoverCard openDelay={treMo} closeDelay={120}>
      <HoverCardTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "inline-flex cursor-help items-center rounded outline-none",
            "focus-visible:ring-2 focus-visible:ring-primary/50",
            className,
          )}
        >
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        side={ben}
        align="start"
        sideOffset={8}
        collisionPadding={12}
        className="w-[380px] max-w-[92vw] p-0"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {loai === "dm_model" && (
              <ModelThumbSmall 
                url={row.hinh_anh as string | null} 
                ten={tieuDe} 
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {view.ten}
              </div>
              <div className="mt-0.5 truncate text-sm font-semibold text-foreground">
                {tieuDe}
              </div>
              {phu && (
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {phu}
                </div>
              )}
            </div>
          </div>
          {view.badgeTrangThai && (
            <StatusBadge domain={view.badgeTrangThai.domain} code={badgeCode ?? null} />
          )}
        </div>


        {/* Highlight strip */}
        {highlightFields.length > 0 && (
          <div className="border-b bg-accent/30 px-4 py-2.5">
            <InfoGrid fields={highlightFields} />
          </div>
        )}

        {/* Chi tiết đầy đủ */}
        {chiTietFields.length > 0 && (
          <div className="max-h-[320px] overflow-y-auto px-4 py-3">
            <InfoGrid fields={chiTietFields} />
          </div>
        )}

        {/* Footer: Link sang trang chi tiết (Giai đoạn 2 - Mục 8) */}
        {loai === "dm_model" && (
          <div className="border-t bg-muted/20 px-4 py-2 text-right">
            <a 
              href={`/danh-muc/model?q=${encodeURIComponent(tieuDe)}`}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline"
            >
              Xem model này trong danh mục
              <Package className="h-3 w-3" />
            </a>
          </div>
        )}
      </HoverCardContent>

    </HoverCard>
  );
}
