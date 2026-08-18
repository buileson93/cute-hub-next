import { useMemo, useState, useCallback, useEffect } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/mirats/ui/Icon";
import { toast } from "sonner";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { PageSection } from "@/components/mirats/layout/PageSection";
import { useSession } from "@/hooks/use-session";
import { Check, Pencil, GitFork, Plus, GitBranch, LayoutGrid, Share2, Activity, History, Settings2, Search, AlertTriangle, MoveRight, X, ChevronRight, HardDrive } from "lucide-react";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";
import { cn } from "@/lib/utils";
import { ReactFlowProvider } from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { DataState } from "@/components/mirats/DataState";
import { supabase } from "@/integrations/supabase/client";
import {
  useDbTaxonomy,
  type DbDevice, type DbTaxonomy,
} from "@/lib/mirats/db-taxonomy";
import { useAllViTriChucNang } from "@/lib/mirats/he-thong-thanh-phan";
import { useCan } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { parseHtSysMa } from "@/lib/mirats/phan-loai";

import { CayProvider, useCayContext } from "@/components/mirats/he-thong-cay/CayContext";
import { TreeView } from "@/components/mirats/he-thong-cay/TreeView";
import { CayMindMap } from "@/components/mirats/he-thong-cay/CayMindMap";
import { NodeEditorSheet } from "@/components/mirats/he-thong-cay/NodeEditorSheet";
import { NodeSearch } from "@/components/mirats/he-thong-cay/NodeSearch";
import { buildTree, filterTreeByBadge, badgeFilterActive, okey, NONE_HT, isRealSystemId } from "@/components/mirats/he-thong-cay/utils";
import { useCayMutations } from "@/components/mirats/he-thong-cay/mutations";
import { CayThayDoiPanel } from "@/components/mirats/CayThayDoiPanel";
import { ThietBiDetailDrawer } from "@/components/mirats/ThietBiDetailDrawer";
import type { 
  EditKind, OverrideMap, SearchItem, MoveTarget 
} from "@/components/mirats/he-thong-cay/types";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_app/he-thong/cay")({
  validateSearch: (search: Record<string, unknown>): { editTb?: string; view?: string; moveHt?: string; moveTb?: string } => ({
    editTb: typeof search.editTb === "string" ? search.editTb : undefined,
    view: typeof search.view === "string" ? search.view : undefined,
    moveHt: typeof search.moveHt === "string" ? search.moveHt : undefined,
    moveTb: typeof search.moveTb === "string" ? search.moveTb : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Cấu trúc & Sơ đồ — MIRATS" },
      {
        name: "description",
        content: "Phân lớp hệ thống tài sản: Phân loại → Nhóm hệ thống → Hệ thống → Tài sản → Thành phần.",
      },
      { property: "og:title", content: "Cấu trúc & Sơ đồ — MIRATS" },
      { property: "og:description", content: "Sơ đồ hệ thống kỹ thuật và cây phân cấp tài sản." },
    ],
  }),
  errorComponent: ({ error, reset }: { error: Error; reset: () => void }) => {
    const router = useRouter();
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card border rounded-xl shadow-sm min-h-[400px]">
        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-red-600 mb-2 leading-tight text-center">
          Đã xảy ra lỗi ở trang Cây Hệ thống
        </h3>
        <div className="text-sm text-muted-foreground mb-6 max-w-md text-center leading-relaxed">
          <p>Dữ liệu sơ đồ có thể đang bị lỗi hoặc không tương thích với cấu trúc hiện tại.</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-[240px]">
          <Button onClick={() => { router.invalidate(); reset(); }} variant="default" className="w-full">
            Thử lại
          </Button>
          <Button onClick={() => window.location.href = "/"} variant="outline" className="w-full">
            Về trang chủ
          </Button>
        </div>
        {import.meta.env.DEV && error && (
          <div className="mt-8 w-full">
            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Chi tiết lỗi (Dev):</p>
            <pre className="p-4 bg-muted rounded text-[10px] max-w-full overflow-auto text-red-500 border whitespace-pre-wrap break-all">
              {error.message}
            </pre>
          </div>
        )}
      </div>
    );
  },
  component: HeThongCayPageWrapper,
});

function HeThongCayPageWrapper() {
  return (
    <ReactFlowProvider>
      <CayProvider>
        <HeThongCayPage />
      </CayProvider>
    </ReactFlowProvider>
  );
}

const EMPTY_ROWS: never[] = [];

function useOverrides() {
  return useQuery({
    queryKey: ["cay_node_edit"],
    queryFn: async (): Promise<OverrideMap> => {
      const { data, error } = await supabase.from("cay_node_edit").select("kind,ma,ten,du_lieu");
      if (error) throw error;
      const map = new Map();
      for (const r of (data || []) as any[]) {
        map.set(okey(r.kind, r.ma), {
          ten: r.ten,
          du_lieu: r.du_lieu || {},
        });
      }
      return map;
    },
    staleTime: 30_000,
  });
}

function usePlMind(overrides: OverrideMap | undefined, taxonomy: DbTaxonomy | undefined) {
  return useCallback(
    (id: string) => overrides?.get(okey("pl", id))?.ten || taxonomy?.plNameMap.get(id) || id,
    [overrides, taxonomy],
  );
}

function useNhMind(overrides: OverrideMap | undefined, taxonomy: DbTaxonomy | undefined) {
  return useCallback(
    (ma: string) => overrides?.get(okey("nh", ma))?.ten || taxonomy?.nhomNameMap.get(ma) || taxonomy?.nhomMaMap.get(ma) || ma,
    [overrides, taxonomy],
  );
}

function useHtMind(overrides: OverrideMap | undefined, taxonomy: DbTaxonomy | undefined) {
  return useCallback((ma: string) => {
    const parsed = parseHtSysMa(ma);
    const sysName = parsed.sysName;
    if (!sysName || sysName === NONE_HT) return "Hệ thống khác";
    return overrides?.get(okey("ht", ma))?.ten || 
           taxonomy?.htNameMap.get(sysName) || 
           taxonomy?.htMaMap.get(sysName) || 
           ma;
  }, [overrides, taxonomy]);
}

function useTbMind(overrides: OverrideMap | undefined) {
  return useCallback((d: DbDevice) => overrides?.get(okey("tb", d.ma_thiet_bi))?.ten || d.ten || d.ma_thiet_bi, [overrides]);
}

function HeThongCayPage() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const canManage = useCan("he-thong", "manage") || useCan("admin", "manage");
  const qc = useQueryClient();

  const {
    display, setDisplay,
    editMode, setEditMode,
    searchQuery, setSearchQuery,
    setFocus,
    badgeFilter, setBadgeFilter,
    groupMode,
    setViewTree,
    reorgOpen, setReorgOpen,
    expandedNodes, toggleNode
  } = useCayContext();

  const { renameEntity, moveSystem, moveDevice } = useCayMutations();
  
  useEffect(() => {
    if (search.view && search.view !== display) {
      setDisplay(search.view as any);
    }
  }, [search.view, setDisplay, display]);

  const handleDisplayChange = (v: string) => {
    if (v === "table") {
      nav({ to: "/he-thong/thanh-phan" });
    } else {
      setDisplay(v as any);
      nav({ 
        to: "/he-thong/cay", 
        search: (prev: any) => ({ ...prev, view: v }),
        replace: true 
      });
    }
  };

  const [target, setTarget] = useState<{ kind: EditKind; ma: string } | null>(null);
  const { roles, isAdmin } = useSession();

  const { data: overrides, isLoading: loadingOverrides, refetch: refetchOverrides } = useOverrides();
  const { data: taxonomy, isLoading: loadingTaxo } = useDbTaxonomy();
  const plMind = usePlMind(overrides, taxonomy);
  const nhMind = useNhMind(overrides, taxonomy);
  const htMind = useHtMind(overrides, taxonomy);
  const tbMind = useTbMind(overrides);

  const { data: posByHt } = useAllViTriChucNang();

  const { data: tpCount = 0 } = useQuery({
    queryKey: ["he_thong_thanh_phan_count"],
    queryFn: async () => {
      const { count, error } = await supabase
          .from("he_thong_thanh_phan")
          .select("*", { count: "exact", head: true });
      if (error) return 0;
      return count || 0;
    }
  });

  const { data: devices = EMPTY_ROWS, isLoading: loadingDevices, refetch: refetchDevices } = useQuery({
    queryKey: ["thiet_bi_cay"],
    queryFn: async () => {
      const pageSize = 1000;
      let from = 0;
      const allData: any[] = [];
      for (;;) {
        const { data, error } = await supabase
          .from("thiet_bi")
          .select(`
            *,
            _loaiTbTen:dm_loai_thiet_bi(ten),
            _loaiTbOrder:dm_loai_thiet_bi(thu_tu),
            phan_loai_id,
            nhom_he_thong_id,
            he_thong_id,
            gan_chuc_nang(
              id,
              he_thong_thanh_phan:thanh_phan_id(id, ma_thanh_phan, ten)
            )
          `)
          .range(from, from + pageSize - 1);
        if (error) throw error;
        const rows = data || [];
        allData.push(...rows);
        if (rows.length < pageSize) break;
        from += pageSize;
      }
      
      return allData.map((d: any) => ({
        ...d,
        _pl: d.phan_loai_id,
        _nhKey: d.nhom_he_thong_id,
        _htId: d.he_thong_id,
        _thanhPhanId: d.gan_chuc_nang?.[0]?.he_thong_thanh_phan?.id,
        _thanhPhanMa: d.gan_chuc_nang?.[0]?.he_thong_thanh_phan?.ma_thanh_phan,
        _thanhPhanTen: d.gan_chuc_nang?.[0]?.he_thong_thanh_phan?.ten,
        _loaiTbTen: d._loaiTbTen?.ten,
        _loaiTbOrder: d._loaiTbOrder?.thu_tu
      }));
    }
  });

  const { tree } = useMemo(() => {
    if (!taxonomy || !devices) return { tree: EMPTY_ROWS, total: 0 };
    
    try {
      const plList = taxonomy?.plList || [];
      const htList = taxonomy?.htList || [];
      const nhomList = taxonomy?.nhomList || [];
      
      if (plList.length === 0 && devices.length === 0) {
        return { tree: EMPTY_ROWS, total: 0 };
      }

      const realSystems = htList.map(h => {
        const nhom = nhomList.find(n => n.id === h.nhomId);
        return {
          ma: h.ma, ten: h.ten,
          nhMa: nhom?.ma || h.nhomId || "KHAC",
          nhTen: nhom?.ten || taxonomy?.nhomNameMap.get(h.nhomId || "KHAC") || "Khác",
          plId: h.phanLoaiId || nhom?.phanLoaiId || plList[0]?.id || "KHAC"
        };
      });

      const ordNh = (ma: string) => (overrides?.get(okey("nh", ma))?.du_lieu as any)?.thu_tu;
      const ordHt = (ma: string) => (overrides?.get(okey("ht", ma))?.du_lieu as any)?.thu_tu;
      const colNh = (ma: string) => (overrides?.get(okey("nh", ma))?.du_lieu as any)?.mau;
      
      return buildTree(
        devices as any, 
        plList, 
        htMind, 
        nhMind, 
        groupMode === "donvi", 
        [], 
        ordNh, 
        ordHt, 
        colNh, 
        [], 
        (htId) => htList.find(h => h.id === htId || h.ma === htId)?.donViId || null, 
        realSystems
      );
    } catch (err) {
      console.error("Critical error building tree in CayPage:", err);
      return { tree: EMPTY_ROWS, total: 0 };
    }
  }, [devices, taxonomy, htMind, nhMind, groupMode, overrides]);

  const viewTree = useMemo(() => filterTreeByBadge(tree as any, badgeFilter), [tree, badgeFilter]);

  useEffect(() => {
    setViewTree(viewTree as any);
  }, [viewTree, setViewTree]);

  const isLoading = loadingOverrides || loadingTaxo || loadingDevices;
  const state = isLoading ? "loading" : viewTree.length === 0 ? "empty" : "success";
  const isFiltering = searchQuery.trim() !== "" || badgeFilterActive(badgeFilter);

  const onOpenEditor = useCallback((kind: EditKind, ma: string) => setTarget({ kind, ma }), []);
  const onRecord = useCallback((kind: "tb" | "tp", ma: string, ten?: string) => {
     if (kind === "tb") nav({ to: "/thiet-bi/$maThietBi", params: { maThietBi: ma }, search: { tab: "tong-quan", doc: undefined, q: undefined } });
  }, [nav]);
  const onHistory = useCallback((ma: string) => {
     const sysId = parseHtSysMa(ma).sysName;
     if (sysId && sysId !== NONE_HT) nav({ to: "/he-thong/$id", params: { id: sysId } });
  }, [nav]);

  const onIncident = useCallback((ma: string) => {
    const sysId = parseHtSysMa(ma).sysName;
    if (sysId && sysId !== NONE_HT) nav({ to: "/su-co", search: { heThongId: sysId } });
  }, [nav]);

  const onMaint = useCallback((ma: string) => {
    const sysId = parseHtSysMa(ma).sysName;
    if (sysId && sysId !== NONE_HT) nav({ to: "/bao-tri", search: { heThongId: sysId } });
  }, [nav]);

  const searchItems = useMemo(() => {
    const list: SearchItem[] = [];
    for (const pl of viewTree) {
      list.push({ kind: "pl", ma: pl.id, label: pl.ten, plId: pl.id, count: pl.count });
      for (const lv of pl.fields) {
        for (const nh of lv.groups) {
          list.push({ kind: "nh", ma: nh.ma, label: nh.ten, plId: pl.id, lvId: lv.id, count: nh.count });
          for (const ht of nh.systems) {
            list.push({ kind: "ht", ma: ht.ma, label: ht.ten, plId: pl.id, lvId: lv.id, nhMa: nh.ma, count: ht.count });
            for (const d of ht.devices) {
              list.push({ kind: "tb", ma: d.tb.ma_thiet_bi, label: d.tb.ten || d.tb.ma_thiet_bi, code: d.tb.ma_thiet_bi, plId: pl.id, lvId: lv.id, nhMa: nh.ma, htMa: ht.ma, sysName: ht.ten });
            }
          }
        }
      }
    }
    return list;
  }, [viewTree]);

  const moveTargets = useMemo<MoveTarget[]>(() => {
    const out: MoveTarget[] = [];
    if (!taxonomy) return out;
    for (const pl of taxonomy.plList) {
      const nhoms = taxonomy.nhomList.filter(n => n.phanLoaiId === pl.id);
      for (const nh of nhoms) {
        out.push({ 
          plId: pl.id, 
          plLabel: pl.ten, 
          lvId: "", 
          lvLabel: "", 
          nhKey: nh.ma, 
          nhLabel: nh.ten 
        });
      }
    }
    return out;
  }, [taxonomy]);

  const moveSystemTarget = useMemo(() => {
    if (!search.moveHt || !taxonomy) return null;
    const parsed = parseHtSysMa(search.moveHt);
    const ht = taxonomy.htList.find(h => h.ma === parsed.sysName || h.id === parsed.sysName);
    return ht;
  }, [search.moveHt, taxonomy]);

  const moveDeviceTarget = useMemo(() => {
    if (!search.moveTb || !devices) return null;
    return (devices as any[]).find(d => d.ma_thiet_bi === search.moveTb);
  }, [search.moveTb, devices]);

  const htNameMap = useMemo(() => {
    const m = new Map<string, string>();
    if (taxonomy) {
      taxonomy.htList.forEach(h => m.set(h.id, h.ten));
    }
    return m;
  }, [taxonomy]);

  return (
    <PageFrame density="compact" className="flex flex-col overflow-hidden h-screen">
      <PageHeader
        icon={GitFork}
        title="Cấu trúc & Sơ đồ"
        subtitle={taxonomy ? `${taxonomy.plList.length} Phân loại · ${taxonomy.htList.length} Hệ thống` : "Đang tải cấu trúc…"}
        breadcrumbs={[
          { label: "Hệ thống", to: "/he-thong/cay" },
          { label: "Cấu trúc & Sơ đồ" }
        ]}
        description="Quản lý phân cấp kỹ thuật và sơ đồ tổng thể hệ thống tài sản."
        actions={
          <div className="flex items-center gap-2">
            <NodeSearch 
              containerClassName="h-8"
              items={searchItems} 
              onPick={(it) => {
                setSearchQuery(it.label);
                if (it.kind === "ht" || it.kind === "tb" || it.kind === "nh" || it.kind === "pl") {
                  setDisplay("mindmap");
                  nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, view: "mindmap" }), replace: true });
                }
                setFocus({ ...it, nonce: Math.random() });
              }}
            />
            {canManage && (
              <AppTooltip noiDung={editMode ? "Hoàn tất chỉnh sửa" : "Bật chế độ chỉnh sửa cây"}>
                <Button 
                  size="icon" 
                  variant={editMode ? "default" : "outline"} 
                  className="h-8 w-8"
                  onClick={() => setEditMode(!editMode)} 
                >
                  {editMode ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                </Button>
              </AppTooltip>
            )}
            <AppTooltip noiDung="Cấu hình sơ đồ">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setReorgOpen(true)}>
                <Settings2 className="h-4 w-4" />
              </Button>
            </AppTooltip>
          </div>
        }
      />

      <PageSection className="px-4 py-2 border-b bg-background/30 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center justify-between">
          <Tabs value={display} onValueChange={handleDisplayChange}>
            <TabsList className="h-8 bg-muted/50 p-0.5">
              <TabsTrigger value="table" className="h-7 gap-2 px-3 text-[11px] font-medium tracking-tight">
                <LayoutGrid className="h-3 w-3" />
                <span>DANH SÁCH</span>
              </TabsTrigger>
              <TabsTrigger value="tree" className="h-7 gap-2 px-3 text-[11px] font-medium tracking-tight">
                <GitBranch className="h-3 w-3" />
                <span>CÂY PHÂN CẤP</span>
              </TabsTrigger>
              <TabsTrigger value="mindmap" className="h-7 gap-2 px-3 text-[11px] font-medium tracking-tight">
                <Share2 className="h-3 w-3" />
                <span>SƠ ĐỒ TỔNG THỂ</span>
              </TabsTrigger>
              <TabsTrigger value="health" className="h-7 gap-2 px-3 text-[11px] font-medium tracking-tight">
                <Activity className="h-3 w-3" />
                <span>SỨC KHỎE</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>Phân loại</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              <span>Nhóm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>Hệ thống</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span>Tài sản</span>
            </div>
          </div>
        </div>
      </PageSection>

      <PageBody density="compact" className="flex-1 min-h-[500px] h-full relative overflow-hidden p-0 bg-muted/5">
        <DataState state={state} emptyTitle="Không có dữ liệu phù hợp" emptyDesc="Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.">
          <div className="absolute inset-0 flex flex-col">
            {display === "tree" && (
              <ScrollArea className="flex-1 p-4">
                <TreeView 
                  tree={viewTree as any} 
                  plLabel={plMind} 
                  lvLabel={(id) => id} 
                  nhLabel={nhMind} 
                  htMind={htMind} 
                  tbLabel={tbMind} 
                  canManage={canManage}
                  onOpenEditor={onOpenEditor}
                  onHistory={onHistory}
                  onIncident={onIncident}
                  onMaint={onMaint}
                  onRecord={onRecord}
                  onRename={async (kind, ma, ten) => renameEntity.mutateAsync({ kind, id: ma, ten, userRoles: roles })}
                  onMoveSystem={(req) => nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, moveHt: req.heThongId }) })}
                  onMoveGroup={() => {}}
                  onMoveDevice={(req) => nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, moveTb: req.deviceMa }) })}
                  posByHt={posByHt || new Map()}
                />
              </ScrollArea>
            )}
            {display === "mindmap" && (
              <div className="flex-1 relative">
                <CayMindMap 
                  tree={viewTree as any} 
                  posByHt={posByHt || new Map()} 
                  scopeText="Cấu trúc CNS/ATM"
                  canManage={canManage}
                  onRename={async (kind, ma, ten) => renameEntity.mutateAsync({ kind, id: ma, ten, userRoles: roles })}
                  onOpenEditor={onOpenEditor}
                  onHistory={onHistory}
                  onIncident={onIncident}
                  onMaint={onMaint}
                  onRecord={onRecord}
                  onMoveSystem={(req) => nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, moveHt: req.heThongId }) })}
                  onMoveGroup={() => {}}
                  onMoveDevice={(req) => nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, moveTb: req.deviceMa }) })}
                  plMind={plMind}
                  nhMind={nhMind}
                  htMind={htMind}
                  tbMind={tbMind}
                  devices={devices}
                />
              </div>
            )}
            {display === "health" && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8 text-center italic">
                Chế độ xem Sức khỏe hệ thống đang được phát triển...
              </div>
            )}
          </div>
        </DataState>
      </PageBody>

      <NodeEditorSheet 
        target={target} 
        onClose={() => setTarget(null)} 
        plLabel={plMind}
        nhLabel={nhMind}
        htLabel={htMind}
        tbMap={new Map(devices.map(d => [d.ma_thiet_bi, d]))}
        canManage={canManage}
        donViList={taxonomy?.donViList || []}
      />

      <CayThayDoiPanel open={reorgOpen} onClose={() => setReorgOpen(false)} isAdmin={isAdmin} htNameMap={htNameMap} />

      <ThietBiDetailDrawer
        open={!!search.editTb}
        onOpenChange={(open) => !open && nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, editTb: undefined }) })}
        device={devices.find(d => d.ma_thiet_bi === search.editTb) || null}
        canManage={canManage}
        deviceName={(d) => d.ten || d.ma_thiet_bi}
        systemLabel={(d) => htNameMap.get(d.he_thong_id) || d.he_thong_id}
        systemNameById={(id) => htNameMap.get(id || "") || id || ""}
        onAssign={() => {}}
        onRemove={() => {}}
      />

      <Dialog open={!!search.moveHt} onOpenChange={(o) => !o && nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, moveHt: undefined }) })}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="bg-primary/5 p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <MoveRight className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Di chuyển hệ thống</DialogTitle>
                <DialogDescription className="text-muted-foreground mt-0.5">
                  Thay đổi phân lớp cho hệ thống <span className="font-semibold text-foreground">{moveSystemTarget?.ten || search.moveHt}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-0">
            <ScrollArea className="max-h-[60vh] p-6 pt-2">
              <div className="space-y-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 px-1">
                  Chọn đích đến (Nhóm hệ thống)
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {moveTargets.map((t, idx) => (
                    <button
                      key={idx}
                      onClick={async () => {
                        if (!moveSystemTarget) return;
                        await moveSystem.mutateAsync({
                          heThongId: moveSystemTarget.id,
                          tenHeThong: moveSystemTarget.ten,
                          toNhomId: (taxonomy?.nhomList.find(n => n.ma === t.nhKey)?.id) || "",
                          toLvId: "",
                          toNhKey: t.nhKey,
                          toNhTen: t.nhLabel
                        });
                        nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, moveHt: undefined }) });
                      }}
                      className="group flex items-center justify-between p-3 rounded-xl border border-transparent bg-muted/30 hover:bg-primary/5 hover:border-primary/20 transition-all text-left"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{t.nhLabel}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{t.plLabel}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="bg-muted/30 p-4 px-6 border-t">
            <Button variant="ghost" onClick={() => nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, moveHt: undefined }) })}>
              Hủy bỏ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!search.moveTb} onOpenChange={(o) => !o && nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, moveTb: undefined }) })}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="bg-primary/5 p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Di chuyển tài sản</DialogTitle>
                <DialogDescription className="text-muted-foreground mt-0.5">
                  Gán tài sản <span className="font-semibold text-foreground">{moveDeviceTarget?.ten || search.moveTb}</span> vào hệ thống mới
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-0">
            <ScrollArea className="max-h-[60vh] p-6 pt-2">
              <div className="space-y-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 px-1">
                  Chọn hệ thống đích
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {taxonomy?.htList.map((ht) => (
                    <button
                      key={ht.id}
                      onClick={async () => {
                        if (!moveDeviceTarget) return;
                        await moveDevice.mutateAsync({
                          maThietBi: moveDeviceTarget.ma_thiet_bi,
                          tenThietBi: moveDeviceTarget.ten,
                          toHtId: ht.id,
                          toHtTen: ht.ten
                        });
                        nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, moveTb: undefined }) });
                      }}
                      className="group flex items-center justify-between p-3 rounded-xl border border-transparent bg-muted/30 hover:bg-blue-500/5 hover:border-blue-500/20 transition-all text-left"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors">{ht.ten}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{taxonomy.nhomNameMap.get(ht.nhomId) || "—"}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-blue-600 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="bg-muted/30 p-4 px-6 border-t">
            <Button variant="ghost" onClick={() => nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, moveTb: undefined }) })}>
              Hủy bỏ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </PageFrame>
  );
}
