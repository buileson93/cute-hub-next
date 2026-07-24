// ============================================================================
// Task 29 — InfoGrid: lưới label–value dùng chung cho HoverCard / Detail panel.
// Field `highlight` được đánh dấu bằng:
//  - `data-highlight="true"` (aria/test-friendly)
//  - nền nhạt + chữ đậm
// ============================================================================
import * as React from "react";
import { cn } from "@/lib/utils";
import { ExpiringBadge } from "@/components/mirats/ExpiringBadge";
import type { RenderedField } from "@/lib/mirats/display/types";

export interface InfoGridProps {
  fields: RenderedField[];
  /** 1 hoặc 2 cột. Mặc định 2. */
  cot?: 1 | 2;
  className?: string;
}

export function InfoGrid({ fields, cot = 2, className }: InfoGridProps) {
  if (fields.length === 0) return null;
  return (
    <dl
      className={cn(
        "grid gap-x-4 gap-y-1.5 text-[13px]",
        cot === 2 ? "grid-cols-[auto_1fr]" : "grid-cols-1",
        className,
      )}
    >
      {fields.map((f, i) => (
        <InfoRow key={`${f.nhan}-${i}`} field={f} />
      ))}
    </dl>
  );
}

function InfoRow({ field }: { field: RenderedField }) {
  const hl = !!field.highlight;
  return (
    <>
      <dt
        data-highlight={hl ? "true" : undefined}
        className={cn(
          "truncate text-muted-foreground",
          hl && "font-semibold text-foreground",
        )}
      >
        {field.nhan}
      </dt>
      <dd
        data-highlight={hl ? "true" : undefined}
        className={cn(
          "flex min-w-0 items-center gap-2",
          hl
            ? "rounded-md bg-accent/40 px-1.5 py-0.5 font-semibold text-foreground"
            : "text-foreground/90",
        )}
      >
        <span className="truncate">{field.giaTri}</span>
        {typeof field.soNgay === "number" && (
          <ExpiringBadge soNgay={field.soNgay} compact />
        )}
      </dd>
    </>
  );
}
