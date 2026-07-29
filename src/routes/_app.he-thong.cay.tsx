import { useMemo, useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useUserPref } from "@/hooks/use-user-pref";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ChevronRight, ChevronDown, Network, Layers, Cpu, Search, Building2, ListTree, GitFork,
  Pencil, Check, X, Save, Loader2, Eye, MapPin, Plus, Minus, Table2, Boxes, Puzzle,
  Download, Upload, ExternalLink, FolderTree, ArrowRightLeft, ArrowUp, ArrowDown, Palette,
  History, Wrench, AlertTriangle, Package, Users, FileText, ClipboardList, BookMarked, Trash2, Info, Plug,
} from "lucide-react";

import {
  ReactFlow, ReactFlowProvider, Controls, MiniMap, Panel, useReactFlow,
  useNodesState, useEdgesState,
  Handle, Position,
  type Node, type Edge, type NodeTypes, type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useScope } from "@/lib/mirats/scope";
import { PHYS_TABLE_BY_LAYER, coercePhysValue, physKeyValue, isFieldEditable } from "@/lib/mirats/editable-columns";
import { renameEntity, type RenameKind } from "@/lib/mirats/rename-entity";
import { useCellEditor } from "@/lib/mirats/ui/use-cell-editor";
import type { CayKind, CayView } from "@/lib/mirats/ui/inline-edit";
import { xoaThietBiAnToan, xemTruocXoaThietBi } from "@/lib/mirats/cay-delete";
import { nhanDienLoiTrungThietBi } from "@/lib/mirats/ma-thiet-bi";
import { useSession } from "@/hooks/use-session";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRealtimeTaxonomy } from "@/hooks/use-realtime-taxonomy";
import { supabase } from "@/integrations/backend/client";
import { storage } from "@/lib/storage";
import type { ThietBi, SuKienThietBi } from "@/lib/mirats/types";
import { htSysMa, parseHtSysMa, HT_KHAC } from "@/lib/mirats/phan-loai";
import { TABLE_COLS, TABLE_COL_GROUPS, type ColKey, type TableCol } from "@/lib/mirats/thiet-bi-columns";
import { loadColumnPrefs, saveColumnPrefs } from "@/lib/mirats/column-prefs";
import {
  useDbTaxonomy, giayPhepLabelByTen,
  type DbDevice, type DbTaxonomy,
} from "@/lib/mirats/db-taxonomy";

import { useAllViTriChucNang, useXoaViTri, useXoaViTriForce, useDoiThuTuViTri, useMultiRoleMap, type ViTriChucNangTree, type MultiRoleInfo } from "@/lib/mirats/he-thong-thanh-phan";
import { colorForThietBi } from "@/lib/mirats/multi-role-color";
import { MultiRoleBadge } from "@/components/mirats/MultiRoleBadge";
import { useMyPermissions } from "@/hooks/use-permissions";
import { ThanhPhanChiTietDialog } from "@/components/mirats/ThanhPhanChiTietDialog";
import { ThanhPhanManager } from "@/components/mirats/ThanhPhanManager";
import { ThanhPhanTable } from "@/components/mirats/ThanhPhanTable";
// Taxonomy giờ đọc từ CSDL nên id phân loại / lĩnh vực là chuỗi tự do.
type PhanLoaiId = string;
type LinhVucId = string;
/** Mảng rỗng ổn định để giữ bảng trống khi chưa lọc. */
const EMPTY_ROWS: never[] = [];
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CenterHoverCard } from "@/components/mirats/CenterHoverCard";
import { LayerSectionHeader } from "@/lib/mirats/layer-vocab";
import { CodeBadge } from "@/components/mirats/CodeBadge";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCayRpc } from "@/lib/mirats/cay-reorg";
import { HeThongTruongEditor } from "@/components/mirats/HeThongTruongEditor";
import { CayThayDoiPanel } from "@/components/mirats/CayThayDoiPanel";
import { InfoHint } from "@/components/mirats/InfoHint";
import { Combobox, type ComboOption } from "@/components/mirats/Combobox";
import { ReferenceCell } from "@/components/mirats/ReferenceCell";
import { useReferenceIdOptions } from "@/lib/mirats/reference-sources";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
  DropdownMenuTrigger, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { SlidersHorizontal, Filter, Tags } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/_app/he-thong/cay")({
  validateSearch: (search: Record<string, unknown>): { editTb?: string } => ({
    editTb: typeof search.editTb === "string" ? search.editTb : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Hệ Thống — Tài sản MIRATS" },
      {
        name: "description",
        content:
          "Phân lớp hệ thống tài sản: Phân loại (Nhóm 1/2/3) → Nhóm hệ thống → Hệ thống → Tài sản → Thành phần.",
      },
    ],
  }),
  component: HeThongCayPage,
});

/* =============================== Kiểu & hằng =============================== */

type Display = "tree" | "table" | "mindmap";
// Cấp có thể chỉnh sửa. Thành phần tài sản dùng chung cấp "tb".
type EditKind = "pl" | "lv" | "nh" | "ht" | "tb";

// Yêu cầu di chuyển 1 hệ thống sang phân loại / lĩnh vực khác (kéo–thả).
type MoveReq = {
  heThongId: string;
  tenHeThong: string;
  toNhomId: string;
  toLvId?: string;
  toNhKey?: string;
  toNhTen?: string;
};

// Di chuyển cả một cụm (Lĩnh vực / Nhóm hệ thống) — toàn bộ hệ thống con đi theo.
type MoveGroupReq = {
  label: string;
  count: number;
  systemIds: string[];
  toNhomId: string;
  toLvId?: string;
  toLabel: string;
};

// Di chuyển một tài sản sang hệ thống khác, hoặc sang một Phân loại (Nhóm 1/2/3) khác.
type MoveDeviceReq = {
  deviceMa: string;
  label: string;
  toHtId?: string;
  toHtLabel?: string;
  toPlId?: string;
  toPlLabel?: string;
};

// Đích di chuyển: Phân loại → Lĩnh vực → Nhóm hệ thống để chọn nhanh trong menu.
type MoveTarget = { plId: string; plLabel: string; lvId: string; lvLabel: string; nhKey: string; nhLabel: string };

// Đích di chuyển tài sản: Nhóm hệ thống → Hệ thống (chọn hệ thống nhận tài sản).
type SysTarget = { htId: string; htLabel: string; nhKey: string; nhLabel: string };

type FocusTarget = {
  kind: "pl" | "lv" | "nh" | "ht" | "tb" | "tp";
  plId: PhanLoaiId;
  lvId?: LinhVucId;
  nhMa?: string;
  htMa?: string;
  ma: string;
  nonce: number;
};

type SearchItem = {
  kind: "pl" | "lv" | "nh" | "ht" | "tb" | "tp";
  ma: string;
  label: string;
  code?: string;
  plId: PhanLoaiId;
  lvId?: LinhVucId;
  nhMa?: string;
  htMa?: string;
  sysName?: string;
  count?: number;
};

const LEVEL_META: Record<
  SearchItem["kind"],
  { label: string; badge: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  pl: { label: "Phân loại", badge: "border-rose-500/30 bg-rose-500/10 text-rose-600", Icon: Boxes },
  lv: { label: "Lĩnh vực", badge: "border-primary/30 bg-primary/10 text-primary", Icon: Layers },
  nh: { label: "Nhóm hệ thống", badge: "border-violet-500/30 bg-violet-500/10 text-violet-600", Icon: FolderTree },
  ht: { label: "Hệ thống", badge: "border-blue-500/30 bg-blue-500/10 text-blue-600", Icon: Network },
  tb: { label: "Tài sản", badge: "border-border bg-muted text-muted-foreground", Icon: Cpu },
  tp: { label: "Thành phần hệ thống", badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600", Icon: Puzzle },
};

/* ---- Tag/badge thông tin cho tài sản (list & table view) ---- */
type InfoChip = { text: string; className: string; title?: string };

// Phân loại badge để tô màu, chú giải và lọc thống nhất.
type StatusCat = "hoat_dong" | "du_phong" | "hong" | "ngung" | "khac";
type ImpCat = "trong_yeu" | "quan_trong" | "thuong";

const STATUS_TONE: Record<StatusCat, string> = {
  hoat_dong: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  du_phong: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  hong: "border-red-500/30 bg-red-500/10 text-red-600",
  ngung: "border-slate-500/30 bg-slate-500/10 text-slate-500",
  khac: "border-border bg-muted text-muted-foreground",
};
const IMP_TONE: Record<ImpCat, string> = {
  trong_yeu: "border-rose-500/30 bg-rose-500/10 text-rose-600",
  quan_trong: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  thuong: "border-border bg-muted text-muted-foreground",
};

// Chú giải badge (legend) — dùng cho popover “Chú giải”.
const STATUS_LEGEND: { cat: StatusCat; label: string; desc: string }[] = [
  { cat: "hoat_dong", label: "Đang hoạt động", desc: "Tài sản đang khai thác/vận hành bình thường" },
  { cat: "du_phong", label: "Dự phòng", desc: "Sẵn sàng thay thế, chưa đưa vào khai thác" },
  { cat: "hong", label: "Hỏng / Lỗi", desc: "Đang có sự cố, hỏng hóc cần xử lý" },
  { cat: "ngung", label: "Ngừng / Điều chuyển", desc: "Chấm dứt sử dụng, đã điều chuyển hoặc ngừng hoạt động" },
  { cat: "khac", label: "Khác / Chưa rõ", desc: "Trạng thái khác hoặc chưa cập nhật" },
];
const IMP_LEGEND: { cat: ImpCat; label: string; desc: string }[] = [
  { cat: "trong_yeu", label: "Trọng yếu (Nhóm 1)", desc: "Đặc biệt quan trọng, ưu tiên bảo đảm cao nhất" },
  { cat: "quan_trong", label: "Quan trọng (Nhóm 2)", desc: "Quan trọng, cần theo dõi thường xuyên" },
  { cat: "thuong", label: "Thông thường", desc: "Mức độ thông thường hoặc chưa phân loại" },
];

// Phân loại trạng thái kỹ thuật của tài sản.
function statusCat(tt: string): StatusCat {
  const v = (tt ?? "").toLowerCase();
  if (!v || v.includes("chưa rõ")) return "khac";
  if (v.includes("hỏng") || v.includes("lỗi")) return "hong";
  if (v.includes("dự phòng")) return "du_phong";
  if (v.includes("chấm dứt") || v.includes("điều chuyển") || v.includes("ngừng")) return "ngung";
  if (v.includes("hoạt động") || v.includes("khai thác")) return "hoat_dong";
  return "khac";
}

// Phân loại mức độ quan trọng.
function impCat(v: string): ImpCat {
  const s = (v ?? "").toLowerCase();
  if (s.includes("đặc biệt") || s.includes("trọng yếu") || s.includes("nhóm 1")) return "trong_yeu";
  if (s.includes("quan trọng") || s.includes("nhóm 2")) return "quan_trong";
  return "thuong";
}

// Tô màu badge theo trạng thái tài sản.
function statusTone(tt: string): string {
  const c = statusCat(tt);
  return c === "khac" && (tt ?? "").trim() ? "border-blue-500/30 bg-blue-500/10 text-blue-600" : STATUS_TONE[c];
}

// Tô màu badge theo mức độ quan trọng.
function importanceTone(v: string): string {
  return IMP_TONE[impCat(v)];
}

// Xây danh sách chip thông tin cho một tài sản/thành phần (tooltip chi tiết, chuẩn hoá).
function deviceChips(d: ThietBi & { _loaiTbTen?: string }): InfoChip[] {
  const chips: InfoChip[] = [];
  // Badge gọn: chỉ hiển thị vị trí lắp đặt (đơn vị quản lý hiển thị bằng badge riêng).
  const vt = (d.vi_tri ?? "").trim();
  if (vt) chips.push({ text: vt, className: "border-border bg-muted/60 text-muted-foreground", title: `Vị trí lắp đặt: ${vt}` });
  return chips;
}

/* ---- Bộ lọc theo badge (trạng thái + mức độ) ---- */
type BadgeFilter = { status: Set<StatusCat>; imp: Set<ImpCat> };
const emptyBadgeFilter = (): BadgeFilter => ({ status: new Set(), imp: new Set() });
function badgeFilterActive(f: BadgeFilter): boolean {
  return f.status.size > 0 || f.imp.size > 0;
}
function deviceMatchesBadge(d: ThietBi, f: BadgeFilter): boolean {
  if (f.status.size > 0 && !f.status.has(statusCat(d.trang_thai ?? ""))) return false;
  if (f.imp.size > 0 && !f.imp.has(impCat(d.muc_do_quan_trong ?? ""))) return false;
  return true;
}


// Lọc cây theo badge — bỏ tài sản/nhóm/hệ thống rỗng sau khi lọc.
function filterTreeByBadge(tree: PlGroup[], f: BadgeFilter): PlGroup[] {
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
            const children = d.children.filter((c) => deviceMatchesBadge(c, f));
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





/* --------------------- Cấu trúc cây phân cấp (đã dựng) --------------------- */

type DevNode = { tb: DbDevice; children: DbDevice[] };
type HtGroup = { ma: string; ten: string; devices: DevNode[]; count: number; donViMa: string | null; isCustom?: boolean };
type NhGroup = { ma: string; ten: string; systems: HtGroup[]; count: number; passthrough?: boolean; mau?: string; isCustom?: boolean };
type LvGroup = { id: LinhVucId; ten: string; groups: NhGroup[]; count: number; passthrough?: boolean };
type PlGroup = { id: PhanLoaiId; ten: string; tone: string; fields: LvGroup[]; count: number };

/* --------- Bảng màu tuỳ chọn cho Nhóm hệ thống (người chỉnh sửa chọn) --------- */
// key lưu trong cay_node_edit.du_lieu.mau — dùng chung cho danh sách & sơ đồ tư duy.
const NH_COLORS: Array<{ id: string; label: string; list: string; mind: string; dot: string }> = [
  { id: "violet", label: "Tím", list: "bg-violet-500/5", mind: "border-violet-500/40 bg-violet-500/5", dot: "bg-violet-500" },
  { id: "blue", label: "Xanh dương", list: "bg-blue-500/5", mind: "border-blue-500/40 bg-blue-500/5", dot: "bg-blue-500" },
  { id: "emerald", label: "Xanh lá", list: "bg-emerald-500/5", mind: "border-emerald-500/40 bg-emerald-500/5", dot: "bg-emerald-500" },
  { id: "amber", label: "Vàng", list: "bg-amber-500/5", mind: "border-amber-500/40 bg-amber-500/5", dot: "bg-amber-500" },
  { id: "rose", label: "Đỏ", list: "bg-rose-500/5", mind: "border-rose-500/40 bg-rose-500/5", dot: "bg-rose-500" },
  { id: "sky", label: "Xanh biển", list: "bg-sky-500/5", mind: "border-sky-500/40 bg-sky-500/5", dot: "bg-sky-500" },
  { id: "cyan", label: "Lục lam", list: "bg-cyan-500/5", mind: "border-cyan-500/40 bg-cyan-500/5", dot: "bg-cyan-500" },
  { id: "slate", label: "Xám", list: "bg-slate-500/5", mind: "border-slate-500/40 bg-slate-500/5", dot: "bg-slate-500" },
];
const NH_COLOR_MAP = new Map(NH_COLORS.map((c) => [c.id, c]));
const nhListTone = (mau?: string) => (mau ? NH_COLOR_MAP.get(mau)?.list : undefined);
const nhMindTone = (mau?: string) => (mau ? NH_COLOR_MAP.get(mau)?.mind : undefined);
// Đổi vị trí 2 phần tử trong mảng (tạo mảng mới), phục vụ sắp xếp thủ công.
function swapAt<T>(arr: T[], i: number, j: number): T[] {
  if (i < 0 || j < 0 || i >= arr.length || j >= arr.length) return arr;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}


/* ------------------------- Overrides (lưu database) ------------------------ */

type OverrideRow = { kind: string; ma: string; ten: string | null; du_lieu: Record<string, unknown> | null };
type OverrideMap = Map<string, { ten: string | null; du_lieu: Record<string, unknown> }>;
const okey = (kind: string, ma: string) => `${kind}:${ma}`;

function useOverrides() {
  return useQuery({
    queryKey: ["cay_node_edit"],
    queryFn: async (): Promise<OverrideMap> => {
      const { data, error } = await supabase.from("cay_node_edit").select("kind,ma,ten,du_lieu");
      if (error) throw error;
      const map: OverrideMap = new Map();
      for (const r of (data ?? []) as OverrideRow[]) {
        map.set(okey(r.kind, r.ma), {
          ten: r.ten,
          du_lieu: (r.du_lieu as Record<string, unknown>) ?? {},
        });
      }
      return map;
    },
    staleTime: 30_000,
  });
}

/* ----------------------- Sao lưu / Phục hồi sơ đồ (nội bộ) -----------------------
 * ⚠️ Định dạng CSV này KHÁC với "Nhập / Xuất hàng loạt".
 * Nó ghi vào bảng cay_node_edit (tên hiển thị + trường bổ sung của node trên
 * sơ đồ), theo khóa (kind, ma). Đây là bản SAO LƯU NỘI BỘ của sơ đồ — KHÔNG
 * dùng để nhập liệu tài sản mới. Muốn nhập/tạo tài sản hàng loạt, dùng giao
 * diện "Nhập / Xuất hàng loạt" (theo import-config.ts). */

const HT_FIELDS: Array<[string, string]> = [
  ["ma_tai_san_bravo", "Mã tài sản Bravo"],
  ["muc_dich", "Mục đích sử dụng"],
  ["pham_vi", "Phạm vi hoạt động"],
  ["kieu_thiet_bi", "Kiểu tài sản"],
  ["nam_san_xuat", "Năm sản xuất"],
  ["nam_dua_vao", "Năm đưa vào sử dụng"],
  ["so_san_xuat", "Số sản xuất"],
  ["noi_san_xuat", "Nơi sản xuất"],
  ["tinh_nang_ky_thuat", "Tính năng kỹ thuật chính"],
  ["ma_dia_chi_ky_thuat", "Mã số, địa chỉ kỹ thuật"],
  ["dia_diem_dat", "Địa điểm đặt tài sản"],
  ["thoi_gian_hoat_dong", "Thời gian hoạt động"],
  ["trang_thai", "Trạng thái hệ thống"],
  ["giay_phep_khai_thac", "Tên giấy phép khai thác"],
  ["so_gp", "Số giấy phép"],
  ["ngay_het_han_gp", "Ngày hết hạn giấy phép"],
  ["ghi_chu_ht", "Ghi chú hệ thống"],
];
const TB_FIELDS: Array<[string, string]> = [
  ["ma_tai_san_bravo", "Mã tài sản Bravo"],
  ["loai", "Chủng loại"],
  ["serial", "Số serial"],
  ["ma_serial", "Mã serial (CSDL)"],
  ["model", "Model"],
  ["nha_san_xuat", "Nhà sản xuất"],
  ["nha_cung_cap", "Nhà cung cấp"],
  ["nhom_he_thong", "Nhóm hệ thống"],
  ["he_thong", "Hệ thống"],
  ["don_vi", "Đơn vị quản lý"],
  ["vi_tri", "Vị trí"],
  ["ngay_mua", "Ngày mua"],
  ["ngay_dua_vao_su_dung", "Ngày đưa vào sử dụng"],
  ["han_bao_hanh", "Hạn bảo hành"],
  ["gia_tri_mua", "Giá trị mua"],
  ["nguon_von", "Nguồn vốn"],
  ["tuoi_tho_thiet_ke_nam", "Tuổi thọ thiết kế (năm)"],
  ["muc_do_quan_trong", "Mức độ quan trọng"],
  ["trang_thai", "Trạng thái"],
  ["tinh_trang_ky_thuat", "Tình trạng kỹ thuật"],
  ["thiet_bi_cha", "Tài sản cha"],
  
  ["file_tai_lieu", "File tài liệu (CSDL)"],
  ["hinh_anh", "Hình ảnh (CSDL)"],
  ["ghi_chu", "Ghi chú"],
];
const BASE_COLS: Array<[string, string]> = [
  ["kind", "Cấp (pl/lv/nh/ht/tb)"],
  ["ma", "Mã (KHÔNG sửa)"],
  ["phan_loai", "Phân loại"],
  ["linh_vuc", "Lĩnh vực"],
  ["nhom_he_thong", "Nhóm hệ thống"],
  ["he_thong_cha", "Hệ thống"],
  ["ten", "Tên đầy đủ"],
  ["ten_mindmap", "Tên hiển thị trên sơ đồ"],
];
const EXPORT_COLS: Array<[string, string]> = [...BASE_COLS, ...HT_FIELDS, ...TB_FIELDS];
const HT_KEYS = HT_FIELDS.map(([k]) => k);
const TB_KEYS = TB_FIELDS.map(([k]) => k);
const ALLOWED_KINDS = ["pl", "lv", "nh", "ht", "tb"];

type ImportRow = {
  kind: string;
  ma: string;
  ten: string | null;
  du_lieu: Record<string, unknown>;
  don_vi_ma: string | null;
  created_by: string | null;
};

function csvCell(v: string): string {
  const s = v ?? "";
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function buildCsv(headers: string[], rows: string[][]): string {
  const lines = [headers.map(csvCell).join(",")];
  for (const r of rows) lines.push(r.map(csvCell).join(","));
  return "\ufeff" + lines.join("\r\n");
}
function parseCsv(text: string): string[][] {
  const t = text.replace(/^\ufeff/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') {
        if (t[i + 1] === '"') { cell += '"'; i++; } else q = false;
      } else cell += c;
    } else if (c === '"') {
      q = true;
    } else if (c === ",") {
      row.push(cell); cell = "";
    } else if (c === "\n") {
      row.push(cell); rows.push(row); row = []; cell = "";
    } else if (c === "\r") {
      /* bỏ qua */
    } else {
      cell += c;
    }
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/* ------------------------------ Dựng cây ------------------------------ */

const NONE_HT = "__none__";
// Chỉ hệ thống THẬT trong CSDL (id là UUID) mới là đích hợp lệ khi di chuyển
// tài sản. Hệ thống "khai thêm" chưa lưu (id dạng SYS_xxx) & nhóm rỗng NONE_HT
// KHÔNG phải UUID → nếu gửi lên RPC sẽ lỗi "invalid input syntax for type uuid".
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isRealSystemId = (id: string | null | undefined): id is string =>
  !!id && id !== NONE_HT && UUID_RE.test(id);
// Tên phân loại "Dừng khai thác" — nhánh này hiển thị song song (cùng tầng)
// với gốc "Toàn hệ thống" trên sơ đồ tư duy, không lồng bên trong.
const DUNG_KHAI_THAC_TEN = "Dừng khai thác";

// So sánh 2 tài sản: gom các tài sản CÙNG LOẠI (dm_loai_thiet_bi) nằm cạnh
// nhau trước — theo thứ tự danh mục (thu_tu) rồi tên loại; tài sản chưa gán
// loại xếp cuối. Trong cùng loại thì theo mã tài sản.
function cmpDeviceByLoai(a: DevNode, b: DevNode): number {
  const oa = a.tb._loaiTbOrder ?? 9999;
  const ob = b.tb._loaiTbOrder ?? 9999;
  const ta = (a.tb._loaiTbTen ?? "").trim();
  const tb = (b.tb._loaiTbTen ?? "").trim();
  // Tài sản chưa gán loại xếp cuối.
  if (!ta !== !tb) return ta ? -1 : 1;
  if (oa !== ob) return oa - ob;
  if (ta !== tb) return ta.localeCompare(tb, "vi");
  return a.tb.ma_thiet_bi.localeCompare(b.tb.ma_thiet_bi);
}


function buildTree(
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
  // Hệ thống THẬT trong CSDL chưa có tài sản con (vd vừa tạo ở giao diện Nhập
  // / Xuất hàng loạt). Cần hiển thị dù chưa có tài sản & chưa có bản ghi
  // override trong cay_node_edit — nếu không sẽ "tạo xong mà không thấy".
  realSystems: Array<{ ma: string; ten: string; nhMa: string; nhTen: string; plId: string }> = [],
): { tree: PlGroup[]; total: number } {
  // Gom: Phân loại → Nhóm hệ thống → Hệ thống → Tài sản.
  // (Đã bỏ lớp "Lĩnh vực": mỗi Phân loại bọc một lớp passthrough để các trình
  //  hiển thị bỏ qua, nhóm hệ thống hiển thị trực tiếp dưới phân loại.)
  // CSDL chưa có liên kết tài sản cha–con nên "Thành phần" để rỗng.
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
  // Tập phân loại cần dựng: có tài sản, HOẶC có hệ thống thật/khai thêm rỗng.
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
        // Đơn vị quản lý của hệ thống: ưu tiên đơn vị khai trực tiếp trên hệ
        // thống (dm_he_thong.don_vi_id); nếu chưa khai thì suy ra từ đơn vị
        // phổ biến nhất trong các tài sản con.
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
      // Thứ tự hệ thống: gom các hệ thống CÙNG ĐƠN VỊ nằm cạnh nhau trước,
      // sau đó trong mỗi đơn vị mới theo thứ tự thủ công (thu_tu) rồi tên.
      // (Đơn vị rỗng "" xếp cuối.)
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
    // Nhóm hệ thống rỗng do người dùng khai thêm (chưa có hệ thống con).
    for (const cg of customGroups) {
      if (cg.plId !== plId) continue;
      if (groups.some((g) => g.ma === cg.ma)) continue;
      groups.push({ ma: cg.ma, ten: nhLabel(cg.ma), systems: [], count: 0, mau: colNh(cg.ma), isCustom: true });
    }
    // Hệ thống rỗng do người dùng khai thêm (chưa có tài sản con) — gắn vào nhóm tương ứng.
    for (const cs of customSystems) {
      if (cs.plId !== plId) continue;
      const g = groups.find((x) => x.ma === cs.nhMa);
      if (!g) continue;
      if (g.systems.some((s) => s.ma === cs.ma)) continue;
      g.systems.push({ ma: cs.ma, ten: htLabel(cs.ma), devices: [], count: 0, donViMa: null, isCustom: true });
    }
    // Hệ thống THẬT trong CSDL chưa có tài sản con — tự tạo nhóm nếu chưa có
    // rồi gắn vào, để hệ thống vừa tạo (vd ở Nhập / Xuất hàng loạt) hiện ngay.
    for (const rs of realSystems) {
      if (rs.plId !== plId) continue;
      let g = groups.find((x) => x.ma === rs.nhMa);
      if (!g) {
        g = { ma: rs.nhMa, ten: rs.nhTen || nhLabel(rs.nhMa), systems: [], count: 0, mau: colNh(rs.nhMa) };
        groups.push(g);
      }
      if (g.systems.some((s) => s.ma === rs.ma)) continue;
      g.systems.push({ ma: rs.ma, ten: htLabel(rs.ma), devices: [], count: 0, donViMa: htDonVi(parseHtSysMa(rs.ma).sysName) });
    }
    // Thứ tự nhóm hệ thống: theo thứ tự thủ công (thu_tu) nếu có, còn lại theo tên.
    groups.sort((a, b) => (ordNh(a.ma) ?? 1e9) - (ordNh(b.ma) ?? 1e9) || a.ten.localeCompare(b.ten, "vi"));
    const count = groups.reduce((n, g) => n + g.count, 0);
    total += count;
    const lv: LvGroup = { id: `__lv__:${plId}` as LinhVucId, ten: "", groups, count, passthrough: true };
    tree.push({ id: plId, ten: plTenMap.get(plId) ?? plId, tone: plToneMap.get(plId) ?? "", fields: [lv], count });
  }
  // Luôn hiển thị mọi phân loại trong danh mục — kể cả nhánh rỗng như
  // "Dừng khai thác" — để có nơi gom hệ thống ngừng khai thác và thống kê,
  // đồng thời làm điểm đến hợp lệ khi di chuyển hệ thống/nhóm.
  const shown = new Set(tree.map((p) => p.id));
  for (const p of plList) {
    if (shown.has(p.id)) continue;
    const lv: LvGroup = { id: `__lv__:${p.id}` as LinhVucId, ten: "", groups: [], count: 0, passthrough: true };
    tree.push({ id: p.id, ten: p.ten, tone: p.tone, fields: [lv], count: 0 });
  }
  tree.sort((a, b) => (plOrder.get(a.id) ?? 999) - (plOrder.get(b.id) ?? 999));
  return { tree, total };
}


// Gom lại theo ĐƠN VỊ: Đơn vị → Hệ thống → Tài sản → Thành phần.
// Tái sử dụng cây phân loại rồi phân bổ mỗi hệ thống về đơn vị (mã đơn vị phổ
// biến nhất trong tài sản con). Hai cấp "lĩnh vực"/"nhóm hệ thống" được đánh
// dấu passthrough để các trình hiển thị bỏ qua, không tạo hàng thừa.
const UNIT_PT = "__pt__";
const NO_DV = "__nodv__";
function buildUnitTree(base: PlGroup[], donViLabel: (ma: string) => string): PlGroup[] {
  const unitMap = new Map<string, HtGroup[]>();
  for (const pl of base)
    for (const lv of pl.fields)
      for (const nh of lv.groups)
        for (const ht of nh.systems) {
          const u = (ht.donViMa ?? "").trim() || NO_DV;
          let arr = unitMap.get(u);
          if (!arr) { arr = []; unitMap.set(u, arr); }
          arr.push(ht);
        }
  const out: PlGroup[] = [];
  const unitIds = [...unitMap.keys()].sort((a, b) => {
    if (a === NO_DV) return 1;
    if (b === NO_DV) return -1;
    return donViLabel(a).localeCompare(donViLabel(b), "vi");
  });
  for (const u of unitIds) {
    const systems = unitMap.get(u)!.slice().sort((a, b) => a.ten.localeCompare(b.ten, "vi"));
    const count = systems.reduce((n, s) => n + s.count, 0);
    const nh: NhGroup = { ma: `${UNIT_PT}:${u}`, ten: "", systems, count, passthrough: true };
    const lv: LvGroup = { id: `${UNIT_PT}:${u}` as LinhVucId, ten: "", groups: [nh], count, passthrough: true };
    out.push({
      id: u as PhanLoaiId,
      ten: u === NO_DV ? "Chưa gán đơn vị" : donViLabel(u),
      tone: "bg-sky-500/5",
      fields: [lv],
      count,
    });
  }
  return out;
}

/* -------------------------------- Trang -------------------------------- */

function HeThongCayPage() {
  const { scopeAll, donViCode, suKien } = useScope();
  const { user, hasRole } = useSession();
  const isAdmin = hasRole("admin");
  // Quyền vào chế độ chỉnh sửa = admin hoặc phòng kỹ thuật (khớp can_manage_equipment ở CSDL).
  const canEdit = isAdmin || hasRole("phong_kt");
  const [editMode, setEditMode] = useState(false);
  // Mọi affordance sửa (bút chì, kéo–thả tổ chức lại, khai trường, lưu) chỉ bật trong chế độ chỉnh sửa.
  const canManage = canEdit && editMode;
  const { submit: submitReorg } = useCayRpc();
  const qc = useQueryClient();
  useRealtimeTaxonomy();
  const { data: overrides } = useOverrides();
  const { data: taxo, isLoading: taxoLoading, error: taxoError } = useDbTaxonomy();
  const { data: posByHt } = useAllViTriChucNang();

  const isMobile = useIsMobile();
  const [display, setDisplay] = useUserPref<Display>("he-thong:display", "tree");
  // Trên điện thoại chỉ dùng Danh sách: Sơ đồ tư duy (kéo–thả, khung rộng) và
  // Bảng (nhiều cột, phải cuộn ngang) đều không thực dụng → ép về Danh sách.
  useEffect(() => {
    if (isMobile && display !== "tree") setDisplay("tree");
  }, [isMobile, display]);
  const [editTarget, setEditTarget] = useState<{ kind: EditKind; ma: string } | null>(null);
  const [focus, setFocus] = useState<FocusTarget | null>(null);
  const [historyTarget, setHistoryTarget] = useState<HtGroup | null>(null);
  const [recordTarget, setRecordTarget] = useState<{ kind: "tb" | "tp"; ma: string; ten: string } | null>(null);
  const [moveReq, setMoveReq] = useState<MoveReq | null>(null);
  const [moveGroupReq, setMoveGroupReq] = useState<MoveGroupReq | null>(null);
  const [moveDeviceReq, setMoveDeviceReq] = useState<MoveDeviceReq | null>(null);
  const [reorgOpen, setReorgOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: EditKind; ma: string; ten: string; label: string; isCustom: boolean; hasChildren: boolean } | null>(null);
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>(emptyBadgeFilter);
  // Chế độ gom nhóm gốc: theo phân loại (mặc định) hoặc theo đơn vị.
  const [groupMode, setGroupMode] = useState<"phanloai" | "donvi">("phanloai");
  // Trong từng hệ thống: gom tài sản theo LOẠI tài sản (Máy tính/Switch/Router…)
  // thay vì hiển thị theo thành phần. Lưu theo từng tài khoản/trình duyệt.
  const [groupByLoai, setGroupByLoai] = useState<boolean>(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setGroupByLoai(window.localStorage.getItem("cay:groupByLoai") === "1");
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("cay:groupByLoai", groupByLoai ? "1" : "0");
  }, [groupByLoai]);


  // Tài sản THẬT từ CSDL, lọc theo phạm vi đơn vị nếu không phải toàn quyền.
  const devices = useMemo(() => {
    const all = taxo?.devices ?? [];
    return scopeAll ? all : all.filter((d) => !donViCode || d.don_vi === donViCode);
  }, [taxo, scopeAll, donViCode]);

  const tbMap = useMemo(() => new Map(devices.map((t) => [t.ma_thiet_bi, t as DbDevice])), [devices]);
  const nhNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of devices) m.set(d._nhKey || "KHAC", d._nhTen);
    return m;
  }, [devices]);

  const ovTen = useCallback(
    (kind: string, ma: string): string | undefined => overrides?.get(okey(kind, ma))?.ten ?? undefined,
    [overrides],
  );
  const ovDisp = useCallback(
    (kind: string, ma: string): string | undefined => {
      const d = overrides?.get(okey(kind, ma))?.du_lieu?.ten_mindmap;
      return typeof d === "string" && d.trim() ? d : undefined;
    },
    [overrides],
  );
  // Thứ tự thủ công & màu tuỳ chọn (lưu trong cay_node_edit.du_lieu).
  const ovOrder = useCallback(
    (kind: string, ma: string): number | undefined => {
      const v = overrides?.get(okey(kind, ma))?.du_lieu?.thu_tu;
      return typeof v === "number" ? v : undefined;
    },
    [overrides],
  );
  const ovColor = useCallback(
    (ma: string): string | undefined => {
      const v = overrides?.get(okey("nh", ma))?.du_lieu?.mau;
      return typeof v === "string" && v ? v : undefined;
    },
    [overrides],
  );
  const nhOrder = useCallback((ma: string) => ovOrder("nh", ma), [ovOrder]);
  const htOrder = useCallback((ma: string) => ovOrder("ht", ma), [ovOrder]);

  const plLabel = useCallback(
    (id: string) => ovTen("pl", id) ?? taxo?.plNameMap.get(id) ?? id,
    [ovTen, taxo],
  );
  const lvLabel = useCallback(
    (id: string) => ovTen("lv", id) ?? taxo?.lvNameMap.get(id) ?? id,
    [ovTen, taxo],
  );
  // Nhóm hệ thống = suy ra từ tên hệ thống (VHF, VCCS…). Giữ khoá "ht"/"nhom" cũ làm fallback.
  const nhLabel = useCallback(
    (ma: string) =>
      ovTen("nh", ma) ?? ovTen("ht", ma) ?? ovTen("nhom", ma) ??
      (ma === HT_KHAC ? "Chưa phân loại" : nhNameMap.get(ma) ?? ma),
    [ovTen, nhNameMap],
  );
  // Hệ thống cụ thể = trường he_thong (id CSDL); mã dạng "<nhóm>::<id hệ thống>".
  const htLabel = useCallback(
    (ma: string) => {
      const ov = ovTen("ht", ma);
      if (ov) return ov;
      const { sysName: code } = parseHtSysMa(ma);
      if (!code || code === "__none__") return "(Chưa gán hệ thống)";
      return taxo?.htNameMap.get(code) ?? code;
    },
    [ovTen, taxo],
  );
  const tbLabel = useCallback((t: ThietBi) => ovTen("tb", t.ma_thiet_bi) ?? t.ten, [ovTen]);
  const donViLabel = useCallback(
    (ma: string) => {
      const hit = (taxo?.donViList ?? []).find((d) => d.ma === ma);
      return hit ? `${hit.ma} · ${hit.ten}` : ma;
    },
    [taxo],
  );

  const plMind = useCallback((id: string) => ovDisp("pl", id) ?? plLabel(id), [ovDisp, plLabel]);
  const lvMind = useCallback((id: string) => ovDisp("lv", id) ?? lvLabel(id), [ovDisp, lvLabel]);
  const nhMind = useCallback((ma: string) => ovDisp("nh", ma) ?? nhLabel(ma), [ovDisp, nhLabel]);
  const htMind = useCallback((ma: string) => ovDisp("ht", ma) ?? htLabel(ma), [ovDisp, htLabel]);
  const tbMind = useCallback((t: ThietBi) => ovDisp("tb", t.ma_thiet_bi) ?? tbLabel(t), [ovDisp, tbLabel]);

  // Nhóm hệ thống rỗng do admin khai thêm (lưu trong cay_node_edit kind="nh").
  // Đã bỏ chế độ "nháp": nhóm & hệ thống đều được ghi thẳng vào CSDL
  // (dm_nhom_he_thong / dm_he_thong). Giữ 2 mảng rỗng để cây/mindmap phía
  // dưới vẫn tương thích signature — không còn nguồn dữ liệu nháp nào.
  const customGroups = useMemo<Array<{ ma: string; ten: string; plId: string }>>(() => [], []);
  const customSystems = useMemo<Array<{ ma: string; ten: string; nhMa: string; plId: string }>>(() => [], []);

  // Node do người dùng khai thêm (lưu trong cay_node_edit) — để phân biệt với node thật từ CSDL.
  const isCustomNode = useCallback(
    (kind: EditKind, ma: string) => {
      if (kind === "nh") return customGroups.some((g) => g.ma === ma);
      if (kind === "ht") return customSystems.some((s) => s.ma === ma);
      return false;
    },
    [customGroups, customSystems],
  );

  // Đơn vị quản lý khai trực tiếp trên từng hệ thống (dm_he_thong.don_vi_id) →
  // mã đơn vị, để ưu tiên hiển thị badge thay vì suy từ tài sản con.
  const htDonViMap = useMemo(() => {
    const dvMa = new Map((taxo?.donViList ?? []).map((d) => [d.id, d.ma]));
    const m = new Map<string, string>();
    for (const h of taxo?.htList ?? []) {
      if (h.donViId) { const ma = dvMa.get(h.donViId); if (ma) m.set(h.id, ma); }
    }
    return m;
  }, [taxo]);

  // Hệ thống THẬT trong CSDL nhưng chưa có tài sản con nào (vd vừa tạo ở giao
  // diện Nhập / Xuất hàng loạt). Suy ra Nhóm hệ thống từ khóa ngoại (dự phòng:
  // từ tên) & Phân loại, để hiển thị ngay dù chưa gán tài sản.
  const realSystems = useMemo(() => {
    const out: Array<{ ma: string; ten: string; nhMa: string; nhTen: string; plId: string }> = [];
    if (!taxo) return out;
    const seen = new Set<string>();
    for (const d of devices) if (d._htId) seen.add(d._htId);
    const nhomById = new Map(taxo.nhomList.map((n) => [n.id, n]));
    for (const h of taxo.htList) {
      if (seen.has(h.id)) continue; // đã có tài sản → dựng theo tài sản
      const nhom = h.nhomId ? nhomById.get(h.nhomId) : undefined;
      if (!nhom) continue; // Nguồn chân lý = FK nhom_he_thong_id. Không có FK → bỏ qua.
      const plId = h.phanLoaiId || nhom.phanLoaiId || "";
      if (!plId) continue; // chưa phân loại → không có nhánh để gắn
      out.push({ ma: htSysMa(nhom.ma, h.id), ten: h.ten, nhMa: nhom.ma, nhTen: nhom.ten, plId });
    }

    return out;
  }, [taxo, devices]);

  const { tree, total } = useMemo(
    () => buildTree(devices, taxo?.plList ?? [], htLabel, nhLabel, customGroups, nhOrder, htOrder, ovColor, customSystems, (htId) => htDonViMap.get(htId) ?? null, realSystems),
    [devices, taxo, htLabel, nhLabel, customGroups, nhOrder, htOrder, ovColor, customSystems, htDonViMap, realSystems],
  );

  // Cây đã áp bộ lọc badge — dùng cho cả 3 chế độ hiển thị. Khi gom theo đơn vị,
  // tái cấu trúc gốc thành Đơn vị → Hệ thống → Tài sản → Thành phần.
  const viewTree = useMemo(() => {
    const filtered = filterTreeByBadge(tree, badgeFilter);
    return groupMode === "donvi" ? buildUnitTree(filtered, donViLabel) : filtered;
  }, [tree, badgeFilter, groupMode, donViLabel]);
  const viewTotal = useMemo(() => badgeFilterActive(badgeFilter)
    ? viewTree.reduce((n, pl) => n + pl.count, 0) : total, [viewTree, badgeFilter, total]);

  // Ánh xạ mã hệ thống → tên phân loại (để suy nhãn giấy phép trong trình sửa).
  const htPlTen = useMemo(() => {
    const m = new Map<string, string>();
    for (const pl of tree) for (const lv of pl.fields) for (const nh of lv.groups) for (const ht of nh.systems) m.set(ht.ma, pl.ten);
    return m;
  }, [tree]);

  // Tra cứu Hệ thống theo mã để mở "Lý lịch hệ thống".
  const htByMa = useMemo(() => {
    const m = new Map<string, HtGroup>();
    for (const pl of tree) for (const lv of pl.fields) for (const nh of lv.groups) for (const ht of nh.systems) m.set(ht.ma, ht);
    return m;
  }, [tree]);
  const openHistory = useCallback((htMa: string) => {
    const g = htByMa.get(htMa);
    if (g) setHistoryTarget(g);
  }, [htByMa]);
  const nav = useNavigate();
  // Tạo sự cố / phiếu bảo dưỡng cho đúng hệ thống của node (htMa → id hệ thống).
  const openIncident = useCallback((htMa: string) => {
    const id = parseHtSysMa(htMa).sysName;
    nav({ to: "/su-co/moi", search: { heThong: id } });
  }, [nav]);
  const openMaint = useCallback((htMa: string) => {
    const id = parseHtSysMa(htMa).sysName;
    nav({ to: "/bao-tri/moi", search: { heThong: id } });
  }, [nav]);

  // Mã đơn vị theo từng cấp (để hiển thị badge trong trình sửa node).
  // ht: đơn vị phổ biến nhất của tài sản con; nh/pl: gộp từ các hệ thống bên trong;
  // tb/tp: đơn vị của chính tài sản.
  const unitCodeOf = useCallback(
    (kind: EditKind, ma: string): string | null => {
      if (kind === "tb") return (tbMap.get(ma)?.don_vi ?? "").trim() || null;
      if (kind === "ht") return htByMa.get(ma)?.donViMa ?? null;
      // nh / pl: chọn đơn vị xuất hiện nhiều nhất trong các hệ thống con.
      const cnt = new Map<string, number>();
      for (const pl of tree) {
        if (kind === "pl" && pl.id !== ma) continue;
        for (const lv of pl.fields) for (const nh of lv.groups) {
          if (kind === "nh" && nh.ma !== ma) continue;
          for (const ht of nh.systems) {
            const dv = (ht.donViMa ?? "").trim();
            if (dv) cnt.set(dv, (cnt.get(dv) ?? 0) + ht.count);
          }
        }
      }
      let best = 0, out: string | null = null;
      for (const [dv, n] of cnt) if (n > best) { best = n; out = dv; }
      return out;
    },
    [tree, htByMa, tbMap],
  );

  const scopeText = scopeAll ? "Toàn hệ thống" : `Đơn vị ${donViCode ?? "—"}`;

  // Chỉ mục tìm kiếm trên mọi cấp.
  const searchIndex = useMemo(() => {
    const items: SearchItem[] = [];
    for (const pl of tree) {
      items.push({ kind: "pl", ma: pl.id, label: plLabel(pl.id), plId: pl.id, count: pl.count });
      for (const lv of pl.fields) {
        for (const nh of lv.groups) {
          items.push({
            kind: "nh", ma: nh.ma, label: nh.ten, code: undefined,
            plId: pl.id, lvId: lv.id, nhMa: nh.ma, count: nh.count,
          });
          for (const ht of nh.systems) {
            items.push({
              kind: "ht", ma: ht.ma, label: ht.ten,
              plId: pl.id, lvId: lv.id, nhMa: nh.ma, htMa: ht.ma, count: ht.count,
            });
            const sysId = parseHtSysMa(ht.ma).sysName;
            if (isRealSystemId(sysId)) {
              for (const p of posByHt?.get(sysId) ?? []) {
                items.push({
                  kind: "tp", ma: p.id, label: p.ten, code: p.ma_thanh_phan,
                  plId: pl.id, lvId: lv.id, nhMa: nh.ma, htMa: ht.ma, sysName: ht.ten,
                });
              }
            }
            for (const d of ht.devices) {
              items.push({
                kind: "tb", ma: d.tb.ma_thiet_bi, label: tbLabel(d.tb), code: d.tb.ma_thiet_bi,
                plId: pl.id, lvId: lv.id, nhMa: nh.ma, htMa: ht.ma, sysName: ht.ten,
              });
              for (const c of d.children) {
                items.push({
                  kind: "tp", ma: c.ma_thiet_bi, label: tbLabel(c), code: c.ma_thiet_bi,
                  plId: pl.id, lvId: lv.id, nhMa: nh.ma, htMa: ht.ma, sysName: ht.ten,
                });
              }
            }
          }
        }
      }
    }
    return items;
  }, [tree, plLabel, tbLabel, posByHt]);

  const pickNode = useCallback((it: SearchItem) => {
    setFocus({ kind: it.kind, plId: it.plId, lvId: it.lvId, nhMa: it.nhMa, htMa: it.htMa, ma: it.ma, nonce: Date.now() });
  }, []);

  /* -------------------------- Lưu / đổi tên node -------------------------- */

  // Xác định bản ghi THẬT trong CSDL của một node để ghi TÊN thẳng vào bảng gốc
  // → giữ giao diện · hiển thị · CSDL luôn đồng nhất. Trả về null nếu node chỉ là
  // bản nháp/tuỳ chỉnh (chưa có bản ghi thật) — khi đó mới dùng tên đè tạm.
  const realNameTarget = useCallback(
    (kind: EditKind, ma: string): { table: string; keyCol: string; keyVal: string; nameCol: string } | null => {
      if (kind === "tb") return { table: "thiet_bi", keyCol: "ma_thiet_bi", keyVal: ma, nameCol: "ten_thiet_bi" };
      if (kind === "pl") return taxo?.plNameMap.has(ma) ? { table: "dm_phan_loai", keyCol: "id", keyVal: ma, nameCol: "ten" } : null;
      if (kind === "lv") return taxo?.lvNameMap.has(ma) ? { table: "dm_linh_vuc", keyCol: "id", keyVal: ma, nameCol: "ten" } : null;
      if (kind === "nh") {
        const nhom = (taxo?.nhomList ?? []).find((n) => n.ma === ma);
        return nhom ? { table: "dm_nhom_he_thong", keyCol: "id", keyVal: nhom.id, nameCol: "ten" } : null;
      }
      if (kind === "ht") {
        const sysId = parseHtSysMa(ma).sysName;
        return isRealSystemId(sysId) ? { table: "dm_he_thong", keyCol: "id", keyVal: sysId, nameCol: "ten" } : null;
      }
      return null;
    },
    [taxo],
  );

  const saveNode = useMutation({
    mutationFn: async (input: { kind: EditKind; ma: string; ten: string; du_lieu?: Record<string, unknown>; phys?: Record<string, string | number | null> }) => {
      const { kind, ma, ten } = input;
      const prev = overrides?.get(okey(kind, ma));
      const du_lieu = { ...(input.du_lieu ?? prev?.du_lieu ?? {}) };
      const don_vi_ma = kind === "tb" ? tbMap.get(ma)?.don_vi ?? null : null;
      const trimmedTen = ten.trim();
      const real = realNameTarget(kind, ma);

      // Node THẬT: tên thuộc về CSDL → ghi thẳng vào bảng gốc qua SSoT
      // renameEntity(), KHÔNG giữ tên đè (cột ten) lẫn tên hiển thị riêng
      // (ten_mindmap). Nhờ vậy đổi tên ở giao diện đồng bộ ngay với hiển
      // thị, Nhập/Xuất hàng loạt và Sơ đồ CSDL.
      if (real) {
        delete du_lieu.ten_mindmap;
        if (trimmedTen) {
          await renameEntity({
            kind: kind as RenameKind,
            id: real.keyVal,
            ten: trimmedTen,
          });
        }
      }

      const { error } = await supabase.from("cay_node_edit").upsert(
        { kind, ma, ten: real ? null : (trimmedTen || null), du_lieu: du_lieu as never, don_vi_ma, created_by: user?.id ?? null },
        { onConflict: "kind,ma" },
      );
      if (error) throw error;

      // Cột vật lý ghi thẳng vào bảng gốc theo từng layer (thiet_bi / dm_he_thong).
      if (input.phys && Object.keys(input.phys).length > 0) {
        const cfg = PHYS_TABLE_BY_LAYER[kind];
        if (cfg) {
          const { error: pErr } = await supabase
            .from(cfg.table as never)
            .update(input.phys as never)
            .eq(cfg.keyCol, physKeyValue(kind, ma));
          if (pErr) throw pErr;
        }
      }

      return { isReal: !!real, kind };
    },


    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["cay_node_edit"] });
      qc.invalidateQueries({ queryKey: ["ht_name_overrides"] });
      qc.invalidateQueries({ queryKey: ["tb_name_overrides"] });
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
      toast.success(res?.isReal ? "Đã lưu vào cơ sở dữ liệu" : "Đã lưu");
    },

    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không lưu được thay đổi"),
  });


  // Sửa 1 ô (cột vật lý) trực tiếp trên bảng — ghi thẳng vào thiet_bi.
  const saveCell = useMutation({
    mutationFn: async (input: { ma: string; col: string; value: string | number | null }) => {
      const { error } = await supabase
        .from("thiet_bi")
        .update({ [input.col]: input.value } as never)
        .eq("ma_thiet_bi", input.ma);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
      toast.success("Đã lưu");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không lưu được ô này"),
  });

  // Sửa HÀNG LOẠT một cột trên nhiều tài sản đã chọn (bulk edit kiểu Snipe-IT).
  // Nhận snapshot giá trị CŨ trước khi ghi → sau khi ghi hiển thị toast có nút
  // "Hoàn tác": phục hồi từng dòng về đúng giá trị cũ (audit đủ N dòng).
  const bulkSaveCell = useMutation({
    mutationFn: async (input: {
      mas: string[];
      col: string;
      value: string | number | null;
      snapshot?: { ma: string; oldValue: string | number | null }[];
    }) => {
      const { error } = await supabase
        .from("thiet_bi")
        .update({ [input.col]: input.value } as never)
        .in("ma_thiet_bi", input.mas);
      if (error) throw error;
      return input;
    },
    onSuccess: (input) => {
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
      const n = input.mas.length;
      const snap = input.snapshot ?? [];
      const canUndo = snap.length > 0;
      toast.success(`Đã cập nhật ${n} tài sản`, {
        duration: canUndo ? 10000 : 4000,
        action: canUndo
          ? {
              label: "Hoàn tác",
              onClick: async () => {
                const tid = toast.loading(`Đang hoàn tác ${snap.length} dòng…`);
                try {
                  // Nhóm theo giá trị cũ để ít lượt update nhất — audit vẫn đủ N dòng.
                  const groups = new Map<string, { oldValue: string | number | null; mas: string[] }>();
                  for (const s of snap) {
                    const k = JSON.stringify(s.oldValue ?? null);
                    const g = groups.get(k);
                    if (g) g.mas.push(s.ma);
                    else groups.set(k, { oldValue: s.oldValue, mas: [s.ma] });
                  }
                  for (const g of groups.values()) {
                    const { error } = await supabase
                      .from("thiet_bi")
                      .update({ [input.col]: g.oldValue } as never)
                      .in("ma_thiet_bi", g.mas);
                    if (error) throw error;
                  }
                  qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
                  toast.success(`Đã hoàn tác ${snap.length} dòng`, { id: tid });
                } catch (e) {
                  const msg = e instanceof Error ? e.message : "Lỗi không xác định";
                  toast.error(`Hoàn tác thất bại: ${msg}`, { id: tid });
                }
              },
            }
          : undefined,
      });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không lưu được hàng loạt"),
  });



  const editKindOf = (k: FocusTarget["kind"]): EditKind => (k === "tp" ? "tb" : k);

  // P6 — Hook dùng chung cho inline-edit ở 3 view (tree/table/mindmap).
  // Dispatch qua `resolveEditIntent` → renameEntity / saveCell / saveNode.
  // Cùng (kind, ma, field, value) sửa từ view nào cũng ghi vào cùng một đích.
  const cellEditor = useCellEditor({
    physCols: Object.values(PHYS_TABLE_BY_LAYER)
      .flatMap((cfg) => (cfg && cfg.table === "thiet_bi" ? [cfg.keyCol] : []))
      .concat(["ghi_chu", "vi_tri_hien_tai_id", "trang_thai_id", "so_seri"]),
    isRealFor: (kind, ma) => {
      const r = realNameTarget(kind as EditKind, ma);
      return r ? { keyVal: r.keyVal } : null;
    },
    mutations: {
      renameEntity: (args) => renameEntity({ kind: args.kind as RenameKind, id: args.id, ten: args.ten }),
      saveCell: (args) => saveCell.mutateAsync(args),
      saveNode: (args) => saveNode.mutateAsync({ ...args, ten: args.ten ?? "" }),
    },
  });

  // Đổi tên trực tiếp trên cây / sơ đồ / bảng — đi qua useCellEditor để 3 view
  // hội tụ về cùng một đích ghi (SSoT bảng gốc cho node thật, saveNode fallback
  // cho node nháp). Toast + invalidate đã có sẵn trong các mutation gốc.
  const renameDisplay = useCallback(
    (kind: EditKind, ma: string, disp: string, view: CayView = "tree") => {
      const name = disp.trim();
      if (!name) return;
      void cellEditor.commit({ view, kind: kind as CayKind, ma, field: "ten", value: name });
    },
    [cellEditor],
  );

  const openEditor = useCallback((kind: EditKind, ma: string) => setEditTarget({ kind, ma }), []);


  // Mở thẳng trình sửa tài sản khi đến từ liên kết ?editTb=<mã> (vd: từ "Model").
  const { editTb } = Route.useSearch();
  const handledEditTb = useRef<string | null>(null);
  useEffect(() => {
    if (!editTb || handledEditTb.current === editTb) return;
    if (!canEdit) return;
    if (!tbMap.has(editTb)) return; // đợi dữ liệu tải xong / nằm ngoài phạm vi
    handledEditTb.current = editTb;
    setEditMode(true);
    setEditTarget({ kind: "tb", ma: editTb });
    nav({ to: "/he-thong/cay", search: {}, replace: true });
  }, [editTb, canEdit, tbMap, nav]);

  // Khai thêm một Nhóm hệ thống — GHI THẲNG vào dm_nhom_he_thong (không còn
  // tạo bản nháp trong cay_node_edit). Đồng bộ ngay với Nhập/Xuất & Sơ đồ CSDL.
  const addGroup = useMutation({
    mutationFn: async (input: { plId: string; ten: string; ma?: string }) => {
      const ten = input.ten.trim();
      if (!ten) throw new Error("Tên nhóm hệ thống không được để trống");
      const ma = (input.ma?.trim() ? slugMa(input.ma) : slugMa(ten)) || `NH_${Date.now().toString(36).toUpperCase()}`;
      const { data: dupDm } = await supabase.from("dm_nhom_he_thong").select("id").eq("ma", ma).maybeSingle();
      if (dupDm) throw new Error(`Mã nhóm "${ma}" đã tồn tại — vui lòng đặt mã khác`);
      const { error } = await supabase
        .from("dm_nhom_he_thong")
        .insert({ ma, ten, phan_loai_id: input.plId || null } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
      toast.success("Đã thêm nhóm hệ thống vào cơ sở dữ liệu");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không thêm được nhóm hệ thống"),
  });

  // Đổi chuỗi MÃ của một Nhóm hệ thống (cả nhóm thật lẫn nhóm tuỳ chỉnh).
  const renameGroupCode = useMutation({
    mutationFn: async (input: { oldMa: string; newMa: string }) => {
      const newMa = slugMa(input.newMa);
      if (!newMa) throw new Error("Mã nhóm không hợp lệ");
      if (newMa === input.oldMa) return;
      // Cảnh báo & không cho đổi nếu mã mới đã tồn tại.
      const [{ data: dupEdit }, { data: dupDm }] = await Promise.all([
        supabase.from("cay_node_edit").select("ma").eq("kind", "nh").eq("ma", newMa).maybeSingle(),
        supabase.from("dm_nhom_he_thong").select("ma").eq("ma", newMa).maybeSingle(),
      ]);
      if (dupEdit || dupDm) throw new Error(`Mã nhóm "${newMa}" đã tồn tại — vui lòng đặt mã khác`);

      const isCustom = customGroups.some((g) => g.ma === input.oldMa);
      if (isCustom) {
        // Nhóm tuỳ chỉnh: chép sang mã mới, cập nhật nh_ma của các hệ thống con, rồi xoá mã cũ.
        const prevNh = overrides?.get(okey("nh", input.oldMa));
        const { error: iErr } = await supabase.from("cay_node_edit").insert(
          { kind: "nh", ma: newMa, ten: prevNh?.ten ?? null, du_lieu: (prevNh?.du_lieu ?? {}) as never, created_by: user?.id ?? null },
        );
        if (iErr) throw iErr;
        for (const s of customSystems.filter((s) => s.nhMa === input.oldMa)) {
          const prevHt = overrides?.get(okey("ht", s.ma));
          const du = { ...(prevHt?.du_lieu ?? {}), nh_ma: newMa };
          const { error: uErr } = await supabase.from("cay_node_edit").update({ du_lieu: du as never }).eq("kind", "ht").eq("ma", s.ma);
          if (uErr) throw uErr;
        }
        const { error: dErr } = await supabase.from("cay_node_edit").delete().eq("kind", "nh").eq("ma", input.oldMa);
        if (dErr) throw dErr;
      } else {
        // Nhóm thật: đổi cột ma trong dm_nhom_he_thong (tài sản/hệ thống liên kết theo id nên an toàn).
        const nhom = (taxo?.nhomList ?? []).find((n) => n.ma === input.oldMa);
        if (!nhom) throw new Error("Không tìm thấy nhóm hệ thống để đổi mã");
        const { error: uErr } = await supabase.from("dm_nhom_he_thong").update({ ma: newMa }).eq("id", nhom.id);
        if (uErr) throw uErr;
      }
      return { newMa };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cay_node_edit"] });
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
      toast.success("Đã đổi mã nhóm hệ thống");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không đổi được mã nhóm"),
  });


  // Khai thêm một Hệ thống — GHI THẲNG vào bảng thật dm_he_thong (không còn tạo
  // bản nháp SYS_ trong cay_node_edit). Nhờ vậy hệ thống mới đồng bộ ngay với
  // Nhập/Xuất hàng loạt và Sơ đồ CSDL. Nếu nhóm cha đang là nhóm nháp thì
  // "nâng" nó thành bản ghi thật (dm_nhom_he_thong) trước để có khoá ngoại.
  const addSystem = useMutation({
    mutationFn: async (input: { nhMa: string; plId: string; ten: string; donViId: string }) => {
      const ten = input.ten.trim();
      if (!ten) throw new Error("Tên hệ thống không được để trống");
      if (!input.donViId) throw new Error("Vui lòng chọn Đơn vị quản lý cho hệ thống");

      // 1) Bảo đảm nhóm cha là bản ghi thật để lấy khoá ngoại nhom_he_thong_id.
      let nhomId = (taxo?.nhomList ?? []).find((n) => n.ma === input.nhMa)?.id ?? null;
      if (!nhomId) {
        const { data: existing } = await supabase
          .from("dm_nhom_he_thong").select("id").eq("ma", input.nhMa).maybeSingle();
        if (existing?.id) {
          nhomId = existing.id as string;
        } else {
          const draft = customGroups.find((g) => g.ma === input.nhMa);
          const { data: created, error: gErr } = await supabase
            .from("dm_nhom_he_thong")
            .insert({ ma: input.nhMa, ten: draft?.ten ?? input.nhMa, phan_loai_id: input.plId || null } as never)
            .select("id").single();
          if (gErr) throw gErr;
          nhomId = (created as { id: string }).id;
          // Nhóm đã thành bản ghi thật → bỏ bản nháp trong cay_node_edit.
          await supabase.from("cay_node_edit").delete().eq("kind", "nh").eq("ma", input.nhMa);
        }
      }

      // 2) Sinh mã hệ thống ổn định & duy nhất.
      let ma = slugMa(input.ten) || `HT_${Date.now().toString(36).toUpperCase()}`;
      const { data: dupMa } = await supabase.from("dm_he_thong").select("id").eq("ma", ma).maybeSingle();
      if (dupMa) ma = `${ma}_${Date.now().toString(36).toUpperCase()}`;

      // 2b) Fallback plId: nếu tree slot không cấp, kế thừa từ Nhóm cha để
      //     realSystems có đủ tiêu chí hiện lên nhánh Phân loại → Nhóm.
      let plIdEff = input.plId || "";
      if (!plIdEff) {
        const nhomLocal = (taxo?.nhomList ?? []).find((n) => n.id === nhomId);
        plIdEff = nhomLocal?.phanLoaiId ?? "";
        if (!plIdEff && nhomId) {
          const { data: nhomRow } = await supabase
            .from("dm_nhom_he_thong").select("phan_loai_id").eq("id", nhomId).maybeSingle();
          plIdEff = (nhomRow as { phan_loai_id: string | null } | null)?.phan_loai_id ?? "";
        }
      }
      if (!plIdEff) throw new Error("Nhóm hệ thống chưa gán Phân loại — hãy gán Phân loại cho nhóm trước khi khai hệ thống");

      // 3) Chèn hệ thống thật (trigger CSDL tự đồng bộ phan_loai_id theo nhóm,
      //    và yêu cầu don_vi_id NOT NULL — Đơn vị quản lý là nguồn chân lý).
      const { data: inserted, error } = await supabase.from("dm_he_thong").insert(
        { ma, ten, nhom_he_thong_id: nhomId, phan_loai_id: plIdEff, don_vi_id: input.donViId } as never,
      ).select("id, ma, ten").single();
      if (error) throw error;
      if (!inserted) throw new Error("Không tạo được hệ thống — có thể do quyền truy cập bị hạn chế");


    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cay_node_edit"] });
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
      toast.success("Đã thêm hệ thống vào cơ sở dữ liệu");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không thêm được hệ thống"),
  });


  // Khai thêm một Tài sản rỗng vào một Hệ thống THẬT (ghi thẳng vào bảng thiet_bi).
  // he_thong_id là khoá ngoại tới dm_he_thong; trigger CSDL tự đồng bộ
  // phan_loai_id / nhom_he_thong_id theo hệ thống cha.
  const addDevice = useMutation({
    mutationFn: async (input: { heThongId: string; ten: string; ma?: string }) => {
      const ten = input.ten.trim();
      if (!ten) throw new Error("Tên tài sản không được để trống");
      if (!input.heThongId) throw new Error("Chỉ khai thêm được tài sản vào hệ thống đã có trong CSDL");
      // Mã tài sản VẬT LÝ: nếu người dùng nhập → tôn trọng (chuẩn hoá + kiểm trùng);
      // nếu bỏ trống → DB tự sinh qua trigger `trg_gen_ma_thiet_bi` (an toàn khi ghi đồng thời).
      const maNguoiDung = input.ma?.trim() ? slugMa(input.ma.trim()) : "";
      const payload: Record<string, unknown> = {
        ten_thiet_bi: ten,
        he_thong_id: input.heThongId,
      };
      if (maNguoiDung) payload.ma_thiet_bi = maNguoiDung;
      const { error } = await supabase.from("thiet_bi").insert(payload as never);
      if (error) {
        const trung = nhanDienLoiTrungThietBi(error);
        if (trung) throw new Error(trung.message);
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
      toast.success("Đã thêm tài sản vào hệ thống");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không thêm được tài sản"),
  });


  // Xoá node trực tiếp trên CSDL. Xoá "bất chấp": xoá mục lớn thì toàn bộ mục con
  // bên trong (hệ thống + tài sản + thành phần) cũng bị xoá theo.
  // Trước khi xoá, chụp lại toàn bộ bản ghi để có thể HOÀN TÁC (re-insert).
  const stripGen = (r: Record<string, unknown>) => {
    const o = { ...r };
    delete o.search_text;
    delete o.search_tsv;
    return o;
  };

  // Hoàn tác: chèn lại các bản ghi đã xoá (nhóm → hệ thống → tài sản → override).
  const undoDelete = useMutation({
    mutationFn: async (snap: {
      deviceRows: Record<string, unknown>[];
      systemRows: Record<string, unknown>[];
      groupRow: Record<string, unknown> | null;
      overrideRow: Record<string, unknown> | null;
    }) => {
      if (snap.groupRow) {
        const { error } = await supabase.from("dm_nhom_he_thong").insert(snap.groupRow as never);
        if (error) throw error;
      }
      if (snap.systemRows.length > 0) {
        const { error } = await supabase.from("dm_he_thong").insert(snap.systemRows as never);
        if (error) throw error;
      }
      if (snap.deviceRows.length > 0) {
        const { error } = await supabase.from("thiet_bi").insert(snap.deviceRows.map(stripGen) as never);
        if (error) throw error;
      }
      if (snap.overrideRow) {
        const { error } = await supabase.from("cay_node_edit").insert(snap.overrideRow as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cay_node_edit"] });
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
      toast.success("Đã hoàn tác — khôi phục dữ liệu đã xoá");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không hoàn tác được"),
  });

  const deleteNode = useMutation({
    mutationFn: async (input: { kind: EditKind; ma: string; isCustom: boolean; hasChildren: boolean }) => {
      const deviceMas = new Set<string>();
      const systemIds = new Set<string>();
      const addSystem = (s: HtGroup) => {
        const sid = parseHtSysMa(s.ma).sysName;
        if (sid && sid !== NONE_HT) systemIds.add(sid);
        for (const d of s.devices) {
          deviceMas.add(d.tb.ma_thiet_bi);
          for (const c of d.children) deviceMas.add(c.ma_thiet_bi);
        }
      };
      if (input.kind === "ht") {
        for (const pl of tree) for (const lv of pl.fields) for (const g of lv.groups) for (const s of g.systems)
          if (s.ma === input.ma) addSystem(s);
      } else if (input.kind === "nh") {
        for (const pl of tree) for (const lv of pl.fields) for (const g of lv.groups)
          if (g.ma === input.ma) for (const s of g.systems) addSystem(s);
      } else {
        throw new Error("Không hỗ trợ xoá mục này");
      }

      const deviceMaArr = [...deviceMas];

      // 0) Chụp trước hồ sơ để hoàn tác. CHỈ tài sản SẠCH (chưa có lịch sử) mới
      //    bị xoá vĩnh viễn nên chỉ cần snapshot nhóm này; tài sản có lịch sử
      //    sẽ được chuyển "Ngừng khai thác" (KHÔNG xoá) nên không cần hoàn tác.
      const { sach } = deviceMaArr.length > 0
        ? await xemTruocXoaThietBi(deviceMaArr)
        : { sach: [] as string[] };
      let deviceRows: Record<string, unknown>[] = [];
      if (sach.length > 0) {
        const { data } = await supabase.from("thiet_bi").select("*").in("ma_thiet_bi", sach);
        deviceRows = (data ?? []) as Record<string, unknown>[];
      }
      let systemRows: Record<string, unknown>[] = [];
      let groupRow: Record<string, unknown> | null = null;
      let overrideRow: Record<string, unknown> | null = null;
      if (systemIds.size > 0) {
        const { data } = await supabase.from("dm_he_thong").select("*").in("id", [...systemIds]);
        systemRows = (data ?? []) as Record<string, unknown>[];
      }
      if (input.kind === "nh") {
        const { data } = await supabase.from("dm_nhom_he_thong").select("*").eq("ma", input.ma).maybeSingle();
        groupRow = (data ?? null) as Record<string, unknown> | null;
      }
      if (input.isCustom) {
        const { data } = await supabase.from("cay_node_edit").select("*").eq("kind", input.kind).eq("ma", input.ma).maybeSingle();
        overrideRow = (data ?? null) as Record<string, unknown> | null;
      }

      // 1) Xoá THIẾT BỊ AN TOÀN (không bao giờ xoá trực tiếp):
      //    - sạch (chưa có lịch sử) → xoá vĩnh viễn qua purge_thiet_bi
      //    - đã có lịch sử → chuyển "Ngừng khai thác", giữ nguyên lý lịch.
      const { purged, retired } = await xoaThietBiAnToan(deviceMaArr);
      const purgedSet = new Set(purged);
      deviceRows = deviceRows.filter((r) => purgedSet.has(String(r.ma_thiet_bi)));

      // Nếu còn tài sản được GIỮ LẠI (đã chuyển Ngừng khai thác), KHÔNG xoá hệ
      // thống/nhóm để tránh làm mồ côi tài sản đó — nhánh được giữ nguyên.
      const nodeKept = retired.length > 0;

      if (!nodeKept) {
        // 2) Xoá các hệ thống con (và chính hệ thống nếu là node ht).
        if (systemIds.size > 0) {
          const { error } = await supabase.from("dm_he_thong").delete().in("id", [...systemIds]);
          if (error) throw error;
        }
        // 3) Xoá bản ghi nhóm hệ thống thật (nếu có).
        if (input.kind === "nh") {
          const { error } = await supabase.from("dm_nhom_he_thong").delete().eq("ma", input.ma);
          if (error) throw error;
        }
        // 4) Dọn override do người dùng khai thêm.
        if (input.isCustom) {
          const { error } = await supabase.from("cay_node_edit").delete().eq("kind", input.kind).eq("ma", input.ma);
          if (error) throw error;
        }
      }

      return {
        counts: {
          purged: purged.length,
          retired: retired.length,
          systems: nodeKept ? 0 : systemRows.length,
          groups: nodeKept ? 0 : (groupRow ? 1 : 0),
        },
        nodeKept,
        snap: {
          deviceRows,
          systemRows: nodeKept ? [] : systemRows,
          groupRow: nodeKept ? null : groupRow,
          overrideRow: nodeKept ? null : overrideRow,
        },
      };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["cay_node_edit"] });
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
      setEditTarget(null);
      const { counts, nodeKept, snap } = res;
      const parts: string[] = [];
      if (counts.groups) parts.push(`${counts.groups} nhóm hệ thống`);
      if (counts.systems) parts.push(`${counts.systems.toLocaleString("vi-VN")} hệ thống`);
      if (counts.purged) parts.push(`${counts.purged.toLocaleString("vi-VN")} tài sản (xoá vĩnh viễn)`);
      const canUndo =
        snap.deviceRows.length > 0 || snap.systemRows.length > 0 || !!snap.groupRow || !!snap.overrideRow;
      const msg = parts.length
        ? `Đã xoá ${parts.join(", ")}`
        : counts.retired
          ? "Đã xử lý xong"
          : "Đã xoá mục";
      const desc = counts.retired
        ? `${counts.retired.toLocaleString("vi-VN")} tài sản đã có lịch sử được chuyển "Ngừng khai thác" (giữ nguyên hồ sơ)${nodeKept ? "; nhánh được giữ lại vì vẫn còn tài sản." : "."}`
        : undefined;
      toast.success(msg, {
        description: desc,
        duration: 12000,
        action: canUndo ? { label: "Hoàn tác", onClick: () => undoDelete.mutate(snap) } : undefined,
      });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không xoá được"),
  });

  // Xem trước hậu quả xoá: bao nhiêu tài sản sẽ bị xoá vĩnh viễn (sạch) và bao
  // nhiêu đã có lịch sử (sẽ được chuyển "Ngừng khai thác", giữ hồ sơ).
  const deletePreview = useQuery({
    queryKey: ["cay_delete_preview", deleteTarget?.kind, deleteTarget?.ma],
    enabled: !!deleteTarget && (deleteTarget.kind === "ht" || deleteTarget.kind === "nh"),
    staleTime: 10_000,
    queryFn: async () => {
      const t = deleteTarget!;
      const deviceMas = new Set<string>();
      const addSystem = (s: HtGroup) => {
        for (const d of s.devices) {
          deviceMas.add(d.tb.ma_thiet_bi);
          for (const c of d.children) deviceMas.add(c.ma_thiet_bi);
        }
      };
      if (t.kind === "ht") {
        for (const pl of tree) for (const lv of pl.fields) for (const g of lv.groups) for (const s of g.systems)
          if (s.ma === t.ma) addSystem(s);
      } else if (t.kind === "nh") {
        for (const pl of tree) for (const lv of pl.fields) for (const g of lv.groups)
          if (g.ma === t.ma) for (const s of g.systems) addSystem(s);
      }
      return xemTruocXoaThietBi([...deviceMas]);
    },
  });





  // Lưu thứ tự thủ công cho một danh sách anh–em (nhóm hệ thống hoặc hệ thống).
  // Ghi thu_tu = chỉ số mới cho tất cả phần tử để thứ tự luôn nhất quán,
  // giữ nguyên du_lieu cũ (tên hiển thị, màu, khai trường…).
  const reorderSiblings = useMutation({
    mutationFn: async (items: Array<{ kind: string; ma: string }>) => {
      const rows = items.map((it, i) => {
        const prev = overrides?.get(okey(it.kind, it.ma));
        return {
          kind: it.kind,
          ma: it.ma,
          ten: prev?.ten ?? null,
          du_lieu: { ...(prev?.du_lieu ?? {}), thu_tu: i } as never,
          created_by: user?.id ?? null,
        };
      });
      const { error } = await supabase.from("cay_node_edit").upsert(rows as never, { onConflict: "kind,ma" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cay_node_edit"] }),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không lưu được thứ tự"),
  });
  const onReorder = useCallback((items: Array<{ kind: string; ma: string }>) => reorderSiblings.mutate(items), [reorderSiblings]);

  // Đổi màu tuỳ chọn cho một Nhóm hệ thống (ảnh hưởng cả danh sách & sơ đồ tư duy).
  const setNhColor = useMutation({
    mutationFn: async (input: { ma: string; mau: string | null }) => {
      const prev = overrides?.get(okey("nh", input.ma));
      const du_lieu: Record<string, unknown> = { ...(prev?.du_lieu ?? {}) };
      if (input.mau) du_lieu.mau = input.mau; else delete du_lieu.mau;
      const { error } = await supabase.from("cay_node_edit").upsert(
        { kind: "nh", ma: input.ma, ten: prev?.ten ?? null, du_lieu: du_lieu as never, created_by: user?.id ?? null },
        { onConflict: "kind,ma" },
      );
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cay_node_edit"] }); toast.success("Đã đổi màu nhóm hệ thống"); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không đổi được màu"),
  });
  const onSetColor = useCallback((ma: string, mau: string | null) => setNhColor.mutate({ ma, mau }), [setNhColor]);
  const groupsOfPl = useCallback(
    (plId: string) => {
      const pl = tree.find((p) => p.id === plId);
      if (!pl) return [] as Array<{ ma: string; ten: string; count: number }>;
      return pl.fields.flatMap((lv) => lv.groups).map((g) => ({ ma: g.ma, ten: g.ten, count: g.count }));
    },
    [tree],
  );

  // Danh sách lớp con trực tiếp của một node (để hiển thị trong trình chỉnh sửa).
  const childrenOf = useCallback(
    (kind: EditKind, ma: string): { childLabel: string; unit: string; items: Array<{ ma: string; ten: string; count: number }> } => {
      if (kind === "pl") {
        const pl = tree.find((p) => p.id === ma);
        const items = pl ? pl.fields.flatMap((lv) => lv.groups).map((g) => ({ ma: g.ma, ten: g.ten, count: g.count })) : [];
        return { childLabel: "Nhóm hệ thống", unit: "tài sản", items };
      }
      if (kind === "nh") {
        const items: Array<{ ma: string; ten: string; count: number }> = [];
        for (const pl of tree) for (const lv of pl.fields) for (const g of lv.groups)
          if (g.ma === ma) for (const s of g.systems) items.push({ ma: s.ma, ten: s.ten, count: s.count });
        return { childLabel: "Hệ thống", unit: "tài sản", items };
      }
      if (kind === "ht") {
        for (const pl of tree) for (const lv of pl.fields) for (const g of lv.groups) for (const s of g.systems)
          if (s.ma === ma)
            return {
              childLabel: "Tài sản",
              unit: "thành phần",
              items: s.devices.map((d) => ({ ma: d.tb.ma_thiet_bi, ten: ovTen("tb", d.tb.ma_thiet_bi) ?? d.tb.ten, count: d.children.length })),
            };
        return { childLabel: "Tài sản", unit: "thành phần", items: [] };
      }
      return { childLabel: "", unit: "", items: [] };
    },
    [tree, ovTen],
  );

  // Phân loại (plId) chứa một nhóm hệ thống — cần khi khai thêm hệ thống vào nhóm đó.
  const nhPlId = useCallback(
    (ma: string) => {
      for (const pl of tree) for (const lv of pl.fields) for (const g of lv.groups)
        if (g.ma === ma) return pl.id;
      return customGroups.find((g) => g.ma === ma)?.plId ?? "";
    },
    [tree, customGroups],
  );


  /* ------------------------------- CSV ------------------------------- */

  const fileRef = useRef<HTMLInputElement>(null);





  const importCsv = useMutation({
    mutationFn: async (file: File) => {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error("File rỗng hoặc sai định dạng");
      const header = rows[0].map((h) => h.trim());
      const lookup = new Map<string, string>();
      for (const [k, label] of EXPORT_COLS) { lookup.set(label, k); lookup.set(k, k); }
      const keyByIdx = header.map((h) => lookup.get(h) ?? h);
      const idx = (k: string) => keyByIdx.indexOf(k);
      const iKind = idx("kind"), iMa = idx("ma"), iTen = idx("ten"), iDisp = idx("ten_mindmap");
      if (iKind < 0 || iMa < 0) throw new Error("Thiếu cột 'Cấp' hoặc 'Mã' — hãy dùng file xuất từ hệ thống");
      const upserts: ImportRow[] = [];
      for (let r = 1; r < rows.length; r++) {
        const cells = rows[r];
        const kind = (cells[iKind] ?? "").trim();
        const ma = (cells[iMa] ?? "").trim();
        if (!ma || !ALLOWED_KINDS.includes(kind)) continue;
        const prev = overrides?.get(okey(kind, ma));
        const du_lieu: Record<string, unknown> = { ...(prev?.du_lieu ?? {}) };
        const disp = iDisp >= 0 ? (cells[iDisp] ?? "").trim() : "";
        du_lieu.ten_mindmap = disp || undefined;
        const keys = kind === "ht" ? HT_KEYS : kind === "tb" ? TB_KEYS : [];
        for (const k of keys) {
          const ci = idx(k);
          if (ci >= 0) du_lieu[k] = (cells[ci] ?? "").trim() || undefined;
        }
        const don_vi_ma = kind === "tb" ? tbMap.get(ma)?.don_vi ?? null : null;
        const ten = iTen >= 0 ? (cells[iTen] ?? "").trim() : "";
        upserts.push({ kind, ma, ten: ten || prev?.ten || null, du_lieu, don_vi_ma, created_by: user?.id ?? null });
      }
      if (!upserts.length) throw new Error("Không có dòng hợp lệ để nhập");
      const { error } = await supabase.from("cay_node_edit").upsert(upserts as never, { onConflict: "kind,ma" });
      if (error) throw error;
      return upserts.length;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["cay_node_edit"] });
      qc.invalidateQueries({ queryKey: ["ht_name_overrides"] });
      qc.invalidateQueries({ queryKey: ["tb_name_overrides"] });
      toast.success(`Đã nhập ${n} dòng từ file`);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không nhập được file"),
  });

  // Nguồn chân lý số Nhóm/Hệ thống = danh mục CSDL (dm_nhom_he_thong,
  // dm_he_thong), không đếm qua cây — tránh lệch do bucket rỗng/orphan.
  const sysCount = taxo?.htList.length ?? 0;
  const nhomCount = taxo?.nhomList.length ?? 0;

  const { data: tpCount = 0 } = useQuery({
    queryKey: ["he_thong_thanh_phan:count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("he_thong_thanh_phan")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  if (taxoLoading) {
    return (
      <div className="flex items-center justify-center gap-2 p-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Đang tải dữ liệu hệ thống từ cơ sở dữ liệu…
      </div>
    );
  }
  if (taxoError) {
    return (
      <div className="p-8 text-sm text-destructive">
        Không tải được dữ liệu: {taxoError instanceof Error ? taxoError.message : "Lỗi không xác định"}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col gap-3 overflow-hidden p-3 sm:p-4 lg:p-5">
      <div className="grid shrink-0 grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold sm:text-2xl">Hệ Thống Kỹ thuật</h1>
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
            <span>
              {scopeText} · {nhomCount} nhóm · {sysCount} hệ thống · {tpCount.toLocaleString("vi-VN")} thành phần ·{" "}
              {badgeFilterActive(badgeFilter)
                ? <><span className="font-medium text-foreground">{viewTotal.toLocaleString("vi-VN")}</span> / {total.toLocaleString("vi-VN")} tài sản (đang lọc)</>
                : <>{total.toLocaleString("vi-VN")} tài sản</>}
            </span>
            <InfoHint>
              Duyệt sơ đồ theo phân loại → lĩnh vực → nhóm hệ thống → hệ thống → tài sản → thành phần. Bấm “Chỉnh sửa” để tổ chức lại sơ đồ và khai thêm trường dữ liệu.
            </InfoHint>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <NodeSearch items={searchIndex} onPick={pickNode} />

          {/* Chuyển chế độ xem: chỉ hiện trên máy tính,
              trên điện thoại giữ giao diện gọn (mặc định Danh sách). */}
          {!isMobile && (
            <>


              <Tabs value={display} onValueChange={(v) => setDisplay(v as Display)}>
                <TabsList>
                  
                  <TabsTrigger value="tree"><ListTree className="mr-1.5 h-3.5 w-3.5" /> Danh sách</TabsTrigger>
                  <TabsTrigger value="table"><Table2 className="mr-1.5 h-3.5 w-3.5" /> Bảng</TabsTrigger>
                  <TabsTrigger value="mindmap"><GitFork className="mr-1.5 h-3.5 w-3.5" /> Sơ đồ tư duy</TabsTrigger>
                </TabsList>
              </Tabs>
            </>
          )}

          {/* Gom nhóm: trên điện thoại dùng 2 nút gọn thay cho tab dài. */}
          <Tabs value={groupMode} onValueChange={(v) => setGroupMode(v as "phanloai" | "donvi")}>
            <TabsList>
              <TabsTrigger value="phanloai" title="Gom theo phân loại → lĩnh vực → nhóm hệ thống → hệ thống">
                <Boxes className="mr-1.5 h-3.5 w-3.5" /> <span className="sm:inline">Phân loại</span>
              </TabsTrigger>
              <TabsTrigger value="donvi" title="Gom theo đơn vị → hệ thống → tài sản → thành phần">
                <Building2 className="mr-1.5 h-3.5 w-3.5" /> <span className="sm:inline">Đơn vị</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Bật/tắt: trong từng hệ thống, gom tài sản theo LOẠI tài sản
              (Máy tính / Switch / Router…) thay vì hiển thị theo thành phần. */}
          {display === "tree" && (
            <Button
              variant={groupByLoai ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupByLoai((v) => !v)}
              title="Gom tài sản trong mỗi hệ thống theo chủng loại"
            >
              <Tags className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Gom theo loại</span>
            </Button>
          )}


          {/* Chỉnh sửa (kéo–thả) & thao tác quản trị: chỉ trên máy tính. */}
          {!isMobile && canEdit && (
            <>
              <Badge
                variant={editMode ? "default" : "outline"}
                className={editMode
                  ? "gap-1 bg-primary/10 text-[11px] text-primary hover:bg-primary/15"
                  : "gap-1 border-amber-500/40 text-[11px] text-amber-700 dark:text-amber-400"}
                title="Trạng thái chỉnh sửa áp dụng cho cả 3 view: Danh sách, Bảng và Sơ đồ tư duy"
              >
                {editMode ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {editMode ? "Đang chỉnh sửa" : "Chỉ tra cứu"}
              </Badge>
              <Button
                variant={editMode ? "default" : "outline"}
                size="sm"
                onClick={() => setEditMode((v) => !v)}
                title={
                  editMode
                    ? "Đang ở chế độ chỉnh sửa — bấm để thoát và khoá sơ đồ"
                    : "Bật chế độ chỉnh sửa: áp dụng cho cả 3 view (Danh sách, Bảng, Sơ đồ)"
                }
              >
                {editMode ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Pencil className="mr-1.5 h-3.5 w-3.5" />}
                {editMode ? "Xong" : "Chỉnh sửa"}
              </Button>
            </>
          )}

          {!isMobile && canManage && (
            <>
              <Button variant="outline" size="sm" onClick={() => setReorgOpen(true)} title="Xem, duyệt và hoàn tác các thay đổi sơ đồ">
                <History className="mr-1.5 h-3.5 w-3.5" /> Thay đổi &amp; Hoàn tác
              </Button>
              <Button variant="outline" size="sm" asChild title="Thùng rác — thành phần đã ẩn (soft delete)">
                <Link to="/he-thong/thung-rac">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Thùng rác
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {display === "table" ? (
        <div className="min-h-0 flex-1">
          <ThanhPhanTable hideHeader tableKey="he-thong-cay:thanh-phan-toan-cuc" externalEditMode={editMode} />
        </div>

      ) : display === "mindmap" ? (
        <div className="min-h-0 flex-1 rounded-lg border bg-card">
          <ReactFlowProvider>
            <MindMap tree={viewTree} scopeText={scopeText} posByHt={posByHt}
              plMind={plMind} lvMind={lvMind} nhMind={nhMind} htMind={htMind} tbMind={tbMind}
              focusTarget={focus} canManage={canManage}
              onOpenEditor={(k, ma) => openEditor(editKindOf(k), ma)} onHistory={openHistory}
              onIncident={openIncident} onMaint={openMaint}
              onRecord={(kind, ma, ten) => setRecordTarget({ kind, ma, ten })}
              onRename={(k, ma, ten) => renameDisplay(editKindOf(k), ma, ten, "mindmap")}
              onMoveSystem={setMoveReq} onMoveGroup={setMoveGroupReq} onMoveDevice={setMoveDeviceReq} />
          </ReactFlowProvider>
        </div>

      ) : (
        <div className="min-h-0 flex-1 overflow-auto pr-1">
          <TreeView tree={viewTree} plLabel={plMind} lvLabel={lvMind} nhLabel={nhMind} tbLabel={tbMind} htMind={htMind}
            posByHt={posByHt} groupByLoai={groupByLoai} allDevByMa={tbMap}
            focusTarget={focus} canManage={canManage} onOpenEditor={openEditor} onHistory={openHistory}
            onIncident={openIncident} onMaint={openMaint}
            onRecord={(kind, ma, ten) => setRecordTarget({ kind, ma, ten })}
            onRename={(k, ma, ten) => renameDisplay(editKindOf(k), ma, ten, "tree")}
            onMoveSystem={setMoveReq} onMoveGroup={setMoveGroupReq} onMoveDevice={setMoveDeviceReq}
            onReorder={onReorder} onSetColor={onSetColor} />
        </div>
      )}

      <NodeEditorSheet
        target={editTarget} onClose={() => setEditTarget(null)} overrides={overrides}
        plLabel={plLabel} lvLabel={lvLabel} nhLabel={nhLabel} htLabel={htLabel} tbMap={tbMap}
        gpLabelFor={(ma) => giayPhepLabelByTen(htPlTen.get(ma))}
        viTriList={taxo?.viTriList ?? []} trangThaiList={taxo?.trangThaiList ?? []}
        saving={saveNode.isPending} canManage={canManage}
        groupsOfPl={groupsOfPl} childrenOf={childrenOf}
        onAddGroup={(plId, ten, ma) => addGroup.mutate({ plId, ten, ma })} addingGroup={addGroup.isPending}
        onAddSystem={(nhMa, plId, ten, donViId) => addSystem.mutate({ nhMa, plId, ten, donViId })} addingSystem={addSystem.isPending}
        onAddDevice={(heThongId, ten, ma) => addDevice.mutate({ heThongId, ten, ma })} addingDevice={addDevice.isPending}
        plIdOfNh={(ma) => nhPlId(ma)}
        donViList={taxo?.donViList ?? []}

        onDelete={(kind, ma, ten, label) => {
          const ci = childrenOf(kind, ma);
          setDeleteTarget({ kind, ma, ten, label, isCustom: isCustomNode(kind, ma), hasChildren: ci.items.length > 0 });
        }}
        unitCodeOf={unitCodeOf}
        isCustomNode={isCustomNode}
        isRealNode={(kind, ma) => !!realNameTarget(kind, ma)}
        onRenameGroupCode={(oldMa, newMa) => renameGroupCode.mutate({ oldMa, newMa }, { onSuccess: () => setEditTarget(null) })}
        renamingGroupCode={renameGroupCode.isPending}
        onSave={(payload) => saveNode.mutate(payload, { onSuccess: () => setEditTarget(null) })}
      />


      <SystemHistorySheet group={historyTarget} suKien={suKien} tbMap={tbMap} tbName={tbMind} onClose={() => setHistoryTarget(null)} />

      <DeviceHistorySheet target={recordTarget} suKien={suKien} onClose={() => setRecordTarget(null)} />

      <CayThayDoiPanel open={reorgOpen} onClose={() => setReorgOpen(false)} isAdmin={isAdmin} htNameMap={taxo?.htNameMap} />

      <AlertDialog open={!!moveReq} onOpenChange={(o) => !o && setMoveReq(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Di chuyển hệ thống?</AlertDialogTitle>
            <AlertDialogDescription>
              {moveReq && (
                <>
                  Chuyển <b>{moveReq.tenHeThong}</b> sang phân loại <b>{plLabel(moveReq.toNhomId)}</b>
                  {moveReq.toLvId ? <> · lĩnh vực <b>{lvLabel(moveReq.toLvId)}</b></> : null}
                  {moveReq.toNhTen ? <> · nhóm hệ thống <b>{moveReq.toNhTen}</b></> : null}.
                  {" "}Toàn bộ tài sản thuộc hệ thống cũng được cập nhật.
                  {isAdmin ? " Thay đổi áp dụng ngay và có thể hoàn tác." : " Thay đổi sẽ chờ admin duyệt."}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!moveReq) return;
                submitReorg.mutate({
                  loai: "move_system",
                  he_thong_id: moveReq.heThongId,
                  mo_ta: `Di chuyển "${moveReq.tenHeThong}" sang ${plLabel(moveReq.toNhomId)}${moveReq.toLvId ? " / " + lvLabel(moveReq.toLvId) : ""}${moveReq.toNhTen ? " / " + moveReq.toNhTen : ""}`,
                  payload: {
                    to_nhom_id: moveReq.toNhomId,
                    to_nh_key: moveReq.toNhKey ?? null,
                    to_nh_ten: moveReq.toNhTen ?? null,
                  },
                });
                setMoveReq(null);
              }}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Di chuyển cả cụm (Lĩnh vực / Nhóm hệ thống) — kéo theo hệ thống con */}
      <AlertDialog open={!!moveGroupReq} onOpenChange={(o) => !o && setMoveGroupReq(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Di chuyển cả cụm?</AlertDialogTitle>
            <AlertDialogDescription>
              {moveGroupReq && (
                <>
                  Chuyển <b>{moveGroupReq.label}</b> cùng <b>{moveGroupReq.count}</b> hệ thống con sang{" "}
                  <b>{moveGroupReq.toLabel}</b>. Toàn bộ tài sản thuộc các hệ thống này cũng được cập nhật.
                  {isAdmin ? " Thay đổi áp dụng ngay và có thể hoàn tác." : " Thay đổi sẽ chờ admin duyệt."}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!moveGroupReq) return;
                submitReorg.mutate({
                  loai: "move_systems",
                  he_thong_id: "",
                  mo_ta: `Di chuyển cụm "${moveGroupReq.label}" (${moveGroupReq.count} hệ thống) sang ${moveGroupReq.toLabel}`,
                  payload: {
                    system_ids: moveGroupReq.systemIds,
                    to_nhom_id: moveGroupReq.toNhomId,
                  },
                });
                setMoveGroupReq(null);
              }}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Di chuyển một tài sản sang hệ thống khác */}
      <AlertDialog open={!!moveDeviceReq} onOpenChange={(o) => !o && setMoveDeviceReq(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Di chuyển tài sản?</AlertDialogTitle>
            <AlertDialogDescription>
              {moveDeviceReq && (
                <>
                  {moveDeviceReq.toPlId ? (
                    <>
                      Chuyển tài sản <b>{moveDeviceReq.label}</b> sang phân loại <b>{moveDeviceReq.toPlLabel}</b>.
                      Tài sản sẽ được gỡ khỏi nhóm/hệ thống hiện tại và nằm ở mục “Khác” của phân loại mới.
                    </>
                  ) : (
                    <>
                      Chuyển tài sản <b>{moveDeviceReq.label}</b> sang hệ thống <b>{moveDeviceReq.toHtLabel}</b>.
                      Tài sản sẽ nhận phân loại/lĩnh vực của hệ thống đích.
                    </>
                  )}
                  {isAdmin ? " Thay đổi áp dụng ngay và có thể hoàn tác." : " Thay đổi sẽ chờ admin duyệt."}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!moveDeviceReq) return;
                const toPl = moveDeviceReq.toPlId;
                submitReorg.mutate({
                  loai: "move_device",
                  he_thong_id: "",
                  mo_ta: toPl
                    ? `Di chuyển tài sản "${moveDeviceReq.label}" sang phân loại ${moveDeviceReq.toPlLabel}`
                    : `Di chuyển tài sản "${moveDeviceReq.label}" sang ${moveDeviceReq.toHtLabel}`,
                  payload: toPl
                    ? { device_ma: moveDeviceReq.deviceMa, to_pl_id: toPl }
                    : { device_ma: moveDeviceReq.deviceMa, to_ht_id: moveDeviceReq.toHtId },
                });
                setMoveDeviceReq(null);
              }}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá {deleteTarget?.label}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Bạn có chắc muốn xoá <b>{deleteTarget?.ten}</b>
                  {deleteTarget?.isCustom ? " (mục do người dùng khai thêm)" : ""}?
                </p>
                {(deleteTarget?.kind === "ht" || deleteTarget?.kind === "nh") && (
                  <div className="rounded-md border bg-muted/40 p-2 text-sm">
                    {deletePreview.isFetching ? (
                      <span className="text-muted-foreground">Đang kiểm tra lịch sử tài sản…</span>
                    ) : (
                      <ul className="space-y-1">
                        <li>
                          <b>{(deletePreview.data?.sach.length ?? 0).toLocaleString("vi-VN")}</b> tài sản chưa có lịch sử
                          {" "}→ <b className="text-destructive">xoá vĩnh viễn</b>.
                        </li>
                        <li>
                          <b>{(deletePreview.data?.coLichSu.length ?? 0).toLocaleString("vi-VN")}</b> tài sản đã có lịch sử
                          {" "}→ chuyển <b>"Ngừng khai thác"</b>, giữ nguyên hồ sơ lý lịch (không xoá).
                        </li>
                      </ul>
                    )}
                  </div>
                )}
                {deleteTarget?.hasChildren && (deletePreview.data?.coLichSu.length ?? 0) > 0 && (
                  <p className="text-muted-foreground">
                    Vì còn tài sản có lịch sử, nhánh này sẽ được <b>giữ lại</b> (chỉ xoá tài sản nhập nhầm).
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget)
                  deleteNode.mutate({
                    kind: deleteTarget.kind, ma: deleteTarget.ma,
                    isCustom: deleteTarget.isCustom, hasChildren: deleteTarget.hasChildren,
                  });
                setDeleteTarget(null);
              }}
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>

        </AlertDialogContent>
      </AlertDialog>




    </div>
  );
}

/* ----------------------------- Sơ đồ tư duy ----------------------------- */

type MindKind = "root" | "pl" | "lv" | "nh" | "ht" | "tb" | "tp" | "vtg" | "vt";
type MindData = {
  kind: MindKind;
  focusKind?: FocusTarget["kind"];
  ma?: string;
  label: string;
  code?: string;
  count?: number;
  maThietBi?: string;
  sysName?: string;
  donViMa?: string | null;
  loaiTb?: string | null;
  collapsible?: boolean;
  expanded?: boolean;
  hit?: boolean;
  dim?: boolean;
  active?: boolean;
  canManage?: boolean;
  tone?: string;
  toggle?: () => void;
  onRename?: (ten: string) => void;
  onOpenEditor?: () => void;
  onHistory?: () => void;
  onIncident?: () => void;
  onMaint?: () => void;
  onRecord?: () => void;
  moveTargets?: MoveTarget[];
  onMove?: (toNhomId: string, toLvId: string, toNhKey?: string, toNhTen?: string) => void;
  devLabel?: string;
  assignState?: "assigned" | "empty" | "stopped";
  // Node "Thành phần" (tp) đại diện cho VỊ TRÍ CHỨC NĂNG (he_thong_thanh_phan)
  // thay vì tài sản-con: hiển thị mã vị trí + tài sản đang giữ (gan_chuc_nang
  // hiệu lực). Cờ này để phân biệt với tp tài sản-con (nếu có).
  isViTri?: boolean;
  [k: string]: unknown;

};
type MindNodeType = Node<MindData, "mind">;

// Phong cách "thanh mảnh" kiểu mindmap NotebookLM: viền mảnh, nền gần như
// trong suốt, phân cấp thể hiện bằng màu viền + chấm màu thay vì mảng nền đậm.
const KIND_STYLE: Record<MindKind, string> = {
  root: "border-primary/60 bg-primary/10 text-foreground",
  pl: "border-rose-500/30 bg-card/70",
  lv: "border-primary/30 bg-card/70",
  nh: "border-violet-500/30 bg-card/70",
  ht: "border-blue-500/30 bg-card/70",
  tb: "border-border bg-card/70",
  tp: "border-emerald-500/30 bg-card/70",
  vtg: "border-sky-500/30 bg-card/70",
  vt: "border-sky-500/25 bg-card/70",
};
// Chấm màu nhỏ đầu node — dấu hiệu cấp bậc thay cho nền màu.
const KIND_DOT: Record<MindKind, string> = {
  root: "bg-primary",
  pl: "bg-rose-500",
  lv: "bg-primary",
  nh: "bg-violet-500",
  ht: "bg-blue-500",
  tb: "bg-muted-foreground",
  tp: "bg-emerald-500",
  vtg: "bg-sky-500",
  vt: "bg-sky-400",
};
const KIND_ICON: Record<MindKind, React.ComponentType<{ className?: string }>> = {
  root: Building2, pl: Boxes, lv: Layers, nh: FolderTree, ht: Network, tb: Cpu, tp: Puzzle, vtg: Plug, vt: MapPin,
};
// Bề rộng node theo cấp (px) — dùng chung cho CSS và thuật toán bố trí cột.
const KIND_W: Record<MindKind, number> = {
  root: 260, pl: 248, lv: 248, nh: 268, ht: 320, tb: 308, tp: 300, vtg: 264, vt: 320,
};
const KIND_H: Record<MindKind, number> = {
  root: 32, pl: 32, lv: 32, nh: 32, ht: 32, tb: 32, tp: 32, vtg: 32, vt: 32,
};
const KIND_WIDTH: Record<MindKind, string> = {
  root: "w-[260px]",
  pl: "w-[248px]",
  lv: "w-[248px]",
  nh: "w-[268px]",
  ht: "w-[320px]",
  tb: "w-[308px]",
  tp: "w-[300px]",
  vtg: "w-[264px]",
  vt: "w-[320px]",
};

function TruncatedNodeLabel({ label }: { label: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setTruncated(el.scrollWidth > el.clientWidth + 1);
    update();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [label]);

  const text = (
    <span
      ref={ref}
      className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-medium"
      title={truncated ? undefined : label}
    >
      {label}
    </span>
  );

  if (!truncated) return text;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{text}</TooltipTrigger>
      <TooltipContent side="top" align="center" className="max-w-80 break-words leading-snug">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function MindNode({ data }: NodeProps<MindNodeType>) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const Icon = KIND_ICON[data.kind];

  const startInline = () => {
    if (!data.canManage || data.kind === "root") return;
    setDraft(data.label);
    setEditing(true);
  };
  const commit = () => {
    setEditing(false);
    const v = draft.trim();
    if (v && v !== data.label) data.onRename?.(v);
  };

  if (editing) {
    return (
      <div className={cn("flex items-center gap-1 rounded-lg border px-2 py-1.5", KIND_STYLE[data.kind])} onClick={(e) => e.stopPropagation()}>
        <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-muted-foreground/40" />
        <input
          autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          className="w-44 rounded border bg-background px-2 py-1 text-xs text-foreground outline-none"
        />
        <button className="rounded p-1 hover:bg-muted" onClick={commit} title="Lưu"><Check className="h-3.5 w-3.5 text-green-600" /></button>
        <button className="rounded p-1 hover:bg-muted" onClick={() => setEditing(false)} title="Huỷ"><X className="h-3.5 w-3.5" /></button>
        <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-muted-foreground/40" />
      </div>
    );
  }

  const actionButtonClass = "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-accent hover:text-accent-foreground";
  const isPositionNode = data.kind === "vt" || (data.kind === "tp" && data.isViTri);
  const hasToolbar = Boolean(
    (isPositionNode && data.onOpenEditor) ||
    (data.kind === "ht" && (data.onIncident || data.onMaint || data.onHistory || (data.canManage && data.onMove && (data.moveTargets?.length ?? 0) > 0))) ||
    ((data.kind === "tb" || data.kind === "tp") && data.onRecord) ||
    (data.canManage && data.kind !== "root" && !(data.kind === "tp" && data.isViTri)),
  );

  return (
    <div
      onDoubleClick={(e) => { e.stopPropagation(); startInline(); }}
      className={cn(
        "group relative flex h-8 cursor-pointer items-center text-[11px] leading-none transition-all animate-fade-in",
        KIND_WIDTH[data.kind],
      )}
    >
      <div
        className={cn(
          "relative flex h-full w-full items-center gap-1.5 overflow-hidden rounded-md border border-l-2 px-2 pr-2 backdrop-blur-[1px] transition-all hover:border-primary/60 hover:shadow-sm",
        KIND_STYLE[data.kind],
        data.tone,
        data.dim && "opacity-20 saturate-0",
        data.active && "z-10 border-primary ring-1 ring-primary/60",
        data.hit && "z-10 border-amber-500 ring-1 ring-amber-500 animate-pulse",
      )}
    >
        <Handle type="target" position={Position.Left} className="!h-1 !w-1 !border-0 !bg-muted-foreground/30" />
        {data.collapsible ? (
          <span
            className={cn(
              "flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border text-[9px] transition-colors",
              data.expanded ? "border-primary/50 bg-primary/15 text-primary" : "border-muted-foreground/30 bg-background text-muted-foreground",
            )}
            title={data.expanded ? "Thu nhỏ" : "Mở rộng"}
            onClick={(e) => { e.stopPropagation(); data.toggle?.(); }}
          >
            {data.expanded ? <Minus className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
          </span>
        ) : (
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-sm", KIND_DOT[data.kind])} />
        )}
        <Icon className="h-3 w-3 shrink-0 opacity-60" />

        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
          {data.code && <CodeBadge code={data.code} title={data.maThietBi ? `Mã tài sản: ${data.code}` : `Mã: ${data.code}`} />}
          <TruncatedNodeLabel label={data.label} />
          {data.donViMa && data.kind !== "tb" && data.kind !== "tp" && (
            <Badge
              variant="outline"
              className="inline-flex max-w-[68px] shrink-0 gap-0.5 truncate border-amber-500/30 bg-amber-500/10 px-1 py-0 text-[9px] font-medium text-amber-600"
              title={`Đơn vị: ${data.donViMa}`}
            >
              <Building2 className="h-2.5 w-2.5 shrink-0" />
              <span className="min-w-0 truncate">{data.donViMa}</span>
            </Badge>
          )}
          {data.loaiTb && (data.kind === "tb" || data.kind === "tp") && (
            <Badge
              variant="outline"
              className="inline-flex max-w-[72px] shrink-0 truncate border-violet-500/30 bg-violet-500/10 px-1 py-0 text-[9px] font-medium text-violet-600"
              title={`Chủng loại: ${data.loaiTb}`}
            >
              <span className="min-w-0 truncate">{data.loaiTb}</span>
            </Badge>
          )}
        </div>
        {typeof data.count === "number" && (
          <Badge variant={data.kind === "root" ? "secondary" : "outline"} className="ml-auto shrink-0 text-[10px]">
            {data.count.toLocaleString("vi-VN")}
          </Badge>
        )}
        {isPositionNode && data.devLabel && (
          <Badge
            variant="outline"
            className={cn(
              "ml-auto max-w-[96px] shrink-0 truncate text-[9px]",
              data.assignState === "assigned"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                : data.assignState === "stopped"
                  ? "border-border bg-muted text-muted-foreground"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-600",
            )}
            title={data.devLabel}
          >
            {data.devLabel}
          </Badge>
        )}
        <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-muted-foreground/40" />
      </div>

      {hasToolbar && (
        <div className="pointer-events-none absolute left-[calc(100%+4px)] top-1/2 z-20 flex -translate-y-1/2 items-center gap-0.5 rounded-md border bg-popover/95 px-1 py-0.5 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
          {isPositionNode && data.onOpenEditor && (
            <button
              className={actionButtonClass}
              title="Mở tài sản đang lắp"
              onClick={(e) => { e.stopPropagation(); data.onOpenEditor?.(); }}
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
          {data.kind === "ht" && data.onIncident && (
            <button
              className={actionButtonClass}
              title="Tạo sự cố cho hệ thống này"
              onClick={(e) => { e.stopPropagation(); data.onIncident?.(); }}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
            </button>
          )}
          {data.kind === "ht" && data.onMaint && (
            <button
              className={actionButtonClass}
              title="Tạo phiếu bảo dưỡng cho hệ thống này"
              onClick={(e) => { e.stopPropagation(); data.onMaint?.(); }}
            >
              <Wrench className="h-3.5 w-3.5" />
            </button>
          )}
          {data.kind === "ht" && data.onHistory && (
            <button
              className={actionButtonClass}
              title="Lý lịch hệ thống (bảo dưỡng · sự cố · thay thế)"
              onClick={(e) => { e.stopPropagation(); data.onHistory?.(); }}
            >
              <History className="h-3.5 w-3.5" />
            </button>
          )}
          {(data.kind === "tb" || data.kind === "tp") && data.onRecord && (
            <button
              className={actionButtonClass}
              title="Sổ lý lịch tài sản"
              onClick={(e) => { e.stopPropagation(); data.onRecord?.(); }}
            >
              <History className="h-3.5 w-3.5" />
            </button>
          )}
          {data.kind === "ht" && data.canManage && data.onMove && (data.moveTargets?.length ?? 0) > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={actionButtonClass}
                  title="Di chuyển hệ thống sang Phân loại / Lĩnh vực khác"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-96 w-64 overflow-auto">
                <DropdownMenuLabel className="truncate">Di chuyển “{data.label}” sang…</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(() => {
                  const byPl = new Map<string, { plLabel: string; items: MoveTarget[] }>();
                  for (const t of data.moveTargets ?? []) {
                    let e = byPl.get(t.plId);
                    if (!e) { e = { plLabel: t.plLabel, items: [] }; byPl.set(t.plId, e); }
                    e.items.push(t);
                  }
                  return [...byPl.values()].map((g) => (
                    <DropdownMenuSub key={g.plLabel}>
                      <DropdownMenuSubTrigger className="truncate">{g.plLabel}</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="max-h-80 overflow-auto">
                        {g.items.map((t) => (
                          <DropdownMenuItem
                            key={`${t.plId}:${t.lvId}:${t.nhKey}`}
                            onClick={(e) => { e.stopPropagation(); data.onMove?.(t.plId, t.lvId, t.nhKey, t.nhLabel); }}
                          >
                            {t.lvLabel} · {t.nhLabel}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  ));
                })()}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {data.canManage && data.kind !== "root" && !(data.kind === "tp" && data.isViTri) && (
            <button
              className={actionButtonClass}
              title={
                data.kind === "tb" || data.kind === "tp"
                  ? "Sửa thông tin tài sản"
                  : data.kind === "ht"
                    ? "Sửa hệ thống"
                    : "Sửa tên & khai trường dữ liệu"
              }
              onClick={(e) => { e.stopPropagation(); data.onOpenEditor?.(); }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function LayerNode({ data }: NodeProps) {
  const d = data as { label: string };
  return (
    <div className="pointer-events-none select-none px-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
      {d.label}
    </div>
  );
}

const nodeTypes: NodeTypes = { mind: MindNode, layer: LayerNode };

// Cấu trúc trung gian để bố trí đệ quy.
type Raw = {
  id: string;
  kind: MindKind;
  data: MindData;
  children: Raw[];
  parent?: Raw;
  x?: number;
  y?: number;
  h?: number;
  center?: number;
  depth?: number;
};

function MindMap({
  tree, scopeText, posByHt, plMind, lvMind, nhMind, htMind, tbMind, focusTarget, canManage, onRename, onOpenEditor, onHistory, onIncident, onMaint, onRecord, onMoveSystem, onMoveGroup, onMoveDevice,
}: {
  tree: PlGroup[];
  scopeText: string;
  posByHt?: Map<string, ViTriChucNangTree[]>;
  plMind: (id: string) => string;
  lvMind: (id: string) => string;
  nhMind: (ma: string) => string;
  htMind: (ma: string) => string;
  tbMind: (t: ThietBi) => string;
  focusTarget: FocusTarget | null;
  canManage: boolean;
  onRename: (kind: FocusTarget["kind"], ma: string, ten: string) => void;
  onOpenEditor: (kind: FocusTarget["kind"], ma: string) => void;
  onHistory: (htMa: string) => void;
  onIncident: (htMa: string) => void;
  onMaint: (htMa: string) => void;
  onRecord: (kind: "tb" | "tp", ma: string, ten: string) => void;
  onMoveSystem: (req: MoveReq) => void;
  onMoveGroup: (req: MoveGroupReq) => void;
  onMoveDevice: (req: MoveDeviceReq) => void;
}) {
  const { fitView, getIntersectingNodes, getViewport, setViewport } = useReactFlow();
  const nav = useNavigate();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["root", "root-stopped"]));
  const [hitId, setHitId] = useState<string | null>(null);
  // Nhánh đang tập trung: node vừa mở/tương tác → làm mờ các nhánh khác, viền sáng node này.
  const [activeId, setActiveId] = useState<string | null>(null);

  // Node vừa được mở → sau khi bố trí lại, đưa nhánh đó vào tầm nhìn.
  const justOpenedRef = useRef<string | null>(null);
  const fitSeqRef = useRef(0);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); justOpenedRef.current = null; }
      else { next.add(id); justOpenedRef.current = id; }
      return next;
    });
    setActiveId(id === "root" ? null : id);
  }, []);

  const collapseAll = useCallback(() => setExpanded(new Set(["root", "root-stopped"])), []);

  useEffect(() => {
    if (!focusTarget) return;
    const { plId, lvId, nhMa: fNhMa, htMa, kind } = focusTarget;
    setExpanded((prev) => {
      const s = new Set(prev);
      s.add("root");
      s.add(`pl:${plId}`);
      if (lvId) s.add(`lv:${plId}:${lvId}`);
      if (lvId && fNhMa && kind !== "lv") s.add(`nh:${plId}:${lvId}:${fNhMa}`);
      if (lvId && htMa && (kind === "tb" || kind === "tp")) s.add(`ht:${plId}:${lvId}:${htMa}`);
      return s;
    });
    const nodeId =
      kind === "pl" ? `pl:${plId}`
      : kind === "lv" ? `lv:${plId}:${lvId}`
      : kind === "nh" ? `nh:${plId}:${lvId}:${fNhMa}`
      : kind === "ht" ? `ht:${plId}:${lvId}:${htMa}`
      : kind === "tp" ? `tp:${focusTarget.ma}`
      : `tb:${focusTarget.ma}`;
    setHitId(nodeId);
    const t1 = setTimeout(() => { void fitView({ nodes: [{ id: nodeId }], duration: 500, maxZoom: 1.1, padding: 0.5 }); }, 260);
    const t2 = setTimeout(() => setHitId(null), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [focusTarget, fitView]);

  // Danh sách đích di chuyển (Phân loại → Lĩnh vực → Nhóm hệ thống) dùng cho menu "Di chuyển".
  const moveTargets = useMemo<MoveTarget[]>(() => {
    const out: MoveTarget[] = [];
    for (const pl of tree)
      for (const lv of pl.fields)
        for (const nh of lv.groups)
          out.push({ plId: pl.id, plLabel: plMind(pl.id), lvId: "", lvLabel: "", nhKey: nh.ma, nhLabel: nhMind(nh.ma) });
    return out;
  }, [tree, plMind, nhMind]);

  const { nodes, edges } = useMemo(() => {
    // Khoảng hở ngang giữa hai cột (mép phải cột trước → mép trái cột sau).
    // Vị trí X của từng cột được tính từ bề rộng THỰC của node rộng nhất trong
    // cột đó (xem bước "đo cột" bên dưới) nên node không bao giờ đè cột kế bên.
    const COL_GAP = 96;
    // Chiều cao node được cố định theo CSS để thuật toán layout dùng đúng kích thước render thực tế.
    const estHeight = (kind: MindKind) => KIND_H[kind] ?? 46;
    // Khoảng cách dọc tối thiểu giữa hai node liền kề (mép–mép).
    const ROW_GAP = 16;


    // Tách nhánh "Dừng khai thác" ra khỏi cây chính để hiển thị song song
    // (cùng tầng) với gốc "Toàn hệ thống", thay vì lồng bên trong.
    const stoppedPl = tree.find((pl) => pl.ten === DUNG_KHAI_THAC_TEN);
    const normalTree = tree.filter((pl) => pl.ten !== DUNG_KHAI_THAC_TEN);

    // Dựng cây Raw theo trạng thái mở rộng.
    const rootRaw: Raw = {
      id: "root", kind: "root",
      data: { kind: "root", label: scopeText, count: normalTree.length, collapsible: true, expanded: expanded.has("root") },
      children: [],
    };
    // Dựng một hệ thống (và tài sản/thành phần con) làm con của `parent`.
    const pushSystem = (parent: Raw, ht: HtGroup, htId: string, unitMode: boolean) => {
      const htSysId = parseHtSysMa(ht.ma).sysName;
      const htPosCount = (isRealSystemId(htSysId) ? posByHt?.get(htSysId) : undefined)?.length ?? 0;
      const htRaw: Raw = {
        id: htId, kind: "ht",
        data: {
          kind: "ht", focusKind: "ht", ma: ht.ma, label: htMind(ht.ma), donViMa: ht.donViMa,
          count: ht.devices.length, collapsible: ht.devices.length > 0 || htPosCount > 0, expanded: expanded.has(htId),
          canManage: canManage && ht.ma !== HT_KHAC,
          toggle: () => toggle(htId), onRename: (t) => onRename("ht", ht.ma, t), onOpenEditor: () => onOpenEditor("ht", ht.ma),
          onHistory: ht.ma !== HT_KHAC ? () => onHistory(ht.ma) : undefined,
          onIncident: ht.ma !== HT_KHAC ? () => onIncident(ht.ma) : undefined,
          onMaint: ht.ma !== HT_KHAC ? () => onMaint(ht.ma) : undefined,
          moveTargets: unitMode ? undefined : moveTargets,
          onMove: unitMode ? undefined : (toNhomId, toLvId, toNhKey, toNhTen) => {
            const sysId = parseHtSysMa(ht.ma).sysName;
            if (!isRealSystemId(sysId)) { toast.error("Hãy “Lưu thay đổi” hệ thống mới khai thêm trước khi di chuyển"); return; }
            onMoveSystem({ heThongId: sysId, tenHeThong: htMind(ht.ma), toNhomId, toLvId, toNhKey, toNhTen });
          },
        },
        children: [],
      };
      parent.children.push(htRaw);
      if (!expanded.has(htId)) return;

      // Vị trí chức năng (lớp cấu trúc) — hiển thị TRƯỚC danh sách tài sản để
      // nhóm luôn nằm sát hệ thống, không bị đẩy xuống dưới hàng chục tài sản.
      const sysId = parseHtSysMa(ht.ma).sysName;
      const positions = (isRealSystemId(sysId) ? posByHt?.get(sysId) : undefined) ?? [];
      // Tài sản đang lắp vào thành phần → không lặp lại ở nhánh tài sản phẳng.
      const assignedMa = new Set(
        positions.map((p) => p.device?.ma_thiet_bi).filter((x): x is string => !!x),
      );
      // Lớp "Thành phần hệ thống" = tài sản vật lý đang giữ vai trò chức năng.
      // Con của nó (lớp "Thành phần tài sản") = linh kiện bên trong tài sản.
      const devKids = new Map(ht.devices.map((d) => [d.tb.ma_thiet_bi, d.children]));
      for (const p of positions) {
        const dev = p.device;
        const stopped = p.trang_thai === "ngung";
        const assignState: MindData["assignState"] = stopped ? "stopped" : dev ? "assigned" : "empty";
        const tpId = `tp:${p.id}`;
        const kids = dev ? (devKids.get(dev.ma_thiet_bi) ?? []) : [];
        const hasKids = kids.length > 0;
        const tpRaw: Raw = {
          id: tpId, kind: "tp",
          data: {
            kind: "tp", focusKind: "tp", isViTri: true, ma: p.id,
            label: p.ten, code: p.ma_thanh_phan, assignState,
            // Chip hiển thị tài sản đang lắp (hoặc trạng thái khe trống/ngừng).
            devLabel: stopped
              ? "Đã ngừng"
              : dev ? (dev.ten_thiet_bi || dev.ma_thiet_bi) : (p.bat_buoc ? "Chưa gán ⚠" : "Chưa gán"),
            sysName: htMind(ht.ma),
            count: hasKids ? kids.length : undefined,
            collapsible: hasKids, expanded: expanded.has(tpId), toggle: () => toggle(tpId),
            // "Mở tài sản đang lắp" + "Sổ lý lịch" tác động lên tài sản giữ vị trí.
            onOpenEditor: dev ? () => onOpenEditor("tb", dev.ma_thiet_bi) : undefined,
            onRecord: dev ? () => onRecord("tb", dev.ma_thiet_bi, dev.ten_thiet_bi || dev.ma_thiet_bi) : undefined,
          },
          children: [],
        };
        htRaw.children.push(tpRaw);
        // Linh kiện của tài sản đang lắp → lớp "Thành phần tài sản".
        if (hasKids && expanded.has(tpId)) {
          for (const c of kids) {
            tpRaw.children.push({
              id: `tp:${c.ma_thiet_bi}`, kind: "tp",
              data: {
                kind: "tp", focusKind: "tp", ma: c.ma_thiet_bi, label: tbMind(c), code: c.ma_thiet_bi,
                donViMa: (c.don_vi ?? "").trim() || null, loaiTb: (c._loaiTbTen ?? "").trim() || null,
                maThietBi: c.ma_thiet_bi, sysName: htMind(ht.ma), canManage,
                onRename: (t) => onRename("tp", c.ma_thiet_bi, t), onOpenEditor: () => onOpenEditor("tp", c.ma_thiet_bi),
                onRecord: () => onRecord("tp", c.ma_thiet_bi, tbMind(c)),
              },
              children: [],
            });
          }
        }
      }



      for (const d of ht.devices) {
        if (positions.length && assignedMa.has(d.tb.ma_thiet_bi)) continue;
        const tbId = `tb:${d.tb.ma_thiet_bi}`;
        const hasKids = d.children.length > 0;
        const tbRaw: Raw = {
          id: tbId, kind: "tb",
          data: {
            kind: "tb", focusKind: "tb", ma: d.tb.ma_thiet_bi, label: tbMind(d.tb), code: d.tb.ma_thiet_bi, donViMa: (d.tb.don_vi ?? "").trim() || null, loaiTb: (d.tb._loaiTbTen ?? "").trim() || null,
            maThietBi: d.tb.ma_thiet_bi, sysName: htMind(ht.ma), count: hasKids ? d.children.length : undefined,
            collapsible: hasKids, expanded: expanded.has(tbId), canManage,
            toggle: () => toggle(tbId), onRename: (t) => onRename("tb", d.tb.ma_thiet_bi, t), onOpenEditor: () => onOpenEditor("tb", d.tb.ma_thiet_bi),
            onRecord: () => onRecord("tb", d.tb.ma_thiet_bi, tbMind(d.tb)),
          },
          children: [],
        };
        htRaw.children.push(tbRaw);
        if (hasKids && expanded.has(tbId)) {
          for (const c of d.children) {
            tbRaw.children.push({
              id: `tp:${c.ma_thiet_bi}`, kind: "tp",
              data: {
                kind: "tp", focusKind: "tp", ma: c.ma_thiet_bi, label: tbMind(c), code: c.ma_thiet_bi, donViMa: (c.don_vi ?? "").trim() || null, loaiTb: (c._loaiTbTen ?? "").trim() || null,
                maThietBi: c.ma_thiet_bi, sysName: htMind(ht.ma), canManage,
                onRename: (t) => onRename("tp", c.ma_thiet_bi, t), onOpenEditor: () => onOpenEditor("tp", c.ma_thiet_bi),
                onRecord: () => onRecord("tp", c.ma_thiet_bi, tbMind(c)),
              },
              children: [],
            });
          }
        }
      }
    };


    if (expanded.has("root")) {
      for (const pl of normalTree) {
        const plId = `pl:${pl.id}`;
        const unitMode = !!pl.fields[0]?.groups[0]?.passthrough;
        const unitSystems = unitMode ? pl.fields[0].groups[0].systems : [];
        // Đã bỏ lớp Lĩnh vực → nhóm hệ thống gắn thẳng vào phân loại.
        const nhGroups = unitMode ? [] : pl.fields.flatMap((lv) => lv.groups.map((nh) => ({ lvId: lv.id, nh })));
        const plRaw: Raw = {
          id: plId, kind: "pl",
          data: {
            kind: "pl", focusKind: "pl", ma: pl.id,
            label: unitMode ? pl.ten : plMind(pl.id),
            count: unitMode ? unitSystems.length : nhGroups.length,
            collapsible: unitMode ? unitSystems.length > 0 : nhGroups.length > 0,
            expanded: expanded.has(plId), canManage: canManage && !unitMode,
            toggle: () => toggle(plId),
            onRename: unitMode ? undefined : (t) => onRename("pl", pl.id, t),
            onOpenEditor: unitMode ? undefined : () => onOpenEditor("pl", pl.id),
          },
          children: [],
        };
        rootRaw.children.push(plRaw);
        if (!expanded.has(plId)) continue;

        if (unitMode) {
          for (const ht of unitSystems) pushSystem(plRaw, ht, `ht:${pl.id}:${ht.ma}`, true);
          continue;
        }

        for (const { lvId, nh } of nhGroups) {
          const nhId = `nh:${pl.id}:${lvId}:${nh.ma}`;
          const nhRaw: Raw = {
            id: nhId, kind: "nh",
            data: {
              kind: "nh", focusKind: "nh", ma: nh.ma, label: nhMind(nh.ma), code: undefined, count: nh.systems.length,
              tone: nhMindTone(nh.mau),
              collapsible: nh.systems.length > 0, expanded: expanded.has(nhId), canManage,
              toggle: () => toggle(nhId), onRename: (t) => onRename("nh", nh.ma, t), onOpenEditor: () => onOpenEditor("nh", nh.ma),
            },
            children: [],
          };
          plRaw.children.push(nhRaw);
          if (!expanded.has(nhId)) continue;
          for (const ht of nh.systems) pushSystem(nhRaw, ht, `ht:${pl.id}:${lvId}:${ht.ma}`, false);
        }
      }

    }

    // Gốc "Dừng khai thác" — song song, cùng tầng với "Toàn hệ thống".
    // Các hệ thống ngừng khai thác gắn thẳng làm con (bỏ lớp nhóm cho gọn).
    const stoppedSystems = stoppedPl
      ? stoppedPl.fields.flatMap((lv) => lv.groups.flatMap((nh) => nh.systems))
      : [];
    const stoppedRoot: Raw = {
      id: "root-stopped", kind: "root",
      data: {
        kind: "root", label: stoppedPl ? plMind(stoppedPl.id) : DUNG_KHAI_THAC_TEN,
        count: stoppedSystems.length, collapsible: true, expanded: expanded.has("root-stopped"),
        toggle: () => toggle("root-stopped"),
      },
      children: [],
    };
    if (expanded.has("root-stopped")) {
      for (const ht of stoppedSystems) {
        pushSystem(stoppedRoot, ht, `ht:stopped:${ht.ma}`, false);
      }
    }

    // Bố trí đệ quy kiểu "tidy tree": mỗi node giữ chỗ theo chiều cao thực của
    // chính nó; cha căn giữa theo con nhưng không bao giờ tràn ra ngoài vùng đã
    // cấp cho các anh/em cùng cột → tránh chồng lấn.
    let cursor = 0;
    const shiftSubtree = (n: Raw, dy: number) => {
      n.y = (n.y ?? 0) + dy;
      n.center = (n.center ?? 0) + dy;
      for (const c of n.children) shiftSubtree(c, dy);
    };
    const allRaw: Raw[] = [];
    const place = (n: Raw, depth: number, parent?: Raw) => {
      n.depth = depth;
      n.parent = parent;
      n.h = estHeight(n.kind);
      allRaw.push(n);
      if (n.children.length === 0) {
        n.y = cursor;
        n.center = cursor + n.h / 2;
        cursor += n.h + ROW_GAP;
        return;
      }
      const top = cursor;
      for (const c of n.children) place(c, depth + 1, n);
      const firstMid = n.children[0].center ?? 0;
      const lastMid = n.children[n.children.length - 1].center ?? 0;
      let center = (firstMid + lastMid) / 2;
      // Nếu cha cao hơn khoảng con chiếm, đẩy toàn bộ con xuống để cha không
      // đè lên anh/em phía trên.
      const parentTop = center - n.h / 2;
      if (parentTop < top) {
        const dy = top - parentTop;
        for (const c of n.children) shiftSubtree(c, dy);
        cursor += dy;
        center += dy;
      }
      n.center = center;
      n.y = center - n.h / 2;
      // Nếu cha thò xuống dưới con cuối, nới cursor để anh/em kế tiếp không đè.
      const parentBottom = center + n.h / 2;
      if (parentBottom + ROW_GAP > cursor) cursor = parentBottom + ROW_GAP;
    };
    place(rootRaw, 0);
    // Nhánh "Dừng khai thác" đặt ngay bên dưới, cùng cột gốc (cùng tầng).
    cursor += ROW_GAP * 2;
    place(stoppedRoot, 0);

    // ── Đo cột: X của mỗi cấp = tổng bề rộng thực của các cấp trước + khoảng hở.
    const maxDepth = allRaw.reduce((m, n) => Math.max(m, n.depth ?? 0), 0);
    const colW: number[] = Array.from({ length: maxDepth + 1 }, () => 0);
    for (const n of allRaw) {
      const d = n.depth ?? 0;
      colW[d] = Math.max(colW[d], KIND_W[n.kind] ?? 200);
    }
    const COL: number[] = [];
    for (let d = 0; d <= maxDepth; d++) COL[d] = d === 0 ? 0 : COL[d - 1] + colW[d - 1] + COL_GAP;
    for (const n of allRaw) n.x = COL[n.depth ?? 0] ?? 0;

    // ── Quét khử chồng lấn theo từng cột (đảm bảo cứng, kể cả giữa hai cây gốc):
    // sắp xếp theo y rồi đẩy xuống node nào lấn vào khoảng ROW_GAP của node trên.
    const byCol = new Map<number, Raw[]>();
    for (const n of allRaw) {
      const d = n.depth ?? 0;
      const arr = byCol.get(d) ?? [];
      arr.push(n);
      byCol.set(d, arr);
    }
    const relaxColumns = () => {
      let moved = false;
      const depths = [...byCol.keys()].sort((a, b) => a - b);
      for (const d of depths) {
        const arr = byCol.get(d) ?? [];
        arr.sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
        for (let i = 1; i < arr.length; i++) {
          const prev = arr[i - 1];
          const cur = arr[i];
          const minY = (prev.y ?? 0) + (prev.h ?? 0) + ROW_GAP;
          const overlap = minY - (cur.y ?? 0);
          if (overlap > 0) {
            shiftSubtree(cur, overlap);
            moved = true;
          }
        }
      }
      return moved;
    };
    for (let pass = 0; pass < Math.max(4, maxDepth + 2); pass++) {
      if (!relaxColumns()) break;
    }



    // Tính tập node thuộc nhánh đang tập trung: tổ tiên + chính nó + toàn bộ con cháu.
    let activeBranch: Set<string> | null = null;
    if (activeId) {
      const subtree = new Set<string>();
      const path: string[] = [];
      const findPath = (n: Raw, trail: string[]): boolean => {
        const nt = [...trail, n.id];
        if (n.id === activeId) {
          const collect = (x: Raw) => { subtree.add(x.id); x.children.forEach(collect); };
          collect(n);
          path.push(...nt);
          return true;
        }
        for (const c of n.children) if (findPath(c, nt)) return true;
        return false;
      };
      if (!findPath(rootRaw, [])) findPath(stoppedRoot, []);
      if (subtree.size) activeBranch = new Set<string>([...path, ...subtree]);
    }

    const nodes: MindNodeType[] = [];
    const edges: Edge[] = [];
    const walk = (n: Raw) => {
      const nd = n.data as MindData;
      const dragKinds = nd.kind === "lv" || nd.kind === "nh" || nd.kind === "ht" || nd.kind === "tb";
      if (activeBranch) {
        nd.dim = !activeBranch.has(n.id);
        nd.active = n.id === activeId;
      } else {
        nd.dim = false;
        nd.active = false;
      }
      nodes.push({ id: n.id, type: "mind", position: { x: n.x ?? 0, y: n.y ?? 0 }, data: n.data, draggable: canManage && dragKinds });
      for (const c of n.children) {
        const edgeDim = activeBranch ? !(activeBranch.has(n.id) && activeBranch.has(c.id)) : false;
        edges.push({
          id: `${n.id}->${c.id}`, source: n.id, target: c.id, type: "bezier",
          style: { strokeWidth: 1, stroke: "var(--border)", opacity: edgeDim ? 0.12 : 0.75 },
        });
        walk(c);
      }
    };
    walk(rootRaw);
    walk(stoppedRoot);

    if (hitId) for (const n of nodes) (n.data as MindData).hit = n.id === hitId;

    const unitMode = tree.some((pl) => pl.fields[0]?.groups[0]?.passthrough);
    const layerLabels = unitMode
      ? ["Toàn hệ thống", "Đơn vị", "Hệ thống", "Thành phần hệ thống", "Thành phần tài sản"]
      : ["Toàn hệ thống", "Phân loại", "Nhóm hệ thống", "Hệ thống", "Thành phần hệ thống", "Thành phần tài sản"];

    const layerNodes: Node[] = layerLabels
      .filter((_, i) => COL[i] !== undefined)
      .map((label, i) => ({
        id: `layer:${i}`, type: "layer", position: { x: COL[i], y: -64 },
        data: { label }, selectable: false, draggable: false, focusable: false,
      }));

    return { nodes: [...layerNodes, ...nodes], edges };
  }, [tree, expanded, hitId, activeId, scopeText, posByHt, plMind, nhMind, htMind, tbMind, canManage, onRename, onOpenEditor, onHistory, onRecord, onMoveSystem, moveTargets, toggle, onIncident, onMaint]);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(nodes);
  useEffect(() => { setRfNodes(nodes); }, [nodes, setRfNodes]);

  // Chỉ fit-view lần đầu (khi có node). Không fit lại khi expand/collapse để giữ nguyên mức zoom.
  const didFit = useRef(false);
  useEffect(() => {
    if (didFit.current || nodes.length === 0) return;
    didFit.current = true;
    const id = setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 60);
    return () => clearTimeout(id);
  }, [nodes.length, fitView]);

  // Sau khi mở một node: CHỈ pan (giữ nguyên mức zoom hiện tại) để nhánh vừa bung
  // lọt vào tầm nhìn. Không bao giờ zoom-out.
  useLayoutEffect(() => {
    const opened = justOpenedRef.current;
    if (!opened) return;
    justOpenedRef.current = null;
    const seq = ++fitSeqRef.current;
    const childMap = new Map<string, string[]>();
    for (const e of edges) {
      const arr = childMap.get(e.source) ?? [];
      arr.push(e.target);
      childMap.set(e.source, arr);
    }
    const ids = new Set<string>([opened]);
    const queue = [...(childMap.get(opened) ?? [])];
    while (queue.length) {
      const id = queue.shift();
      if (!id || ids.has(id)) continue;
      ids.add(id);
      queue.push(...(childMap.get(id) ?? []));
    }
    const targets = nodes.filter((n) => ids.has(n.id));
    if (!targets.length) return;
    const t = setTimeout(() => {
      if (seq !== fitSeqRef.current) return;
      const el = document.querySelector(".react-flow__viewport")?.parentElement as HTMLElement | null;
      if (!el) return;
      const vw = el.clientWidth;
      const vh = el.clientHeight;
      const { x, y, zoom } = getViewport();
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const n of targets) {
        const w = (n as { width?: number }).width ?? KIND_W[(n.data as { kind?: MindKind }).kind ?? "ht"] ?? 200;
        const h = (n as { height?: number }).height ?? 30;
        minX = Math.min(minX, n.position.x);
        minY = Math.min(minY, n.position.y);
        maxX = Math.max(maxX, n.position.x + w);
        maxY = Math.max(maxY, n.position.y + h);
      }
      const PAD = 48;
      // toạ độ màn hình của bbox với viewport hiện tại
      let nx = x, ny = y;
      const left = minX * zoom + nx, right = maxX * zoom + nx;
      const top = minY * zoom + ny, bottom = maxY * zoom + ny;
      if (right > vw - PAD) nx -= right - (vw - PAD);
      if (minX * zoom + nx < PAD) nx = PAD - minX * zoom;
      if (bottom > vh - PAD) ny -= bottom - (vh - PAD);
      if (minY * zoom + ny < PAD) ny = PAD - minY * zoom;
      if (nx !== x || ny !== y) void setViewport({ x: nx, y: ny, zoom }, { duration: 380 });
      void left; void top;
    }, 40);
    return () => clearTimeout(t);
  }, [nodes, edges, getViewport, setViewport]);




  // Khi kéo node cha, các node con phải đi theo (giữ nguyên khoảng cách).
  const dragRef = useRef<{ startX: number; startY: number; desc: Map<string, { x: number; y: number }> } | null>(null);

  const collectDescendants = useCallback((rootId: string): Set<string> => {
    const childMap = new Map<string, string[]>();
    for (const e of edges) {
      const arr = childMap.get(e.source) ?? [];
      arr.push(e.target);
      childMap.set(e.source, arr);
    }
    const desc = new Set<string>();
    const stack = [...(childMap.get(rootId) ?? [])];
    while (stack.length) {
      const id = stack.pop()!;
      if (desc.has(id)) continue;
      desc.add(id);
      for (const c of childMap.get(id) ?? []) stack.push(c);
    }
    return desc;
  }, [edges]);

  // Thu thập id hệ thống thật thuộc một Lĩnh vực (trong 1 Phân loại).
  const systemsOfLv = useCallback((plId: string, lvId: string): string[] => {
    const pl = tree.find((p) => p.id === plId);
    const lv = pl?.fields.find((f) => f.id === lvId);
    if (!lv) return [];
    const ids: string[] = [];
    for (const nh of lv.groups)
      for (const ht of nh.systems) {
        const s = parseHtSysMa(ht.ma).sysName;
        if (s && s !== NONE_HT) ids.push(s);
      }
    return [...new Set(ids)];
  }, [tree]);

  // Thu thập id hệ thống thật thuộc một Nhóm hệ thống.
  const systemsOfNh = useCallback((plId: string, lvId: string, nhMa: string): string[] => {
    const pl = tree.find((p) => p.id === plId);
    const lv = pl?.fields.find((f) => f.id === lvId);
    const nh = lv?.groups.find((g) => g.ma === nhMa);
    if (!nh) return [];
    const ids: string[] = [];
    for (const ht of nh.systems) {
      const s = parseHtSysMa(ht.ma).sysName;
      if (s && s !== NONE_HT) ids.push(s);
    }
    return [...new Set(ids)];
  }, [tree]);


  return (
    <TooltipProvider delayDuration={180} skipDelayDuration={100}>
      <Card className="overflow-hidden">
        <div className="h-[72vh] min-h-[480px] w-full">
        <ReactFlow
          nodes={rfNodes} edges={edges} nodeTypes={nodeTypes} fitView minZoom={0.05} maxZoom={1.5}
          onNodesChange={onNodesChange}
          onPaneClick={() => setActiveId(null)}
          nodesDraggable={canManage} nodesConnectable={false} nodesFocusable={false} elementsSelectable
          onNodeDragStart={(_e, node) => {
            const desc = collectDescendants(String(node.id));
            const posMap = new Map<string, { x: number; y: number }>();
            for (const n of rfNodes) if (desc.has(String(n.id))) posMap.set(String(n.id), { x: n.position.x, y: n.position.y });
            dragRef.current = { startX: node.position.x, startY: node.position.y, desc: posMap };
          }}
          onNodeDrag={(_e, node) => {
            const dr = dragRef.current;
            if (!dr || dr.desc.size === 0) return;
            const dx = node.position.x - dr.startX;
            const dy = node.position.y - dr.startY;
            setRfNodes((prev) => prev.map((n) => {
              const base = dr.desc.get(String(n.id));
              return base ? { ...n, position: { x: base.x + dx, y: base.y + dy } } : n;
            }));
          }}
          onNodeDragStop={(_e, node) => {
            dragRef.current = null;
            const d = node.data as MindData;
            const reset = () => setRfNodes(nodes);

            // Đích va chạm gần nhất theo loại node được kéo.
            const hitFirst = (prefixes: string[]) =>
              getIntersectingNodes(node).find((n) => prefixes.some((p) => String(n.id).startsWith(p)));

            if (d.kind === "ht" && d.ma) {
              const sysId = parseHtSysMa(d.ma).sysName;
              if (!isRealSystemId(sysId)) { if (sysId && sysId !== NONE_HT) toast.error("Hãy “Lưu thay đổi” hệ thống mới khai thêm trước khi di chuyển"); return reset(); }
              const hitNode = hitFirst(["nh:", "pl:", "lv:"]);
              if (hitNode) {
                const parts = String(hitNode.id).split(":");
                const toNhomId = parts[1] ?? "";
                const toLvId = parts[2];
                const toNhKey = String(hitNode.id).startsWith("nh:") ? parts.slice(3).join(":") : undefined;
                const hitData = hitNode.data as MindData;
                if (toNhomId) onMoveSystem({ heThongId: sysId, tenHeThong: d.label, toNhomId, toLvId, toNhKey, toNhTen: toNhKey ? hitData.label : undefined });
              }
              return reset();
            }

            if (d.kind === "lv") {
              // Kéo cả Lĩnh vực sang Phân loại khác → mọi hệ thống con đi theo.
              const parts = String(node.id).split(":"); // lv:plId:lvId
              const fromPl = parts[1] ?? "";
              const lvId = parts[2] ?? "";
              const hitNode = hitFirst(["pl:"]);
              if (hitNode) {
                const toNhomId = String(hitNode.id).split(":")[1] ?? "";
                if (toNhomId && toNhomId !== fromPl) {
                  const systemIds = systemsOfLv(fromPl, lvId);
                  if (systemIds.length) onMoveGroup({ label: d.label, count: systemIds.length, systemIds, toNhomId, toLabel: (hitNode.data as MindData).label });
                }
              }
              return reset();
            }

            if (d.kind === "nh") {
              // Kéo cả Nhóm hệ thống sang Lĩnh vực / Phân loại khác.
              const parts = String(node.id).split(":"); // nh:plId:lvId:nhMa
              const fromPl = parts[1] ?? "";
              const fromLv = parts[2] ?? "";
              const nhMa = parts.slice(3).join(":");
              const hitNode = hitFirst(["lv:", "pl:"]);
              if (hitNode) {
                const hp = String(hitNode.id).split(":");
                const isLv = String(hitNode.id).startsWith("lv:");
                const toNhomId = hp[1] ?? "";
                const toLvId = isLv ? hp[2] : undefined;
                const changed = toNhomId && (toNhomId !== fromPl || (toLvId && toLvId !== fromLv));
                if (changed) {
                  const systemIds = systemsOfNh(fromPl, fromLv, nhMa);
                  if (systemIds.length) onMoveGroup({ label: d.label, count: systemIds.length, systemIds, toNhomId, toLvId, toLabel: (hitNode.data as MindData).label });
                }
              }
              return reset();
            }

            if (d.kind === "tb" && d.maThietBi) {
              // Kéo tài sản sang Hệ thống khác.
              const hitNode = hitFirst(["ht:"]);
              if (hitNode) {
                const hitData = hitNode.data as MindData;
                const toHtId = hitData.ma ? parseHtSysMa(hitData.ma).sysName : "";
                // Chỉ nhận hệ thống thật (UUID) làm đích; hệ thống khai thêm
                // chưa lưu sẽ gây lỗi cast UUID ở CSDL.
                if (isRealSystemId(toHtId)) onMoveDevice({ deviceMa: d.maThietBi, label: d.label, toHtId, toHtLabel: hitData.label });
                else if (toHtId && toHtId !== NONE_HT) toast.error("Hãy “Lưu thay đổi” hệ thống mới khai thêm trước khi chuyển tài sản vào");
              }
              return reset();
            }

            return reset();
          }}
          onNodeClick={(_e, node) => {
            const d = node.data as MindData;
            // Bấm node chỉ mở rộng/thu gọn. Truy cập sổ lý lịch dùng nút "Lý lịch" trên node.
            d.toggle?.();
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable className="!hidden sm:!block" />
          <Panel position="top-left">
            <div className="flex items-center gap-2 rounded-lg border bg-card/90 p-2 text-xs shadow-sm backdrop-blur">
              <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" onClick={collapseAll}>Thu gọn tất cả</Button>
            </div>
          </Panel>
          </ReactFlow>
        </div>
      </Card>
    </TooltipProvider>
  );
}

/* ---------------- Thẻ hover chi tiết (chỉ desktop, không làm rối giao diện) ---------------- */

function HoverField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-xs leading-snug">
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 break-words font-medium">{value}</span>
    </div>
  );
}

/** Nội dung thẻ hover cho một tài sản / thành phần — gom theo 3 lớp cho nhất quán. */
function DeviceHoverContent({ d, name, isComponent, multiRole }: { d: DbDevice; name: string; isComponent?: boolean; multiRole?: MultiRoleInfo }) {
  const tt = (d.trang_thai ?? "").trim();
  const imp = (d.muc_do_quan_trong ?? "").trim();
  // LỚP 1 — Tài sản vật lý (định danh máy cụ thể).
  const tbRows: Array<[string, string]> = [];
  // LỚP 2/3 — Ngữ cảnh kế thừa từ thành phần hệ thống / hệ thống.
  const ctxRows: Array<[string, string]> = [];
  const push = (arr: Array<[string, string]>, label: string, v?: string | number | null) => {
    const s = v == null ? "" : String(v).trim();
    if (s && s !== "0") arr.push([label, s]);
  };
  push(tbRows, "Serial", d.serial);
  push(tbRows, "Model", d.model);
  push(tbRows, "P/N", d.p_n);
  push(tbRows, "Nhà sản xuất", d.nha_san_xuat);
  push(tbRows, "Chủng loại", d._loaiTbTen || d.loai);
  push(tbRows, "Năm sản xuất", d._namSanXuat);
  push(tbRows, "Năm khai thác", d._namKhaiThac);
  push(tbRows, "Bảo hành đến", d.han_bao_hanh);
  push(tbRows, "Tình trạng KT", d.tinh_trang_ky_thuat);
  push(tbRows, "Ghi chú", d.ghi_chu ?? "");
  push(ctxRows, "Vị trí", d._viTriTen || d.vi_tri);
  push(ctxRows, "Đơn vị quản lý", d._donViTen || d.don_vi);
  const empty = tbRows.length === 0 && ctxRows.length === 0;
  const mrCol = multiRole ? colorForThietBi(multiRole.thiet_bi_id) : null;
  return (
    <>
      <div className="border-b bg-muted/40 px-3 py-2">
        <div className="flex items-start gap-1.5 text-sm font-semibold">
          {isComponent ? <Puzzle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <Cpu className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />}
          <span className="break-words">{name}</span>
        </div>
        <div className="mt-0.5 pl-5"><CodeBadge code={d.ma_thiet_bi} title={`Mã tài sản: ${d.ma_thiet_bi}`} /></div>
      </div>
      {multiRole && mrCol && (
        <div
          className="border-b px-3 py-2 text-[11px]"
          style={{ backgroundColor: mrCol.bg, color: mrCol.text }}
        >
          <div className="mb-1 flex items-center gap-1.5 font-semibold">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: mrCol.dot }} />
            Tài sản đa vai trò · ×{multiRole.count}
          </div>
          <div className="mb-1 leading-snug opacity-90">
            Cùng một thiết bị vật lý đang đảm nhận {multiRole.count} vai trò
            "thành phần hệ thống" ở các hệ thống khác nhau.
          </div>
          <ul className="space-y-0.5">
            {multiRole.roles.map((r) => (
              <li key={r.thanh_phan_id} className="truncate">
                • <span className="font-medium">{r.ten_thanh_phan}</span>
                {r.ten_he_thong && <span className="opacity-80"> · {r.ten_he_thong}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(tt || imp) && (
        <div className="flex flex-wrap gap-1 px-3 pt-2">
          {tt && <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-medium", statusTone(tt))}>{tt}</span>}
          {imp && <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-medium", importanceTone(imp))}>{imp}</span>}
        </div>
      )}
      {empty ? (
        <div className="p-3 text-xs text-muted-foreground">Chưa có thông tin chi tiết cho tài sản này.</div>
      ) : (
        <div className="space-y-2.5 p-3">
          {tbRows.length > 0 && (
            <div className="space-y-1">
              <LayerSectionHeader layer="tb" />
              {tbRows.map(([l, v]) => <HoverField key={l} label={l} value={v} />)}
            </div>
          )}
          {ctxRows.length > 0 && (
            <div className="space-y-1">
              <LayerSectionHeader layer="tp" subtitle="ngữ cảnh kế thừa" />
              {ctxRows.map(([l, v]) => <HoverField key={l} label={l} value={v} />)}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/** Thẻ hover cho thành phần đang CHỜ tài sản (chưa lắp tài sản nào). */
function ThanhPhanChoHoverContent({ ten, ma }: { ten: string; ma?: string | null }) {
  return (
    <>
      <div className="border-b bg-muted/40 px-3 py-2">
        <div className="flex items-start gap-1.5 text-sm font-semibold">
          <Plug className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
          <span className="break-words">{ten}</span>
        </div>
        {ma && <div className="mt-0.5 pl-5"><CodeBadge code={ma} /></div>}
      </div>
      <div className="p-3 text-xs text-amber-600">
        Đang chờ để thay thế — chưa có tài sản nào được lắp vào thành phần này.
      </div>
    </>
  );
}

/** Nội dung thẻ hover cho MẪU THIẾT BỊ (dm_model) đã gán cho tài sản. */
function ModelHoverContent({ d }: { d: DbDevice }) {
  const { data: imgUrl } = useQuery({
    queryKey: ["model_hover_img", d._modelAnh],
    enabled: !!d._modelAnh,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await storage.from("model-anh").createSignedUrl(d._modelAnh, 315360000);
      return data?.signedUrl ?? null;
    },
  });
  const rows: Array<[string, string]> = [];
  const add = (label: string, v?: string | null) => {
    const s = (v ?? "").trim();
    if (s) rows.push([label, s]);
  };
  add("Mã mẫu", d._modelMa);
  add("P/N", d._modelPn);
  add("Nhà sản xuất", d._modelNsxTen);
  add("Chủng loại", d._loaiTbTen);
  add("Mô tả", d._modelMoTa);
  return (
    <>
      <div className="border-b bg-muted/40 px-3 py-2">
        <div className="flex items-start gap-1.5 text-sm font-semibold">
          <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="break-words">{d._modelTen || "(Chưa gán model)"}</span>
        </div>
      </div>
      <div className="flex items-center justify-center border-b bg-muted/20 p-2">
        {imgUrl ? (
          <img src={imgUrl} alt={d._modelTen} className="max-h-40 w-auto rounded object-contain" />
        ) : (
          <div className="flex h-24 w-full items-center justify-center rounded bg-muted/40 text-[11px] text-muted-foreground">
            Chưa có hình ảnh
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        {rows.length ? rows.map(([l, v]) => <HoverField key={l} label={l} value={v} />)
          : <div className="text-xs text-muted-foreground">Chưa có thông tin chi tiết cho mẫu này.</div>}
      </div>
    </>
  );
}

/** Nội dung thẻ hover cho một hệ thống — tóm tắt số lượng và phân bố trạng thái. */
function SystemHoverContent({ ht, name }: { ht: HtGroup; name: string }) {
  const counts = new Map<StatusCat, number>();
  let comps = 0;
  const bump = (tt: string) => counts.set(statusCat(tt), (counts.get(statusCat(tt)) ?? 0) + 1);
  for (const d of ht.devices) {
    bump(d.tb.trang_thai ?? "");
    comps += d.children.length;
    for (const c of d.children) bump(c.trang_thai ?? "");
  }
  const total = ht.devices.length + comps;
  return (
    <>
      <div className="border-b bg-muted/40 px-3 py-2">
        <div className="flex items-start gap-1.5 text-sm font-semibold">
          <Network className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="break-words">{name}</span>
        </div>
      </div>
      <div className="space-y-1 p-3">
        {ht.donViMa && <HoverField label="Đơn vị" value={ht.donViMa} />}
        <HoverField label="Tài sản" value={ht.devices.length.toLocaleString("vi-VN")} />
        {comps > 0 && <HoverField label="Thành phần" value={comps.toLocaleString("vi-VN")} />}
        <HoverField label="Tổng cộng" value={total.toLocaleString("vi-VN")} />
        {counts.size > 0 && (
          <div className="flex flex-wrap gap-1 pt-1.5">
            {STATUS_LEGEND.filter((s) => (counts.get(s.cat) ?? 0) > 0).map((s) => (
              <span key={s.cat} className={cn("rounded border px-1.5 py-0.5 text-[10px] font-medium", STATUS_TONE[s.cat])} title={s.label}>
                {s.label}: {counts.get(s.cat)}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ------------------------------ Danh sách ------------------------------ */


function Disclosure({
  open, onToggle, icon: Icon, label, code, count, subCount, subLabel, tone, canManage, onEdit, depth, onNavigate, onHistory, onIncident, onMaint, onRecord,
  onRename, donViMa, chips, moveTargets, onMove, plTargets, onMoveGroupTo,
  sysMoveTargets, onMoveDeviceTo, devPlTargets, onMoveDeviceToPl,
  onUp, onDown, onSetColor, currentColor, onAdd, addTitle, onDelete, deleteTitle, hover,
}: {
  open?: boolean; onToggle?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string; code?: string; count?: number; subCount?: number; subLabel?: string; tone?: string;
  canManage?: boolean; onEdit?: () => void; depth: number; onNavigate?: () => void; onHistory?: () => void; onIncident?: () => void; onMaint?: () => void; onRecord?: () => void;
  onRename?: (ten: string) => void; donViMa?: string | null; chips?: InfoChip[];
  moveTargets?: MoveTarget[]; onMove?: (toNhomId: string, toLvId: string, toNhKey?: string, toNhTen?: string) => void;
  plTargets?: Array<{ plId: string; plLabel: string }>; onMoveGroupTo?: (plId: string, plLabel: string) => void;
  sysMoveTargets?: SysTarget[]; onMoveDeviceTo?: (htId: string, htLabel: string) => void;
  devPlTargets?: Array<{ plId: string; plLabel: string }>; onMoveDeviceToPl?: (plId: string, plLabel: string) => void;
  onUp?: () => void; onDown?: () => void;
  onSetColor?: (mau: string | null) => void; currentColor?: string;
  onAdd?: () => void; addTitle?: string; onDelete?: () => void; deleteTitle?: string;
  hover?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const isMobile = useIsMobile();
  // Thụt lề gọn hơn trên điện thoại để tên hệ thống dài còn chỗ hiển thị.
  const indent = depth * (isMobile ? 9 : 18);

  const startInline = () => {
    if (!canManage || !onRename) return;
    setDraft(label);
    setEditing(true);
  };
  const commit = () => {
    setEditing(false);
    const v = draft.trim();
    if (v && v !== label) onRename?.(v);
  };

  if (editing) {
    return (
      <div
        className={cn("flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm", tone ?? "bg-card")}
        style={{ marginLeft: indent }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="w-4 shrink-0" />
        <Icon className="h-4 w-4 shrink-0" />
        <input
          autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          className="min-w-0 flex-1 rounded border bg-background px-2 py-0.5 text-sm outline-none"
        />
        <button className="shrink-0 rounded p-1 hover:bg-muted" onClick={commit} title="Lưu"><Check className="h-3.5 w-3.5 text-green-600" /></button>
        <button className="shrink-0 rounded p-1 hover:bg-muted" onClick={() => setEditing(false)} title="Huỷ"><X className="h-3.5 w-3.5" /></button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm",
        tone ?? "bg-card",
        onToggle || onNavigate ? "cursor-pointer hover:bg-muted/60" : "",
      )}
      style={{ marginLeft: indent }}
      onClick={onToggle ?? onNavigate}
      onDoubleClick={(e) => { e.stopPropagation(); startInline(); }}
    >
      {onToggle ? (
        open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <span className="w-4 shrink-0" />
      )}
      <Icon className="h-4 w-4 shrink-0" />
      {code && <CodeBadge code={code} className="mr-0.5" />}
      {hover && !isMobile ? (
        <CenterHoverCard
          openDelay={300}
          closeDelay={100}
          contentClassName="p-0"
          trigger={<span className="min-w-0 flex-1 break-words font-medium line-clamp-2 sm:truncate sm:line-clamp-none">{label}</span>}
        >
          {hover}
        </CenterHoverCard>
      ) : (
        <span className="min-w-0 flex-1 break-words font-medium line-clamp-2 sm:truncate sm:line-clamp-none">{label}</span>
      )}
      {chips && chips.length > 0 && (
        <div className="flex shrink-0 items-center gap-1">
          {chips.map((c, i) => (
            <span
              key={i}
              className={cn(
                "max-w-[88px] shrink-0 truncate rounded border px-1.5 py-0 text-[9px] font-medium sm:max-w-[140px]",
                c.className,
                // Trên màn hình nhỏ chỉ hiện 2 badge quan trọng nhất (trạng thái + mức độ).
                i >= 2 ? "hidden md:inline-block" : "",
              )}
              title={c.title ?? c.text}
            >
              {c.text}
            </span>
          ))}
        </div>
      )}

      {donViMa && (
        <Badge
          variant="outline"
          className="shrink-0 gap-0.5 border-amber-500/30 bg-amber-500/10 px-1 py-0 text-[9px] font-medium text-amber-600"
          title={`Đơn vị: ${donViMa}`}
        >
          <Building2 className="h-2.5 w-2.5 shrink-0" />
          {donViMa}
        </Badge>
      )}
      {typeof subCount === "number" && (
        <Badge
          variant="secondary"
          className="shrink-0 gap-0.5 px-1.5 py-0 text-[10px] font-medium"
          title={subLabel ? `${subCount.toLocaleString("vi-VN")} ${subLabel} trực tiếp` : undefined}
        >
          {subCount.toLocaleString("vi-VN")}{subLabel ? ` ${subLabel}` : ""}
        </Badge>
      )}
      {typeof count === "number" && (
        <Badge variant="outline" className="shrink-0 text-[10px]" title={`Tổng ${count.toLocaleString("vi-VN")} tài sản bên dưới`}>
          Σ {count.toLocaleString("vi-VN")}
        </Badge>
      )}
      {onNavigate && <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />}
      {onIncident && (
        <button
          className="shrink-0 rounded border border-border/60 bg-background/70 p-1 text-muted-foreground opacity-0 transition-all hover:bg-amber-600 hover:text-white group-hover:opacity-100"
          title="Tạo sự cố cho hệ thống này"
          onClick={(e) => { e.stopPropagation(); onIncident(); }}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
        </button>
      )}
      {onMaint && (
        <button
          className="shrink-0 rounded border border-border/60 bg-background/70 p-1 text-muted-foreground opacity-0 transition-all hover:bg-emerald-600 hover:text-white group-hover:opacity-100"
          title="Tạo phiếu bảo dưỡng cho hệ thống này"
          onClick={(e) => { e.stopPropagation(); onMaint(); }}
        >
          <Wrench className="h-3.5 w-3.5" />
        </button>
      )}
      {onHistory && (
        <button
          className="shrink-0 rounded border border-border/60 bg-background/70 p-1 text-muted-foreground opacity-0 transition-all hover:bg-blue-600 hover:text-white group-hover:opacity-100"
          title="Lý lịch hệ thống (bảo dưỡng · sự cố · thay thế)"
          onClick={(e) => { e.stopPropagation(); onHistory(); }}
        >
          <History className="h-3.5 w-3.5" />
        </button>
      )}
      {onRecord && (
        <button
          className="shrink-0 rounded border border-border/60 bg-background/70 p-1 text-muted-foreground opacity-0 transition-all hover:bg-blue-600 hover:text-white group-hover:opacity-100"
          title="Lý lịch tài sản (bảo dưỡng · sự cố · thay thế · bàn giao)"
          onClick={(e) => { e.stopPropagation(); onRecord(); }}
        >
          <History className="h-3.5 w-3.5" />
        </button>
      )}
      {canManage && onMove && (moveTargets?.length ?? 0) > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="shrink-0 rounded border border-border/60 bg-background/70 p-1 text-muted-foreground opacity-0 transition-all hover:bg-violet-600 hover:text-white group-hover:opacity-100"
              title="Di chuyển hệ thống sang Phân loại / Lĩnh vực khác"
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-96 w-64 overflow-auto">
            <DropdownMenuLabel className="truncate">Di chuyển “{label}” sang…</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(() => {
              const byPl = new Map<string, { plLabel: string; items: MoveTarget[] }>();
              for (const t of moveTargets ?? []) {
                let e = byPl.get(t.plId);
                if (!e) { e = { plLabel: t.plLabel, items: [] }; byPl.set(t.plId, e); }
                e.items.push(t);
              }
              return [...byPl.values()].map((g) => (
                <DropdownMenuSub key={g.plLabel}>
                  <DropdownMenuSubTrigger className="truncate">{g.plLabel}</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-80 overflow-auto">
                    {g.items.map((t) => (
                      <DropdownMenuItem
                        key={`${t.plId}:${t.lvId}:${t.nhKey}`}
                        onClick={(e) => { e.stopPropagation(); onMove?.(t.plId, t.lvId, t.nhKey, t.nhLabel); }}
                      >
                        {t.lvLabel} · {t.nhLabel}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ));
            })()}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {canManage && (onMoveDeviceTo || onMoveDeviceToPl) && ((sysMoveTargets?.length ?? 0) > 0 || (devPlTargets?.length ?? 0) > 0) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="shrink-0 rounded border border-border/60 bg-background/70 p-1 text-muted-foreground opacity-0 transition-all hover:bg-violet-600 hover:text-white group-hover:opacity-100"
              title="Di chuyển tài sản sang hệ thống hoặc phân loại khác"
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-96 w-72 overflow-auto">
            <DropdownMenuLabel className="truncate">Di chuyển “{label}” sang…</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {onMoveDeviceTo && (sysMoveTargets?.length ?? 0) > 0 && (() => {
              const byNh = new Map<string, { nhLabel: string; items: SysTarget[] }>();
              for (const t of sysMoveTargets ?? []) {
                let e = byNh.get(t.nhKey);
                if (!e) { e = { nhLabel: t.nhLabel, items: [] }; byNh.set(t.nhKey, e); }
                e.items.push(t);
              }
              return [...byNh.values()].map((g) => (
                <DropdownMenuSub key={g.nhLabel}>
                  <DropdownMenuSubTrigger className="truncate">{g.nhLabel}</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-80 w-72 overflow-auto">
                    {g.items.map((t) => (
                      <DropdownMenuItem
                        key={t.htId}
                        className="truncate"
                        onClick={(e) => { e.stopPropagation(); onMoveDeviceTo?.(t.htId, t.htLabel); }}
                      >
                        {t.htLabel}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ));
            })()}
            {onMoveDeviceToPl && (devPlTargets?.length ?? 0) > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="truncate">Phân loại khác (Nhóm 1/2/3)</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-80 w-64 overflow-auto">
                  {(devPlTargets ?? []).map((t) => (
                    <DropdownMenuItem
                      key={t.plId}
                      className="truncate"
                      onClick={(e) => { e.stopPropagation(); onMoveDeviceToPl?.(t.plId, t.plLabel); }}
                    >
                      {t.plLabel}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {canManage && onMoveGroupTo && (plTargets?.length ?? 0) > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="shrink-0 rounded border border-border/60 bg-background/70 p-1 text-muted-foreground opacity-0 transition-all hover:bg-violet-600 hover:text-white group-hover:opacity-100"
              title="Di chuyển sang Phân loại khác (vd: Dừng khai thác)"
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-96 w-64 overflow-auto">
            <DropdownMenuLabel className="truncate">Di chuyển “{label}” sang…</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(plTargets ?? []).map((t) => (
              <DropdownMenuItem
                key={t.plId}
                onClick={(e) => { e.stopPropagation(); onMoveGroupTo?.(t.plId, t.plLabel); }}
              >
                {t.plLabel}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {canManage && (onUp || onDown) && (
        <span className="flex shrink-0 items-center opacity-0 transition-all group-hover:opacity-100">
          <button
            className="rounded border border-border/60 bg-background/70 p-1 text-muted-foreground enabled:hover:bg-primary enabled:hover:text-primary-foreground disabled:opacity-30"
            title="Lên trên" disabled={!onUp}
            onClick={(e) => { e.stopPropagation(); onUp?.(); }}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            className="ml-1 rounded border border-border/60 bg-background/70 p-1 text-muted-foreground enabled:hover:bg-primary enabled:hover:text-primary-foreground disabled:opacity-30"
            title="Xuống dưới" disabled={!onDown}
            onClick={(e) => { e.stopPropagation(); onDown?.(); }}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </span>
      )}
      {canManage && onSetColor && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="shrink-0 rounded border border-border/60 bg-background/70 p-1 text-muted-foreground opacity-0 transition-all hover:bg-violet-600 hover:text-white group-hover:opacity-100"
              title="Đổi màu nhóm hệ thống"
              onClick={(e) => e.stopPropagation()}
            >
              <Palette className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Màu nhóm hệ thống</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {NH_COLORS.map((c) => (
              <DropdownMenuItem key={c.id} onClick={(e) => { e.stopPropagation(); onSetColor(c.id); }}>
                <span className={cn("mr-2 inline-block h-3 w-3 rounded-full", c.dot)} />
                {c.label}
                {currentColor === c.id && <Check className="ml-auto h-3.5 w-3.5 text-green-600" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSetColor(null); }}>
              <X className="mr-2 h-3.5 w-3.5" /> Bỏ màu
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {canManage && onAdd && (
        <button
          className="shrink-0 rounded border border-border/60 bg-background/70 p-1 text-muted-foreground opacity-0 transition-all hover:bg-emerald-600 hover:text-white group-hover:opacity-100"
          title={addTitle ?? "Thêm"}
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
      {canManage && onDelete && (
        <button
          className="shrink-0 rounded border border-border/60 bg-background/70 p-1 text-muted-foreground opacity-0 transition-all hover:bg-red-600 hover:text-white group-hover:opacity-100"
          title={deleteTitle ?? "Xoá"}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
      {!canManage && onEdit && (
        <button
          className="shrink-0 rounded border border-border/60 bg-background/70 p-1 text-muted-foreground opacity-0 transition-all hover:bg-sky-600 hover:text-white group-hover:opacity-100"
          title="Xem thông tin (chỉ đọc)"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      )}
      {canManage && onEdit && (
        <button
          className="shrink-0 rounded border border-border/60 bg-background/70 p-1 text-muted-foreground opacity-0 transition-all hover:bg-primary hover:text-primary-foreground group-hover:opacity-100"
          title="Sửa tên & khai trường dữ liệu"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// Hàng "Thành phần" trong listview — có nút Lên/Xuống/Xoá khi ở Edit Mode.
function PositionRow({
  p, depth, siblings, heThongId, fullDev, canManage, onNavigate,
}: {
  p: ViTriChucNangTree;
  depth: number;
  siblings: ViTriChucNangTree[];
  heThongId: string;
  fullDev?: DbDevice | undefined;
  canManage: boolean;
  onNavigate: () => void;
}) {
  const xoaMut = useXoaViTri(heThongId);
  const xoaForceMut = useXoaViTriForce(heThongId);
  const doiThuTuMut = useDoiThuTuViTri(heThongId);
  const { data: perms } = useMyPermissions();
  const isAdmin = !!perms?.roles?.includes("admin");
  const idx = siblings.findIndex((s) => s.id === p.id);
  const canMove = canManage && siblings.length > 1 && !doiThuTuMut.isPending;
  const move = (dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= siblings.length) return;
    const next = siblings.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    doiThuTuMut.mutate(next.map((s) => s.id));
  };

  const chips: InfoChip[] = [];
  if (p.trang_thai === "ngung") {
    chips.push({ text: "Đã ngừng", className: "border-border bg-muted text-muted-foreground" });
  } else if (p.device) {
    const dv = (fullDev?.don_vi ?? "").trim();
    const vt = (fullDev?.vi_tri ?? "").trim();
    if (dv) chips.push({ text: dv, className: "border-sky-500/30 bg-sky-500/10 text-sky-600", title: `Đơn vị quản lý: ${dv}` });
    if (vt) chips.push({ text: vt, className: "border-border bg-muted/60 text-muted-foreground", title: `Vị trí lắp đặt: ${vt}` });
  } else {
    chips.push({ text: "Đang chờ để thay thế", className: "border-amber-500/30 bg-amber-500/10 text-amber-600" });
  }

  const [confirmMode, setConfirmMode] = useState<null | "normal" | "force" | "force-history">(null);
  const [historyMsg, setHistoryMsg] = useState<string>("");

  const doNormalDelete = () => {
    xoaMut.mutate(p.id, {
      onSuccess: () => toast.success("Đã xoá thành phần"),
      onError: (e: unknown) => {
        const msg = e instanceof Error ? e.message : "Không xoá được";
        if (isAdmin && /lịch sử/i.test(msg)) {
          setHistoryMsg(msg);
          setConfirmMode("force-history");
          return;
        }
        toast.error(msg);
      },
    });
  };

  const doForceDelete = (reason: string) => {
    xoaForceMut.mutate({ viTriId: p.id, lyDo: reason }, {
      onSuccess: () => toast.success("Đã xoá cưỡng bức thành phần"),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Không xoá được"),
    });
  };

  const onDelete = () => {
    if (p.device) {
      if (!isAdmin) {
        toast.error("Thành phần đang có tài sản — hãy tháo trước khi xoá (hoặc dùng tài khoản admin).");
        return;
      }
      setConfirmMode("force");
      return;
    }
    setConfirmMode("normal");
  };

  return (
    <div id={`row-tp-${p.id}`}>
      <Disclosure
        icon={Plug} label={p.ten}
        chips={chips} tone="bg-sky-500/[0.04]" depth={depth}
        canManage={canManage}
        onNavigate={onNavigate}
        onUp={canMove && idx > 0 ? () => move(-1) : undefined}
        onDown={canMove && idx < siblings.length - 1 ? () => move(1) : undefined}
        onDelete={canManage ? onDelete : undefined}
        deleteTitle="Xoá thành phần (chỉ khi chưa có lịch sử lắp/tháo)"
        hover={fullDev
          ? <DeviceHoverContent d={fullDev} name={fullDev.ten || fullDev.ma_thiet_bi} />
          : <ThanhPhanChoHoverContent ten={p.ten} ma={p.ma_thanh_phan} />}
      />

      <AlertDialog open={!!confirmMode} onOpenChange={(o) => !o && setConfirmMode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmMode === "normal" && `Xoá thành phần "${p.ten}"?`}
              {confirmMode === "force" && `Xoá cưỡng bức thành phần "${p.ten}"?`}
              {confirmMode === "force-history" && "Thành phần có lịch sử"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMode === "normal" && "Thao tác này sẽ xoá thành phần khỏi hệ thống. Bạn có chắc chắn?"}
              {confirmMode === "force" && "Thành phần đang có tài sản đảm trách. Bản ghi lắp/tháo sẽ bị xoá theo; sự cố/bảo dưỡng/hỏng hóc sẽ mất liên kết."}
              {confirmMode === "force-history" && (
                <>
                  <span className="block whitespace-pre-line">{historyMsg}</span>
                  <span className="mt-2 block font-medium text-foreground">Bạn là admin — xoá cưỡng bức (kể cả khi có lịch sử)?</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const mode = confirmMode;
                setConfirmMode(null);
                if (mode === "normal") doNormalDelete();
                else if (mode === "force") doForceDelete("cay-listview force delete");
                else if (mode === "force-history") doForceDelete("cay-listview force after history block");
              }}
            >
              {confirmMode === "normal" ? "Xoá" : "Xoá cưỡng bức"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


function TreeView({
  tree, plLabel, lvLabel, nhLabel, tbLabel, htMind, focusTarget, canManage, onOpenEditor, onHistory, onIncident, onMaint, onRecord, onRename, onMoveSystem, onMoveGroup, onMoveDevice,
  onReorder, onSetColor, posByHt, groupByLoai, allDevByMa,
}: {
  tree: PlGroup[];
  posByHt?: Map<string, ViTriChucNangTree[]>;
  groupByLoai?: boolean;
  allDevByMa?: Map<string, DbDevice>;
  plLabel: (id: string) => string;
  lvLabel: (id: string) => string;
  nhLabel: (ma: string) => string;
  tbLabel: (t: ThietBi) => string;
  htMind: (ma: string) => string;
  focusTarget: FocusTarget | null;
  canManage: boolean;
  onOpenEditor: (kind: EditKind, ma: string) => void;
  onHistory: (htMa: string) => void;
  onIncident: (htMa: string) => void;
  onMaint: (htMa: string) => void;
  onRecord: (kind: "tb" | "tp", ma: string, ten: string) => void;
  onRename: (kind: FocusTarget["kind"], ma: string, ten: string) => void;
  onMoveSystem: (req: MoveReq) => void;
  onMoveGroup: (req: MoveGroupReq) => void;
  onMoveDevice: (req: MoveDeviceReq) => void;
  onReorder: (items: Array<{ kind: string; ma: string }>) => void;
  onSetColor: (ma: string, mau: string | null) => void;
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(tree.map((p) => `pl:${p.id}`)));
  const toggle = (id: string) => setOpen((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  // Chi tiết một thành phần hệ thống (mở khi bấm vào hàng thành phần).
  const [chiTietTp, setChiTietTp] = useState<{ viTri: ViTriChucNangTree; heThongId: string } | null>(null);
  const { data: multiRoleMap } = useMultiRoleMap();

  const moveTargets = useMemo<MoveTarget[]>(() => {
    const out: MoveTarget[] = [];
    for (const pl of tree)
      for (const lv of pl.fields)
        for (const nh of lv.groups)
          out.push({ plId: pl.id, plLabel: plLabel(pl.id), lvId: lv.id, lvLabel: lvLabel(lv.id), nhKey: nh.ma, nhLabel: nhLabel(nh.ma) });
    return out;
  }, [tree, plLabel, lvLabel, nhLabel]);

  // Danh sách Phân loại đích cho việc di chuyển cả nhóm hệ thống.
  const plTargets = useMemo(
    () => tree.map((pl) => ({ plId: pl.id, plLabel: plLabel(pl.id) })),
    [tree, plLabel],
  );

  // Danh sách Hệ thống đích (gom theo Nhóm hệ thống) cho việc di chuyển tài sản.
  const sysTargets = useMemo<SysTarget[]>(() => {
    const out: SysTarget[] = [];
    for (const pl of tree)
      for (const lv of pl.fields)
        for (const nh of lv.groups)
          for (const ht of nh.systems) {
            if (ht.ma === HT_KHAC) continue;
            const htId = parseHtSysMa(ht.ma).sysName;
            // Bỏ qua hệ thống "khai thêm" chưa lưu (id không phải UUID) — không
            // thể là đích di chuyển tài sản (sẽ gây lỗi cast UUID ở CSDL).
            if (!isRealSystemId(htId)) continue;
            out.push({ htId, htLabel: htMind(ht.ma), nhKey: nh.ma, nhLabel: nhLabel(nh.ma) });
          }
    return out;
  }, [tree, htMind, nhLabel]);

  useEffect(() => {
    if (!focusTarget) return;
    const { plId, lvId, nhMa: fNhMa, htMa } = focusTarget;
    setOpen((prev) => {
      const n = new Set(prev);
      n.add(`pl:${plId}`);
      if (lvId) n.add(`lv:${plId}:${lvId}`);
      if (lvId && fNhMa) n.add(`nh:${plId}:${lvId}:${fNhMa}`);
      if (lvId && htMa) n.add(`ht:${plId}:${lvId}:${htMa}`);
      return n;
    });
    const id = setTimeout(() => {
      const el = document.getElementById(`row-${focusTarget.kind}-${focusTarget.ma}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("ring-2", "ring-amber-500");
      setTimeout(() => el?.classList.remove("ring-2", "ring-amber-500"), 2600);
    }, 120);
    return () => clearTimeout(id);
  }, [focusTarget]);

  return (
    <Card className="p-3">
      <div className="space-y-1">
        {tree.map((pl) => {
          const plOpen = open.has(`pl:${pl.id}`);
          const unitMode = !!pl.fields[0]?.groups[0]?.passthrough;

          const renderSystem = (ht: HtGroup, htKey: string, htDepth: number, sibs?: HtGroup[], idx?: number) => {
            const htId = htKey;
            const htOpen = open.has(htId);
            const curSysId = parseHtSysMa(ht.ma).sysName;
            const positions = (isRealSystemId(curSysId) ? posByHt?.get(curSysId) : undefined) ?? [];
            const hasSystemChildren = ht.devices.length > 0 || positions.length > 0;
            const canOrder = canManage && !!sibs && typeof idx === "number" && sibs.length > 1;
            const reorderHt = (from: number, to: number) => {
              if (!sibs) return;
              const next = swapAt(sibs, from, to);
              onReorder(next.map((s) => ({ kind: "ht", ma: s.ma })));
            };
            return (
              <div key={ht.ma} className="space-y-1" id={`row-ht-${ht.ma}`}>
                <Disclosure
                  open={hasSystemChildren ? htOpen : undefined}
                  onToggle={hasSystemChildren ? () => toggle(htId) : undefined}
                  icon={Network} label={htMind(ht.ma)} donViMa={ht.donViMa}
                  count={ht.count} subCount={ht.devices.length || undefined} subLabel="tài sản" depth={htDepth}
                  chips={positions.length ? [{
                    text: `TP ${positions.length}`,
                    className: "border-sky-500/30 bg-sky-500/10 text-sky-600",
                    title: `${positions.length.toLocaleString("vi-VN")} thành phần hệ thống`,
                  }] : undefined}
                  canManage={canManage && ht.ma !== HT_KHAC} onEdit={() => onOpenEditor("ht", ht.ma)}
                  onAdd={canManage && ht.ma !== HT_KHAC ? () => onOpenEditor("ht", ht.ma) : undefined}
                  addTitle="Khai thêm thành phần"
                  onHistory={ht.ma !== HT_KHAC ? () => onHistory(ht.ma) : undefined}
                  onIncident={ht.ma !== HT_KHAC ? () => onIncident(ht.ma) : undefined}
                  onMaint={ht.ma !== HT_KHAC ? () => onMaint(ht.ma) : undefined}
                  onRename={ht.ma !== HT_KHAC ? (t) => onRename("ht", ht.ma, t) : undefined}
                  onUp={canOrder && idx! > 0 ? () => reorderHt(idx!, idx! - 1) : undefined}
                  onDown={canOrder && idx! < sibs!.length - 1 ? () => reorderHt(idx!, idx! + 1) : undefined}
                  moveTargets={unitMode ? undefined : moveTargets}
                  onMove={!unitMode && ht.ma !== HT_KHAC ? (toNhomId, toLvId, toNhKey, toNhTen) => {
                    const sysId = parseHtSysMa(ht.ma).sysName;
                    if (!isRealSystemId(sysId)) { toast.error("Hãy “Lưu thay đổi” hệ thống mới khai thêm trước khi di chuyển"); return; }
                    onMoveSystem({ heThongId: sysId, tenHeThong: htMind(ht.ma), toNhomId, toLvId, toNhKey, toNhTen });
                   } : undefined}
                  hover={ht.ma !== HT_KHAC ? <SystemHoverContent ht={ht} name={htMind(ht.ma)} /> : undefined}
                 />



                {htOpen && (() => {
                  const devTargets = sysTargets.filter((t) => t.htId !== curSysId);
                  // Mã tài sản đang được lắp vào một thành phần → tránh hiển thị 2 lần.
                  const assignedMa = new Set(
                    positions.map((p) => p.device?.ma_thiet_bi).filter((x): x is string => !!x),
                  );
                  // Mã tài sản → tên thành phần hệ thống (vai trò chức năng) đang giữ.
                  const assignedTpTen = new Map<string, string>();
                  for (const p of positions) {
                    if (p.device?.ma_thiet_bi) assignedTpTen.set(p.device.ma_thiet_bi, p.ten);
                  }
                  const renderDevice = (d: DevNode, depth: number) => {
                    // Nếu tài sản đang lắp vào một thành phần → hiển thị TÊN THÀNH PHẦN
                    // làm nhãn chính, còn tên tài sản cụ thể đưa xuống làm thẻ phụ.
                    const tpTen = assignedTpTen.get(d.tb.ma_thiet_bi);
                    const primaryLabel = tpTen || tbLabel(d.tb);
                    const chips: InfoChip[] = tpTen
                      ? (() => {
                          // Đang lắp vào một thành phần: bỏ badge lặp tên tài sản (đã có khi hover),
                          // hiển thị đơn vị quản lý + vị trí lắp đặt.
                          const out: InfoChip[] = [];
                          const dv = (d.tb.don_vi ?? "").trim();
                          if (dv) out.push({ text: dv, className: "border-sky-500/30 bg-sky-500/10 text-sky-600", title: `Đơn vị quản lý: ${dv}` });
                          return [...out, ...deviceChips(d.tb)];
                        })()
                      : deviceChips(d.tb);
                    return (
                    <div key={d.tb.ma_thiet_bi} className="space-y-1">
                      <div id={`row-tb-${d.tb.ma_thiet_bi}`} className="flex items-start gap-1.5">
                        <div className="min-w-0 flex-1">
                        <Disclosure
                          icon={tpTen ? Plug : Cpu} label={primaryLabel}
                          donViMa={(d.tb.don_vi ?? "").trim() || null} chips={chips}
                          count={d.children.length || undefined} depth={depth}
                          canManage={canManage} onEdit={() => onOpenEditor("tb", d.tb.ma_thiet_bi)}
                          onRecord={() => onRecord("tb", d.tb.ma_thiet_bi, tbLabel(d.tb))}
                          onRename={(t) => onRename("tb", d.tb.ma_thiet_bi, t)}
                          sysMoveTargets={devTargets}
                          onMoveDeviceTo={(toHtId, toHtLabel) =>
                            onMoveDevice({ deviceMa: d.tb.ma_thiet_bi, label: tbLabel(d.tb), toHtId, toHtLabel })}
                          devPlTargets={plTargets.filter((t) => t.plId !== (d.tb._pl ?? ""))}
                          onMoveDeviceToPl={(toPlId, toPlLabel) =>
                            onMoveDevice({ deviceMa: d.tb.ma_thiet_bi, label: tbLabel(d.tb), toPlId, toPlLabel })}
                          hover={<DeviceHoverContent d={d.tb} name={tbLabel(d.tb)} multiRole={multiRoleMap?.byMa.get(d.tb.ma_thiet_bi)} />}
                        />
                        </div>
                        {multiRoleMap?.byMa.get(d.tb.ma_thiet_bi) && (
                          <div className="pt-1.5 pr-1"><MultiRoleBadge info={multiRoleMap.byMa.get(d.tb.ma_thiet_bi)} compact side="left" /></div>
                        )}
                      </div>

                      {d.children.map((c) => (
                        <div key={c.ma_thiet_bi} id={`row-tp-${c.ma_thiet_bi}`} className="flex items-start gap-1.5">
                          <div className="min-w-0 flex-1">
                          <Disclosure
                            icon={Puzzle} label={tbLabel(c)} depth={depth + 1}
                            tone="bg-emerald-500/5" donViMa={(c.don_vi ?? "").trim() || null} chips={deviceChips(c)}
                            canManage={canManage} onEdit={() => onOpenEditor("tb", c.ma_thiet_bi)}
                            onRecord={() => onRecord("tp", c.ma_thiet_bi, tbLabel(c))}
                            onRename={(t) => onRename("tp", c.ma_thiet_bi, t)}
                            hover={<DeviceHoverContent d={c} name={tbLabel(c)} isComponent multiRole={multiRoleMap?.byMa.get(c.ma_thiet_bi)} />}
                          />
                          </div>
                          {multiRoleMap?.byMa.get(c.ma_thiet_bi) && (
                            <div className="pt-1.5 pr-1"><MultiRoleBadge info={multiRoleMap.byMa.get(c.ma_thiet_bi)} compact side="left" /></div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                  };


                  // ---- LỚP CẤU TRÚC: Thành phần hiển thị TRƯỚC danh sách tài sản ----
                  // Không bọc nhóm "Thành phần hệ thống" nữa: khi hệ thống đã mở
                  // thì các thành phần hiện thẳng ra (tên = ví dụ "Cảm biến ánh sáng nền").
                  // Bấm vào 1 thành phần → mở chi tiết: đang dùng tài sản nào (mã + serial),
                  // và có thể thay/lắp/tháo tài sản ngay tại đó.
                  // Bản đồ mã tài sản → bản ghi đầy đủ (để hover hiện thông tin tài sản).
                  const devByMa = new Map(ht.devices.map((d) => [d.tb.ma_thiet_bi, d.tb]));
                  const lookupDev = (ma: string): DbDevice | undefined => devByMa.get(ma) ?? allDevByMa?.get(ma);
                  const renderPosition = (p: ViTriChucNangTree, depth: number, siblings: ViTriChucNangTree[]) => {
                    const fullDev = p.device ? lookupDev(p.device.ma_thiet_bi) : undefined;
                    return (
                      <PositionRow
                        key={p.id}
                        p={p} depth={depth} siblings={siblings}
                        heThongId={isRealSystemId(curSysId) ? curSysId : ""}
                        fullDev={fullDev} canManage={canManage}
                        onNavigate={() => setChiTietTp({ viTri: p, heThongId: curSysId })}
                      />
                    );
                  };

                  // ---- LỚP CẤU TRÚC: Thành phần hệ thống ----
                  // Bấm vào 1 thành phần → mở chi tiết: đang dùng tài sản nào (mã + serial),
                  // và có thể thay/lắp/tháo tài sản ngay tại đó.
                  // Khi "Gom theo loại": gom các thành phần theo chủng loại đang lắp,
                  // KHÔNG lặp lại một danh sách tài sản riêng phía dưới nữa.
                  const positionsBlock = positions.length ? (
                    groupByLoai ? (() => {
                      const posMap = new Map<string, ViTriChucNangTree[]>();
                      for (const p of positions) {
                        const dev = p.device ? lookupDev(p.device.ma_thiet_bi) : undefined;
                        const k = (dev?._loaiTbTen ?? "").trim() || "— Chưa phân loại —";
                        if (!posMap.has(k)) posMap.set(k, []);
                        posMap.get(k)!.push(p);
                      }
                      const posGroups = [...posMap.entries()].sort((a, b) => a[0].localeCompare(b[0], "vi"));
                      return (
                        <div className="space-y-1">
                          {posGroups.map(([name, ps]) => {
                            const grpId = `${htId}::pos-loai::${name}`;
                            const grpOpen = open.has(grpId);
                            return (
                              <div key={grpId} className="space-y-1">
                                <Disclosure
                                  open={grpOpen} onToggle={() => toggle(grpId)}
                                  icon={Tags} label={name} subCount={ps.length} subLabel="thành phần"
                                  tone="bg-muted/30" depth={htDepth + 1}
                                />
                                {grpOpen && ps.map((p) => renderPosition(p, htDepth + 2, ps))}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })() : (
                      <div className="space-y-1">
                        {positions.map((p) => renderPosition(p, htDepth + 1, positions))}
                      </div>
                    )
                  ) : null;



                  // ---- DANH SÁCH THIẾT BỊ CHƯA LẮP VÀO THÀNH PHẦN ----
                  // Chỉ hiện những tài sản chưa gán vào thành phần nào (tránh trùng lặp).
                  const freeDevices = positions.length
                    ? ht.devices.filter((d) => !assignedMa.has(d.tb.ma_thiet_bi))
                    : ht.devices;
                  const keyOf = (d: DevNode) =>
                    groupByLoai
                      ? ((d.tb._loaiTbTen ?? "").trim() || "— Chưa phân loại —")
                      : unitMode
                        ? ((d.tb._viTriTen ?? "").trim() || "— Chưa gán vị trí —")
                        : ((d.tb._loaiTbTen ?? "").trim() || "— Chưa phân loại —");
                  const subMap = new Map<string, DevNode[]>();
                  for (const d of freeDevices) {
                    const k = keyOf(d);
                    if (!subMap.has(k)) subMap.set(k, []);
                    subMap.get(k)!.push(d);
                  }
                  const subs = [...subMap.entries()].sort((a, b) => a[0].localeCompare(b[0], "vi"));
                  const deviceList =
                    freeDevices.length === 0 ? null
                      : subs.length <= 1 ? freeDevices.map((d) => renderDevice(d, htDepth + 1))
                      : subs.map(([name, devs]) => {
                          const grpId = `${htId}::sub::${name}`;
                          const grpOpen = open.has(grpId);
                          return (
                            <div key={grpId} className="space-y-1">
                              <Disclosure
                                open={grpOpen} onToggle={() => toggle(grpId)}
                                icon={!groupByLoai && unitMode ? MapPin : Tags} label={name}
                                count={devs.reduce((n, d) => n + 1 + d.children.length, 0)}
                                subCount={devs.length} subLabel="tài sản"
                                tone="bg-muted/30" depth={htDepth + 1}
                              />
                              {grpOpen && devs.map((d) => renderDevice(d, htDepth + 2))}
                            </div>
                          );
                        });

                  return (
                    <>
                      {positionsBlock}
                      {deviceList}
                    </>
                  );
                })()}
              </div>
            );
          };

          return (
            <div key={pl.id} className="space-y-1" id={`row-pl-${pl.id}`}>
              <Disclosure
                open={plOpen} onToggle={() => toggle(`pl:${pl.id}`)} icon={unitMode ? Building2 : Boxes}
                label={unitMode ? pl.ten : plLabel(pl.id)} count={pl.count}
                subCount={unitMode ? (pl.fields[0]?.groups[0]?.systems.length || undefined) : (pl.fields.reduce((n, lv) => n + lv.groups.length, 0) || undefined)}
                subLabel={unitMode ? "hệ thống" : "nhóm"} tone={pl.tone} depth={0}
                canManage={canManage && !unitMode} onEdit={unitMode ? undefined : () => onOpenEditor("pl", pl.id)}
                onRename={unitMode ? undefined : (t) => onRename("pl", pl.id, t)}
              />

              {plOpen && unitMode && (() => {
                const sys = pl.fields[0].groups[0].systems;
                return sys.map((ht, i) => renderSystem(ht, `ht:${pl.id}:${ht.ma}`, 1, sys, i));
              })()}
              {plOpen && !unitMode && (() => {
                const nhFlat = pl.fields.flatMap((lv) => lv.groups.map((nh) => ({ lvId: lv.id, nh })));
                const reorderNh = (from: number, to: number) => {
                  const next = swapAt(nhFlat.map((x) => x.nh), from, to);
                  onReorder(next.map((g) => ({ kind: "nh", ma: g.ma })));
                };
                return nhFlat.map(({ lvId, nh }, i) => {
                  const nhId = `nh:${pl.id}:${lvId}:${nh.ma}`;
                  const nhOpen = open.has(nhId);
                  const canOrderNh = canManage && nhFlat.length > 1;
                  return (
                    <div key={nh.ma} className="space-y-1" id={`row-nh-${nh.ma}`}>
                      <Disclosure
                        open={nhOpen} onToggle={() => toggle(nhId)} icon={FolderTree}
                        label={nhLabel(nh.ma)} code={undefined} count={nh.count}
                        subCount={nh.systems.length || undefined} subLabel="hệ thống" depth={1}
                        tone={nhListTone(nh.mau) ?? "bg-violet-500/5"}
                        canManage={canManage} onEdit={() => onOpenEditor("nh", nh.ma)}
                        onRename={nh.ma !== HT_KHAC ? (t) => onRename("nh", nh.ma, t) : undefined}
                        onUp={canOrderNh && i > 0 ? () => reorderNh(i, i - 1) : undefined}
                        onDown={canOrderNh && i < nhFlat.length - 1 ? () => reorderNh(i, i + 1) : undefined}
                        onSetColor={nh.ma !== HT_KHAC ? (mau) => onSetColor(nh.ma, mau) : undefined}
                        currentColor={nh.mau}
                        plTargets={nh.ma !== HT_KHAC ? plTargets.filter((t) => t.plId !== pl.id) : undefined}
                        onMoveGroupTo={nh.ma !== HT_KHAC ? (toNhomId, toLabel) => {
                          const systemIds = nh.systems
                            .map((ht) => parseHtSysMa(ht.ma).sysName)
                            .filter((s): s is string => !!s && s !== NONE_HT);
                          if (systemIds.length) onMoveGroup({ label: nhLabel(nh.ma), count: systemIds.length, systemIds, toNhomId, toLabel });
                        } : undefined}
                      />

                      {nhOpen && nh.systems.map((ht, si) =>
                        renderSystem(ht, `ht:${pl.id}:${lvId}:${ht.ma}`, 2, nh.systems, si),
                      )}
                    </div>
                  );
                });
              })()}
            </div>

          );
        })}
      </div>
      {chiTietTp && (
        <ThanhPhanChiTietDialog
          viTri={chiTietTp.viTri}
          heThongId={chiTietTp.heThongId}
          canManage={canManage}
          onOpenDevice={(ma) => onOpenEditor("tb", ma)}
          onRecord={(ma, ten) => onRecord("tb", ma, ten)}
          onClose={() => setChiTietTp(null)}
        />
      )}
    </Card>
  );
}


/* -------------------------------- Bảng -------------------------------- */

// Cột bảng tài sản + tên cột xuất mẫu (`imp`) nay nằm ở module dùng chung
// src/lib/mirats/thiet-bi-columns.ts (nguồn sự thật, có test chốt khớp import-config).



function ColFilter({
  col, catValues, catSel, onToggleCat, onClearCat, textVal, onText,
}: {
  col: (typeof TABLE_COLS)[number];
  catValues: string[];
  catSel: Set<string>;
  onToggleCat: (v: string) => void;
  onClearCat: () => void;
  textVal: string;
  onText: (v: string) => void;
}) {
  const active = col.type === "cat" ? catSel.size > 0 : textVal.trim().length > 0;
  return (
    <div className="flex items-center gap-1">
      <span>{col.label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "rounded p-0.5 transition-colors hover:bg-muted",
              active ? "text-primary" : "text-muted-foreground/50",
            )}
            title="Lọc"
          >
            <Filter className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-0">
          {col.type === "text" ? (
            <div className="p-2">
              <Input
                autoFocus
                value={textVal}
                onChange={(e) => onText(e.target.value)}
                placeholder={`Tìm ${col.label.toLowerCase()}…`}
                className="h-8"
              />
              {textVal && (
                <button className="mt-2 text-xs text-primary hover:underline" onClick={() => onText("")}>
                  Xoá lọc
                </button>
              )}
            </div>
          ) : (
            <CatFilterBody
              label={col.label}
              catValues={catValues}
              catSel={catSel}
              onToggleCat={onToggleCat}
              onClearCat={onClearCat}
            />
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** Ô sửa nhanh tại chỗ trên bảng (chỉ hiện khi bật chế độ chỉnh sửa). */
function EditableCell({
  value, type, onSave,
}: {
  value: string;
  type: "text" | "number" | "date";
  onSave: (raw: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  useEffect(() => { setVal(value); }, [value]);



  if (!editing) {
    return (
      <button
        className="-mx-1 flex w-full min-w-[60px] items-center rounded px-1 py-0.5 text-left text-xs transition-colors hover:bg-primary/10 hover:ring-1 hover:ring-primary/30"
        title="Bấm để sửa"
        onClick={() => setEditing(true)}
      >
        <span className="truncate">{value || <span className="text-muted-foreground/40">— sửa —</span>}</span>
        <Pencil className="ml-auto h-3 w-3 shrink-0 text-primary/40" />
      </button>
    );
  }
  const commit = () => { setEditing(false); if (val !== value) onSave(val); };
  return (
    <Input
      autoFocus
      type={type === "number" ? "number" : type === "date" ? "date" : "text"}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); commit(); }
        else if (e.key === "Escape") { setVal(value); setEditing(false); }
      }}
      className="h-7 text-xs"
    />
  );
}

function CatFilterBody({
  label, catValues, catSel, onToggleCat, onClearCat,
}: {
  label: string;
  catValues: string[];
  catSel: Set<string>;
  onToggleCat: (v: string) => void;
  onClearCat: () => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return catValues;
    return catValues.filter((v) => v.toLowerCase().includes(s));
  }, [catValues, q]);
  return (
    <>
      <div className="p-2">
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Tìm ${label.toLowerCase()}…`}
          className="h-8"
          onKeyDown={(e) => e.stopPropagation()}
        />
      </div>
      <div className="flex items-center justify-between px-2 pb-1">
        <span className="text-xs text-muted-foreground">
          {catSel.size ? `${catSel.size} đã chọn` : `${filtered.length} giá trị`}
        </span>
        {catSel.size > 0 && (
          <button className="text-xs text-primary hover:underline" onClick={onClearCat}>Xoá</button>
        )}
      </div>
      <DropdownMenuSeparator />
      <div className="max-h-64 overflow-auto pb-1">
        {filtered.length === 0 && (
          <div className="px-2 py-2 text-xs text-muted-foreground">
            {catValues.length === 0 ? "Không có giá trị" : "Không khớp"}
          </div>
        )}
        {filtered.map((v) => (
          <DropdownMenuCheckboxItem
            key={v}
            checked={catSel.has(v)}
            onCheckedChange={() => onToggleCat(v)}
            onSelect={(e) => e.preventDefault()}
          >
            <span className="truncate">{v || "—"}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </div>
    </>
  );
}

function TableView({
  tree, plLabel, lvLabel, nhLabel, tbLabel, htMind, posByHt, focusTarget, canManage, onOpenEditor, onHistory, unitMode = false, onSaveCell, onBulkSave, bulkSaving = false,
}: {
  tree: PlGroup[];
  plLabel: (id: string) => string;
  lvLabel: (id: string) => string;
  nhLabel: (ma: string) => string;
  tbLabel: (t: ThietBi) => string;
  htMind: (ma: string) => string;
  posByHt?: Map<string, ViTriChucNangTree[]>;
  focusTarget: FocusTarget | null;
  canManage: boolean;
  onOpenEditor: (kind: EditKind, ma: string) => void;
  onHistory: (htMa: string) => void;
  unitMode?: boolean;
  onSaveCell: (ma: string, col: string, value: string | number | null) => void;
  onBulkSave?: (mas: string[], col: string, value: string | number | null) => void;
  bulkSaving?: boolean;
}) {
  const nav = useNavigate();
  const { data: multiRoleMap } = useMultiRoleMap();
  type Row = {
    plId: PhanLoaiId; plTen: string; lvId: LinhVucId; nhMa: string; nh: string; ht: string; htMa: string;
    tb?: ThietBi; tp?: ThietBi;
  };
  const rows = useMemo(() => {
    const out: Row[] = [];
    for (const pl of tree) for (const lv of pl.fields) for (const nh of lv.groups) for (const ht of nh.systems) {
      const base = { plId: pl.id, plTen: pl.ten, lvId: lv.id, nhMa: nh.ma, nh: nh.ten, ht: htMind(ht.ma), htMa: ht.ma };
      if (!ht.devices.length) { out.push({ ...base }); continue; }
      for (const d of ht.devices) {
        out.push({ ...base, tb: d.tb });
        for (const c of d.children) out.push({ ...base, tb: d.tb, tp: c });
      }
    }
    return out;
  }, [tree, htMind]);

  // Bản đồ: mã tài sản → tên vị trí chức năng đang lắp (để hiển thị cột "Vị trí chức năng").
  const posByDevice = useMemo(() => {
    const m = new Map<string, string>();
    if (posByHt) {
      for (const list of posByHt.values()) {
        for (const p of list) {
          if (p.device?.ma_thiet_bi) m.set(p.device.ma_thiet_bi, p.ten);
        }
      }
    }
    return m;
  }, [posByHt]);

  // Giá trị hiển thị theo cột cho từng dòng (dùng để lọc / xuất).
  const cellVal = useCallback((r: Row, key: ColKey): string => {
    const d = (r.tp ?? r.tb) as unknown as DbDevice | undefined;
    const num = (n: number | null | undefined) => (n == null ? "" : String(n));
    switch (key) {
      case "pl": return unitMode ? r.plTen : plLabel(r.plId);
      case "nh": return nhLabel(r.nhMa);
      case "ht": return r.ht;
      case "tb": return r.tb ? tbLabel(r.tb) : "";
      case "tp": return r.tp ? tbLabel(r.tp) : "";
      case "vtcn": return r.tb ? (posByDevice.get(r.tb.ma_thiet_bi) ?? "") : "";
      case "loai": return d?._loaiTbTen ?? "";
      case "tt": return d?.trang_thai ?? "";
      case "bravo": return d?._maBravo ?? "";
      case "serial": return d?.serial ?? "";
      case "pn": return d?.p_n ?? "";
      case "model": return d?.model ?? "";
      case "mau": return d?._modelTen ?? "";
      case "thanhphan": return d?._thanhPhan ?? "";
      case "nsx": return d?.nha_san_xuat ?? "";
      case "ncc": return d?.nha_cung_cap ?? "";
      case "namsx": return num(d?._namSanXuat);
      case "namkt": return num(d?._namKhaiThac);
      case "tyle": return num(d?._tyLeTuoiTho);
      case "ngaymua": return d?.ngay_mua ?? "";
      case "baohanh": return d?.han_bao_hanh ?? "";
      case "vt": return d?.vi_tri ?? "";
      case "phanloai": return d?._phanLoai ?? "";
      case "noiql": return d?._noiQuanLy ?? "";
      case "ghichu": return d?.ghi_chu ?? "";
      case "dacTinh": return "";
    }
    return "";
  }, [plLabel, nhLabel, tbLabel, unitMode, posByDevice]);

  // Ẩn/hiện cột. Khi gom theo đơn vị, ẩn sẵn cột nhóm hệ thống.
  // Lưu theo TỪNG TÀI KHOẢN: mỗi người dùng có bộ cột hiển thị riêng.
  const { user: colUser } = useSession();
  const colTableId = unitMode ? "htcay-donvi" : "htcay-hethong";
  const [visible, setVisible] = useState<Set<ColKey>>(() => {
    const validKeys = new Set(TABLE_COLS.map((c) => c.key));
    const saved = loadColumnPrefs(colTableId, colUser?.id);
    if (saved) {
      const restored = saved.filter((k): k is ColKey => validKeys.has(k as ColKey));
      if (restored.length) return new Set(restored);
    }
    return new Set(TABLE_COLS.filter((c) => c.def && !(unitMode && c.key === "nh")).map((c) => c.key));
  });
  // Khi đổi tài khoản (đăng nhập/đăng xuất), nạp lại bộ cột đã lưu của account đó.
  useEffect(() => {
    const validKeys = new Set(TABLE_COLS.map((c) => c.key));
    const saved = loadColumnPrefs(colTableId, colUser?.id);
    if (saved) {
      const restored = saved.filter((k): k is ColKey => validKeys.has(k as ColKey));
      setVisible(new Set(restored.length ? restored : TABLE_COLS.filter((c) => c.def && !(unitMode && c.key === "nh")).map((c) => c.key)));
    } else {
      setVisible(new Set(TABLE_COLS.filter((c) => c.def && !(unitMode && c.key === "nh")).map((c) => c.key)));
    }
  }, [colUser?.id, colTableId, unitMode]);
  // Ghi lại mỗi khi người dùng thay đổi bộ cột hiển thị.
  useEffect(() => {
    saveColumnPrefs(colTableId, colUser?.id, Array.from(visible));
  }, [visible, colTableId, colUser?.id]);
  // Lọc theo cột phân loại
  const [catFilters, setCatFilters] = useState<Record<string, Set<string>>>({});
  const [textFilters, setTextFilters] = useState<Record<string, string>>({});

  const catValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const c of TABLE_COLS.filter((c) => c.type === "cat")) {
      const s = new Set<string>();
      for (const r of rows) s.add(cellVal(r, c.key));
      map[c.key] = Array.from(s).filter(Boolean).sort((a, b) => a.localeCompare(b, "vi"));
    }
    return map;
  }, [rows, cellVal]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      for (const c of TABLE_COLS) {
        const v = cellVal(r, c.key);
        if (c.type === "cat") {
          const sel = catFilters[c.key];
          if (sel && sel.size > 0 && !sel.has(v)) return false;
        } else {
          const t = (textFilters[c.key] ?? "").trim().toLowerCase();
          if (t && !v.toLowerCase().includes(t)) return false;
        }
      }
      return true;
    });
  }, [rows, catFilters, textFilters, cellVal]);

  const toggleCat = (key: ColKey, v: string) => setCatFilters((prev) => {
    const next = new Set(prev[key] ?? []);
    next.has(v) ? next.delete(v) : next.add(v);
    return { ...prev, [key]: next };
  });
  const clearCat = (key: ColKey) => setCatFilters((prev) => ({ ...prev, [key]: new Set() }));
  const hasFilter = TABLE_COLS.some((c) =>
    c.type === "cat" ? (catFilters[c.key]?.size ?? 0) > 0 : (textFilters[c.key] ?? "").trim().length > 0);
  // Mặc định bảng để TRỐNG — chỉ hiển thị dữ liệu khi đã chọn/lọc.
  const display = useMemo(() => (hasFilter ? filtered : EMPTY_ROWS), [hasFilter, filtered]);

  const show = useCallback((k: ColKey) => visible.has(k), [visible]);

  /* ---------------- Chọn hàng & sửa hàng loạt (bulk edit kiểu Snipe-IT) ---------------- */
  const bulkEnabled = canManage && !!onBulkSave;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const displayMas = useMemo(() => {
    const s: string[] = [];
    for (const r of display) { const d = r.tp ?? r.tb; if (d) s.push(d.ma_thiet_bi); }
    return s;
  }, [display]);
  // Bỏ chọn những mã không còn hiển thị khi bộ lọc thay đổi.
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const vis = new Set(displayMas);
      const next = new Set([...prev].filter((m) => vis.has(m)));
      return next.size === prev.size ? prev : next;
    });
  }, [displayMas]);
  const allSelected = displayMas.length > 0 && displayMas.every((m) => selected.has(m));
  const someSelected = selected.size > 0 && !allSelected;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(displayMas));
  const toggleOne = (ma: string) => setSelected((p) => { const n = new Set(p); n.has(ma) ? n.delete(ma) : n.add(ma); return n; });

  const bulkCols = useMemo(() => TABLE_COLS.filter((c) => c.editCol), []);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkCol, setBulkCol] = useState<string>(bulkCols[0]?.key ?? "");
  const [bulkVal, setBulkVal] = useState<string>("");
  const bulkColDef = bulkCols.find((c) => c.key === bulkCol);
  const applyBulk = () => {
    if (!bulkColDef?.editCol || !onBulkSave || selected.size === 0) return;
    const val = coercePhysValue(bulkColDef.editType ?? "text", bulkVal.trim() === "" ? "" : bulkVal);
    onBulkSave([...selected], bulkColDef.editCol, val);
    setBulkOpen(false);
    setBulkVal("");
    setSelected(new Set());
  };



  // Xuất mẫu nhập liệu (.xlsx) — các THIẾT BỊ đang lọc (hoặc đang tick chọn),
  // cột theo cột đang hiển thị. Có sheet danh mục liên kết để CHỌN dropdown
  // (tránh bể format). Kèm ma_thiet_bi + dữ liệu thật → sửa rồi nạp lại = cập nhật.
  const [exporting, setExporting] = useState(false);
  const exportFiltered = useCallback(async () => {
    const impCols = TABLE_COLS.filter((c) => c.imp && show(c.key));
    const headers: string[] = [];
    const seen = new Set<string>();
    const add = (h: string) => { if (!seen.has(h)) { seen.add(h); headers.push(h); } };
    add("ma_thiet_bi"); add("ten_thiet_bi"); add("he_thong");
    for (const c of impCols) add(c.imp!);
    // Nếu có tick chọn → chỉ xuất các dòng đã chọn; ngược lại xuất theo bộ lọc.
    const source = selected.size > 0
      ? filtered.filter((r) => { const d = r.tp ?? r.tb; return d ? selected.has(d.ma_thiet_bi) : false; })
      : filtered;
    const out: string[][] = [];
    for (const r of source) {
      const d = (r.tp ?? r.tb) as unknown as DbDevice | undefined;
      if (!d) continue;
      out.push(headers.map((h) => {
        if (h === "ma_thiet_bi") return d.ma_thiet_bi;
        if (h === "ten_thiet_bi") return d.ten ?? "";
        if (h === "he_thong") return r.htMa === HT_KHAC ? "" : r.htMa;
        const col = TABLE_COLS.find((c) => c.imp === h);
        return col ? cellVal(r, col.key) : "";
      }));
    }
    if (!out.length) { toast.error("Không có tài sản nào theo bộ lọc / lựa chọn hiện tại"); return; }
    setExporting(true);
    try {
      const { exportDeviceTemplateXlsx } = await import("@/lib/mirats/export-template");
      await exportDeviceTemplateXlsx({
        headers,
        rows: out,
        fileName: `mau-nhap-lieu-thiet-bi-${new Date().toISOString().slice(0, 10)}.xlsx`,
      });
      toast.success(`Đã xuất ${out.length} tài sản · ${headers.length} cột (kèm dữ liệu để cập nhật). File có sheet ① Hướng dẫn, ② Nhập liệu (dropdown) và ③ Model (kế thừa)`);
    } catch (e) {
      toast.error("Không xuất được file: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setExporting(false);
    }
  }, [filtered, show, cellVal, selected]);


  const shownCols = TABLE_COLS.filter((c) => show(c.key));
  const firstKey = shownCols[0]?.key;
  const colCount = shownCols.length + (canManage ? 1 : 0) + (bulkEnabled ? 1 : 0);

  // Ảo hoá dòng: chỉ render các dòng đang trong khung nhìn → mượt với hàng nghìn TB.
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: display.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 41,
    overscan: 16,
  });
  const vItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const padTop = vItems.length ? vItems[0].start : 0;
  const padBottom = vItems.length ? totalSize - vItems[vItems.length - 1].end : 0;

  useEffect(() => {
    if (!focusTarget) return;
    const idx = filtered.findIndex((r) => (r.tp ?? r.tb)?.ma_thiet_bi === focusTarget.ma || r.htMa === focusTarget.ma);
    if (idx >= 0) rowVirtualizer.scrollToIndex(idx, { align: "center" });
    const id = setTimeout(() => {
      const el = document.getElementById(`trow-${focusTarget.ma}`);
      el?.classList.add("bg-amber-500/10");
      setTimeout(() => el?.classList.remove("bg-amber-500/10"), 2600);
    }, 260);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTarget, filtered]);

  // Ô giá trị bấm để lọc nhanh theo giá trị đó (kiểu hyperlink lọc của Snipe-IT).
  const FilterLink = ({ ck, value }: { ck: ColKey; value: string }) => (
    <button
      className="max-w-full truncate text-left text-blue-600 transition-colors hover:underline dark:text-blue-400"
      title={`Lọc theo: ${value}`}
      onClick={() => setCatFilters((prev) => ({ ...prev, [ck]: new Set([value]) }))}
    >
      {value}
    </button>
  );
  const stickyCol = (k: ColKey) =>
    k === firstKey ? (bulkEnabled ? "sticky left-10 z-10 bg-card" : "sticky left-0 z-10 bg-card") : "";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {hasFilter ? (
            <>
              {filtered.length.toLocaleString("vi-VN")} / {rows.length.toLocaleString("vi-VN")} dòng
              <button
                className="ml-2 text-primary hover:underline"
                onClick={() => { setCatFilters({}); setTextFilters({}); }}
              >
                Xoá tất cả lọc
              </button>
            </>
          ) : (
            <>Chọn bộ lọc ở tiêu đề cột để hiển thị dữ liệu ({rows.length.toLocaleString("vi-VN")} dòng)</>
          )}
          {canManage && (
            <span className="ml-2 hidden sm:inline text-muted-foreground/70">· Bấm vào ô có bút chì để sửa trực tiếp</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={exportFiltered} disabled={exporting}
            title="Xuất .xlsx kèm dữ liệu để cập nhật: các tài sản đang lọc (hoặc đang tick chọn), theo đúng cột đang hiển thị. Có dropdown danh mục và ma_thiet_bi để nạp lại là cập nhật đúng dòng.">
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {selected.size > 0
              ? `Xuất ${selected.size} đã chọn`
              : hasFilter
                ? `Xuất ${filtered.length.toLocaleString("vi-VN")} đang lọc`
                : "Xuất mẫu (đang lọc)"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Cột hiển thị
                <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px]">{shownCols.length}</Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[70vh] w-56 overflow-auto">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs text-muted-foreground">Chọn cột hiển thị</span>
                <div className="flex gap-2 text-xs">
                  <button className="text-primary hover:underline"
                    onClick={() => setVisible(new Set(TABLE_COLS.map((c) => c.key)))}>Tất cả</button>
                  <button className="text-primary hover:underline"
                    onClick={() => setVisible(new Set(TABLE_COLS.filter((c) => c.def).map((c) => c.key)))}>Mặc định</button>
                </div>
              </div>
              {TABLE_COL_GROUPS.map((g) => (
                <div key={g}>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground/70">{g}</DropdownMenuLabel>
                  {TABLE_COLS.filter((c) => c.group === g).map((c) => (
                    <DropdownMenuCheckboxItem
                      key={c.key}
                      checked={show(c.key)}
                      onCheckedChange={() => setVisible((prev) => {
                        const next = new Set(prev);
                        next.has(c.key) ? next.delete(c.key) : next.add(c.key);
                        return next;
                      })}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {c.key === "pl" && unitMode ? "Đơn vị" : c.label}
                      {c.editCol && <Pencil className="ml-auto h-3 w-3 text-primary/40" />}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {bulkEnabled && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
          <Badge variant="secondary" className="h-6">{selected.size} tài sản đã chọn</Badge>
          <Button size="sm" className="h-8 gap-1.5" onClick={() => { setBulkVal(""); setBulkOpen(true); }} disabled={bulkSaving}>
            {bulkSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
            Sửa hàng loạt
          </Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={() => setSelected(new Set())}>Bỏ chọn</Button>
        </div>
      )}

      <Card ref={scrollRef} className="relative max-h-[calc(100vh-15rem)] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="[&>th]:bg-card">
              {bulkEnabled && (
                <TableHead className="sticky left-0 top-0 z-30 w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Chọn tất cả"
                    disabled={displayMas.length === 0}
                  />
                </TableHead>
              )}
              {shownCols.map((c) => (
                <TableHead
                  key={c.key}
                  className={cn(
                    "sticky top-0 z-20",
                    c.key === firstKey && (bulkEnabled ? "left-10 z-30" : "left-0 z-30"),
                    c.minW,
                  )}
                >
                  <ColFilter
                    col={unitMode && c.key === "pl" ? { ...c, label: "Đơn vị" } : c}
                    catValues={catValues[c.key] ?? []}
                    catSel={catFilters[c.key] ?? new Set()}
                    onToggleCat={(v) => toggleCat(c.key, v)}
                    onClearCat={() => clearCat(c.key)}
                    textVal={textFilters[c.key] ?? ""}
                    onText={(v) => setTextFilters((p) => ({ ...p, [c.key]: v }))}
                  />
                </TableHead>
              ))}
              {canManage && <TableHead className="sticky top-0 z-20 w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!hasFilter && (
              <tr>
                <td colSpan={colCount} className="py-16 text-center text-sm text-muted-foreground">
                  Bảng đang trống — chọn bộ lọc ở tiêu đề cột để bắt đầu hiển thị dữ liệu.
                </td>
              </tr>
            )}
            {padTop > 0 && (
              <tr aria-hidden><td colSpan={colCount} style={{ height: padTop, padding: 0, border: 0 }} /></tr>
            )}
            {vItems.map((vi) => {
              const i = vi.index;
              const r = display[i];
              const dev = r.tp ?? r.tb;
              const maTb = dev?.ma_thiet_bi;
              return (
                <TableRow key={i} data-index={i} ref={rowVirtualizer.measureElement}
                  id={dev ? `trow-${dev.ma_thiet_bi}` : `trow-${r.htMa}`}
                  data-state={maTb && selected.has(maTb) ? "selected" : undefined}>
                  {bulkEnabled && (
                    <TableCell className="sticky left-0 z-10 w-10 bg-card">
                      {maTb ? (
                        <Checkbox
                          checked={selected.has(maTb)}
                          onCheckedChange={() => toggleOne(maTb)}
                          aria-label="Chọn tài sản"
                        />
                      ) : null}
                    </TableCell>
                  )}
                  {shownCols.map((c) => {
                    const sc = stickyCol(c.key);
                    // Cột cấu trúc — chỉ đọc, có tương tác điều hướng.
                    if (c.key === "pl") return <TableCell key={c.key} className={cn("text-xs text-muted-foreground", sc)}><FilterLink ck="pl" value={cellVal(r, "pl")} /></TableCell>;
                    if (c.key === "nh") return (
                      <TableCell key={c.key} className={cn("text-xs text-muted-foreground", sc)}>
                        {r.nhMa === HT_KHAC ? "" : <FilterLink ck="nh" value={nhLabel(r.nhMa)} />}
                      </TableCell>
                    );
                    if (c.key === "ht") return (
                      <TableCell key={c.key} className={cn("text-sm", sc)}>
                        <span className="inline-flex items-center gap-1.5">
                          {r.ht}
                          {r.htMa !== HT_KHAC && (
                            <button
                              className="rounded border border-border/60 p-0.5 text-muted-foreground transition-colors hover:bg-blue-600 hover:text-white"
                              title="Lý lịch hệ thống"
                              onClick={() => onHistory(r.htMa)}
                            >
                              <History className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </span>
                      </TableCell>
                    );
                    if (c.key === "tb") return (
                      <TableCell key={c.key} className={cn("text-sm", sc)}>
                        {r.tb && !r.tp ? (
                          <CenterHoverCard
                            openDelay={300}
                            closeDelay={100}
                            contentClassName="p-0"
                            trigger={
                              <span className="inline-flex items-center gap-1">
                                <button className="text-left hover:underline" onClick={() => nav({ to: "/thiet-bi/$maThietBi", params: { maThietBi: r.tb!.ma_thiet_bi } })}>
                                  {tbLabel(r.tb)}
                                </button>
                                <MultiRoleBadge info={multiRoleMap?.byMa.get(r.tb!.ma_thiet_bi)} compact />
                              </span>
                            }
                          >
                            <DeviceHoverContent d={r.tb as unknown as DbDevice} name={tbLabel(r.tb!)} multiRole={multiRoleMap?.byMa.get(r.tb!.ma_thiet_bi)} />
                          </CenterHoverCard>
                        ) : r.tp ? (
                          <span className="text-muted-foreground">{tbLabel(r.tb!)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    );
                    if (c.key === "tp") return (
                      <TableCell key={c.key} className={cn("text-sm", sc)}>
                        {r.tp ? (
                          <CenterHoverCard
                            openDelay={300}
                            closeDelay={100}
                            contentClassName="p-0"
                            trigger={
                              <span className="inline-flex items-center gap-1">
                                <button className="flex items-center gap-1 text-left hover:underline" onClick={() => nav({ to: "/thiet-bi/$maThietBi", params: { maThietBi: r.tp!.ma_thiet_bi } })}>
                                  <Puzzle className="h-3.5 w-3.5 text-emerald-600" />
                                  {tbLabel(r.tp)}
                                </button>
                                <MultiRoleBadge info={multiRoleMap?.byMa.get(r.tp!.ma_thiet_bi)} compact />
                              </span>
                            }
                          >
                            <DeviceHoverContent d={r.tp as unknown as DbDevice} name={tbLabel(r.tp!)} isComponent multiRole={multiRoleMap?.byMa.get(r.tp!.ma_thiet_bi)} />
                          </CenterHoverCard>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    );
                    if (c.key === "tt") {
                      const v = cellVal(r, "tt");
                      return (
                        <TableCell key={c.key} className={cn("text-xs", sc)}>
                          {v ? (
                            <button
                              title={`Lọc theo: ${v}`}
                              onClick={() => setCatFilters((prev) => ({ ...prev, tt: new Set([v]) }))}
                              className={cn("inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-80", statusTone(v))}
                            >
                              {v}
                            </button>
                          ) : <span className="text-muted-foreground/40">—</span>}
                        </TableCell>
                      );
                    }
                    if (c.key === "mau") {
                      const mdev = dev as unknown as DbDevice | undefined;
                      return (
                        <TableCell key={c.key} className={cn("text-sm", sc)}>
                          {mdev && mdev._modelTen ? (
                            <CenterHoverCard
                              openDelay={300}
                              closeDelay={100}
                              contentClassName="p-0"
                              trigger={
                                <button
                                  className="flex items-center gap-1.5 text-left hover:underline"
                                  onClick={() => mdev._modelId && nav({ to: "/danh-muc/model", search: { q: mdev._modelMa || mdev._modelTen } })}
                                >
                                  <Package className="h-3.5 w-3.5 shrink-0 text-primary" />
                                  <span className="truncate">{mdev._modelTen}</span>
                                </button>
                              }
                            >
                              <ModelHoverContent d={mdev} />
                            </CenterHoverCard>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                      );
                    }
                    // Cột thuộc tính tài sản.
                    const v = cellVal(r, c.key);
                    if (!dev) return <TableCell key={c.key} className={cn("text-xs text-muted-foreground/40", sc)}>—</TableCell>;
                    if (canManage && c.editCol && maTb) {
                      const editCol = c.editCol;
                      const editType = c.editType ?? "text";
                      return (
                        <TableCell key={c.key} className={cn("text-xs", sc)}>
                          <EditableCell
                            value={v}
                            type={editType}
                            onSave={(raw) => onSaveCell(maTb, editCol, coercePhysValue(editType, raw))}
                          />
                        </TableCell>
                      );
                    }
                    if (c.type === "cat" && v)
                      return <TableCell key={c.key} className={cn("text-xs", sc)}><FilterLink ck={c.key} value={v} /></TableCell>;
                    return <TableCell key={c.key} className={cn("text-xs", sc)}>{v || <span className="text-muted-foreground/40">—</span>}</TableCell>;
                  })}
                  {canManage && (
                    <TableCell>
                      {dev && (
                        <button className="rounded p-1 hover:bg-muted" title="Mở bảng biên tập đầy đủ" onClick={() => onOpenEditor("tb", dev.ma_thiet_bi)}>
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {padBottom > 0 && (
              <tr aria-hidden><td colSpan={colCount} style={{ height: padBottom, padding: 0, border: 0 }} /></tr>
            )}
          </TableBody>
        </Table>
      </Card>

      {bulkEnabled && (
        <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sửa hàng loạt {selected.size} tài sản</DialogTitle>
              <DialogDescription>
                Chọn một trường và nhập giá trị mới. Giá trị sẽ ghi đè cho tất cả tài sản đã chọn và lưu thẳng vào cơ sở dữ liệu.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div className="space-y-1.5">
                <Label className="text-xs">Trường cần sửa</Label>
                <Combobox
                  value={bulkCol}
                  onChange={(v) => { setBulkCol(v); setBulkVal(""); }}
                  placeholder="Chọn trường"
                  searchPlaceholder="Tìm trường…"
                  options={bulkCols.map((c) => ({ value: c.key, label: c.label }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Giá trị mới</Label>
                <Input
                  type={bulkColDef?.editType === "number" ? "number" : bulkColDef?.editType === "date" ? "date" : "text"}
                  value={bulkVal}
                  onChange={(e) => setBulkVal(e.target.value)}
                  placeholder="Để trống để xoá giá trị"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkOpen(false)}>Huỷ</Button>
              <Button onClick={applyBulk} disabled={!bulkColDef || bulkSaving}>
                {bulkSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Áp dụng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>

  );
}


/* --------------------------- Sidebar biên tập --------------------------- */

/** Ô chọn khoá ngoại (Model / Nhà sản xuất / Nhà cung cấp) — lưu id, hiển thị tên. */
function PhysRefField({
  refTable, value, onChange, allowQuickAdd,
}: { refTable: string; value: string; onChange: (v: string) => void; allowQuickAdd?: boolean }) {
  const [quickAdd, setQuickAdd] = useState(false);
  const canQuickAdd = allowQuickAdd && refTable === "dm_model";
  return (
    <>
      <ReferenceCell
        refTable={refTable}
        value={value}
        onChange={onChange}
        after={canQuickAdd ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0"
            title="Khai nhanh model mới"
            onClick={() => setQuickAdd(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        ) : null}
      />
      {canQuickAdd && (
        <QuickAddModelDialog
          open={quickAdd}
          onOpenChange={setQuickAdd}
          onCreated={(id) => onChange(id)}
        />
      )}
    </>
  );
}


/** Tạo mã danh mục từ tên (bỏ dấu, viết hoa, thay ký tự đặc biệt). */
function slugMa(name: string): string {
  const s = name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d")
    .toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return s.slice(0, 40) || "MODEL_" + Date.now().toString(36).toUpperCase();
}

/**
 * Hộp thoại khai nhanh MẪU THIẾT BỊ (dm_model) ngay trong ô chọn mẫu.
 * Lưu thẳng vào CSDL và tự chọn mẫu vừa tạo.
 */
function QuickAddModelDialog({
  open, onOpenChange, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [ten, setTen] = useState("");
  const [pn, setPn] = useState("");
  const [loaiId, setLoaiId] = useState("");
  const [nsxId, setNsxId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setTen(""); setPn(""); setLoaiId(""); setNsxId(""); }
  }, [open]);

  const save = async () => {
    const name = ten.trim();
    if (!name) { toast.error("Vui lòng nhập tên model."); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("dm_model")
        .insert({
          ma: slugMa(pn.trim() || name),
          ten: name,
          p_n: pn.trim() || null,
          loai_thiet_bi_id: loaiId || null,
          nha_san_xuat_id: nsxId || null,
          active: true,
        })
        .select("id")
        .single();
      if (error) throw error;
      const id = (data as { id: string }).id;
      await qc.invalidateQueries({ queryKey: ["ref_id_options", "dm_model"] });
      toast.success(`Đã tạo mẫu "${name}" và chọn vào tài sản.`);
      onCreated(id);
      onOpenChange(false);
    } catch (e) {
      toast.error("Không tạo được mẫu: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Khai nhanh model</DialogTitle>
          <DialogDescription>
            Tạo mẫu mới và tự động gắn cho tài sản đang sửa. Có thể bổ sung chi tiết sau ở mục Model.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="qam-ten">Tên mẫu <span className="text-destructive">*</span></Label>
            <Input id="qam-ten" value={ten} onChange={(e) => setTen(e.target.value)} placeholder="VD: Cảm biến gió WS-201" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qam-pn">P/N</Label>
            <Input id="qam-pn" value={pn} onChange={(e) => setPn(e.target.value)} placeholder="Mã P/N (không bắt buộc)" />
          </div>
          <div className="space-y-1.5">
            <Label>Chủng loại</Label>
            <PhysRefField refTable="dm_loai_thiet_bi" value={loaiId} onChange={setLoaiId} />
          </div>
          <div className="space-y-1.5">
            <Label>Nhà sản xuất</Label>
            <PhysRefField refTable="dm_nha_san_xuat" value={nsxId} onChange={setNsxId} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Huỷ</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
            Tạo &amp; chọn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



function NodeEditorSheet({
  target, onClose, overrides, plLabel, lvLabel, nhLabel, htLabel, tbMap,
  viTriList, trangThaiList, saving, onSave, canManage,
  groupsOfPl, childrenOf, onAddGroup, addingGroup, onAddSystem, addingSystem, onAddDevice, addingDevice, plIdOfNh, donViList, onDelete, unitCodeOf,
  isCustomNode, isRealNode, onRenameGroupCode, renamingGroupCode,
}: {
  target: { kind: EditKind; ma: string } | null;
  onClose: () => void;
  overrides: OverrideMap | undefined;
  plLabel: (id: string) => string;
  lvLabel: (id: string) => string;
  nhLabel: (ma: string) => string;
  htLabel: (ma: string) => string;
  tbMap: Map<string, ThietBi>;
  gpLabelFor: (htMa: string) => string;
  viTriList: Array<{ id: string; ma: string; ten: string; mo_ta: string }>;
  trangThaiList: string[];
  saving: boolean;
  onSave: (payload: { kind: EditKind; ma: string; ten: string; du_lieu?: Record<string, unknown>; phys?: Record<string, string | number | null> }) => void;
  
  canManage: boolean;
  groupsOfPl: (plId: string) => Array<{ ma: string; ten: string; count: number }>;
  childrenOf: (kind: EditKind, ma: string) => { childLabel: string; unit: string; items: Array<{ ma: string; ten: string; count: number }> };
  onAddGroup: (plId: string, ten: string, ma?: string) => void;
  addingGroup: boolean;
  onAddSystem: (nhMa: string, plId: string, ten: string, donViId: string) => void;
  addingSystem: boolean;
  onAddDevice: (heThongId: string, ten: string, ma?: string) => void;
  addingDevice: boolean;
  plIdOfNh: (ma: string) => string;
  donViList: Array<{ id: string; ma: string; ten: string; mo_ta: string }>;
  onDelete: (kind: EditKind, ma: string, ten: string, label: string) => void;
  unitCodeOf: (kind: EditKind, ma: string) => string | null;
  isCustomNode: (kind: EditKind, ma: string) => boolean;
  isRealNode: (kind: EditKind, ma: string) => boolean;
  onRenameGroupCode: (oldMa: string, newMa: string) => void;
  renamingGroupCode: boolean;

}) {
  const [newGroupTen, setNewGroupTen] = useState("");
  const [newGroupMa, setNewGroupMa] = useState("");
  const [newGroupMaTouched, setNewGroupMaTouched] = useState(false);
  const [newSystemTen, setNewSystemTen] = useState("");
  const [newSystemDonViId, setNewSystemDonViId] = useState("");

  const [newDeviceTen, setNewDeviceTen] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [ten, setTen] = useState("");
  const [tenMindmap, setTenMindmap] = useState("");
  // Giá trị các CỘT VẬT LÝ (ghi thẳng vào bảng gốc theo layer).
  const [physVals, setPhysVals] = useState<Record<string, string>>({});

  const tb = target?.kind === "tb" ? tbMap.get(target.ma) : undefined;

  // Cấu hình cột vật lý theo layer hiện tại (tb → thiet_bi, ht → dm_he_thong).
  const physCfg = target ? PHYS_TABLE_BY_LAYER[target.kind] : undefined;

  // Lấy nguyên bản ghi gốc để prefill toàn bộ cột vật lý (không chỉ vài cột đã map).
  const { data: physRow } = useQuery({
    queryKey: ["node_phys_row", target?.kind, target?.ma],
    enabled: !!target && !!physCfg,
    queryFn: async () => {
      const cfg = physCfg!;
      const { data, error } = await supabase
        .from(cfg.table as never)
        .select("*")
        .eq(cfg.keyCol, physKeyValue(target!.kind, target!.ma))
        .maybeSingle();
      if (error) throw error;
      return (data ?? {}) as Record<string, unknown>;
    },
  });

  // Đổ dữ liệu gốc vào form khi bản ghi tải xong.
  useEffect(() => {
    if (!physCfg) { setPhysVals({}); return; }
    const row = physRow ?? {};
    const next: Record<string, string> = {};
    for (const g of physCfg.groups) for (const c of g.cols) {
      const v = row[c.key];
      next[c.key] = v === null || v === undefined ? "" : String(v);
    }
    setPhysVals(next);
  }, [physRow, physCfg]);

  const setPhys = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setPhysVals((s) => ({ ...s, [k]: e.target.value }));

  // Model đang gắn cho tài sản này (chỉ ở layer "tb").
  const selModelId = target?.kind === "tb" ? (physVals["model_id"] ?? "").trim() : "";
  const { data: selModel } = useQuery({
    queryKey: ["node_model_info", selModelId],
    enabled: !!selModelId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dm_model")
        .select("id, ma, ten, p_n, mo_ta, hinh_anh, dm_loai_thiet_bi(ten), dm_nha_san_xuat(ten)")
        .eq("id", selModelId)
        .maybeSingle();
      if (error) throw error;
      return data as {
        id: string; ma: string | null; ten: string | null; p_n: string | null;
        mo_ta: string | null; hinh_anh: string | null;
        dm_loai_thiet_bi: { ten: string | null } | null;
        dm_nha_san_xuat: { ten: string | null } | null;
      } | null;
    },
  });
  const { data: selModelImg } = useQuery({
    queryKey: ["node_model_img", selModel?.hinh_anh],
    enabled: !!selModel?.hinh_anh,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await storage.from("model-anh").createSignedUrl(selModel!.hinh_anh as string, 315360000);
      return data?.signedUrl ?? null;
    },
  });
  const inheritLabel = (key: string): string => {
    if (key === "loai_thiet_bi_id") return selModel?.dm_loai_thiet_bi?.ten ?? "";
    if (key === "nha_san_xuat_id") return selModel?.dm_nha_san_xuat?.ten ?? "";
    return "";
  };







  // Danh sách nhóm hệ thống bên trong phân loại đang sửa.
  const plGroups = target?.kind === "pl" ? groupsOfPl(target.ma) : [];
  // Lớp con trực tiếp (chỉ hiển thị cho các cấp có con: pl → nh → ht).
  const childInfo = target && (target.kind === "pl" || target.kind === "nh" || target.kind === "ht")
    ? childrenOf(target.kind, target.ma)
    : { childLabel: "", unit: "", items: [] as Array<{ ma: string; ten: string; count: number }> };
  useEffect(() => { setNewGroupTen(""); setNewSystemTen(""); setNewDeviceTen(""); setGroupCode(target?.kind === "nh" ? target.ma : ""); }, [target?.ma, target?.kind]);

  useEffect(() => {
    if (!target) return;
    const ov = overrides?.get(okey(target.kind, target.ma));
    const baseTen =
      target.kind === "pl" ? plLabel(target.ma)
      : target.kind === "lv" ? lvLabel(target.ma)
      : target.kind === "nh" ? nhLabel(target.ma)
      : target.kind === "ht" ? htLabel(target.ma)
      : tbMap.get(target.ma)?.ten ?? "";
    setTen(ov?.ten ?? baseTen);
    const d = (ov?.du_lieu ?? {}) as Record<string, unknown>;
    setTenMindmap(typeof d.ten_mindmap === "string" ? d.ten_mindmap : "");
  }, [target, overrides, plLabel, lvLabel, nhLabel, htLabel, tbMap]);


  const title =
    target?.kind === "pl" ? "Sửa phân loại hệ thống"
    : target?.kind === "lv" ? "Sửa lĩnh vực"
    : target?.kind === "nh" ? "Sửa nhóm hệ thống"
    : target?.kind === "ht" ? "Sửa hệ thống"
    : "Sửa tài sản";

  const submit = () => {
    if (!target) return;
    // Mọi trường nội dung nay ghi THẲNG vào cột thật của bảng gốc (physSection).
    // du_lieu chỉ còn giữ tên hiển thị trên sơ đồ cho node nháp/tuỳ chỉnh.
    const du_lieu: Record<string, unknown> = { ten_mindmap: tenMindmap.trim() || undefined };
    let phys: Record<string, string | number | null> | undefined;
    // Cột vật lý theo layer → ghi thẳng vào bảng gốc (trừ key & cột hệ thống).
    if (physCfg) {
      phys = {};
      const hasModelNow = target.kind === "tb" && !!(physVals["model_id"] ?? "").trim();
      const ctx = { layer: target.kind, hasModel: hasModelNow };
      for (const grp of physCfg.groups) for (const c of grp.cols) {
        // Khi đã gắn mẫu: KHÔNG ghi đè trường kế thừa (chủng loại, NSX…) —
        // để trigger tự điền theo mẫu, tránh lệch dữ liệu.
        if (!isFieldEditable(c, ctx)) continue;
        phys[c.key] = coercePhysValue(c.type, physVals[c.key] ?? "");
      }
    }
    onSave({ kind: target.kind, ma: target.ma, ten, du_lieu, phys });
  };




  // Render toàn bộ CỘT VẬT LÝ theo layer (trừ key & cột hệ thống) — chỉnh sửa trực tiếp.
  const isTb = target?.kind === "tb";
  const hasModel = isTb && !!selModelId;
  const physSection = physCfg ? (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">
        Các trường dưới đây là <b>cột vật lý</b> — lưu thẳng vào bảng <code>{physCfg.table}</code>. Khoá định danh không sửa được tại đây.
      </p>
      {physCfg.groups.map((grp) => (
        <div key={grp.title} className="space-y-3 rounded-md border p-3">
          <div className="text-sm font-medium">
            {grp.title}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {grp.cols.map((c) => {
              // Trường "chọn model": khối riêng, kèm thẻ thông tin kế thừa.
              if (c.modelPicker) {
                return (
                  <div key={c.key} className="col-span-2 space-y-2">
                    <Label htmlFor={`phys-${c.key}`}>{c.label}</Label>
                    <PhysRefField
                      refTable={c.refTable!}
                      value={physVals[c.key] ?? ""}
                      onChange={(v) => setPhysVals((s) => ({ ...s, [c.key]: v }))}
                      allowQuickAdd
                    />
                    {hasModel ? (
                      selModel ? (
                        <div className="flex gap-3 rounded-md border border-primary/25 bg-primary/5 p-2.5">
                          {selModelImg ? (
                            <img src={selModelImg} alt={selModel.ten ?? ""} className="h-16 w-16 shrink-0 rounded object-contain" loading="lazy" />
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-muted"><Package className="h-6 w-6 text-muted-foreground" /></div>
                          )}
                          <div className="min-w-0 flex-1 space-y-0.5 text-xs">
                            {selModel.p_n && <div className="text-muted-foreground">P/N: {selModel.p_n}</div>}
                            {selModel.dm_loai_thiet_bi?.ten && <div className="text-muted-foreground">Loại: {selModel.dm_loai_thiet_bi.ten}</div>}
                            {selModel.dm_nha_san_xuat?.ten && <div className="text-muted-foreground">NSX: {selModel.dm_nha_san_xuat.ten}</div>}
                            {canManage && (
                              <Link
                                to="/danh-muc/model"
                                search={{ edit: selModel.id }}
                                className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                              >
                                <Pencil className="h-3 w-3" /> Sửa mẫu này
                              </Link>
                            )}
                          </div>

                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground">Đang tải thông tin mẫu…</div>
                      )
                    ) : null}
                  </div>
                );
              }
              // Trường kế thừa từ mẫu: khi đã gắn mẫu → chỉ hiển thị (read-only)
              // kèm badge và link "Sửa ở Danh mục › Model". Không render input để
              // tránh nhầm nhập tay — nguồn thật là dm_model.
              if (c.inheritedFromModel && hasModel) {
                return (
                  <div key={c.key} className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Label>{c.label}</Label>
                      <Badge
                        variant="outline"
                        className="border-primary/30 bg-primary/5 px-1.5 py-0 text-[10px] font-normal text-primary"
                      >
                        Kế thừa từ Model
                      </Badge>
                    </div>
                    <div className="rounded-md border bg-muted/40 px-2.5 py-1.5 text-sm">
                      {inheritLabel(c.key) || <span className="text-muted-foreground">— theo mẫu —</span>}
                    </div>
                    {selModel?.id && canManage && (
                      <Link
                        to="/danh-muc/model"
                        search={{ edit: selModel.id }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                      >
                        <Pencil className="h-3 w-3" /> Sửa ở Danh mục › Model
                      </Link>
                    )}
                  </div>
                );
              }
              return (
                <div key={c.key} className={c.type === "textarea" ? "col-span-2 space-y-1.5" : "space-y-1.5"}>
                  <Label htmlFor={`phys-${c.key}`}>{c.label}</Label>
                  {c.type === "reference" && c.refTable ? (
                    <>
                      <PhysRefField
                        refTable={c.refTable}
                        value={physVals[c.key] ?? ""}
                        onChange={(v) => setPhysVals((s) => ({ ...s, [c.key]: v }))}
                      />
                      {c.key === "vi_tri_id" && !(physVals[c.key] ?? "").trim() &&
                        typeof physRow?.vi_tri === "string" && physRow.vi_tri.trim() && (
                        <p className="text-[11px] text-amber-600">
                          Vị trí cũ (chưa liên kết danh mục): <b>{physRow.vi_tri}</b> — hãy chọn vị trí tương ứng ở trên để liên kết.
                        </p>
                      )}
                    </>
                  ) : c.type === "textarea" ? (

                    <Textarea id={`phys-${c.key}`} rows={2} value={physVals[c.key] ?? ""} onChange={setPhys(c.key)} placeholder={c.placeholder} />
                  ) : (
                    <Input
                      id={`phys-${c.key}`}
                      type={c.type === "date" ? "date" : c.type === "number" ? "number" : "text"}
                      value={physVals[c.key] ?? ""}
                      onChange={setPhys(c.key)}
                      placeholder={c.placeholder}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  ) : null;



  return (
    <Sheet open={!!target} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span>{title}</span>
            {target && unitCodeOf(target.kind, target.ma) && (
              <Badge
                variant="outline"
                className="shrink-0 border-primary/30 bg-primary/10 font-mono text-[11px] font-semibold text-primary"
                title={`Đơn vị: ${unitCodeOf(target.kind, target.ma)}`}
              >
                {unitCodeOf(target.kind, target.ma)}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {canManage ? "Thay đổi được lưu vào cơ sở dữ liệu." : "Chế độ xem (chỉ đọc). Bật “Chỉnh sửa” để thay đổi."}
          </SheetDescription>
        </SheetHeader>

        <fieldset disabled={!canManage} className="flex-1 space-y-4 overflow-y-auto min-w-0 m-0 border-0 px-0 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-ten">Tên đầy đủ</Label>
            <Input id="edit-ten" value={ten} onChange={(e) => setTen(e.target.value)} />
          </div>

          {target?.kind === "nh" && canManage && target.ma !== HT_KHAC && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-group-ma" className="text-xs">Mã nhóm hệ thống</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-group-ma"
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                  className="font-mono text-xs uppercase"
                  placeholder="MÃ NHÓM"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && groupCode.trim() && slugMa(groupCode) !== target.ma) {
                      onRenameGroupCode(target.ma, groupCode.trim());
                    }
                  }}
                />
                <Button
                  size="sm" variant="outline"
                  disabled={renamingGroupCode || !groupCode.trim() || slugMa(groupCode) === target.ma}
                  onClick={() => { if (groupCode.trim() && slugMa(groupCode) !== target.ma) onRenameGroupCode(target.ma, groupCode.trim()); }}
                >
                  {renamingGroupCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đổi mã"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Mã sẽ chuẩn hoá dạng chữ HOA/số/gạch dưới. Trùng mã sẽ bị cảnh báo và không đổi được
                {isCustomNode("nh", target.ma) ? " — hệ thống con trong nhóm sẽ được cập nhật theo." : "."}
              </p>
            </div>
          )}





          {target?.kind === "ht" && physSection}


          {target?.kind === "tb" && (
            <>
              {tb?.thiet_bi_cha && (
                <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                  Thuộc tài sản: {tb.thiet_bi_cha}
                </div>
              )}
              {physSection}
            </>
          )}





          {/* Node THẬT dùng đúng tên trong CSDL để đồng nhất giao diện · hiển thị ·
              CSDL. Chỉ node nháp/tuỳ chỉnh mới cho đặt tên hiển thị riêng. */}
          {target && !isRealNode(target.kind, target.ma) && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-ten-mm">Tên hiển thị trên sơ đồ</Label>
              <Input id="edit-ten-mm" value={tenMindmap} onChange={(e) => setTenMindmap(e.target.value)}
                placeholder={ten.trim() ? `Để trống = "${ten.trim()}"` : "Để trống sẽ dùng tên đầy đủ"} />
              <p className="text-xs text-muted-foreground">Tên ngắn hiển thị trên sơ đồ tư duy.</p>
            </div>
          )}




          {target?.kind === "pl" && (
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <FolderTree className="h-4 w-4 text-violet-600" /> Nhóm hệ thống bên trong
                <Badge variant="outline" className="ml-auto">{plGroups.length}</Badge>
              </div>
              {plGroups.length === 0 ? (
                <p className="text-xs text-muted-foreground">Chưa có nhóm hệ thống nào trong phân loại này.</p>
              ) : (
                <ul className="space-y-1">
                  {plGroups.map((g) => (
                    <li key={g.ma} className="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5 text-sm">
                      <FolderTree className="h-3.5 w-3.5 shrink-0 text-violet-600" />
                      <span className="truncate">{g.ten}</span>
                      <Badge variant="secondary" className="ml-auto text-[11px]">{g.count.toLocaleString("vi-VN")} tài sản</Badge>
                    </li>
                  ))}
                </ul>
              )}
              {canManage && (
                <div className="space-y-2 border-t pt-3">
                  <Label htmlFor="new-group" className="text-xs">Khai thêm nhóm hệ thống</Label>
                  <Input
                    id="new-group" value={newGroupTen}
                    onChange={(e) => setNewGroupTen(e.target.value)}
                    placeholder="Tên nhóm — VD: Ra-đa cảnh giới…"
                  />
                  <div className="flex gap-2">
                    <Input
                      id="new-group-ma"
                      value={newGroupMaTouched ? newGroupMa : slugMa(newGroupMa || newGroupTen)}
                      onChange={(e) => { setNewGroupMaTouched(true); setNewGroupMa(e.target.value.toUpperCase()); }}
                      placeholder="MÃ NHÓM"
                      className="font-mono text-xs uppercase"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newGroupTen.trim() && target) {
                          const ma = newGroupMaTouched ? newGroupMa.trim() : "";
                          onAddGroup(target.ma, newGroupTen.trim(), ma);
                          setNewGroupTen(""); setNewGroupMa(""); setNewGroupMaTouched(false);
                        }
                      }}
                    />
                    <Button
                      size="sm" disabled={addingGroup || !newGroupTen.trim()}
                      onClick={() => {
                        if (target && newGroupTen.trim()) {
                          const ma = newGroupMaTouched ? newGroupMa.trim() : "";
                          onAddGroup(target.ma, newGroupTen.trim(), ma);
                          setNewGroupTen(""); setNewGroupMa(""); setNewGroupMaTouched(false);
                        }
                      }}
                    >
                      {addingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Mã tự tạo ngắn gọn từ tên — có thể sửa lại. Trùng mã sẽ bị cảnh báo và không tạo được.
                  </p>
                </div>
              )}
            </div>
          )}

          {target?.kind === "nh" && (
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Network className="h-4 w-4 text-primary" />
                {childInfo.childLabel} bên trong
                <Badge variant="outline" className="ml-auto">{childInfo.items.length}</Badge>
              </div>
              {childInfo.items.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Chưa có {childInfo.childLabel.toLowerCase()} nào bên trong nhóm hệ thống này.
                </p>
              ) : (
                <ul className="space-y-1">
                  {childInfo.items.map((c) => (
                    <li key={c.ma} className="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5 text-sm">
                      <Network className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">{c.ten}</span>
                      {c.count > 0 && (
                        <Badge variant="secondary" className="ml-auto shrink-0 text-[11px]">
                          {c.count.toLocaleString("vi-VN")} {childInfo.unit}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {canManage && target.ma !== HT_KHAC && (
                <div className="space-y-2 border-t pt-3">
                  <Label htmlFor="new-system" className="text-xs">Khai thêm hệ thống vào nhóm này</Label>
                  <Select value={newSystemDonViId} onValueChange={setNewSystemDonViId}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Chọn đơn vị quản lý…" />
                    </SelectTrigger>
                    <SelectContent>
                      {donViList.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.ma}{d.ten ? ` — ${d.ten}` : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      id="new-system" value={newSystemTen} onChange={(e) => setNewSystemTen(e.target.value)}
                      placeholder="VD: Đài VHF Sơn Trà…"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newSystemTen.trim() && newSystemDonViId && target) {
                          onAddSystem(target.ma, plIdOfNh(target.ma), newSystemTen.trim(), newSystemDonViId); setNewSystemTen("");
                        }
                      }}
                    />
                    <Button
                      size="sm" disabled={addingSystem || !newSystemTen.trim() || !newSystemDonViId}
                      onClick={() => { if (target && newSystemTen.trim() && newSystemDonViId) { onAddSystem(target.ma, plIdOfNh(target.ma), newSystemTen.trim(), newSystemDonViId); setNewSystemTen(""); } }}
                    >
                      {addingSystem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Hệ thống mới rỗng — sau đó khai <b>thành phần</b> bên trong và lắp tài sản vào.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* Hệ thống: khai THÀNH PHẦN (ổ cắm chức năng) ngay trong sidebar.
              NodeEditorSheet dùng chung cho cả 3 giao diện (cây / bảng / sơ đồ tư
              duy) nên khối này đồng bộ hoá cách khai thành phần ở mọi chế độ xem. */}
          {target?.kind === "ht" && (
            isCustomNode("ht", target.ma) ? (
              <div className="rounded-md border border-dashed p-3 text-[11px] text-muted-foreground">
                Hệ thống này mới khai thêm, chưa lưu vào CSDL — hãy “Lưu thay đổi” trước khi khai báo thành phần bên trong.
              </div>
            ) : (
              <div className="space-y-2 rounded-md border p-3">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Cpu className="h-4 w-4 text-sky-600" /> Thành phần hệ thống
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Thành phần là “ổ cắm chức năng” (VD: “Cảm biến gió”, “Đầu cuối AMHS”).
                  Tài sản cụ thể được lắp vào thành phần và ghi lịch sử khi thay/tráo.
                </p>
                <ThanhPhanManager heThongId={physKeyValue("ht", target.ma)} canManage={canManage} />
              </div>
            )
          )}


          {/* Khai trường dữ liệu — đặt ở đáy sidebar */}
          {target?.kind === "ht" && (
            <HeThongTruongEditor heThongId={target.ma} canManage={canManage} scope="he_thong" />
          )}
          {target?.kind === "tb" && (
            <HeThongTruongEditor heThongId={target.ma} canManage={canManage} scope="thiet_bi" />
          )}
        </fieldset>



        <div className="space-y-2 border-t pt-3">
          {canManage && (
            <Button className="w-full" onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />} Lưu thay đổi
            </Button>
          )}
          {target && (target.kind === "nh" || target.kind === "ht") && canManage && target.ma !== HT_KHAC && (
            <Button
              variant="outline"
              className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(
                target.kind, target.ma,
                target.kind === "nh" ? nhLabel(target.ma) : htLabel(target.ma),
                target.kind === "nh" ? "nhóm hệ thống" : "hệ thống",
              )}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Xoá {target.kind === "nh" ? "nhóm hệ thống" : "hệ thống"} này
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* --------------------------- Lý lịch hệ thống --------------------------- */

const HISTORY_META: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }>; tone: string; badge: string }> = {
  bao_tri: { label: "Bảo dưỡng", Icon: Wrench, tone: "text-sky-600", badge: "border-sky-500/30 bg-sky-500/10 text-sky-600" },
  su_co: { label: "Sự cố", Icon: AlertTriangle, tone: "text-red-600", badge: "border-red-500/30 bg-red-500/10 text-red-600" },
  hong_hoc_thay_the: { label: "Thay thế", Icon: Package, tone: "text-orange-600", badge: "border-orange-500/30 bg-orange-500/10 text-orange-600" },
  ban_giao: { label: "Bàn giao", Icon: Users, tone: "text-violet-600", badge: "border-violet-500/30 bg-violet-500/10 text-violet-600" },
  giay_phep: { label: "Giấy phép", Icon: FileText, tone: "text-emerald-600", badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" },
};
const HISTORY_TABS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "bao_tri", label: "Bảo dưỡng" },
  { value: "su_co", label: "Sự cố" },
  { value: "hong_hoc_thay_the", label: "Thay thế" },
  { value: "ban_giao", label: "Bàn giao" },
];

function SystemHistorySheet({
  group, suKien, tbMap, tbName, onClose,
}: {
  group: HtGroup | null;
  suKien: SuKienThietBi[];
  tbMap: Map<string, ThietBi>;
  tbName: (t: ThietBi) => string;
  onClose: () => void;
}) {
  const nav = useNavigate();
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => { setFilter("all"); }, [group?.ma]);

  const deviceIds = useMemo(() => {
    const s = new Set<string>();
    if (group) for (const d of group.devices) { s.add(d.tb.ma_thiet_bi); for (const c of d.children) s.add(c.ma_thiet_bi); }
    return s;
  }, [group]);

  const events = useMemo(
    () => suKien.filter((e) => deviceIds.has(e.thiet_bi)).sort((a, b) => (b.ngay ?? "").localeCompare(a.ngay ?? "")),
    [suKien, deviceIds],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of events) c[e.nguon] = (c[e.nguon] ?? 0) + 1;
    return c;
  }, [events]);

  const deviceCount = group ? group.devices.reduce((n, d) => n + 1 + d.children.length, 0) : 0;
  const shown = filter === "all" ? events : events.filter((e) => e.nguon === filter);

  const deviceName = (ma: string) => { const t = tbMap.get(ma); return t ? tbName(t) : ma; };

  return (
    <Sheet open={!!group} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-blue-600" /> Lý lịch hệ thống
          </SheetTitle>
          <SheetDescription>
            {group ? (
              <span>{group.ten} · {deviceCount.toLocaleString("vi-VN")} tài sản · {events.length.toLocaleString("vi-VN")} sự kiện</span>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        {group && (() => {
          const sysId = parseHtSysMa(group.ma).sysName;
          if (!sysId || sysId === NONE_HT) return null;
          return (
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => { onClose(); nav({ to: "/he-thong/$id", params: { id: sysId } }); }}
              >
                <BookMarked className="h-4 w-4" /> Mở sổ lý lịch hệ thống
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                title="Mở sổ lý lịch ở tab mới"
                onClick={() => window.open(`/he-thong/${encodeURIComponent(sysId)}`, "_blank", "noopener")}
              >
                <ExternalLink className="h-4 w-4" /> Tab mới
              </Button>
            </div>
          );
        })()}


        {/* Tóm tắt theo loại */}
        <div className="grid grid-cols-2 gap-2 py-3 sm:grid-cols-4">
          {(["bao_tri", "su_co", "hong_hoc_thay_the", "ban_giao"] as const).map((k) => {
            const m = HISTORY_META[k];
            const Icon = m.Icon;
            return (
              <div key={k} className="rounded-md border p-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Icon className={cn("h-3.5 w-3.5", m.tone)} /> {m.label}
                </div>
                <div className="mt-0.5 text-lg font-semibold">{(counts[k] ?? 0).toLocaleString("vi-VN")}</div>
              </div>
            );
          })}
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="flex h-auto flex-wrap">
            {HISTORY_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="text-xs">
                {t.label}
                {t.value !== "all" && counts[t.value] ? ` (${counts[t.value]})` : ""}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-3 flex-1 overflow-y-auto">
          {shown.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <ClipboardList className="h-8 w-8 opacity-40" />
              Chưa có sự kiện nào cho hệ thống này.
            </div>
          ) : (
            <ol className="relative space-y-3 border-l pl-5">
              {shown.map((e) => {
                const m = HISTORY_META[e.nguon] ?? { label: e.loai_su_kien, Icon: FileText, tone: "text-muted-foreground", badge: "border-border bg-muted text-muted-foreground" };
                const Icon = m.Icon;
                return (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[26px] flex h-5 w-5 items-center justify-center rounded-full border bg-background">
                      <Icon className={cn("h-3 w-3", m.tone)} />
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded border px-1.5 py-0.5 text-[10px]", m.badge)}>{m.label}</span>
                      <span className="text-xs text-muted-foreground">{e.ngay}</span>
                    </div>
                    <div className="mt-0.5 text-sm font-medium">{e.tieu_de}</div>
                    {e.mo_ta && <div className="text-xs text-muted-foreground">{e.mo_ta}</div>}
                    <button
                      className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      onClick={() => { onClose(); nav({ to: "/thiet-bi/$maThietBi", params: { maThietBi: e.thiet_bi } }); }}
                    >
                      <Cpu className="h-3 w-3" />
                      <span className="font-mono opacity-70">{e.thiet_bi}</span> {deviceName(e.thiet_bi)}
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}


/* ------------------------- Lý lịch tài sản ------------------------- */

function DeviceHistorySheet({
  target, suKien, onClose,
}: {
  target: { kind: "tb" | "tp"; ma: string; ten: string } | null;
  suKien: SuKienThietBi[];
  onClose: () => void;
}) {
  const nav = useNavigate();
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => { setFilter("all"); }, [target?.ma]);

  const events = useMemo(
    () => (target ? suKien.filter((e) => e.thiet_bi === target.ma).sort((a, b) => (b.ngay ?? "").localeCompare(a.ngay ?? "")) : []),
    [suKien, target],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of events) c[e.nguon] = (c[e.nguon] ?? 0) + 1;
    return c;
  }, [events]);

  const shown = filter === "all" ? events : events.filter((e) => e.nguon === filter);

  return (
    <Sheet open={!!target} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-blue-600" /> Lý lịch {target?.kind === "tp" ? "thành phần" : "tài sản"}
          </SheetTitle>
          <SheetDescription>
            {target ? (
              <span><span className="font-mono opacity-70">{target.ma}</span> · {target.ten} · {events.length.toLocaleString("vi-VN")} sự kiện</span>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        {target && (
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => { onClose(); nav({ to: "/thiet-bi/$maThietBi", params: { maThietBi: target.ma } }); }}
            >
              <BookMarked className="h-4 w-4" /> Mở sổ lý lịch tài sản
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              title="Mở sổ lý lịch ở tab mới"
              onClick={() => window.open(`/thiet-bi/${encodeURIComponent(target.ma)}`, "_blank", "noopener")}
            >
              <ExternalLink className="h-4 w-4" /> Tab mới
            </Button>
          </div>
        )}


        {/* Tóm tắt theo loại */}
        <div className="grid grid-cols-2 gap-2 py-3 sm:grid-cols-4">
          {(["bao_tri", "su_co", "hong_hoc_thay_the", "ban_giao"] as const).map((k) => {
            const m = HISTORY_META[k];
            const Icon = m.Icon;
            return (
              <div key={k} className="rounded-md border p-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Icon className={cn("h-3.5 w-3.5", m.tone)} /> {m.label}
                </div>
                <div className="mt-0.5 text-lg font-semibold">{(counts[k] ?? 0).toLocaleString("vi-VN")}</div>
              </div>
            );
          })}
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="flex h-auto flex-wrap">
            {HISTORY_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="text-xs">
                {t.label}
                {t.value !== "all" && counts[t.value] ? ` (${counts[t.value]})` : ""}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-3 flex-1 overflow-y-auto">
          {shown.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <ClipboardList className="h-8 w-8 opacity-40" />
              Chưa có sự kiện nào cho tài sản này.
            </div>
          ) : (
            <ol className="relative space-y-3 border-l pl-5">
              {shown.map((e) => {
                const m = HISTORY_META[e.nguon] ?? { label: e.loai_su_kien, Icon: FileText, tone: "text-muted-foreground", badge: "border-border bg-muted text-muted-foreground" };
                const Icon = m.Icon;
                return (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[26px] flex h-5 w-5 items-center justify-center rounded-full border bg-background">
                      <Icon className={cn("h-3 w-3", m.tone)} />
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded border px-1.5 py-0.5 text-[10px]", m.badge)}>{m.label}</span>
                      <span className="text-xs text-muted-foreground">{e.ngay}</span>
                    </div>
                    <div className="mt-0.5 text-sm font-medium">{e.tieu_de}</div>
                    {e.mo_ta && <div className="text-xs text-muted-foreground">{e.mo_ta}</div>}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}




/* ------------------------------ Ô tìm kiếm ------------------------------ */

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

function NodeSearch({ items, onPick }: { items: SearchItem[]; onPick: (it: SearchItem) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as globalThis.Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo(() => {
    const nq = normalize(q.trim());
    if (!nq) return [];
    const tierRank: Record<SearchItem["kind"], number> = { pl: 0, lv: 1, nh: 2, ht: 3, tb: 4, tp: 5 };
    const matched = items.filter(
      (it) => normalize(it.label).includes(nq) || (it.code && normalize(it.code).includes(nq)),
    );

    // 1) Bỏ trùng tuyệt đối: cùng thực thể (kind + mã) xuất hiện ở nhiều nhánh → giữ 1.
    const byKey = new Map<string, SearchItem>();
    for (const it of matched) {
      const key = `${it.kind}:${it.ma}`;
      const prev = byKey.get(key);
      if (!prev || (it.count ?? 0) > (prev.count ?? 0)) byKey.set(key, it);
    }
    let list = [...byKey.values()];

    // 2) Bỏ "Nhóm hệ thống" khi đã có "Hệ thống" con cũng khớp → tránh lặp cùng một đối tượng.
    const childHt = new Set<string>();
    for (const it of list) if (it.kind === "ht") childHt.add(`${it.plId}|${it.lvId ?? ""}|${it.nhMa ?? ""}`);
    list = list.filter((it) => !(it.kind === "nh" && childHt.has(`${it.plId}|${it.lvId ?? ""}|${it.ma}`)));

    return list.sort((a, b) => tierRank[a.kind] - tierRank[b.kind]).slice(0, 30);
  }, [q, items]);

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q} onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          placeholder="Tìm phân loại, hệ thống, tài sản…" className="h-9 w-56 pl-8 sm:w-72"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-80 w-[22rem] overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
          {results.map((it) => {
            const meta = LEVEL_META[it.kind];
            const Icon = meta.Icon;
            return (
              <button
                key={`${it.kind}:${it.ma}`}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                onClick={() => { onPick(it); setOpen(false); }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  {it.code && it.kind !== "tb" && it.kind !== "tp" && <span className="mr-1 font-mono text-xs opacity-60">{it.code}</span>}
                  {it.label}
                </span>
                {(it.kind === "tb" || it.kind === "tp") && it.sysName && (
                  <span
                    className="inline-flex max-w-[9rem] shrink-0 items-center gap-1 rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-600"
                    title={`Hệ thống: ${it.sysName}`}
                  >
                    <Network className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{it.sysName}</span>
                  </span>
                )}
                <span className={cn("shrink-0 rounded border px-1.5 py-0.5 text-[10px]", meta.badge)}>{meta.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
