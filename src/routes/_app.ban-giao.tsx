import { PageHeader } from "@/components/mirats/PageHeader";
import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoHint } from "@/components/mirats/InfoHint";
import { useMemo, useState } from "react";
import {
  Search, ArrowLeftRight, User, Building2, PackageCheck, RotateCcw, Repeat, Clock, FileText, ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/mirats/StatusBadge";
import { getLoaiBanGiaoToken } from "@/lib/mirats/ui/status-tokens";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/mirats/Combobox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { useScope } from "@/lib/mirats/scope";
import { supabase } from "@/integrations/backend/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


export const Route = createFileRoute("/_app/ban-giao")({
  head: () => ({
    meta: [
      { title: "Bàn giao & Cấp phát — MIRATS 2.0" },
      { name: "description", content: "M8 — Số hóa lịch sử bàn giao/cấp phát tài sản giữa đơn vị và cá nhân, theo dõi ai đang giữ gì." },
      { property: "og:title", content: "Bàn giao & Cấp phát — MIRATS 2.0" },
      { property: "og:description", content: "Theo dõi cấp phát, thu hồi, luân chuyển và mượn tạm tài sản." },
    ],
  }),
  component: BanGiaoPage,
});


function fmtDate(s: string | null) {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}
function daysBetween(a: string, b: string | null) {
  const end = b ? new Date(b) : new Date();
  return Math.max(0, Math.floor((end.getTime() - new Date(a).getTime()) / 86400000));
}

function BanGiaoPage() {
  const { banGiao, donVi, thietBi } = useScope();
  const [q, setQ] = useState("");
  const [dv, setDv] = useState<string>("all");
  const [loai, setLoai] = useState<string>("all");
  const [tt, setTt] = useState<string>("all");

  const thietBiMap = useMemo(() => new Map(thietBi.map((t) => [t.ma_thiet_bi, t])), [thietBi]);
  const donViMap = useMemo(() => new Map(donVi.map((d) => [d.ma, d])), [donVi]);
  // Chưa có bảng nhân viên riêng — nguoi_nhan/nguoi_giao lưu dạng text, hiển thị trực tiếp.


  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return banGiao
      .filter((b) => {
        if (dv !== "all" && b.don_vi_nhan !== dv) return false;
        if (loai !== "all" && b.loai_ban_giao !== loai) return false;
        if (tt !== "all" && b.trang_thai !== tt) return false;
        if (!s) return true;
        const tb = thietBiMap.get(b.thiet_bi);
        return (
          b.ma_ban_giao.toLowerCase().includes(s) ||
          b.thiet_bi.toLowerCase().includes(s) ||
          (tb?.ten ?? "").toLowerCase().includes(s) ||
          (b.nguoi_nhan ?? "").toLowerCase().includes(s) ||
          (b.nguoi_giao ?? "").toLowerCase().includes(s)
        );

      })
      .sort((a, b) => b.ngay_nhan.localeCompare(a.ngay_nhan));
  }, [q, dv, loai, tt, banGiao, thietBiMap]);

  const stats = useMemo(() => {
    const dangGiu = banGiao.filter((b) => b.trang_thai === "Đang giữ").length;
    const daTra = banGiao.filter((b) => b.trang_thai === "Đã trả").length;
    const capPhat = banGiao.filter((b) => b.loai_ban_giao === "Cấp phát").length;
    const luanChuyen = banGiao.filter((b) => b.loai_ban_giao === "Luân chuyển" || b.loai_ban_giao === "Mượn tạm").length;
    return { dangGiu, daTra, capPhat, luanChuyen, total: banGiao.length };
  }, [banGiao]);

  const perUnit = useMemo(() => {
    const map = new Map<string, { ma: string; ten: string; dangGiu: number; total: number }>();
    for (const d of donVi) map.set(d.ma, { ma: d.ma, ten: d.ten, dangGiu: 0, total: 0 });
    for (const b of banGiao) {
      const row = map.get(b.don_vi_nhan);
      if (!row) continue;
      row.total += 1;
      if (b.trang_thai === "Đang giữ") row.dangGiu += 1;
    }
    return Array.from(map.values()).filter((r) => r.total > 0).sort((a, b) => b.dangGiu - a.dangGiu);
  }, [donVi, banGiao]);

  const holdings = useMemo(() => {
    const latestByDevice = new Map<string, typeof banGiao[number]>();
    for (const b of banGiao) {
      if (b.trang_thai !== "Đang giữ") continue;
      const prev = latestByDevice.get(b.thiet_bi);
      if (!prev || b.ngay_nhan > prev.ngay_nhan) latestByDevice.set(b.thiet_bi, b);
    }
    return Array.from(latestByDevice.values()).sort((a, b) => b.ngay_nhan.localeCompare(a.ngay_nhan));
  }, [banGiao]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        icon={ArrowLeftRight}
        title="Bàn giao & Cấp phát"
        help="Số hóa lịch sử bàn giao tài sản giữa đơn vị và cá nhân — theo dõi tình trạng khi nhận/trả."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 font-mono text-[11px]">
              <ArrowLeftRight className="h-3 w-3" /> {stats.total} phiếu bàn giao
            </Badge>
            <Button size="sm" asChild>
              <Link to="/ban-giao/moi">+ Bàn giao mới</Link>
            </Button>
          </div>
        }
      />


      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><PackageCheck className="h-3.5 w-3.5" /> Đang cấp phát</CardDescription>
            <CardTitle className="text-2xl">{stats.dangGiu}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Tài sản đang do cá nhân/đơn vị giữ
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" /> Đã hoàn trả</CardDescription>
            <CardTitle className="text-2xl">{stats.daTra}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Phiếu đã đóng, tài sản đã thu hồi
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><ArrowLeftRight className="h-3.5 w-3.5" /> Cấp phát mới</CardDescription>
            <CardTitle className="text-2xl">{stats.capPhat}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Số lần cấp phát tài sản lần đầu
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><Repeat className="h-3.5 w-3.5" /> Luân chuyển / mượn</CardDescription>
            <CardTitle className="text-2xl">{stats.luanChuyen}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Điều chuyển giữa các đơn vị/cá nhân
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phân bổ bàn giao theo đơn vị</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={perUnit.slice(0, 12)} margin={{ left: -8, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="ma" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(v) => donViMap.get(String(v))?.ten ?? String(v)}
                />
                <Bar dataKey="dangGiu" name="Đang giữ" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" name="Tổng phiếu" fill="hsl(var(--muted-foreground))" opacity={0.35} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Filters + Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <TabsList>
            <TabsTrigger value="all">Tất cả phiếu ({banGiao.length})</TabsTrigger>
            <TabsTrigger value="holding">Đang cấp phát ({holdings.length})</TabsTrigger>
            <TabsTrigger value="unit">Theo đơn vị</TabsTrigger>
          </TabsList>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã, tài sản, người…" className="pl-8" />
          </div>
          <Select value={loai} onValueChange={setLoai}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Loại" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi loại</SelectItem>
              {Object.keys(loaiColors).map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tt} onValueChange={setTt}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi trạng thái</SelectItem>
              <SelectItem value="Đang giữ">Đang giữ</SelectItem>
              <SelectItem value="Đã trả">Đã trả</SelectItem>
            </SelectContent>
          </Select>
          <Combobox
            className="w-[180px]"
            value={dv}
            onChange={setDv}
            placeholder="Đơn vị nhận"
            searchPlaceholder="Tìm đơn vị…"
            options={[{ value: "all", label: "Mọi đơn vị" }, ...donVi.map((d) => ({ value: d.ma, label: `${d.ma} — ${d.ten}` }))]}
          />
        </div>

        <TabsContent value="all" className="m-0">
          <StandardTable<typeof filtered[number]>
            tableKey="ban_giao_all"
            rows={filtered.slice(0, 200)}
            getRowId={(b) => b.ma_ban_giao}
            requireFilterToShow={false}
            emptyContent={<div className="py-10 text-center text-muted-foreground">Không có phiếu bàn giao phù hợp.</div>}
            columns={[
              { key: "ma", label: "Mã phiếu", filter: "text", value: (b) => b.ma_ban_giao, cell: (b) => <span className="font-mono text-xs">{b.ma_ban_giao}</span> },
              {
                key: "loai", label: "Loại", filter: "cat",
                value: (b) => b.loai_ban_giao,
                cell: (b) => <Badge variant="outline" className={loaiColors[b.loai_ban_giao] ?? ""}>{b.loai_ban_giao}</Badge>,
              },
              {
                key: "thiet_bi", label: "Tài sản", minW: "min-w-[180px]", filter: "text",
                value: (b) => `${thietBiMap.get(b.thiet_bi)?.ten ?? ""} ${b.thiet_bi}`,
                cell: (b) => {
                  const tb = thietBiMap.get(b.thiet_bi);
                  return (
                    <div>
                      {tb ? (
                        <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: tb.ma_thiet_bi }} className="group inline-flex items-center gap-1 hover:text-primary">
                          <span className="font-medium">{tb.ten}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                        </Link>
                      ) : b.thiet_bi}
                      <div className="text-[11px] font-mono text-muted-foreground">{b.thiet_bi}</div>
                    </div>
                  );
                },
              },
              {
                key: "nguoi_nhan", label: "Người nhận", filter: "text",
                value: (b) => b.nguoi_nhan ?? "",
                cell: (b) => <div className="flex items-center gap-1.5 text-sm"><User className="h-3.5 w-3.5 text-muted-foreground" />{b.nguoi_nhan || "—"}</div>,
              },
              {
                key: "don_vi_nhan", label: "Đơn vị nhận", filter: "cat",
                value: (b) => donViMap.get(b.don_vi_nhan)?.ten ?? b.don_vi_nhan,
                cell: (b) => <span className="text-sm">{donViMap.get(b.don_vi_nhan)?.ten ?? b.don_vi_nhan}</span>,
              },
              { key: "ngay_nhan", label: "Ngày nhận", sortable: true, value: (b) => b.ngay_nhan, cell: (b) => <span className="text-sm tabular-nums">{fmtDate(b.ngay_nhan)}</span> },
              { key: "ngay_tra", label: "Ngày trả", sortable: true, value: (b) => b.ngay_tra ?? "", cell: (b) => <span className="text-sm tabular-nums">{fmtDate(b.ngay_tra)}</span> },
              {
                key: "thoi_gian_giu", label: "Thời gian giữ", align: "right", sortable: true,
                sortValue: (b) => daysBetween(b.ngay_nhan, b.ngay_tra),
                value: (b) => daysBetween(b.ngay_nhan, b.ngay_tra),
                cell: (b) => <span className="text-sm text-muted-foreground"><Clock className="mr-1 inline h-3 w-3" />{daysBetween(b.ngay_nhan, b.ngay_tra)} ngày</span>,
              },
              {
                key: "trang_thai", label: "Trạng thái", filter: "cat",
                value: (b) => b.trang_thai,
                cell: (b) => <StatusBadge domain="ban_giao" code={b.trang_thai} />,
              },
              {
                key: "bien_ban", label: "Biên bản", align: "right",
                value: (b) => b.file_bien_ban ?? "",
                cell: (b) => b.file_bien_ban
                  ? <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs"><FileText className="h-3 w-3" />{b.file_bien_ban}</Button>
                  : <span className="text-xs text-muted-foreground">—</span>,
              },
            ]}
          />
          {filtered.length > 200 && (
            <div className="mt-2 text-xs text-muted-foreground">Hiển thị 200/{filtered.length} phiếu — hãy thu hẹp bộ lọc để xem đầy đủ.</div>
          )}
        </TabsContent>

        <TabsContent value="holding" className="m-0">
          <StandardTable<typeof holdings[number]>
            tableKey="ban_giao_holding"
            rows={holdings}
            getRowId={(b) => b.ma_ban_giao}
            requireFilterToShow={false}
            emptyContent={<div className="py-10 text-center text-muted-foreground">Không có tài sản đang cấp phát.</div>}
            columns={[
              {
                key: "thiet_bi", label: "Tài sản", minW: "min-w-[200px]", filter: "text",
                value: (b) => `${thietBiMap.get(b.thiet_bi)?.ten ?? ""} ${b.thiet_bi}`,
                cell: (b) => {
                  const tb = thietBiMap.get(b.thiet_bi);
                  return (
                    <div>
                      {tb ? (
                        <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: tb.ma_thiet_bi }} className="font-medium hover:text-primary">{tb.ten}</Link>
                      ) : b.thiet_bi}
                      <div className="text-[11px] font-mono text-muted-foreground">{b.thiet_bi}</div>
                    </div>
                  );
                },
              },
              { key: "nguoi_nhan", label: "Người đang giữ", filter: "text", value: (b) => b.nguoi_nhan ?? "", cell: (b) => <span className="text-sm">{b.nguoi_nhan || "—"}</span> },
              { key: "don_vi_nhan", label: "Đơn vị", filter: "cat", value: (b) => donViMap.get(b.don_vi_nhan)?.ten ?? b.don_vi_nhan, cell: (b) => <span className="text-sm">{donViMap.get(b.don_vi_nhan)?.ten ?? b.don_vi_nhan}</span> },
              { key: "loai", label: "Loại bàn giao", filter: "cat", value: (b) => b.loai_ban_giao, cell: (b) => <Badge variant="outline" className={loaiColors[b.loai_ban_giao] ?? ""}>{b.loai_ban_giao}</Badge> },
              { key: "ngay_nhan", label: "Từ ngày", sortable: true, value: (b) => b.ngay_nhan, cell: (b) => <span className="text-sm tabular-nums">{fmtDate(b.ngay_nhan)}</span> },
              {
                key: "thoi_gian_giu", label: "Thời gian giữ", align: "right", sortable: true,
                sortValue: (b) => daysBetween(b.ngay_nhan, null),
                value: (b) => daysBetween(b.ngay_nhan, null),
                cell: (b) => <span className="text-sm text-muted-foreground">{daysBetween(b.ngay_nhan, null)} ngày</span>,
              },
              { key: "tinh_trang", label: "Tình trạng khi nhận", value: (b) => b.tinh_trang_khi_nhan ?? "", cell: (b) => <span className="block max-w-[280px] truncate text-sm text-muted-foreground">{b.tinh_trang_khi_nhan}</span> },
              {
                key: "actions", label: "Thao tác", align: "right",
                cell: (b) => <ReturnButton maBanGiao={b.ma_ban_giao} />,
              },
            ]}
          />
        </TabsContent>


        <TabsContent value="unit" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bàn giao theo đơn vị</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead className="text-right">Đang giữ</TableHead>
                    <TableHead className="text-right">Tổng phiếu</TableHead>
                    <TableHead className="text-right">Đã trả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perUnit.map((r) => (
                    <TableRow key={r.ma}>
                      <TableCell>
                        <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /><span className="font-medium">{r.ten}</span></div>
                        <div className="text-[11px] font-mono text-muted-foreground">{r.ma}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{r.dangGiu}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.total}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{r.total - r.dangGiu}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReturnButton({ maBanGiao }: { maBanGiao: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function onClick() {
    setBusy(true);
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from("ban_giao")
      .update({ trang_thai: "Đã trả", ngay_tra: today })
      .eq("ma_ban_giao", maBanGiao);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Đã đánh dấu trả tài sản");
    qc.invalidateQueries({ queryKey: ["operations_data"] });
  }
  return (
    <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy} onClick={onClick}>
      <RotateCcw className="h-3 w-3 mr-1" />Trả
    </Button>
  );
}
