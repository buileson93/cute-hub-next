import { Theme } from "@astryxdesign/core";
import { Badge } from "@astryxdesign/core/dist/Badge";
import { Button } from "@astryxdesign/core/dist/Button";
import { Icon } from "@astryxdesign/core/dist/Icon";

// These will be proofed by AstryxCompileProbe.tsx
// Exact imports for P1 verified subpaths

export function AstryxCompileProbe() {
  return (
    <Theme>
      <div className="p-4 space-y-4">
        <Button>Astryx Button</Button>
        <Badge>Astryx Badge</Badge>
        <div className="flex gap-2">
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
