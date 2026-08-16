import { MiratsPageHeader, MiratsPageBody } from "@/components/astryx/MiratsPageLayout";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MiratsHeading, MiratsText } from "@/components/astryx/MiratsTypography";
import { useMemo, useState } from "react";
import {
  Search, HeartPulse, TrendingDown, TrendingUp, AlertTriangle, ShieldCheck,
  Calendar, ExternalLink, Activity,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";
import { getXepLoaiHealthToken, XEP_LOAI_HEALTH_TOKEN } from "@/lib/mirats/ui/status-tokens";
import { cn } from "@/lib/utils";


import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/mirats/Combobox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from "recharts";
import {
  healthDetail, tuoiThoConLai, namThayThe,
} from "@/lib/mirats/metrics";
import { fmtDowntime, fmtVND } from "@/lib/mirats/format";
import { useScope } from "@/lib/mirats/scope";
import { useDbTaxonomy } from "@/lib/mirats/db-taxonomy";

export const Route = createFileRoute("/_app/tuoi-tho")({
  head: () => ({
    meta: [
      { title: "Tuổi thọ & Vòng đời — MIRATS 2.0" },
      { name: "description", content: "M9 — Đánh giá health score, xếp loại A/B/C/D và dự báo thay thế tài sản." },
      { property: "og:title", content: "Tuổi thọ & Vòng đời — MIRATS 2.0" },
      { property: "og:description", content: "Health score, xu hướng suy giảm và ngân sách thay thế theo năm." },
    ],
  }),
  component: TuoiThoPage,
});


function TuoiThoPage() {
  const { thietBi, donVi } = useScope();
  const { data: tax } = useDbTaxonomy();
  const donViMap = useMemo(() => new Map(donVi.map((d) => [d.ma, d])), [donVi]);
  const nhomHeThongMap = useMemo(
    () => new Map(Array.from(tax?.nhomNameMap ?? []).map(([id, ten]) => [id, { ten }])),
    [tax],
  );
  const heThongMap = useMemo(
    () => new Map((tax?.htList ?? []).map((h) => [h.ma, { nhom: h.nhomId }])),
    [tax],
  );
  const [q, setQ] = useState("");
  const [dv, setDv] = useState<string>("all");
  const [loai, setLoai] = useState<string>("all");

  const rows = useMemo(() => {
    const today = new Date();
    return thietBi.map((t) => {
      const h = healthDetail(t, today);
      return {
        t,
        h,
        conLai: tuoiThoConLai(t, today),
        namThay: namThayThe(t, today),
      };
    });
  }, [thietBi]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (dv !== "all" && r.t.don_vi !== dv) return false;
        if (loai !== "all" && r.h.xepLoai !== loai) return false;
        if (!s) return true;
        return r.t.ma_thiet_bi.toLowerCase().includes(s) || r.t.ten.toLowerCase().includes(s);
      })
      .sort((a, b) => a.h.score - b.h.score);
  }, [rows, q, dv, loai]);

  const distribution = useMemo(() => {
    const buckets: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const r of rows) buckets[r.h.xepLoai]++;
    return (["A", "B", "C", "D"] as const).map((k) => ({
      loai: k, count: buckets[k], hex: XEP_LOAI_HEALTH_TOKEN[k].hex,

    }));
  }, [rows]);

  const stats = useMemo(() => {
    const avg = rows.reduce((s, r) => s + r.h.score, 0) / (rows.length || 1);
    const d = rows.filter((r) => r.h.xepLoai === "D").length;
    const c = rows.filter((r) => r.h.xepLoai === "C").length;
    const totalReplaceCost = rows.filter((r) => r.h.xepLoai === "D" || r.h.xepLoai === "C")
      .reduce((s, r) => s + (r.t.gia_tri_mua ?? 0), 0);
    return { avg: Math.round(avg), d, c, total: rows.length, totalReplaceCost };
  }, [rows]);

  // Xu hướng health score theo quý CẦN snapshot lịch sử thật (chưa lưu trong CSDL).
  // Không bịa số bằng cách "già hoá" điểm hiện tại — chỉ tính điểm THẬT của quý hiện tại.
  const trend = useMemo(() => {
    const today = new Date();
    const q = Math.floor(today.getMonth() / 3) + 1;
    const label = `Q${q}/${today.getFullYear()}`;
    let sum = 0, d = 0, c = 0;
    for (const r of rows) {
      const s = r.h.score;
      sum += s;
      if (s < 40) d++;
      else if (s < 60) c++;
    }
    if (rows.length === 0) return [] as Array<{ ky: string; avg: number; D: number; C: number }>;
    return [{ ky: label, avg: Math.round(sum / rows.length), D: d, C: c }];
  }, [rows]);


  // Replacement forecast by year
  const forecast = useMemo(() => {
    const map = new Map<number, { nam: number; count: number; chiPhi: number }>();
    for (const r of rows) {
      if (r.h.xepLoai !== "C" && r.h.xepLoai !== "D") continue;
      const y = r.namThay;
      if (!map.has(y)) map.set(y, { nam: y, count: 0, chiPhi: 0 });
      const row = map.get(y)!;
      row.count += 1;
      row.chiPhi += r.t.gia_tri_mua ?? 0;
    }
    return Array.from(map.values()).sort((a, b) => a.nam - b.nam).slice(0, 10);
  }, [rows]);

  return (
    <MiratsPageBody padding={0}>
      <MiratsPageHeader
        icon={HeartPulse}
        title="Đánh giá Tuổi thọ & Vòng đời"
        description="Đánh giá sức khỏe tài sản dựa trên tuổi, lịch sử sự cố, thời gian dừng hoạt động, chi phí, bảo hành và tình trạng hiện tại; xếp loại và đề xuất thay thế khi cần."
        actions={
          <Badge variant="outline" className="gap-1.5 font-mono text-[11px]">
            <HeartPulse className="h-3 w-3" /> {stats.total} tài sản đánh giá
          </Badge>
        }
      />


      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Health score TB</CardDescription>
            <CardTitle className="text-2xl">{stats.avg}<span className="text-sm text-muted-foreground">/100</span></CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Progress value={stats.avg} className="h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Loại A + B</CardDescription>
            <CardTitle className="text-2xl">
              {distribution[0].count + distribution[1].count}
              <span className="text-sm text-muted-foreground"> / {stats.total}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Tỷ lệ {Math.round(((distribution[0].count + distribution[1].count) / stats.total) * 100)}% tài sản đạt yêu cầu
          </CardContent>
        </Card>
        <Card className={stats.d > 0 ? "border-red-500/40" : ""}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Loại C / D</CardDescription>
            <CardTitle className="text-2xl">
              <span className="text-amber-600">{stats.c}</span>
              <span className="text-muted-foreground"> + </span>
              <span className="text-red-600">{stats.d}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Cần tăng cường BT / ưu tiên thay thế
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><TrendingDown className="h-3.5 w-3.5" /> Ngân sách thay thế</CardDescription>
            <CardTitle className="text-2xl">{fmtVND(stats.totalReplaceCost)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Ước tính cho toàn bộ loại C + D theo giá trị gốc
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Phân bổ xếp loại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={distribution} dataKey="count" nameKey="loai" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {distribution.map((d) => <Cell key={d.loai} fill={d.hex} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 @sm:grid-cols-4 gap-2 text-center text-xs">
              {distribution.map((d) => (
                <div key={d.loai}>
                  <div className="mx-auto h-2 w-2 rounded-full" style={{ background: d.hex }} />
                  <div className="mt-1 font-mono font-semibold">{d.count}</div>
                  <div className="text-muted-foreground">Loại {d.loai}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Xu hướng health score theo quý</CardTitle>
          </CardHeader>
          <CardContent>
            {trend.length <= 1 ? (
              <div className="flex h-56 flex-col items-center justify-center gap-2 text-center">
                <div className="text-3xl font-mono font-semibold">
                  {trend.length === 1 ? trend[0].avg : "—"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Health TB {trend.length === 1 ? `quý ${trend[0].ky}` : "hiện tại"}
                </div>
                <p className="mt-2 max-w-sm text-xs text-muted-foreground">
                  Chưa đủ dữ liệu để vẽ xu hướng theo quý. Biểu đồ này chỉ hiển thị khi hệ thống
                  đã lưu snapshot health score theo thời gian.
                </p>
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer>
                  <LineChart data={trend} margin={{ left: -8, right: 8, top: 8 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="ky" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="avg" name="Health TB" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="C" name="Loại C" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="D" name="Loại D" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" /> Dự báo thay thế theo năm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={forecast} margin={{ left: -8, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="nam" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => fmtVND(v as number)} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(val: number, name: string) => name === "Chi phí" ? fmtVND(val) : val}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="count" name="Số tài sản" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="chiPhi" name="Chi phí" fill="hsl(var(--muted-foreground))" opacity={0.4} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <TabsList>
            <TabsTrigger value="all">Tất cả ({rows.length})</TabsTrigger>
            <TabsTrigger value="critical">
              Cần thay {stats.d > 0 && <Badge variant="outline" className="ml-2 h-4 border-red-500/40 px-1 text-[10px] text-red-600">{stats.d}</Badge>}
            </TabsTrigger>
          </TabsList>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã, tên tài sản…" className="pl-8" />
          </div>
          <Select value={loai} onValueChange={setLoai}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Xếp loại" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi loại</SelectItem>
              <SelectItem value="A">A — Tốt</SelectItem>
              <SelectItem value="B">B — Khá</SelectItem>
              <SelectItem value="C">C — Yếu</SelectItem>
              <SelectItem value="D">D — Kém</SelectItem>
            </SelectContent>
          </Select>
          <Combobox
            className="w-[180px]"
            value={dv}
            onChange={setDv}
            placeholder="Đơn vị"
            searchPlaceholder="Tìm đơn vị…"
            options={[{ value: "all", label: "Mọi đơn vị" }, ...donVi.map((d) => ({ value: d.ma, label: `${d.ma} — ${d.ten}` }))]}
          />
        </div>

        <TabsContent value="all" className="m-0">
          <StandardTable<typeof filtered[number]>
            tableKey="tuoi_tho_all"
            rows={filtered.slice(0, 200)}
            getRowId={(r) => r.t.ma_thiet_bi}
            requireFilterToShow={false}
            emptyContent={<div className="py-10 text-center text-muted-foreground">Không có tài sản phù hợp</div>}
            columns={[
              {
                key: "thiet_bi", label: "Tài sản", minW: "min-w-[200px]",
                value: (r) => `${r.t.ten} ${r.t.ma_thiet_bi}`,
                cell: (r) => (
                  <div>
                    <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: r.t.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }} className="group inline-flex items-center gap-1 font-medium hover:text-primary">
                      {r.t.ten}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                    </Link>
                    <div className="text-[11px] font-mono text-muted-foreground">{r.t.ma_thiet_bi}</div>
                  </div>
                ),
              },
              { key: "don_vi", label: "Đơn vị", hideBelow: "md", value: (r) => donViMap.get(r.t.don_vi)?.ten ?? r.t.don_vi, cell: (r) => <span className="text-sm">{donViMap.get(r.t.don_vi)?.ten ?? r.t.don_vi}</span> },
              {
                key: "he_thong", label: "Hệ thống", hideBelow: "md",
                value: (r) => {
                  const nht = heThongMap.get(r.t.he_thong)?.nhom;
                  return nht ? (nhomHeThongMap.get(nht)?.ten ?? "") : "";
                },
                cell: (r) => {
                  const nht = heThongMap.get(r.t.he_thong)?.nhom;
                  return <span className="text-sm text-muted-foreground">{nht ? nhomHeThongMap.get(nht)?.ten : "—"}</span>;
                },
              },
              {
                key: "health", label: "Health", sortable: true, minW: "min-w-[140px]", hideBelow: "2xl",
                sortValue: (r) => r.h.score,
                value: (r) => r.h.score,
                cell: (r) => (
                  <div className="flex items-center gap-2">
                    <span className="w-8 tabular-nums text-sm font-semibold">{r.h.score}</span>
                    <Progress value={r.h.score} className="h-1.5 w-20" />
                  </div>
                ),
              },
              {
                key: "xep_loai", label: "Xếp loại", filter: "cat", hideBelow: "sm",
                value: (r) => r.h.xepLoai,
                cell: (r) => {
                  const token = getXepLoaiHealthToken(r.h.xepLoai);
                  return <Badge variant="outline" className={cn(token?.class, "font-mono border")}>{r.h.xepLoai}</Badge>;
                },
              },
              { key: "pt_vong_doi", label: "% Vòng đời", align: "right", sortable: true, hideBelow: "2xl", sortValue: (r) => r.h.ptVongDoi, value: (r) => r.h.ptVongDoi, cell: (r) => <span className="tabular-nums text-sm">{r.h.ptVongDoi}%</span> },
              {
                key: "su_co_12t", label: "Sự cố 12t", align: "right", sortable: true, hideBelow: "2xl",
                sortValue: (r) => r.h.suCo12t, value: (r) => r.h.suCo12t,
                cell: (r) => r.h.suCo12t > 0 ? <span className="text-orange-600 tabular-nums text-sm">{r.h.suCo12t}</span> : <span className="text-muted-foreground tabular-nums text-sm">0</span>,
              },
              { key: "downtime", label: "Downtime", align: "right", sortable: true, hideBelow: "2xl", sortValue: (r) => r.h.downtime12t, value: (r) => r.h.downtime12t, cell: (r) => <span className="text-sm text-muted-foreground">{fmtDowntime(r.h.downtime12t) || "—"}</span> },
              {
                key: "con_lai", label: "Còn lại", align: "right", sortable: true, hideBelow: "2xl",
                sortValue: (r) => r.conLai, value: (r) => r.conLai,
                cell: (r) => r.conLai > 0 ? <span className="tabular-nums text-sm">{r.conLai} năm</span> : <span className="text-red-600 font-semibold tabular-nums text-sm">Hết</span>,
              },
              { key: "khuyen_nghi", label: "Khuyến nghị", hideBelow: "2xl", value: (r) => r.h.khuyenNghi, cell: (r) => <span className="text-xs">{r.h.khuyenNghi}</span> },
            ]}
          />
          {filtered.length > 200 && (
            <div className="mt-2 text-xs text-muted-foreground">Hiển thị 200/{filtered.length} tài sản — hãy thu hẹp bộ lọc để xem đầy đủ.</div>
          )}
        </TabsContent>

        <TabsContent value="critical" className="m-0">
          <StandardTable<typeof rows[number]>
            tableKey="tuoi_tho_critical"
            rows={rows.filter((r) => r.h.xepLoai === "C" || r.h.xepLoai === "D").sort((a, b) => a.h.score - b.h.score).slice(0, 100)}
            getRowId={(r) => r.t.ma_thiet_bi}
            requireFilterToShow={false}
            emptyContent={<div className="py-10 text-center text-muted-foreground">Không có tài sản cần ưu tiên thay</div>}
            columns={[
              {
                key: "thiet_bi", label: "Tài sản", minW: "min-w-[200px]",
                value: (r) => `${r.t.ten} ${r.t.ma_thiet_bi}`,
                cell: (r) => (
                  <div>
                    <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: r.t.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }} className="font-medium hover:text-primary">{r.t.ten}</Link>
                    <div className="text-[11px] font-mono text-muted-foreground">{r.t.ma_thiet_bi}</div>
                  </div>
                ),
              },
              { key: "don_vi", label: "Đơn vị", hideBelow: "md", value: (r) => donViMap.get(r.t.don_vi)?.ten ?? r.t.don_vi, cell: (r) => <span className="text-sm">{donViMap.get(r.t.don_vi)?.ten ?? r.t.don_vi}</span> },
              {
                key: "health", label: "Health", sortable: true, minW: "min-w-[140px]", hideBelow: "2xl",
                sortValue: (r) => r.h.score, value: (r) => r.h.score,
                cell: (r) => (
                  <div className="flex items-center gap-2">
                    <span className="w-8 tabular-nums text-sm font-semibold">{r.h.score}</span>
                    <Progress value={r.h.score} className="h-1.5 w-20" />
                  </div>
                ),
              },
              {
                key: "xep_loai", label: "Loại", filter: "cat", hideBelow: "sm",
                value: (r) => r.h.xepLoai,
                cell: (r) => {
                  const token = getXepLoaiHealthToken(r.h.xepLoai);
                  return <Badge variant="outline" className={cn(token?.class, "font-mono border")}>{r.h.xepLoai}</Badge>;

                },
              },
              { key: "pt_vong_doi", label: "% Vòng đời", align: "right", sortable: true, hideBelow: "2xl", sortValue: (r) => r.h.ptVongDoi, value: (r) => r.h.ptVongDoi, cell: (r) => <span className="tabular-nums text-sm">{r.h.ptVongDoi}%</span> },
              {
                key: "ty_le_chi_phi", label: "Chi phí BT / Giá trị", align: "right", sortable: true, hideBelow: "2xl",
                sortValue: (r) => r.h.tyLeChiPhi, value: (r) => r.h.tyLeChiPhi,
                cell: (r) => <span className={`tabular-nums text-sm ${r.h.tyLeChiPhi > 30 ? "text-orange-600" : ""}`}>{r.h.tyLeChiPhi.toFixed(1)}%</span>,
              },
              {
                key: "nam_thay", label: "Năm thay dự kiến", align: "right", sortable: true, hideBelow: "xl",
                sortValue: (r) => r.namThay, value: (r) => r.namThay,
                cell: (r) => r.namThay <= new Date().getFullYear() + 1 ? <span className="text-red-600 tabular-nums text-sm font-semibold">{r.namThay}</span> : <span className="tabular-nums text-sm font-semibold">{r.namThay}</span>,
              },
              { key: "gia_tri", label: "Giá trị gốc", align: "right", sortable: true, hideBelow: "2xl", sortValue: (r) => r.t.gia_tri_mua ?? 0, value: (r) => r.t.gia_tri_mua ?? 0, cell: (r) => <span className="tabular-nums text-sm">{fmtVND(r.t.gia_tri_mua ?? 0)}</span> },
            ]}
          />
        </TabsContent>
      </Tabs>
    </MiratsPageBody>
  );
}
