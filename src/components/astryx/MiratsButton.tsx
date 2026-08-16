import * as React from "react";
import { Button as AstryxButton } from "@astryxdesign/core/Button";
import { IconButton as AstryxIconButton } from "@astryxdesign/core/IconButton";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface MiratsButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline" | "link";
  size?: "sm" | "md" | "lg" | "xs" | "default" | "icon";
  loading?: boolean;
  tooltip?: React.ReactNode;
  asChild?: boolean;
  icon?: React.ReactNode;
}

/**
 * MiratsButton: Astryx-based wrapper for standard application buttons.
 * Preserves legacy MIRATS 2.0 contract: loading, tooltip, asChild, and variant names.
 */
export const MiratsButton = React.forwardRef<HTMLButtonElement, MiratsButtonProps>(
  (
    {
      className,
      variant = "secondary",
      size = "md",
      loading = false,
      tooltip,
      asChild = false,
      icon,
      children,
      title,
      ...props
    },
    ref
  ) => {
    // 1. Handle Radix Slot (asChild) - Astryx doesn't natively support Slot injection easily via props.
    // We stay legacy for asChild to avoid breaking compositions.
    if (asChild) {
      const Comp = Slot;
      return (
        <Comp
          className={cn(
            "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium cursor-pointer transition-mirats-fast active:scale-[var(--scale-active)]",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    // 2. Map legacy variants to Astryx variants
    const astryxVariant =
      variant === "outline" || variant === "secondary" || variant === "default"
        ? "secondary"
        : variant === "link"
          ? "ghost" // Astryx ghost is the closest for link-style behavior
          : variant;

    // 3. Map sizes
    const astryxSize = size === "xs" || size === "default" || size === "icon" ? "sm" : size;

    // 4. Determine if it's an icon-only button (Astryx preferred)
    const isIconOnly = (size === "icon" || !children) && !!icon;

    // 5. Tooltip logic (compatible with legacy auto-tooltip)
    const ariaLabel = props["aria-label"] || (typeof children === "string" ? children : undefined);
    const finalTooltip = tooltip ?? (isIconOnly ? ariaLabel ?? title : undefined);

    const buttonElement = isIconOnly ? (
      <AstryxIconButton
        ref={ref as any}
        icon={icon}
        label={ariaLabel || "Button"}
        variant={astryxVariant as any}
        size={astryxSize as any}
        isLoading={loading}
        isDisabled={props.disabled}
        className={className}
        onClick={props.onClick as any}
        {...(props as any)}
      />
    ) : (
      <AstryxButton
        ref={ref as any}
        label={typeof children === "string" ? children : (ariaLabel || "Button")}
        variant={astryxVariant as any}
        size={astryxSize as any}
        isLoading={loading}
        isDisabled={props.disabled}
        icon={icon}
        type={props.type as any}
        className={className}
        onClick={props.onClick as any}
        {...(props as any)}
      >
        {children}
      </AstryxButton>
    );

    if (!finalTooltip) return buttonElement;

    return (
      <TooltipProvider delayDuration={200} disableHoverableContent>
        <Tooltip>
          <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
          <TooltipContent side="top">{finalTooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

MiratsButton.displayName = "MiratsButton";

export interface MiratsIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  tooltip?: string;
}

export const MiratsIconButton = React.forwardRef<HTMLButtonElement, MiratsIconButtonProps>(
  ({ icon, label, variant = "secondary", size = "md", loading = false, tooltip, className, ...props }, ref) => {
    return (
      <AstryxIconButton
        ref={ref as any}
        icon={icon}
        label={label}
        variant={variant as any}
        size={size as any}
        isLoading={loading}
        tooltip={tooltip}
        isDisabled={props.disabled}
        className={className}
        onClick={props.onClick as any}
        {...(props as any)}
      />
    );
  }
);

MiratsIconButton.displayName = "MiratsIconButton";
