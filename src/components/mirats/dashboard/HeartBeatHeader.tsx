import { useQuery } from "@tanstack/react-query";
import { getHeartBeatData, HeartBeatGroup } from "@/lib/mirats/dashboard-realtime.functions";
import { cn } from "@/lib/utils";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "@tanstack/react-router";
import { useGlobalRealtime } from "@/lib/realtime/useGlobalRealtime";
import { useEffect, useState } from "react";

export function HeartBeatHeader() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-heartbeat"],
    queryFn: () => getHeartBeatData(),
    staleTime: 30000,
  });

  useGlobalRealtime(true);

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-1.5 px-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 overflow-x-auto no-scrollbar max-w-[120px] md:max-w-none">
      <TooltipProvider delayDuration={100}>
        {data.map((group) => (
          <HeartBeatDot key={group.id} group={group} />
        ))}
      </TooltipProvider>
    </div>
  );
}

function HeartBeatDot({ group }: { group: HeartBeatGroup }) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [prevStatus, setPrevStatus] = useState(group.status);

  useEffect(() => {
    if (group.status !== prevStatus) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 800);
      setPrevStatus(group.status);
      return () => clearTimeout(timer);
    }
  }, [group.status, prevStatus]);

  const statusColors = {
    critical: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]",
    warning: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    normal: "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.3)]",
    inactive: "bg-slate-300",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link 
          to="/he-thong/cay" 
          className={cn(
            "w-2 h-2 rounded-full transition-all duration-500 cursor-pointer hover:scale-150",
            statusColors[group.status],
            isFlashing && "animate-pulse ring-4 ring-white/50 scale-125"
          )}
        />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="p-3 w-[220px]">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center border-b border-border pb-1 mb-1">
            <span className="font-bold text-xs uppercase tracking-tight">{group.ten}</span>
            <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded-full font-mono">{group.systemCount} HT</span>
          </div>
          
          {group.reasons.length > 0 ? (
            <div className="space-y-1">
              {group.reasons.map((r, i) => (
                <div key={i} className="text-[10px] flex items-start gap-1.5 leading-tight">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1 shrink-0",
                    group.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                  )} />
                  <span className="text-muted-foreground">{r}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
              Hoạt động ổn định
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
