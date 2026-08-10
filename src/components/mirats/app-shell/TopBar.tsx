import { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TopBar({ renderMobileMenu }: { renderMobileMenu?: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-3">
        {renderMobileMenu}
        <div className="relative w-full max-w-sm" data-tour="search">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Tìm tài sản, sự cố, hồ sơ..."
          className="h-9 w-full rounded-full bg-muted/50 pl-9 pr-4 text-sm focus-visible:ring-1"
        />
        <div className="absolute right-3 top-2 hidden items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </div>
      </div>
    </div>
  );
}
