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
    // Dynamic import inside useEffect ensures browser-only execution
    Promise.all([
      import("@astryxdesign/core"),
      import("@astryxdesign/theme-stone/built")
    ]).then(([core, theme]) => {
      setComponents({ Theme: core.Theme, stoneTheme: theme.stoneTheme });
      setHydrated(true);
    });
  }, []);

  if (!hydrated || !components) {
    return <>{children}</>;
  }

  const { Theme, stoneTheme } = components;

  return (
    <Theme theme={stoneTheme}>
      {children}
    </Theme>
  );
}
