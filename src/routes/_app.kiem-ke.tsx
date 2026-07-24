import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ClipboardCheck,
  Search,
  Loader2,
  ExternalLink,
  CalendarClock,
  AlertTriangle,
  Building2,
  LayoutGrid,
  Table2,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StandardTable } from "@/components/mirats/StandardTable";
import { InfoHint } from "@/components/mirats/InfoHint";
import { PageHeader } from "@/components/mirats/PageHeader";
import { KiemKeDialog, type KiemKeSubmitInput } from "@/components/mirats/KiemKeDialog";
import {
  useDueForInventory,
  useGhiKiemKe,
  uploadKiemKeAnh,
  removeKiemKeAnh,
  ghiKiemKeVoiAnh,
  type DueDevice,
  type KiemKeInput,
} from "@/lib/mirats/kiem-ke";
import { useDbTaxonomy } from "@/lib/mirats/db-taxonomy";
import { useScope } from "@/lib/mirats/scope";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/kiem-ke")({
  head: () => ({
    meta: [
      { title: "Kiểm kê tài sản — MIRATS 2.0" },
      {
        name: "description",
        content:
          "Danh sách tài sản đến hạn kiểm kê, ghi nhận tình trạng, ảnh hiện trường và vị trí GPS.",
      },
      { property: "og:title", content: "Kiểm kê tài sản — MIRATS 2.0" },
      { property: "og:description", content: "Kiểm kê tài sản đến hạn ngoài hiện trường." },
    ],
  }),
  component: KiemKePage,
});

function trangThaiHan(ngay: string | null): { label: string; cls: string; qua: boolean } {
  if (!ngay) return { label: "Chưa kiểm kê", cls: "bg-slate-100 text-slate-700", qua: false };
  const today = new Date().toISOString().slice(0, 10);
  const days = Math.round((new Date(today).getTime() - new Date(ngay).getTime()) / 86400000);
  if (days > 0) return { label: `Quá hạn ${days} ngày`, cls: "bg-red-100 text-red-700", qua: true };
  return { label: "Đến hạn hôm nay", cls: "bg-amber-100 text-amber-700", qua: false };
}

function KiemKePage() {
  const { scopeAll, donViCode } = useScope();
  const { hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");
  const { data, isLoading, error } = useDueForInventory();
  const { data: taxo } = useDbTaxonomy();
  const ghi = useGhiKiemKe();
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "table">(() => {
    if (typeof window === "undefined") return "grid";
    return (localStorage.getItem("kiem-ke:view") as "grid" | "table") || "grid";
  });
  function changeView(v: "grid" | "table") {
    setView(v);
    if (typeof window !== "undefined") localStorage.setItem("kiem-ke:view", v);
  }

  const donViMap = useMemo(() => {
    const m = new Map<string, { ma: string; ten: string }>();
    for (const d of taxo?.donViList ?? []) m.set(d.id, { ma: d.ma, ten: d.ten });
    return m;
  }, [taxo]);

  const rows = useMemo(() => {
    let list = data ?? [];
    if (!scopeAll && donViCode) {
      list = list.filter((d) => !d.don_vi_id || donViMap.get(d.don_vi_id)?.ma === donViCode);
    }
    const kw = q.trim().toLowerCase();
    if (kw) {
      list = list.filter(
        (d) =>
          d.ma_thiet_bi?.toLowerCase().includes(kw) ||
          d.ten_thiet_bi?.toLowerCase().includes(kw) ||
          (d.vi_tri ?? "").toLowerCase().includes(kw),
      );
    }
    return list;
  }, [data, scopeAll, donViCode, donViMap, q]);

  const quaHan = rows.filter((d) => trangThaiHan(d.ngay_kiem_ke_ke_tiep).qua).length;

  async function handleSubmit(dev: DueDevice, input: KiemKeSubmitInput) {
    setBusyId(dev.id);
    try {
      // Điều phối upload + ghi kiểm kê nguyên tử: nếu RPC lỗi sau khi ảnh đã
      // upload, file mồ côi sẽ được xoá tự động (removeKiemKeAnh).
      await ghiKiemKeVoiAnh(
        dev.id,
        {
          tinhTrang: input.tinhTrang,
          viTriGps: input.viTriGps,
          ghiChu: input.ghiChu || null,
        },
        input.file,
        {
          upload: uploadKiemKeAnh,
          rpc: (payload: KiemKeInput) => ghi.mutateAsync(payload),
          remove: removeKiemKeAnh,
        },
      );
      toast.success(`Đã kiểm kê ${dev.ma_thiet_bi}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kiểm kê thất bại");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ClipboardCheck}
        title="Kiểm kê tài sản"
        help="Danh sách tài sản đã đến hạn hoặc chưa từng kiểm kê. Mở ô kiểm kê để ghi tình trạng, chụp ảnh và lấy vị trí GPS ngoài hiện trường."
        actions={
          <div className="flex gap-2">
            <Card className="min-w-[9rem]">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">Đến hạn</div>
                <div className="text-2xl font-semibold">{rows.length}</div>
              </CardContent>
            </Card>
            <Card className="min-w-[9rem]">
              <CardContent className="p-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3 text-red-500" /> Quá hạn
                </div>
                <div className="text-2xl font-semibold text-red-600">{quaHan}</div>
              </CardContent>
            </Card>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-md flex-1 min-w-[16rem]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo mã, tên hoặc vị trí tài sản…"
            className="pl-9"
          />
        </div>
        <div className="flex rounded-md border p-0.5">
          <Button
            type="button"
            size="sm"
            variant={view === "grid" ? "secondary" : "ghost"}
            className="h-8 gap-1.5 px-2.5"
            onClick={() => changeView("grid")}
          >
            <LayoutGrid className="h-4 w-4" /> Lưới
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "table" ? "secondary" : "ghost"}
            className="h-8 gap-1.5 px-2.5"
            onClick={() => changeView("table")}
          >
            <Table2 className="h-4 w-4" /> Bảng
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải danh sách…
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Không tải được danh sách kiểm kê.
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <ClipboardCheck className="h-8 w-8 opacity-40" />
            <p className="text-sm">Không có tài sản nào đến hạn kiểm kê. 🎉</p>
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((dev) => {
            const st = trangThaiHan(dev.ngay_kiem_ke_ke_tiep);
            const dv = dev.don_vi_id ? donViMap.get(dev.don_vi_id) : null;
            return (
              <Card key={dev.id} className={cn("flex flex-col", st.qua && "border-red-200")}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        {dev.ten_thiet_bi || dev.ma_thiet_bi}
                      </CardTitle>
                      <CardDescription className="truncate">{dev.ma_thiet_bi}</CardDescription>
                    </div>
                    <Badge variant="outline" className={cn("shrink-0 border-transparent", st.cls)}>
                      {st.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 pt-0 text-sm">
                  <div className="space-y-1 text-muted-foreground">
                    {dev.vi_tri && <div className="truncate">📍 {dev.vi_tri}</div>}
                    {dv && (
                      <div className="flex items-center gap-1 truncate">
                        <Building2 className="h-3.5 w-3.5" /> {dv.ten}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {dev.ngay_kiem_ke_ke_tiep
                        ? `Hạn: ${new Date(dev.ngay_kiem_ke_ke_tiep).toLocaleDateString("vi-VN")}`
                        : "Chưa có lịch kiểm kê"}
                    </div>
                  </div>
                  <div className="mt-auto flex items-center gap-2">
                    <KiemKeDialog
                      thietBi={{
                        maThietBi: dev.ma_thiet_bi,
                        ten: dev.ten_thiet_bi || dev.ma_thiet_bi,
                      }}
                      canManage={canManage}
                      pending={busyId === dev.id}
                      onSubmit={(input) => handleSubmit(dev, input)}
                    />
                    <Link
                      to="/thiet-bi/$maThietBi"
                      params={{ maThietBi: dev.ma_thiet_bi }}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Chi tiết <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <StandardTable
          tableKey="kiem_ke_due_list"
          rows={rows}
          getRowId={(dev) => dev.id}
          requireFilterToShow={false}
          rowClassName={(dev) => (trangThaiHan(dev.ngay_kiem_ke_ke_tiep).qua ? "bg-red-50/50" : "")}
          emptyContent={<div className="py-8 text-center text-sm text-muted-foreground">Không có tài sản đến hạn.</div>}
          columns={[
            { key: "ma_thiet_bi", label: "Mã tài sản", filter: "text", value: (d) => d.ma_thiet_bi, cell: (d) => <span className="font-mono text-xs">{d.ma_thiet_bi}</span> },
            { key: "ten", label: "Tên tài sản", filter: "text", value: (d) => d.ten_thiet_bi || d.ma_thiet_bi, cell: (d) => <span className="max-w-[16rem] truncate">{d.ten_thiet_bi || d.ma_thiet_bi}</span> },
            { key: "vi_tri", label: "Vị trí", filter: "text", value: (d) => d.vi_tri ?? "", cell: (d) => <span className="max-w-[12rem] truncate text-muted-foreground">{d.vi_tri || "—"}</span> },
            {
              key: "don_vi", label: "Đơn vị", filter: "cat",
              value: (d) => (d.don_vi_id ? donViMap.get(d.don_vi_id)?.ten ?? "" : ""),
              cell: (d) => { const dv = d.don_vi_id ? donViMap.get(d.don_vi_id) : null; return <span className="max-w-[12rem] truncate text-muted-foreground">{dv?.ten || "—"}</span>; },
            },
            {
              key: "han", label: "Hạn kế tiếp", sortable: true,
              value: (d) => d.ngay_kiem_ke_ke_tiep ?? "",
              cell: (d) => <span className="whitespace-nowrap text-muted-foreground">{d.ngay_kiem_ke_ke_tiep ? new Date(d.ngay_kiem_ke_ke_tiep).toLocaleDateString("vi-VN") : "—"}</span>,
            },
            {
              key: "trang_thai", label: "Trạng thái", filter: "cat",
              value: (d) => trangThaiHan(d.ngay_kiem_ke_ke_tiep).label,
              cell: (d) => { const st = trangThaiHan(d.ngay_kiem_ke_ke_tiep); return <Badge variant="outline" className={cn("border-transparent", st.cls)}>{st.label}</Badge>; },
            },
            {
              key: "actions", label: "Thao tác", align: "right",
              cell: (dev) => (
                <div className="flex items-center justify-end gap-2">
                  <KiemKeDialog
                    thietBi={{ maThietBi: dev.ma_thiet_bi, ten: dev.ten_thiet_bi || dev.ma_thiet_bi }}
                    canManage={canManage}
                    pending={busyId === dev.id}
                    onSubmit={(input) => handleSubmit(dev, input)}
                  />
                  <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: dev.ma_thiet_bi }} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    Chi tiết <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              ),
            },
          ]}
        />
      )}

    </div>
  );
}
