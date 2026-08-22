import React from "react";
import { cn } from "@/lib/utils";
import { ICON_REGISTRY, type IconName } from "@/lib/mirats/ui/icon-registry";
import { useDensity } from "@/components/mirats/DensityToggle";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName | string; // Allow string for dynamic keys from tokens
  size?: "tiny" | "small" | "medium" | "large" | "custom";
  className?: string;
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, size = "small", className, ...props }, ref) => {
    const [density] = useDensity();

    // Resolve icon component
    const LucideIcon = (ICON_REGISTRY as any)[name];

    if (!LucideIcon) {
      console.warn(`[Icon] Icon name "${name}" not found in registry.`);
      return null;
    }

    // Resolve size based on density
    // ICON_TINY (12px/14px)
    // ICON_SMALL (14px/16px)
    // ICON_MEDIUM (18px/20px)
    const sizeClasses = {
      tiny: cn(
        "h-3 w-3",
        density === "comfortable" && "h-3.5 w-3.5",
        density === "spacious" && "h-4 w-4",
      ),
      small: cn(
        "h-3.5 w-3.5",
        density === "comfortable" && "h-4 w-4",
        density === "spacious" && "h-5 w-5",
      ),
      medium: cn(
        "h-4 w-4",
        density === "comfortable" && "h-5 w-5",
        density === "spacious" && "h-6 w-6",
      ),
      large: "h-8 w-8",
      custom: "",
    };

    return (
      <LucideIcon
        ref={ref}
        className={cn(
          "shrink-0 transition-all",
          name.includes("loading") && "animate-spin",
          size !== "custom" && sizeClasses[size],
          className,
        )}
        aria-hidden="true"
        {...props}
      />
    );
  },
);

Icon.displayName = "Icon";
