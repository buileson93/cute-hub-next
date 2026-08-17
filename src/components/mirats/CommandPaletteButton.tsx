import { Command as CommandIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Nút gọi Command Palette — đặt trong thanh trên cùng cạnh chuông thông báo.
 * Bấm để bật/tắt bảng lệnh (tương đương phím tắt Alt+Space hoặc Ctrl/⌘+K).
 */
export function CommandPaletteButton({ className }: { className?: string }) {
  const { session, profile } = useSession();
  if (!session || (profile && !profile.active)) return null;

  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform);
  const hint = isMac ? "⌘K" : "Ctrl+K";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("mirats:toggle-command-palette"))
          }
          aria-label="Mở bảng lệnh"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[#0074e2]/10 hover:text-[#0074e2]",
            className,
          )}
        >
          <CommandIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        Bảng lệnh · <span className="opacity-70">{hint}</span>
      </TooltipContent>
    </Tooltip>
  );
}
