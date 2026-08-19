import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Incident {
  id: string;
  title: string;
  severity: string;
  sla_status: string;
  owner: string;
  interruption_load: number;
}

interface OperationsLaneProps {
  wipLimit: number;
  incidents: Incident[];
}

export function OperationsLane({ incidents }: OperationsLaneProps) {
  if (!incidents || incidents.length === 0) {
    return (
      <Card className="border-slate-200 shadow-none">
        <CardContent className="p-8 text-center">
          <div className="text-slate-400 text-sm">Không có sự cố nào cần xử lý.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {incidents.map((incident) => (
        <Card key={incident.id} className="border-slate-200 shadow-none hover:border-slate-300 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant={incident.severity === 'P0' ? 'destructive' : 'secondary'} className="text-[10px]">
                {incident.severity}
              </Badge>
              <span className={cn(
                "text-[10px] font-bold uppercase",
                incident.sla_status === 'breach' ? "text-rose-600" : "text-amber-600"
              )}>
                {incident.sla_status}
              </span>
            </div>
            <CardTitle className="text-sm font-semibold line-clamp-2 mt-2">{incident.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Owner: {incident.owner}</span>
              <span>Load: {incident.interruption_load}%</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
