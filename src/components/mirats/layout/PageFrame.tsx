import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";
import { TYPO } from "@/lib/mirats/ui/typography";

interface PageFrameProps {
  children: ReactNode;
  className?: string;
  density?: "compact" | "comfortable" | "spacious";
}

/**
 * Root container for a MIRATS page.
 * Manages global density context and layout structure.
 */
export function PageFrame({ children, className, density = "compact" }: PageFrameProps) {
  return (
    <div 
      data-density={density}
      className={cn(
        "flex min-h-screen w-full flex-col bg-background transition-colors duration-300",
        TYPO.BODY,
        className
      )}
    >
      {children}
    </div>
  );
}
