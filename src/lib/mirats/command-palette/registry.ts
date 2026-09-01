// ============================================================================
// Sổ đăng ký lệnh (command registry) cho Command Palette.
//
// Nguyên tắc:
//   - Điều hướng lấy TRỰC TIẾP từ `nav-contract` (nguồn duy nhất) nên không
//     bao giờ lệch route hay lệch phân quyền với sidebar.
//   - Lệnh hành động chỉ khai báo những luồng ĐÃ TỒN TẠI trong app; không tạo
//     placeholder không chạy được.
//   - Hàm thuần, không hook, không DOM ⇒ test được bằng vitest.
// ============================================================================

import {
  ClipboardCheck,
  FilePlus2,
  FolderKanban,
  LogOut,
  Plus,
  QrCode,
  User,
  Wrench,
  ArrowLeftRight,
  AlertTriangle,
} from "lucide-react";
import type { AppRole } from "@/hooks/use-session";
import { workspaces, type LucideIcon, type NavItem } from "@/lib/mirats/nav-contract";

export type CommandGroupId = "recent" | "navigate" | "create" | "settings" | "admin" | "help";

export const COMMAND_GROUP_LABEL: Record<CommandGroupId, string> = {
  recent: "Gần đây",
  navigate: "Điều hướng",
  create: "Tạo mới",
  settings: "Cài đặt",
  admin: "Quản trị",
  help: "Trợ giúp",
};

/** Thứ tự hiển thị nhóm trong palette. */
export const COMMAND_GROUP_ORDER: CommandGroupId[] = [
  "recent",
  "create",
  "navigate",
  "settings",
  "admin",
  "help",
];

/** Hành động cục bộ mà palette có thể kích hoạt (đều đã tồn tại trong app). */
export type CommandActionId = "qr-scan" | "logout";

export type CommandTarget =
  | { kind: "navigate"; to: string }
  | { kind: "action"; action: CommandActionId };

export interface AppCommand {
  /** Khoá ổn định, dùng cho recent-list và React key. */
  id: string;
  title: string;
  /** Dòng phụ: phân hệ hoặc mô tả ngắn. */
  description?: string;
  /** Từ khoá bổ trợ cho tìm kiếm (viết thường, có thể không dấu). */
  keywords?: string[];
  group: CommandGroupId;
  icon: LucideIcon;
  shortcut?: string;
  /** Chỉ hiện khi user có ít nhất 1 vai trò trong danh sách. */
  roles?: AppRole[];
  target: CommandTarget;
  /** Hành động cần xác nhận trước khi chạy (vd: đăng xuất). */
  confirm?: { title: string; description: string; actionLabel: string };
}

/** Bỏ dấu tiếng Việt + hạ chữ thường để tìm kiếm khoan dung hơn. */
export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim();
}

function navCommandsFrom(list: Workspaces = workspaces): AppCommand[] {
  const out: AppCommand[] = [];
  const seen = new Set<string>();

  const push = (item: NavItem, workspaceLabel: string, inheritedRoles?: AppRole[]) => {
    if (item.divider || !item.to) return;
    if (seen.has(item.to)) return; // chống lệnh trùng khi route xuất hiện ở 2 phân hệ
    seen.add(item.to);
    out.push({
      id: `nav:${item.to}`,
      title: item.label,
      description: workspaceLabel,
      keywords: [normalizeText(item.label), normalizeText(workspaceLabel), item.to],
      group: "navigate",
      icon: item.icon,
      roles: item.roles ?? inheritedRoles,
      target: { kind: "navigate", to: item.to },
    });
  };

  for (const ws of list) {
    for (const group of ws.groups) {
      for (const item of group.items) {
        push(item, ws.label, ws.roles);
        for (const child of item.children ?? []) {
          push(child, ws.label, child.roles ?? item.roles ?? ws.roles);
        }
      }
    }
  }
  return out;
}

type Workspaces = typeof workspaces;

/** Lệnh tạo mới — tất cả đều trỏ tới route/luồng đã có sẵn. */
const CREATE_COMMANDS: AppCommand[] = [
  {
    id: "create:su-co",
    title: "Báo cáo sự cố mới",
    description: "Mở biểu mẫu ghi nhận sự cố",
    keywords: ["su co", "incident", "bao cao", "moi"],
    group: "create",
    icon: AlertTriangle,
    target: { kind: "navigate", to: "/su-co/moi" },
  },
  {
    id: "create:hong-hoc",
    title: "Khai báo hỏng hóc",
    keywords: ["hong hoc", "loi thiet bi", "bao hong"],
    group: "create",
    icon: Wrench,
    target: { kind: "navigate", to: "/hong-hoc/moi" },
  },
  {
    id: "create:bao-tri",
    title: "Tạo phiếu bảo trì",
    keywords: ["bao tri", "maintenance", "phieu"],
    group: "create",
    icon: Plus,
    target: { kind: "navigate", to: "/bao-tri/moi" },
  },
  {
    id: "create:ban-giao",
    title: "Tạo phiếu bàn giao",
    keywords: ["ban giao", "handover", "dieu chuyen"],
    group: "create",
    icon: ArrowLeftRight,
    target: { kind: "navigate", to: "/ban-giao/moi" },
  },
  {
    id: "create:form",
    title: "Điền biểu mẫu",
    description: "Chọn biểu mẫu trong thư viện",
    keywords: ["bieu mau", "form", "phieu"],
    group: "create",
    icon: FilePlus2,
    target: { kind: "navigate", to: "/forms" },
  },
  {
    id: "create:du-an",
    title: "Mở danh sách dự án",
    keywords: ["du an", "project", "kanban"],
    group: "create",
    icon: FolderKanban,
    target: { kind: "navigate", to: "/du-an" },
  },
  {
    id: "action:kiem-ke",
    title: "Kiểm kê tài sản",
    keywords: ["kiem ke", "inventory", "quet"],
    group: "create",
    icon: ClipboardCheck,
    target: { kind: "navigate", to: "/kiem-ke" },
  },
  {
    id: "action:qr-scan",
    title: "Quét mã QR thiết bị",
    description: "Mở máy quét mã trên thiết bị",
    keywords: ["qr", "quet ma", "scan", "barcode"],
    group: "create",
    icon: QrCode,
    target: { kind: "action", action: "qr-scan" },
  },
];

const SYSTEM_COMMANDS: AppCommand[] = [
  {
    id: "settings:tai-khoan",
    title: "Cài đặt tài khoản",
    keywords: ["tai khoan", "profile", "ho so", "cai dat"],
    group: "settings",
    icon: User,
    target: { kind: "navigate", to: "/cai-dat/tai-khoan" },
  },
  {
    id: "system:logout",
    title: "Đăng xuất",
    description: "Kết thúc phiên làm việc hiện tại",
    keywords: ["dang xuat", "logout", "thoat"],
    group: "settings",
    icon: LogOut,
    target: { kind: "action", action: "logout" },
    confirm: {
      title: "Đăng xuất khỏi hệ thống?",
      description: "Bạn sẽ cần đăng nhập lại để tiếp tục làm việc.",
      actionLabel: "Đăng xuất",
    },
  },
];

/** Toàn bộ lệnh (chưa lọc quyền). */
export function buildCommands(options?: {
  /** Chỉ dùng cho test: thay danh sách phân hệ. */
  workspaceList?: Workspaces;
  /** Route đã tồn tại; lệnh trỏ tới route ngoài tập này sẽ bị loại. */
  knownRoutes?: ReadonlySet<string>;
}): AppCommand[] {
  const all = [
    ...CREATE_COMMANDS,
    ...navCommandsFrom(options?.workspaceList ?? workspaces),
    ...SYSTEM_COMMANDS,
  ];
  const known = options?.knownRoutes;
  if (!known) return all;
  return all.filter((c) => c.target.kind !== "navigate" || known.has(c.target.to));
}

/** Lọc theo vai trò thực tế của người dùng — palette không được vượt quyền. */
export function filterByRole(
  commands: readonly AppCommand[],
  hasRole: (role: AppRole) => boolean,
): AppCommand[] {
  return commands.filter((c) => !c.roles?.length || c.roles.some((r) => hasRole(r)));
}

/** Điểm xếp hạng: khớp chính xác > tiền tố > tiền tố từ > chứa. -1 = loại. */
export function scoreCommand(command: AppCommand, rawQuery: string): number {
  const q = normalizeText(rawQuery);
  if (!q) return 0;
  const title = normalizeText(command.title);
  const haystacks = [
    title,
    normalizeText(command.description ?? ""),
    ...(command.keywords ?? []).map(normalizeText),
  ].filter(Boolean);

  if (title === q) return 100;
  if (title.startsWith(q)) return 80;
  if (title.split(/\s+/).some((w) => w.startsWith(q))) return 60;
  if (title.includes(q)) return 45;
  for (const h of haystacks) {
    if (h === q) return 40;
    if (h.startsWith(q)) return 30;
    if (h.includes(q)) return 15;
  }
  return -1;
}

/** Lọc + xếp hạng ổn định (điểm giảm dần, giữ thứ tự đăng ký khi bằng điểm). */
export function rankCommands(
  commands: readonly AppCommand[],
  query: string,
  limit = 20,
): AppCommand[] {
  if (!query.trim()) return commands.slice(0, limit);
  return commands
    .map((command, index) => ({ command, index, score: scoreCommand(command, query) }))
    .filter((e) => e.score >= 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((e) => e.command);
}

const RECENT_KEY = "mirats:command-palette:recent";
const RECENT_LIMIT = 5;

export function readRecentIds(store: Pick<Storage, "getItem"> | null | undefined): string[] {
  try {
    const raw = store?.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string").slice(0, RECENT_LIMIT);
  } catch {
    return []; // localStorage bị chặn hoặc dữ liệu hỏng ⇒ coi như chưa có lịch sử.
  }
}

export function pushRecentId(existing: readonly string[], id: string): string[] {
  return [id, ...existing.filter((v) => v !== id)].slice(0, RECENT_LIMIT);
}

export function writeRecentIds(
  store: Pick<Storage, "setItem"> | null | undefined,
  ids: readonly string[],
): void {
  try {
    store?.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, RECENT_LIMIT)));
  } catch {
    /* bỏ qua: chế độ riêng tư / hết quota không được làm hỏng palette */
  }
}

/** Gom lệnh theo nhóm, giữ đúng thứ tự nhóm và bỏ nhóm rỗng. */
export function groupCommands(
  commands: readonly AppCommand[],
): Array<{ group: CommandGroupId; label: string; items: AppCommand[] }> {
  return COMMAND_GROUP_ORDER.map((group) => ({
    group,
    label: COMMAND_GROUP_LABEL[group],
    items: commands.filter((c) => c.group === group),
  })).filter((g) => g.items.length > 0);
}
