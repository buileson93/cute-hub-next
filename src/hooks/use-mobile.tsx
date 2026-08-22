import * as React from "react";
import { MOBILE_BREAKPOINT_PX, TABLET_BREAKPOINT_PX } from "@/lib/mirats/ui/responsive-scope";

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT_PX);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT_PX);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export type ViewBreakpoint = "mobile" | "tablet" | "desktop";

export function useBreakpoint(): ViewBreakpoint {
  const [breakpoint, setBreakpoint] = React.useState<ViewBreakpoint>("desktop");

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < MOBILE_BREAKPOINT_PX) {
        setBreakpoint("mobile");
      } else if (width < TABLET_BREAKPOINT_PX) {
        setBreakpoint("tablet");
      } else {
        setBreakpoint("desktop");
      }
    };

    const mobileMql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
    const tabletMql = window.matchMedia(
      `(min-width: ${MOBILE_BREAKPOINT_PX}px) and (max-width: ${TABLET_BREAKPOINT_PX - 1}px)`,
    );

    mobileMql.addEventListener("change", updateBreakpoint);
    tabletMql.addEventListener("change", updateBreakpoint);

    updateBreakpoint();

    return () => {
      mobileMql.removeEventListener("change", updateBreakpoint);
      tabletMql.removeEventListener("change", updateBreakpoint);
    };
  }, []);

  return breakpoint;
}
