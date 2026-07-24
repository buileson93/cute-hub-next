import { PageHeader } from "@/components/mirats/PageHeader";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList, Search, Loader2, RefreshCw, CheckCircle2, Play,
  AlertTriangle, Gauge, TrendingUp, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { InfoHint } from "@/components/mirats/InfoHint";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import {
  useCongViecBaoTri, useKpiBaoTri, useSinhPhieuDinhKy, useHoanThanhPhieu, useCapNhatPhieu,
  hieuLucPhieu, UU_TIEN_META,
} from "@/lib/mirats/cong-viec-bao-tri";
import { findOrphans } from "@/lib/mirats/bao-tri-consistency";
import { VatTuTieuHaoInline } from "@/components/mirats/VatTuTieuHaoInline";
import { isOpen as isOpenStatus, phaseOf, normalizeLegacy } from "@/lib/mirats/trang-thai";

export const Route = createFileRoute("/_app/bao-tri/cong-viec")({
  head: () => ({
    meta: [
      { title: "Phiếu công việc & KPI bảo dưỡng — MIRATS 2.0" },
      { name: "description", content: "Sinh phiếu công việc bảo dưỡng định kỳ từ chính sách PM, theo dõi tiến độ và KPI đúng hạn theo đơn vị." },
      { property: "og:title", content: "Phiếu công việc & KPI bảo dưỡng — MIRATS 2.0" },
      { property: "og:description", content: "Chính sách bảo dưỡng → phiếu công việc → KPI." },
    ],
  }),
  component: CongViecPage,
});

function CongViecPage() {
  const { hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");
  const { data: rows, isLoading, error } = useCongViecBaoTri();
  const { data: kpi } = useKpiBaoTri();
  const sinh = useSinhPhieuDinhKy();
  const hoanThanh = useHoanThanhPhieu();
  const capNhat = useCapNhatPhieu();

  const [tab, setTab] = useState("phieu");
  const [q, setQ] = useState("");
  const [tt, setTt] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [xong, setXong] = useState<{ id: string; ma: string } | null>(null);

  const list = useMemo(() => rows ?? [], [rows]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: list.length,
      done: list.filter((c) => phaseOf("cong_viec", normalizeLegacy("cong_viec", c.trang_thai)) === "closed").length,
      open: list.filter((c) => isOpenStatus("cong_viec", normalizeLegacy("cong_viec", c.trang_thai))).length,
      overdue: list.filter((c) => isOpenStatus("cong_viec", normalizeLegacy("cong_viec", c.trang_thai)) && c.ngay_den_han && c.ngay_den_han < today).length,
    };
  }, [list]);

  // Biên bản bảo dưỡng (bao_tri) — nạp để đối soát orphan
  const { data: bienBanRows } = useQuery({
    queryKey: ["bao_tri", "orphan-check"],
    queryFn: async () => {
      const { fetchAllRows } = await import("@/lib/mirats/paginate");
      return fetchAllRows<{ id: string; ma_bao_tri: string | null; thiet_bi_id: string | null }>((from, to) =>
        supabase.from("bao_tri").select("id, ma_bao_tri, thiet_bi_id").range(from, to),
      );
    },
    staleTime: 30_000,
  });

  const orphans = useMemo(() => {
    const phieuIn = list.map((c) => ({
      id: c.id,
      trang_thai: c.trang_thai,
      thiet_bi_id: c.thiet_bi_id ?? "",
    }));
    // Xây bảng ngược: bao_tri.id -> cong_viec.id (qua cong_viec_bao_tri.bao_tri_id)
    const revMap = new Map<string, string>();
    for (const c of list) {
      if (c.bao_tri_id) revMap.set(c.bao_tri_id, c.id);
    }
    const bienBanIn = (bienBanRows ?? []).map((b) => ({
      id: b.ma_bao_tri ?? b.id,
      cong_viec_id: revMap.get(b.id) ?? null,
      thiet_bi_id: b.thiet_bi_id ?? "",
    }));
    return findOrphans(phieuIn, bienBanIn);
  }, [list, bienBanRows]);

  // Map id -> ma_cong_viec để hiển thị mã trong cảnh báo
  const maByPhieuId = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of list) m.set(c.id, c.ma_cong_viec ?? c.id);
    return m;
  }, [list]);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return list.filter((c) => {
      if (tt === "overdue") {
        if (!hieuLucPhieu(c).quaHan) return false;
      } else if (tt !== "all" && c.trang_thai !== tt) return false;
      if (!kw) return true;
      return (
        (c.ma_cong_viec ?? "").toLowerCase().includes(kw) ||
        (c.thiet_bi?.ma_thiet_bi ?? "").toLowerCase().includes(kw) ||
        (c.thiet_bi?.ten_thiet_bi ?? "").toLowerCase().includes(kw)
      );
    });
  }, [list, q, tt]);

  async function onSinh() {
    try {
      const n = await sinh.mutateAsync();
      toast.success(n > 0 ? `Đã sinh ${n} phiếu công việc định kỳ` : "Không có tài sản nào đến hạn");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không sinh được phiếu");
    }
  }

  async function onHoanThanh(id: string) {
    setBusy(id);
    try {
      await hoanThanh.mutateAsync({ id });
      toast.success("Đã hoàn thành phiếu và cập nhật chu kỳ bảo dưỡng");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi cập nhật");
    } finally {
      setBusy(null);
    }
  }

  async function onBatDau(id: string) {
    setBusy(id);
    try {
      await capNhat.mutateAsync({ id, trang_thai: "DANG_LAM", ngay_bat_dau: new Date().toISOString().slice(0, 10) });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi cập nhật");
    } finally {
      setBusy(null);
    }
  }

  type CongViecItem = typeof list[number];

  const columns: StdColumn<CongViecItem>[] = useMemo(() => {
    const base: StdColumn<CongViecItem>[] = [
      {
        key: "ma_cong_viec", label: "Mã WO", filter: "text", sortable: true,
        value: (c) => c.ma_cong_viec ?? "",
        cell: (c) => <span className="font-mono text-xs">{c.ma_cong_viec}</span>,
      },
      {
        key: "thiet_bi", label: "Tài sản", filter: "text",
        value: (c) => `${c.thiet_bi?.ma_thiet_bi ?? ""} ${c.thiet_bi?.ten_thiet_bi ?? ""}`,
        cell: (c) => (
          <div className="max-w-[240px]">
            <div className="truncate font-medium">{c.thiet_bi?.ten_thiet_bi ?? "—"}</div>
            <div className="truncate text-xs text-muted-foreground">{c.thiet_bi?.ma_thiet_bi}</div>
          </div>
        ),
      },
      {
        key: "loai", label: "Loại", filter: "cat",
        value: (c) => (c.loai === "CM" ? "Khắc phục" : "Định kỳ"),
        cell: (c) => <Badge variant="outline">{c.loai === "CM" ? "Khắc phục" : "Định kỳ"}</Badge>,
      },
      {
        key: "uu_tien", label: "Ưu tiên", filter: "cat",
        value: (c) => (UU_TIEN_META[c.uu_tien] ?? UU_TIEN_META.TRUNG_BINH).label,
        cell: (c) => {
          const ut = UU_TIEN_META[c.uu_tien] ?? UU_TIEN_META.TRUNG_BINH;
          return <Badge className={ut.cls}>{ut.label}</Badge>;
        },
      },
      {
        key: "ngay_den_han", label: "Đến hạn", sortable: true,
        value: (c) => c.ngay_den_han ?? "",
        cell: (c) => <span className="text-sm">{c.ngay_den_han ?? "—"}</span>,
      },
      {
        key: "trang_thai", label: "Trạng thái", filter: "cat",
        value: (c) => hieuLucPhieu(c).label,
        cell: (c) => {
          const hl = hieuLucPhieu(c);
          return <Badge className={hl.cls}>{hl.label}</Badge>;
        },
      },
    ];
    if (canManage) {
      base.push({
        key: "actions", label: "", align: "right",
        cell: (c) => isOpenStatus("cong_viec", normalizeLegacy("cong_viec", c.trang_thai)) ? (
          <div className="flex justify-end gap-1">
            {c.he_thong_id && (
              <Button asChild size="sm" variant="ghost">
                <Link to="/bao-tri/moi" search={{ heThong: c.he_thong_id, version: c.template_version_id ?? undefined, congViec: c.id }}>
                  <FileText className="mr-1 h-3.5 w-3.5" />Lập biên bản
                </Link>
              </Button>
            )}
            {normalizeLegacy("cong_viec", c.trang_thai) === "mo" && (
              <Button size="sm" variant="ghost" disabled={busy === c.id} onClick={(e) => { e.stopPropagation(); onBatDau(c.id); }}>
                <Play className="mr-1 h-3.5 w-3.5" />Bắt đầu
              </Button>
            )}
            <Button size="sm" variant="ghost" disabled={busy === c.id} onClick={(e) => { e.stopPropagation(); setXong({ id: c.id, ma: c.ma_cong_viec ?? "" }); }}>
              {busy === c.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
              Xong
            </Button>
          </div>
        ) : null,
      });
    }
    return base;
  }, [canManage, busy]);


  return (
    <div className="space-y-4">
      <PageHeader
        icon={ClipboardList}
        title="Phiếu công việc & KPI"
        help="Sinh phiếu công việc bảo dưỡng định kỳ từ chính sách PM theo chủng loại, theo dõi tiến độ và KPI đúng hạn theo đơn vị."
        actions={
          canManage ? (
            <Button onClick={onSinh} disabled={sinh.isPending}>
              {sinh.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Sinh phiếu định kỳ
            </Button>
          ) : null
        }
      />


      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-card px-4 py-3 text-sm">
        <Stat icon={ClipboardList} label="Tổng phiếu" value={stats.total} />
        <Stat icon={CheckCircle2} label="Hoàn thành" value={stats.done} tone="text-emerald-600" />
        <Stat icon={Play} label="Đang mở" value={stats.open} tone="text-sky-600" />
        <Stat icon={AlertTriangle} label="Quá hạn" value={stats.overdue} tone="text-red-600" />
      </div>

      {(orphans.phieuThieuBienBan.length > 0 || orphans.bienBanKhongThuocPhieu.length > 0) && (
        <Card className="border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" /> Cần đối soát Bảo dưỡng
            </CardTitle>
            <CardDescription>
              Phát hiện dữ liệu trôi giữa phiếu công việc và biên bản bảo dưỡng.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {orphans.phieuThieuBienBan.length > 0 && (
              <div>
                <div className="font-medium">
                  Phiếu HOÀN THÀNH nhưng chưa có biên bản ({orphans.phieuThieuBienBan.length}):
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {orphans.phieuThieuBienBan.slice(0, 30).map((id) => (
                    <Badge key={id} variant="outline" className="font-mono text-[11px]">
                      {maByPhieuId.get(id) ?? id}
                    </Badge>
                  ))}
                  {orphans.phieuThieuBienBan.length > 30 && (
                    <span className="text-xs text-muted-foreground">
                      +{orphans.phieuThieuBienBan.length - 30} khác
                    </span>
                  )}
                </div>
              </div>
            )}
            {orphans.bienBanKhongThuocPhieu.length > 0 && (
              <div>
                <div className="font-medium">
                  Biên bản không thuộc phiếu công việc nào ({orphans.bienBanKhongThuocPhieu.length}):
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {orphans.bienBanKhongThuocPhieu.slice(0, 30).map((id) => (
                    <Badge key={id} variant="outline" className="font-mono text-[11px]">
                      {id}
                    </Badge>
                  ))}
                  {orphans.bienBanKhongThuocPhieu.length > 30 && (
                    <span className="text-xs text-muted-foreground">
                      +{orphans.bienBanKhongThuocPhieu.length - 30} khác
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="phieu">Phiếu công việc</TabsTrigger>
          <TabsTrigger value="kpi">KPI theo đơn vị</TabsTrigger>
        </TabsList>

        <TabsContent value="phieu" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Danh sách phiếu</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mã WO, tài sản..." className="h-9 w-56 pl-9" />
                  </div>
                  <Select value={tt} onValueChange={setTt}>
                    <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Mọi trạng thái</SelectItem>
                      <SelectItem value="MO">Đang mở</SelectItem>
                      <SelectItem value="DANG_LAM">Đang làm</SelectItem>
                      <SelectItem value="overdue">Quá hạn</SelectItem>
                      <SelectItem value="HOAN_THANH">Hoàn thành</SelectItem>
                      <SelectItem value="HUY">Đã huỷ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <StandardTable
                tableKey="bao_tri_cong_viec_list"
                columns={columns}
                rows={filtered}
                getRowId={(c) => c.id}
                trangThai={{ dangTai: isLoading, loi: error ? String((error as Error).message ?? error) : null }}
                emptyContent={
                  <div className="py-10 text-center text-muted-foreground">
                    Chưa có phiếu công việc. {canManage && "Bấm “Sinh phiếu định kỳ” để tạo từ chính sách bảo dưỡng."}
                  </div>
                }
              />

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpi" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Gauge className="h-4 w-4" /> KPI bảo dưỡng theo đơn vị</CardTitle>
              <CardDescription>Tỉ lệ đúng hạn = phiếu hoàn thành trước/đúng ngày đến hạn / tổng phiếu đã hoàn thành.</CardDescription>
            </CardHeader>
            <CardContent>
              {!kpi || kpi.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">Chưa có dữ liệu KPI.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Đơn vị</TableHead>
                        <TableHead className="text-right">Tổng</TableHead>
                        <TableHead className="text-right">Hoàn thành</TableHead>
                        <TableHead className="text-right">Đang mở</TableHead>
                        <TableHead className="text-right">Quá hạn</TableHead>
                        <TableHead className="text-right">Đúng hạn</TableHead>
                        <TableHead className="text-right">Tỉ lệ đúng hạn</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kpi.map((k) => (
                        <TableRow key={k.don_vi_id ?? "none"}>
                          <TableCell className="font-medium">{k.don_vi_ten ?? "Chưa gán đơn vị"}</TableCell>
                          <TableCell className="text-right">{k.tong_cong_viec}</TableCell>
                          <TableCell className="text-right text-emerald-600">{k.da_hoan_thanh}</TableCell>
                          <TableCell className="text-right text-sky-600">{k.dang_mo}</TableCell>
                          <TableCell className="text-right text-red-600">{k.qua_han}</TableCell>
                          <TableCell className="text-right">{k.hoan_thanh_dung_han}</TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-1 font-semibold">
                              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                              {k.ty_le_dung_han != null ? `${k.ty_le_dung_han}%` : "—"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Task 15 — Ghi vật tư tiêu hao trước khi hoàn thành phiếu */}
      <Dialog open={!!xong} onOpenChange={(o) => { if (!o) setXong(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Hoàn thành phiếu {xong?.ma}</DialogTitle>
            <DialogDescription>
              Khai vật tư đã sử dụng (nếu có) — hệ thống sẽ tự tạo bút toán xuất kho và gắn với phiếu công việc này.
            </DialogDescription>
          </DialogHeader>
          {xong && (
            <VatTuTieuHaoInline
              lienKet={{ congViecId: xong.id }}
              onXong={async () => {
                const id = xong.id;
                setXong(null);
                await onHoanThanh(id);
              }}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setXong(null)}>Huỷ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${tone ?? "text-muted-foreground"}`} />
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-semibold ${tone ?? ""}`}>{value}</span>
    </div>
  );
}
