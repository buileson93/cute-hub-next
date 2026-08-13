import { useMemo, useEffect, useState } from "react";
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

export function HeartBeatStrip() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboard-heartbeat"],
    queryFn: () => getHeartBeatData(),
    staleTime: 30000,
  });

  // Re-fetch when realtime events happen
  useGlobalRealtime(true);

  return (
    <div className="w-full bg-card/50 border-y border-border py-3 px-4 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 min-w-max">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-2">
          Nhịp tim hệ thống
        </span>
        
        {isLoading ? (
          <div className="flex gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-8 h-8 rounded bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex gap-2">
            <TooltipProvider>
              {data?.map((group) => (
                <HeartBeatCell key={group.id} group={group} />
              ))}
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  );
}

function HeartBeatCell({ group }: { group: HeartBeatGroup }) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [prevStatus, setPrevStatus] = useState(group.status);

  useEffect(() => {
    if (group.status !== prevStatus) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 500);
      setPrevStatus(group.status);
      return () => clearTimeout(timer);
    }
  }, [group.status, prevStatus]);

  const statusColors = {
    critical: "bg-red-600/90 hover:bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.2)]",
    warning: "bg-amber-500/90 hover:bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]",
    normal: "bg-primary/90 hover:bg-primary shadow-[0_0_4px_rgba(28,81,224,0.15)]",
    inactive: "bg-slate-300 hover:bg-slate-400 text-slate-700",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link 
          to="/he-thong/cay" 
          className={cn(
            "w-8 h-8 rounded transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-white cursor-pointer select-none",
            statusColors[group.status],
            isFlashing && "animate-in fade-in zoom-in duration-500 ring-4 ring-white/50",
            "motion-reduce:animate-none"
          )}
        >
          {group.ten.charAt(0)}
        </Link>
      </TooltipTrigger>
      <TooltipContent className="p-3 max-w-[200px]">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center border-b border-border pb-1 mb-1">
            <span className="font-bold text-xs">{group.ten}</span>
            <span className="text-[10px] bg-muted px-1 rounded">{group.systemCount} HT</span>
          </div>
          
          {group.reasons.length > 0 ? (
            <div className="space-y-1">
              {group.reasons.map((r, i) => (
                <div key={i} className="text-[10px] flex items-start gap-1">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1 shrink-0",
                    group.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                  )} />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Hoạt động ổn định
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
