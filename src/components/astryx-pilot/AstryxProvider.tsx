import { ReactNode } from "react";
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
  return (
    <Theme theme={vatmTheme} mode="system">
      {children}
    </Theme>
  );
}
