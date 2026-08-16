import { ReactNode } from "react";
import { Theme } from "@astryxdesign/core/theme";
import neutralTheme from "@astryxdesign/theme-neutral/built";

interface AstryxProviderProps {
  children: ReactNode;
}

/**
 * AstryxProvider integrates the Astryx design system theme into the MIRATS 2.0 app.
 * It uses the predefined neutral theme and synchronizes with the existing dark mode logic.
 */
export function AstryxProvider({ children }: AstryxProviderProps) {
  return (
    <Theme theme={neutralTheme} mode="system">
      {children}
    </Theme>
  );
}
