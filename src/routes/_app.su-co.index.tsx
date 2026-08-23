import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoHint } from "@/components/mirats/InfoHint";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";

import { useCallback, useMemo, useState } from "react";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageSection } from "@/components/mirats/layout/PageSection";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileDown,
  AlertTriangle,
  Clock,
  Activity,
  Network,
  RotateCcw,
  Plus,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/mirats/StatusBadge";
import { normalizeLegacy } from "@/lib/mirats/trang-thai";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useListControls } from "@/lib/mirats/ui/use-list-controls";
import { MobileListControlsSheet } from "@/components/mirats/ui/MobileListControlsSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { locVaSapXep } from "@/lib/mirats/ui/list-controls";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";
import { DataState } from "@/components/mirats/DataState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { ResponsiveDialog } from "@/components/mirats/ResponsiveDialog";
import { supabase } from "@/integrations/backend/client";
import { fmtDowntime } from "@/lib/mirats/format";
import { mttr as computeMttr, formatKpiValue } from "@/lib/mirats/reliability";
import { useScope } from "@/lib/mirats/scope";
import { useDbTaxonomy } from "@/lib/mirats/db-taxonomy";
import { useThietBiList } from "@/lib/mirats/db-thiet-bi";
import type { SuCo } from "@/lib/mirats/types";
import {
  OPEN_STATES,
  canManageSuCoState,
  canFinalize,
} from "@/lib/mirats/su-co-state";
import { useSession } from "@/hooks/use-session";
import { WeeklyReportImportDialog } from "@/components/mirats/WeeklyReportImportDialog";

export const Route = createFileRoute("/_app/su-co/")({
  head: () => ({
    meta: [
      { title: "Sự cố kỹ thuật — MIRATS" },
      {
        name: "description",
        content:
          "Nhật ký sự cố theo hệ thống — đánh giá chất lượng hệ thống, thành phần hay hư hỏng, xuất báo cáo ban đầu / tuần / tháng.",
      },
      { property: "og:title", content: "Sự cố kỹ thuật — MIRATS" },
      {
        property: "og:description",
        content: "Theo dõi sự cố theo hệ thống và xuất báo cáo khi cần.",
      },
    ],
  }),
  component: SuCoPage,
});

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

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
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

function SuCoPage() {
  return (
    <PageFrame density="compact" layout="workspace">
      <PageHeader
        icon={AlertTriangle}
        title="Sự cố kỹ thuật"
        subtitle="Nhật ký và quản lý sự cố hệ thống"
        breadcrumbs={[
          { label: "Vận hành", to: "/he-thong/cay" },
          { label: "Sự cố kỹ thuật" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <WeeklyReportImportDialog />
            <Button asChild size="sm">
              <Link to="/su-co/moi">
                <Plus className="mr-2 h-4 w-4" />
                Báo cáo sự cố
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <FileDown className="mr-2 h-4 w-4" />
              Xuất báo cáo
            </Button>
          </div>
        }
      />
      <PageBody noPadding className="relative flex flex-col bg-muted/5 overflow-hidden flex-1 min-h-0">
        <SuCoListContent />
      </PageBody>
    </PageFrame>
  );
}

function SuCoListContent() {
  const isMobile = useIsMobile();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const { suCo, loading: isLoading } = useScope();
  const error = null;
  const qc = useQueryClient();
  const refetch = () => qc.invalidateQueries({ queryKey: ["operations_data"] });
  const { roles } = useSession();
  const canManageState = canManageSuCoState(roles);
  const { data: taxo } = useDbTaxonomy();
  const { data: pagedData } = useThietBiList(0, 1000);

  const {
    state: controls,
    setQ,
    setFilter,
    reset,
  } = useListControls({
    kichThuoc: 1000,
  });

  const query = controls.q;
  const tt = (controls.filters.tt as string) || "all";
  const period = (controls.filters.period as "all" | "week" | "month") || "all";

  const devByMa = useMemo(
    () => new Map((pagedData?.rows ?? []).map((d) => [d.ma_thiet_bi, d])),
    [pagedData],
  );

  const htNameOf = useCallback(
    (s: SuCo) =>
      taxo?.htNameMap.get(s.he_thong) ||
      devByMa.get(s.thiet_bi)?._htTen ||
      s.he_thong ||
      "(Chưa gán hệ thống)",
    [taxo, devByMa],
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
        s.ma_su_co +
        " " +
        s.hien_tuong +
        " " +
        s.thiet_bi +
        " " +
        (devByMa.get(s.thiet_bi)?.ten ?? "") +
        " " +
        htNameOf(s),
      loc: {
        tt: (s, v) => (v === "all" ? true : normalizeLegacy("su_co", s.trang_thai) === v),
        period: (s, v) => inPeriod(s, v as any),
      },
    });
    return data;
  }, [suCo, controls, devByMa, htNameOf]);

  const state = isLoading
    ? "loading"
    : error
      ? "error"
      : filtered.length === 0
        ? "empty"
        : "success";

  const stats = useMemo(() => {
    let open = 0,
      severe = 0,
      downtime = 0;
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
      (a, b) =>
        (parseDate(b.ngay_phat_hien)?.getTime() ?? 0) -
        (parseDate(a.ngay_phat_hien)?.getTime() ?? 0),
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
      const dt =
        downtimeValue.trim() === "" ? null : Math.max(0, Math.round(Number(downtimeValue)));
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
      toast.success("Đã kết thúc sự cố & ghi vào sổ lý lịch");
      setClosing(null);
      qc.invalidateQueries({ queryKey: ["operations_data"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const restoreM = useMutation({
    mutationFn: async (maSuCo: string) => {
      const { error } = await supabase
        .from("su_co")
        .update({
          trang_thai: "Mới",
          thoi_diem_khac_phuc: null,
          thoi_gian_gian_doan: null,
          bien_phap_xu_ly: null,
        })
        .eq("ma_su_co", maSuCo);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã khôi phục trạng thái sự cố về ban đầu");
      qc.invalidateQueries({ queryKey: ["operations_data"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const logColumns: StdColumn<SuCo>[] = useMemo(
    () => [
      {
        key: "ma_su_co",
        label: "Mã SC",
        filter: "text",
        sortable: true,
        value: (s) => s.ma_su_co,
        cell: (s) => (
          <Link
            to="/su-co/$maSuCo"
            params={{ maSuCo: s.ma_su_co }}
            className="font-mono text-xs text-primary hover:underline"
          >
            {s.ma_su_co}
          </Link>
        ),
      },
      {
        key: "ngay_phat_hien",
        label: "Thời điểm",
        sortable: true,
        hideBelow: "xl",
        value: (s) => s.ngay_phat_hien,
        cell: (s) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {s.ngay_phat_hien.replace("T", " ")}
          </span>
        ),
      },
      {
        key: "thiet_bi",
        label: "Tài sản / Hệ thống",
        filter: "text",
        value: (s) => (devByMa.get(s.thiet_bi)?.ten ?? s.thiet_bi) + " " + htNameOf(s),
        cell: (s) => {
          const dev = devByMa.get(s.thiet_bi);
          return (
            <>
              {dev ? (
                <Link
                  to="/thiet-bi/$maThietBi"
                  params={{ maThietBi: dev.ma_thiet_bi }}
                  search={{ tab: "tong-quan", doc: undefined, q: undefined }}
                  className="text-primary hover:underline"
                >
                  <div className="font-medium">{dev.ten}</div>
                </Link>
              ) : (
                <div className="font-medium">{s.thiet_bi}</div>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Network className="h-3 w-3" /> {htNameOf(s)}
              </div>
            </>
          );
        },
      },
      {
        key: "hien_tuong",
        label: "Hiện tượng",
        filter: "text",
        hideBelow: "md",
        value: (s) => s.hien_tuong,
        cell: (s) => (
          <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground">
            {s.hien_tuong}
          </span>
        ),
      },
      {
        key: "trang_thai",
        label: "Trạng thái",
        filter: "cat",
        hideBelow: "sm",
        value: (s) => s.trang_thai,
        cell: (s) => (
          <div className="flex items-center gap-2">
            <StatusBadge domain="su_co" code={s.trang_thai} />
            {canManageState && s.trang_thai !== "Mới" && (
              <AppTooltip noiDung="Khôi phục trạng thái ban đầu">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Khôi phục sự cố ${s.ma_su_co} về trạng thái Mới?`)) {
                      restoreM.mutate(s.ma_su_co);
                    }
                  }}
                  aria-label={`Khôi phục sự cố ${s.ma_su_co}`}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </AppTooltip>
            )}
          </div>
        ),
      },
    ],
    [devByMa, htNameOf, canManageState, restoreM],
  );

  const [visibleKeys, setVisibleKeys] = useState<string[]>(logColumns.map((c) => c.key));

  return (
    <div className="flex flex-col h-full gap-4 p-4 overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border bg-card px-2 py-1.5 text-[11px]">
        <Stat icon={AlertTriangle} label="SC" value={stats.total} />
        <Stat icon={Activity} label="Mở" value={stats.open} tone="text-amber-600" />
        <Stat
          icon={Clock}
          label="MTTR"
          value={formatKpiValue(stats.mttr, fmtDowntime)}
          tone="text-sky-600"
        />

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
            </Button>
          ) : (
            <Select value={period} onValueChange={(v: any) => setFilter("period", v)}>
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue />
              </SelectTrigger>
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
        <PageSection className="p-0">
          <Card className="border-orange-300 bg-orange-50/40">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-semibold text-orange-800 uppercase tracking-wider">
                Sự cố đang xảy ra ({ongoing.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-2">
              {ongoing.map((g) => (
                <div
                  key={g.key}
                  className="flex items-center justify-between rounded-md border border-orange-200 bg-card p-2"
                >
                  <div className="min-w-0 flex-1 mr-4">
                    <div className="font-medium text-xs truncate">{g.hien_tuong}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {g.ht} · {g.ngay_phat_hien.replace("T", " ")}
                    </div>
                  </div>
                  <Button size="sm" className="h-7 text-xs px-3" onClick={() => openClose(g)}>
                    Kết thúc
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </PageSection>
      )}

      <PageSection className="flex-1 overflow-hidden p-0 border rounded-lg bg-card">
        <DataState state={state} onRetry={refetch}>
          <StandardTable<SuCo>
            tableKey="su_co_nhat_ky"
            className="astryx-table h-full"
            maxHeightClass="h-full overflow-y-auto"
            columns={logColumns.filter((c) => visibleKeys.includes(c.key))}
            rows={filtered}
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
                    <SelectTrigger className="h-8 w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
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

      <ResponsiveDialog
        open={!!closing}
        onOpenChange={(o) => !o && setClosing(null)}
        title="Đóng sự cố"
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Thời gian kết thúc</Label>
            <Input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Nội dung xử lý</Label>
            <Textarea 
              value={tinhHinh} 
              onChange={(e) => setTinhHinh(e.target.value)}
              placeholder="Nhập nội dung đã xử lý..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Thời gian gián đoạn (phút)</Label>
            <Input
              type="number"
              value={downtimeValue}
              onChange={(e) => setDowntimeValue(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setClosing(null)}>Hủy</Button>
          <Button onClick={() => closeM.mutate()} loading={closeM.isPending}>
            Xác nhận
          </Button>
        </DialogFooter>
      </ResponsiveDialog>

      <MobileListControlsSheet
        open={mobileSheetOpen}
        onOpenChange={setMobileSheetOpen}
        state={controls}
        setQ={setQ}
        setFilter={setFilter}
        setSort={() => {}}
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
        columns={logColumns.map((c) => ({ key: c.key, label: c.label || "" }))}
        visibleColumns={visibleKeys}
        onVisibleColumnsChange={setVisibleKeys}
      />
    </div>
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
