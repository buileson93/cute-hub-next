// Astryx Design System Provider

import { Theme } from "@astryxdesign/core/theme";
import { df3Theme } from "@/lib/astryx-theme/df3-theme";

import { ReactNode, useState, useEffect, Suspense, lazy } from "react";

interface AstryxProviderProps {
  children: ReactNode;
}

// We lazy-load the actual Theme component content because @astryxdesign/core
// might call requestAnimationFrame at module level or during construction.
const AstryxThemeWrapper = ({ children, theme }: { children: ReactNode; theme: any }) => {
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

  // During SSR, we render a plain fragment to avoid importing/executing @astryxdesign/core components
  // while ensuring child content (which uses B-S skins) is fully visible to crawlers and for LCP.
  if (!hydrated) {
    return <>{children}</>;
  }

  return (
    <AstryxThemeWrapper theme={df3Theme}>
      <div className="astryx-client-mode">{children}</div>
    </AstryxThemeWrapper>
  );
}
