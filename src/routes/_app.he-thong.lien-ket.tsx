import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageSection } from "@/components/mirats/layout/PageSection";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Link2, Plus, Share2, Filter, ArrowRight, ArrowLeftRight, Trash2, 
  Ban, Play, Network, List, Share, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { Combobox } from "@/components/mirats/Combobox";

import { 
  useDoThiHeThong, useLoaiLienKet, useHeThongPickList,
  useAddLienKet, useUpdateLienKet, useDeleteLienKet,
  usePhanTichTacDong,
  LOP_LABEL
} from "@/lib/mirats/lien-ket";
import { 
  buildSystemGraph, toCoreGraph, LOAI_LIEN_KET_LABEL, 
  type DoThiRow, type LoaiLienKetMa 
} from "@/lib/mirats/system-graph";
import { filterGraph, egoGraph } from "@/lib/mirats/graph-core";
import { GraphCanvas, type LegendItem } from "@/components/mirats/GraphCanvas";
import type { LayoutKind } from "@/lib/mirats/graph-layout";

import { LienKetForm } from "@/components/mirats/LienKetForm";
import { NetworkOverview } from "@/components/mirats/NetworkOverview";

export const Route = createFileRoute("/_app/he-thong/lien-ket")({
  head: () => ({
    meta: [
      { title: "Liên kết & Đấu nối — MIRATS" },
      {
        name: "description",
        content: "Bản đồ đấu nối kỹ thuật, luồng tín hiệu và phân tích tác động giữa các hệ thống.",
      },
    ],
  }),
  component: LienKetPage,
});

function LienKetPage() {
  const { rows, isLoading } = useDoThiHeThong();
  const { loaiList } = useLoaiLienKet();
  const { heThongList } = useHeThongPickList();
  
  const addMut = useAddLienKet();
  const updateMut = useUpdateLienKet();
  const deleteMut = useDeleteLienKet();

  const [view, setView] = useState<"bang" | "so-do" | "toan-canh">("so-do");
  const [fHeThong, setFHeThong] = useState("");
  const [fLoai, setFLoai] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const canManage = true; // TODO: RBAC check

  const htOptions = useMemo(() => 
    heThongList.map(h => ({ value: h.id, label: h.ten })),
    [heThongList]
  );

  const filtered = useMemo(() => {
    let out = rows;
    if (fHeThong) {
      out = out.filter((r) => r.nguon_id === fHeThong || r.dich_id === fHeThong);
    }
    if (fLoai) {
      out = out.filter((r) => r.loai_ma === fLoai);
    }
    return out;
  }, [rows, fHeThong, fLoai]);

  const submitAdd = (values: any) => {
    addMut.mutate(values);
  };

  const setTrangThai = (id: string, trang_thai: "hoat_dong" | "tam_ngung") => {
    updateMut.mutate({ id, patch: { trang_thai } });
  };

  return (
    <PageFrame density="compact">
      <PageHeader
        icon={Link2}
        title="Liên kết hệ thống"
        subtitle={`${rows.length} Đấu nối kỹ thuật`}
        breadcrumbs={[
          { label: "Hệ thống", to: "/he-thong/cay" },
          { label: "Liên kết & Đấu nối" }
        ]}
        description="Quản lý đấu nối thực tế giữa các hệ thống (VHF, VCCS, Network...). Phân tích tác động và dự phòng dịch vụ."
        actions={
          <div className="flex items-center gap-2">
            {canManage && (
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Thêm liên kết</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Khai báo liên kết mới</DialogTitle>
                    <DialogDescription>Thiết lập đấu nối tín hiệu hoặc phụ thuộc giữa hai hệ thống.</DialogDescription>
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
            <AppTooltip noiDung="Chia sẻ sơ đồ">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Share2 className="h-4 w-4" />
              </Button>
            </AppTooltip>
          </div>
        }
      />

      <PageSection className="bg-background/50 border-b">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-auto">
            <TabsList className="h-8 p-0.5 bg-muted/50 border">
              <TabsTrigger value="bang" className="h-7 px-3 text-[11px] gap-1.5">
                <List className="h-3.5 w-3.5" />
                <span>DẠNG BẢNG</span>
              </TabsTrigger>
              <TabsTrigger value="so-do" className="h-7 px-3 text-[11px] gap-1.5">
                <Network className="h-3.5 w-3.5" />
                <span>SƠ ĐỒ</span>
              </TabsTrigger>
              <TabsTrigger value="toan-canh" className="h-7 px-3 text-[11px] gap-1.5">
                <Share className="h-3.5 w-3.5" />
                <span>TOÀN CẢNH</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
            <div className="w-48">
              <Combobox
                options={[{ value: "", label: "Tất cả hệ thống" }, ...htOptions]}
                value={fHeThong} 
                onChange={setFHeThong} 
                placeholder="Lọc hệ thống..."
                className="h-8 text-[11px]"
              />
            </div>
            <Select value={fLoai || "__all"} onValueChange={(v) => setFLoai(v === "__all" ? "" : v)}>
              <SelectTrigger className="h-8 w-36 text-[11px]"><SelectValue placeholder="Loại liên kết" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Tất cả loại</SelectItem>
                {loaiList.map((l) => <SelectItem key={l.id} value={l.ma}>{l.ten}</SelectItem>)}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="h-8 px-3 font-mono text-[10px] uppercase tracking-wider">
              {filtered.length} Kết nối
            </Badge>
          </div>
        </div>
      </PageSection>

      <PageBody noPadding className="relative flex flex-col bg-muted/5 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : view === "bang" ? (
          <div className="h-full overflow-auto p-4">
            <LienKetTable
              rows={filtered}
              canManage={canManage}
              onDelete={(id: string) => deleteMut.mutate(id)}
              onSetTrangThai={setTrangThai}
            />
          </div>
        ) : view === "toan-canh" ? (
          <NetworkOverview canManage={canManage} />
        ) : (
          <GraphView rows={filtered} allRows={rows} />
        )}
      </PageBody>
    </PageFrame>
  );
}

function loaiBadge(ma: string, mau?: string | null) {
  const label = LOAI_LIEN_KET_LABEL[ma as LoaiLienKetMa] ?? ma;
  if (mau) {
    return (
      <Badge
        variant="outline"
        style={{ borderColor: mau, color: mau }}
        className="gap-1 text-[10px] h-5"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: mau }} />
        {label}
      </Badge>
    );
  }
  return <Badge variant="outline" className="text-[10px] h-5">{label}</Badge>;
}

function LienKetTable({ rows, canManage, onDelete, onSetTrangThai }: {
  rows: DoThiRow[];
  canManage: boolean;
  onDelete: (id: string) => void;
  onSetTrangThai: (id: string, trang_thai: "hoat_dong" | "tam_ngung") => void;
}) {
  if (rows.length === 0) {
    return <div className="p-8 text-center text-sm text-muted-foreground italic">Chưa có liên kết nào khớp bộ lọc.</div>;
  }
  return (
    <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="p-3 pl-4">Nguồn</th>
              <th className="p-3 w-8"></th>
              <th className="p-3">Đích</th>
              <th className="p-3">Loại</th>
              <th className="p-3">Lớp</th>
              <th className="p-3">Giao thức</th>
              <th className="p-3">Trạng thái</th>
              {canManage && <th className="p-3 pr-4 text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => {
              const active = r.trang_thai === "hoat_dong";
              return (
              <tr key={r.id} className="hover:bg-muted/10 transition-colors">
                <td className="p-3 pl-4 font-medium text-[12px]">{r.nguon_ten}</td>
                <td className="p-3 text-muted-foreground">
                  {r.huong === "hai_chieu" ? <ArrowLeftRight className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                </td>
                <td className="p-3 font-medium text-[12px]">{r.dich_ten}</td>
                <td className="p-3">{loaiBadge(r.loai_ma, r.mau_sac)}</td>
                <td className="p-3 text-[11px] font-mono text-muted-foreground uppercase">{LOP_LABEL[r.lop]}</td>
                <td className="p-3 text-[11px] text-muted-foreground">
                  {r.giao_thuc || "—"}
                </td>
                <td className="p-3">
                  <Badge variant={active ? "default" : "secondary"} className="h-5 text-[10px] px-2">
                    {active ? "Hoạt động" : "Tạm ngừng"}
                  </Badge>
                </td>
                {canManage && (
                  <td className="p-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {active ? (
                        <AppTooltip noiDung="Tạm ngừng">
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => onSetTrangThai(r.id, "tam_ngung")}
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        </AppTooltip>
                      ) : (
                        <AppTooltip noiDung="Kích hoạt">
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7 text-primary"
                            onClick={() => onSetTrangThai(r.id, "hoat_dong")}
                          >
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                        </AppTooltip>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Xóa vĩnh viễn liên kết giữa <strong>{r.nguon_ten}</strong> và <strong>{r.dich_ten}</strong>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(r.id)} className="rounded-xl bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction>
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
    </div>
  );
}

function GraphView({ rows, allRows: _allRows }: { rows: DoThiRow[]; allRows: DoThiRow[] }) {
  const { loaiList } = useLoaiLienKet();
  const [selected, setSelected] = useState<string | null>(null);
  const layout: LayoutKind = "force";

  const [lopFilter, setLopFilter] = useState<"all" | "vat_ly" | "logic">("all");
  const [loaiFilter, setLoaiFilter] = useState<string>("all");
  const [hideNgung, setHideNgung] = useState(true);
  const [egoRadius, setEgoRadius] = useState(0);

  const [impactTarget, setImpactTarget] = useState<string | undefined>(undefined);
  const { impact: _impact, isFetching: impactLoading } = usePhanTichTacDong(impactTarget);

  const graph = useMemo(() => buildSystemGraph(rows), [rows]);
  const coreGraphAll = useMemo(() => toCoreGraph(graph), [graph]);

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

  const handleSelect = useCallback((id: string | null) => {
    setSelected(id);
    setImpactTarget(undefined);
  }, []);

  const legendItems = useMemo<LegendItem[]>(() => {
    const present = new Set(coreGraph.edges.map((e) => e.loai));
    return loaiList
      .filter((l) => present.has(l.ma))
      .map((l) => ({ ma: l.ma, ten: l.ten, mau_sac: l.mau_sac, kieu_net: l.kieu_net }));
  }, [coreGraph.edges, loaiList]);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-background/50 px-4 py-2 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <Select value={lopFilter} onValueChange={(v) => setLopFilter(v as any)}>
            <SelectTrigger className="h-7 w-24 text-[10px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lớp</SelectItem>
              <SelectItem value="vat_ly">Vật lý</SelectItem>
              <SelectItem value="logic">Logic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <Select value={loaiFilter} onValueChange={setLoaiFilter}>
            <SelectTrigger className="h-7 w-32 text-[10px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              {loaiList.map(l => <SelectItem key={l.ma} value={l.ma}>{l.ten}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <Badge variant="secondary" className="h-6 text-[9px] uppercase tracking-tighter">
            Zoom/Pan để điều hướng sơ đồ
          </Badge>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-muted/5 relative">
        <GraphCanvas
          graph={coreGraph}
          layout={layout}
          selectedId={selected}
          onSelectNode={handleSelect}
          legendItems={legendItems}
        />
        {impactLoading && (
          <div className="absolute top-4 right-4 bg-background/80 backdrop-blur border p-2 rounded-lg text-[10px] flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" /> Đang tính toán tác động...
          </div>
        )}
      </div>
    </div>
  );
}
