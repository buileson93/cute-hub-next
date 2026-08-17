import { type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface EdgeTabsProps {
  tabs: {
    id: string;
    label: string;
    content: ReactNode;
    icon?: ReactNode;
  }[];
  defaultTab?: string;
  className?: string;
}

/**
 * Standardized Astryx Detail Tabs: Edge-to-edge on mobile, standardized spacing.
 */
export function EdgeTabs({
  tabs,
  defaultTab,
  className,
}: EdgeTabsProps) {
  return (
    <Tabs defaultValue={defaultTab || tabs[0]?.id} className={cn("w-full", className)}>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 border-b">
        <TabsList className="h-10 w-max bg-transparent p-0 sm:w-auto">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <div className="flex items-center gap-2">
                {t.icon}
                <span>{t.label}</span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {tabs.map((t) => (
        <TabsContent key={t.id} value={t.id} className="mt-4 outline-none">
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
