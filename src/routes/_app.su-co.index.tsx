import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoHint } from "@/components/mirats/InfoHint";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";

import { AlertTriangle as AlertTriangleIcon2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, FilePlus2, FileDown, AlertTriangle, Clock, Activity, Network, ChevronDown,
  Flame, CheckCircle2, Loader2, HardDrive,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";
import { EmptyState } from "@/components/mirats/EmptyState";
import { ContextualToolbar } from "@/components/mirats/ContextualToolbar";
import { FileDown as FileDownIcon, XCircle } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
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
      { title: "Sự cố kỹ thuật — MIRATS 2.0" },
      { name: "description", content: "Nhật ký sự cố theo hệ thống — đánh giá chất lượng hệ thống, thành phần hay hư hỏng, xuất báo cáo ban đầu / tuần / tháng." },
      { property: "og:title", content: "Sự cố kỹ thuật — MIRATS 2.0" },
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
  const { suCo } = useScope();
  const { roles } = useSession();
  const canManageState = canManageSuCoState(roles);
  const { data: taxo } = useDbTaxonomy();

  const [query, setQuery] = useState("");
  const [tt, setTt] = useState("all");
  const [period, setPeriod] = useState<"all" | "week" | "month">("all");
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
    const q = query.trim().toLowerCase();
    return suCo.filter((s) => {
      if (!inPeriod(s, period)) return false;
      if (tt !== "all" && normalizeLegacy("su_co", s.trang_thai) !== tt) return false;
      if (!q) return true;
      const dev = devByMa.get(s.thiet_bi);
      return (
        s.ma_su_co.toLowerCase().includes(q) ||
        s.hien_tuong.toLowerCase().includes(q) ||
        s.thiet_bi.toLowerCase().includes(q) ||
        (dev?.ten.toLowerCase().includes(q) ?? false) ||
        htNameOf(s).toLowerCase().includes(q)
      );
    });
  }, [suCo, query, tt, period, devByMa, htNameOf]);

  const stats = useMemo(() => {
    let open = 0, severe = 0, downtime = 0;
    for (const x of filtered) {
      if (OPEN_STATES.has(x.trang_thai)) open++;
      if (x.muc_do === "Nghiêm trọng") severe++;
      downtime += x.thoi_gian_gian_doan ?? 0;
    }
    return { total: filtered.length, open, severe, downtime, mttr: computeMttr(filtered) };
  }, [filtered]);

  /* ---------- Sự cố đang xảy ra (chưa có thời gian kết thúc) ---------- */
  const qc = useQueryClient();
  const [closing, setClosing] = useState<OngoingGroup | null>(null);
  const [endTime, setEndTime] = useState("");
  const [tinhHinh, setTinhHinh] = useState("");
  const [downtime, setDowntime] = useState("");

  const ongoing = useMemo<OngoingGroup[]>(() => {
    const m = new Map<string, OngoingGroup>();
    for (const s of suCo) {
      // Đang xảy ra = chưa có thời điểm khắc phục và trạng thái còn mở.
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
    setDowntime("");
  }

  const closeM = useMutation({
    mutationFn: async () => {
      if (!closing) return;
      if (!endTime) throw new Error("Vui lòng nhập thời gian kết thúc");
      if (!tinhHinh.trim()) throw new Error("Vui lòng nhập tình hình hiện tại");
      const endISO = new Date(endTime).toISOString();
      const dt = downtime.trim() === "" ? null : Math.max(0, Math.round(Number(downtime)));
      if (dt != null && !Number.isFinite(dt)) throw new Error("Thời gian gián đoạn không hợp lệ");
      const patch: {
        thoi_diem_khac_phuc: string;
        bien_phap_xu_ly: string;
        trang_thai: string;
        thoi_gian_gian_doan?: number;
      } = {
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

  /* ---------- Đóng hồ sơ: Đã khắc phục → Đóng ---------- */
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



  /* ---------- Chất lượng theo hệ thống ---------- */
  const bySystem = useMemo(() => {
    const m = new Map<string, {
      key: string; ten: string; count: number; open: number; severe: number;
      downtime: number; devs: Map<string, number>;
    }>();
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
        const worst = Array.from(r.devs.entries()).sort((a, b) => b[1] - a[1])[0];
        return { ...r, worst: worst ? { ten: worst[0], count: worst[1] } : null };
      })
      .sort((a, b) => b.count - a.count || b.downtime - a.downtime);
  }, [filtered, devByMa, htKeyOf, htNameOf]);

  /* ---------- Thành phần / tài sản hay hư hỏng ---------- */
  const byDevice = useMemo(() => {
    const m = new Map<string, { ma: string; ten: string; ht: string; count: number; downtime: number }>();
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
      key: "ngay_phat_hien", label: "Thời điểm", sortable: true,
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
              <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: dev.ma_thiet_bi }} className="text-primary hover:underline">
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
      key: "hien_tuong", label: "Hiện tượng", filter: "text",
      value: (s) => s.hien_tuong,
      cell: (s) => <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground">{s.hien_tuong}</span>,
    },
    {
      key: "muc_do", label: "Mức độ", filter: "cat",
      value: (s) => s.muc_do,
      cell: (s) => {
        const token = getMucDoSuCoToken(s.muc_do);
        return <Badge variant="secondary" className={token?.class}>{s.muc_do}</Badge>;
      },
    },
    {
      key: "trang_thai", label: "Trạng thái", filter: "cat",
      value: (s) => s.trang_thai,
      cell: (s) => <StatusBadge domain="su_co" code={s.trang_thai} />,
    },
  ], [devByMa, htNameOf]);


  /* ---------- Xuất báo cáo ---------- */
  function exportList(list: SuCo[], label: string) {
    if (list.length === 0) {
      toast.info("Không có sự cố để xuất.");
      return;
    }
    const now = new Date();

    // Tổng hợp theo hệ thống
    const sysMap = new Map<string, { ten: string; count: number; open: number; downtime: number }>();
    for (const s of list) {
      const key = htKeyOf(s);
      let r = sysMap.get(key);
      if (!r) { r = { ten: htNameOf(s), count: 0, open: 0, downtime: 0 }; sysMap.set(key, r); }
      r.count++;
      if (OPEN_STATES.has(s.trang_thai)) r.open++;
      r.downtime += s.thoi_gian_gian_doan ?? 0;
    }

    const lines: string[] = [];
    lines.push([csv(`BÁO CÁO SỰ CỐ KỸ THUẬT — ${label}`)].join(","));
    lines.push([csv("Ngày xuất"), csv(now.toLocaleString("vi-VN"))].join(","));
    lines.push([csv("Tổng sự cố"), csv(list.length)].join(","));
    lines.push("");
    lines.push([csv("TỔNG HỢP THEO HỆ THỐNG")].join(","));
    lines.push(["Hệ thống", "Số sự cố", "Đang mở", "Tổng downtime (phút)"].map(csv).join(","));
    Array.from(sysMap.values())
      .sort((a, b) => b.count - a.count)
      .forEach((r) => lines.push([csv(r.ten), csv(r.count), csv(r.open), csv(r.downtime)].join(",")));
    lines.push("");
    lines.push([csv("CHI TIẾT SỰ CỐ")].join(","));
    lines.push(["Mã SC", "Ngày phát hiện", "Tài sản", "Hệ thống", "Hiện tượng", "Mức độ", "Ảnh hưởng ĐHB", "Downtime (phút)", "Trạng thái"].map(csv).join(","));
    list.forEach((s) => {
      const dev = devByMa.get(s.thiet_bi);
      lines.push([
        csv(s.ma_su_co), csv(s.ngay_phat_hien), csv(dev?.ten || s.thiet_bi), csv(htNameOf(s)),
        csv(s.hien_tuong), csv(s.muc_do), csv(s.anh_huong_dhb), csv(s.thoi_gian_gian_doan ?? 0), csv(s.trang_thai),
      ].join(","));
    });

    const stamp = now.toISOString().slice(0, 10);
    const slug = label.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    downloadCsv(`bao-cao-su-co-${slug || "danh-sach"}-${stamp}.csv`, lines.join("\r\n"));
    toast.success(`Đã xuất ${list.length} sự cố (${label}).`);
  }

  return (
    <PageBody>

      <PageHeader
        icon={AlertTriangle}
        title="Sự cố kỹ thuật"
        help="Theo dõi sự cố theo hệ thống để đánh giá chất lượng hệ thống & thành phần hay hư hỏng. Xuất báo cáo ban đầu / tuần / tháng khi cần."
        actions={
          <div className="flex gap-2">
            <WeeklyReportImportDialog />
            <Button asChild size="sm" variant="outline">
              <Link to="/su-co/import-history">Lịch sử nhập</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/su-co/moi"><FilePlus2 className="mr-1 h-4 w-4" /> Báo cáo ban đầu</Link>
            </Button>
          </div>
        }
      />

      {/* Dải thống kê gọn */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-card px-4 py-3 text-sm">
        <Stat icon={AlertTriangle} label="Sự cố" value={stats.total} />
        <Stat icon={Activity} label="Đang mở" value={stats.open} tone="text-amber-600 dark:text-amber-400" />
        <Stat icon={AlertTriangle} label="Nghiêm trọng" value={stats.severe} tone="text-red-600 dark:text-red-400" />
        <Stat icon={Clock} label="Downtime" value={fmtDowntime(stats.downtime)} tone="text-sky-600 dark:text-sky-400" />
        <Stat icon={Clock} label="MTTR" value={formatKpiValue(stats.mttr, fmtDowntime)} tone="text-sky-600 dark:text-sky-400" />
        <div className="ml-auto">
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thời gian</SelectItem>
              <SelectItem value="week">Tuần này</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sự cố đang xảy ra — báo cáo ban đầu chưa có thời gian kết thúc */}
      {ongoing.length > 0 && (
        <Card className="border-orange-300 bg-orange-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-orange-800">
              <Flame className="h-4 w-4 text-orange-600" /> Sự cố đang xảy ra ({ongoing.length})
              <InfoHint>Sự cố đã lập báo cáo ban đầu nhưng chưa có thời gian kết thúc. Bấm “Báo cáo kết thúc” để điền thời gian kết thúc &amp; tình hình hiện tại, đóng sự cố và ghi vào sổ lý lịch.</InfoHint>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ongoing.map((g) => (
              <div key={g.key} className="flex flex-col gap-2 rounded-md border border-orange-200 bg-card p-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {g.ma_nhom_bc && <span className="font-mono text-xs text-primary">{g.ma_nhom_bc}</span>}
                    <Badge variant="secondary" className={getMucDoSuCoToken(g.muc_do)?.class}>{g.muc_do}</Badge>
                    <span className="text-xs text-muted-foreground">{g.ngay_phat_hien.replace("T", " ")}</span>
                  </div>
                  <div className="mt-1 truncate text-sm font-medium">{g.hien_tuong}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Network className="h-3 w-3" /> {g.ht}</span>
                    <span className="inline-flex items-center gap-1"><HardDrive className="h-3 w-3" /> {g.devices.slice(0, 3).join(", ")}{g.devices.length > 3 ? ` +${g.devices.length - 3}` : ""}</span>
                  </div>
                </div>
                {canManageState && (
                  <Button size="sm" className="shrink-0 bg-orange-600 hover:bg-orange-700" onClick={() => openClose(g)}>
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Báo cáo kết thúc
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Đã khắc phục — chờ đóng hồ sơ chính thức */}
      {resolvedAwaitingFinalize.length > 0 && (
        <Card className="border-emerald-300 bg-emerald-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Đã khắc phục — chờ đóng hồ sơ ({resolvedAwaitingFinalize.length})
              <InfoHint>Sự cố đã khắc phục xong; bấm “Đóng hồ sơ” để kết thúc chính thức (chuyển sang trạng thái “Đóng”). Chỉ admin / phòng KT thao tác được.</InfoHint>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resolvedAwaitingFinalize.slice(0, 20).map((s) => {
              const dev = devByMa.get(s.thiet_bi);
              return (
                <div key={s.ma_su_co} className="flex flex-col gap-2 rounded-md border border-emerald-200 bg-card p-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to="/su-co/$maSuCo" params={{ maSuCo: s.ma_su_co }} className="font-mono text-xs text-primary hover:underline">{s.ma_su_co}</Link>
                      <Badge variant="secondary" className={getMucDoSuCoToken(s.muc_do)?.class}>{s.muc_do}</Badge>
                      <span className="text-xs text-muted-foreground">Khắc phục: {(s.thoi_diem_khac_phuc ?? "").replace("T", " ")}</span>
                    </div>
                    <div className="mt-1 truncate text-sm font-medium">{s.hien_tuong}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Network className="h-3 w-3" /> {htNameOf(s)}</span>
                      <span className="inline-flex items-center gap-1"><HardDrive className="h-3 w-3" /> {dev?.ten || s.thiet_bi}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                    onClick={() => finalizeM.mutate(s.ma_su_co)}
                    disabled={finalizeM.isPending}
                  >
                    {finalizeM.isPending
                      ? <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      : <CheckCircle2 className="mr-1 h-4 w-4" />}
                    Đóng hồ sơ
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Chất lượng theo hệ thống */}
      <div className="grid gap-4 lg:grid-cols-3">


        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Network className="h-4 w-4 text-primary" /> Chất lượng theo hệ thống
              <InfoHint>Hệ thống nhiều sự cố / downtime cao là hệ thống cần ưu tiên xử lý. Cột cuối là tài sản hư hỏng nhiều nhất trong hệ thống.</InfoHint>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bySystem.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Chưa có sự cố nào trong kỳ.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hệ thống</TableHead>
                      <TableHead className="text-right">Sự cố</TableHead>
                      <TableHead className="text-right">Đang mở</TableHead>
                      <TableHead className="text-right">Downtime</TableHead>
                      <TableHead>Hay hỏng nhất</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bySystem.slice(0, 12).map((r) => (
                      <TableRow key={r.key}>
                        <TableCell className="font-medium">
                          {r.ten}
                          {r.severe > 0 && <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700">{r.severe} nghiêm trọng</Badge>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{r.count}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.open || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{fmtDowntime(r.downtime)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.worst ? <>{r.worst.ten} <span className="text-foreground/60">({r.worst.count})</span></> : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Thành phần hay hư hỏng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {byDevice.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu.</p>
            ) : byDevice.map((d, i) => (
              <div key={d.ma} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60">
                <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: d.ma }} className="block truncate font-medium text-primary hover:underline">{d.ten}</Link>
                  <div className="truncate text-xs text-muted-foreground">{d.ht}</div>
                </div>
                <Badge variant="secondary" className="shrink-0">{d.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Nhật ký sự cố gọn */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Nhật ký sự cố</CardTitle>
              <InfoHint>Tick chọn các dòng cần xuất (hoặc chọn tất cả), sau đó bấm “Xuất báo cáo” ở thanh hành động phía trên bảng. Có thể lọc theo tuần/tháng ở dải thống kê để chọn nhanh.</InfoHint>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportList(suCo.filter((s) => inPeriod(s, "week")), "Tuần này")}
              >
                <FileDown className="mr-1 h-4 w-4" /> Xuất tuần này
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportList(suCo.filter((s) => inPeriod(s, "month")), "Tháng này")}
              >
                <FileDown className="mr-1 h-4 w-4" /> Xuất tháng này
              </Button>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Mã SC, tài sản, hệ thống..." className="h-9 w-56 pl-9" />
              </div>
              <Select value={tt} onValueChange={setTt}>
                <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Mọi trạng thái</SelectItem>
                  {statuses("su_co").map((s) => <SelectItem key={s.code} value={s.code}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <StandardTable
            tableKey="su_co_nhat_ky_list"
            columns={logColumns}
            rows={rows}
            getRowId={(s) => s.ma_su_co}
            selectable
            bulkActions={({ selectedRows, clear }) => (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    exportList(selectedRows, `${selectedRows.length} sự cố đã chọn`);
                    clear();
                  }}
                >
                  <FileDown className="mr-1 h-4 w-4" /> Xuất báo cáo ({selectedRows.length})
                </Button>
                <ContextualToolbar
                  selectionCount={selectedRows.length}
                  onDismiss={clear}
                  actions={[
                    {
                      id: "export-word",
                      label: "Xuất Word",
                      icon: FileDownIcon,
                      supportsBulk: true,
                      onSelect: () => {
                        exportList(selectedRows, `${selectedRows.length} sự cố đã chọn`);
                        clear();
                      },
                    },
                    {
                      id: "close",
                      label: "Đóng sự cố",
                      icon: XCircle,
                      supportsBulk: false,
                      onSelect: () => {
                        const first = selectedRows[0];
                        if (!first) return;
                        if (!isOpenState(first.trang_thai)) toast.info("Sự cố này đã đóng");
                        else toast.info("Vui lòng đóng sự cố ở khu vực 'Sự cố đang xảy ra'");
                      },
                    },
                  ]}
                />
              </>
            )}
            emptyContent={
              <EmptyState
                icon={AlertTriangle}
                title="Không có sự cố phù hợp"
                description="Không có sự cố nào khớp bộ lọc hiện tại. Thử mở rộng khoảng thời gian hoặc tạo báo cáo mới."
                action={
                  <Button asChild size="sm" variant="outline">
                    <Link to="/su-co/moi"><FilePlus2 className="mr-1 h-4 w-4" /> Tạo sự cố</Link>
                  </Button>
                }
              />
            }
          />

          {filtered.length > 40 && (
            <div className="mt-3 text-center">
              <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
                <ChevronDown className={`mr-1 h-4 w-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
                {showAll ? "Thu gọn" : `Xem tất cả ${filtered.length} sự cố`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog báo cáo kết thúc */}
      <Dialog open={!!closing} onOpenChange={(o) => !o && setClosing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Báo cáo kết thúc sự cố</DialogTitle>
            <DialogDescription>
              {closing?.hien_tuong}
              {closing && closing.ma_list.length > 1 ? ` · ${closing.ma_list.length} tài sản` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Thời gian kết thúc *</Label>
              <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div>
              <Label>Tình hình hiện tại / biện pháp khắc phục *</Label>
              <Textarea value={tinhHinh} onChange={(e) => setTinhHinh(e.target.value)} rows={4}
                placeholder="Mô tả tình hình hiện tại và biện pháp đã xử lý để đóng sự cố…" />
            </div>
            <div>
              <Label>Thời gian gián đoạn (phút)</Label>
              <Input type="number" min={0} value={downtime} onChange={(e) => setDowntime(e.target.value)}
                placeholder="Tuỳ chọn" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClosing(null)}>Huỷ</Button>
            <Button onClick={() => closeM.mutate()} disabled={closeM.isPending} className="bg-orange-600 hover:bg-orange-700">
              {closeM.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
              Đóng sự cố &amp; ghi sổ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; tone?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${tone ?? "text-muted-foreground"}`} />
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-semibold tabular-nums ${tone ?? ""}`}>{typeof value === "number" ? value.toLocaleString("vi-VN") : value}</span>
    </PageBody>

  );
}
