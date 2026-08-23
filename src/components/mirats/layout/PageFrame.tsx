import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";
import { TYPO } from "@/lib/mirats/ui/typography";

interface PageFrameProps {
  children: ReactNode;
  className?: string;
  density?: "compact" | "comfortable" | "spacious";
  layout?: "default" | "workspace";
}

/**
 * Root container for a MIRATS page.
 * Manages global density context and layout structure.
 */
export function PageFrame({ 
  children, 
  className, 
  density = "compact",
  layout = "default" 
}: PageFrameProps) {
  return (
    <div
      data-density={density}
      className={cn(
        "flex w-full flex-col bg-background transition-colors duration-300",
        "h-dvh overflow-hidden relative",
        TYPO.BODY,
        className,
      )}
    >
      {children}
    </div>
  );
}
