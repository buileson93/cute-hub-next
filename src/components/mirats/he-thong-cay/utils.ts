import { 
  PlGroup, LvGroup, NhGroup, HtGroup, DevNode, 
  StatusCat, ImpCat, BadgeFilter, InfoChip
} from "./types";
import { DbDevice, DbTaxonomy } from "@/lib/mirats/db-taxonomy";
import { htSysMa, parseHtSysMa, HT_KHAC } from "@/lib/mirats/phan-loai";

export const DUNG_KHAI_THAC_TEN = "Dừng khai thác";
export const NONE_HT = "__none__";

export function statusCat(tt: string): StatusCat {
  const v = (tt ?? "").toLowerCase();
  if (!v || v.includes("chưa rõ")) return "khac";
  if (v.includes("hỏng") || v.includes("lỗi")) return "hong";
  if (v.includes("dự phòng")) return "du_phong";
  if (v.includes("chấm dứt") || v.includes("điều chuyển") || v.includes("ngừng")) return "ngung";
  if (v.includes("hoạt động") || v.includes("khai thác")) return "hoat_dong";
  return "khac";
}

export function impCat(v: string): ImpCat {
  const s = (v ?? "").toLowerCase();
  if (s.includes("đặc biệt") || s.includes("trọng yếu") || s.includes("nhóm 1")) return "trong_yeu";
  if (s.includes("quan trọng") || s.includes("nhóm 2")) return "quan_trong";
  return "thuong";
}

export function deviceMatchesBadge(d: any, f: BadgeFilter): boolean {
  if (f.status.size > 0 && !f.status.has(statusCat(d.trang_thai ?? ""))) return false;
  if (f.imp.size > 0 && !f.imp.has(impCat(d.muc_do_quan_trong ?? ""))) return false;
  return true;
}

export function badgeFilterActive(f: BadgeFilter): boolean {
  return f.status.size > 0 || f.imp.size > 0;
}

export function filterTreeByBadge(tree: PlGroup[], f: BadgeFilter): PlGroup[] {
  if (!badgeFilterActive(f)) return tree;
  const out: PlGroup[] = [];
  for (const pl of tree) {
    const fields: LvGroup[] = [];
    for (const lv of pl.fields) {
      const groups: NhGroup[] = [];
      for (const nh of lv.groups) {
        const systems: HtGroup[] = [];
        for (const ht of nh.systems) {
          const devices: DevNode[] = [];
          for (const d of ht.devices) {
            const children = d.children.filter((c: any) => deviceMatchesBadge(c, f));
            const self = deviceMatchesBadge(d.tb, f);
            if (self || children.length) devices.push({ tb: d.tb, children });
          }
          const count = devices.reduce((n, d) => n + 1 + d.children.length, 0);
          if (devices.length) systems.push({ ...ht, devices, count });
        }
        const count = systems.reduce((n, s) => n + s.count, 0);
        if (systems.length) groups.push({ ...nh, systems, count });
      }
      const count = groups.reduce((n, g) => n + g.count, 0);
      if (groups.length) fields.push({ ...lv, groups, count });
    }
    const count = fields.reduce((n, lv) => n + lv.count, 0);
    if (fields.length) out.push({ ...pl, fields, count });
  }
  return out;
}

export function deviceChips(d: any): InfoChip[] {
  const chips: InfoChip[] = [];
  const vt = (d.vi_tri ?? "").trim();
  if (vt) chips.push({ text: vt, className: "border-border bg-muted/60 text-muted-foreground", title: `Vị trí lắp đặt: ${vt}` });
  return chips;
}

export const NH_COLORS: Array<{ id: string; label: string; list: string; mind: string; dot: string }> = [
  { id: "violet", label: "Tím", list: "bg-violet-500/5", mind: "border-violet-500/40 bg-violet-500/5", dot: "bg-violet-500" },
  { id: "blue", label: "Xanh dương", list: "bg-blue-500/5", mind: "border-blue-500/40 bg-blue-500/5", dot: "bg-blue-500" },
  { id: "emerald", label: "Xanh lá", list: "bg-emerald-500/5", mind: "border-emerald-500/40 bg-emerald-500/5", dot: "bg-emerald-500" },
  { id: "amber", label: "Vàng", list: "bg-amber-500/5", mind: "border-amber-500/40 bg-amber-500/5", dot: "bg-amber-500" },
  { id: "rose", label: "Đỏ", list: "bg-rose-500/5", mind: "border-rose-500/40 bg-rose-500/5", dot: "bg-rose-500" },
  { id: "sky", label: "Xanh biển", list: "bg-sky-500/5", mind: "border-sky-500/40 bg-sky-500/5", dot: "bg-sky-500" },
  { id: "cyan", label: "Lục lam", list: "bg-cyan-500/5", mind: "border-cyan-500/40 bg-cyan-500/5", dot: "bg-cyan-500" },
  { id: "slate", label: "Xám", list: "bg-slate-500/5", mind: "border-slate-500/40 bg-slate-500/5", dot: "bg-slate-500" },
];

export const NH_COLOR_MAP = new Map(NH_COLORS.map((c) => [c.id, c]));
export const nhMindTone = (mau?: string) => (mau ? NH_COLOR_MAP.get(mau)?.mind : undefined);

export const okey = (kind: string, ma: string) => `${kind}:${ma}`;

import { STATUS_TONE, IMP_TONE } from "./types";

export function statusTone(tt: string): string {
  const c = statusCat(tt);
  return c === "khac" && (tt ?? "").trim() ? "border-blue-500/30 bg-blue-500/10 text-blue-600" : STATUS_TONE[c];
}

export function importanceTone(v: string): string {
  return IMP_TONE[impCat(v)];
}



export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isRealSystemId(id: string | null | undefined): id is string {
  return !!id && id !== NONE_HT && UUID_RE.test(id);
}

export function cmpDeviceByLoai(a: DevNode, b: DevNode): number {
  const oa = a.tb._loaiTbOrder ?? 9999;
  const ob = b.tb._loaiTbOrder ?? 9999;
  const ta = (a.tb._loaiTbTen ?? "").trim();
  const tb = (b.tb._loaiTbTen ?? "").trim();
  if (!ta !== !tb) return ta ? -1 : 1;
  if (oa !== ob) return oa - ob;
  if (ta !== tb) return ta.localeCompare(tb, "vi");
  return a.tb.ma_thiet_bi.localeCompare(b.tb.ma_thiet_bi);
}

export function buildTree(
  devices: DbDevice[],
  plList: DbTaxonomy["plList"],
  htLabel: (ma: string) => string,
  nhLabel: (ma: string) => string,
  customGroups: Array<{ ma: string; ten: string; plId: string }> = [],
  ordNh: (ma: string) => number | undefined = () => undefined,
  ordHt: (ma: string) => number | undefined = () => undefined,
  colNh: (ma: string) => string | undefined = () => undefined,
  customSystems: Array<{ ma: string; ten: string; nhMa: string; plId: string }> = [],
  htDonVi: (htId: string) => string | null = () => null,
  realSystems: Array<{ ma: string; ten: string; nhMa: string; nhTen: string; plId: string }> = [],
): { tree: PlGroup[]; total: number } {
  const acc = new Map<string, Map<string, Map<string, DevNode[]>>>();
  for (const t of devices) {
    const pl = t._pl || "__nopl__";
    const nh = t._nhKey || "KHAC";
    const ht = t._htId || NONE_HT;
    let m1 = acc.get(pl); if (!m1) { m1 = new Map(); acc.set(pl, m1); }
    let m2 = m1.get(nh); if (!m2) { m2 = new Map(); m1.set(nh, m2); }
    let list = m2.get(ht); if (!list) { list = []; m2.set(ht, list); }
    list.push({ tb: t, children: [] });
  }

  const totalOf = (devs: DevNode[]) => devs.reduce((n, d) => n + 1 + d.children.length, 0);
  const plOrder = new Map(plList.map((p, i) => [p.id, i]));
  const plTenMap = new Map(plList.map((p) => [p.id, p.ten]));
  const plToneMap = new Map(plList.map((p) => [p.id, p.tone]));

  const tree: PlGroup[] = [];
  let total = 0;
  const plIdSet = new Set<string>(acc.keys());
  for (const rs of realSystems) if (rs.plId) plIdSet.add(rs.plId);
  for (const cg of customGroups) if (cg.plId) plIdSet.add(cg.plId);
  for (const cs of customSystems) if (cs.plId) plIdSet.add(cs.plId);
  const plIds = [...plIdSet].sort((a, b) => (plOrder.get(a) ?? 999) - (plOrder.get(b) ?? 999));
  for (const plId of plIds) {
    const m1 = acc.get(plId) ?? new Map<string, Map<string, DevNode[]>>();
    const groups: NhGroup[] = [];
    for (const [nhKey, m2] of m1) {
      const systems: HtGroup[] = [];
      for (const [htId, devs] of m2) {
        devs.sort(cmpDeviceByLoai);
        const ma = htSysMa(nhKey, htId);
        const dvCount = new Map<string, number>();
        for (const d of devs) {
          const dv = (d.tb.don_vi ?? "").trim();
          if (dv) dvCount.set(dv, (dvCount.get(dv) ?? 0) + 1);
        }
        let donViMa: string | null = htDonVi(htId);
        if (!donViMa) {
          let best = 0;
          for (const [dv, n] of dvCount) if (n > best) { best = n; donViMa = dv; }
        }
        systems.push({ ma, ten: htLabel(ma), devices: devs, count: totalOf(devs), donViMa });
      }
      systems.sort((a, b) => {
        const da = (a.donViMa ?? "").trim();
        const db = (b.donViMa ?? "").trim();
        if (da !== db) {
          if (!da) return 1;
          if (!db) return -1;
          return da.localeCompare(db, "vi");
        }
        return (ordHt(a.ma) ?? 1e9) - (ordHt(b.ma) ?? 1e9) || a.ten.localeCompare(b.ten, "vi");
      });
      groups.push({ ma: nhKey, ten: nhLabel(nhKey), systems, count: systems.reduce((n, s) => n + s.count, 0), mau: colNh(nhKey) });
    }
    for (const cg of customGroups) {
      if (cg.plId !== plId) continue;
      if (groups.some((g) => g.ma === cg.ma)) continue;
      groups.push({ ma: cg.ma, ten: nhLabel(cg.ma), systems: [], count: 0, mau: colNh(cg.ma), isCustom: true });
    }
    for (const cs of customSystems) {
      if (cs.plId !== plId) continue;
      const g = groups.find((gr) => gr.ma === cs.nhMa);
      if (g && !g.systems.some((s) => s.ma === cs.ma)) {
        g.systems.push({ ma: cs.ma, ten: htLabel(cs.ma), devices: [], count: 0, donViMa: null, isCustom: true });
      }
    }
    for (const rs of realSystems) {
      if (rs.plId !== plId) continue;
      let g = groups.find((gr) => gr.ma === rs.nhMa);
      if (!g) {
        g = { ma: rs.nhMa, ten: rs.nhTen, systems: [], count: 0, mau: colNh(rs.nhMa) };
        groups.push(g);
      }
      if (!g.systems.some((s) => s.ma === rs.ma)) {
        g.systems.push({ ma: rs.ma, ten: rs.ten, devices: [], count: 0, donViMa: htDonVi(parseHtSysMa(rs.ma).sysName) });
      }
    }
    groups.sort((a, b) => (ordNh(a.ma) ?? 1e9) - (ordNh(b.ma) ?? 1e9) || a.ten.localeCompare(b.ten, "vi"));
    const fields: LvGroup[] = [{ id: "all", ten: "Tất cả", groups, count: groups.reduce((n, g) => n + g.count, 0), passthrough: true }];
    const count = fields.reduce((n, lv) => n + lv.count, 0);
    tree.push({ id: plId, ten: plTenMap.get(plId) || plId, tone: plToneMap.get(plId) || "", fields, count });
    total += count;
  }
  return { tree, total };
}
