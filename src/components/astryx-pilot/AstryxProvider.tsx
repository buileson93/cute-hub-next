import { Theme } from "@astryxdesign/core";
if (typeof window === 'undefined') {
  (globalThis as any).requestAnimationFrame = (callback: any) => setTimeout(callback, 0);
  (globalThis as any).cancelAnimationFrame = (id: any) => clearTimeout(id);
}
import { stoneTheme } from "@astryxdesign/theme-stone/built";
import { ReactNode, useState, useEffect, Suspense, lazy } from "react";

interface AstryxProviderProps {
  children: ReactNode;
}

// We lazy-load the actual Theme component content because @astryxdesign/core 
// might call requestAnimationFrame at module level or during construction.
const AstryxThemeWrapper = ({ children, theme }: { children: ReactNode, theme: any }) => {
  return <Theme theme={theme}>{children}</Theme>;
};

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
    // Only set hydrated to true on the client
    setHydrated(true);
  }, []);

  // During SSR, we render a plain div to avoid importing/executing @astryxdesign/core components
  // that leak browser globals like requestAnimationFrame.
  if (!hydrated) {
    return <div className="astryx-ssr-placeholder">{children}</div>;
  }

  return (
    <AstryxThemeWrapper theme={stoneTheme}>
      <div className="astryx-client-mode">
        {children}
      </div>
    </AstryxThemeWrapper>
  );
}
