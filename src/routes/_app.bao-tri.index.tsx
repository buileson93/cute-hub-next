import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Wrench, CheckCircle2, CalendarClock, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/mirats/StatusBadge";
import { statuses, normalizeLegacy } from "@/lib/mirats/trang-thai";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useScope } from "@/lib/mirats/scope";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";
import type { BaoTri } from "@/lib/mirats/types";

export const Route = createFileRoute("/_app/bao-tri/")({
  head: () => ({
    meta: [
      { title: "Bảo dưỡng — MIRATS" },
      {
        name: "description",
        content: "M4 — Phiếu bảo dưỡng, lịch PM định kỳ và bảng kiểm bảo dưỡng hạng mục.",
      },
    ],
  }),
  component: BaoTriPage,
});

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
    return baoTri
      .filter((b) => {
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
      })
      .sort((a, b) => b.ngay_bat_dau.localeCompare(a.ngay_bat_dau));
  }, [query, loai, tt, baoTri, thietBiMap]);

  const stats = useMemo(() => {
    const s = { total: filtered.length, done: 0, plan: 0 };
    for (const x of filtered) {
      if (x.trang_thai === "Hoàn thành") s.done++;
      if (x.trang_thai === "Kế hoạch" || x.trang_thai === "Đang thực hiện") s.plan++;
    }
    return s;
  }, [filtered]);

  const columns: StdColumn<BaoTri>[] = useMemo(
    () => [
      {
        key: "ma_bao_tri",
        label: "Mã BT",
        filter: "text",
        sortable: true,
        value: (b) => b.ma_bao_tri,
        cell: (b) => (
          <Link
            to="/bao-tri/$maBaoTri"
            params={{ maBaoTri: b.ma_bao_tri }}
            className="font-mono text-xs text-primary hover:underline"
          >
            {b.ma_bao_tri}
          </Link>
        ),
      },
      {
        key: "ngay_bat_dau",
        label: "Ngày bắt đầu",
        sortable: true,
        hideBelow: "xl",
        value: (b) => b.ngay_bat_dau,
        cell: (b) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">{b.ngay_bat_dau}</span>
        ),
      },
      {
        key: "thiet_bi",
        label: "Tài sản",
        filter: "text",
        value: (b) => thietBiMap.get(b.thiet_bi)?.ten ?? b.thiet_bi,
        cell: (b) => {
          const tb = thietBiMap.get(b.thiet_bi);
          const dvo = donViMap.get(b.don_vi);
          return tb ? (
            <Link
              to="/thiet-bi/$maThietBi"
              params={{ maThietBi: tb.ma_thiet_bi }}
              search={{ tab: "tong-quan", doc: undefined, q: undefined }}
              className="text-primary hover:underline"
            >
              <div className="font-medium text-sm">{tb.ten}</div>
              <div className="text-[10px] font-mono text-muted-foreground">
                {tb.ma_thiet_bi} · {dvo?.ma}
              </div>
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">{b.thiet_bi}</span>
          );
        },
      },
      {
        key: "loai_bao_tri",
        label: "Loại",
        filter: "cat",
        hideBelow: "lg",
        value: (b) => b.loai_bao_tri,
        cell: (b) => (
          <StatusBadge domain="bao_tri" code={b.loai_bao_tri} label={b.loai_bao_tri} />
        ),
      },
      {
        key: "trang_thai",
        label: "Trạng thái",
        filter: "cat",
        hideBelow: "sm",
        value: (b) => b.trang_thai,
        cell: (b) => <StatusBadge domain="bao_tri" code={b.trang_thai} />,
      },
    ],
    [thietBiMap, donViMap],
  );

  return (
    <PageFrame density="compact" layout="workspace">
      <PageHeader
        icon={Wrench}
        title="Bảo dưỡng kỹ thuật"
        subtitle="Quản lý phiếu bảo dưỡng và kế hoạch PM"
        breadcrumbs={[
          { label: "Vận hành", to: "/he-thong/cay" },
          { label: "Bảo dưỡng" },
        ]}
        actions={
          <Button asChild size="sm">
            <Link to="/bao-tri/moi">
              <Plus className="mr-2 h-4 w-4" />
              Tạo phiếu mới
            </Link>
          </Button>
        }
      />
      <PageBody noPadding className="relative flex flex-col bg-muted/5 overflow-hidden flex-1 min-h-0">
        <div className="flex flex-col h-full gap-4 p-4 overflow-hidden">
          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border bg-card px-3 py-2 text-[11px]">
            <Stat icon={Wrench} label="Phiếu bảo dưỡng" value={stats.total} />
            <Stat
              icon={CheckCircle2}
              label="Hoàn thành"
              value={stats.done}
              tone="text-emerald-600"
            />
            <Stat
              icon={CalendarClock}
              label="Kế hoạch / Thực hiện"
              value={stats.plan}
              tone="text-amber-600"
            />
          </div>

          <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-fit">
              <TabsTrigger value="phieu">Phiếu bảo dưỡng</TabsTrigger>
              <TabsTrigger value="ke-hoach">Kế hoạch PM</TabsTrigger>
            </TabsList>

            <TabsContent value="phieu" className="flex-1 mt-3 overflow-hidden">
              <div className="flex flex-col h-full gap-3 overflow-hidden">
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Tìm mã BT, tài sản..."
                      className="h-8 w-64 pl-8 text-xs"
                    />
                  </div>
                  <Select value={loai} onValueChange={setLoai}>
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue placeholder="Loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Mọi loại</SelectItem>
                      {["Định kỳ", "Đột xuất", "Hiệu chuẩn", "Nâng cấp"].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={tt} onValueChange={setTt}>
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Mọi trạng thái</SelectItem>
                      {statuses("bao_tri").map((s) => (
                        <SelectItem key={s.code} value={s.code}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 overflow-hidden border rounded-lg bg-card">
                  <StandardTable<BaoTri>
                    tableKey="bao_tri_phieu_list"
                    className="astryx-table h-full"
                    maxHeightClass="h-full overflow-y-auto"
                    columns={columns}
                    rows={filtered}
                    getRowId={(b) => b.ma_bao_tri}
                    requireFilterToShow={false}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ke-hoach" className="flex-1 mt-3 overflow-hidden">
              <Card className="h-full border-dashed flex items-center justify-center">
                <div className="text-center p-8 max-w-sm">
                  <CalendarClock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold mb-1">Chưa có kế hoạch PM</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Kế hoạch bảo dưỡng định kỳ sẽ tự động hiển thị khi bạn cấu hình chính sách bảo dưỡng cho hệ thống.
                  </p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageBody>
    </PageFrame>
  );
}

function Stat({ icon: Icon, label, value, tone }: any) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`h-3.5 w-3.5 ${tone || "text-muted-foreground"}`} />
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-mono font-medium ${tone || ""}`}>
        {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
      </span>
    </div>
  );
}
