import { 
  PlGroup, LvGroup, NhGroup, HtGroup, DevNode, 
  StatusCat, ImpCat, BadgeFilter, InfoChip
} from "./types";
import { DbDevice, DbTaxonomy } from "@/lib/mirats/db-taxonomy";
import { htSysMa, parseHtSysMa, HT_KHAC } from "@/lib/mirats/phan-loai";
export { htSysMa };

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
  groupByLoai: boolean = false,
  customGroups: Array<{ ma: string; ten: string; plId: string }> = [],
  ordNh: (ma: string) => number | undefined = () => undefined,
  ordHt: (ma: string) => number | undefined = () => undefined,
  colNh: (ma: string) => string | undefined = () => undefined,
  customSystems: Array<{ ma: string; ten: string; nhMa: string; plId: string }> = [],
  htDonVi: (htId: string) => string | null = () => null,
  realSystems: Array<{ ma: string; ten: string; nhMa: string; nhTen: string; plId: string }> = [],
): { tree: PlGroup[]; total: number } {
  // acc: plId -> nhMa -> htId -> devices
  const acc = new Map<string, Map<string, Map<string, DevNode[]>>>();
  
  // 1. Phân bổ tài sản hiện có
  for (const t of devices) {
    const pl = t._pl || "__nopl__";
    const nh = t._nhKey || "KHAC";
    const ht = t._htId || NONE_HT;
    let m1 = acc.get(pl); if (!m1) { m1 = new Map(); acc.set(pl, m1); }
    let m2 = m1.get(nh); if (!m2) { m2 = new Map(); m1.set(nh, m2); }
    let list = m2.get(ht); if (!list) { list = []; m2.set(ht, list); }
    
    // Đếm tài sản thật
    list.push({ tb: t, children: [] });
  }

  const totalOf = (devs: DevNode[]) => {
    let count = 0;
    for (const d of devs) {
      count += 1; // Bản thân thiết bị
      // Đảm bảo đếm cả thành phần con nếu có
      if (d.children && d.children.length > 0) {
        count += d.children.length;
      }
    }
    return count;
  };
  const plOrder = new Map(plList.map((p, i) => [p.id, i]));
  const plTenMap = new Map(plList.map((p) => [p.id, p.ten]));
  const plToneMap = new Map(plList.map((p) => [p.id, p.tone]));

  // Tập hợp tất cả PL ID cần hiển thị
  const plIdSet = new Set<string>(acc.keys());
  for (const rs of realSystems) if (rs.plId) plIdSet.add(rs.plId);
  for (const cg of customGroups) if (cg.plId) plIdSet.add(cg.plId);
  for (const cs of customSystems) if (cs.plId) plIdSet.add(cs.plId);
  
  const plIds = [...plIdSet].sort((a, b) => (plOrder.get(a) ?? 999) - (plOrder.get(b) ?? 999));

  const tree: PlGroup[] = [];
  let total = 0;

  for (const plId of plIds) {
    const m1 = acc.get(plId) ?? new Map<string, Map<string, DevNode[]>>();
    const groups: NhGroup[] = [];

    // Lấy tập hợp NH Mã từ tài sản + custom + real
    const nhMaSet = new Set<string>(m1.keys());
    for (const rs of realSystems) if (rs.plId === plId) nhMaSet.add(rs.nhMa);
    for (const cg of customGroups) if (cg.plId === plId) nhMaSet.add(cg.ma);

    for (const nhMa of nhMaSet) {
      const m2 = m1.get(nhMa) ?? new Map<string, DevNode[]>();
      const systems: HtGroup[] = [];

      // Lấy tập hợp HT Id từ tài sản + custom + real
      const htIdSet = new Set<string>(m2.keys());
      for (const rs of realSystems) if (rs.plId === plId && rs.nhMa === nhMa) htIdSet.add(parseHtSysMa(rs.ma).sysName);
      for (const cs of customSystems) if (cs.plId === plId && cs.nhMa === nhMa) htIdSet.add(parseHtSysMa(cs.ma).sysName);

      for (const sysId of htIdSet) {
        const devs = m2.get(sysId) ?? [];
        if (groupByLoai) devs.sort(cmpDeviceByLoai);

        const ma = htSysMa(nhMa, sysId);
        let donViMa: string | null = htDonVi(sysId);
        
        // Dự phòng đơn vị từ tài sản bên trong nếu htDonVi không trả về
        if (!donViMa && devs.length > 0) {
          const dvCount = new Map<string, number>();
          for (const d of devs) {
            const dv = (d.tb.don_vi ?? "").trim();
            if (dv) dvCount.set(dv, (dvCount.get(dv) ?? 0) + 1);
          }
          let best = 0;
          for (const [dv, n] of dvCount) if (n > best) { best = n; donViMa = dv; }
        }

        const isCustom = customSystems.some(cs => cs.ma === ma);
        systems.push({ 
          ma, 
          ten: htLabel(ma), 
          devices: devs, 
          count: totalOf(devs), 
          donViMa,
          isCustom 
        });
      }

      // Sắp xếp HT theo đơn vị -> thứ tự thủ công -> tên
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

      const isCustomNh = customGroups.some(cg => cg.ma === nhMa);
      const nhTen = nhLabel(nhMa) || realSystems.find(rs => rs.nhMa === nhMa)?.nhTen || nhMa;
      
      groups.push({ 
        ma: nhMa, 
        ten: nhTen, 
        systems, 
        count: systems.reduce((n, s) => n + s.count, 0), 
        mau: colNh(nhMa),
        isCustom: isCustomNh 
      });
    }

    // Sắp xếp NH theo thứ tự thủ công -> tên
    groups.sort((a, b) => (ordNh(a.ma) ?? 1e9) - (ordNh(b.ma) ?? 1e9) || a.ten.localeCompare(b.ten, "vi"));

    const fields: LvGroup[] = [{ 
      id: "all", 
      ten: "Tất cả", 
      groups, 
      count: groups.reduce((n, g) => n + g.count, 0), 
      passthrough: true 
    }];
    
    const count = fields.reduce((n, lv) => n + lv.count, 0);
    tree.push({ 
      id: plId, 
      ten: plTenMap.get(plId) || plId, 
      tone: plToneMap.get(plId) || "", 
      fields, 
      count 
    });
    total += count;
  }
  return { tree, total };
}

export function parseCsv(text: string) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const rows = lines.map(l => l.split(",").map(c => c.trim()));
  return rows;
}

export function buildCsv(tree: PlGroup[]) {
  const lines = ["Kind,Ma,Ten,Parent"];
  for (const pl of tree) {
    lines.push(`pl,${pl.id},${pl.ten},root`);
    for (const lv of pl.fields) {
      for (const nh of lv.groups) {
        lines.push(`nh,${nh.ma},${nh.ten},${pl.id}`);
        for (const ht of nh.systems) {
          lines.push(`ht,${ht.ma},${ht.ten},${nh.ma}`);
          for (const d of ht.devices) {
            lines.push(`tb,${d.tb.ma_thiet_bi},${d.tb.ten || ""},${ht.ma}`);
          }
        }
      }
    }
  }
  return lines.join("\n");
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

