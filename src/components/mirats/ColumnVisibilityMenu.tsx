import { memo } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { ColumnDef } from "./StandardTable";

interface ColumnVisibilityProps {
  columns: ColumnDef<any>[];
  hidden: Set<string>;
  toggle: (key: string) => void;
  reset: () => void;
}

export const ColumnVisibilityMenu = memo(function ColumnVisibilityMenu({
  columns,
  hidden,
  toggle,
  reset,
}: ColumnVisibilityProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-meta font-medium uppercase tracking-tight">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Cột hiển thị</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel className="text-mini uppercase tracking-widest text-muted-foreground">Cấu hình cột</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map(c => (
          <DropdownMenuCheckboxItem
            key={c.key}
            checked={!hidden.has(c.key)}
            onCheckedChange={() => toggle(c.key)}
            className="text-xs"
          >
            {c.header || c.label || c.key}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={reset} className="text-xs text-primary font-medium">
          Thiết lập mặc định
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
