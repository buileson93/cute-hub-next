import { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePersistentCollapse } from "@/hooks/use-persistent-collapse";
import { cn } from "@/lib/utils";

// GĐ1-03 — Card + Collapsible, ghi nhớ trạng thái trong localStorage per form/section.
interface Props {
  formId: string;
  sectionId: string;
  title: ReactNode;
  defaultOpen?: boolean;
  forceOpen?: boolean; // ép mở khi validation lỗi
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function CollapsibleSection({
  formId,
  sectionId,
  title,
  defaultOpen = false,
  forceOpen,
  action,
  children,
  className,
}: Props) {
  const [open, setOpen] = usePersistentCollapse(formId, sectionId, defaultOpen);
  const isOpen = forceOpen || open;

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setOpen}>
        <CardHeader className="py-2">
          <div className="flex items-center justify-between gap-2">
            <CollapsibleTrigger
              className="group flex flex-1 items-center gap-2 text-left"
              aria-expanded={isOpen}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isOpen && "rotate-180",
                )}
                aria-hidden
              />
              <CardTitle className="text-sm font-semibold text-primary">{title}</CardTitle>
            </CollapsibleTrigger>
            {action}
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-3">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
