import React, { useMemo } from "react";
import type { DbDevice } from "@/lib/mirats/db-taxonomy";
import type { ViTriChucNangTree } from "@/lib/mirats/he-thong-thanh-phan";
import { Boxes, Layers, FolderTree, Network, Cpu, Puzzle, Building2, Plug, MapPin } from "lucide-react";

export type EditKind = "pl" | "lv" | "nh" | "ht" | "tb" | "tp";

export type DevNode = { tb: DbDevice; children: DbDevice[] };
export type HtGroup = { ma: string; ten: string; devices: DevNode[]; count: number; donViMa: string | null; isCustom?: boolean };
export type NhGroup = { ma: string; ten: string; systems: HtGroup[]; count: number; passthrough?: boolean; mau?: string; isCustom?: boolean };
export type LvGroup = { id: string; ten: string; groups: NhGroup[]; count: number; passthrough?: boolean };
export type PlGroup = { id: string; ten: string; tone: string; fields: LvGroup[]; count: number };

export type StatusCat = "hoat_dong" | "du_phong" | "hong" | "ngung" | "khac";
export type ImpCat = "trong_yeu" | "quan_trong" | "thuong";

export type BadgeFilter = { status: Set<StatusCat>; imp: Set<ImpCat> };

export type SearchItem = {
  kind: "pl" | "lv" | "nh" | "ht" | "tb" | "tp" | "root" | "vtg" | "vt";
  ma: string;
  label: string;
  code?: string;
  plId: string;
  lvId?: string;
  nhMa?: string;
  htMa?: string;
  sysName?: string;
  count?: number;
};

export type FocusTarget = {
  kind: SearchItem["kind"];
  plId: string;
  lvId?: string;
  nhMa?: string;
  htMa?: string;
  ma: string;
  nonce: number;
};

export type InfoChip = { text: string; className: string; title?: string };

export type MoveReq = {
  heThongId: string;
  tenHeThong: string;
  toNhomId: string;
  toLvId?: string;
  toNhKey?: string;
  toNhTen?: string;
};

export type MoveGroupReq = {
  label: string;
  count: number;
  systemIds: string[];
  toNhomId: string;
  toLvId?: string;
  toLabel: string;
};

export type MoveDeviceReq = {
  deviceMa: string;
  label: string;
  toHtId?: string;
  toHtLabel?: string;
  toPlId?: string;
  toPlLabel?: string;
};

export type MoveTarget = { plId: string; plLabel: string; lvId: string; lvLabel: string; nhKey: string; nhLabel: string };

export type OverrideMap = Map<string, { ten: string | null; du_lieu: Record<string, unknown> }>;

export type MindKind = SearchItem["kind"];
export type MindNodeType = MindKind;
export type MindData = {
  label: string;
  kind: MindKind;
  ma: string;
  plId: string;
  lvId?: string;
  nhMa?: string;
  htMa?: string;
  count?: number;
  tone?: string;
  isCustom?: boolean;
  mau?: string;
  tb?: DbDevice;
  children?: DbDevice[];
  sysName?: string;
  canManage?: boolean;
  onRename?: (v: string) => void;
  collapsible?: boolean;
  expanded?: boolean;
  toggle?: () => void;
  dim?: boolean;
  active?: boolean;
  hit?: boolean;
  code?: string;
  assignState?: "stopped" | "assigned" | "empty";
  devLabel?: string;
  onOpenEditor?: () => void;
  onRecord?: () => void;
  maThietBi?: string;
  onHistory?: () => void;
  onIncident?: () => void;
  onMaint?: () => void;
  moveTargets?: MoveTarget[];
  onMove?: (toNhomId: string, toLvId: string | undefined, toNhKey: string | undefined, toNhTen: string | undefined) => void;
};

export const PHYS_TABLE_BY_LAYER: Record<string, { table: string; keyCol: string }> = {
  pl: { table: "dm_phan_loai", keyCol: "id" },
  lv: { table: "dm_linh_vuc", keyCol: "id" },
  nh: { table: "dm_nhom_he_thong", keyCol: "id" },
  ht: { table: "dm_he_thong", keyCol: "id" },
  tb: { table: "thiet_bi", keyCol: "ma_thiet_bi" },
};

export const LEVEL_META: Record<
  SearchItem["kind"],
  { label: string; badge: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  root: { label: "Gốc", badge: "border-primary/30 bg-primary/10 text-primary", Icon: Building2 },
  pl: { label: "Phân loại", badge: "border-rose-500/30 bg-rose-500/10 text-rose-600", Icon: Boxes },
  lv: { label: "Lĩnh vực", badge: "border-primary/30 bg-primary/10 text-primary", Icon: Layers },
  nh: { label: "Nhóm hệ thống", badge: "border-violet-500/30 bg-violet-500/10 text-violet-600", Icon: FolderTree },
  ht: { label: "Hệ thống", badge: "border-blue-500/30 bg-blue-500/10 text-blue-600", Icon: Network },
  tb: { label: "Tài sản", badge: "border-border bg-muted text-muted-foreground", Icon: Cpu },
  tp: { label: "Thành phần hệ thống", badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600", Icon: Puzzle },
  vtg: { label: "Vị trí", badge: "border-sky-500/30 bg-sky-500/10 text-sky-600", Icon: Plug },
  vt: { label: "Vị trí lắp đặt", badge: "border-sky-500/25 bg-sky-500/10 text-sky-500", Icon: MapPin },
};

export const STATUS_TONE: Record<StatusCat, string> = {
  hoat_dong: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  du_phong: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  hong: "border-red-500/30 bg-red-500/10 text-red-600",
  ngung: "border-slate-500/30 bg-slate-500/10 text-slate-500",
  khac: "border-border bg-muted text-muted-foreground",
};

export const IMP_TONE: Record<ImpCat, string> = {
  trong_yeu: "border-rose-500/30 bg-rose-500/10 text-rose-600",
  quan_trong: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  thuong: "border-border bg-muted text-muted-foreground",
};

export type { ViTriChucNangTree };
