import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Search, HardDrive, Loader2, ChevronRight, Building2, Layers, Network,
  Wrench, AlertTriangle, Repeat, BookOpen, PackageCheck, UserCheck, Archive, Cpu,
} from "lucide-react";
import { PageBody } from "@/components/mirats/PageBody";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InfoHint } from "@/components/mirats/InfoHint";
import { PageHeader } from "@/components/mirats/PageHeader";
import { getTrangThaiToken } from "@/lib/mirats/ui/status-tokens";


import { EmptyState } from "@/components/mirats/EmptyState";
import { LyLichThanhPhanPanel } from "@/components/mirats/LyLichLayerPanel";
import { cn } from "@/lib/utils";
import { useScope } from "@/lib/mirats/scope";
import { useDbTaxonomy, useSystemNameOverrides, useDeviceNameOverrides, type DbDevice } from "@/lib/mirats/db-taxonomy";
import { useOperationsData } from "@/lib/mirats/db-operations";
import { useAllViTriChucNang } from "@/lib/mirats/he-thong-thanh-phan";
import { isRetiredStatus } from "@/components/mirats/ThietBiLifecycleActions";

export const Route = createFileRoute("/_app/thiet-bi/")({
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

  const [query, setQuery] = useState("");
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
  // Nguồn: dm_he_thong (mọi hệ thống đang có) + he_thong_thanh_phan (mọi thành
  // phần đang có), gắn tài sản (filtered) vào thành phần qua gan_chuc_nang.
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

    // 1. Bản đồ thiết bị → thành phần đang gắn (từ gan_chuc_nang hiệu lực).
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

    // 2. Phân devices theo (htId, tpId). __none__ = chưa gắn thành phần.
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

    // Fallback đơn vị: nếu hệ thống chưa gán don_vi_id, suy ra từ đơn vị của
    // tài sản đang gắn trong hệ thống (từ trường d.don_vi = mã đơn vị).
    const dvIdByMa = new Map(taxo.donViList.map((d) => [d.ma, d.id]));
    const htDvFallback = new Map<string, string>(); // htId -> donViId
    for (const d of taxo.devices) {
      if (!d._htId || !d.don_vi) continue;
      const dvId = dvIdByMa.get(d.don_vi);
      if (dvId && !htDvFallback.has(d._htId)) htDvFallback.set(d._htId, dvId);
    }
    const resolveDvId = (h: { id: string; donViId: string }): string =>
      h.donViId || htDvFallback.get(h.id) || "";

    // Trong phạm vi đơn vị hiện tại (theo mã đơn vị).
    const inScope = (dvId: string): boolean => {
      if (scopeAll) return true;
      if (!donViCode) return true;
      return donViMaMap.get(dvId) === donViCode;
    };

    // 3. Duyệt tất cả hệ thống trong danh mục — cả hệ thống chưa gắn tài sản.
    for (const h of taxo.htList) {
      const dvId = resolveDvId(h);
      if (!inScope(dvId)) continue;
      const dvMa = donViMaMap.get(dvId) || "__no_dv__";
      const dvTen = donViTenMap.get(dvId);
      const dvLabel = dvMa === "__no_dv__"
        ? "(Chưa gán đơn vị)"
        : `${dvMa}${dvTen ? " — " + dvTen : ""}`;
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

    // 4. Tài sản không có he_thong_id → nhánh "(Chưa gán hệ thống)".
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


  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 p-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Đang tải sổ lý lịch từ cơ sở dữ liệu…
      </div>
    );
  }
  if (error) {
    return <div className="p-8 text-sm text-destructive">Không tải được dữ liệu: {error instanceof Error ? error.message : "Lỗi"}</div>;
  }

  return (
    <PageBody>
      <PageHeader
        icon={BookOpen}
        title="Sổ lý lịch"
        help="Duyệt theo cây phân cấp, mở tới từng tài sản để xem lịch sử bảo dưỡng, sự cố, hỏng hóc & thay thế."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Cây sổ lý lịch</CardTitle>
              <InfoHint>Duyệt theo cây phân cấp, mở tới từng tài sản để xem lịch sử bảo dưỡng, sự cố, hỏng hóc &amp; thay thế.</InfoHint>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setOnlyAllocated((v) => !v)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors",
                onlyAllocated ? "border-amber-300 bg-amber-50 text-amber-700" : "hover:bg-muted",
              )}
              title="Chỉ hiện tài sản đang được cấp phát"
            >
              <PackageCheck className="h-4 w-4" /> Đang cấp phát
            </button>
            {retiredCount > 0 && (
              <button
                type="button"
                onClick={() => setShowRetired((v) => !v)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors",
                  showRetired ? "border-slate-400 bg-slate-100 text-slate-700" : "hover:bg-muted",
                )}
                title="Hiện cả tài sản đã ngừng khai thác / thanh lý"
              >
                <Archive className="h-4 w-4" /> {showRetired ? "Đang hiện" : "Hiện"} nghỉ KT ({retiredCount})
              </button>
            )}
            <div className="relative sm:w-80">

              <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (blurTimer.current) clearTimeout(blurTimer.current); setFocused(true); }}
                onBlur={() => { blurTimer.current = setTimeout(() => setFocused(false), 150); }}
                placeholder="Tìm mã, tên, serial, hệ thống…"
                className="pl-9"
              />

              {openDropdown && suggestions && (
                <div className="absolute right-0 top-full z-50 mt-2 max-h-96 w-[min(30rem,90vw)] overflow-y-auto overflow-x-hidden rounded-xl border border-border bg-popover shadow-xl">
                  {suggestions.sysHits.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Hệ thống</div>
                      {suggestions.sysHits.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); setQuery(""); setFocused(false); navigate({ to: "/he-thong/$id", params: { id: s.id } }); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                        >
                          <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                          <span className="min-w-0 flex-1 truncate font-medium">{s.ten}</span>
                          <Badge variant="secondary" className="shrink-0 tabular-nums">{s.count} TB</Badge>
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Sổ hệ thống</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {suggestions.devHits.length > 0 && (
                    <div className="border-t border-border py-1">
                      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Tài sản</div>
                      {suggestions.devHits.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); setQuery(""); setFocused(false); navigate({ to: "/thiet-bi/$maThietBi", params: { maThietBi: d.ma_thiet_bi } }); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                        >
                          <HardDrive className="h-4 w-4 shrink-0 text-foreground/60" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-primary">{d.ma_thiet_bi}</span>
                              <span className="min-w-0 flex-1 truncate">{tbName(d)}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn("shrink-0 border", getTrangThaiToken(d.trang_thai)?.class)}>
                            {d.trang_thai}
                          </Badge>

                          {d._htTen && (
                            <Badge variant="outline" className="shrink-0 gap-1 border-primary/30 text-primary" title="Hệ thống">
                              <Network className="h-3 w-3" />
                              <span className="max-w-[12rem] truncate">{htName(d._htId, d._htTen)}</span>
                            </Badge>
                          )}
                        </button>

                      ))}
                      {suggestions.devTotal > suggestions.devHits.length && (
                        <div className="px-3 py-1.5 text-center text-[11px] text-muted-foreground">
                          … và {suggestions.devTotal - suggestions.devHits.length} tài sản khác trong cây bên dưới
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TreeView tree={tree} total={filtered.length} histMap={histMap} />
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------ Cây (view) ------------------------------ */

function HistBadges({ hist, compact }: { hist: Hist; compact?: boolean }) {
  if (hist.bt === 0 && hist.sc === 0 && hist.hh === 0) {
    return compact ? null : <span className="text-xs text-muted-foreground">Chưa có lịch sử</span>;
  }
  return (
    <span className="flex items-center gap-1">
      {hist.bt > 0 && <Badge variant="outline" className="gap-1 border-slate-300 text-slate-600" title="Bảo dưỡng"><Wrench className="h-3 w-3" />{hist.bt}</Badge>}
      {hist.sc > 0 && <Badge variant="outline" className="gap-1 border-red-300 text-red-600" title="Sự cố"><AlertTriangle className="h-3 w-3" />{hist.sc}</Badge>}
      {hist.hh > 0 && <Badge variant="outline" className="gap-1 border-orange-300 text-orange-600" title="Hỏng hóc / thay thế"><Repeat className="h-3 w-3" />{hist.hh}</Badge>}
    </span>
  );
}

function TreeView({ tree, total, histMap }: { tree: TreeNode[]; total: number; histMap: Map<string, Hist> }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (k: string) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(k)) next.delete(k); else next.add(k);
    return next;
  });
  const [tpOpen, setTpOpen] = useState<{ id: string; label: string } | null>(null);

  if (total === 0) {
    return (
      <EmptyState
        icon={HardDrive}
        title="Không có tài sản phù hợp"
        description="Chưa có tài sản nào khớp bộ lọc. Thử bỏ bớt điều kiện tìm kiếm hoặc mở phạm vi đơn vị."
      />
    );
  }


  return (
    <>
      <div className="rounded-md border divide-y">
        {tree.map((n) => (
          <TreeBranch
            key={n.key} node={n} depth={0} path={n.key}
            open={open} toggle={toggle} histMap={histMap}
            icon={Building2}
            onOpenTp={(id, label) => setTpOpen({ id, label })}
          />
        ))}
      </div>
      <Dialog open={!!tpOpen} onOpenChange={(v) => { if (!v) setTpOpen(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Lý lịch thành phần — {tpOpen?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <LyLichThanhPhanPanel thanhPhanId={tpOpen?.id ?? null} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const DEPTH_ICON = [Building2, Layers, Network, Cpu];

function TreeBranch({
  node, depth, path, open, toggle, histMap, icon: Icon, onOpenTp,
}: {
  node: TreeNode; depth: number; path: string; open: Set<string>; toggle: (k: string) => void;
  histMap: Map<string, Hist>; icon: React.ComponentType<{ className?: string }>;
  onOpenTp: (id: string, label: string) => void;
}) {
  const isOpen = open.has(path);
  const isTp = node.kind === "tp";
  const NextIcon = DEPTH_ICON[Math.min(depth + 1, DEPTH_ICON.length - 1)];

  // Thành phần là LÁ: click để mở sổ lý lịch thành phần (không có tài sản con).
  if (isTp) {
    const hasLyLich = Boolean(node.tpId);
    return (
      <div className="flex items-center gap-1 pr-3 hover:bg-muted/50">
        <button
          type="button"
          onClick={() => hasLyLich && onOpenTp(node.tpId!, node.label)}
          disabled={!hasLyLich}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 py-2 pl-3 text-left text-sm",
            hasLyLich ? "cursor-pointer" : "cursor-default text-muted-foreground",
          )}
          style={{ paddingLeft: 12 + depth * 18 }}
          title={hasLyLich ? "Mở sổ lý lịch thành phần" : "Nhánh gộp — không có sổ riêng"}
        >
          <Cpu className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate font-medium">{node.label}</span>
          <HistBadges hist={node.hist} compact />
          <Badge variant="secondary" className="ml-1 tabular-nums" title="Số tài sản đang lắp">
            {node.devices.length}
          </Badge>
          {hasLyLich && (
            <span className="ml-1 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              Sổ lý lịch
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1 pr-3 hover:bg-muted/50">
        <button
          onClick={() => toggle(path)}
          className="flex min-w-0 flex-1 items-center gap-2 py-2 pl-3 text-left text-sm"
          style={{ paddingLeft: 12 + depth * 18 }}
        >
          <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate font-medium">{node.label}</span>
          <HistBadges hist={node.hist} compact />
          <Badge variant="secondary" className="ml-1 tabular-nums">{node.count}</Badge>
        </button>
        {node.kind === "ht" && node.sysId && (
          <Link
            to="/he-thong/$id"
            params={{ id: node.sysId }}
            onClick={(e) => e.stopPropagation()}
            className="flex shrink-0 items-center gap-1 rounded border px-2 py-1 text-xs text-primary hover:bg-primary/10"
            title="Mở sổ lý lịch hệ thống"
          >
            <BookOpen className="h-3.5 w-3.5" /> Sổ hệ thống
          </Link>
        )}
      </div>

      {isOpen && (
        <div>
          {node.sub.map((c) => (
            <TreeBranch
              key={c.key} node={c} depth={depth + 1} path={`${path}/${c.key}`}
              open={open} toggle={toggle} histMap={histMap} icon={NextIcon}
              onOpenTp={onOpenTp}
            />
          ))}
        </div>
      )}
    </PageBody>

  );
}
