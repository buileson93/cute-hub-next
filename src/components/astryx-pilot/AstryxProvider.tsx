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
    // requestAnimationFrame shim for SSR safety if needed by internals
    if (typeof window !== 'undefined' && !window.requestAnimationFrame) {
      (window as any).requestAnimationFrame = (callback: any) => setTimeout(callback, 0);
    }
    setHydrated(true);
  }, []);

  // During SSR, we render a plain container or just the children if safe.
  // Astryx interactive components use useEntryAnimation which fails at module level or during render.
  if (!hydrated) {
    return <div className="astryx-ssr-container">{children}</div>;
  }

  return (
    <Theme theme={stoneTheme}>
      {children}
    </Theme>
  );
}
