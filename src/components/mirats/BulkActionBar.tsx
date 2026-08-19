import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { X, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  actions: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: "default" | "outline" | "destructive";
  }[];
}

/**
 * Hạng G2 — THU GỌN
 * Thanh hành động hàng loạt tối ưu cho cả Desktop và Mobile
 */
export function BulkActionBar({ selectedCount, onClear, actions }: BulkActionBarProps) {
  const isMobile = useIsMobile();

  if (selectedCount === 0) return null;

  if (isMobile) {
    // Phiên bản Mobile: Thanh nổi dưới đáy, tối ưu diện tích
    const primaryActions = actions.slice(0, 2);
    const extraActions = actions.slice(2);

    return (
      <div className="fixed inset-x-4 bottom-20 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-2xl flex items-center justify-between gap-3 border border-white/10">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20 rounded-full" 
              onClick={onClear}
              aria-label="Bỏ chọn tất cả"
            >
              <X className="h-4 w-4" />
            </Button>
            <span className="text-sm font-bold whitespace-nowrap">Đã chọn {selectedCount}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {primaryActions.map((action, idx) => (
              <Button
                key={idx}
                variant="ghost"
                size="sm"
                className="h-8 text-xs font-semibold hover:bg-primary-foreground/20 px-3 rounded-full"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
            
            {extraActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20 rounded-full"
                    aria-label="Thao tác hàng loạt khác"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {extraActions.map((action, idx) => (
                    <DropdownMenuItem key={idx} onClick={action.onClick} className="gap-2">
                      {action.icon}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Phiên bản Desktop: Thanh ngang chuẩn StandardTable (tích hợp sẵn bên trong StandardTable thường là tốt nhất, 
  // nhưng đây là bản standalone nếu cần dùng ngoài)
  return (
    <div className="flex items-center gap-3 bg-muted/40 px-3 py-1.5 rounded-md border animate-in fade-in duration-200">
      <div className="flex items-center gap-2 border-r pr-3">
        <Checkbox checked={true} onCheckedChange={onClear} />
        <span className="text-sm font-medium">Đã chọn {selectedCount}</span>
      </div>
      <div className="flex items-center gap-2">
        {actions.map((action, idx) => (
          <Button
            key={idx}
            variant={action.variant || "outline"}
            size="sm"
            className={cn(
              "h-8 text-xs shadow-none",
              (action.variant === "outline" || !action.variant) && "border-primary/20 hover:bg-primary/5"
            )}
            onClick={action.onClick}
          >
            {action.icon && <span className="mr-1.5">{action.icon}</span>}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
