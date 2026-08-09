// ============================================================================
// HỢP ĐỒNG ĐIỀU HƯỚNG FRONT END (Front End navigation contract) — Task 8.
//
// Đây là NGUỒN DUY NHẤT cho cấu trúc menu, phân hệ (workspace), breadcrumb và
// quyền hiển thị theo vai trò. Trước kia dữ liệu này nằm nội tuyến trong
// AppShell.tsx; tách ra đây để:
//   1. Kiểm thử đặc tả (characterization test) khoá lại hành vi hiện tại,
//      giúp các nâng cấp sau không vô tình làm mất route / menu / breadcrumb.
//   2. Giữ nguyên shape mà AppShell đang render (không redesign).
//
// KHÔNG thêm hiệu ứng phụ (side effect) hay hook ở đây — chỉ dữ liệu thuần và
// hàm thuần để test được không cần DOM.
// ============================================================================
import {
  LayoutDashboard, ShieldCheck, Building2, Network, MapPin,
  Package, HeartPulse, Lock, UserCog,
  FileText, FilePlus2, Database, Sparkles, Ticket, MessageSquare, FolderKanban,
  Boxes, Layers, Settings2, Waypoints, Cable,
  LifeBuoy, BookMarked, AlertTriangle, Wrench, ArrowLeftRight, DatabaseBackup,
  Upload, CalendarClock, ClipboardCheck, ClipboardList, QrCode, ImageUp,
  Factory, Truck, Tag, Bug, HardDrive, Component, Link2, KeyRound, Users, Laptop,
} from "lucide-react";

import type { AppRole } from "@/hooks/use-session";

export type LucideIcon = typeof LayoutDashboard;

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  /** Nếu set, chỉ hiện khi user có ÍT NHẤT 1 role trong danh sách. */
  roles?: AppRole[];
  /** Ẩn khỏi thanh công cụ chức năng trên điện thoại (tính năng chỉ hợp desktop). */
  hideOnMobile?: boolean;
  /** Mục con — hiển thị thụt vào, có thể thu gọn dưới mục cha. */
  children?: NavItem[];
  /** Nếu true, mục này là DẢI PHÂN CÁCH nhóm con (không phải link, không có route). */
  divider?: boolean;
};

/** Kiểm tra một NavItem có phải chỉ là dải phân cách nhóm con (không phải link). */
export function isDivider(it: NavItem): boolean {
  return it.divider === true;
}

export type NavGroup = { header: string; items: NavItem[] };

/** Một "không gian làm việc" — mỗi cái có sidebar riêng, chọn từ thanh rail. */
export type Workspace = {
  id: string;
  label: string;
  /** nhãn ngắn hiển thị dưới icon trên rail */
  short: string;
  icon: LucideIcon;
  roles?: AppRole[];
  groups: NavGroup[];
};

// Vai trò được xem/quản lý danh mục & phân quyền
export const MANAGER_ROLES: AppRole[] = ["admin", "phong_kt"];
export const ADMIN_ONLY: AppRole[] = ["admin"];

export const workspaces: Workspace[] = [
  {
    id: "van-hanh",
    label: "Vận hành",
    short: "Vận hành",
    icon: LayoutDashboard,
    groups: [
      {
        header: "Vận hành chính",
        items: [
          { to: "/", label: "Overview", icon: LayoutDashboard, exact: true },
          { to: "/he-thong/cay", label: "Hệ thống", icon: Network },
          { to: "/he-thong/lien-ket", label: "Liên kết", icon: Link2 },
          { to: "/so-do", label: "Sơ đồ hệ thống", icon: Waypoints, hideOnMobile: true },
          { to: "/giay-phep", label: "Giấy phép", icon: ShieldCheck },
          { to: "/kiem-dinh", label: "Kiểm định & Hiệu chuẩn", icon: ShieldCheck },
          { to: "/phan-mem-ban-quyen", label: "Bản quyền phần mềm", icon: KeyRound },
          { to: "/thong-ke/laptop", label: "Thống kê Laptop", icon: Laptop },
        ],
      },
    ],
  },
  {
    id: "so-ly-lich",
    label: "Sổ lý lịch",
    short: "Sổ lý lịch",
    icon: BookMarked,
    groups: [
      {
        header: "Sổ lý lịch",
        items: [
          { to: "/thiet-bi", label: "Sổ lý lịch", icon: BookMarked },
          // — Nhóm nhập liệu: có form tạo/cập nhật —
          { to: "/su-co", label: "Sự cố kỹ thuật", icon: AlertTriangle },
          { to: "/bao-tri", label: "Bảo dưỡng", icon: Wrench },
          { to: "/hong-hoc", label: "Hỏng hóc", icon: LifeBuoy },
          { to: "/ban-giao", label: "Bàn giao", icon: ArrowLeftRight },
          // — Dải phân cách —
          { to: "#so-ly-lich-xem", label: "Xem & thống kê", icon: BookMarked, divider: true },
          // — Nhóm chỉ xem/tổng hợp: không nhập liệu trực tiếp —
          { to: "/van-de", label: "Vấn đề (RCA)", icon: Bug },
          { to: "/bao-tri/cong-viec", label: "Phiếu công việc & KPI", icon: ClipboardList },
          { to: "/bao-tri/pm", label: "Bảo dưỡng định kỳ (PM)", icon: CalendarClock },
          { to: "/bao-tri/dot", label: "Đợt bảo dưỡng lớn", icon: CalendarClock },
        ],
      },
    ],
  },
  {
    id: "danh-muc",
    label: "Danh mục khu vực",
    short: "Danh mục",
    icon: Layers,
    roles: MANAGER_ROLES,
    groups: [
      {
        header: "Đơn vị khu vực",
        items: [
          { to: "/danh-muc/don-vi", label: "Đơn vị", icon: Building2, roles: MANAGER_ROLES },
          { to: "/danh-muc/vi-tri", label: "Vị trí", icon: MapPin, roles: MANAGER_ROLES },
        ],
      },
      {
        header: "Tài sản",
        items: [
          { to: "/danh-muc/thiet-bi", label: "Tài sản", icon: HardDrive, roles: MANAGER_ROLES },
          { to: "/danh-muc/model", label: "Model", icon: Package, roles: MANAGER_ROLES },
          { to: "/danh-muc/loai-thiet-bi", label: "Chủng loại", icon: Tag, roles: MANAGER_ROLES },

          { to: "/danh-muc/dac-tinh", label: "Nhãn tài sản", icon: Sparkles, roles: MANAGER_ROLES },
          { to: "/danh-muc/nha-san-xuat", label: "Nhà sản xuất", icon: Factory, roles: MANAGER_ROLES },
          { to: "/danh-muc/nha-cung-cap", label: "Nhà cung cấp", icon: Truck, roles: MANAGER_ROLES },
        ],
      },
    ],
  },
  {
    id: "du-an",
    label: "Quản lý dự án",
    short: "Dự án",
    icon: FolderKanban,
    groups: [
      {
        header: "Dự án & Tiến độ",
        items: [
          { to: "/du-an", label: "Danh sách dự án", icon: FolderKanban },
        ],
      },
    ],
  },
  {
    id: "trao-doi",
    label: "Trao đổi & Hỗ trợ",
    short: "Trao đổi",
    icon: MessageSquare,
    groups: [
      {
        header: "Trao đổi",
        items: [
          { to: "/tickets", label: "Yêu cầu hỗ trợ", icon: Ticket },
          { to: "/messages", label: "Tin nhắn", icon: MessageSquare },
        ],
      },
    ],
  },
  {
    id: "tai-san",
    label: "Tài sản & Hồ sơ",
    short: "Tài sản",
    icon: Boxes,
    groups: [
      {
        header: "Tài sản & Tuân thủ",
        items: [
          { to: "/vat-tu", label: "Vật tư & Kho", icon: Package },
          { to: "/kiem-ke", label: "Kiểm kê tài sản", icon: ClipboardCheck },
          { to: "/nhan", label: "In nhãn QR", icon: QrCode, hideOnMobile: true },
          { to: "/tuoi-tho", label: "Tuổi thọ & Vòng đời", icon: HeartPulse },
        ],
      },
      {
        header: "Biểu mẫu & Hồ sơ",
        items: [
          { to: "/forms", label: "Biên bản", icon: FileText },
          { to: "/admin/forms", label: "Mẫu biên bản", icon: FilePlus2, roles: MANAGER_ROLES },
        ],
      },
    ],
  },
  {
    id: "he-thong",
    label: "Quản trị hệ thống",
    short: "Hệ thống",
    icon: Settings2,
    roles: MANAGER_ROLES,
    groups: [
      {
        header: "Hệ thống",
        items: [
          { to: "/phan-quyen", label: "Phân quyền & Bảo mật", icon: Lock, roles: MANAGER_ROLES },
          { to: "/cho-duyet", label: "Chờ duyệt (Change Request)", icon: ClipboardCheck, roles: MANAGER_ROLES },
          { to: "/admin/bao-tri-chinh-sach", label: "Chính sách bảo dưỡng", icon: CalendarClock, roles: MANAGER_ROLES },


          { to: "/admin/users", label: "Quản lý tài khoản", icon: UserCog, roles: ADMIN_ONLY },
          { to: "/admin/nhan-vien", label: "Quản lý nhân viên", icon: Users, roles: MANAGER_ROLES },
          { to: "/admin/audit", label: "Nhật ký hệ thống", icon: Lock, roles: ADMIN_ONLY },

          { to: "/admin/schema", label: "Sơ đồ CSDL", icon: Database, roles: ADMIN_ONLY, hideOnMobile: true },
          { to: "/admin/backup", label: "Sao lưu & Khôi phục", icon: DatabaseBackup, roles: ADMIN_ONLY, hideOnMobile: true },
          { to: "/admin/nhap-lieu", label: "Nhập/Xuất hàng loạt", icon: Upload, roles: ADMIN_ONLY, hideOnMobile: true },
          { to: "/admin/review", label: "Rà soát dữ liệu", icon: ClipboardList, roles: ADMIN_ONLY, hideOnMobile: true },
          { to: "/admin/kiem-tra-so-lieu", label: "Kiểm tra số liệu", icon: ClipboardList, roles: ADMIN_ONLY, hideOnMobile: true },
          { to: "/admin/kiem-tra-layout", label: "Kiểm tra layout", icon: ClipboardList, roles: ADMIN_ONLY, hideOnMobile: true },
          { to: "/admin/ai", label: "Cấu hình AI", icon: Sparkles, roles: ADMIN_ONLY },
          { to: "/admin/thuong-hieu", label: "Thương hiệu & Logo", icon: ImageUp, roles: ADMIN_ONLY },
         { to: "/admin/luu-tru", label: "Lưu trữ tệp", icon: HardDrive, roles: ADMIN_ONLY },
          { to: "/admin/supabase-ngoai", label: "Kết nối Supabase ngoài", icon: Database, roles: ADMIN_ONLY, hideOnMobile: true },

        ],
      },
    ],
  },
];

export const routeTitles: Record<string, { crumb: string; title: string }> = {
  "/": { crumb: "Bảng điều khiển", title: "Tổng quan hệ thống" },
  "/tong-quan": { crumb: "Bảng điều khiển", title: "Tổng quan KPI" },
  "/thiet-bi": { crumb: "Sổ lý lịch", title: "Sổ lý lịch" },
  "/bao-tri": { crumb: "Sổ lý lịch", title: "Bảo dưỡng" },
  "/bao-tri/cong-viec": { crumb: "Sổ lý lịch", title: "Phiếu công việc & KPI" },
  "/bao-tri/pm": { crumb: "Sổ lý lịch", title: "Bảo dưỡng định kỳ (PM)" },
  "/bao-tri/dot": { crumb: "Sổ lý lịch", title: "Đợt bảo dưỡng lớn" },
  "/su-co": { crumb: "Sổ lý lịch", title: "Sự cố" },
  "/van-de": { crumb: "Sổ lý lịch", title: "Vấn đề (RCA)" },
  "/hong-hoc": { crumb: "Sổ lý lịch", title: "Hỏng hóc" },
  "/ban-giao": { crumb: "Sổ lý lịch", title: "Bàn giao" },
  "/so-do": { crumb: "Vận hành", title: "Sơ đồ hệ thống" },
  "/topology": { crumb: "Sơ đồ hệ thống", title: "Đấu nối" },
  "/du-an": { crumb: "Dự án", title: "Dự án & Tiến độ" },
  "/tickets": { crumb: "Trao đổi", title: "Yêu cầu hỗ trợ" },
  "/messages": { crumb: "Trao đổi", title: "Tin nhắn" },
  "/forms": { crumb: "Hồ sơ", title: "Biên bản" },
  "/admin/forms": { crumb: "Hồ sơ", title: "Mẫu biên bản" },
  "/vat-tu": { crumb: "Kho", title: "Vật tư & Kho" },
  "/kiem-ke": { crumb: "Tài sản", title: "Kiểm kê tài sản" },
  
  "/kiem-dinh": { crumb: "Vận hành", title: "Kiểm định & Hiệu chuẩn" },
  "/tuoi-tho": { crumb: "Vòng đời", title: "Tuổi thọ & Vòng đời" },
  "/giay-phep": { crumb: "Giấy phép", title: "Giấy phép" },
  "/phan-mem-ban-quyen": { crumb: "Tài sản", title: "Bản quyền phần mềm" },
  "/phan-quyen": { crumb: "Hệ thống", title: "Phân quyền & Bảo mật" },
  "/cho-duyet": { crumb: "Hệ thống", title: "Chờ duyệt — Change Request" },

  "/admin/users": { crumb: "Hệ thống", title: "Quản lý tài khoản" },
  "/admin/nhan-vien": { crumb: "Hệ thống", title: "Quản lý nhân viên" },
  "/admin/audit": { crumb: "Hệ thống", title: "Nhật ký hệ thống" },

  "/admin/schema": { crumb: "Hệ thống", title: "Sơ đồ CSDL" },
  "/admin/backup": { crumb: "Hệ thống", title: "Sao lưu & Khôi phục" },
  "/admin/ai": { crumb: "Hệ thống", title: "Cấu hình AI" },
  "/admin/nhap-lieu": { crumb: "Hệ thống", title: "Nhập/Xuất hàng loạt" },
  "/admin/review": { crumb: "Hệ thống", title: "Rà soát dữ liệu" },
  "/admin/kiem-tra-so-lieu": { crumb: "Hệ thống", title: "Kiểm tra số liệu — Nhóm hệ thống & Vị trí" },
  "/admin/kiem-tra-layout": { crumb: "Hệ thống", title: "Kiểm tra layout theo viewport" },
  "/admin/bao-tri-chinh-sach": { crumb: "Hệ thống", title: "Chính sách bảo dưỡng" },
  "/admin/thuong-hieu": { crumb: "Hệ thống", title: "Thương hiệu & Logo" },
  "/admin/luu-tru": { crumb: "Hệ thống", title: "Lưu trữ tệp — Cloud & R2" },
  "/admin/supabase-ngoai": { crumb: "Hệ thống", title: "Kết nối Supabase ngoài" },


  "/cai-dat/tai-khoan": { crumb: "Cá nhân", title: "Tài khoản của tôi" },
  "/danh-muc/don-vi": { crumb: "Danh mục", title: "Đơn vị" },
  "/danh-muc/he-thong": { crumb: "Danh mục", title: "Hệ thống" },
  "/he-thong/cay": { crumb: "Tài sản", title: "Hệ thống" },
  "/he-thong/thanh-phan": { crumb: "Tài sản", title: "Bảng hệ thống — Thành phần & tài sản" },
  "/he-thong/lien-ket": { crumb: "Vận hành", title: "Liên kết" },
  "/he-thong/thung-rac": { crumb: "Tài sản", title: "Thùng rác — Thành phần" },

  "/danh-muc/vi-tri": { crumb: "Danh mục", title: "Vị trí" },
  "/danh-muc/thiet-bi": { crumb: "Danh mục", title: "Danh mục tài sản" },
  "/danh-muc/model": { crumb: "Danh mục", title: "Model" },
  "/danh-muc/loai-thiet-bi": { crumb: "Danh mục", title: "Chủng loại" },

  "/danh-muc/dac-tinh": { crumb: "Danh mục", title: "Nhãn tài sản" },
  "/danh-muc/nha-san-xuat": { crumb: "Danh mục", title: "Nhà sản xuất" },
  "/danh-muc/nha-cung-cap": { crumb: "Danh mục", title: "Nhà cung cấp" },
};

// ---------------------------------------------------------------------------
// Hàm thuần dùng chung cho AppShell + test đặc tả.
// ---------------------------------------------------------------------------

export function itemMatchScore(item: NavItem, pathname: string): number {
  if (item.exact) return pathname === item.to ? item.to.length : -1;
  if (pathname === item.to || pathname.startsWith(item.to + "/")) return item.to.length;
  return -1;
}

export function isItemActive(item: NavItem, pathname: string): boolean {
  return itemMatchScore(item, pathname) >= 0;
}

/** Suy ra workspace đang mở từ đường dẫn hiện tại (khớp prefix dài nhất). */
export function resolveActiveWorkspace(pathname: string): string {
  let best = workspaces[0].id;
  let bestScore = -1;
  for (const ws of workspaces) {
    for (const g of ws.groups) {
      for (const it of g.items) {
        for (const node of [it, ...(it.children ?? [])]) {
          const s = itemMatchScore(node, pathname);
          if (s > bestScore) {
            bestScore = s;
            best = ws.id;
          }
        }
      }
    }
  }
  return best;
}

export function firstItemOf(ws: Workspace, hasRole: (r: AppRole) => boolean): string {
  for (const g of ws.groups) {
    for (const it of g.items) {
      if (!it.roles || it.roles.some((r) => hasRole(r))) return it.to;
    }
  }
  return ws.groups[0]?.items[0]?.to ?? "/";
}

/** Trải phẳng danh sách chức năng của một phân hệ (kèm mục con) để hiển thị
 *  trên thanh công cụ chuyển tính năng ở giao diện điện thoại. */
export function flattenWorkspaceItems(ws: Workspace, hasRole: (r: AppRole) => boolean): NavItem[] {
  const out: NavItem[] = [];
  for (const g of ws.groups) {
    for (const it of g.items) {
      if (it.roles && !it.roles.some((r) => hasRole(r))) continue;
      if (!it.hideOnMobile) out.push(it);
      for (const c of it.children ?? []) {
        if (isDivider(c)) continue;
        if (c.roles && !c.roles.some((r) => hasRole(r))) continue;
        if (c.hideOnMobile) continue;
        out.push(c);
      }
    }
  }
  return out;
}

/** Suy breadcrumb + tiêu đề trang từ đường dẫn (khớp chính xác, rồi tới prefix). */
export function resolveRouteMeta(pathname: string): { crumb: string; title: string } {
  return (
    routeTitles[pathname] ??
    Object.entries(routeTitles).find(([k]) => k !== "/" && pathname.startsWith(k))?.[1] ??
    { crumb: "MIRATS", title: "" }
  );
}

/** Danh sách quyền hiển thị của một workspace (dùng để test contract). */
export function isWorkspaceVisible(ws: Workspace, hasRole: (r: AppRole) => boolean): boolean {
  return !ws.roles || ws.roles.some((r) => hasRole(r));
}

// ---------------------------------------------------------------------------
// Route → required roles map (dùng cho route guard ở tầng UI).
// Nếu route KHÔNG khai báo roles trong nav-contract, coi như không giới hạn
// vai trò (mọi user đã đăng nhập + active đều vào được — RLS vẫn quyết định
// dữ liệu). Nếu có, phải giao ít nhất 1 role.
// ---------------------------------------------------------------------------
function collectRouteRoles(): Array<{ prefix: string; exact: boolean; roles: AppRole[] }> {
  const out: Array<{ prefix: string; exact: boolean; roles: AppRole[] }> = [];
  for (const ws of workspaces) {
    for (const g of ws.groups) {
      for (const it of g.items) {
        // Item roles hoặc kế thừa từ workspace nếu item không khai riêng.
        const itRoles = it.roles ?? ws.roles;
        if (itRoles) out.push({ prefix: it.to, exact: !!it.exact, roles: itRoles });
        for (const c of it.children ?? []) {
          if (isDivider(c)) continue;
          const cRoles = c.roles ?? it.roles ?? ws.roles;
          if (cRoles) out.push({ prefix: c.to, exact: !!c.exact, roles: cRoles });
        }
      }
    }
  }
  // Ưu tiên prefix dài (cụ thể) trước, để `/admin/users` không bị `/admin` (nếu có) đè.
  out.sort((a, b) => b.prefix.length - a.prefix.length);
  return out;
}

const ROUTE_ROLE_TABLE = collectRouteRoles();

/** Trả về danh sách role được phép vào path, hoặc null nếu không giới hạn. */
export function requiredRolesForRoute(pathname: string): AppRole[] | null {
  for (const entry of ROUTE_ROLE_TABLE) {
    const match = entry.exact
      ? pathname === entry.prefix
      : pathname === entry.prefix || pathname.startsWith(entry.prefix + "/");
    if (match) return entry.roles;
  }
  return null;
}

/** True nếu user (roles) được phép vào path. Admin luôn được. */
export function canAccessRoute(pathname: string, roles: readonly AppRole[]): boolean {
  if (roles.includes("admin")) return true;
  const req = requiredRolesForRoute(pathname);
  if (!req) return true;
  return req.some((r) => roles.includes(r));
}

