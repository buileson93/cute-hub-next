import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsContext = React.createContext<{ variant?: "segmented" | "underline" }>({
  variant: "segmented",
});

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: "segmented" | "underline";
}

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, variant = "segmented", ...props }, ref) => (
    <TabsContext.Provider value={{ variant }}>
      <TabsPrimitive.List
        ref={ref}
        className={cn(
          "inline-flex items-center justify-start overflow-x-auto no-scrollbar transition-all",
          variant === "segmented" && "h-9 rounded-lg bg-muted p-1 text-muted-foreground",
          variant === "underline" && "h-10 border-b bg-transparent p-0 gap-2",
          className,
        )}
        {...props}
      />
    </TabsContext.Provider>
  ),
);
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const { variant } = React.useContext(TabsContext);

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "segmented" &&
          "rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow",
        variant === "underline" &&
          "h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
