import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, User, ShieldAlert, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Incident {
  id: string;
  title: string;
  severity: 'P0' | 'P1' | 'P2';
  sla_status: 'ok' | 'warning' | 'breach';
  owner: string;
  interruption_load: number; // 0-100%
}

export function OperationsLane({ incidents, wipLimit }: { incidents: Incident[]; wipLimit: number }) {
  const isOverWip = incidents.length > wipLimit;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className={cn(
            "h-6 px-2 text-[10px] font-bold",
            isOverWip ? "bg-rose-600 animate-pulse" : "bg-slate-900"
          )}>
            OPS LANE
          </Badge>
          <div className="text-xs font-medium text-slate-500">
            WIP: <span className={cn(isOverWip ? "text-rose-600 font-bold" : "text-slate-900")}>{incidents.length}</span> / {wipLimit}
          </div>
        </div>
        {isOverWip && (
          <div className="flex items-center gap-1.5 text-rose-600 text-[10px] font-bold uppercase tracking-wider">
            <ShieldAlert className="h-3 w-3" /> WIP LIMIT EXCEEDED
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {incidents.map(incident => (
          <Card key={incident.id} className="border-slate-200 shadow-sm hover:border-rose-200 transition-colors group">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="destructive" className="text-[9px] h-4 px-1 leading-none font-bold">
                      {incident.severity}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-mono">#{incident.id.slice(0, 5)}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                    {incident.title}
                  </h4>
                </div>
                <div className={cn(
                  "w-2 h-2 rounded-full mt-1 shrink-0",
                  incident.sla_status === 'ok' ? "bg-emerald-500" : 
                  incident.sla_status === 'warning' ? "bg-amber-500" : "bg-rose-500"
                )} />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  {incident.owner}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  2h 15m
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  <span>Interruption Load</span>
                  <span className="text-rose-600">{incident.interruption_load}%</span>
                </div>
                <Progress value={incident.interruption_load} className="h-1 bg-slate-100" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {incidents.length === 0 && (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <CheckCircle2 className="h-8 w-8 text-emerald-500/20 mx-auto mb-2" />
          <div className="text-xs font-bold text-slate-400">All systems operational</div>
        </div>
      )}
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
