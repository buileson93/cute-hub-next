import { useMemo, useState, useCallback, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/mirats/ui/Icon";
import { toast } from "sonner";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { PageSection } from "@/components/mirats/layout/PageSection";
import { useSession } from "@/hooks/use-session";
import { Check, Pencil, GitFork, Plus, GitBranch, LayoutGrid, Share2, Activity, History, Settings2, Search } from "lucide-react";
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
import { buildTree, filterTreeByBadge, badgeFilterActive, okey, NONE_HT } from "@/components/mirats/he-thong-cay/utils";
import { useCayMutations } from "@/components/mirats/he-thong-cay/mutations";
import { CayThayDoiPanel } from "@/components/mirats/CayThayDoiPanel";
import type { 
  EditKind, OverrideMap, SearchItem 
} from "@/components/mirats/he-thong-cay/types";

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
  component: HeThongCayPageWrapper,
});

function HeThongCayPageWrapper() {
  return (
    <CayProvider>
       <ReactFlowProvider>
          <HeThongCayPage />
       </ReactFlowProvider>
    </CayProvider>
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

  const { renameEntity } = useCayMutations();
  
  useEffect(() => {
    if (search.view && search.view !== display) {
      setDisplay(search.view as any);
    }
    else if (!search.view && display === "mindmap") {
      nav({ 
        to: "/he-thong/cay", 
        search: (prev: any) => ({ ...prev, view: "mindmap" }),
        replace: true 
      });
    }
  }, [search.view, setDisplay, display, nav]);

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
  const { roles, profile } = useSession();

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
    const plList = taxonomy?.plList || [];
    const htList = taxonomy?.htList || [];
    const nhomList = taxonomy?.nhomList || [];
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
    return buildTree(devices as any, plList, htMind, nhMind, groupMode === "donvi", [], ordNh, ordHt, colNh, [], (htId) => htList.find(h => h.id === htId || h.ma === htId)?.donViId || null, realSystems);
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

  return (
    <PageFrame density="compact">
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
          </div>
        </div>
      </PageSection>

      <PageBody noPadding className="relative flex flex-col bg-muted/5 overflow-hidden">
        <DataState
          state={state}
          loadingType="drawer"
          title={isFiltering ? "Không tìm thấy kết quả" : "Cây hệ thống trống"}
          description={isFiltering ? "Thử xoá từ khoá tìm kiếm hoặc bộ lọc để xem đầy đủ cây hệ thống." : "Hệ thống chưa có dữ liệu cây phân cấp nào."}
          onRetry={() => { refetchOverrides(); refetchDevices(); }}
          emptyAction={isFiltering ? (<Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setBadgeFilter({ status: new Set(), imp: new Set() }); }}>Xoá tìm kiếm</Button>) : undefined}
          className="flex-1 w-full"
        >
          <div className="flex-1 min-h-0 relative">
            {display === "tree" && (
              <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                <TreeView 
                  tree={viewTree as any}
                  plLabel={plMind}
                  lvLabel={() => ""}
                  nhLabel={nhMind}
                  htMind={htMind}
                  tbLabel={tbMind}
                  canManage={canManage && editMode}
                  onOpenEditor={onOpenEditor}
                  onHistory={onHistory}
                  onIncident={(ma) => {
                    const sysId = parseHtSysMa(ma).sysName;
                    if (sysId && sysId !== NONE_HT) nav({ to: "/su-co", search: { heThongId: sysId } });
                  }}
                  onMaint={(ma) => {
                    const sysId = parseHtSysMa(ma).sysName;
                    if (sysId && sysId !== NONE_HT) nav({ to: "/bao-tri", search: { heThongId: sysId } });
                  }}
                  onRecord={onRecord}
                  onRename={(kind, ma, ten) => {
                    renameEntity.mutate({ kind, id: ma, ten, userRoles: roles });
                  }}
                  onMoveSystem={(req) => {
                    nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, moveHt: req.heThongId }) });
                  }}
                  onMoveGroup={(req) => {
                    toast.info(`Di chuyển nhóm ${req.label} (${req.count} HT) sang ${req.toLabel}`);
                  }}
                  onMoveDevice={(req) => {
                    nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, moveTb: req.deviceMa }) });
                  }}
                  posByHt={posByHt || new Map()}
                />
              </div>
            )}
            
            {display === "mindmap" && (
              <div className="h-full w-full relative">
                <CayMindMap 
                  tree={viewTree as any}
                  posByHt={posByHt || new Map()}
                  scopeText={taxonomy?.plList.find(p => p.id === badgeFilter.status.values().next().value)?.ten || "TẤT CẢ"}
                  canManage={canManage && editMode}
                  onRename={(kind, ma, ten) => renameEntity.mutate({ kind, id: ma, ten, userRoles: roles })}
                  onOpenEditor={onOpenEditor}
                  onHistory={onHistory}
                  onIncident={onIncident}
                  onMaint={onMaint}
                  onRecord={onRecord}
                  onMoveSystem={(req) => nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, moveHt: req.heThongId }) })}
                  onMoveGroup={(req) => toast.info(`Di chuyển nhóm ${req.label} sang ${req.toLabel}`)}
                  onMoveDevice={(req) => nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, moveTb: req.deviceMa }) })}
                  plMind={plMind}
                  nhMind={nhMind}
                  htMind={htMind}
                  tbMind={tbMind}
                  devices={devices as any}
                />
              </div>
            )}

            {display === "health" && (
              <div className="p-8 text-center text-muted-foreground italic flex flex-col items-center justify-center h-full gap-4">
                <Activity className="h-12 w-12 opacity-20" />
                <div>
                  <h3 className="text-lg font-medium text-foreground">Sức khỏe hệ thống</h3>
                  <p className="text-sm mt-1">Tính năng đang được Astryx Skinning...</p>
                </div>
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

      <CayThayDoiPanel 
        open={reorgOpen}
        onClose={() => setReorgOpen(false)}
        isAdmin={roles.includes("admin")}
        htNameMap={taxonomy?.htNameMap}
      />

      {search.moveHt && (
         <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="bg-background p-6 rounded-2xl shadow-2xl max-w-md w-full border animate-in fade-in zoom-in duration-200">
               <h3 className="text-lg font-bold mb-2">Di chuyển Hệ thống</h3>
               <p className="text-sm text-muted-foreground mb-6">
                 Chọn nhóm hệ thống mới để chuyển <strong>{taxonomy?.htNameMap.get(parseHtSysMa(search.moveHt).sysName) || search.moveHt}</strong> vào.
               </p>
               <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, moveHt: undefined }) })}>Hủy</Button>
               </div>
            </div>
         </div>
      )}

      {search.moveHt && (
         <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-background p-6 rounded-2xl shadow-2xl max-w-md w-full border">
               <h3 className="text-lg font-bold mb-2">Di chuyển Hệ thống</h3>
               <p className="text-sm text-muted-foreground mb-6">
                 Chọn nhóm hệ thống mới để chuyển <strong>{taxonomy?.htNameMap.get(parseHtSysMa(search.moveHt).sysName) || search.moveHt}</strong> vào.
               </p>
               <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, moveHt: undefined }) })}>Hủy</Button>
               </div>
            </div>
         </div>
      )}
    </PageFrame>
  );
}