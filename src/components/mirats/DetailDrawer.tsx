// ============================================================================
// Task 30 — DetailDrawer: xem chi tiết thực thể ngay tại danh sách.
//
// - Dùng registry (Task 27) để render header + highlight + chi tiết.
// - ActionBar (Task 26) theo quyền của user.
// - Nút "Mở trang đầy đủ" điều hướng khi cần chi tiết sâu hơn.
// - A11y: Esc đóng (Radix Dialog), focus trap, scroll drawer riêng —
//   không chặn scroll nền quá lâu (Sheet của shadcn xử lý sẵn).
// ============================================================================
import * as React from "react";
// Full-page nav dùng <a href> — TanStack Link cần literal `to`.
import { ExternalLink } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/mirats/StatusBadge";
import { InfoGrid } from "@/components/mirats/InfoGrid";
import { ActionBar } from "@/components/mirats/ActionBar";
import { InlineField } from "@/components/mirats/InlineField";
import { entityView, renderField } from "@/lib/mirats/display/registry";
import type { EntityLoai } from "@/lib/mirats/display/types";
import type { Domain } from "@/lib/mirats/quyen";
import type { Loai as InlineLoai } from "@/lib/mirats/ui/inline-edit";
import type { AppRole } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

/** Bản đồ loai → domain quyền (cho ActionBar). */
const LOAI_TO_DOMAIN: Record<EntityLoai, Domain> = {
  thiet_bi: "thiet_bi",
  su_co: "su_co",
  van_de: "van_de",
  cong_viec: "cong_viec",
  hong_hoc: "hong_hoc",
  ban_giao: "ban_giao",
  giay_phep: "giay_phep",
  vat_tu: "vat_tu",
  dm_model: "danh_muc",
};

export interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loai: EntityLoai | null;
  row: Record<string, unknown> | null | undefined;
  /** Đường dẫn trang chi tiết đầy đủ. Ẩn nút nếu không truyền. */
  hrefFull?: string;
  roles?: readonly AppRole[] | null;
  onSua?: () => void;
  onXoa?: () => void;
  onHoanThanh?: () => void;
  onDong?: () => void;
  /** Ép chế độ chỉ đọc dù có quyền. */
  forceReadOnly?: boolean;
  className?: string;
}

export function DetailDrawer({
  open, onOpenChange, loai, row, hrefFull, roles,
  onSua, onXoa, onHoanThanh, onDong, forceReadOnly, className,
}: DetailDrawerProps) {
  if (!loai) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className={cn("w-full sm:max-w-lg", className)}>
          <SheetHeader>
            <SheetTitle>Chi tiết</SheetTitle>
            <SheetDescription>Không có dữ liệu để hiển thị.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const view = entityView(loai);
  const tieuDe = row ? view.tieuDe(row) || view.ten : view.ten;
  const phu = row ? view.phu?.(row) ?? "" : "";
  const highlightFields = row ? view.highlight.map((f) => renderField(f, row)) : [];
  const chiTietFields = row ? view.chiTiet.map((f) => renderField(f, row)) : [];
  const badgeCode = row && view.badgeTrangThai
    ? (row[view.badgeTrangThai.key] as string | null | undefined)
    : null;
  const domain = LOAI_TO_DOMAIN[loai];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "flex w-full flex-col gap-0 p-0 sm:max-w-xl",
          className,
        )}
      >
        {/* Header */}
        <SheetHeader className="space-y-1 border-b px-6 py-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-meta font-semibold uppercase tracking-wider text-muted-foreground">
                {view.ten}
              </div>
              <SheetTitle className="truncate text-base font-semibold">
                {tieuDe}
              </SheetTitle>
              {phu && (
                <SheetDescription className="truncate text-xs">
                  {phu}
                </SheetDescription>
              )}
            </div>
            {view.badgeTrangThai && (
              <StatusBadge domain={view.badgeTrangThai.domain} code={badgeCode ?? null} />
            )}
          </div>
        </SheetHeader>

        {/* Body: highlight + chi tiết (cuộn riêng, không chặn scroll nền) */}
        <div className="flex-1 overflow-y-auto">
          {highlightFields.length > 0 && (
            <div className="border-b bg-accent/30 px-6 py-3">
              <InfoGrid fields={highlightFields} />
            </div>
          )}
          {chiTietFields.length > 0 ? (
            <div className="px-6 py-4">
              <InfoGrid fields={chiTietFields} />
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              Không có thông tin chi tiết.
            </div>
          )}
          {/* Task 31 — Inline edit ghi chú (chỉ hiện nếu row có id + loại hỗ trợ) */}
          {Boolean(row?.id) && (loai === "thiet_bi" || loai === "vat_tu") && row && (
            <div className="border-t px-6 py-4">
              <div className="mb-1 text-meta font-semibold uppercase tracking-wider text-muted-foreground">
                Ghi chú
              </div>
              <InlineField
                loai={loai as InlineLoai}
                id={String(row.id)}
                field="ghi_chu"
                giaTri={(row.ghi_chu as string | null | undefined) ?? null}
                roles={roles}
                placeholder="Bấm để thêm ghi chú…"
                invalidateKey={[loai]}
              />
            </div>
          )}
        </div>

        {/* Footer: hành động + mở trang đầy đủ */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-6 py-3">
          <ActionBar
            domain={domain}
            roles={roles ?? []}
            onSua={onSua}
            onXoa={onXoa}
            onHoanThanh={onHoanThanh}
            onDong={onDong}
            forceReadOnly={forceReadOnly}
          />
          {hrefFull && (
            <Button asChild size="sm" variant="ghost">
              <a href={hrefFull}>
                <ExternalLink className="mr-1 h-4 w-4" aria-hidden />
                Mở trang đầy đủ
              </a>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
