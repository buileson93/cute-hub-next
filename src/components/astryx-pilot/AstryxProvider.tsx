import { Theme } from "@astryxdesign/core";
import { stoneTheme } from "@astryxdesign/theme-stone/built";
import { ReactNode } from "react";

interface AstryxProviderProps {
  children: ReactNode;
}

/**
 * AstryxProvider
 * 
 * Binds the published Stone theme to the application.
 * Uses a module-constant theme object to ensure deterministic SSR.
 */
export function AstryxProvider({ children }: AstryxProviderProps) {
  return (
    <Theme theme={stoneTheme}>
      {children}
    </Theme>
  );
}
