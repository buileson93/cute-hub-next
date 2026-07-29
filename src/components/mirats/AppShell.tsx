import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  LayoutDashboard, ShieldCheck, Building2, Network, MapPin,
  Package, HeartPulse, Lock, LogIn, LogOut, UserCog, ChevronDown, Menu,
  FileText, FilePlus2, Database, Sparkles, Ticket, MessageSquare, FolderKanban,
  User as UserIcon, Boxes, Layers, Settings2, PanelLeftClose, PanelLeftOpen, Waypoints, Cable,
  LifeBuoy, BookMarked, AlertTriangle, Wrench, ArrowLeftRight, DatabaseBackup, Upload, CalendarClock, ClipboardCheck, ClipboardList, QrCode, ImageUp, Factory, Truck, Tag, Bug, Bell, RotateCcw,
} from "lucide-react";
import {
  ProductTourProvider, useProductTour, type TourStep,
} from "@/components/mirats/ProductTour";
import { UserAvatar } from "@/components/mirats/UserAvatar";
import { useBranding } from "@/lib/mirats/branding";
import vatmLogoFullSrc from "@/assets/vatm-emblem.png";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/mirats/GlobalSearch";
import { TzClock } from "@/components/mirats/TzClock";
import { AiChatButton } from "@/components/mirats/AiChatButton";

import { CommandPaletteButton } from "@/components/mirats/CommandPaletteButton";
import { QrScanButton } from "@/components/mirats/QrScanButton";
import { RecentPinnedRailButton } from "@/components/mirats/RecentPinnedRailButton";
import { RecentPinnedPanel } from "@/components/mirats/RecentPinnedFlyout";
import { useRouteTracker } from "@/hooks/use-route-tracker";
// DensityToggle đã chuyển vào trang Cài đặt tài khoản
import { NotificationBell } from "@/components/mirats/NotificationBell";
import { CommandPalette } from "@/components/mirats/CommandPalette";
import { supabase } from "@/integrations/backend/client";
import { useSession, type AppRole } from "@/hooks/use-session";
import { useQueryClient } from "@tanstack/react-query";
import { resetUserPrefs } from "@/hooks/use-user-pref";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetTrigger, SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// Hợp đồng điều hướng (menu / workspace / breadcrumb / quyền hiển thị) được
// tách ra src/lib/mirats/nav-contract.ts làm nguồn duy nhất, có test đặc tả.
import {
  type NavItem,
  type Workspace,
  workspaces,
  routeTitles,
  itemMatchScore,
  isItemActive,
  resolveActiveWorkspace,
  firstItemOf,
  flattenWorkspaceItems,
  isDivider,
} from "@/lib/mirats/nav-contract";
import { navGroups as miratsNavGroups, type NavBadgeKey } from "@/lib/mirats/nav/nav-config";
import { useNavBadges } from "@/hooks/use-nav-badges";

// Bảng tra badge theo route (nguồn: nav-config). Tính 1 lần ở tầng module.
const BADGE_BY_ROUTE: Record<string, NavBadgeKey> = (() => {
  const m: Record<string, NavBadgeKey> = {};
  for (const g of miratsNavGroups()) {
    for (const it of g.items) if (it.badgeKey) m[it.route] = it.badgeKey;
  }
  return m;
})();


function BrandMark({ className }: { className?: string }) {
  const { data } = useBranding();
  const src = data?.logoCompact || vatmLogoFullSrc;
  return (
    <img
      src={src}
      alt="VATM MIRATS"
      loading="eager"
      decoding="async"
      className={cn("h-7 w-auto max-w-[190px] object-contain select-none", className)}
    />
  );
}



/* ---- Product Tour: các bước hướng dẫn người dùng ---- */
const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="rail"]',
    title: "Thanh không gian làm việc",
    content: "Rê chuột để bung phân hệ, bấm để mở nhanh.",
    placement: "right",
    optional: true,
  },
  {
    selector: '[data-tour="search"]',
    title: "Tìm kiếm nhanh",
    content: "Gõ để tìm khắp hệ thống. Mẹo: Ctrl/⌘ + K.",
    placement: "bottom",
    optional: true,
  },
  {
    selector: '[data-tour="ai"]',
    title: "Trợ lý MIRATS AI",
    content: "Hỏi AI về dữ liệu và nhờ hỗ trợ nhập liệu.",
    placement: "left",
  },
  {
    selector: '[data-tour="notify"]',
    title: "Thông báo thời gian thực",
    content: "Nhận cảnh báo công việc, sự cố, tin nhắn liên quan.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="help"]',
    title: "Mở lại hướng dẫn",
    content: "Bấm đây để xem lại tour bất cứ lúc nào.",
    placement: "bottom",
  },
];


/** Nút mở lại tour hướng dẫn (đặt trên thanh trên cùng). */
function TourButton() {
  const { start } = useProductTour();
  const reduce = useReducedMotion();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          type="button"
          data-tour="help"
          onClick={() => start({ force: true })}
          whileHover={reduce ? undefined : { scale: 1.06 }}
          whileTap={reduce ? undefined : { scale: 0.92 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Hướng dẫn sử dụng"
        >
          <LifeBuoy className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Hướng dẫn sử dụng</TooltipContent>
    </Tooltip>
  );
}

/** Tự động mở tour MỘT LẦN cho mỗi tài khoản ở lần đăng nhập đầu tiên. */
function TourAutoStart({
  userId,
  seen,
  onSeen,
}: {
  userId: string | null;
  seen: boolean;
  onSeen: () => void;
}) {
  const { start } = useProductTour();
  const ran = useRef(false);
  useEffect(() => {
    if (!userId || seen || ran.current) return;
    ran.current = true;
    const t = setTimeout(() => {
      start({ force: true });
      // Đánh dấu đã xem cho tài khoản này (đồng bộ với cơ sở dữ liệu),
      // để lần sau chỉ mở khi bấm nút hướng dẫn.
      void supabase
        .from("profiles")
        .update({ tour_hoan_thanh: true })
        .eq("id", userId)
        .then(() => onSeen());
    }, 900);
    return () => clearTimeout(t);
  }, [userId, seen, start, onSeen]);
  return null;
}


export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, profile, roles, hasRole, loading, refresh } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const reduce = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  useRouteTracker();

  const [collapsed, setCollapsed] = useState(false);
  const navBadges = useNavBadges();
  const [wsLastRoute, setWsLastRoute] = useState<Record<string, string>>({});
  // Trạng thái thu gọn của các mục cha (keyed theo `to`); undefined = dùng mặc định.
  const [openNav, setOpenNav] = useState<Record<string, boolean>>({});
  const hoverOpenedRef = useRef<Record<string, boolean>>({});

  // Phân hệ đang được rê chuột để bung menu bay (flyout) trên thanh rail.
  const [flyoutWs, setFlyoutWs] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openFlyout(id: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setFlyoutWs(id);
  }
  function scheduleCloseFlyout() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setFlyoutWs(null), 140);
  }
  function closeFlyoutNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setFlyoutWs(null);
  }

  useEffect(() => {
    setCollapsed(localStorage.getItem("mirats-sidebar-collapsed") === "1");
    try {
      const raw = localStorage.getItem("mirats-ws-last-route");
      if (raw) setWsLastRoute(JSON.parse(raw) as Record<string, string>);
    } catch {
      /* ignore */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem("mirats-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  const visibleWorkspaces = useMemo(
    () => workspaces.filter((ws) => !ws.roles || ws.roles.some((r) => hasRole(r))),
    [roles], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Thanh rail bỏ "Trao đổi" (đã có trong nút AI ở góc dưới) và tách "Quản trị hệ thống"
  // xuống dưới cùng như một mục cài đặt (bánh răng).
  const railWorkspaces = useMemo(
    () => visibleWorkspaces.filter((w) => w.id !== "trao-doi" && w.id !== "he-thong"),
    [visibleWorkspaces],
  );
  const adminWs = useMemo(
    () => visibleWorkspaces.find((w) => w.id === "he-thong") ?? null,
    [visibleWorkspaces],
  );

  const activeWsId = resolveActiveWorkspace(pathname);
  const activeWs =
    visibleWorkspaces.find((w) => w.id === activeWsId) ?? visibleWorkspaces[0] ?? workspaces[0];

  // Nhớ trang cuối đã xem theo từng workspace
  useEffect(() => {
    setWsLastRoute((prev) => {
      if (prev[activeWs.id] === pathname) return prev;
      const next = { ...prev, [activeWs.id]: pathname };
      localStorage.setItem("mirats-ws-last-route", JSON.stringify(next));
      return next;
    });
  }, [activeWs.id, pathname]);

  function gotoWorkspace(ws: Workspace, onDone?: () => void) {
    // Chỉ dùng lại trang đã ghi nhớ nếu nó vẫn thuộc workspace này
    // (menu có thể đã được chuyển sang phân hệ khác → tránh nhảy nhầm).
    const remembered = wsLastRoute[ws.id];
    const target =
      remembered && resolveActiveWorkspace(remembered) === ws.id
        ? remembered
        : firstItemOf(ws, hasRole);
    navigate({ to: target as never });
    onDone?.();
  }

  const mobileWorkspaces = useMemo(() => {
    const list = [...railWorkspaces, ...(adminWs ? [adminWs] : [])];
    // Đưa "Vận hành" vào chính giữa thanh điều hướng dưới cùng.
    const vh = list.find((w) => w.id === "van-hanh");
    if (!vh) return list;
    const rest = list.filter((w) => w.id !== "van-hanh");
    const mid = Math.floor(rest.length / 2);
    return [...rest.slice(0, mid), vh, ...rest.slice(mid)];
  }, [railWorkspaces, adminWs]);
  const mobileLabelsHidden = mobileWorkspaces.length > 5;

  // Danh sách chức năng của phân hệ đang mở → thanh công cụ chuyển tính năng (mobile).
  const featureItems = useMemo(
    () => flattenWorkspaceItems(activeWs, hasRole),
    [activeWs, roles], // eslint-disable-line react-hooks/exhaustive-deps
  );
  // Chèn nút "Quét QR" vào giữa thanh công cụ của phân hệ Vận hành.
  const showQrChip = activeWs.id === "van-hanh";

  // Khối icon vuông cho từng chức năng (thanh công cụ mobile).
  function renderFeatureBlock(item: NavItem) {
    const Icon = item.icon;
    const active = isItemActive(item, pathname);
    return (
      <Link
        key={item.to}
        to={item.to as never}
        aria-label={item.label}
        className="flex flex-col items-center gap-1.5 rounded-xl px-0.5 py-1 transition-transform active:scale-95"
      >
        <span
          className={cn(
            "grid h-14 w-14 place-items-center rounded-2xl border transition-colors",
            active
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : "border-border bg-card text-muted-foreground",
          )}
        >
          <Icon className="h-6 w-6 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
        </span>
        <span
          className={cn(
            "line-clamp-2 w-full text-center text-[11px] font-medium leading-tight",
            active ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {item.label}
        </span>
      </Link>
    );
  }

  const qrBlock = (
    <button
      key="__qr"
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("mirats:open-qr-scanner"))}
      aria-label="Quét mã QR"
      className="flex flex-col items-center gap-1.5 rounded-xl px-0.5 py-1 transition-transform active:scale-95"
    >
      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-primary/40 bg-primary/10 text-primary">
        <QrCode className="h-6 w-6 shrink-0" strokeWidth={2.2} />
      </span>
      <span className="line-clamp-2 w-full text-center text-[11px] font-semibold leading-tight text-primary">
        Quét QR
      </span>
    </button>
  );


  const currentMeta =
    routeTitles[pathname] ??
    Object.entries(routeTitles).find(([k]) => k !== "/" && pathname.startsWith(k))?.[1] ??
    { crumb: "MIRATS", title: "" };

  async function handleSignOut() {
    // Dừng mọi query đang chạy TRƯỚC khi xoá session để tránh 401 storm
    // gây ra errorComponent "Lỗi không xác định" trên các route đang mở.
    try {
      await qc.cancelQueries();
      qc.clear();
    } catch {
      /* ignore — chỉ là dọn cache */
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // "Auth session missing" và các lỗi hết phiên không phải lỗi thật khi đăng xuất.
      console.warn("[signOut] bỏ qua lỗi khi đăng xuất:", e);
    }
    toast.success("Đã đăng xuất");
    // Hard redirect để đảm bảo mọi state client (query cache, realtime channel,
    // subscription) được dọn sạch — tránh race với router.invalidate của auth listener.
    if (typeof window !== "undefined") {
      window.location.replace("/auth");
    } else {
      navigate({ to: "/auth", replace: true });
    }
  }

  function renderSidebarGroups(
    ws: Workspace,
    opts?: { onNavigate?: () => void; collapsed?: boolean },
  ) {
    const collapsed = opts?.collapsed ?? false;
    const onNavigate = opts?.onNavigate;

    const renderLink = (n: NavItem, indent = false) => {
      const active = isItemActive(n, pathname);
      const Icon = n.icon;
      const link = (
        <Link
          to={n.to as never}
          onClick={onNavigate}
          aria-label={n.label}
          className={cn(
            "group relative flex items-center rounded-xl text-sm font-medium transition-colors",
            collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5",
            indent && !collapsed && "py-2 text-[13px]",
            active
              ? "text-accent-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          {active && (
            <motion.span
              layoutId={collapsed ? "sidebar-active-pill-mini" : "sidebar-active-pill"}
              className="absolute inset-0 -z-0 rounded-xl bg-accent shadow-sm shadow-primary/10"
              transition={
                reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }
              }
            />
          )}
          <Icon
            className={cn(
              "relative shrink-0 transition-colors",
              indent && !collapsed ? "h-4 w-4" : "h-[18px] w-[18px]",
              active ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground",
            )}
            strokeWidth={active ? 2.2 : 1.8}
          />
          {!collapsed && <span className="relative truncate">{n.label}</span>}
          {(() => {
            const bk = BADGE_BY_ROUTE[n.to];
            const n_ = bk ? navBadges[bk] : 0;
            if (!bk || !n_) return null;
            if (collapsed) {
              return (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
                  {n_ > 99 ? "99+" : n_}
                </span>
              );
            }
            return (
              <span className="relative ml-auto grid h-5 min-w-[20px] place-items-center rounded-full bg-destructive px-1.5 text-[10.5px] font-bold leading-none text-destructive-foreground">
                {n_ > 99 ? "99+" : n_}
              </span>
            );
          })()}
        </Link>
      );
      return (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{n.label}</TooltipContent>
        </Tooltip>
      );
    };

    return ws.groups.map((group) => {
      const items = group.items.filter((n) => !n.roles || n.roles.some((r) => hasRole(r)));
      if (items.length === 0) return null;
      return (
        <div key={group.header}>
          {!collapsed && (
            <div className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
              {group.header}
            </div>
          )}
          <div className="space-y-1">
            {items.map((n) => {
              const kids = (n.children ?? []).filter((c) => isDivider(c) || !c.roles || c.roles.some((r) => hasRole(r)));
              const linkKids = kids.filter((c) => !isDivider(c));
              if (linkKids.length === 0 || collapsed) {
                return <div key={n.to}>{renderLink(n)}</div>;
              }
              const childActive = linkKids.some((c) => isItemActive(c, pathname));
              const open = openNav[n.to] ?? (isItemActive(n, pathname) || childActive);
              let hoverCloseTimer: ReturnType<typeof setTimeout> | null = null;
              const handleEnter = () => {
                if (hoverCloseTimer) { clearTimeout(hoverCloseTimer); hoverCloseTimer = null; }
                // Chỉ đánh dấu "mở-do-hover" nếu trước đó nó ĐANG đóng — để không đóng nhầm submenu đang mở sẵn (active) khi mouse chỉ đi ngang qua.
                if (!open) {
                  hoverOpenedRef.current[n.to] = true;
                  setOpenNav((p) => ({ ...p, [n.to]: true }));
                }
              };
              const handleLeave = (e: React.MouseEvent) => {
                // Chỉ đóng nếu submenu này được mở bởi hover (không phải do active/click).
                if (!hoverOpenedRef.current[n.to]) return;
                // Giữ mở nếu rê sang phải (ra ngoài sidebar). Đóng khi rời xuống dưới / lên trên / sang trái.
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                if (e.clientX >= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) return;
                hoverCloseTimer = setTimeout(() => {
                  hoverOpenedRef.current[n.to] = false;
                  setOpenNav((p) => ({ ...p, [n.to]: false }));
                }, 150);
              };


              return (
                <div key={n.to} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 min-w-0">{renderLink(n)}</div>
                    <button
                      type="button"
                      aria-label={open ? `Thu gọn ${n.label}` : `Mở rộng ${n.label}`}
                      onClick={() => setOpenNav((p) => ({ ...p, [n.to]: !open }))}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <ChevronDown className={cn("h-4 w-4 transition-transform", open ? "" : "-rotate-90")} />
                    </button>
                  </div>
                  {open && (
                    <div className="mt-1 ml-4 space-y-1 border-l border-border/60 pl-2">
                      {kids.map((c) =>
                        isDivider(c) ? (
                          <div
                            key={c.to}
                            className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70"
                          >
                            {c.label}
                          </div>
                        ) : (
                          <div key={c.to}>{renderLink(c, true)}</div>
                        ),
                      )}
                    </div>
                  )}
                </div>

              );
            })}
          </div>
        </div>
      );
    });
  }

  /** Một mục trên thanh rail: bấm để mở phân hệ, rê chuột để bung menu flyout. */
  const renderRailItem = (ws: Workspace, opts?: { settings?: boolean }) => {
    const Icon = ws.icon;
    const active = ws.id === activeWs.id;
    const open = flyoutWs === ws.id;
    return (
      <div
        key={ws.id}
        className="relative"
        onMouseEnter={() => openFlyout(ws.id)}
        onMouseLeave={scheduleCloseFlyout}
      >
        <button
          type="button"
          onClick={() => gotoWorkspace(ws)}
          aria-label={ws.label}
          className={cn(
            "flex w-[54px] flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[9.5px] font-medium transition-colors",
            active
              ? "bg-accent text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
          <span className="w-full truncate text-center leading-tight">{ws.short}</span>
        </button>
        {open && (
          <div className={cn("absolute left-full z-50 pl-2", opts?.settings ? "bottom-0" : "top-0")}>
            <div className="max-h-[80vh] w-64 overflow-y-auto rounded-2xl border border-sidebar-border bg-popover p-3 text-popover-foreground shadow-xl">
              <div className="flex items-center gap-2 px-1 pb-2.5">
                <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
                <span className="text-sm font-bold text-foreground">{ws.label}</span>
              </div>
              <div className="space-y-4">
                {renderSidebarGroups(ws, { onNavigate: closeFlyoutNow })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const userCard = loading ? (
    <div className="h-11 animate-pulse rounded-xl bg-muted" />
  ) : session && profile ? (
    <div className="flex items-center gap-3 rounded-xl bg-card px-3 py-2.5 shadow-sm">
      <UserAvatar name={profile.ho_ten} email={profile.email} url={profile.avatar_url} className="h-9 w-9" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{profile.ho_ten ?? profile.email}</div>
        <div className="truncate text-[11px] text-muted-foreground">
          {roles.length ? roles.join(" · ") : "chưa có vai trò"}
        </div>
      </div>
    </div>
  ) : (
    <Button asChild size="sm" variant="outline" className="w-full rounded-xl">
      <Link to="/auth">
        <LogIn className="mr-2 h-3.5 w-3.5" />
        Đăng nhập
      </Link>
    </Button>
  );

  return (
    <ProductTourProvider steps={TOUR_STEPS}>
    <TourAutoStart
      userId={!loading && session && profile ? profile.id : null}
      seen={profile?.tour_hoan_thanh ?? true}
      onSeen={refresh}
    />
    <TooltipProvider delayDuration={300}>
    <div className="flex min-h-dvh w-full bg-gradient-to-br from-background via-background to-primary/[0.045] text-foreground">
      {/* Thanh rail duy nhất — rê chuột để bung menu flyout, bấm để mở phân hệ (desktop) */}
      <aside className="hidden w-16 shrink-0 flex-col items-center border-r border-sidebar-border bg-gradient-to-b from-sidebar via-sidebar to-sidebar/92 py-4 md:flex">
        <a
          href="https://vatm.vn"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="VATM — mở vatm.vn trong tab mới"
          className="group relative mb-5 grid h-12 w-12 place-items-center rounded-2xl transition-colors duration-[var(--duration-base)] hover:bg-sidebar-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        >
          <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-primary text-primary-foreground font-black text-xl leading-none transition-transform duration-[var(--duration-slow)] ease-out will-change-transform group-hover:scale-[1.06] group-active:scale-95">
            M
          </span>

          {/* Sau ~2s hover → hiện logo full to nổi bên phải */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-full top-1/2 z-[70] ml-6 flex -translate-y-1/2 items-center rounded-3xl border border-border/60 bg-popover/95 px-10 py-8 opacity-0 scale-75 shadow-2xl ring-1 ring-black/5 backdrop-blur-md transition-all duration-[var(--duration-slow)] ease-out group-hover:opacity-100 group-hover:scale-100 group-hover:delay-[2000ms]"
          >
            <img src={vatmLogoFullSrc} alt="" aria-hidden="true" draggable={false} className="h-40 w-auto object-contain md:h-56 lg:h-72" />
          </span>
        </a>

        <nav data-tour="rail" className="flex flex-1 flex-col items-center gap-1.5">
          {railWorkspaces.map((ws) => renderRailItem(ws))}
        </nav>
        <div className="mt-2 border-t border-sidebar-border pt-2">
          {session && <RecentPinnedRailButton />}
        </div>
        {adminWs && (
          <div className="mt-1 border-t border-sidebar-border pt-2">
            {renderRailItem(adminWs, { settings: true })}
          </div>
        )}
      </aside>




      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-background/90 via-background/80 to-primary/[0.06] px-4 backdrop-blur-md md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {/* Nút menu (mobile) */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Mở menu điều hướng">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[86vw] max-w-sm overflow-y-auto p-0">
                <div className="flex h-full flex-col">
                  <div className="flex h-16 items-center border-b border-border px-5">
                    <SheetTitle asChild>
                      <span className="sr-only">Menu điều hướng</span>
                    </SheetTitle>
                    <BrandMark />
                  </div>

                  {/* Danh mục dọc: từng workspace là một mục có tiêu đề riêng */}
                  <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
                    {mobileWorkspaces.map((ws) => {
                      const Icon = ws.icon;
                      const wsActive = ws.id === activeWs.id;
                      return (
                        <div key={ws.id}>
                          <div className="flex items-center gap-2 px-3 pb-2">
                            <Icon
                              className={cn("h-4 w-4", wsActive ? "text-primary" : "text-muted-foreground")}
                              strokeWidth={2}
                            />
                            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                              {ws.label}
                            </span>
                          </div>
                          <div className="space-y-4">
                            {renderSidebarGroups(ws, { onNavigate: () => setMobileOpen(false) })}
                          </div>
                        </div>
                      );
                    })}
                    {session && (
                      <div>
                        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                          Ghim & Gần đây
                        </div>
                        <div className="px-2">
                          <RecentPinnedPanel onNavigate={() => setMobileOpen(false)} />
                        </div>
                      </div>
                    )}
                  </nav>

                  <div className="border-t border-border p-4">{userCard}</div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center md:hidden">
              <BrandMark className="max-w-[150px]" />
            </div>

            {/* Logo full trên desktop */}
            <a
              href="https://vatm.vn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mở vatm.vn"
              className="hidden shrink-0 items-center md:flex"
            >
              <img
                src={vatmLogoFullSrc}
                alt="VATM MIRATS"
                draggable={false}
                className="h-9 w-auto object-contain transition-transform duration-[var(--duration-base)] hover:scale-105"
              />
            </a>


            {/* Global search */}
            <div data-tour="search" className="hidden min-w-0 flex-1 sm:block">
              <GlobalSearch />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 lg:gap-2">
            {/* Đồng hồ + timezone */}
            <TzClock />

            {/* Chế độ Gọn/Thường: chuyển vào Cài đặt tài khoản */}




            {/* Nút hướng dẫn sử dụng */}
            <TourButton />

            {/* Nút mở Bảng lệnh (Cmd/Ctrl + K) */}
            <CommandPaletteButton />

            {/* Nút quét QR (GĐ3-04) */}
            <QrScanButton />

            {/* Notification bell (realtime) */}
            <span data-tour="notify" className="inline-flex">
              <NotificationBell />
            </span>



            {loading ? null : session && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    data-tour="user"
                    className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm transition-colors hover:bg-secondary"
                  >
                    <UserAvatar name={profile.ho_ten} email={profile.email} url={profile.avatar_url} className="h-8 w-8" />
                    <div className="hidden text-left leading-tight sm:block">
                      <div className="max-w-[120px] truncate text-[13px] font-semibold text-foreground">
                        {profile.ho_ten ?? profile.email.split("@")[0]}
                      </div>
                      <div className="text-[10.5px] text-muted-foreground">
                        {roles[0] ?? "—"}
                      </div>
                    </div>
                    <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="text-xs font-medium">{profile.email}</div>
                    <div className="text-[10.5px] font-normal text-muted-foreground">
                      {profile.ho_ten ?? "—"}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full font-mono text-[10px] tracking-wider">
                        {hasRole("admin") || hasRole("phong_kt")
                          ? "TOÀN HỆ THỐNG"
                          : `ĐV: ${profile.don_vi ?? "—"}`}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link to="/cai-dat/tai-khoan">
                      <UserIcon className="mr-2 h-3.5 w-3.5" />
                      Tài khoản của tôi
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/cai-dat/thong-bao">
                      <Bell className="mr-2 h-3.5 w-3.5" />
                      Thông báo Telegram
                    </a>
                  </DropdownMenuItem>
                  {hasRole("admin") && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin/users">
                        <UserCog className="mr-2 h-3.5 w-3.5" />
                        Quản lý tài khoản
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onSelect={async () => {
                      try {
                        await resetUserPrefs();
                        await qc.invalidateQueries({ queryKey: ["user-pref"] });
                        toast.success("Đã khôi phục cấu hình giao diện mặc định");
                      } catch (e) {
                        toast.error("Không thể khôi phục", { description: (e as Error).message });
                      }
                    }}
                  >
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Khôi phục giao diện mặc định
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={handleSignOut}
                    className="text-rose-600 focus:text-rose-700"
                  >
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link to="/auth">
                  <LogIn className="mr-2 h-3.5 w-3.5" />
                  Đăng nhập
                </Link>
              </Button>
            )}
          </div>
        </header>

        {/* Thanh tìm kiếm cho mobile hẹp */}
        <div className="border-b border-border px-4 py-2 sm:hidden">
          <GlobalSearch />
        </div>

        {/* Tiêu đề tính năng + thanh công cụ chuyển tính năng (mobile) */}
        <div className="border-b border-border bg-background/95 backdrop-blur-md md:hidden">
          {currentMeta.title && (
            <div className="px-4 pt-3 text-center">
              <h1 className="truncate text-[15px] font-bold text-foreground">
                {currentMeta.title}
              </h1>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {activeWs.label}
              </p>
            </div>
          )}
          {(featureItems.length > 1 || showQrChip) && (
            showQrChip ? (
              (() => {
                const primary = featureItems.slice(0, 4);
                const rest = featureItems.slice(4);
                // Chèn nút Quét QR vào giữa các chức năng chính.
                const mid = Math.ceil(primary.length / 2);
                const cols = Math.min(primary.length + 1, 5);
                return (
                  <div className="px-3 py-3">
                    {/* Chức năng chính + Quét QR ở giữa */}
                    <div
                      className="grid gap-x-1 gap-y-3"
                      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                    >
                      {primary.slice(0, mid).map((item) => renderFeatureBlock(item))}
                      {qrBlock}
                      {primary.slice(mid).map((item) => renderFeatureBlock(item))}
                    </div>
                    {rest.length > 0 && (
                      <>
                        <div className="mt-3 flex justify-center">
                          <button
                            type="button"
                            onClick={() => setMoreOpen((v) => !v)}
                            aria-expanded={moreOpen}
                            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors active:scale-95"
                          >
                            {moreOpen ? "Thu gọn" : "Tính năng khác"}
                            <ChevronDown
                              className={cn("h-3.5 w-3.5 shrink-0 transition-transform", moreOpen && "rotate-180")}
                            />
                          </button>
                        </div>
                        {moreOpen && (
                          <div className="mt-3 grid grid-cols-4 gap-x-1 gap-y-3 border-t border-border pt-3">
                            {rest.map((item) => renderFeatureBlock(item))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="grid grid-cols-4 gap-x-1 gap-y-3 px-3 py-3">
                {featureItems.map((item) => renderFeatureBlock(item))}
              </div>
            )
          )}


        </div>

        <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>


        {/* Thanh điều hướng dưới cùng (mobile) */}
        <nav className="fixed inset-x-0 bottom-0 z-20 flex items-stretch gap-1 border-t border-border bg-background/95 px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md md:hidden">
          {mobileWorkspaces.map((ws) => {
            const Icon = ws.icon;
            const active = ws.id === activeWs.id;
            return (
              <button
                key={ws.id}
                type="button"
                onClick={() => gotoWorkspace(ws)}
                aria-label={ws.label}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-colors",
                  active ? "bg-accent text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                {!mobileLabelsHidden && (
                  <span className="w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight">
                    {ws.short}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <AiChatButton />
      <CommandPalette />

    </div>
    </TooltipProvider>
    </ProductTourProvider>
  );
}
