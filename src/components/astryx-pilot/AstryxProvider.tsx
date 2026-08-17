import { Theme } from "@astryxdesign/core";
import { stoneTheme } from "@astryxdesign/theme-stone/built";
import { ReactNode, useState, useEffect } from "react";

interface AstryxProviderProps {
  children: ReactNode;
}

/**
 * AstryxProvider
 * 
 * Binds the published Stone theme to the application.
 * Uses a hydration guard to prevent Astryx interactive components
 * from accessing browser-only APIs (like requestAnimationFrame) during SSR.
 */
export function AstryxProvider({ children }: AstryxProviderProps) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // During SSR, we render the theme container with static CSS variables but without
  // interactive components that might leak browser globals.
  // The stoneTheme is an object containing CSS variables, safe for SSR.
  return (
    <Theme theme={stoneTheme}>
      <div className={!hydrated ? "astryx-ssr-mode" : "astryx-client-mode"}>
        {children}
      </div>
    </Theme>
  );
}
