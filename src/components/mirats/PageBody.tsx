// src/components/mirats/PageBody.tsx

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";

interface Props {
  children: ReactNode;
  className?: string;
  /** Nếu true, bỏ padding mặc định (dùng cho các trang dashboard full-width) */
  noPadding?: boolean;
}

/**
 * Wrapper chuẩn cho thân trang, đảm bảo padding và khoảng cách nhất quán.
 * Thường dùng ngay sau <PageHeader />.
 */
export function PageBody({ children, className, noPadding }: Props) {
  return (
    <div 
      className={cn(
        "flex w-full flex-col flex-1 overflow-auto",
        !noPadding && UI_DENSITY.PAGE_PADDING,
        UI_DENSITY.SECTION_GAP,
        className
      )}
    >
      {children}
    </div>
  );
}
