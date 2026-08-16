import { ReactNode, useEffect, useState, Suspense, lazy } from "react";

// Lazy load the Theme component to ensure its internal StyleX/browser logic
// only executes after the hydration boundary.
const AstryxTheme = lazy(() => 
  import("@astryxdesign/core/theme").then(m => ({ default: m.Theme }))
);

import { vatmTheme } from "@/styles/theme-vatm";

interface AstryxProviderProps {
  children: ReactNode;
}

/**
 * AstryxProvider integrates the VATM design system theme into the MIRATS 2.0 app.
 * It uses the custom VATM theme mapped from MIRATS brand assets.
 */
export function AstryxProvider({ children }: AstryxProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // During SSR, we render the children without the Astryx Theme provider
  // if the provider itself is not SSR-safe (some design system themes 
  // calculate values using browser APIs). If children also use Astryx tokens,
  // we might need a more complex solution, but usually the provider is the bottleneck.
  // During SSR, we render a minimal container to avoid hydration mismatch 
  // and prevent child components from trying to use theme tokens before hydration.
  if (!isHydrated) {
    return (
      <div 
        className="astryx-ssr-placeholder" 
        style={{ display: 'contents' }}
        data-ssr-loading="true"
      >
        {children}
      </div>
    );
  }

  return (
    <Suspense fallback={<>{children}</>}>
      <AstryxTheme theme={vatmTheme} mode="system">
        {children}
      </AstryxTheme>
    </Suspense>
  );
}
