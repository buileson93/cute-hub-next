import * as React from "react";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Selector, type SelectorOption } from "@astryxdesign/core/Selector";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { Switch } from "@astryxdesign/core/Switch";
import { cn } from "@/lib/utils";

// MiratsInput: Thin wrapper for Astryx TextInput
export const MiratsInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof TextInput>
>((props, ref) => {
  return <TextInput ref={ref} {...props} />;
});
MiratsInput.displayName = "MiratsInput";

// MiratsSelector: Thin wrapper for Astryx Selector
// Selector in Astryx doesn't always accept a standard ref on the component itself
export const MiratsSelector = (props: React.ComponentPropsWithoutRef<typeof Selector>) => {
  return <Selector {...props} />;
};
MiratsSelector.displayName = "MiratsSelector";

// MiratsCheckbox: Thin wrapper for Astryx CheckboxInput
export const MiratsCheckbox = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof CheckboxInput>
>((props, ref) => {
  return <CheckboxInput ref={ref} {...props} />;
});
MiratsCheckbox.displayName = "MiratsCheckbox";

// MiratsSwitch: Thin wrapper for Astryx Switch
export const MiratsSwitch = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof Switch>
>((props, ref) => {
  return <Switch ref={ref} {...props} />;
});
MiratsSwitch.displayName = "MiratsSwitch";
