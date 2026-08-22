import React from "react";
import { cn } from "@/lib/utils";

interface RawTableWrapperProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string | number;
  stickyHeader?: boolean;
  showShadows?: boolean;
}

/**
 * RawTableWrapper - A presentation wrapper to standardize raw <table> tags (Group B).
 * Ensures consistent density, borders, and scroll behavior without full StandardTable migration.
 */
export function RawTableWrapper({
  children,
  className,
  maxHeight,
  stickyHeader = true,
  showShadows = true,
}: RawTableWrapperProps) {
  return (
    <div
      className={cn(
        "relative overflow-auto rounded-md border bg-card",
        showShadows && "shadow-sm",
        className,
      )}
      style={{ maxHeight }}
      data-raw-table-wrapper=""
    >
      <div
        className={cn(
          "w-full overflow-x-auto",
          // Force children table to respect our standard styles
          "[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
          // Header styling
          stickyHeader && "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-20",
          "[&_thead_tr]:bg-muted/50 [&_thead_tr]:border-b",
          "[&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium [&_th]:text-muted-foreground",
          // Row styling (Density-aware via global CSS usually, but let's add defaults)
          "[&_tbody_tr]:border-b [&_tbody_tr]:last:border-0 [&_tbody_tr]:transition-colors",
          "[&_tbody_tr:hover]:bg-muted/30",
          "[&_td]:px-4 [&_td]:py-2.5 [&_td]:align-top",
        )}
      >
        {children}
      </div>
    </div>
  );
}
