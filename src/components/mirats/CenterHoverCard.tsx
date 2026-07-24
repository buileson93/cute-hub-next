import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * A hover preview card that always renders centered on the screen inside a
 * portal, so tall content never gets clipped by table scroll containers or
 * viewport edges. Drop-in replacement for the Radix HoverCard trio when the
 * preview content is large.
 */
export function CenterHoverCard({
  trigger,
  children,
  openDelay = 300,
  closeDelay = 100,
  className,
  contentClassName,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  openDelay?: number;
  closeDelay?: number;
  /** applied to the inline wrapper around the trigger */
  className?: string;
  /** applied to the floating card */
  contentClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const openTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const scheduleOpen = React.useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = setTimeout(() => setOpen(true), openDelay);
  }, [openDelay]);

  const scheduleClose = React.useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), closeDelay);
  }, [closeDelay]);

  React.useEffect(
    () => () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  return (
    <>
      <span
        className={cn("contents", className)}
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        onFocus={scheduleOpen}
        onBlur={scheduleClose}
      >
        {trigger}
      </span>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className={cn(
                "pointer-events-auto max-h-[85vh] w-80 max-w-[92vw] overflow-auto rounded-lg border bg-popover text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95",
                contentClassName,
              )}
              onMouseEnter={scheduleOpen}
              onMouseLeave={scheduleClose}
            >
              {children}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
