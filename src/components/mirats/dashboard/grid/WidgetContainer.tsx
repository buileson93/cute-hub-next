import React from "react";
import { DashboardWidgetConfig } from "@/lib/mirats/dashboard/widget-registry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/mirats/ui/Icon";
import { cn } from "@/lib/utils";

interface WidgetContainerProps {
  config: DashboardWidgetConfig;
  isEditing?: boolean;
  onRemove?: () => void;
  children: React.ReactNode;
}

export function WidgetContainer({ 
  config, 
  isEditing, 
  onRemove, 
  children 
}: WidgetContainerProps) {
  // Map column width (1-12) to Tailwind grid-cols
  const colSpanMap: Record<number, string> = {
    1: "col-span-1",
    2: "col-span-2",
    3: "col-span-3",
    4: "col-span-4",
    5: "col-span-5",
    6: "col-span-6",
    7: "col-span-7",
    8: "col-span-8",
    9: "col-span-9",
    10: "col-span-10",
    11: "col-span-11",
    12: "col-span-12",
  };

  return (
    <div className={cn(
      "group relative transition-all duration-300",
      colSpanMap[config.w] || "col-span-full",
      isEditing && "ring-2 ring-primary/20 ring-offset-2 rounded-2xl"
    )}>
      {isEditing && (
        <div className="absolute -top-2 -right-2 z-20 flex gap-1">
          <Button
            variant="destructive"
            size="icon"
            className="h-6 w-6 rounded-full shadow-lg"
            onClick={onRemove}
          >
            <Icon name="action.remove" size="tiny" />
          </Button>
        </div>
      )}
      <div className={cn("h-full", isEditing && "opacity-80 scale-[0.99] transition-transform")}>
        {children}
      </div>
    </div>
  );
}
