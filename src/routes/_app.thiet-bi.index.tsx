import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { useMemo, useRef, useState, useEffect } from "react";
import {
  Search, HardDrive, Loader2, Building2, Layers, Network,
  Wrench, AlertTriangle, Repeat, BookOpen, PackageCheck, UserCheck, Archive, Cpu, ChevronRight, Monitor
} from "lucide-react";
import { PageBody } from "@/components/mirats/PageBody";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfoHint } from "@/components/mirats/InfoHint";
import { PageHeader } from "@/components/mirats/PageHeader";
import { getTrangThaiToken } from "@/lib/mirats/ui/status-tokens";


import { DataState } from "@/components/mirats/DataState";
import { cn } from "@/lib/utils";
import { useScope } from "@/lib/mirats/scope";
import { useDbTaxonomy, useSystemNameOverrides, useDeviceNameOverrides, type DbDevice } from "@/lib/mirats/db-taxonomy";
import { useOperationsData } from "@/lib/mirats/db-operations";
import { useAllViTriChucNang } from "@/lib/mirats/he-thong-thanh-phan";
import { isRetiredStatus } from "@/components/mirats/ThietBiLifecycleActions";
import { TreeView } from "@/components/mirats/so-ly-lich/TreeView";

export const Route = createFileRoute("/_app/thiet-bi/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || "",
  }),
  head: () => ({
    meta: [
      { title: "Sổ lý lịch — MIRATS 2.0" },
      { name: "description", content: "Sổ lý lịch theo cây phân cấp đơn vị → phân loại → hệ thống → thành phần hệ thống." },
      { property: "og:title", content: "Sổ lý lịch — MIRATS 2.0" },
      { property: "og:description", content: "M2 — Sổ lý lịch." },
    ],
  }),
  component: ThietBiPage,
});



/** Tổng hợp số lần bảo dưỡng / sự cố / hỏng hóc theo mã tài sản. */
interface Hist { bt: number; sc: number; hh: number }
const EMPTY_HIST: Hist = { bt: 0, sc: 0, hh: 0 };

/* ------------------------------ Cây phân cấp ------------------------------ */

interface TreeNode {
  key: string;
  label: string;
  sub: TreeNode[];
  devices: DbDevice[]; // đếm số tài sản đang lắp tại thành phần (chỉ dùng ở kind === "tp")
  count: number;
  hist: Hist;
  kind: "dv" | "pl" | "ht" | "tp";
  sysId?: string;   // id hệ thống (kind === "ht")
  tpId?: string;    // id thành phần (kind === "tp"); undefined = nhánh "(Chưa gắn thành phần)"
}

function ThietBiPage() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const { scopeAll, donViCode } = useScope();
  const { data: taxo, isLoading, error } = useDbTaxonomy();
  const { data: nameOv } = useSystemNameOverrides();
  const { data: devNameOv } = useDeviceNameOverrides();
  const { ops } = useOperationsData();

  /** Tên hệ thống đã đồng bộ với cây "Hệ Thống" (ưu tiên tên đã đổi). */
  const htName = useMemo(
    () => (id: string | undefined, fallback: string) => (id && nameOv?.get(id)) || fallback,
    [nameOv],
  );

  /** Tên tài sản đã đồng bộ với cây "Hệ Thống" (ưu tiên tên đã đổi). */
  const tbName = useMemo(
    () => (d: DbDevice) => devNameOv?.get(d.ma_thiet_bi) || d.ten,
    [devNameOv],
  );

  const search = Route.useSearch();
  const [query, setQuery] = useState(search.q || "");

  useEffect(() => {
    if (search.q) setQuery(search.q);
  }, [search.q]);


  const [focused, setFocused] = useState(false);
  const [onlyAllocated, setOnlyAllocated] = useState(false);
  const [showRetired, setShowRetired] = useState(false);
  const navigate = useNavigate();
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const devices = useMemo(() => {
    const all = taxo?.devices ?? [];
    return scopeAll ? all : all.filter((d) => !donViCode || d.don_vi === donViCode);
  }, [taxo, scopeAll, donViCode]);

  // Lịch sử từng tài sản (link với các bảng bao_tri / su_co / hong_hoc).
  const histMap = useMemo(() => {
    const m = new Map<string, Hist>();
    const bump = (ma: string, k: keyof Hist) => {
      if (!ma) return;
      const h = m.get(ma) ?? { bt: 0, sc: 0, hh: 0 };
      h[k]++;
      m.set(ma, h);
    };
    for (const e of ops.baoTri) bump(e.thiet_bi, "bt");
    for (const e of ops.suCo) bump(e.thiet_bi, "sc");
    for (const e of ops.hongHoc) bump(e.thiet_bi_hong, "hh");
    return m;
  }, [ops]);

  const retiredCount = useMemo(
    () => devices.filter((t) => isRetiredStatus(t.trang_thai)).length,
    [devices],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = devices;
    // Mặc định ẩn tài sản đã "nghỉ khai thác" (vẫn xem được qua bộ lọc).
    if (!showRetired) list = list.filter((t) => !isRetiredStatus(t.trang_thai));
    if (onlyAllocated) list = list.filter((t) => t._capPhatTrangThai === "da_cap_phat");
    if (!q) return list;
    return list.filter((t) =>
      t.ma_thiet_bi.toLowerCase().includes(q) ||
      tbName(t).toLowerCase().includes(q) ||
      t.serial.toLowerCase().includes(q) ||
      t.model.toLowerCase().includes(q) ||
      t.nha_san_xuat.toLowerCase().includes(q) ||
      (t._nguoiGiu ?? "").toLowerCase().includes(q) ||
      htName(t._htId, t._htTen).toLowerCase().includes(q)
    );
  }, [devices, query, htName, tbName, onlyAllocated, showRetired]);


  // Gợi ý tương tác cho thanh tìm kiếm: hệ thống (→ sổ hệ thống) + tài sản (→ sổ tài sản).
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    // Đếm số tài sản theo hệ thống (trong phạm vi hiện tại).
    const sysCount = new Map<string, number>();
    for (const d of devices) if (d._htId) sysCount.set(d._htId, (sysCount.get(d._htId) ?? 0) + 1);
    // Hệ thống khớp theo tên.
    const seen = new Set<string>();
    const sysHits: { id: string; ten: string; count: number }[] = [];
    for (const d of devices) {
      if (!d._htId || seen.has(d._htId)) continue;
      const nm = htName(d._htId, d._htTen);
      if (nm.toLowerCase().includes(q)) {
        seen.add(d._htId);
        sysHits.push({ id: d._htId, ten: nm, count: sysCount.get(d._htId) ?? 0 });
      }
    }
    sysHits.sort((a, b) => b.count - a.count).splice(6);
    return { sysHits, devHits: filtered.slice(0, 8), devTotal: filtered.length };
  }, [query, devices, filtered, htName]);

  const openDropdown = focused && !!suggestions && (suggestions.sysHits.length > 0 || suggestions.devHits.length > 0);

  // Vị trí chức năng (thành phần) theo hệ thống, kèm tài sản đang lắp tại vị trí.
  const { data: viTriByHt } = useAllViTriChucNang();

  // Dựng cây: Đơn vị → Phân loại → Hệ thống → Thành phần → Tài sản.
  const tree = useMemo<TreeNode[]>(() => {
    if (!taxo) return [];
    const dvRoots = new Map<string, TreeNode>();
    const donViTenMap = new Map(taxo.donViList.map((d) => [d.id, d.ten]));
    const donViMaMap = new Map(taxo.donViList.map((d) => [d.id, d.ma]));

    const ensure = (
      parent: Map<string, TreeNode>,
      key: string,
      label: string,
      kind: TreeNode["kind"],
      sysId?: string,
    ): TreeNode => {
      let n = parent.get(key);
      if (!n) {
        n = { key, label, sub: [], devices: [], count: 0, hist: { bt: 0, sc: 0, hh: 0 }, kind, sysId };
        parent.set(key, n);
      }
      return n;
    };
    const subMap = (n: TreeNode) => {
      const anyN = n as TreeNode & { _m?: Map<string, TreeNode> };
      if (!anyN._m) anyN._m = new Map();
      return anyN._m;
    };
    const accumulate = (n: TreeNode, devs: DbDevice[]) => {
      for (const d of devs) {
        const h = histMap.get(d.ma_thiet_bi) ?? EMPTY_HIST;
        n.count++;
        n.hist.bt += h.bt; n.hist.sc += h.sc; n.hist.hh += h.hh;
      }
    };

    const devToTp = new Map<string, { tpId: string; tpTen: string; htId: string }>();
    const tpByHt = viTriByHt ?? new Map();
    for (const [htId, tps] of tpByHt) {
      for (const tp of tps) {
        if (tp.device?.thiet_bi_id) {
          devToTp.set(tp.device.thiet_bi_id, {
            tpId: tp.id,
            tpTen: tp.ten || tp.ma_thanh_phan || "(Thành phần)",
            htId,
          });
        }
      }
    }

    const devByHtTp = new Map<string, Map<string, DbDevice[]>>();
    for (const d of filtered) {
      const gan = devToTp.get(d.id);
      const htId = gan?.htId || d._htId || "__no_ht__";
      const tpId = gan?.tpId || "__none__";
      let m = devByHtTp.get(htId);
      if (!m) { m = new Map(); devByHtTp.set(htId, m); }
      const arr = m.get(tpId) ?? [];
      arr.push(d); m.set(tpId, arr);
    }

    const dvIdByMa = new Map(taxo.donViList.map((d) => [d.ma, d.id]));
    const htDvFallback = new Map<string, string>(); 
    for (const d of taxo.devices) {
      if (!d._htId || !d.don_vi) continue;
      const dvId = dvIdByMa.get(d.don_vi);
      if (dvId && !htDvFallback.has(d._htId)) htDvFallback.set(d._htId, dvId);
    }
    const resolveDvId = (h: { id: string; donViId: string }): string =>
      h.donViId || htDvFallback.get(h.id) || "";

    const inScope = (dvId: string): boolean => {
      if (scopeAll) return true;
      if (!donViCode) return true;
      return donViMaMap.get(dvId) === donViCode;
    };

    for (const h of taxo.htList) {
      const dvId = resolveDvId(h);
      if (!inScope(dvId)) continue;
      const dvMa = donViMaMap.get(dvId) || "__no_dv__";
      const dvTen = donViTenMap.get(dvId);
      const dvLabel = dvMa === "__no_dv__" ? "(Chưa gán đơn vị)" : `${dvMa}${dvTen ? " — " + dvTen : ""}`;
      const dvNode = ensure(dvRoots, dvMa, dvLabel, "dv");
      const plId = h.phanLoaiId || "_";
      const plLabel = taxo.plNameMap.get(plId) ?? "(Chưa phân loại)";
      const plNode = ensure(subMap(dvNode), plId, plLabel, "pl");
      const htNode = ensure(subMap(plNode), h.id, htName(h.id, h.ten), "ht", h.id);

      const tps = tpByHt.get(h.id) ?? [];
      for (const tp of tps) {
        const tpDevices = devByHtTp.get(h.id)?.get(tp.id) ?? [];
        const tpNode = ensure(subMap(htNode), `tp:${tp.id}`, tp.ten || tp.ma_thanh_phan || "(Thành phần)", "tp");
        tpNode.tpId = tp.id;
        tpNode.devices.push(...tpDevices);
        accumulate(tpNode, tpDevices);
        accumulate(htNode, tpDevices);
        accumulate(plNode, tpDevices);
        accumulate(dvNode, tpDevices);
      }
      const orphan = devByHtTp.get(h.id)?.get("__none__") ?? [];
      if (orphan.length) {
        const tpNode = ensure(subMap(htNode), "tp:__none__", "(Chưa gắn thành phần)", "tp");
        tpNode.devices.push(...orphan);
        accumulate(tpNode, orphan);
        accumulate(htNode, orphan);
        accumulate(plNode, orphan);
        accumulate(dvNode, orphan);
      }
    }

    const noHtMap = devByHtTp.get("__no_ht__");
    if (noHtMap) {
      for (const arr of noHtMap.values()) {
        for (const d of arr) {
          const dvMa = d.don_vi || "(chưa gán)";
          const dvNode = ensure(dvRoots, dvMa, dvMa, "dv");
          const plNode = ensure(subMap(dvNode), d._pl || "_", d._plTen, "pl");
          const htNode = ensure(subMap(plNode), "__no_ht__", "(Chưa gán hệ thống)", "ht");
          const tpNode = ensure(subMap(htNode), "tp:__none__", "(Chưa gắn thành phần)", "tp");
          tpNode.devices.push(d);
          accumulate(tpNode, [d]);
          accumulate(htNode, [d]);
          accumulate(plNode, [d]);
          accumulate(dvNode, [d]);
        }
      }
    }

    const finalize = (n: TreeNode): TreeNode => {
      const anyN = n as TreeNode & { _m?: Map<string, TreeNode> };
      if (anyN._m) {
        n.sub = [...anyN._m.values()].map(finalize).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "vi"));
        delete anyN._m;
      }
      n.devices.sort((a, b) => a.ma_thiet_bi.localeCompare(b.ma_thiet_bi, "vi"));
      return n;
    };
    return [...dvRoots.values()].map(finalize).sort((a, b) => a.label.localeCompare(b.label, "vi"));
  }, [taxo, filtered, histMap, htName, viTriByHt, scopeAll, donViCode]);


  const state = isLoading ? "loading" : error ? "error" : filtered.length === 0 ? "empty" : "success";
  const isFiltering = query.trim() !== "" || onlyAllocated || showRetired;


  // Lấy danh sách thành phần hiển thị nhanh trên mobile
  const mobileTps = useMemo(() => {
    const list: TreeNode[] = [];
    const walk = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        if (n.kind === 'tp' && n.count > 0) list.push(n);
        if (n.sub.length) walk(n.sub);
      }
    };
    walk(tree);
    return list.slice(0, 15);
  }, [tree]);

  return (
    <PageBody className="flex flex-col gap-4">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="astryx-heading-1">Sổ lý lịch</h1>
          <p className="astryx-text-muted">Đơn vị → Phân loại → Hệ thống → Thành phần</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <AppTooltip noiDung={onlyAllocated ? "Bỏ lọc cấp phát" : "Chỉ hiện tài sản đang cấp phát"}>
            <Button
              variant={onlyAllocated ? "default" : "outline"}
              size="sm"
              onClick={() => setOnlyAllocated((v) => !v)}
              className="astryx-control h-8 w-8 p-0"
            >
              <PackageCheck className="h-4 w-4" />
            </Button>
          </AppTooltip>
          {retiredCount > 0 && (
            <AppTooltip noiDung={showRetired ? "Ẩn tài sản nghỉ KT" : `Hiện ${retiredCount} tài sản nghỉ KT`}>
              <Button
                variant={showRetired ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowRetired((v) => !v)}
                className="astryx-control h-8 w-8 p-0"
              >
                <Archive className="h-4 w-4" />
              </Button>
            </AppTooltip>
          )}
          <div className="astryx-surface relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (blurTimer.current) clearTimeout(blurTimer.current); setFocused(true); }}
              onBlur={() => { blurTimer.current = setTimeout(() => setFocused(false), 150); }}
              placeholder="Tìm mã, tên tài sản hoặc hệ thống..."
              className="h-8 border-none bg-transparent pl-8 text-xs focus-visible:ring-0"
            />
            {openDropdown && suggestions && (
              <div className="astryx-surface absolute right-0 top-full z-50 mt-2 max-h-96 w-[min(30rem,90vw)] overflow-hidden shadow-2xl">
                {suggestions.sysHits.length > 0 && (
                  <div className="py-2">
                    <div className="astryx-text-label px-3 py-1">Hệ thống</div>
                    {suggestions.sysHits.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setQuery(""); setFocused(false); navigate({ to: "/he-thong/$id", params: { id: s.id } }); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                        <span className="min-w-0 flex-1 truncate font-medium">{s.ten}</span>
                        <span className="astryx-badge astryx-badge-primary astryx-number">{s.count} TB</span>
                      </button>
                    ))}
                  </div>
                )}
                {suggestions.devHits.length > 0 && (
                  <div className="border-t border-border py-2">
                    <div className="astryx-text-label px-3 py-1">Tài sản</div>
                    {suggestions.devHits.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setQuery(""); setFocused(false); navigate({ to: "/thiet-bi/$maThietBi", params: { maThietBi: d.ma_thiet_bi }, search: { tab: "tong-quan", doc: undefined, q: undefined } }); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <HardDrive className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{tbName(d)}</span>
                            <span className="astryx-number text-[10px] opacity-60">{d.ma_thiet_bi}</span>
                          </div>
                          <div className="astryx-text-muted text-[10px]">{htName(d._htId, d._htTen)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2">
        <div className="p-0">
          <DataState
            state={state}
            loadingType="table"
            title={isFiltering ? "Không tìm thấy tài sản" : "Không có dữ liệu tài sản"}
            description={
              isFiltering
                ? "Thử thay đổi từ khoá hoặc xoá các bộ lọc để tìm kiếm rộng hơn."
                : "Hệ thống chưa có dữ liệu tài sản nào được đăng ký."
            }
            onRetry={() => window.location.reload()}
            emptyAction={
              isFiltering ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setOnlyAllocated(false);
                    setShowRetired(false);
                  }}
                >
                  Xoá tất cả bộ lọc
                </Button>
              ) : undefined
            }
          >
            {isMobile ? (
              <div className="grid grid-cols-1 gap-4">
                {mobileTps.map(n => (
                  <Card key={n.key} className="relative overflow-hidden border-l-4 border-l-primary">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-sm">{n.label}</h3>
                        <Badge variant="outline" className="text-[10px]">{n.count} TB</Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Wrench className="w-3 h-3" /> {n.hist.bt} bảo dưỡng
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          <AlertTriangle className="w-3 h-3" /> {n.hist.sc} sự cố
                        </div>
                      </div>
                      <div className="pt-2 border-t mt-2 flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground uppercase">{n.key}</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                           <Link to="/thiet-bi" search={{ q: n.label }}>Khám phá <ChevronRight className="w-3 h-3" /></Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed">
                  <p className="text-xs text-muted-foreground italic">Sử dụng thanh tìm kiếm để tra cứu nhanh Tài sản hoặc Hệ thống trên điện thoại</p>
                </div>
              </div>
            ) : (
              <TreeView tree={tree} total={filtered.length} histMap={histMap} />
            )}
          </DataState>
        </div>
      </div>
    </PageBody>
  );
}
