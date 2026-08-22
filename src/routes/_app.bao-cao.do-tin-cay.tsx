import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  Clock,
  TrendingUp,
  Download,
  FileText,
  Bookmark,
  Link2,
  Trash2,
  Save,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/mirats/EmptyState";
import { PageHeader } from "@/components/mirats/PageHeader";
import { AnnotationManager, LOAI_META } from "@/components/mirats/AnnotationManager";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ERPChartFrame,
} from "@/components/ui/chart";

import {
  DeltaBadge,
  DOW_LONG,
  DOW_SHORT,
  SEVERITY_COLORS,
  SAVED_KEY,
  delta,
  fmtMtbf,
  fmtMttr,
  isoDate,
  type Bucket,
  type SavedFilter,
} from "@/components/mirats/bao-cao/reliability-core";
import { useReliabilityData } from "@/components/mirats/bao-cao/use-reliability-data";
import { SuCoDrillDialog } from "@/components/mirats/bao-cao/SuCoDrillDialog";
import {
  exportReliabilityCsv,
  exportReliabilityExcel,
  exportReliabilityPdf,
  type ExportContext,
} from "@/components/mirats/bao-cao/reliability-export";

type SearchState = { from?: string; to?: string; bucket?: Bucket };

export const Route = createFileRoute("/_app/bao-cao/do-tin-cay")({
  validateSearch: (raw: Record<string, unknown>): SearchState => {
    const isDate = (v: unknown): v is string =>
      typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
    const bk = raw.bucket;
    return {
      from: isDate(raw.from) ? raw.from : undefined,
      to: isDate(raw.to) ? raw.to : undefined,
      bucket: bk === "day" || bk === "week" || bk === "month" ? bk : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Độ tin cậy hệ thống — MIRATS" },
      {
        name: "description",
        content:
          "MTBF / MTTR theo hệ thống trong khoảng thời gian tuỳ chọn. Xuất CSV để tổng hợp báo cáo.",
      },
      { property: "og:title", content: "Độ tin cậy hệ thống — MIRATS" },
      {
        property: "og:description",
        content: "MTBF / MTTR theo hệ thống trong khoảng thời gian tuỳ chọn.",
      },
    ],
  }),
  component: DoTinCayPage,
});

function TrendCard({
  bucket,
  bucketLabel,
  trendData,
  trendQ,
  annotationsMapped,
  annotationsQ,
  setTrendDrill,
}: {
  bucket: Bucket;
  bucketLabel: string;
  trendData: any[];
  trendQ: any;
  annotationsMapped: any[];
  annotationsQ: any;
  setTrendDrill: (v: any) => void;
}) {
  return (
    <ERPChartFrame
      title="Xu hướng sự cố theo thời gian"
      subtitle={`Số sự cố phát sinh, đã đóng và MTTR bình quân (giờ) theo từng ${bucketLabel}.`}
      loading={trendQ.isLoading}
      empty={!trendData.length}
      className="h-[400px]"
      actions={
        <div className="flex items-center gap-2" data-print-hide>
          <AnnotationManager
            items={annotationsQ.data ?? []}
            isLoading={annotationsQ.isLoading}
            onChanged={() => annotationsQ.refetch()}
          />
          <TabsList className="h-8">
            <TabsTrigger value="day" className="text-[10px] px-2 h-7">Ngày</TabsTrigger>
            <TabsTrigger value="week" className="text-[10px] px-2 h-7">Tuần</TabsTrigger>
            <TabsTrigger value="month" className="text-[10px] px-2 h-7">Tháng</TabsTrigger>
          </TabsList>
        </div>
      }
    >
      <ChartContainer
        config={{
          so_su_co: { label: "Sự cố", color: "var(--chart-1)" },
          so_dong: { label: "Đã đóng", color: "var(--chart-6)" },
          mttr_gio: { label: "MTTR (giờ)", color: "var(--chart-4)" },
        }}
      >
        <ComposedChart data={trendData} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            yAxisId="left"
            dataKey="so_su_co"
            fill="var(--color-so_su_co)"
            radius={[3, 3, 0, 0]}
            barSize={20}
            onClick={(p) => {
              const start = p?.payload?.bucket_start;
              if (!start) return;
              const s = new Date(start);
              const e = new Date(s);
              if (bucket === "day") e.setDate(e.getDate() + 1);
              else if (bucket === "week") e.setDate(e.getDate() + 7);
              else e.setMonth(e.getMonth() + 1);
              setTrendDrill({
                from: s.toISOString(),
                to: e.toISOString(),
                label: p.payload?.label ?? "",
              });
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="so_dong"
            fill="var(--color-so_dong)"
            opacity={0.3}
            radius={[3, 3, 0, 0]}
            barSize={20}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="mttr_gio"
            stroke="var(--color-mttr_gio)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          {annotationsMapped.map((a) => (
            <ReferenceLine
              key={a.id}
              yAxisId="left"
              x={a.label}
              stroke={a.mau ?? (LOAI_META[a.loai as keyof typeof LOAI_META]?.color || "#ccc")}
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: `${(LOAI_META[a.loai as keyof typeof LOAI_META]?.label || "X").charAt(0)}·${a.tieu_de.slice(0, 16)}`,
                position: "top",
                fill: a.mau ?? (LOAI_META[a.loai as keyof typeof LOAI_META]?.color || "#ccc"),
                fontSize: 9,
              }}
            />
          ))}
        </ComposedChart>
      </ChartContainer>
    </ERPChartFrame>
  );
}

function DoTinCayPage() {
  const { session } = useSession();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const today = new Date();
  const ago = new Date(today.getTime() - 90 * 86400_000);
  const from = search.from ?? isoDate(ago);
  const to = search.to ?? isoDate(today);
  const bucket: Bucket = search.bucket ?? "day";
  const setFrom = (v: string) =>
    navigate({ search: (p: SearchState) => ({ ...p, from: v }), replace: true });
  const setTo = (v: string) =>
    navigate({ search: (p: SearchState) => ({ ...p, to: v }), replace: true });
  const setBucket = (v: Bucket) =>
    navigate({ search: (p: SearchState) => ({ ...p, bucket: v }), replace: true });

  // ---- Bộ lọc đã lưu (localStorage) ----------------------------------------
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) setSavedFilters(JSON.parse(raw));
    } catch {
      /* bỏ qua dữ liệu hỏng */
    }
  }, []);
  const persistSaved = (list: SavedFilter[]) => {
    setSavedFilters(list);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(list));
    } catch {
      /* quota */
    }
  };
  const saveCurrentFilter = () => {
    const name = window.prompt("Tên bộ lọc:", `${from} → ${to} (${bucket})`)?.trim();
    if (!name) return;
    persistSaved(
      [{ id: crypto.randomUUID(), name, from, to, bucket }, ...savedFilters].slice(0, 20),
    );
    toast.success("Đã lưu bộ lọc");
  };
  const applySaved = (f: SavedFilter) => {
    navigate({ search: () => ({ from: f.from, to: f.to, bucket: f.bucket }), replace: true });
    toast.success(`Áp dụng: ${f.name}`);
  };
  const removeSaved = (id: string) => {
    persistSaved(savedFilters.filter((f) => f.id !== id));
    toast.success("Đã xoá bộ lọc");
  };


  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    url.search = new URLSearchParams({ from, to, bucket }).toString();
    try {
      await navigator.clipboard.writeText(url.toString());
      toast.success("Đã sao chép link chia sẻ");
    } catch (err) {

      toast.error("Không sao chép được link: " + (err instanceof Error ? err.message : "không xác định"));
    }
  };

  // ---- Drill-down state ----------------------------------------------------
  const [drill, setDrill] = useState<{ id: string; name: string } | null>(null);
  const [heatDrill, setHeatDrill] = useState<{ dow: number; hour: number } | null>(null);
  const [sevDrill, setSevDrill] = useState<string | null>(null);
  const [trendDrill, setTrendDrill] = useState<{ from: string; to: string; label: string } | null>(
    null,
  );

  const d = useReliabilityData({
    enabled: !!session,
    from,
    to,
    bucket,
    drill,
    heatDrill,
    sevDrill,
    trendDrill,
  });
  const {
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
  } = d;

  // ---- Xuất báo cáo --------------------------------------------------------
  const [pdfExporting, setPdfExporting] = useState(false);
  const exportCtx = (): ExportContext => ({
    from,
    to,
    bucket,
    rows: q.data ?? [],
    totals,
    trendData,
    heatmapGrid: heatmap.grid,
    severity: severityQ.data ?? [],
    paretoData,
    paretoVital,
    topMttr,
  });
  const exportPdf = async () => {
    setPdfExporting(true);
    try {
      await exportReliabilityPdf(exportCtx());
    } finally {
      setPdfExporting(false);
    }
  };

  const bucketLabel = bucket === "day" ? "ngày" : bucket === "week" ? "tuần" : "tháng";

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
        description={
          <>
            MTBF / MTTR theo khoảng thời gian.{" "}
            <span className="hidden print:inline">
              Khoảng: {from} → {to} · Xuất lúc {new Date().toLocaleString("vi-VN")}
            </span>
          </>
        }
        help="MTBF = tổng thời gian hoạt động ÷ số lần sự cố. MTTR = thời gian sửa chữa trung bình. Chỉ tính dữ liệu sự cố kỹ thuật trong khoảng đã chọn."
        actions={
          <div className="flex flex-wrap items-end gap-2" data-print-hide>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Từ ngày</label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-36 sm:w-40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Đến ngày</label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-36 sm:w-40"
              />
            </div>
            <Separator orientation="vertical" className="mx-1 hidden h-9 self-end sm:block" />
            <Button
              variant="outline"
              size="sm"
              onClick={copyShareLink}
              title="Sao chép link chia sẻ với bộ lọc hiện tại"
            >
              <Link2 className="mr-1.5 h-4 w-4" /> Chia sẻ
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" title="Bộ lọc đã lưu">
                  <Bookmark className="mr-1.5 h-4 w-4" /> Bộ lọc
                  {savedFilters.length > 0 && (
                    <span className="ml-1.5 rounded bg-muted px-1.5 text-xs tabular-nums">
                      {savedFilters.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuItem onClick={saveCurrentFilter}>
                  <Save className="mr-2 h-4 w-4" /> Lưu bộ lọc hiện tại
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Đã lưu
                </DropdownMenuLabel>
                {savedFilters.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Chưa có bộ lọc nào.
                  </div>
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
                        aria-label="Xoá mục đã lưu"
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportReliabilityCsv(exportCtx())}
              disabled={!q.data?.length}
            >
              <Download className="mr-1.5 h-4 w-4" /> Xuất CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportReliabilityExcel(exportCtx())}
              disabled={!q.data?.length}
            >
              <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Xuất Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportPdf}
              disabled={!q.data?.length || pdfExporting}
            >
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
            <CardDescription className="text-xs">
              Kỳ trước: {prevRange.from} → {prevRange.to}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="font-mono text-2xl font-semibold tabular-nums">
              {q.isLoading ? <Skeleton className="h-8 w-16" /> : totals.totalIncidents}
            </div>
            {!q.isLoading && !prevQ.isLoading && (
              <DeltaBadge
                d={delta(totals.totalIncidents, prevTotals.totalIncidents)}
                lowerIsBetter
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-emerald-600" /> Đã đóng
            </CardTitle>
            <CardDescription className="text-xs">
              Kỳ trước: {prevTotals.totalClosed} / {prevTotals.totalIncidents}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="font-mono text-2xl font-semibold tabular-nums">
              {q.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                `${totals.totalClosed} / ${totals.totalIncidents}`
              )}
            </div>
            {!q.isLoading && !prevQ.isLoading && (
              <DeltaBadge
                d={delta(totals.totalClosed, prevTotals.totalClosed)}
                lowerIsBetter={false}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-amber-600" /> MTTR bình quân
            </CardTitle>
            <CardDescription className="text-xs">
              Kỳ trước: {fmtMttr(prevTotals.weightedMttr)}
            </CardDescription>
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

      <Tabs value={bucket} onValueChange={(v) => setBucket(v as Bucket)}>
        <TabsContent value="day" className="mt-0 outline-none">
          <TrendCard
            bucket={bucket}
            bucketLabel={bucketLabel}
            trendData={trendData}
            trendQ={trendQ}
            annotationsMapped={annotationsMapped}
            annotationsQ={annotationsQ}
            setTrendDrill={setTrendDrill}
          />
        </TabsContent>
        <TabsContent value="week" className="mt-0 outline-none">
          <TrendCard
            bucket={bucket}
            bucketLabel={bucketLabel}
            trendData={trendData}
            trendQ={trendQ}
            annotationsMapped={annotationsMapped}
            annotationsQ={annotationsQ}
            setTrendDrill={setTrendDrill}
          />
        </TabsContent>
        <TabsContent value="month" className="mt-0 outline-none">
          <TrendCard
            bucket={bucket}
            bucketLabel={bucketLabel}
            trendData={trendData}
            trendQ={trendQ}
            annotationsMapped={annotationsMapped}
            annotationsQ={annotationsQ}
            setTrendDrill={setTrendDrill}
          />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bản đồ nhiệt theo giờ × thứ</CardTitle>
          <CardDescription>
            Số sự cố phân bố theo giờ trong ngày và thứ trong tuần (giờ Việt Nam). Ô càng đậm càng
            nhiều sự cố. Tổng {heatmap.total} sự cố.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {heatmapQ.isLoading ? (
            <Skeleton className="h-56 w-full" />
          ) : heatmap.total === 0 ? (
            <EmptyState
              title="Chưa có dữ liệu"
              description="Không có sự cố trong khoảng thời gian đã chọn."
            />
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="flex text-[10px] text-muted-foreground">
                  <div className="w-10 shrink-0" />
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div key={h} className="w-6 text-center tabular-nums">
                      {h}
                    </div>
                  ))}
                </div>
                {DOW_SHORT.map((label, dow) => (
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
                            backgroundColor:
                              v === 0
                                ? "color-mix(in srgb, var(--muted), transparent 0.35)"
                                : `color-mix(in srgb, var(--primary), transparent ${0.15 + intensity * 0.75})`,
                            color:
                              intensity > 0.55
                                ? "var(--primary-foreground)"
                                : "var(--foreground)",
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
                      style={{ backgroundColor: `color-mix(in srgb, var(--primary), transparent ${a})` }}
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
            <CardDescription>
              Hệ thống mất nhiều thời gian khắc phục nhất — ưu tiên cải thiện quy trình.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {q.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : !topMttr.length ? (
              <EmptyState
                title="Chưa có dữ liệu"
                description="Chưa có sự cố nào đã đóng trong khoảng thời gian này."
              />
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
                      <TableCell className="text-right font-mono tabular-nums">
                        {r.so_dong}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {fmtMttr(r.mttr_phut)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <ERPChartFrame
          title="Phân bố theo mức độ"
          subtitle="Tỉ lệ sự cố theo mức độ nghiêm trọng."
          loading={severityQ.isLoading}
          empty={!severityQ.data?.length}
          className="h-[300px]"
        >
          <ChartContainer
            config={Object.fromEntries(
              (severityQ.data ?? []).map((d: any, i: number) => [
                d.muc_do,
                { label: d.muc_do, color: SEVERITY_COLORS[i % SEVERITY_COLORS.length] }
              ])
            )}
          >
            <PieChart>
              <Pie
                data={severityQ.data}
                dataKey="so_su_co"
                nameKey="muc_do"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                stroke="none"
                cursor="pointer"
                onClick={(p) => {
                  const key = p?.muc_do ?? p?.payload?.muc_do;
                  if (key) setSevDrill(key);
                }}
              >
                {severityQ.data.map((_: any, i: number) => (
                  <Cell key={i} fill={SEVERITY_COLORS[i % SEVERITY_COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent hideIndicator unit="vụ" />} />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </ERPChartFrame>
      </div>

      <ERPChartFrame
        title="Phân tích Pareto sự cố (80/20)"
        subtitle="Nguyên tắc 80/20: 20% hệ thống thường gây ra 80% sự cố."
        loading={q.isLoading}
        empty={!paretoData.length}
        className="h-[400px]"
      >
        <ChartContainer
          config={{
            so_su_co: { label: "Sự cố", color: "var(--chart-1)" },
            cum_pct: { label: "Luỹ kế", color: "var(--chart-4)" },
          }}
        >
          <ComposedChart data={paretoData} margin={{ top: 8, right: 0, left: -20, bottom: 40 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9 }}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={50}
            />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    if (name === "Luỹ kế") return [`${value}%`, name];
                    return [value, name];
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              yAxisId="left"
              dataKey="so_su_co"
              fill="var(--color-so_su_co)"
              radius={[3, 3, 0, 0]}
              barSize={24}
              onClick={(p: any) => {
                const id = p?.payload?.he_thong_id;
                if (id) setDrill({ id, name: p.payload.fullName ?? "" });
              }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cum_pct"
              stroke="var(--color-cum_pct)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <ReferenceLine
              yAxisId="right"
              y={80}
              stroke="var(--color-cum_pct)"
              strokeDasharray="4 4"
              label={{
                value: "80%",
                position: "right",
                fontSize: 10,
                fill: "var(--color-cum_pct)",
              }}
            />
          </ComposedChart>
        </ChartContainer>
      </ERPChartFrame>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết theo hệ thống</CardTitle>
          <CardDescription>
            <b>MTBF</b> = độ dài khoảng thời gian ÷ số sự cố · <b>MTTR</b> = trung bình (đóng − báo
            cáo) chỉ tính các sự cố đã có thời điểm hoàn thành.
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
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {r.ma ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">{r.ten ?? "(không rõ)"}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {r.so_su_co}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{r.so_dong}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {fmtMttr(r.mttr_phut)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {fmtMtbf(r.mtbf_gio)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SuCoDrillDialog
        open={!!drill}
        onClose={() => setDrill(null)}
        title={`Sự cố của: ${drill?.name || "—"}`}
        description={`Từ ${from} đến ${to} · tối đa 200 bản ghi gần nhất.`}
        rows={drillQ.data}
        isLoading={drillQ.isLoading}
        emptyDescription="Hệ thống này không có sự cố trong khoảng thời gian đã chọn."
      />

      <SuCoDrillDialog
        open={!!heatDrill}
        onClose={() => setHeatDrill(null)}
        title={`Sự cố lúc ${heatDrill?.hour ?? 0}:00 — ${DOW_LONG[heatDrill?.dow ?? 0]}`}
        description={`Từ ${from} đến ${to} · tối đa 200 bản ghi trong khung giờ này.`}
        rows={heatDrillQ.data}
        isLoading={heatDrillQ.isLoading}
        emptyDescription="Không có sự cố trong khung giờ này."
      />

      <SuCoDrillDialog
        open={!!sevDrill}
        onClose={() => setSevDrill(null)}
        title={`Sự cố mức: ${sevDrill ?? "—"}`}
        description={`Từ ${from} đến ${to} · tối đa 200 bản ghi gần nhất.`}
        rows={sevDrillQ.data}
        isLoading={sevDrillQ.isLoading}
        showMucDo={false}
        emptyDescription="Không có sự cố mức này trong khoảng đã chọn."
      />

      <SuCoDrillDialog
        open={!!trendDrill}
        onClose={() => setTrendDrill(null)}
        title={`Sự cố trong ${bucketLabel}: ${trendDrill?.label ?? "—"}`}
        description="Tối đa 200 bản ghi gần nhất trong khoảng đã chọn."
        rows={trendDrillQ.data}
        isLoading={trendDrillQ.isLoading}
        emptyDescription="Không có sự cố trong khoảng thời gian này."
      />
    </div>
  );
}
