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
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-heartbeat"],
    queryFn: () => getHeartBeatData(),
    staleTime: 30000,
  });

  useGlobalRealtime(true);

  return (
    <div className="w-full bg-card/50 border-y border-border py-2 px-4 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 min-w-max">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mr-2">
          Hệ thống
        </span>
        
        {isLoading ? (
          <div className="flex gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-7 h-7 rounded bg-muted animate-pulse" />
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
    critical: "bg-red-500 hover:bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]",
    warning: "bg-amber-500 hover:bg-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.4)]",
    normal: "bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_4px_rgba(16,185,129,0.2)]",
    inactive: "bg-slate-400 hover:bg-slate-500",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link 
          to="/he-thong/cay" 
          className={cn(
            "w-7 h-7 rounded transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-white cursor-pointer select-none",
            statusColors[group.status],
            isFlashing && "animate-in fade-in zoom-in duration-500 ring-2 ring-white/50",
            "motion-reduce:animate-none"
          )}
        >
          {group.ten.charAt(0)}
        </Link>
      </TooltipTrigger>
      <TooltipContent className="p-2 max-w-[180px]">
        <div className="space-y-1">
          <div className="flex justify-between items-center border-b border-border pb-1 mb-1">
            <span className="font-bold text-[12px] uppercase">{group.ten}</span>
            <span className="text-[10px] bg-muted px-1 rounded font-black">{group.systemCount}</span>
          </div>
          
          {group.reasons.length > 0 ? (
            <div className="space-y-1">
              {group.reasons.map((r, i) => (
                <div key={i} className="text-[11px] flex items-start gap-1">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1 shrink-0",
                    group.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                  )} />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
              OK
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
