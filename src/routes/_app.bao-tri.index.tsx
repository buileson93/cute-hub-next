import { PageHeader } from "@/components/mirats/PageHeader";
import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoHint } from "@/components/mirats/InfoHint";
import { useMemo, useState } from "react";
import { Search, Wrench, CheckCircle2, CalendarClock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/mirats/StatusBadge";
import { statuses, normalizeLegacy } from "@/lib/mirats/trang-thai";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useScope } from "@/lib/mirats/scope";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";
import type { BaoTri } from "@/lib/mirats/types";

export const Route = createFileRoute("/_app/bao-tri/")({
  head: () => ({
    meta: [
      { title: "Bảo dưỡng — MIRATS 2.0" },
      { name: "description", content: "M4 — Phiếu bảo dưỡng, lịch PM định kỳ và bảng kiểm bảo dưỡng hạng mục." },
      { property: "og:title", content: "Bảo dưỡng — MIRATS 2.0" },
      { property: "og:description", content: "Số hoá phiếu bảo dưỡng và quản lý kế hoạch bảo dưỡng định kỳ." },
    ],
  }),
  component: BaoTriPage,
});

import { getLoaiBaoTriToken } from "@/lib/mirats/ui/status-tokens";




function BaoTriPage() {
  const { baoTri, thietBi, heThong, donVi } = useScope();
  const thietBiMap = useMemo(() => new Map(thietBi.map((t) => [t.ma_thiet_bi, t])), [thietBi]);
  const heThongMap = useMemo(() => new Map(heThong.map((h) => [h.ma, h])), [heThong]);
  const donViMap = useMemo(() => new Map(donVi.map((d) => [d.ma, d])), [donVi]);
  const [tab, setTab] = useState("phieu");
  const [query, setQuery] = useState("");
  const [loai, setLoai] = useState("all");
  const [tt, setTt] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return baoTri.filter((b) => {
      if (loai !== "all" && b.loai_bao_tri !== loai) return false;
      if (tt !== "all" && normalizeLegacy("bao_tri", b.trang_thai) !== tt) return false;
      if (!q) return true;
      const tb = thietBiMap.get(b.thiet_bi);
      return (
        b.ma_bao_tri.toLowerCase().includes(q) ||
        b.thiet_bi.toLowerCase().includes(q) ||
        b.mo_ta_cong_viec.toLowerCase().includes(q) ||
        (tb?.ten.toLowerCase().includes(q) ?? false)
      );
    }).sort((a, b) => b.ngay_bat_dau.localeCompare(a.ngay_bat_dau));
  }, [query, loai, tt, baoTri, thietBiMap]);

  const stats = useMemo(() => {
    const s = { total: filtered.length, done: 0, plan: 0 };
    for (const x of filtered) {
      if (x.trang_thai === "Hoàn thành") s.done++;
      if (x.trang_thai === "Kế hoạch" || x.trang_thai === "Đang thực hiện") s.plan++;
    }
    return s;
  }, [filtered]);

  const columns: StdColumn<BaoTri>[] = useMemo(() => [
    {
      key: "ma_bao_tri", label: "Mã BT", filter: "text", sortable: true,
      value: (b) => b.ma_bao_tri,
      cell: (b) => (
        <Link to="/bao-tri/$maBaoTri" params={{ maBaoTri: b.ma_bao_tri }} className="font-mono text-xs text-primary hover:underline">
          {b.ma_bao_tri}
        </Link>
      ),
    },
    {
      key: "ngay_bat_dau", label: "Ngày bắt đầu", sortable: true,
      value: (b) => b.ngay_bat_dau,
      cell: (b) => <span className="whitespace-nowrap text-xs text-muted-foreground">{b.ngay_bat_dau}</span>,
    },
    {
      key: "thiet_bi", label: "Tài sản", filter: "text",
      value: (b) => thietBiMap.get(b.thiet_bi)?.ten ?? b.thiet_bi,
      cell: (b) => {
        const tb = thietBiMap.get(b.thiet_bi);
        const dvo = donViMap.get(b.don_vi);
        return tb ? (
          <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: tb.ma_thiet_bi }} className="text-primary hover:underline">
            <div className="font-medium">{tb.ten}</div>
            <div className="text-xs font-mono text-muted-foreground">{tb.ma_thiet_bi} · {dvo?.ma}</div>
          </Link>
        ) : <span className="text-xs text-muted-foreground">{b.thiet_bi}</span>;
      },
    },
    {
      key: "he_thong", label: "Hệ thống", filter: "cat",
      value: (b) => heThongMap.get(b.he_thong)?.ten ?? "—",
      cell: (b) => <span className="text-sm">{heThongMap.get(b.he_thong)?.ten ?? "—"}</span>,
    },
    {
      key: "loai_bao_tri", label: "Loại", filter: "cat",
      value: (b) => b.loai_bao_tri,
      cell: (b) => <Badge variant="secondary" className={loaiColor[b.loai_bao_tri] ?? ""}>{b.loai_bao_tri}</Badge>,
    },
    {
      key: "don_vi_thuc_hien", label: "Đơn vị TH", filter: "cat",
      value: (b) => b.don_vi_thuc_hien,
      cell: (b) => <span className="text-sm">{b.don_vi_thuc_hien}</span>,
    },
    {
      key: "trang_thai", label: "Trạng thái", filter: "cat",
      value: (b) => b.trang_thai,
      cell: (b) => <StatusBadge domain="bao_tri" code={b.trang_thai} />,
    },
  ], [thietBiMap, heThongMap, donViMap]);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Wrench}
        title="Bảo dưỡng"
        help="Lập phiếu bảo dưỡng, lên lịch bảo dưỡng định kỳ và kiểm tra theo bảng kiểm bảo dưỡng hạng mục."
        actions={
          <Button asChild>
            <Link to="/bao-tri/moi"><Wrench className="mr-2 h-4 w-4" />Tạo phiếu bảo dưỡng</Link>
          </Button>
        }
      />


      {/* Dải thống kê gọn */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-card px-4 py-3 text-sm">
        <Stat icon={Wrench} label="Phiếu bảo dưỡng" value={stats.total} />
        <Stat icon={CheckCircle2} label="Đã hoàn thành" value={stats.done} tone="text-emerald-600" />
        <Stat icon={CalendarClock} label="Chờ / Đang thực hiện" value={stats.plan} tone="text-amber-600" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="phieu">Phiếu bảo dưỡng</TabsTrigger>
          <TabsTrigger value="ke-hoach">Kế hoạch PM</TabsTrigger>
        </TabsList>

        <TabsContent value="phieu" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Danh sách phiếu</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Mã BT, tài sản, mô tả..." className="h-9 w-56 pl-9" />
                  </div>
                  <Select value={loai} onValueChange={setLoai}>
                    <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Loại" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Mọi loại</SelectItem>
                      {Object.keys(loaiColor).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={tt} onValueChange={setTt}>
                    <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Mọi trạng thái</SelectItem>
                      {statuses("bao_tri").map((s) => <SelectItem key={s.code} value={s.code}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <StandardTable<BaoTri>
                tableKey="bao_tri_phieu_list"
                columns={columns}
                rows={filtered}
                getRowId={(b) => b.ma_bao_tri}
                requireFilterToShow={false}
                emptyText="Không có phiếu phù hợp."
                countUnit="phiếu"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ke-hoach" className="mt-3">
          <Card>
            <CardHeader>
              <CardTitle>Kế hoạch bảo dưỡng định kỳ (PM)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-12 text-center">
                <CalendarClock className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">Chưa có kế hoạch PM nào</p>
                <p className="max-w-md text-xs text-muted-foreground">
                  Kế hoạch bảo dưỡng định kỳ được lưu trong CSDL (bảng chính sách bảo dưỡng) và hiện chưa có bản ghi.
                  Thêm chính sách bảo dưỡng cho từng nhóm hệ thống để tự động sinh lịch PM.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; tone?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${tone ?? "text-muted-foreground"}`} />
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-semibold tabular-nums ${tone ?? ""}`}>{typeof value === "number" ? value.toLocaleString("vi-VN") : value}</span>
    </div>
  );
}
