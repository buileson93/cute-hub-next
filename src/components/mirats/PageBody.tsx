// src/components/mirats/PageBody.tsx

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";
import { TYPO } from "@/lib/mirats/ui/typography";

interface Props {
  children: ReactNode;
  className?: string;
  /** Nếu true, bỏ padding mặc định (dùng cho các trang dashboard full-width) */
  noPadding?: boolean;
  /** Density variant for padding/gap scaling */
  density?: "compact" | "comfortable" | "spacious";
}

/**
 * Wrapper chuẩn cho thân trang, đảm bảo padding và khoảng cách nhất quán.
 * Thường dùng ngay sau <PageHeader />.
 * Anatomy: Content container that respects global density tokens.
 */
export function PageBody({ children, className, noPadding, density }: Props) {
  return (
    <div
      data-density={density}
      role="main"
      tabIndex={0}
      aria-label="Vùng nội dung chính"
      className={cn(
        "relative flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-y-auto overscroll-contain mirats-scroll bg-background/50 isolation-auto outline-none focus-visible:ring-1 focus-visible:ring-primary/20 astryx-page-body",
        TYPO.BODY,
        !noPadding && UI_DENSITY.PAGE_PADDING,
        UI_DENSITY.SECTION_GAP,
        className,
      )}
    >
      {children}
    </div>
  );
}
