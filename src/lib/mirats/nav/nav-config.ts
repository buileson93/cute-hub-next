// ============================================================================
// Task 28 — Cấu hình điều hướng dùng chung cho Sidebar.
//
// Mục tiêu: một cấu trúc dữ liệu THUẦN (không phụ thuộc React/DOM) để mô tả
// nhóm & mục điều hướng, có thể test được. Icon lưu dưới dạng tên chuỗi để
// tách khỏi bundle React; sidebar tự tra cứu component từ lucide-react.
//
// Nguồn dữ liệu vẫn là `nav-contract.ts` (workspaces) — file này DẪN XUẤT từ
// đó để tránh trùng lặp. Mọi thay đổi menu → sửa nav-contract, nav-config sẽ
// tự cập nhật.
// ============================================================================
import {
  workspaces,
  isItemActive as isItemActiveContract,
  type NavItem as ContractNavItem,
} from "@/lib/mirats/nav-contract";
import type { AppRole } from "@/hooks/use-session";

export type NavBadgeKey = "su_co_mo" | "sap_het_han" | "hong_hoc_mo" | "kd_hc_sap_het_han";

export interface NavItem {
  /** Khoá ổn định (dùng cho React key + test). */
  key: string;
  /** Nhãn hiển thị tiếng Việt. */
  nhan: string;
  /** Tên icon lucide-react (PascalCase). */
  icon: string;
  /** Đường dẫn TanStack Router. */
  route: string;
  /** Khoá nhóm chứa mục. */
  nhom: string;
  /** Chỉ khớp exact khi có `exact:true` ở nguồn. */
  exact?: boolean;
  /** Nếu có, sidebar sẽ tra cứu số liệu tương ứng để hiển thị badge. */
  badgeKey?: NavBadgeKey;
  /** Nếu set, chỉ hiện khi user có ÍT NHẤT 1 role trong danh sách. */
  roles?: AppRole[];
}

export interface NavGroup {
  key: string;
  nhan: string;
  thuTu: number;
  items: NavItem[];
}

/** Bảng ánh xạ route → badge, phục vụ nhắc "việc cần xử lý". */
const BADGE_BY_ROUTE: Record<string, NavBadgeKey> = {
  "/su-co": "su_co_mo",
  "/hong-hoc": "hong_hoc_mo",
  "/giay-phep": "sap_het_han",
  "/kiem-dinh": "kd_hc_sap_het_han",
};

function iconName(icon: ContractNavItem["icon"]): string {
  // lucide-react component có `displayName` (ví dụ "LayoutDashboard").
  const anyIcon = icon as unknown as { displayName?: string; name?: string };
  return anyIcon.displayName ?? anyIcon.name ?? "Circle";
}

function toItem(nhomKey: string, source: ContractNavItem): NavItem {
  return {
    key: source.to,
    nhan: source.label,
    icon: iconName(source.icon),
    route: source.to,
    nhom: nhomKey,
    exact: source.exact,
    badgeKey: BADGE_BY_ROUTE[source.to],
    roles: source.roles,
  };
}

/** Trả về toàn bộ nhóm điều hướng (đã trải phẳng children lên cùng cấp). */
export function navGroups(): NavGroup[] {
  const groups: NavGroup[] = [];
  workspaces.forEach((ws, idx) => {
    const items: NavItem[] = [];
    for (const g of ws.groups) {
      for (const it of g.items) {
        items.push(toItem(ws.id, it));
        for (const c of it.children ?? []) items.push(toItem(ws.id, c));
      }
    }
    groups.push({ key: ws.id, nhan: ws.label, thuTu: idx, items });
  });
  return groups;
}

/**
 * Khớp active state — dùng chung logic với nav-contract nên khi ở route con
 * (ví dụ `/thiet-bi/TB_XXX`) thì mục cha `/thiet-bi` vẫn active.
 */
export function isActive(pathname: string, item: NavItem): boolean {
  return isItemActiveContract(
    {
      to: item.route,
      label: item.nhan,
      exact: item.exact,
      icon: (() => null) as unknown as ContractNavItem["icon"],
    },
    pathname,
  );
}
