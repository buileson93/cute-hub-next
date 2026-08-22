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
export function EdgeTabs({ tabs, defaultTab, className }: EdgeTabsProps) {
  return (
    <Tabs defaultValue={defaultTab || tabs[0]?.id} className={cn("w-full", className)}>
      <TabsList variant="underline" className="w-full justify-start border-b">
        {tabs.map((t) => (
          <TabsTrigger key={t.id} value={t.id}>
            <div className="flex items-center gap-2">
              {t.icon}
              <span>{t.label}</span>
            </div>
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((t) => (
        <TabsContent key={t.id} value={t.id} className="mt-4 outline-none">
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
