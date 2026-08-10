import { useMemo, useState, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ListTree, GitFork, List, Search as SearchIcon, Pencil
} from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/backend/client";
import {
  useDbTaxonomy,
  type DbDevice, type DbTaxonomy,
} from "@/lib/mirats/db-taxonomy";
import { useAllViTriChucNang } from "@/lib/mirats/he-thong-thanh-phan";
import { useMyPermissions, useCan } from "@/hooks/use-permissions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseHtSysMa } from "@/lib/mirats/phan-loai";

import { CayProvider, useCayContext } from "@/components/mirats/he-thong-cay/CayContext";
import { TreeView } from "@/components/mirats/he-thong-cay/TreeView";
import { CayMindMap } from "@/components/mirats/he-thong-cay/CayMindMap";
import { NodeEditorSheet } from "@/components/mirats/he-thong-cay/NodeEditorSheet";
import { buildTree, filterTreeByBadge, okey, NONE_HT } from "@/components/mirats/he-thong-cay/utils";
import type { 
  EditKind, OverrideMap 
} from "@/components/mirats/he-thong-cay/types";

export const Route = createFileRoute("/_app/he-thong/cay")({
  validateSearch: (search: Record<string, unknown>): { editTb?: string } => ({
    editTb: typeof search.editTb === "string" ? search.editTb : undefined,
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
  const canManage = useCan("he-thong", "manage");

  const {
    display, setDisplay,
    editMode, setEditMode,
    searchQuery, setSearchQuery,
    badgeFilter,
    groupMode,
  } = useCayContext();

  const [target, setTarget] = useState<{ kind: EditKind; ma: string } | null>(null);

  const { data: overrides } = useOverrides();
  const { data: taxonomy } = useDbTaxonomy();
  const plMind = usePlMind(overrides, taxonomy);
  const nhMind = useNhMind(overrides, taxonomy);
  const htMind = useHtMind(overrides, taxonomy);
  const tbMind = useTbMind(overrides);

  const { data: posByHt } = useAllViTriChucNang();

  const { data: devices = EMPTY_ROWS } = useQuery({
    queryKey: ["thiet_bi_cay", groupMode],
    queryFn: async () => {
      let q = supabase.from("thiet_bi").select(`
        *,
        _loaiTbTen:dm_loai_thiet_bi(ten),
        _loaiTbOrder:dm_loai_thiet_bi(thu_tu),
        _pl:dm_phan_loai(id),
        _nhKey:dm_nhom_he_thong(id),
        _htId:dm_he_thong(id)
      `);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        _pl: d._pl?.id,
        _nhKey: d._nhKey?.id,
        _htId: d._htId?.id,
        _loaiTbTen: d._loaiTbTen?.ten,
        _loaiTbOrder: d._loaiTbOrder?.thu_tu
      }));
    }
  });

  const { tree } = useMemo(() => buildTree(
    devices as any,
    taxonomy?.plList || [],
    htMind,
    nhMind
  ), [devices, taxonomy, htMind, nhMind]);

  const viewTree = useMemo(() => filterTreeByBadge(tree as any, badgeFilter), [tree, badgeFilter]);

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
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 border-b flex items-center justify-between bg-background z-10 shrink-0">
         <div className="flex items-center gap-4">
           <h1 className="text-xl font-bold flex items-center gap-2">
             <ListTree className="h-5 w-5 text-primary" />
             Cây Hệ Thống
           </h1>
           <Tabs value={display} onValueChange={(v) => setDisplay(v as any)}>
             <TabsList>
               <TabsTrigger value="tree" className="gap-2"><List className="h-4 w-4"/>Cây</TabsTrigger>
               <TabsTrigger value="mindmap" className="gap-2"><GitFork className="h-4 w-4"/>Sơ đồ</TabsTrigger>
             </TabsList>
           </Tabs>
         </div>
         <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm kiếm..." 
                className="w-64 pl-9" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
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

      <div className="flex-1 overflow-hidden relative bg-muted/10">
        {display === "tree" ? (
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
              onIncident={() => {}}
              onMaint={() => {}}
              onRecord={onRecord}
              onRename={() => {}}
              onMoveSystem={() => {}}
              onMoveGroup={() => {}}
              onMoveDevice={() => {}}
              posByHt={posByHt || new Map()}
            />
          </div>
        ) : (
          <CayMindMap 
            tree={viewTree as any}
            posByHt={posByHt || new Map()}
            scopeText="Toàn hệ thống"
            canManage={canManage && editMode}
            onRename={() => {}}
            onOpenEditor={onOpenEditor}
            onHistory={onHistory}
            onIncident={() => {}}
            onMaint={() => {}}
            onRecord={onRecord}
            onMoveSystem={() => {}}
            plMind={plMind}
            nhMind={nhMind}
            htMind={htMind}
            tbMind={tbMind}
          />
        )}
      </div>

      <NodeEditorSheet 
        target={target}
        onClose={() => setTarget(null)}
        plLabel={plMind}
        nhLabel={nhMind}
        htLabel={htMind}
        tbMap={new Map(devices.map(d => [d.ma_thiet_bi, d]))}
        canManage={canManage && editMode}
        saving={false}
        onSave={() => {}}
        onDelete={() => {}}
        unitCodeOf={() => null}
        isCustomNode={() => false}
        isRealNode={() => true}
        plGroups={[]}
        onAddGroup={() => {}}
        childInfo={{items: []}}
        onAddSystem={() => {}}
        donViList={[]}
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
