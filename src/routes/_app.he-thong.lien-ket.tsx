import { PageHeader } from "@/components/mirats/PageHeader";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GraphCanvas, type LegendItem } from "@/components/mirats/GraphCanvas";
import { toCoreGraph } from "@/lib/mirats/system-graph";
import type { LayoutKind } from "@/lib/mirats/graph-layout";
import { filterGraph, egoGraph } from "@/lib/mirats/graph-core";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Link2, Plus, Trash2, Table2, Waypoints, AlertTriangle, ArrowRight, ArrowLeftRight, Filter, Ban, Play,
} from "lucide-react";
import { InfoHint } from "@/components/mirats/InfoHint";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/mirats/Combobox";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { LienKetForm } from "@/components/mirats/LienKetForm";
import { NetworkOverview } from "@/components/mirats/NetworkOverview";
import {
  useLoaiLienKet, useDoThiHeThong, useHeThongPickList, useAddLienKet, useUpdateLienKet, useDeleteLienKet,
  usePhanTichTacDong, LOP_LABEL,
} from "@/lib/mirats/lien-ket";
import {
  buildSystemGraph, LOAI_LIEN_KET_LABEL,
  type DoThiRow, type LoaiLienKetMa,
} from "@/lib/mirats/system-graph";

export const Route = createFileRoute("/_app/he-thong/lien-ket")({
  head: () => ({
    meta: [
      { title: "Liên kết hệ thống — MIRATS" },
      { name: "description", content: "Quản lý đấu nối thực tế giữa các hệ thống (VHF↔VCCS…): luồng tín hiệu, phụ thuộc dịch vụ, dự phòng, phân tích tác động." },
    ],
  }),
  component: LienKetPage,
});

function LienKetPage() {
  const { hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");

  const { rows, isLoading } = useDoThiHeThong();
  const { loaiList } = useLoaiLienKet();
  const { heThongList } = useHeThongPickList();
  const addMut = useAddLienKet();
  const updMut = useUpdateLienKet();
  const delMut = useDeleteLienKet();

  const [view, setView] = useState<"bang" | "so-do" | "toan-canh">("bang");

  // Bộ lọc
  const [fHeThong, setFHeThong] = useState("");
  const [fLoai, setFLoai] = useState("");
  const [fDonVi, setFDonVi] = useState("");

  const donViOptions = useMemo(() => {
    const set = new Map<string, string>();
    for (const r of rows) {
      if (r.nguon_don_vi) set.set(r.nguon_don_vi, r.nguon_don_vi);
      if (r.dich_don_vi) set.set(r.dich_don_vi, r.dich_don_vi);
    }
    return Array.from(set.keys()).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (fHeThong && r.nguon_id !== fHeThong && r.dich_id !== fHeThong) return false;
      if (fLoai && r.loai_ma !== fLoai) return false;
      if (fDonVi && r.nguon_don_vi !== fDonVi && r.dich_don_vi !== fDonVi) return false;
      return true;
    });
  }, [rows, fHeThong, fLoai, fDonVi]);

  const [addOpen, setAddOpen] = useState(false);
  const htOptions = heThongList.map((h) => ({ value: h.id, label: `${h.ten} (${h.ma})` }));

  const submitAdd = (input: Parameters<typeof addMut.mutate>[0]) => {
    addMut.mutate(input, {
      onSuccess: () => {
        toast.success("Đã thêm liên kết");
        setAddOpen(false);
      },
      onError: (e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        toast.error(
          msg.includes("ux_lkht_canh_hieu_luc")
            ? "Liên kết này đã tồn tại (trùng cạnh đang hiệu lực)."
            : msg.includes("row-level security") || msg.includes("permission")
              ? "Bạn không có quyền thêm liên kết."
              : msg,
        );
      },
    });
  };

  const setTrangThai = (id: string, trang_thai: "hoat_dong" | "tam_ngung") => {
    updMut.mutate({ id, patch: { trang_thai } }, {
      onSuccess: () => toast.success(trang_thai === "tam_ngung" ? "Đã ngừng liên kết" : "Đã kích hoạt liên kết"),
      onError: (e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        toast.error(msg.includes("row-level security") || msg.includes("permission") ? "Bạn không có quyền cập nhật liên kết." : msg);
      },
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Link2}
        title="Liên kết hệ thống"
        help="Quản lý đấu nối thực tế giữa các hệ thống (ví dụ VHF ↔ VCCS). Mỗi liên kết là dữ liệu bậc-nhất, truy vấn và phân tích tác động được — không chỉ là hình vẽ."
        actions={
          <div className="flex items-center gap-2">

          <div className="inline-flex rounded-md border p-0.5">
            <Button size="sm" variant={view === "bang" ? "default" : "ghost"} onClick={() => setView("bang")}>
              <Table2 className="mr-1 h-4 w-4" /> Bảng
            </Button>
            <Button size="sm" variant={view === "so-do" ? "default" : "ghost"} onClick={() => setView("so-do")}>
              <Waypoints className="mr-1 h-4 w-4" /> Sơ đồ
            </Button>
            <Button size="sm" variant={view === "toan-canh" ? "default" : "ghost"} onClick={() => setView("toan-canh")}>
              <Waypoints className="mr-1 h-4 w-4" /> Toàn cảnh
            </Button>
          </div>
          {canManage && (
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Thêm liên kết</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Thêm liên kết hệ thống</DialogTitle>
                  <DialogDescription>Khai báo đấu nối giữa hai hệ thống.</DialogDescription>
                </DialogHeader>
                <LienKetForm
                  heThongOptions={htOptions}
                  loaiList={loaiList}
                  existingEdges={rows}
                  onSubmit={submitAdd}
                  onCancel={() => setAddOpen(false)}
                  submitting={addMut.isPending}
                />
              </DialogContent>
            </Dialog>
          )}
          </div>
        }
      />


      {/* Bộ lọc */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="w-56">
            <Combobox
              options={[{ value: "", label: "Tất cả hệ thống" }, ...htOptions]}
              value={fHeThong} onChange={setFHeThong} placeholder="Lọc theo hệ thống…"
            />
          </div>
          <Select value={fLoai || "__all"} onValueChange={(v) => setFLoai(v === "__all" ? "" : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Loại liên kết" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Tất cả loại</SelectItem>
              {loaiList.map((l) => <SelectItem key={l.id} value={l.ma}>{l.ten}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fDonVi || "__all"} onValueChange={(v) => setFDonVi(v === "__all" ? "" : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Đơn vị" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Tất cả đơn vị</SelectItem>
              {donViOptions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="ml-auto">{filtered.length} liên kết</Badge>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : view === "bang" ? (
        <LienKetTable
          rows={filtered}
          canManage={canManage}
          onDelete={(id) => delMut.mutate(id, {
            onSuccess: () => toast.success("Đã xóa liên kết"),
            onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
          })}
          onSetTrangThai={setTrangThai}
        />
      ) : view === "toan-canh" ? (
        <NetworkOverview canManage={canManage} />
      ) : (
        <GraphView rows={filtered} allRows={rows} />
      )}
    </div>
  );
}

function loaiBadge(ma: string, mau?: string | null) {
  const label = LOAI_LIEN_KET_LABEL[ma as LoaiLienKetMa] ?? ma;
  if (mau) {
    return (
      <Badge
        variant="outline"
        style={{ borderColor: mau, color: mau }}
        className="gap-1"
      >
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: mau }} />
        {label}
      </Badge>
    );
  }
  return <Badge variant="outline">{label}</Badge>;
}

function LienKetTable({ rows, canManage, onDelete, onSetTrangThai }: {
  rows: DoThiRow[];
  canManage: boolean;
  onDelete: (id: string) => void;
  onSetTrangThai: (id: string, trang_thai: "hoat_dong" | "tam_ngung") => void;
}) {
  if (rows.length === 0) {
    return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Chưa có liên kết nào khớp bộ lọc.</CardContent></Card>;
  }
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="p-3">Nguồn</th>
                <th className="p-3"></th>
                <th className="p-3">Đích</th>
                <th className="p-3">Loại</th>
                <th className="p-3">Lớp</th>
                <th className="p-3">Giao diện / Giao thức</th>
                <th className="p-3">Trạng thái</th>
                {canManage && <th className="p-3"></th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const active = r.trang_thai === "hoat_dong";
                return (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{r.nguon_ten}</td>
                  <td className="p-3 text-muted-foreground">
                    {r.huong === "hai_chieu" ? <ArrowLeftRight className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  </td>
                  <td className="p-3 font-medium">{r.dich_ten}</td>
                  <td className="p-3">{loaiBadge(r.loai_ma, r.mau_sac)}</td>
                  <td className="p-3">{LOP_LABEL[r.lop]}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {[r.giao_dien_nguon, r.giao_dien_dich].filter(Boolean).join(" → ") || "—"}
                    {r.giao_thuc ? ` · ${r.giao_thuc}` : ""}
                  </td>
                  <td className="p-3">
                    <Badge variant={active ? "default" : "secondary"}>
                      {active ? "Hoạt động" : r.trang_thai === "tam_ngung" ? "Tạm ngừng" : "Ngừng"}
                    </Badge>
                  </td>
                  {canManage && (
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {active ? (
                          <Button
                            size="icon" variant="ghost" className="h-8 w-8"
                            title="Ngừng (không xóa cứng)"
                            onClick={() => onSetTrangThai(r.id, "tam_ngung")}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="icon" variant="ghost" className="h-8 w-8 text-primary"
                            title="Kích hoạt lại"
                            onClick={() => onSetTrangThai(r.id, "hoat_dong")}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="Xoá"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa liên kết?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Xóa liên kết {r.nguon_ten} → {r.dich_ten}. Thao tác này được ghi nhật ký.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(r.id)}>Xóa</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  )}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Sơ đồ đồ thị (dùng GraphCanvas chung — Prompt 6 tái dùng) --------------

function GraphView({ rows, allRows: _allRows }: { rows: DoThiRow[]; allRows: DoThiRow[] }) {
  const { loaiList } = useLoaiLienKet();
  const [selected, setSelected] = useState<string | null>(null);
  // Sơ đồ dùng cố định bố cục lực (Obsidian); các kiểu phân cấp đã gộp về Toàn cảnh.
  const layout: LayoutKind = "force";

  // Bộ lọc đồ thị.
  const [lopFilter, setLopFilter] = useState<"all" | "vat_ly" | "logic">("all");
  const [loaiFilter, setLoaiFilter] = useState<string>("all");
  const [hideNgung, setHideNgung] = useState(true);
  const [egoRadius, setEgoRadius] = useState(0); // 0 = tắt ego-graph (hiện toàn bộ)

  // Phân tích tác động: chỉ gọi RPC khi bấm nút (không tự chạy khi click node).
  const [impactTarget, setImpactTarget] = useState<string | undefined>(undefined);
  const { impact, isFetching: impactLoading } = usePhanTichTacDong(impactTarget);

  const graph = useMemo(() => buildSystemGraph(rows), [rows]);
  const coreGraphAll = useMemo(() => toCoreGraph(graph), [graph]);

  // Áp dụng lọc lớp / loại / ẩn 'ngung' rồi (tùy chọn) trích ego-graph quanh node chọn.
  const coreGraph = useMemo(() => {
    let g = filterGraph(coreGraphAll, {
      lop: lopFilter === "all" ? null : [lopFilter],
      loai: loaiFilter === "all" ? null : [loaiFilter],
      hideNgung,
      dropOrphans: false,
    });
    if (egoRadius > 0 && selected) g = egoGraph(g, selected, egoRadius);
    return g;
  }, [coreGraphAll, lopFilter, loaiFilter, hideNgung, egoRadius, selected]);

  // Chuỗi ảnh hưởng từ RPC -> tô đỏ trên đồ thị.
  const impactIds = useMemo(() => {
    if (!impactTarget) return null;
    const s = new Set<string>([impactTarget]);
    impact.forEach((i) => s.add(i.he_thong_id));
    return s;
  }, [impactTarget, impact]);

  const selectedNode = graph.nodes.find((n) => n.id === selected);

  // Khi chọn node khác thì reset kết quả phân tích tác động cũ.
  const handleSelect = useCallback((id: string | null) => {
    setSelected(id);
    setImpactTarget(undefined);
  }, []);

  // Legend: chỉ các loại liên kết đang xuất hiện trong đồ thị (sau lọc).
  const legendItems = useMemo<LegendItem[]>(() => {
    const present = new Set(coreGraph.edges.map((e) => e.loai));
    return loaiList
      .filter((l) => present.has(l.ma))
      .map((l) => ({ ma: l.ma, ten: l.ten, mau_sac: l.mau_sac, kieu_net: l.kieu_net }));
  }, [coreGraph.edges, loaiList]);

  const graphControls = (
    <>
      <div className="flex items-center gap-1.5">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={lopFilter} onValueChange={(v) => setLopFilter(v as typeof lopFilter)}>
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue placeholder="Lớp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả lớp</SelectItem>
            <SelectItem value="vat_ly">{LOP_LABEL.vat_ly}</SelectItem>
            <SelectItem value="logic">{LOP_LABEL.logic}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Select value={loaiFilter} onValueChange={setLoaiFilter}>
        <SelectTrigger className="h-8 w-[150px]">
          <SelectValue placeholder="Loại liên kết" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả loại</SelectItem>
          {loaiList.map((l) => (
            <SelectItem key={l.ma} value={l.ma}>{l.ten}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Focus</span>
        <Select value={String(egoRadius)} onValueChange={(v) => setEgoRadius(Number(v))}>
          <SelectTrigger className="h-8 w-[104px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Toàn bộ</SelectItem>
            <SelectItem value="1">Bán kính 1</SelectItem>
            <SelectItem value="2">Bán kính 2</SelectItem>
            <SelectItem value="3">Bán kính 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1.5">
        <Switch id="hide-ngung" checked={hideNgung} onCheckedChange={setHideNgung} />
        <Label htmlFor="hide-ngung" className="text-xs text-muted-foreground">Ẩn ngừng</Label>
      </div>
    </>
  );

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
      <Card>
        <CardContent className="p-0">
          <GraphCanvas
            graph={coreGraph}
            layout={layout}
            selectedId={selected}
            onSelectNode={handleSelect}
            impactIds={impactIds}
            legendItems={legendItems}
            height={560}
            storageKey="mirats.lien-ket.so-do.view"
            groupable
            extraControls={graphControls}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 p-4">
          {!selectedNode ? (
            <p className="text-sm text-muted-foreground">Bấm vào một hệ thống để làm mờ phần còn lại và tô sáng hàng xóm bậc 1. Dùng nút bên dưới để phân tích tác động theo chuỗi.</p>
          ) : (
            <>
              <div>
                <div className="text-sm font-semibold">{selectedNode.ten}</div>
                {selectedNode.nhom && <div className="text-xs text-muted-foreground">{selectedNode.nhom}</div>}
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5"
                disabled={impactLoading}
                onClick={() => setImpactTarget(selected ?? undefined)}
              >
                <AlertTriangle className="h-4 w-4" />
                {impactLoading ? "Đang phân tích…" : "Phân tích tác động"}
              </Button>

              {impactTarget && (
                <>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" /> Chuỗi ảnh hưởng
                  </div>
                  {impact.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nếu hệ thống này ngừng, không có hệ thống nào bị ảnh hưởng theo luồng tín hiệu / phụ thuộc dịch vụ.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {impact.map((i) => (
                        <li key={i.he_thong_id} className="flex items-center justify-between rounded border px-2 py-1 text-xs">
                          <span>{i.ten ?? i.he_thong_id}</span>
                          <Badge variant="secondary">bậc {i.do_sau}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


