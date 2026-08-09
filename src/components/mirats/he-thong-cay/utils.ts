import { 
  PlGroup, LvGroup, NhGroup, HtGroup, DevNode, 
  StatusCat, ImpCat, BadgeFilter, InfoChip
} from "./types";

export const DUNG_KHAI_THAC_TEN = "Dừng khai thác";

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

export const okey = (kind: string, ma: string) => `${kind}:${ma}`;

export function isRealSystemId(s: string) {
  return s && s.length > 5 && s !== "HT_KHAC";
}
