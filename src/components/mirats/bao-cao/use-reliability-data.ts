// ============================================================================
// Toàn bộ truy vấn + số liệu dẫn xuất của trang "Độ tin cậy hệ thống".
// Route chỉ tiêu thụ kết quả, không chứa logic lấy dữ liệu.
// ============================================================================
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { mapAnnotationsToBuckets, type Annotation } from "@/components/mirats/AnnotationManager";
import { computeTotals, isoDate, type Bucket, type ReliabilityRow } from "./reliability-core";

const dayStart = (d: string) => new Date(d + "T00:00:00").toISOString();
const dayEnd = (d: string) => new Date(d + "T23:59:59.999").toISOString();

const SU_CO_COLS = "ma_su_co, hien_tuong, ngay_phat_hien, trang_thai, muc_do, he_thong_id";

export type DrillTarget = { id: string; name: string } | null;
export type HeatTarget = { dow: number; hour: number } | null;
export type TrendTarget = { from: string; to: string; label: string } | null;

export function useReliabilityData(opts: {
  enabled: boolean;
  from: string;
  to: string;
  bucket: Bucket;
  drill: DrillTarget;
  heatDrill: HeatTarget;
  sevDrill: string | null;
  trendDrill: TrendTarget;
}) {
  const { enabled, from, to, bucket, drill, heatDrill, sevDrill, trendDrill } = opts;

  const q = useQuery({
    enabled,
    queryKey: ["reliability", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("rpc_reliability_by_system", {
        _from: dayStart(from),
        _to: dayEnd(to),
      });
      if (error) throw error;
      return (data ?? []) as ReliabilityRow[];
    },
    refetchOnWindowFocus: false,
  });

  const prevRange = useMemo(() => {
    const start = new Date(from + "T00:00:00");
    const end = new Date(to + "T00:00:00");
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400_000) + 1);
    const prevEnd = new Date(start.getTime() - 86400_000);
    const prevStart = new Date(prevEnd.getTime() - (days - 1) * 86400_000);
    return { from: isoDate(prevStart), to: isoDate(prevEnd) };
  }, [from, to]);

  const prevQ = useQuery({
    enabled,
    queryKey: ["reliability", prevRange.from, prevRange.to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("rpc_reliability_by_system", {
        _from: dayStart(prevRange.from),
        _to: dayEnd(prevRange.to),
      });
      if (error) throw error;
      return (data ?? []) as ReliabilityRow[];
    },
    refetchOnWindowFocus: false,
  });

  const trendQ = useQuery({
    enabled,
    queryKey: ["reliability-trend", from, to, bucket],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("rpc_reliability_trend", {
        _from: dayStart(from),
        _to: dayEnd(to),
        _bucket: bucket,
      });
      if (error) throw error;
      return (data ?? []) as Array<{
        bucket_start: string;
        so_su_co: number;
        so_dong: number;
        mttr_phut: number | null;
      }>;
    },
    refetchOnWindowFocus: false,
  });

  const trendData = useMemo(() => {
    return (trendQ.data ?? []).map((r) => {
      const d = new Date(r.bucket_start);
      const label =
        bucket === "month"
          ? `${d.getMonth() + 1}/${d.getFullYear()}`
          : bucket === "week"
            ? `T${Math.ceil(d.getDate() / 7)} ${d.getMonth() + 1}/${d.getFullYear()}`
            : `${d.getDate()}/${d.getMonth() + 1}`;
      return {
        label,
        bucket_start: r.bucket_start,
        so_su_co: r.so_su_co,
        so_dong: r.so_dong,
        mttr_gio: r.mttr_phut != null ? Number((r.mttr_phut / 60).toFixed(2)) : null,
      };
    });
  }, [trendQ.data, bucket]);

  // Ghi chú/mốc sự kiện — chỉ lấy trong khoảng đang xem, RLS lo phần quyền.
  const annotationsQ = useQuery({
    enabled,
    queryKey: ["reliability-annotations", from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bao_cao_annotation")
        .select("*")
        .gte("thoi_diem", dayStart(from))
        .lte("thoi_diem", dayEnd(to))
        .order("thoi_diem", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Annotation[];
    },
    refetchOnWindowFocus: false,
  });

  const annotationsMapped = useMemo(
    () => mapAnnotationsToBuckets(annotationsQ.data ?? [], trendData),
    [annotationsQ.data, trendData],
  );

  const heatmapQ = useQuery({
    enabled,
    queryKey: ["reliability-heatmap", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("rpc_incident_heatmap", {
        _from: dayStart(from),
        _to: dayEnd(to),
      });
      if (error) throw error;
      return (data ?? []) as Array<{ dow: number; hour: number; so_su_co: number }>;
    },
    refetchOnWindowFocus: false,
  });

  const heatmap = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    let max = 0;
    let total = 0;
    for (const r of heatmapQ.data ?? []) {
      if (r.dow >= 0 && r.dow < 7 && r.hour >= 0 && r.hour < 24) {
        grid[r.dow][r.hour] = r.so_su_co;
        if (r.so_su_co > max) max = r.so_su_co;
        total += r.so_su_co;
      }
    }
    return { grid, max, total };
  }, [heatmapQ.data]);

  const severityQ = useQuery({
    enabled,
    queryKey: ["reliability-severity", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("rpc_incident_by_severity", {
        _from: dayStart(from),
        _to: dayEnd(to),
      });
      if (error) throw error;
      return (data ?? []) as Array<{ muc_do: string; so_su_co: number; so_dong: number }>;
    },
    refetchOnWindowFocus: false,
  });

  const topMttr = useMemo(
    () =>
      [...(q.data ?? [])]
        .filter((r) => r.mttr_phut != null && r.so_dong > 0)
        .sort((a, b) => (b.mttr_phut ?? 0) - (a.mttr_phut ?? 0))
        .slice(0, 5),
    [q.data],
  );

  const paretoData = useMemo(() => {
    const rows = [...(q.data ?? [])]
      .filter((r) => (r.so_su_co ?? 0) > 0)
      .sort((a, b) => (b.so_su_co ?? 0) - (a.so_su_co ?? 0))
      .slice(0, 15);
    const total = rows.reduce((a, r) => a + (r.so_su_co ?? 0), 0);
    let cum = 0;
    return rows.map((r) => {
      cum += r.so_su_co ?? 0;
      const full = r.ten ?? r.ma ?? "—";
      return {
        he_thong_id: r.he_thong_id,
        name: full.length > 22 ? full.slice(0, 20) + "…" : full,
        fullName: full,
        so_su_co: r.so_su_co,
        cum_pct: total > 0 ? Number(((cum / total) * 100).toFixed(1)) : 0,
      };
    });
  }, [q.data]);

  const paretoVital = useMemo(() => {
    const idx = paretoData.findIndex((r) => r.cum_pct >= 80);
    return idx === -1 ? paretoData.length : idx + 1;
  }, [paretoData]);

  const totals = useMemo(() => computeTotals(q.data ?? []), [q.data]);
  const prevTotals = useMemo(() => computeTotals(prevQ.data ?? []), [prevQ.data]);

  // ---- Drill-down ----------------------------------------------------------
  const drillQ = useQuery({
    enabled: enabled && !!drill,
    queryKey: ["reliability-drill", drill?.id, from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("su_co")
        .select(SU_CO_COLS)
        .eq("he_thong_id", drill!.id)
        .gte("ngay_phat_hien", dayStart(from))
        .lte("ngay_phat_hien", dayEnd(to))
        .order("ngay_phat_hien", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const heatDrillQ = useQuery({
    enabled: enabled && !!heatDrill,
    queryKey: ["reliability-heat-drill", heatDrill?.dow, heatDrill?.hour, from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("su_co")
        .select(SU_CO_COLS)
        .gte("ngay_phat_hien", dayStart(from))
        .lte("ngay_phat_hien", dayEnd(to))
        .order("ngay_phat_hien", { ascending: false })
        .limit(1000);
      if (error) throw error;
      const d = heatDrill!;
      return (data ?? [])
        .filter((r) => {
          if (!r.ngay_phat_hien) return false;
          const dt = new Date(r.ngay_phat_hien);
          return dt.getDay() === d.dow && dt.getHours() === d.hour;
        })
        .slice(0, 200);
    },
  });

  const sevDrillQ = useQuery({
    enabled: enabled && !!sevDrill,
    queryKey: ["reliability-sev-drill", sevDrill, from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("su_co")
        .select(SU_CO_COLS)
        .eq("muc_do", sevDrill!)
        .gte("ngay_phat_hien", dayStart(from))
        .lte("ngay_phat_hien", dayEnd(to))
        .order("ngay_phat_hien", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const trendDrillQ = useQuery({
    enabled: enabled && !!trendDrill,
    queryKey: ["reliability-trend-drill", trendDrill?.from, trendDrill?.to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("su_co")
        .select(SU_CO_COLS)
        .gte("ngay_phat_hien", trendDrill!.from)
        .lt("ngay_phat_hien", trendDrill!.to)
        .order("ngay_phat_hien", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  return {
    q,
    prevQ,
    prevRange,
    trendQ,
    trendData,
    annotationsQ,
    annotationsMapped,
    heatmapQ,
    heatmap,
    severityQ,
    topMttr,
    paretoData,
    paretoVital,
    totals,
    prevTotals,
    drillQ,
    heatDrillQ,
    sevDrillQ,
    trendDrillQ,
  };
}
