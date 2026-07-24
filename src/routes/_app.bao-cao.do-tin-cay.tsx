import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Clock, TrendingUp, Download, ExternalLink, FileText, Bookmark, Link2, Trash2, Save, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/mirats/EmptyState";
import { PageHeader } from "@/components/mirats/PageHeader";
import { AnnotationManager, mapAnnotationsToBuckets, LOAI_META, type Annotation } from "@/components/mirats/AnnotationManager";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";


import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from "recharts";



type SearchState = { from?: string; to?: string; bucket?: "day" | "week" | "month" };

export const Route = createFileRoute("/_app/bao-cao/do-tin-cay")({
  validateSearch: (raw: Record<string, unknown>): SearchState => {
    const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
    const bk = raw.bucket;
    return {
      from: isDate(raw.from) ? raw.from : undefined,
      to: isDate(raw.to) ? raw.to : undefined,
      bucket: bk === "day" || bk === "week" || bk === "month" ? bk : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Độ tin cậy hệ thống — MIRATS 2.0" },
      { name: "description", content: "MTBF / MTTR theo hệ thống trong khoảng thời gian tuỳ chọn. Xuất CSV để tổng hợp báo cáo." },
      { property: "og:title", content: "Độ tin cậy hệ thống — MIRATS 2.0" },
      { property: "og:description", content: "MTBF / MTTR theo hệ thống trong khoảng thời gian tuỳ chọn." },
    ],
  }),
  component: DoTinCayPage,
});


type Row = {
  he_thong_id: string;
  ma: string | null;
  ten: string | null;
  so_su_co: number;
  so_dong: number;
  mttr_phut: number | null;
  mtbf_gio: number | null;
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

type SavedFilter = { id: string; name: string; from: string; to: string; bucket: "day" | "week" | "month" };
const SAVED_KEY = "mirats:reliability-filters";

function DoTinCayPage() {
  const { session } = useSession();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const today = new Date();
  const ago = new Date(today.getTime() - 90 * 86400_000);
  const from = search.from ?? isoDate(ago);
  const to = search.to ?? isoDate(today);
  const bucket: "day" | "week" | "month" = search.bucket ?? "day";
  const setFrom = (v: string) => navigate({ search: (p: SearchState) => ({ ...p, from: v }), replace: true });
  const setTo = (v: string) => navigate({ search: (p: SearchState) => ({ ...p, to: v }), replace: true });
  const setBucket = (v: "day" | "week" | "month") =>
    navigate({ search: (p: SearchState) => ({ ...p, bucket: v }), replace: true });


  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) setSavedFilters(JSON.parse(raw));
    } catch {}
  }, []);
  const persistSaved = (list: SavedFilter[]) => {
    setSavedFilters(list);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch {}
  };
  const saveCurrentFilter = () => {
    const name = window.prompt("Tên bộ lọc:", `${from} → ${to} (${bucket})`)?.trim();
    if (!name) return;
    const item: SavedFilter = { id: crypto.randomUUID(), name, from, to, bucket };
    persistSaved([item, ...savedFilters].slice(0, 20));
    toast.success("Đã lưu bộ lọc");
  };
  const applySaved = (f: SavedFilter) => {
    navigate({ search: () => ({ from: f.from, to: f.to, bucket: f.bucket }), replace: true });
    toast.success(`Áp dụng: ${f.name}`);
  };
  const removeSaved = (id: string) => persistSaved(savedFilters.filter((f) => f.id !== id));

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    url.search = new URLSearchParams({ from, to, bucket }).toString();
    try {
      await navigator.clipboard.writeText(url.toString());
      toast.success("Đã sao chép link chia sẻ");
    } catch {
      toast.error("Không sao chép được — sao chép thủ công từ thanh địa chỉ");
    }
  };

  const [drill, setDrill] = useState<{ id: string; name: string } | null>(null);
  const [heatDrill, setHeatDrill] = useState<{ dow: number; hour: number } | null>(null);

  const heatDrillQ = useQuery({
    enabled: !!session && !!heatDrill,
    queryKey: ["reliability-heat-drill", heatDrill?.dow, heatDrill?.hour, from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("su_co")
        .select("ma_su_co, hien_tuong, ngay_phat_hien, trang_thai, muc_do, he_thong_id")
        .gte("ngay_phat_hien", new Date(from + "T00:00:00").toISOString())
        .lte("ngay_phat_hien", new Date(to + "T23:59:59.999").toISOString())
        .order("ngay_phat_hien", { ascending: false })
        .limit(1000);
      if (error) throw error;
      const d = heatDrill!;
      return (data ?? []).filter((r) => {
        if (!r.ngay_phat_hien) return false;
        const dt = new Date(r.ngay_phat_hien);
        return dt.getDay() === d.dow && dt.getHours() === d.hour;
      }).slice(0, 200);
    },
  });
  const [sevDrill, setSevDrill] = useState<string | null>(null);

  const sevDrillQ = useQuery({
    enabled: !!session && !!sevDrill,
    queryKey: ["reliability-sev-drill", sevDrill, from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("su_co")
        .select("ma_su_co, hien_tuong, ngay_phat_hien, trang_thai, muc_do, he_thong_id")
        .eq("muc_do", sevDrill!)
        .gte("ngay_phat_hien", new Date(from + "T00:00:00").toISOString())
        .lte("ngay_phat_hien", new Date(to + "T23:59:59.999").toISOString())
        .order("ngay_phat_hien", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const [trendDrill, setTrendDrill] = useState<{ from: string; to: string; label: string } | null>(null);

  const trendDrillQ = useQuery({
    enabled: !!session && !!trendDrill,
    queryKey: ["reliability-trend-drill", trendDrill?.from, trendDrill?.to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("su_co")
        .select("ma_su_co, hien_tuong, ngay_phat_hien, trang_thai, muc_do, he_thong_id")
        .gte("ngay_phat_hien", trendDrill!.from)
        .lt("ngay_phat_hien", trendDrill!.to)
        .order("ngay_phat_hien", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const drillQ = useQuery({
    enabled: !!session && !!drill,
    queryKey: ["reliability-drill", drill?.id, from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("su_co")
        .select("ma_su_co, hien_tuong, ngay_phat_hien, trang_thai, muc_do, thiet_bi")
        .eq("he_thong_id", drill!.id)
        .gte("ngay_phat_hien", new Date(from + "T00:00:00").toISOString())
        .lte("ngay_phat_hien", new Date(to + "T23:59:59.999").toISOString())
        .order("ngay_phat_hien", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const q = useQuery({
    enabled: !!session,
    queryKey: ["reliability", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("rpc_reliability_by_system", {
        _from: new Date(from + "T00:00:00").toISOString(),
        _to: new Date(to + "T23:59:59.999").toISOString(),
      });
      if (error) throw error;
      return (data ?? []) as Row[];
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
    enabled: !!session,
    queryKey: ["reliability", prevRange.from, prevRange.to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("rpc_reliability_by_system", {
        _from: new Date(prevRange.from + "T00:00:00").toISOString(),
        _to: new Date(prevRange.to + "T23:59:59.999").toISOString(),
      });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    refetchOnWindowFocus: false,
  });


  const trendQ = useQuery({
    enabled: !!session,
    queryKey: ["reliability-trend", from, to, bucket],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("rpc_reliability_trend", {
        _from: new Date(from + "T00:00:00").toISOString(),
        _to: new Date(to + "T23:59:59.999").toISOString(),
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

  // GĐ6-14: ghi chú/mốc sự kiện. Query theo khoảng [from, to] để không kéo
  // toàn bộ lịch sử; refetch khi khoảng thay đổi. RLS đã lo phần quyền.
  const annotationsQ = useQuery({
    enabled: !!session,
    queryKey: ["reliability-annotations", from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bao_cao_annotation")
        .select("*")
        .gte("thoi_diem", new Date(from + "T00:00:00").toISOString())
        .lte("thoi_diem", new Date(to + "T23:59:59.999").toISOString())
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
    enabled: !!session,
    queryKey: ["reliability-heatmap", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("rpc_incident_heatmap", {
        _from: new Date(from + "T00:00:00").toISOString(),
        _to: new Date(to + "T23:59:59.999").toISOString(),
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
    enabled: !!session,
    queryKey: ["reliability-severity", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("rpc_incident_by_severity", {
        _from: new Date(from + "T00:00:00").toISOString(),
        _to: new Date(to + "T23:59:59.999").toISOString(),
      });
      if (error) throw error;
      return (data ?? []) as Array<{ muc_do: string; so_su_co: number; so_dong: number }>;
    },
    refetchOnWindowFocus: false,
  });

  const SEVERITY_COLORS = [
    "hsl(var(--destructive))",
    "hsl(var(--primary))",
    "hsl(var(--chart-3, 32 95% 55%))",
    "hsl(var(--muted-foreground))",
    "hsl(var(--chart-5, 262 60% 60%))",
  ];

  const topMttr = useMemo(() => {
    return [...(q.data ?? [])]
      .filter((r) => r.mttr_phut != null && r.so_dong > 0)
      .sort((a, b) => (b.mttr_phut ?? 0) - (a.mttr_phut ?? 0))
      .slice(0, 5);
  }, [q.data]);

  const paretoData = useMemo(() => {
    const rows = [...(q.data ?? [])]
      .filter((r) => (r.so_su_co ?? 0) > 0)
      .sort((a, b) => (b.so_su_co ?? 0) - (a.so_su_co ?? 0))
      .slice(0, 15);
    const total = rows.reduce((a, r) => a + (r.so_su_co ?? 0), 0);
    let cum = 0;
    return rows.map((r) => {
      cum += r.so_su_co ?? 0;
      const shortName = (r.ten ?? r.ma ?? "—").length > 22
        ? (r.ten ?? r.ma ?? "—").slice(0, 20) + "…"
        : (r.ten ?? r.ma ?? "—");
      return {
        he_thong_id: r.he_thong_id,
        name: shortName,
        fullName: r.ten ?? r.ma ?? "—",
        so_su_co: r.so_su_co,
        cum_pct: total > 0 ? Number(((cum / total) * 100).toFixed(1)) : 0,
      };
    });
  }, [q.data]);

  const paretoVital = useMemo(() => {
    const idx = paretoData.findIndex((r) => r.cum_pct >= 80);
    return idx === -1 ? paretoData.length : idx + 1;
  }, [paretoData]);






  const computeTotals = (rows: Row[]) => {
    const totalIncidents = rows.reduce((a, r) => a + (r.so_su_co ?? 0), 0);
    const totalClosed = rows.reduce((a, r) => a + (r.so_dong ?? 0), 0);
    const weightedMttr =
      rows.reduce((a, r) => a + (r.mttr_phut ?? 0) * (r.so_dong ?? 0), 0) /
      Math.max(totalClosed, 1);
    return { totalIncidents, totalClosed, weightedMttr };
  };
  const totals = useMemo(() => computeTotals(q.data ?? []), [q.data]);
  const prevTotals = useMemo(() => computeTotals(prevQ.data ?? []), [prevQ.data]);

  const delta = (cur: number, prev: number) => {
    if (!Number.isFinite(cur) || !Number.isFinite(prev)) return null;
    if (prev === 0) return cur === 0 ? { pct: 0, diff: 0 } : { pct: null as number | null, diff: cur };
    return { pct: ((cur - prev) / prev) * 100, diff: cur - prev };
  };
  // For incidents/MTTR, giảm là tốt (xanh); Đã đóng, tăng là tốt.
  const DeltaBadge = ({ d, lowerIsBetter = true }: { d: ReturnType<typeof delta>; lowerIsBetter?: boolean }) => {
    if (!d || (d.diff === 0)) return <span className="text-xs text-muted-foreground">= kỳ trước</span>;
    const up = d.diff > 0;
    const good = lowerIsBetter ? !up : up;
    const cls = good ? "text-emerald-600" : "text-destructive";
    const sign = up ? "▲" : "▼";
    const pct = d.pct == null ? "mới" : `${Math.abs(d.pct).toFixed(1)}%`;
    return <span className={`text-xs font-medium ${cls}`}>{sign} {pct} vs kỳ trước</span>;
  };


  const fmtMttr = (m: number | null | undefined) => {
    if (m == null || !Number.isFinite(m)) return "—";
    if (m < 60) return `${m.toFixed(1)} phút`;
    const h = m / 60;
    if (h < 48) return `${h.toFixed(1)} giờ`;
    return `${(h / 24).toFixed(1)} ngày`;
  };
  const fmtMtbf = (h: number | null | undefined) => {
    if (h == null || !Number.isFinite(h)) return "—";
    if (h < 48) return `${h.toFixed(1)} giờ`;
    return `${(h / 24).toFixed(1)} ngày`;
  };

  const exportCsv = () => {
    const rows = q.data ?? [];
    if (!rows.length) {
      toast.info("Không có dữ liệu để xuất");
      return;
    }
    const header = ["Mã HT", "Tên hệ thống", "Số sự cố", "Đã đóng", "MTTR (phút)", "MTBF (giờ)"];
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          JSON.stringify(r.ma ?? ""),
          JSON.stringify(r.ten ?? ""),
          r.so_su_co,
          r.so_dong,
          r.mttr_phut ?? "",
          r.mtbf_gio ?? "",
        ].join(",")
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `do-tin-cay_${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [pdfExporting, setPdfExporting] = useState(false);
  const exportPdf = async () => {
    if (!q.data?.length) {
      toast.info("Không có dữ liệu để xuất");
      return;
    }
    const root = document.querySelector<HTMLElement>("[data-print-root]");
    if (!root) {
      toast.error("Không tìm thấy vùng in");
      return;
    }
    setPdfExporting(true);
    const tId = toast.loading("Đang tạo PDF…");
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      // Ẩn các thành phần không cần in
      root.classList.add("pdf-exporting");
      // Đợi 1 frame để layout ổn định
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const canvas = await html2canvas(root, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: root.scrollWidth,
      });
      root.classList.remove("pdf-exporting");

      const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;

      // Tiêu đề trang đầu
      pdf.setFontSize(14);
      pdf.text("Bao cao do tin cay he thong", margin, margin);
      pdf.setFontSize(10);
      pdf.text(`Tu ${from} den ${to}  |  Bucket: ${bucket}  |  Xuat: ${new Date().toLocaleString("vi-VN")}`, margin, margin + 14);

      const topOffset = margin + 24;
      const availH = pageH - topOffset - margin;

      if (imgH <= availH) {
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", margin, topOffset, imgW, imgH);
      } else {
        // Chia thành nhiều trang: cắt theo chiều dọc canvas
        const pageCanvasH = Math.floor((availH * canvas.width) / imgW);
        let yOffset = 0;
        let first = true;
        while (yOffset < canvas.height) {
          const sliceH = Math.min(pageCanvasH, canvas.height - yOffset);
          const tmp = document.createElement("canvas");
          tmp.width = canvas.width;
          tmp.height = sliceH;
          const ctx = tmp.getContext("2d");
          if (!ctx) break;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, tmp.width, tmp.height);
          ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
          if (!first) pdf.addPage();
          first = false;
          const sliceImgH = (sliceH * imgW) / canvas.width;
          pdf.addImage(tmp.toDataURL("image/jpeg", 0.9), "JPEG", margin, first ? topOffset : margin, imgW, sliceImgH);
          yOffset += sliceH;
        }
      }

      pdf.save(`do-tin-cay_${from}_${to}.pdf`);
      toast.success("Đã xuất PDF", { id: tId });
    } catch (e) {
      console.error(e);
      toast.error("Không xuất được PDF", { id: tId });
    } finally {
      setPdfExporting(false);
    }
  };

  const exportExcel = async () => {
    const rows = q.data ?? [];
    if (!rows.length) {
      toast.info("Không có dữ liệu để xuất");
      return;
    }
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      // 1) Tổng quan
      const overview = [
        ["Báo cáo độ tin cậy hệ thống"],
        ["Từ ngày", from],
        ["Đến ngày", to],
        ["Bucket", bucket],
        ["Xuất lúc", new Date().toLocaleString("vi-VN")],
        [],
        ["Tổng sự cố", totals.totalIncidents],
        ["Đã đóng", totals.totalClosed],
        ["MTTR bình quân (phút)", Number.isFinite(totals.weightedMttr) ? Number(totals.weightedMttr.toFixed(2)) : 0],
        ["Số hệ thống", rows.length],
        ["Pareto: hệ thống trọng yếu (~80%)", `${paretoVital}/${paretoData.length}`],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overview), "Tổng quan");

      // 2) Theo hệ thống
      const bySys = [
        ["Mã HT", "Tên hệ thống", "Số sự cố", "Đã đóng", "MTTR (phút)", "MTBF (giờ)"],
        ...rows.map((r) => [r.ma ?? "", r.ten ?? "", r.so_su_co, r.so_dong, r.mttr_phut ?? "", r.mtbf_gio ?? ""]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bySys), "Theo hệ thống");

      // 3) Xu hướng
      const trend = [
        ["Mốc", "Bắt đầu", "Số sự cố", "Đã đóng", "MTTR (giờ)"],
        ...trendData.map((r) => [r.label, r.bucket_start, r.so_su_co, r.so_dong, r.mttr_gio ?? ""]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(trend), "Xu hướng");

      // 4) Heatmap 7x24
      const dowNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      const heatHeader = ["Thứ \\ Giờ", ...Array.from({ length: 24 }, (_, h) => `${h}h`)];
      const heatRows = heatmap.grid.map((row, dow) => [dowNames[dow], ...row]);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([heatHeader, ...heatRows]), "Heatmap giờ×thứ");

      // 5) Mức độ
      const sev = [
        ["Mức độ", "Số sự cố", "Đã đóng"],
        ...(severityQ.data ?? []).map((r) => [r.muc_do, r.so_su_co, r.so_dong]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sev), "Mức độ");

      // 6) Pareto
      const pareto = [
        ["Hệ thống", "Số sự cố", "Luỹ kế %"],
        ...paretoData.map((r) => [r.fullName, r.so_su_co, r.cum_pct]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pareto), "Pareto");

      // 7) Top MTTR
      const top = [
        ["Mã HT", "Tên hệ thống", "Đã đóng", "MTTR (phút)"],
        ...topMttr.map((r) => [r.ma ?? "", r.ten ?? "", r.so_dong, r.mttr_phut ?? ""]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(top), "Top MTTR");

      XLSX.writeFile(wb, `do-tin-cay_${from}_${to}.xlsx`);
      toast.success("Đã xuất Excel");
    } catch (e) {
      console.error(e);
      toast.error("Không xuất được Excel");
    }
  };


  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-3 sm:p-4" data-print-root>
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body * { visibility: hidden !important; }
          [data-print-root], [data-print-root] * { visibility: visible !important; }
          [data-print-root] { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
          [data-print-hide] { display: none !important; }
          .recharts-wrapper, .recharts-surface { page-break-inside: avoid; }
          [data-print-root] .card, [data-print-root] [class*="card"] { break-inside: avoid; }
        }
        [data-print-root].pdf-exporting [data-print-hide] { display: none !important; }
      `}</style>
      <PageHeader
        icon={Activity}
        title="Độ tin cậy hệ thống"
        description={<>MTBF / MTTR theo khoảng thời gian.{" "}
          <span className="hidden print:inline">Khoảng: {from} → {to} · Xuất lúc {new Date().toLocaleString("vi-VN")}</span></>}
        help="MTBF = tổng thời gian hoạt động ÷ số lần sự cố. MTTR = thời gian sửa chữa trung bình. Chỉ tính dữ liệu sự cố kỹ thuật trong khoảng đã chọn."
        actions={
          <div className="flex flex-wrap items-end gap-2" data-print-hide>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Từ ngày</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36 sm:w-40" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Đến ngày</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36 sm:w-40" />
            </div>
            <Separator orientation="vertical" className="mx-1 hidden h-9 self-end sm:block" />
            <Button variant="outline" size="sm" onClick={copyShareLink} title="Sao chép link chia sẻ với bộ lọc hiện tại">
              <Link2 className="mr-1.5 h-4 w-4" /> Chia sẻ
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" title="Bộ lọc đã lưu">
                  <Bookmark className="mr-1.5 h-4 w-4" /> Bộ lọc
                  {savedFilters.length > 0 && (
                    <span className="ml-1.5 rounded bg-muted px-1.5 text-xs tabular-nums">{savedFilters.length}</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuItem onClick={saveCurrentFilter}>
                  <Save className="mr-2 h-4 w-4" /> Lưu bộ lọc hiện tại
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Đã lưu</DropdownMenuLabel>
                {savedFilters.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">Chưa có bộ lọc nào.</div>
                ) : (
                  savedFilters.map((f) => (
                    <div key={f.id} className="flex items-center gap-1 px-1">
                      <button
                        type="button"
                        onClick={() => applySaved(f)}
                        className="flex-1 truncate rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                        title={`${f.from} → ${f.to} · ${f.bucket}`}
                      >
                        <div className="truncate">{f.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {f.from} → {f.to} · {f.bucket}
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => removeSaved(f.id)}
                        title="Xoá"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Separator orientation="vertical" className="mx-1 hidden h-9 self-end sm:block" />
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!q.data?.length}>
              <Download className="mr-1.5 h-4 w-4" /> Xuất CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportExcel} disabled={!q.data?.length}>
              <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Xuất Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportPdf} disabled={!q.data?.length || pdfExporting}>
              <FileText className="mr-1.5 h-4 w-4" /> {pdfExporting ? "Đang tạo…" : "Xuất PDF"}
            </Button>
          </div>
        }
      />



      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-primary" /> Tổng sự cố
            </CardTitle>
            <CardDescription className="text-xs">Kỳ trước: {prevRange.from} → {prevRange.to}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="font-mono text-2xl font-semibold tabular-nums">
              {q.isLoading ? <Skeleton className="h-8 w-16" /> : totals.totalIncidents}
            </div>
            {!q.isLoading && !prevQ.isLoading && (
              <DeltaBadge d={delta(totals.totalIncidents, prevTotals.totalIncidents)} lowerIsBetter />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-emerald-600" /> Đã đóng
            </CardTitle>
            <CardDescription className="text-xs">Kỳ trước: {prevTotals.totalClosed} / {prevTotals.totalIncidents}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="font-mono text-2xl font-semibold tabular-nums">
              {q.isLoading ? <Skeleton className="h-8 w-16" /> : `${totals.totalClosed} / ${totals.totalIncidents}`}
            </div>
            {!q.isLoading && !prevQ.isLoading && (
              <DeltaBadge d={delta(totals.totalClosed, prevTotals.totalClosed)} lowerIsBetter={false} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-amber-600" /> MTTR bình quân
            </CardTitle>
            <CardDescription className="text-xs">Kỳ trước: {fmtMttr(prevTotals.weightedMttr)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="font-mono text-2xl font-semibold tabular-nums">
              {q.isLoading ? <Skeleton className="h-8 w-24" /> : fmtMttr(totals.weightedMttr)}
            </div>
            {!q.isLoading && !prevQ.isLoading && (
              <DeltaBadge d={delta(totals.weightedMttr, prevTotals.weightedMttr)} lowerIsBetter />
            )}
          </CardContent>
        </Card>
      </div>


      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-3 space-y-0 sm:flex-row">
          <div>
            <CardTitle className="text-base">Xu hướng sự cố theo thời gian</CardTitle>
            <CardDescription>
              Số sự cố phát sinh, đã đóng và MTTR bình quân (giờ) theo từng {bucket === "day" ? "ngày" : bucket === "week" ? "tuần" : "tháng"}.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <AnnotationManager
              items={annotationsQ.data ?? []}
              isLoading={annotationsQ.isLoading}
              onChanged={() => annotationsQ.refetch()}
            />
            <Tabs value={bucket} onValueChange={(v) => setBucket(v as "day" | "week" | "month")}>
              <TabsList>
                <TabsTrigger value="day">Ngày</TabsTrigger>
                <TabsTrigger value="week">Tuần</TabsTrigger>
                <TabsTrigger value="month">Tháng</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {trendQ.isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : !trendData.length ? (
            <EmptyState title="Chưa có dữ liệu" description="Không có sự cố trong khoảng thời gian đã chọn." />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value: number | string, name: string) => {
                      if (name === "MTTR (giờ)") return [value ?? "—", name];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    yAxisId="left"
                    dataKey="so_su_co"
                    name="Sự cố"
                    fill="hsl(var(--primary))"
                    radius={[3, 3, 0, 0]}
                    cursor="pointer"
                    onClick={(d) => {
                      const p = d as unknown as { payload?: { bucket_start?: string; label?: string } };
                      const start = p?.payload?.bucket_start;
                      if (!start) return;
                      const s = new Date(start);
                      const e = new Date(s);
                      if (bucket === "day") e.setDate(e.getDate() + 1);
                      else if (bucket === "week") e.setDate(e.getDate() + 7);
                      else e.setMonth(e.getMonth() + 1);
                      setTrendDrill({ from: s.toISOString(), to: e.toISOString(), label: p.payload?.label ?? "" });
                    }}
                  />
                  <Bar yAxisId="left" dataKey="so_dong" name="Đã đóng" fill="hsl(var(--muted-foreground))" radius={[3, 3, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="mttr_gio" name="MTTR (giờ)" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                  {annotationsMapped.map((a) => (
                    <ReferenceLine
                      key={a.id}
                      yAxisId="left"
                      x={a.label}
                      stroke={a.mau ?? LOAI_META[a.loai].color}
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                      ifOverflow="extendDomain"
                      label={{
                        value: `${LOAI_META[a.loai].label.charAt(0)}·${a.tieu_de.slice(0, 24)}`,
                        position: "top",
                        fill: a.mau ?? LOAI_META[a.loai].color,
                        fontSize: 10,
                      }}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bản đồ nhiệt theo giờ × thứ</CardTitle>
          <CardDescription>
            Số sự cố phân bố theo giờ trong ngày và thứ trong tuần (giờ Việt Nam). Ô càng đậm càng nhiều sự cố. Tổng {heatmap.total} sự cố.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {heatmapQ.isLoading ? (
            <Skeleton className="h-56 w-full" />
          ) : heatmap.total === 0 ? (
            <EmptyState title="Chưa có dữ liệu" description="Không có sự cố trong khoảng thời gian đã chọn." />
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="flex text-[10px] text-muted-foreground">
                  <div className="w-10 shrink-0" />
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div key={h} className="w-6 text-center tabular-nums">{h}</div>
                  ))}
                </div>
                {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((label, dow) => (
                  <div key={dow} className="flex items-center">
                    <div className="w-10 shrink-0 text-xs text-muted-foreground">{label}</div>
                    {Array.from({ length: 24 }).map((_, h) => {
                      const v = heatmap.grid[dow][h];
                      const intensity = heatmap.max > 0 ? v / heatmap.max : 0;
                      return (
                        <div
                          key={h}
                          title={`${label} ${h}:00 — ${v} sự cố`}
                          onClick={() => v > 0 && setHeatDrill({ dow, hour: h })}
                          className={`m-[1px] h-5 w-[22px] rounded-sm border border-border/40 tabular-nums text-[9px] text-center leading-5 ${v > 0 ? "cursor-pointer hover:ring-1 hover:ring-primary" : ""}`}
                          style={{
                            backgroundColor: v === 0
                              ? "hsl(var(--muted) / 0.35)"
                              : `hsl(var(--primary) / ${0.15 + intensity * 0.75})`,
                            color: intensity > 0.55 ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                          }}
                        >
                          {v > 0 ? v : ""}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>Ít</span>
                  {[0.15, 0.35, 0.55, 0.75, 0.9].map((a) => (
                    <div
                      key={a}
                      className="h-3 w-6 rounded-sm border border-border/40"
                      style={{ backgroundColor: `hsl(var(--primary) / ${a})` }}
                    />
                  ))}
                  <span>Nhiều</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 hệ thống MTTR cao nhất</CardTitle>
            <CardDescription>Hệ thống mất nhiều thời gian khắc phục nhất — ưu tiên cải thiện quy trình.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {q.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
              </div>
            ) : !topMttr.length ? (
              <EmptyState title="Chưa có dữ liệu" description="Chưa có sự cố nào đã đóng trong khoảng thời gian này." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hệ thống</TableHead>
                    <TableHead className="w-24 text-right">Đã đóng</TableHead>
                    <TableHead className="w-32 text-right">MTTR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topMttr.map((r) => (
                    <TableRow
                      key={r.he_thong_id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setDrill({ id: r.he_thong_id, name: r.ten ?? r.ma ?? "" })}
                    >
                      <TableCell className="font-medium">{r.ten ?? "(không rõ)"}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{r.so_dong}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{fmtMttr(r.mttr_phut)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phân bố theo mức độ</CardTitle>
            <CardDescription>Tỉ lệ sự cố theo mức độ nghiêm trọng.</CardDescription>
          </CardHeader>
          <CardContent>
            {severityQ.isLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : !severityQ.data?.length ? (
              <EmptyState title="Chưa có dữ liệu" description="Không có sự cố trong khoảng thời gian đã chọn." />
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityQ.data}
                      dataKey="so_su_co"
                      nameKey="muc_do"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                      cursor="pointer"
                      onClick={(d: unknown) => {
                        const p = d as { muc_do?: string; payload?: { muc_do?: string } };
                        const key = p?.muc_do ?? p?.payload?.muc_do;
                        if (key) setSevDrill(key);
                      }}
                    >
                      {severityQ.data.map((_, i) => (
                        <Cell key={i} fill={SEVERITY_COLORS[i % SEVERITY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pareto — Hệ thống gây nhiều sự cố nhất</CardTitle>
          <CardDescription>
            Nguyên tắc 80/20: {paretoVital > 0 && paretoData.length > 0
              ? `${paretoVital}/${paretoData.length} hệ thống chiếm ~80% tổng số sự cố. Ưu tiên xử lý nhóm này.`
              : "Ưu tiên xử lý nhóm hệ thống ở phía trái biểu đồ."} <span className="text-xs italic text-muted-foreground">— Nhấp vào cột để xem chi tiết sự cố.</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : !paretoData.length ? (
            <EmptyState title="Chưa có dữ liệu" description="Không có sự cố trong khoảng thời gian đã chọn." />
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paretoData} margin={{ top: 8, right: 16, left: 0, bottom: 56 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    labelFormatter={(_, payload) => (payload?.[0]?.payload as { fullName?: string })?.fullName ?? ""}
                    formatter={(value: number | string, name: string) =>
                      name === "Luỹ kế" ? [`${value}%`, name] : [value, name]
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    yAxisId="left"
                    dataKey="so_su_co"
                    name="Sự cố"
                    fill="hsl(var(--primary))"
                    radius={[3, 3, 0, 0]}
                    cursor="pointer"
                    onClick={(d) => {
                      const p = d as unknown as { payload?: { he_thong_id?: string; fullName?: string } };
                      if (p?.payload?.he_thong_id) {
                        setDrill({ id: p.payload.he_thong_id, name: p.payload.fullName ?? "" });
                      }
                    }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cum_pct"
                    name="Luỹ kế"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <ReferenceLine
                    yAxisId="right"
                    y={80}
                    stroke="hsl(var(--destructive))"
                    strokeDasharray="4 4"
                    label={{ value: "80%", position: "right", fontSize: 10, fill: "hsl(var(--destructive))" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>


        <CardHeader>
          <CardTitle className="text-base">Chi tiết theo hệ thống</CardTitle>
          <CardDescription>
            <b>MTBF</b> = độ dài khoảng thời gian ÷ số sự cố · <b>MTTR</b> = trung bình (đóng − báo cáo) chỉ tính các sự cố đã có thời điểm hoàn thành.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : !q.data?.length ? (
            <EmptyState
              title="Không có sự cố"
              description="Không có sự cố nào trong khoảng thời gian đã chọn."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Mã</TableHead>
                  <TableHead>Hệ thống</TableHead>
                  <TableHead className="w-24 text-right">Sự cố</TableHead>
                  <TableHead className="w-24 text-right">Đã đóng</TableHead>
                  <TableHead className="w-32 text-right">MTTR</TableHead>
                  <TableHead className="w-32 text-right">MTBF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.data.map((r) => (
                  <TableRow
                    key={r.he_thong_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setDrill({ id: r.he_thong_id, name: r.ten ?? r.ma ?? "" })}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.ma ?? "—"}</TableCell>
                    <TableCell className="font-medium">{r.ten ?? "(không rõ)"}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{r.so_su_co}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{r.so_dong}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{fmtMttr(r.mttr_phut)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{fmtMtbf(r.mtbf_gio)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!drill} onOpenChange={(o) => !o && setDrill(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sự cố của: {drill?.name || "—"}</DialogTitle>
            <DialogDescription>
              Từ {from} đến {to} · tối đa 200 bản ghi gần nhất.
            </DialogDescription>
          </DialogHeader>
          {drillQ.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : !drillQ.data?.length ? (
            <EmptyState title="Không có sự cố" description="Hệ thống này không có sự cố trong khoảng thời gian đã chọn." />
          ) : (
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Mã SC</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead className="w-40">Phát hiện</TableHead>
                    <TableHead className="w-24">Mức</TableHead>
                    <TableHead className="w-28">Trạng thái</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drillQ.data.map((s) => (
                    <TableRow key={s.ma_su_co}>
                      <TableCell className="font-mono text-xs">{s.ma_su_co}</TableCell>
                      <TableCell className="max-w-[24rem] truncate">{s.hien_tuong ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {s.ngay_phat_hien ? new Date(s.ngay_phat_hien).toLocaleString("vi-VN") : "—"}
                      </TableCell>
                      <TableCell><Badge variant="outline">{s.muc_do ?? "—"}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{s.trang_thai ?? "—"}</Badge></TableCell>
                      <TableCell>
                        <Link
                          to="/su-co/$maSuCo"
                          params={{ maSuCo: s.ma_su_co }}
                          className="inline-flex items-center text-primary hover:underline"
                          onClick={() => setDrill(null)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!heatDrill} onOpenChange={(o) => !o && setHeatDrill(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Sự cố lúc {heatDrill?.hour}:00 — {["Chủ nhật","Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7"][heatDrill?.dow ?? 0]}
            </DialogTitle>
            <DialogDescription>
              Từ {from} đến {to} · tối đa 200 bản ghi trong khung giờ này.
            </DialogDescription>
          </DialogHeader>
          {heatDrillQ.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : !heatDrillQ.data?.length ? (
            <EmptyState title="Không có sự cố" description="Không có sự cố trong khung giờ này." />
          ) : (
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Mã SC</TableHead>
                    <TableHead>Hiện tượng</TableHead>
                    <TableHead className="w-40">Phát hiện</TableHead>
                    <TableHead className="w-24">Mức</TableHead>
                    <TableHead className="w-28">Trạng thái</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {heatDrillQ.data.map((s) => (
                    <TableRow key={s.ma_su_co}>
                      <TableCell className="font-mono text-xs">{s.ma_su_co}</TableCell>
                      <TableCell className="max-w-[24rem] truncate">{s.hien_tuong ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {s.ngay_phat_hien ? new Date(s.ngay_phat_hien).toLocaleString("vi-VN") : "—"}
                      </TableCell>
                      <TableCell><Badge variant="outline">{s.muc_do ?? "—"}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{s.trang_thai ?? "—"}</Badge></TableCell>
                      <TableCell>
                        <Link
                          to="/su-co/$maSuCo"
                          params={{ maSuCo: s.ma_su_co }}
                          className="inline-flex items-center text-primary hover:underline"
                          onClick={() => setHeatDrill(null)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!sevDrill} onOpenChange={(o) => !o && setSevDrill(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sự cố mức: {sevDrill ?? "—"}</DialogTitle>
            <DialogDescription>Từ {from} đến {to} · tối đa 200 bản ghi gần nhất.</DialogDescription>
          </DialogHeader>
          {sevDrillQ.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : !sevDrillQ.data?.length ? (
            <EmptyState title="Không có sự cố" description="Không có sự cố mức này trong khoảng đã chọn." />
          ) : (
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Mã SC</TableHead>
                    <TableHead>Hiện tượng</TableHead>
                    <TableHead className="w-40">Phát hiện</TableHead>
                    <TableHead className="w-28">Trạng thái</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sevDrillQ.data.map((s) => (
                    <TableRow key={s.ma_su_co}>
                      <TableCell className="font-mono text-xs">{s.ma_su_co}</TableCell>
                      <TableCell className="max-w-[24rem] truncate">{s.hien_tuong ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {s.ngay_phat_hien ? new Date(s.ngay_phat_hien).toLocaleString("vi-VN") : "—"}
                      </TableCell>
                      <TableCell><Badge variant="secondary">{s.trang_thai ?? "—"}</Badge></TableCell>
                      <TableCell>
                        <Link
                          to="/su-co/$maSuCo"
                          params={{ maSuCo: s.ma_su_co }}
                          className="inline-flex items-center text-primary hover:underline"
                          onClick={() => setSevDrill(null)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!trendDrill} onOpenChange={(o) => !o && setTrendDrill(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sự cố trong {bucket === "day" ? "ngày" : bucket === "week" ? "tuần" : "tháng"}: {trendDrill?.label ?? "—"}</DialogTitle>
            <DialogDescription>Tối đa 200 bản ghi gần nhất trong khoảng đã chọn.</DialogDescription>
          </DialogHeader>
          {trendDrillQ.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : !trendDrillQ.data?.length ? (
            <EmptyState title="Không có sự cố" description="Không có sự cố trong khoảng thời gian này." />
          ) : (
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Mã SC</TableHead>
                    <TableHead>Hiện tượng</TableHead>
                    <TableHead className="w-40">Phát hiện</TableHead>
                    <TableHead className="w-24">Mức</TableHead>
                    <TableHead className="w-28">Trạng thái</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trendDrillQ.data.map((s) => (
                    <TableRow key={s.ma_su_co}>
                      <TableCell className="font-mono text-xs">{s.ma_su_co}</TableCell>
                      <TableCell className="max-w-[24rem] truncate">{s.hien_tuong ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {s.ngay_phat_hien ? new Date(s.ngay_phat_hien).toLocaleString("vi-VN") : "—"}
                      </TableCell>
                      <TableCell><Badge variant="outline">{s.muc_do ?? "—"}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{s.trang_thai ?? "—"}</Badge></TableCell>
                      <TableCell>
                        <Link
                          to="/su-co/$maSuCo"
                          params={{ maSuCo: s.ma_su_co }}
                          className="inline-flex items-center text-primary hover:underline"
                          onClick={() => setTrendDrill(null)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
