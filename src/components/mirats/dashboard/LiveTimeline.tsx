import { useQuery } from "@tanstack/react-query";
import { getAuditTimeline, AuditTimelineItem } from "@/lib/mirats/dashboard-realtime.functions";
import { useGlobalRealtime } from "@/lib/realtime/useGlobalRealtime";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { History, User, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function LiveTimeline() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-audit-timeline"],
    queryFn: () => getAuditTimeline(),
    staleTime: 15000,
  });

  // Re-fetch when realtime events happen
  useGlobalRealtime(true);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <History className="w-8 h-8 mb-2 opacity-20" />
        <p className="text-sm">Chưa có hoạt động nào được ghi lại</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[350px] pr-4">
      <div className="space-y-6 relative before:absolute before:inset-0 before:left-[15px] before:w-[1px] before:bg-border before:pointer-events-none">
        {data.map((item, idx) => (
          <TimelineItem key={item.id} item={item} isFirst={idx === 0} />
        ))}
      </div>
    </ScrollArea>
  );
}

function TimelineItem({ item, isFirst }: { item: AuditTimelineItem; isFirst: boolean }) {
  const timeStr = formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: vi });
  
  // Choose icon based on action
  const getIcon = () => {
    switch (item.action) {
      case 'INSERT': return <div className="w-2 h-2 rounded-full bg-emerald-500" />;
      case 'UPDATE': return <div className="w-2 h-2 rounded-full bg-blue-500" />;
      case 'DELETE': return <div className="w-2 h-2 rounded-full bg-red-500" />;
      default: return <div className="w-2 h-2 rounded-full bg-slate-400" />;
    }
  };

  return (
    <div className={cn(
      "relative pl-8 group transition-all duration-300",
      isFirst && "animate-in slide-in-from-top-4 fade-in duration-500"
    )}>
      {/* Connector line dot */}
      <div className="absolute left-[11px] top-1.5 w-2 h-2 flex items-center justify-center bg-background ring-4 ring-background z-10">
        {getIcon()}
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-[13px] leading-snug text-foreground/90 group-hover:text-primary transition-colors">
          {item.description}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-bold text-[11px] uppercase bg-muted/50 px-1 rounded flex items-center gap-1">
            <User className="w-3 h-3" />
            {item.user_ho_ten || "Hệ thống"}
          </span>
          <span>•</span>
          <span>{timeStr}</span>
        </div>
      </div>
    </div>
  );
}
