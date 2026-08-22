import * as React from "react";
import { BookOpen } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface HelpDrawerProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Khung hướng dẫn chi tiết — mặc định ĐÓNG, chỉ mở khi bấm nút "Hướng dẫn".
 * Dùng cho các nội dung dài (thay cho mở sẵn tại trang).
 */
export function HelpDrawer({ title, children, defaultOpen = false, className }: HelpDrawerProps) {
  const [open, setOpen] = React.useState<boolean>(defaultOpen);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Hướng dẫn"
          data-testid="help-drawer-trigger"
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            className,
          )}
        >
          <BookOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Hướng dẫn</span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        data-testid="help-drawer-content"
        className="w-full sm:max-w-md overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 text-sm leading-relaxed">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
