// ============================================================================
// Task 29 — InfoGrid: lưới label–value dùng chung cho HoverCard / Detail panel.
// Field `highlight` được đánh dấu bằng:
//  - `data-highlight="true"` (aria/test-friendly)
//  - nền nhạt + chữ đậm
// ============================================================================
import * as React from "react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/mirats/StatusBadge";
import { getExpiryCode, getExpiryLabel } from "@/lib/mirats/ui/status-tokens";
import type { RenderedField } from "@/lib/mirats/display/types";

export interface InfoGridProps {
  fields: Array<{
    nhan: string;
    giaTri: React.ReactNode;
    highlight?: boolean;
    soNgay?: number | null;
  }>;
  /** 1 hoặc 2 cột. Mặc định 2. */
  cot?: 1 | 2;
  className?: string;
}

export function InfoGrid({ fields, cot = 2, className }: InfoGridProps) {
  if (fields.length === 0) return null;
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-2 text-[13px]",
        cot === 2 ? "grid-cols-[max-content_1fr]" : "grid-cols-1",
        className,
      )}
    >
      {fields.map((f, i) => (
        <InfoRow key={`${f.nhan}-${i}`} field={f} />
      ))}
    </dl>
  );
}

function InfoRow({ field }: { field: InfoGridProps["fields"][number] }) {
  const hl = !!field.highlight;
  return (
    <>
      <dt
        data-highlight={hl ? "true" : undefined}
        className={cn(
          "truncate text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-relaxed",
          hl && "text-foreground/80",
        )}
      >
        {field.nhan}
      </dt>
      <dd
        data-highlight={hl ? "true" : undefined}
        className={cn(
          "flex min-w-0 items-center gap-2",
          hl
            ? "rounded-lg bg-accent/30 px-2 py-0.5 font-bold text-foreground ring-1 ring-border/50"
            : "text-foreground font-medium",
        )}
      >
        <div className="truncate flex-1">{field.giaTri}</div>
        {typeof field.soNgay === "number" && (
          <StatusBadge
            domain="expiry"
            code={getExpiryCode(field.soNgay)}
            label={getExpiryLabel(field.soNgay, true)}
          />
        )}
      </dd>
    </>
  );
}
