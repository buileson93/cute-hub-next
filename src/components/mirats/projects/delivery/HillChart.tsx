import React, { useRef, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface HillMarker {
  id: string;
  name: string;
  position: number; // 0-100
  status: "climbing" | "executing";
}

export function HillChart({ project_id }: { project_id: string }) {
  const qc = useQueryClient();
  const containerRef = useRef<SVGSVGElement>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  const { data: markers = [], isLoading } = useQuery({
    queryKey: ["hill-chart", project_id],
    queryFn: async () => {
      const { data: pitches } = await supabase
        .from("pitches")
        .select("id")
        .eq("project_id", project_id);
      const pitchesArr = (pitches || []) as any[];
      if (!pitchesArr.length) return [];

      const pitchIds = pitchesArr.map((p) => p.id);
      const { data, error } = await supabase
        .from("pitch_scopes")
        .select("*")
        .in("pitch_id", pitchIds);

      if (error) throw error;
      return (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        position: s.hill_position || 0,
        status: s.hill_status as "climbing" | "executing",
      })) as HillMarker[];
    },
  });

  const updatePosition = useMutation({
    mutationFn: async ({ id, position }: { id: string; position: number }) => {
      const status = position < 50 ? "climbing" : "executing";
      const { error } = await supabase
        .from("pitch_scopes")
        .update({ hill_position: position, hill_status: status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hill-chart", project_id] });
    },
  });

  // Simple parabolic hill: y = 4 * x * (1 - x)
  const getPoint = (x: number) => {
    const normalizedX = x / 100;
    const y = 4 * normalizedX * (1 - normalizedX);
    return {
      x: x,
      y: 100 - y * 80, // Map 0-1 to 20-100 on Y axis (inverted)
    };
  };

  const hillPath = Array.from({ length: 101 }, (_, i) => {
    const p = getPoint(i);
    return `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`;
  }).join(" ");

  if (isLoading) return <div className="p-4 text-xs text-slate-500">Đang tải Hill Chart...</div>;

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 overflow-hidden shadow-none">
        <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold">Tiến độ Uncertainty (Hill Chart)</CardTitle>
          <CardDescription className="text-xs">
            Trái: Climbing (Figuring out) | Phải: Executing (Rolling down)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative aspect-[3/1] w-full bg-white p-6">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
              ref={containerRef}
            >
              {/* The Hill */}
              <path
                d={hillPath}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <path
                d={hillPath}
                fill="none"
                stroke="#1C51E0"
                strokeWidth="2"
                className="opacity-20"
              />

              {/* Center line */}
              <line x1="50" y1="20" x2="50" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <text
                x="50"
                y="15"
                textAnchor="middle"
                className="text-[4px] fill-slate-400 font-medium"
              >
                SHAPED
              </text>

              {/* Markers */}
              {markers.map((m) => {
                const p = getPoint(m.position);
                const isSelected = selectedMarker === m.id;
                return (
                  <g
                    key={m.id}
                    className="cursor-pointer group"
                    onClick={() => setSelectedMarker(m.id)}
                  >
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isSelected ? 2.5 : 2}
                      fill={isSelected ? "#1C51E0" : "#fff"}
                      stroke="#1C51E0"
                      strokeWidth="0.5"
                      className="transition-all"
                    />
                    <text
                      x={p.x}
                      y={p.y - 4}
                      textAnchor="middle"
                      className={cn(
                        "text-[3px] font-medium transition-all",
                        isSelected
                          ? "fill-indigo-700 font-bold"
                          : "fill-slate-600 opacity-60 group-hover:opacity-100",
                      )}
                    >
                      {m.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* List Fallback / Accessible View */}
      <div className="grid gap-2">
        {markers.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex items-center justify-between p-2 rounded-lg border text-sm transition",
              selectedMarker === m.id
                ? "border-indigo-200 bg-indigo-50/50"
                : "border-slate-100 hover:border-slate-200",
            )}
            onClick={() => setSelectedMarker(m.id)}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  m.position < 50 ? "bg-amber-400" : "bg-emerald-400",
                )}
              />
              <span className="font-medium text-slate-700">{m.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-[10px] font-mono">
                {m.position}%
              </Badge>
              <span className="text-[11px] text-slate-500 uppercase tracking-tight">
                {m.position < 50 ? "Climbing" : "Executing"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
