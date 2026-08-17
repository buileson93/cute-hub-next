import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";

interface PageSectionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Logical grouping within PageBody.
 * Applies standard vertical gaps between major content blocks.
 */
export function PageSection({ children, className }: PageSectionProps) {
  return (
    <section className={cn(UI_DENSITY.SECTION_GAP, "flex flex-col", className)}>
      {children}
    </section>
  );
}
