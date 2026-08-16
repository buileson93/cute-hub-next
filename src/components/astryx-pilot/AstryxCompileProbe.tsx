import { Theme, Badge, Button, Icon } from "@astryxdesign/core";
import { neutralTheme } from "@astryxdesign/theme-neutral";

/**
 * AstryxCompileProbe
 * 
 * This component is NOT imported into the main app.
 * It serves as a compile-time and SSR import probe to verify subpaths
 * and detect browser-only globals at module scope.
 */
export function AstryxCompileProbe() {
  return (
    <Theme theme={neutralTheme}>
      <div className="p-4 space-y-4">
        <Button label="Astryx Button" />
        <Badge label="Astryx Badge" />
        <div className="flex gap-2">
          {/* Exact icon names verified via core/dist/Icon/defaultIcons.js */}
          <Icon icon="search" />
          <Icon icon="check" />
          <Icon icon="error" />
          <Icon icon="warning" />
          <Icon icon="info" />
          <Icon icon="moreHorizontal" />
          <Icon icon="chevronDown" />
          <Icon icon="close" />
        </div>
      </div>
    </Theme>
  );
}
