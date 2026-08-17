import * as React from "react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export interface CheckboxInputProps extends React.ComponentPropsWithoutRef<typeof Checkbox> {
  label: string
  description?: string
  error?: string
}

const CheckboxInput = React.forwardRef<
  React.ElementRef<typeof Checkbox>,
  CheckboxInputProps
>(({ className, label, description, error, id, ...props }, ref) => {
  const generatedId = React.useId()
  const checkboxId = id || generatedId

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-start gap-3">
        <Checkbox
          ref={ref}
          id={checkboxId}
          className="mt-0.5"
          {...props}
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor={checkboxId}
            className={cn(
              "text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              error && "text-destructive"
            )}
          >
            {label}
          </Label>
          {description && (
            <p className="text-[11px] text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {error && (
        <p className="text-[11px] font-medium text-destructive ml-8">
          {error}
        </p>
      )}
    </div>
  )
})

CheckboxInput.displayName = "CheckboxInput"

export { CheckboxInput }
