import { useState, useEffect, ReactNode } from "react";

interface AstryxProviderProps {
  children: ReactNode;
}

/**
 * AstryxProvider
 * 
 * Binds the published Stone theme to the application.
 * Only active in the browser to prevent SSR crashes from Astryx components.
 */
export function AstryxProvider({ children }: AstryxProviderProps) {
  const [hydrated, setHydrated] = useState(false);
  const [components, setComponents] = useState<{ Theme: any; stoneTheme: any } | null>(null);

  useEffect(() => {
    console.log("[Astryx] Initializing provider hydration...");
    // Dynamic import inside useEffect ensures browser-only execution
    Promise.all([
      import("@astryxdesign/core"),
      import("@astryxdesign/theme-stone/built")
    ]).then(([core, theme]) => {
      console.log("[Astryx] Hydrated theme provider", { 
        hasTheme: !!core.Theme, 
        hasStone: !!theme.stoneTheme 
      });
      setComponents({ Theme: core.Theme, stoneTheme: theme.stoneTheme });
      setHydrated(true);
    }).catch(err => {
      console.error("[Astryx] Failed to hydrate", err);
    });
  }, []);

  if (!hydrated || !components || !components.Theme) {
    return <>{children}</>;
  }

  const { Theme, stoneTheme } = components;

  return (
    <Theme theme={stoneTheme}>
      <div className="astryx-hydration-root" data-astryx-ready="true">
        {children}
      </div>
    </Theme>
  );
}
