import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoHint } from "@/components/mirats/InfoHint";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";

import { AlertTriangle as AlertTriangleIcon2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageSection } from "@/components/mirats/layout/PageSection";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, FilePlus2, FileDown, AlertTriangle, Clock, Activity, Network, ChevronDown,
  Flame, CheckCircle2, Loader2, HardDrive, Filter, RotateCcw, LayoutGrid, Plus
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/mirats/StatusBadge";
import { statuses, normalizeLegacy } from "@/lib/mirats/trang-thai";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useListControls } from "@/lib/mirats/ui/use-list-controls";
import { MobileListControlsSheet } from "@/components/mirats/ui/MobileListControlsSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { locVaSapXep } from "@/lib/mirats/ui/list-controls";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";
import { DataState } from "@/components/mirats/DataState";
import { EmptyState } from "@/components/mirats/EmptyState";
import { ContextualToolbar } from "@/components/mirats/ContextualToolbar";
import { FileDown as FileDownIcon, XCircle } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ResponsiveDialog } from "@/components/mirats/ResponsiveDialog";
import { supabase } from "@/integrations/backend/client";
import { fmtDowntime } from "@/lib/mirats/format";
import { mttr as computeMttr, formatKpiValue } from "@/lib/mirats/reliability";
import { useScope } from "@/lib/mirats/scope";
import { useDbTaxonomy } from "@/lib/mirats/db-taxonomy";
import type { SuCo } from "@/lib/mirats/types";
import { OPEN_STATES, isOpenState, canManageSuCoState, canFinalize } from "@/lib/mirats/su-co-state";
import { useSession } from "@/hooks/use-session";
import { WeeklyReportImportDialog } from "@/components/mirats/WeeklyReportImportDialog";

export const Route = createFileRoute("/_app/su-co/")({
  head: () => ({
    meta: [
      { title: "Sự cố kỹ thuật — MIRATS" },
      { name: "description", content: "Nhật ký sự cố theo hệ thống — đánh giá chất lượng hệ thống, thành phần hay hư hỏng, xuất báo cáo ban đầu / tuần / tháng." },
      { property: "og:title", content: "Sự cố kỹ thuật — MIRATS" },
      { property: "og:description", content: "Theo dõi sự cố theo hệ thống và xuất báo cáo khi cần." },
    ],
  }),
  component: SuCoPage,
});

import { getMucDoSuCoToken } from "@/lib/mirats/ui/status-tokens";

interface OngoingGroup {
  key: string;
  ma_nhom_bc: string | null;
  ma_list: string[];
  hien_tuong: string;
  ngay_phat_hien: string;
  muc_do: string;
  ht: string;
  devices: string[];
}

/* ---------- Tiện ích thời gian & CSV ---------- */
function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Thứ 2 = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function parseDate(s: string | null | undefined) {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t);
}
function csv(v: unknown) {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}
function downloadCsv(name: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function SuCoPage() {
  const isMobile = useIsMobile();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  
  const { suCo, loading: isLoading } = useScope();
  const error = null;
  const qc = useQueryClient();
  const refetch = () => qc.invalidateQueries({ queryKey: ["operations_data"] });
  const { roles } = useSession();
  const canManageState = canManageSuCoState(roles);
  const { data: taxo } = useDbTaxonomy();

  const { state: controls, setQ, setFilter, setSort, reset } = useListControls({
    kichThuoc: 1000, // Show all for now or large amount
  });
  
  const query = controls.q;
  const tt = (controls.filters.tt as string) || "all";
  const period = (controls.filters.period as "all" | "week" | "month") || "all";
  const [showAll, setShowAll] = useState(false);

  const devByMa = useMemo(
    () => new Map((taxo?.devices ?? []).map((d) => [d.ma_thiet_bi, d])),
    [taxo],
  );
  const htNameOf = useCallback(
    (s: SuCo) =>
      taxo?.htNameMap.get(s.he_thong) || devByMa.get(s.thiet_bi)?._htTen || s.he_thong || "(Chưa gán hệ thống)",
    [taxo, devByMa],
  );
  const htKeyOf = useCallback(
    (s: SuCo) => s.he_thong || devByMa.get(s.thiet_bi)?._htId || htNameOf(s),
    [devByMa, htNameOf],
  );

  function inPeriod(s: SuCo, p: "all" | "week" | "month") {
    if (p === "all") return true;
    const d = parseDate(s.ngay_phat_hien);
    if (!d) return false;
    const from = p === "week" ? startOfWeek(new Date()) : startOfMonth(new Date());
    return d >= from;
  }

  const filtered = useMemo(() => {
    const { data } = locVaSapXep(suCo, controls, {
      timKiem: (s) => 
        s.ma_su_co + " " + s.hien_tuong + " " + s.thiet_bi + " " + (devByMa.get(s.thiet_bi)?.ten ?? "") + " " + htNameOf(s),
      loc: {
        tt: (s, v) => v === "all" ? true : normalizeLegacy("su_co", s.trang_thai) === v,
        period: (s, v) => inPeriod(s, v as any),
      },
    });
    return data;
  }, [suCo, controls, devByMa, htNameOf]);

  const state = isLoading ? "loading" : error ? "error" : filtered.length === 0 ? "empty" : "success";

  const stats = useMemo(() => {
    let open = 0, severe = 0, downtime = 0;
    for (const x of filtered) {
      if (OPEN_STATES.has(x.trang_thai)) open++;
      if (x.muc_do === "Nghiêm trọng") severe++;
      downtime += x.thoi_gian_gian_doan ?? 0;
    }
    return { total: filtered.length, open, severe, downtime, mttr: computeMttr(filtered) };
  }, [filtered]);

  const [closing, setClosing] = useState<OngoingGroup | null>(null);
  const [endTime, setEndTime] = useState("");
  const [tinhHinh, setTinhHinh] = useState("");
  const [downtimeValue, setDowntimeValue] = useState("");

  const ongoing = useMemo<OngoingGroup[]>(() => {
    const m = new Map<string, OngoingGroup>();
    for (const s of suCo) {
      if (s.thoi_diem_khac_phuc || !OPEN_STATES.has(s.trang_thai)) continue;
      const key = s.ma_nhom_bc || s.ma_su_co;
      let g = m.get(key);
      if (!g) {
        g = {
          key,
          ma_nhom_bc: s.ma_nhom_bc,
          ma_list: [],
          hien_tuong: s.hien_tuong,
          ngay_phat_hien: s.ngay_phat_hien,
          muc_do: s.muc_do,
          ht: htNameOf(s),
          devices: [],
        };
        m.set(key, g);
      }
      g.ma_list.push(s.ma_su_co);
      g.devices.push(devByMa.get(s.thiet_bi)?.ten || s.thiet_bi);
    }
    return Array.from(m.values()).sort(
      (a, b) => (parseDate(b.ngay_phat_hien)?.getTime() ?? 0) - (parseDate(a.ngay_phat_hien)?.getTime() ?? 0),
    );
  }, [suCo, devByMa, htNameOf]);

  function openClose(g: OngoingGroup) {
    setClosing(g);
    setEndTime(new Date().toISOString().slice(0, 16));
    setTinhHinh("");
    setDowntimeValue("");
  }

  const closeM = useMutation({
    mutationFn: async () => {
      if (!closing) return;
      if (!endTime) throw new Error("Vui lòng nhập thời gian kết thúc");
      if (!tinhHinh.trim()) throw new Error("Vui lòng nhập tình hình hiện tại");
      const endISO = new Date(endTime).toISOString();
      const dt = downtimeValue.trim() === "" ? null : Math.max(0, Math.round(Number(downtimeValue)));
      const patch: any = {
        thoi_diem_khac_phuc: endISO,
        bien_phap_xu_ly: tinhHinh.trim(),
        trang_thai: "Đã khắc phục",
      };
      if (dt != null) patch.thoi_gian_gian_doan = dt;
      const { error } = await supabase.from("su_co").update(patch).in("ma_su_co", closing.ma_list);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã đóng sự cố & ghi vào sổ lý lịch");
      setClosing(null);
      qc.invalidateQueries({ queryKey: ["operations_data"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resolvedAwaitingFinalize = useMemo<SuCo[]>(
    () => suCo.filter((s) => canFinalize(s, roles)),
    [suCo, roles],
  );

  const finalizeM = useMutation({
    mutationFn: async (maSuCo: string) => {
      const { error } = await supabase
        .from("su_co")
        .update({ trang_thai: "Đóng" })
        .eq("ma_su_co", maSuCo);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã đóng hồ sơ sự cố");
      qc.invalidateQueries({ queryKey: ["operations_data"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bySystem = useMemo(() => {
    const m = new Map<string, any>();
    for (const s of filtered) {
      const key = htKeyOf(s);
      let row = m.get(key);
      if (!row) {
        row = { key, ten: htNameOf(s), count: 0, open: 0, severe: 0, downtime: 0, devs: new Map() };
        m.set(key, row);
      }
      row.count++;
      if (OPEN_STATES.has(s.trang_thai)) row.open++;
      if (s.muc_do === "Nghiêm trọng") row.severe++;
      row.downtime += s.thoi_gian_gian_doan ?? 0;
      const devName = devByMa.get(s.thiet_bi)?.ten || s.thiet_bi;
      row.devs.set(devName, (row.devs.get(devName) ?? 0) + 1);
    }
    return Array.from(m.values())
      .map((r) => {
        const entries = Array.from(r.devs.entries()) as [string, number][];
        const worst = entries.sort((a, b) => b[1] - a[1])[0];
        return { ...r, worst: worst ? { ten: worst[0], count: worst[1] } : null };
      })
      .sort((a, b) => b.count - a.count || b.downtime - a.downtime);
  }, [filtered, devByMa, htKeyOf, htNameOf]);

  const byDevice = useMemo(() => {
    const m = new Map<string, any>();
    for (const s of filtered) {
      const dev = devByMa.get(s.thiet_bi);
      let row = m.get(s.thiet_bi);
      if (!row) {
        row = { ma: s.thiet_bi, ten: dev?.ten || s.thiet_bi, ht: htNameOf(s), count: 0, downtime: 0 };
        m.set(s.thiet_bi, row);
      }
      row.count++;
      row.downtime += s.thoi_gian_gian_doan ?? 0;
    }
    return Array.from(m.values()).sort((a, b) => b.count - a.count || b.downtime - a.downtime).slice(0, 10);
  }, [filtered, devByMa, htNameOf]);

  const rows = showAll ? filtered : filtered.slice(0, 40);

  const logColumns: StdColumn<SuCo>[] = useMemo(() => [
    {
      key: "ma_su_co", label: "Mã SC", filter: "text", sortable: true,
      value: (s) => s.ma_su_co,
      cell: (s) => <Link to="/su-co/$maSuCo" params={{ maSuCo: s.ma_su_co }} className="font-mono text-xs text-primary hover:underline">{s.ma_su_co}</Link>,
    },
    {
      key: "ngay_phat_hien", label: "Thời điểm", sortable: true, hideBelow: "xl",
      value: (s) => s.ngay_phat_hien,
      cell: (s) => <span className="whitespace-nowrap text-xs text-muted-foreground">{s.ngay_phat_hien.replace("T", " ")}</span>,
    },
    {
      key: "thiet_bi", label: "Tài sản / Hệ thống", filter: "text",
      value: (s) => (devByMa.get(s.thiet_bi)?.ten ?? s.thiet_bi) + " " + htNameOf(s),
      cell: (s) => {
        const dev = devByMa.get(s.thiet_bi);
        return (
          <>
            {dev ? (
              <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: dev.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }} className="text-primary hover:underline">
                <div className="font-medium">{dev.ten}</div>
              </Link>
            ) : <div className="font-medium">{s.thiet_bi}</div>}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Network className="h-3 w-3" /> {htNameOf(s)}
            </div>
          </>
        );
      },
    },
    {
      key: "hien_tuong", label: "Hiện tượng", filter: "text", hideBelow: "md",
      value: (s) => s.hien_tuong,
      cell: (s) => <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground">{s.hien_tuong}</span>,
    },
    {
      key: "trang_thai", label: "Trạng thái", filter: "cat", hideBelow: "sm",
      value: (s) => s.trang_thai,
      cell: (s) => <StatusBadge domain="su_co" code={s.trang_thai} />,
    },
  ], [devByMa, htNameOf]);

  const [visibleKeys, setVisibleKeys] = useState<string[]>(logColumns.map(c => c.key));

  function exportList(list: SuCo[], label: string) {
    if (list.length === 0) return;
    const now = new Date();
    const lines: string[] = [];
    lines.push([csv(`BÁO CÁO SỰ CỐ KỸ THUẬT — ${label}`)].join(","));
    lines.push([csv("Ngày xuất"), csv(now.toLocaleString("vi-VN"))].join(","));
    lines.push("");
    lines.push(["Mã SC", "Ngày phát hiện", "Tài sản", "Hệ thống", "Hiện tượng", "Mức độ", "Downtime (phút)", "Trạng thái"].map(csv).join(","));
    list.forEach((s) => {
      const dev = devByMa.get(s.thiet_bi);
      lines.push([
        csv(s.ma_su_co), csv(s.ngay_phat_hien), csv(dev?.ten || s.thiet_bi), csv(htNameOf(s)),
        csv(s.hien_tuong), csv(s.muc_do), csv(s.thoi_gian_gian_doan ?? 0), csv(s.trang_thai),
      ].join(","));
    });
    downloadCsv(`bao-cao-su-co-${label}-${now.getTime()}.csv`, lines.join("\r\n"));
  }

  return (
    <>
      <PageFrame density="compact" className="max-w-full overflow-hidden">

      <PageHeader
        icon={AlertTriangle}
        title="Sự cố kỹ thuật"
        help="Theo dõi sự cố theo hệ thống để đánh giá chất lượng hệ thống & thành phần hay hư hỏng."
        actions={
          <div className="flex gap-1 items-center">
            <WeeklyReportImportDialog />
            <Button asChild size="icon" variant="outline" className="h-8 w-8" tooltip="Lịch sử nhập báo cáo">
              <Link to="/su-co/import-history"><Clock className="h-4 w-4" /></Link>
            </Button>
            <Button variant="outline" size="sm" className="hidden md:flex flex justify-center gap-2 h-8" tooltip="Khôi phục trạng thái ban đầu">
              <RotateCcw className="h-4 w-4" />
              <span className="truncate max-w-[100px]">KHÔI PHỤC</span>
            </Button>
            <Button size="sm" className="hidden md:flex flex justify-center gap-2 h-8" tooltip="Cá nhân hóa bảng điều khiển">
              <LayoutGrid className="h-4 w-4" />
              <span className="truncate max-w-[120px]">CÁ NHÂN HÓA</span>
            </Button>
            <Button asChild size="sm" className="gap-2 h-8">
              <Link to="/su-co/moi">
                <Plus className="h-4 w-4" />
                <span>BÁO CÁO MỚI</span>
              </Link>
            </Button>
          </div>
        }
      />

      <PageBody>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border bg-card px-2 py-1.5 text-[11px]">
            <Stat icon={AlertTriangle} label="SC" value={stats.total} />
            <Stat icon={Activity} label="Mở" value={stats.open} tone="text-amber-600" />
            <Stat icon={Clock} label="MTTR" value={formatKpiValue(stats.mttr, fmtDowntime)} tone="text-sky-600" />
            
            <div className="ml-auto flex items-center gap-1">
              {isMobile ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-1.5"
                  onClick={() => setMobileSheetOpen(true)}
                >
                  <Filter className="h-3.5 w-3.5" />
                  Bộ lọc
                  {Object.keys(controls.filters).length + (controls.q.trim() ? 1 : 0) > 0 && (
                    <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">
                      {Object.keys(controls.filters).length + (controls.q.trim() ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              ) : (
                <Select value={period} onValueChange={(v: any) => setFilter("period", v)}>
                  <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="week">Tuần này</SelectItem>
                    <SelectItem value="month">Tháng này</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {ongoing.length > 0 && (
            <PageSection>
              <Card className="border-orange-300 bg-orange-50/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-orange-800">Sự cố đang xảy ra ({ongoing.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {ongoing.map((g) => (
                    <div key={g.key} className="flex items-center justify-between rounded-md border border-orange-200 bg-card p-3">
                      <div>
                        <div className="font-medium text-sm">{g.hien_tuong}</div>
                        <div className="text-xs text-muted-foreground">{g.ht} · {g.ngay_phat_hien}</div>
                      </div>
                      <Button size="sm" onClick={() => openClose(g)}>Kết thúc</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </PageSection>
          )}

          <PageSection>
            <DataState state={state} onRetry={refetch}>
              <StandardTable<SuCo>
                tableKey="su_co_nhat_ky"
                columns={logColumns.filter(c => visibleKeys.includes(c.key))}
                rows={rows}
                getRowId={(s) => s.ma_su_co}
                toolbarLeft={
                  !isMobile && (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Tìm sự cố..."
                        value={query}
                        onChange={(e) => setQ(e.target.value)}
                        className="h-8 w-64"
                      />
                      <Select value={tt} onValueChange={(v) => setFilter("tt", v)}>
                        <SelectTrigger className="h-8 w-[120px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Mọi trạng thái</SelectItem>
                          <SelectItem value="Đang xử lý">Đang xử lý</SelectItem>
                          <SelectItem value="Đã khắc phục">Đã khắc phục</SelectItem>
                          <SelectItem value="Đóng">Đóng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )
                }
              />
            </DataState>
          </PageSection>
        </div>
      </PageBody>
    </PageFrame>

      <ResponsiveDialog
        open={!!closing}
        onOpenChange={(o) => !o && setClosing(null)}
        title="Đóng sự cố"
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Thời gian kết thúc</Label>
            <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Nội dung xử lý</Label>
            <Textarea value={tinhHinh} onChange={(e) => setTinhHinh(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button className="w-full sm:w-auto" onClick={() => closeM.mutate()}>Xác nhận</Button>
        </DialogFooter>
      </ResponsiveDialog>
      <MobileListControlsSheet
        open={mobileSheetOpen}
        onOpenChange={setMobileSheetOpen}
        state={controls}
        setQ={setQ}
        setFilter={setFilter}
        setSort={setSort}
        reset={reset}
        filters={[
          {
            key: "tt",
            label: "Trạng thái",
            type: "select",
            options: [
              { value: "Đang xử lý", label: "Đang xử lý" },
              { value: "Đã khắc phục", label: "Đã khắc phục" },
              { value: "Đóng", label: "Đóng" },
            ],
          },
          {
            key: "period",
            label: "Thời gian",
            type: "select",
            options: [
              { value: "week", label: "Tuần này" },
              { value: "month", label: "Tháng này" },
            ],
          },
        ]}
        sortOptions={[
          { key: "ma_su_co", label: "Mã sự cố" },
          { key: "ngay_phat_hien", label: "Thời điểm" },
        ]}
        columns={logColumns.map(c => ({ key: c.key, label: c.label || "" }))}
        visibleColumns={visibleKeys}
        onVisibleColumnsChange={setVisibleKeys}
      />
    </>
  );
}

function Stat({ icon: Icon, label, value, tone }: any) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`h-3.5 w-3.5 ${tone || "text-muted-foreground"}`} />
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-mono font-medium ${tone || ""}`}>{value}</span>
    </div>
  );
}