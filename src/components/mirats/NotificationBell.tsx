import { Bell, Check, CheckCheck } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/lib/realtime/useNotifications";
import { useSession } from "@/hooks/use-session";
import { formatDT } from "@/lib/time";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/mirats/EmptyState";

export function NotificationBell() {
  const { user } = useSession();
  const { items, unread, markRead, markAllRead } = useNotifications(user?.id ?? null);
  const reduce = useReducedMotion();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          type="button"
          whileHover={reduce ? undefined : { scale: 1.06 }}
          whileTap={reduce ? undefined : { scale: 0.92 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : "Thông báo"}
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
          <span aria-live="polite" aria-atomic="true" className="sr-only">
            {unread > 0 ? `${unread} thông báo chưa đọc` : ""}
          </span>
        </motion.button>

      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="text-sm font-semibold">Thông báo</div>
          {unread > 0 && (
            <AppTooltip noiDung="Đánh dấu đã đọc tất cả thông báo">
              <Button size="sm" variant="ghost" onClick={markAllRead} className="h-7 w-7 p-0">
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="sr-only">Đánh dấu đã đọc</span>
              </Button>
            </AppTooltip>
          )}
        </div>
        <ScrollArea className="max-h-[420px]">
          {items.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Bell}
                title="Chưa có thông báo"
                description="Sự kiện quan trọng (sự cố mới, PM đến hạn, giấy phép sắp hết hạn) sẽ hiện ở đây."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "group flex gap-3 px-4 py-3 transition-colors hover:bg-secondary/60",
                    !n.read_at && "bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.read_at ? "bg-muted-foreground/30" : "bg-primary",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    {n.link ? (
                      <Link
                        to={n.link as never}
                        onClick={() => !n.read_at && markRead(n.id)}
                        className="block text-sm font-medium text-foreground hover:text-primary"
                      >
                        {n.tieu_de}
                      </Link>
                    ) : (
                      <div className="text-sm font-medium">{n.tieu_de}</div>
                    )}
                    {n.noi_dung && (
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">{n.noi_dung}</div>
                    )}
                    <div className="mt-1 text-[10.5px] text-muted-foreground/70">
                      {formatDT(n.created_at)}
                    </div>
                  </div>
                  {!n.read_at && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => markRead(n.id)}
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Đánh dấu đã đọc"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
