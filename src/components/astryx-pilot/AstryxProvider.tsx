import { ReactNode, useEffect, useState } from "react";
import { Theme } from "@astryxdesign/core/theme";
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
  if (!isHydrated) {
    return <>{children}</>;
  }

  return (
    <Theme theme={vatmTheme} mode="system">
      {children}
    </Theme>
  );
}
