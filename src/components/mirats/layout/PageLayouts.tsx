import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * StartPanel (Left Sidebar) for Detail/Workflow views
 */
export function StartPanel({ children, className }: LayoutProps) {
  return (
    <aside className={cn(
      "hidden lg:flex flex-col w-64 shrink-0 border-r bg-muted/5 sticky top-0 h-[calc(100vh-theme(spacing.12))]",
      className
    )}>
      {children}
    </aside>
  );
}

/**
 * EndPanel (Right Sidebar) for Metadata/Action lists
 */
export function EndPanel({ children, className }: LayoutProps) {
  return (
    <aside className={cn(
      "hidden xl:flex flex-col w-80 shrink-0 border-l bg-muted/5 sticky top-0 h-[calc(100vh-theme(spacing.12))]",
      className
    )}>
      {children}
    </aside>
  );
}

/**
 * Responsive Grid for content cards
 */
export function ContentGrid({ children, className, minChildWidth = "320px" }: LayoutProps & { minChildWidth?: string }) {
  return (
    <div 
      className={cn("grid gap-4", className)}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minChildWidth}, 1fr))` }}
    >
      {children}
    </div>
  );
}

/**
 * Footer for forms/actions
 */
export function PageFooter({ children, className }: LayoutProps) {
  return (
    <footer className={cn(
      "mt-auto border-t bg-background/80 backdrop-blur-md p-4 sticky bottom-0 z-20",
      className
    )}>
      {children}
    </footer>
  );
}
