// src/components/mirats/PageBody.tsx

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";

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
      data-astryx-body="true"
      data-no-padding={noPadding}
      className={className}
    >
      {children}
    </div>
  );
}

