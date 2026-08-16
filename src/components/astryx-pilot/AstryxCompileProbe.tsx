import { Theme, Badge, Button, Icon } from "@astryxdesign/core";
// Note: Neutral theme import probe
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
        <Button>Astryx Button</Button>
        <Badge>Astryx Badge</Badge>
        <div className="flex gap-2">
          {/* Exact import names for P1 verified via core/dist/Icon/defaultIcons.js */}
          <Icon name="search" />
          <Icon name="check" />
          <Icon name="error" />
          <Icon name="warning" />
          <Icon name="info" />
          <Icon name="moreHorizontal" />
          <Icon name="chevronDown" />
          <Icon name="close" />
        </div>
      </div>
    </Theme>
  );
}
