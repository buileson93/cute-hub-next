import {
  ShieldCheck,
  UserCog,
  Building2,
  FolderKanban,
  Users,
  Wrench,
  Eye,
  HardDrive,
  AlertTriangle,
  Replace,
  ArrowLeftRight,
  Package,
  FileText,
  ClipboardList,
  Database,
  KeyRound,
  FileClock,
  Network,
} from "lucide-react";

export type PermLevel = "CRUD" | "CRU" | "CRUD-DV" | "CRU-DV" | "C-DV" | "R" | "R-DV" | "-";
export type RoleKey =
  | "admin"
  | "phong_kt"
  | "phu_trach_dv"
  | "quan_ly_du_an"
  | "to_truong"
  | "ktv"
  | "readonly";

export type Stats = {
  total_accounts: number;
  active_accounts: number;
  roles: Record<string, { total: number; active: number }>;
  units: { don_vi: string; accounts: number; active: number }[];
  entities: {
    thiet_bi: number;
    giay_phep: number;
    tickets: number;
    du_an: number;
    so_do: number;
    forms: number;
    audit: number;
  };
};

export const roleMeta: Record<
  RoleKey,
  {
    name: string;
    short: string;
    scope: string;
    icon: any;
    tone: string;
    desc: string;
  }
> = {
  admin: {
    name: "Quản trị hệ thống",
    short: "Admin",
    scope: "Toàn hệ thống",
    icon: ShieldCheck,
    tone: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
    desc: "Toàn quyền cấu hình & quản trị.",
  },
  phong_kt: {
    name: "Phòng Kỹ thuật",
    short: "Phòng KT",
    scope: "Toàn công ty",
    icon: UserCog,
    tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
    desc: "CRUD nghiệp vụ toàn công ty; duyệt phiếu.",
  },
  phu_trach_dv: {
    name: "Phụ trách đơn vị",
    short: "PT đơn vị",
    scope: "Trong đơn vị",
    icon: Building2,
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    desc: "Xem trong đơn vị, tạo sự cố / phiếu nghiệp vụ.",
  },
  quan_ly_du_an: {
    name: "Quản lý dự án",
    short: "QL dự án",
    scope: "Dự án phụ trách",
    icon: FolderKanban,
    tone: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    desc: "Quản trị dự án được phân công.",
  },
  to_truong: {
    name: "Tổ trưởng",
    short: "Tổ trưởng",
    scope: "Trong đơn vị",
    icon: Users,
    tone: "bg-teal-500/10 text-teal-600 dark:text-teal-300",
    desc: "Điều phối công việc bảo dưỡng trong đơn vị.",
  },
  ktv: {
    name: "Kỹ thuật viên",
    short: "KTV",
    scope: "Trong đơn vị",
    icon: Wrench,
    tone: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    desc: "Tạo sự cố / phiếu điền; xem trong đơn vị.",
  },
  readonly: {
    name: "Người xem",
    short: "Read-only",
    scope: "Trong đơn vị",
    icon: Eye,
    tone: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    desc: "Chỉ xem & xuất báo cáo.",
  },
};

export const ROLE_ORDER: RoleKey[] = [
  "admin",
  "phong_kt",
  "phu_trach_dv",
  "quan_ly_du_an",
  "to_truong",
  "ktv",
  "readonly",
];

export const collections: {
  key: string;
  label: string;
  icon: any;
  perms: Record<RoleKey, PermLevel>;
}[] = [
  {
    key: "thiet_bi",
    label: "Tài sản",
    icon: HardDrive,
    perms: {
      admin: "CRUD",
      phong_kt: "CRUD",
      phu_trach_dv: "R-DV",
      quan_ly_du_an: "R-DV",
      to_truong: "R-DV",
      ktv: "R-DV",
      readonly: "R-DV",
    },
  },
  {
    key: "bao_tri",
    label: "Bảo dưỡng",
    icon: Wrench,
    perms: {
      admin: "CRUD",
      phong_kt: "CRUD",
      phu_trach_dv: "R-DV",
      quan_ly_du_an: "R-DV",
      to_truong: "R-DV",
      ktv: "R-DV",
      readonly: "R-DV",
    },
  },
  {
    key: "su_co",
    label: "Sự cố",
    icon: AlertTriangle,
    perms: {
      admin: "CRUD",
      phong_kt: "CRUD",
      phu_trach_dv: "C-DV",
      quan_ly_du_an: "C-DV",
      to_truong: "C-DV",
      ktv: "C-DV",
      readonly: "R-DV",
    },
  },
  {
    key: "hong_hoc",
    label: "Hỏng hóc & Thay thế",
    icon: Replace,
    perms: {
      admin: "CRUD",
      phong_kt: "CRUD",
      phu_trach_dv: "R-DV",
      quan_ly_du_an: "R-DV",
      to_truong: "R-DV",
      ktv: "R-DV",
      readonly: "R-DV",
    },
  },
  {
    key: "ban_giao",
    label: "Bàn giao",
    icon: ArrowLeftRight,
    perms: {
      admin: "CRUD",
      phong_kt: "CRUD",
      phu_trach_dv: "R-DV",
      quan_ly_du_an: "R-DV",
      to_truong: "R-DV",
      ktv: "R-DV",
      readonly: "R-DV",
    },
  },
  {
    key: "vat_tu",
    label: "Vật tư & Kho",
    icon: Package,
    perms: {
      admin: "CRUD",
      phong_kt: "CRUD",
      phu_trach_dv: "R-DV",
      quan_ly_du_an: "R-DV",
      to_truong: "R-DV",
      ktv: "R-DV",
      readonly: "R-DV",
    },
  },
  {
    key: "giay_phep",
    label: "Giấy phép",
    icon: ShieldCheck,
    perms: {
      admin: "CRUD",
      phong_kt: "CRUD",
      phu_trach_dv: "R-DV",
      quan_ly_du_an: "R-DV",
      to_truong: "R-DV",
      ktv: "R-DV",
      readonly: "R-DV",
    },
  },
  {
    key: "forms",
    label: "Phiếu điền (Forms)",
    icon: FileText,
    perms: {
      admin: "CRUD",
      phong_kt: "CRUD",
      phu_trach_dv: "CRU-DV",
      quan_ly_du_an: "CRU-DV",
      to_truong: "CRU-DV",
      ktv: "CRU-DV",
      readonly: "R-DV",
    },
  },
  {
    key: "du_an",
    label: "Dự án",
    icon: FolderKanban,
    perms: {
      admin: "CRUD",
      phong_kt: "CRUD",
      phu_trach_dv: "R",
      quan_ly_du_an: "CRUD-DV",
      to_truong: "R",
      ktv: "R",
      readonly: "R",
    },
  },
  {
    key: "so_do",
    label: "Sơ đồ hệ thống",
    icon: Network,
    perms: {
      admin: "CRUD",
      phong_kt: "CRUD",
      phu_trach_dv: "CRU-DV",
      quan_ly_du_an: "CRU-DV",
      to_truong: "R-DV",
      ktv: "R-DV",
      readonly: "R-DV",
    },
  },
  {
    key: "tickets",
    label: "Yêu cầu (Tickets)",
    icon: ClipboardList,
    perms: {
      admin: "CRUD",
      phong_kt: "CRU",
      phu_trach_dv: "CRU",
      quan_ly_du_an: "CRU",
      to_truong: "CRU",
      ktv: "CRU",
      readonly: "CRU",
    },
  },
  {
    key: "danh_muc",
    label: "Danh mục nền",
    icon: Database,
    perms: {
      admin: "CRUD",
      phong_kt: "CRUD",
      phu_trach_dv: "R",
      quan_ly_du_an: "R",
      to_truong: "R",
      ktv: "R",
      readonly: "R",
    },
  },
  {
    key: "nguoi_dung",
    label: "Người dùng & Vai trò",
    icon: Users,
    perms: {
      admin: "CRUD",
      phong_kt: "-",
      phu_trach_dv: "-",
      quan_ly_du_an: "-",
      to_truong: "-",
      ktv: "-",
      readonly: "-",
    },
  },
];

export type Tier = "full" | "edit" | "view" | "none";

export const tierMeta: Record<Tier, { label: string; dot: string; cell: string }> = {
  full: {
    label: "Đầy đủ",
    dot: "bg-emerald-500",
    cell: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  edit: {
    label: "Tạo · Sửa",
    dot: "bg-sky-500",
    cell: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  view: { label: "Chỉ xem", dot: "bg-muted-foreground/50", cell: "bg-muted text-muted-foreground" },
  none: {
    label: "Không truy cập",
    dot: "bg-transparent border border-border",
    cell: "text-muted-foreground/40",
  },
};

export function permToTier(p: PermLevel): { tier: Tier; dv: boolean } {
  switch (p) {
    case "CRUD":
      return { tier: "full", dv: false };
    case "CRUD-DV":
      return { tier: "full", dv: true };
    case "CRU":
      return { tier: "edit", dv: false };
    case "CRU-DV":
      return { tier: "edit", dv: true };
    case "C-DV":
      return { tier: "edit", dv: true };
    case "R":
      return { tier: "view", dv: false };
    case "R-DV":
      return { tier: "view", dv: true };
    default:
      return { tier: "none", dv: false };
  }
}

export type AuditRow = {
  id: string;
  user_id: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  created_at: string;
};

export const ENTITY_LABEL: Record<string, string> = {
  thiet_bi: "Tài sản",
  giay_phep: "Giấy phép",
  form_template: "Mẫu biểu",
  form_field: "Trường mẫu biểu",
  form_submission: "Phiếu điền",
  profiles: "Tài khoản",
  user_roles: "Phân quyền",
  dm_don_vi: "Đơn vị",
  dm_he_thong: "Hệ thống",
  dm_nhom_he_thong: "Nhóm hệ thống",
  dm_vi_tri: "Vị trí",
  dm_loai_thiet_bi: "Chủng loại",
  dm_loai_giay_phep: "Loại giấy phép",
  dm_nha_cung_cap: "Nhà cung cấp",
  dm_nha_san_xuat: "Nhà sản xuất",
  dm_noi_cap: "Nơi cấp",
  du_an: "Dự án",
  so_do_he_thong: "Sơ đồ hệ thống",
  audit_log: "Nhật ký",
  tickets: "Yêu cầu",
};
