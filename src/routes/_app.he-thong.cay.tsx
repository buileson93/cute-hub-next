import { useMemo, useState, useCallback, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ListTree, GitFork, List, Search as SearchIcon, Pencil, Activity, ClipboardList
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { useSession } from "@/hooks/use-session";

import { cn } from "@/lib/utils";
import { ReactFlowProvider } from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { useIsMobile } from "@/hooks/use-mobile";
import { DataState } from "@/components/mirats/DataState";
import { supabase } from "@/integrations/supabase/client";
import {
  useDbTaxonomy,
  type DbDevice, type DbTaxonomy,
} from "@/lib/mirats/db-taxonomy";
import { useAllViTriChucNang } from "@/lib/mirats/he-thong-thanh-phan";
import { useMyPermissions, useCan } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseHtSysMa } from "@/lib/mirats/phan-loai";

import { CayProvider, useCayContext } from "@/components/mirats/he-thong-cay/CayContext";
import { TreeView } from "@/components/mirats/he-thong-cay/TreeView";
import { CayMindMap } from "@/components/mirats/he-thong-cay/CayMindMap";
import { NodeEditorSheet } from "@/components/mirats/he-thong-cay/NodeEditorSheet";
import { NodeSearch } from "@/components/mirats/he-thong-cay/NodeSearch";
import { buildTree, filterTreeByBadge, badgeFilterActive, okey, NONE_HT } from "@/components/mirats/he-thong-cay/utils";
import { useCayMutations } from "@/components/mirats/he-thong-cay/mutations";
import type { 
  EditKind, OverrideMap, SearchItem 
} from "@/components/mirats/he-thong-cay/types";

export const Route = createFileRoute("/_app/he-thong/cay")({
  validateSearch: (search: Record<string, unknown>): { editTb?: string; view?: string } => ({
    editTb: typeof search.editTb === "string" ? search.editTb : undefined,
    view: typeof search.view === "string" ? search.view : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Hệ Thống — Tài sản MIRATS" },
      {
        name: "description",
        content: "Phân lớp hệ thống tài sản: Phân loại (Nhóm 1/2/3) → Nhóm hệ thống → Hệ thống → Tài sản → Thành phần.",
      },
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
    (ma: string) => overrides?.get(okey("nh", ma))?.ten || taxonomy?.nhomNameMap.get(ma) || ma,
    [overrides, taxonomy],
  );
}

function useHtMind(overrides: OverrideMap | undefined, taxonomy: DbTaxonomy | undefined) {
  return useCallback((ma: string) => {
    const parsed = parseHtSysMa(ma);
    const id = parsed.sysName;
    if (!id || id === NONE_HT) return "Hệ thống khác";
    return overrides?.get(okey("ht", ma))?.ten || taxonomy?.htNameMap.get(id) || ma;
  }, [overrides, taxonomy]);
}

function useTbMind(overrides: OverrideMap | undefined) {
  return useCallback((d: DbDevice) => overrides?.get(okey("tb", d.ma_thiet_bi))?.ten || d.ten || d.ma_thiet_bi, [overrides]);
}

function HeThongCayPage() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const canManage = useCan("he-thong", "manage");

  const {
    display, setDisplay,
    editMode, setEditMode,
    searchQuery, setSearchQuery,
    setFocus,
    badgeFilter, setBadgeFilter,
    groupMode,
  } = useCayContext();
  
  const { renameEntity } = useCayMutations();

  // Sync display with search param
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
  const { roles } = useSession();

  const { data: overrides, isLoading: loadingOverrides, error: errorOverrides, refetch: refetchOverrides } = useOverrides();
  const { data: taxonomy, isLoading: loadingTaxo, error: errorTaxo } = useDbTaxonomy();
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
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: devices = EMPTY_ROWS, isLoading: loadingDevices, error: errorDevices, refetch: refetchDevices } = useQuery({
    queryKey: ["thiet_bi_cay"], // groupMode is removed from queryKey as it's not used in query
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
            _pl:dm_phan_loai(id),
            _nhKey:dm_nhom_he_thong(id),
            _htId:dm_he_thong(id)
          `)
          .range(from, from + pageSize - 1);

        if (error) throw error;
        const rows = data || [];
        allData.push(...rows);

        if (rows.length < pageSize) break;
        from += pageSize;
      }

      if (allData.length > 0 && allData.length % 1000 === 0) {
        // eslint-disable-next-line no-console
        console.warn(`[MIRATS-T30] Cảnh báo: Số lượng thiết bị (${allData.length}) chia hết cho 1000. Có khả năng dữ liệu bị PostgREST cắt nếu không dùng vòng lặp fetchAll.`);
      }

      return allData.map((d: any) => ({
        ...d,
        _pl: d._pl?.id,
        _nhKey: d._nhKey?.id,
        _htId: d._htId?.id,
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
        ma: h.ma,
        ten: h.ten,
        nhMa: nhom?.ma || h.nhomId || "KHAC",
        nhTen: nhom?.ten || taxonomy?.nhomNameMap.get(h.nhomId || "KHAC") || "Khác",
        plId: h.phanLoaiId || nhom?.phanLoaiId || plList[0]?.id || "KHAC"
      };
    });

    const customGroups = Array.from(overrides?.entries() || [])
      .filter(([k]) => k.startsWith("nh:"))
      .map(([k, v]) => ({
        ma: k.split(":")[1],
        ten: v.ten || "",
        plId: (v.du_lieu as any)?.phan_loai_id || ""
      }))
      .filter(g => g.plId);

    const customSystems = Array.from(overrides?.entries() || [])
      .filter(([k]) => k.startsWith("ht:"))
      .map(([k, v]) => ({
        ma: k.split(":")[1],
        ten: v.ten || "",
        nhMa: (v.du_lieu as any)?.nhom_ma || "",
        plId: (v.du_lieu as any)?.phan_loai_id || ""
      }))
      .filter(s => s.nhMa && s.plId);

    const htDonViMap = (htId: string) => htList.find(h => h.id === htId || h.ma === htId)?.donViId || null;
    
    const ordNh = (ma: string) => (overrides?.get(okey("nh", ma))?.du_lieu as any)?.thu_tu;
    const ordHt = (ma: string) => (overrides?.get(okey("ht", ma))?.du_lieu as any)?.thu_tu;
    const colNh = (ma: string) => (overrides?.get(okey("nh", ma))?.du_lieu as any)?.mau;

    return buildTree(
      devices as any,
      plList,
      htMind,
      nhMind,
      groupMode === "donvi",
      customGroups,
      ordNh,
      ordHt,
      colNh,
      customSystems,
      htDonViMap,
      realSystems
    );
  }, [devices, taxonomy, htMind, nhMind, groupMode, overrides]);

  const viewTree = useMemo(() => filterTreeByBadge(tree as any, badgeFilter), [tree, badgeFilter]);

  const isLoading = loadingOverrides || loadingTaxo || loadingDevices;
  const error = errorOverrides || errorTaxo || errorDevices;
  const state = isLoading ? "loading" : error ? "error" : viewTree.length === 0 ? "empty" : "success";
  const isFiltering = searchQuery.trim() !== "" || badgeFilterActive(badgeFilter);



  const onOpenEditor = useCallback((kind: EditKind, ma: string) => {
    setTarget({ kind, ma });
  }, []);

  const onRecord = useCallback((kind: "tb" | "tp", ma: string) => {
     if (kind === "tb") nav({ to: "/thiet-bi/$maThietBi", params: { maThietBi: ma } });
  }, [nav]);

  const onHistory = useCallback((ma: string) => {
     const id = parseHtSysMa(ma).sysName;
     if (id && id !== NONE_HT) nav({ to: "/he-thong/$id", params: { id } });
  }, [nav]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between bg-background z-10 shrink-0">
         <div className="flex items-center gap-4">
            <PageHeader
              title="Cây Hệ Thống"
              subtitle={tpCount > 0 ? `(${tpCount.toLocaleString("vi-VN")} thành phần)` : undefined}
              icon={ListTree}
            />


            <Tabs value={display} onValueChange={handleDisplayChange}>
              <TabsList>
                <TabsTrigger value="table" className="gap-2"><List className="h-4 w-4"/>Bảng</TabsTrigger>
                <TabsTrigger value="tree" className="gap-2"><ListTree className="h-4 w-4"/>Cây</TabsTrigger>
                <TabsTrigger value="mindmap" className="gap-2"><GitFork className="h-4 w-4"/>Sơ đồ</TabsTrigger>
                <TabsTrigger value="health" className="gap-2"><Activity className="h-4 w-4"/>Sức khỏe</TabsTrigger>
                <TabsTrigger value="history" className="gap-2"><ClipboardList className="h-4 w-4"/>Nhật ký</TabsTrigger>
              </TabsList>
            </Tabs>

         </div>
         <div className="flex items-center gap-2">
            <NodeSearch 
              items={useMemo(() => {
                const list: SearchItem[] = [];
                for (const pl of viewTree) {
                  list.push({ kind: "pl", ma: pl.id, label: pl.ten, plId: pl.id, count: pl.count });
                  for (const lv of pl.fields) {
                    for (const nh of lv.groups) {
                      list.push({ kind: "nh", ma: nh.ma, label: nh.ten, plId: pl.id, lvId: lv.id, count: nh.count });
                      for (const ht of nh.systems) {
                        list.push({ kind: "ht", ma: ht.ma, label: ht.ten, plId: pl.id, lvId: lv.id, nhMa: nh.ma, count: ht.count });
                        for (const d of ht.devices) {
                          list.push({ 
                            kind: "tb", 
                            ma: d.tb.ma_thiet_bi, 
                            label: d.tb.ten || d.tb.ma_thiet_bi, 
                            code: d.tb.ma_thiet_bi,
                            plId: pl.id, lvId: lv.id, nhMa: nh.ma, htMa: ht.ma,
                            sysName: ht.ten
                          });
                        }
                      }
                    }
                  }
                }
                return list;
              }, [viewTree])} 
              onPick={(it) => {
                setSearchQuery(it.label);
                if (it.kind === "ht" || it.kind === "tb" || it.kind === "nh" || it.kind === "pl") {
                  setDisplay("mindmap");
                  nav({ 
                    to: "/he-thong/cay", 
                    search: (prev: any) => ({ ...prev, view: "mindmap" }),
                    replace: true 
                  });
                }
                setFocus({ ...it, nonce: Math.random() });
              }}
            />
            {canManage && (
              <Button 
                variant={editMode ? "default" : "outline"} 
                onClick={() => setEditMode(!editMode)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                {editMode ? "Đang sửa" : "Chỉnh sửa"}
              </Button>
            )}
         </div>
      </div>

      <PageBody noPadding className={cn("min-h-0 flex-1 flex flex-col bg-muted/10 relative", display === "mindmap" && "overflow-hidden")}>
        <DataState
          state={state}
          loadingType="drawer"
          title={isFiltering ? "Không tìm thấy kết quả" : "Cây hệ thống trống"}
          description={
            isFiltering 
              ? "Thử xoá từ khoá tìm kiếm hoặc bộ lọc để xem đầy đủ cây hệ thống."
              : "Hệ thống chưa có dữ liệu cây phân cấp nào."
          }
          onRetry={() => { refetchOverrides(); refetchDevices(); }}
          emptyAction={
            isFiltering ? (
              <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setBadgeFilter({ status: new Set(), imp: new Set() }); }}>
                Xoá tìm kiếm
              </Button>
            ) : undefined
          }
          className="flex-1 flex flex-col min-h-0 h-full w-full"
        >
          {display === "tree" && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
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
                  const id = parseHtSysMa(ma).sysName;
                  if (id && id !== NONE_HT) nav({ to: "/su-co", search: { heThongId: id } });
                }}
                onMaint={(ma) => {
                  const id = parseHtSysMa(ma).sysName;
                  if (id && id !== NONE_HT) nav({ to: "/bao-tri", search: { heThongId: id } });
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
            <div className="flex-1 w-full min-h-[500px] md:min-h-[600px] relative">
              <CayMindMap 
                tree={viewTree as any}
                posByHt={posByHt || new Map()}
                scopeText="Toàn hệ thống"
                canManage={canManage && editMode}
                onRename={(kind, ma, ten) => {
                  renameEntity.mutate({ kind, id: ma, ten, userRoles: roles });
                }}
                onOpenEditor={onOpenEditor}
                onHistory={onHistory}
                onIncident={(ma) => {
                  const id = parseHtSysMa(ma).sysName;
                  if (id && id !== NONE_HT) nav({ to: "/su-co", search: { heThongId: id } });
                }}
                onMaint={(ma) => {
                  const id = parseHtSysMa(ma).sysName;
                  if (id && id !== NONE_HT) nav({ to: "/bao-tri", search: { heThongId: id } });
                }}
                onRecord={onRecord}
                onMoveSystem={(req) => {
                   nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, moveHt: req.heThongId }) });
                }}
                onMoveGroup={(req) => {
                  toast.info(`Di chuyển nhóm ${req.label} (${req.count} HT) sang ${req.toLabel}`);
                }}
                onMoveDevice={(req) => {
                  nav({ to: "/he-thong/cay", search: (prev: any) => ({ ...prev, moveTb: req.deviceMa }) });
                }}

                plMind={plMind}
                nhMind={nhMind}
                htMind={htMind}
                tbMind={tbMind}
                devices={devices}
              />
            </div>
          )}
        </DataState>


        {display === "health" && (
          <div className="h-full overflow-y-auto p-8 flex flex-col items-center justify-center text-muted-foreground bg-background">
            <Activity className="h-12 w-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium">Bản đồ sức khỏe hệ thống</h3>
            <p className="max-w-md text-center text-sm mt-2">Tính năng đang được chuyển sang module HealthMonitor chuyên biệt.</p>
          </div>
        )}

        {display === "history" && (
          <div className="h-full overflow-y-auto p-8 flex flex-col items-center justify-center text-muted-foreground bg-background">
            <ClipboardList className="h-12 w-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium">Nhật ký tác động hệ thống</h3>
            <p className="max-w-md text-center text-sm mt-2">Xem lịch sử thay đổi cấu trúc và điều động thiết bị toàn hệ thống.</p>
          </div>
        )}
      </PageBody>


      <NodeEditorSheet 
        target={target}
        onClose={() => setTarget(null)}
        plLabel={plMind}
        nhLabel={nhMind}
        htLabel={htMind}
        tbMap={new Map(devices.map(d => [d.ma_thiet_bi, d]))}
        canManage={canManage && editMode}
        saving={false} // Chuyển sang dùng state pending của mutation trong Sheet
        onSave={() => {}} // Đã handle bên trong Sheet qua renameEntity/saveCell mutation
        unitCodeOf={() => null}
        isCustomNode={() => false}
        isRealNode={() => true}
        childInfo={{items: []}}
        donViList={taxonomy?.donViList || []}
        physSection={null}
        submit={() => {}}
        renamingGroupCode={false}
        groupCode=""
        setGroupCode={() => {}}
        onRenameGroupCode={() => {}}
        slugMa={(s) => s}
      />

    </div>
  );
}
