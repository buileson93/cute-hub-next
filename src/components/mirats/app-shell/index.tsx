import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isFeatureEnabled } from "@/lib/mirats/feature-flags";

import { motion, useReducedMotion } from "motion/react";
import {
  ChevronDown, LogIn, LogOut, RotateCcw, UserCog, User as UserIcon, Bell, LifeBuoy, LogOut as LogOutIcon, LayoutPanelLeft, LayoutPanelTop
} from "lucide-react";
import {
  ProductTourProvider, useProductTour, type TourStep,
} from "@/components/mirats/ProductTour";
import { useBranding } from "@/lib/mirats/branding";
import vatmMark from "@/assets/vatm-mark-square.svg.asset.json";
import vatmLogoFull from "@/assets/vatm-mirats-full-v2.svg.asset.json";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { useQueryClient } from "@tanstack/react-query";
import { resetUserPrefs, useUserPref } from "@/hooks/use-user-pref";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/mirats/UserAvatar";
import { UiDensityMode } from "@/lib/mirats/ui/ui-density";

const vatmLogoFullSrc = vatmLogoFull.url;
const vatmMarkSrc = vatmMark.url;

export function BrandMark({ className }: { className?: string }) {
  const { data } = useBranding();
  const src = data?.logoCompact || vatmMarkSrc;
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

export function SidebarLogoRail() {
  return (
    <a
      href="https://vatm.vn"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="VATM — mở vatm.vn trong tab mới"
      className="group relative mb-4 data-[density=compact]:mb-2 grid h-12 w-12 data-[density=compact]:h-11 data-[density=compact]:w-11 place-items-center rounded-2xl transition-mirats-base hover:bg-sidebar-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0074e2] focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
    >
      <span className="grid h-11 w-11 data-[density=compact]:h-9 data-[density=compact]:w-9 place-items-center overflow-hidden rounded-xl bg-[#0074e2] text-primary-foreground font-black text-xl leading-none transition-mirats-slow group-hover:scale-[1.02] group-active:scale-[var(--scale-active)]">
        M
      </span>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-full top-1/2 z-[70] ml-6 flex -translate-y-1/2 items-center rounded-3xl border border-border/60 bg-popover/95 px-10 py-8 opacity-0 scale-95 shadow-2xl ring-1 ring-black/5 backdrop-blur-md transition-mirats-base group-hover:opacity-100 group-hover:scale-100 group-hover:delay-[1000ms]"
      >
        <img src={vatmLogoFullSrc} alt="" aria-hidden="true" draggable={false} className="h-40 w-auto object-contain md:h-56 lg:h-72" />
      </span>
    </a>
  );
}

export function UserMenu() {
  const { profile, roles, hasRole, loading, session } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [density, setDensity] = useUserPref<UiDensityMode>("ui-density", "compact");
  const isInventoryMode = useMemo(() => isFeatureEnabled("astryxInventoryMode"), []);



  async function handleSignOut() {
    try {
      await qc.cancelQueries();
      qc.clear();
    } catch { /* ignore */ }
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("[signOut] handle error:", e);
    }
    toast.success("Đã đăng xuất");
    if (typeof window !== "undefined") {
      window.location.replace("/auth");
    } else {
      navigate({ to: "/auth", replace: true });
    }
  }

  if (loading) return null;

  if (session && profile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-tour="user"
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm transition-colors hover:bg-[#0074e2]/10"
          >
            <UserAvatar name={profile.ho_ten} email={profile.email} url={profile.avatar_url} className="h-8 w-8" />
            <div className="hidden text-left leading-tight sm:block">
              <div className="max-w-[120px] truncate text-[13px] font-semibold text-foreground">
                {typeof profile.ho_ten === 'string' ? profile.ho_ten : profile.email.split("@")[0]}
              </div>
              <div className="text-[10.5px] text-muted-foreground">
                {typeof roles[0] === 'string' ? roles[0] : "—"}
              </div>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="text-xs font-medium">{profile.email}</div>
            <div className="text-[10.5px] font-normal text-muted-foreground">
              {typeof profile.ho_ten === 'string' ? profile.ho_ten : "—"}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="rounded-full font-mono text-[10px] tracking-wider">
                {hasRole("admin") || hasRole("phong_kt")
                  ? "TOÀN HỆ THỐNG"
                  : `ĐV: ${typeof profile.don_vi === 'string' ? profile.don_vi : (profile.don_vi as any)?.ten ?? String(profile.don_vi ?? "—")}`}
              </Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {isInventoryMode ? (
            <div className="px-2 py-1.5">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                Visual Contract & Source Fidelity
              </div>
              <ScrollArea className="h-[350px] w-full rounded-md border bg-muted/30 p-2 font-mono text-[10px] leading-relaxed">
                <div className="whitespace-pre-wrap text-muted-foreground">
                  Xây lớp giao diện MIRATS giống demo Astryx theo source chính thức, nhưng không import React component từ @astryxdesign/core/* vào route production.{"\n\n"}
                  MỤC TIÊU CHÍNH XÁC:{"\n"}
                  - Không mô phỏng bằng mắt.{"\n"}
                  - Không viết lại từ screenshot.{"\n"}
                  - Không tự chọn màu, radius, shadow, spacing hoặc animation “gần giống”.{"\n"}
                  - Nguồn duy nhất là repo, compiled CSS, Storybook và demo Astryx tại commit/version đã pin.{"\n"}
                  - Giữ behavior shadcn/Radix đang hoạt động; thay visual contract và state mapping theo Astryx.{"\n\n"}
                  RANH GIỚI:{"\n"}
                  - Production được dùng static reset/theme/token/component CSS đã vendor hoặc build từ upstream đã pin.{"\n"}
                  - Production không import Button, Dialog, AppShell, Table hoặc component React khác từ @astryxdesign/core/*.{"\n"}
                  - Official component chỉ render trong dev-only reference harness để tạo ảnh, DOM/state inventory và computed-style baseline.{"\n"}
                  - Không bundle reference harness vào production.{"\n\n"}
                  BƯỚC 1 — THU THẬP NGUYÊN GỐC:{"\n"}
                  1. Checkout commit 683015aa9b3f4ba258dc7e4c8f2cc274afce46a5.{"\n"}
                  2. Đọc source, StyleX style, docs, test và Storybook của từng component.{"\n"}
                  3. Build upstream CSS bằng toolchain chính thức hoặc lấy compiled CSS đúng package version.{"\n"}
                  4. Lưu source URL, commit, version, license và SHA-256 của file tham chiếu.{"\n"}
                  5. Không dùng nhánh main thay đổi theo thời gian.{"\n\n"}
                  BƯỚC 2 — TẠO STATIC CSS VENDOR:{"\n"}
                  - vendor/astryx-v0.4.5/reset.css{"\n"}
                  - vendor/astryx-v0.4.5/astryx.css hoặc CSS subset đã build chính thức{"\n"}
                  - vendor/astryx-v0.4.5/theme-stone.css{"\n"}
                  - vendor/astryx-v0.4.5/tailwind-theme.css nếu MIRATS dùng bridge này{"\n"}
                  - vendor/astryx-v0.4.5/LICENSE{"\n"}
                  - vendor/astryx-v0.4.5/NOTICE.md{"\n"}
                  - vendor/astryx-v0.4.5/manifest.json{"\n\n"}
                  Không chỉnh trực tiếp file vendor. Override MIRATS phải nằm trong layer/app stylesheet riêng và có lý do được ghi lại.{"\n\n"}
                  BƯỚC 3 — CSS LAYER:{"\n"}
                  Dùng canonical order của version đã pin:{"\n"}
                  @layer reset, theme, base, astryx-base, astryx-theme, components, utilities;{"\n\n"}
                  - Reset vào reset.{"\n"}
                  - Tailwind preflight vào base.{"\n"}
                  - Astryx component CSS vào astryx-base.{"\n"}
                  - Theme vào astryx-theme.{"\n"}
                  - MIRATS component mapping vào components.{"\n"}
                  - App layout utilities vào utilities.{"\n"}
                  - Không để stylesheet unlayered thắng toàn hệ thống.{"\n"}
                  - Không dùng !important.{"\n\n"}
                  BƯỚC 4 — TÁI TẠO ANATOMY VÀ STATE:{"\n"}
                  Với mỗi local component, lập bảng đối chiếu upstream {"->"} MIRATS:{"\n"}
                  - root element{"\n"}
                  - child/slot order{"\n"}
                  - stable `.astryx-*` class{"\n"}
                  - data-variant{"\n"}
                  - data-size{"\n"}
                  - data-state{"\n"}
                  - disabled/aria-disabled{"\n"}
                  - loading{"\n"}
                  - selected/checked{"\n"}
                  - invalid{"\n"}
                  - open/closed{"\n"}
                  - icon slots{"\n"}
                  - label/supporting/status slots{"\n\n"}
                  Local component phải phát đúng stable class và data attributes mà static Astryx CSS cần. Không sao chép atomic/hash class do StyleX sinh nếu class đó không phải public stable surface.{"\n\n"}
                  BƯỚC 5 — VISUAL VÀ MOTION:{"\n"}
                  Sao chép nguyên contract từ source đã pin:{"\n"}
                  - semantic color tokens{"\n"}
                  - typography và Figtree font loading{"\n"}
                  - icon family, stroke và exact size{"\n"}
                  - spacing{"\n"}
                  - control height{"\n"}
                  - border/radius{"\n"}
                  - shadow/elevation{"\n"}
                  - hover/pressed/selected/focus-visible{"\n"}
                  - disabled/loading{"\n"}
                  - overlay/scrim{"\n"}
                  - enter/exit transitions{"\n"}
                  - duration/easing{"\n"}
                  - responsive media query{"\n"}
                  - RTL{"\n"}
                  - prefers-reduced-motion{"\n\n"}
                  Mọi hover effect phải có @media (hover: hover) nếu upstream có guard này. Không tự thêm scale/bounce/glow nếu demo không có.{"\n\n"}
                  BƯỚC 6 — BEHAVIOR LAYER:{"\n"}
                  CSS không thay thế JavaScript. Giữ Radix/shadcn hoặc local hooks cho:{"\n"}
                  - focus trap và focus return{"\n"}
                  - Escape/outside click{"\n"}
                  - roving tabindex{"\n"}
                  - arrow-key navigation{"\n"}
                  - portal và stacking{"\n"}
                  - controlled/uncontrolled state{"\n"}
                  - scroll lock{"\n"}
                  - selection{"\n"}
                  - IME handling{"\n"}
                  - touch/drag/gesture{"\n"}
                  - live-region announcement{"\n\n"}
                  Map state behavior sang đúng data-state/data-variant để CSS Astryx hiển thị chính xác. Test contract với upstream; không chỉ test click chuột.{"\n\n"}
                  BƯỚC 7 — COMPONENT ƯU TIÊN:{"\n"}
                  1. Button/IconButton/ToggleButton.{"\n"}
                  2. TextInput/TextArea/Switch/CheckboxInput.{"\n"}
                  3. Tooltip/Popover/DropdownMenu/MoreMenu.{"\n"}
                  4. Dialog/AlertDialog/BottomSheet/Toast.{"\n"}
                  5. TabList/SideNav/MobileNav/TopNav.{"\n"}
                  6. List/Item/Table/MetadataList.{"\n"}
                  7. AppShell/Layout/LayoutPanel/EmptyState.{"\n\n"}
                  Mỗi component chỉ hoàn tất khi tất cả variant, size và state trong Storybook tương ứng đều được tái tạo.{"\n\n"}
                  BƯỚC 8 — REFERENCE HARNESS:{"\n"}
                  Tạo hai cột dev-only cùng viewport:{"\n"}
                  - trái: official Astryx component tại version đã pin;{"\n"}
                  - phải: MIRATS local component + Source-Fidelity CSS Bridge.{"\n\n"}
                  Chụp và so sánh:{"\n"}
                  - light/dark{"\n"}
                  - 1440, 1024, 768, 390, 360{"\n"}
                  - default/hover/pressed/focus-visible{"\n"}
                  - disabled/loading/selected/invalid/open{"\n"}
                  - long Vietnamese text{"\n"}
                  - LTR/RTL{"\n"}
                  - reduced motion{"\n\n"}
                  So sánh computed style cho font, color, background, border, radius, padding, gap, height, shadow, transform, transition và opacity.{"\n\n"}
                  BƯỚC 9 — MOBILE VÀ THIẾT BỊ THẬT:{"\n"}
                  - Chrome Android.{"\n"}
                  - Safari iOS.{"\n"}
                  - Desktop Chromium/WebKit/Firefox.{"\n"}
                  - Touch không bị phụ thuộc hover.{"\n"}
                  - Bottom sheet/dialog không bị keyboard che.{"\n"}
                  - Safe-area đúng.{"\n"}
                  - Không scroll lock kẹt sau khi đóng overlay.{"\n"}
                  - Focus không bị mất sau navigation/dialog.{"\n\n"}
                  DEFINITION OF DONE:{"\n"}
                  - Không có import runtime từ @astryxdesign/core/* trong route production.{"\n"}
                  - Static CSS/tokens có version, commit và hash.{"\n"}
                  - Không còn style “ước lượng”.{"\n"}
                  - Tất cả stable classes/data attributes được map có tài liệu.{"\n"}
                  - Visual diff đạt trong môi trường cố định.{"\n"}
                  - Interaction, keyboard, focus, portal và gesture test đạt.{"\n"}
                  - Light/dark/mobile giống reference demo.{"\n"}
                  - Không làm thay đổi callback, mutation, permission hoặc business logic MIRATS.{"\n"}
                  - Nếu DOM behavior khác upstream dù nhìn giống, báo cáo rõ “exact visual parity + contract-compatible local behavior”, không ghi sai là cùng implementation.
                </div>
              </ScrollArea>
            </div>
          ) : (
            <DropdownMenuItem
              onSelect={() => setDensity(density === "compact" ? "comfortable" : "compact")}
              aria-label="thay đổi mật độ ở đây"
            >
              {density === "compact" ? (
                <LayoutPanelTop className="mr-2 h-3.5 w-3.5" />
              ) : (
                <LayoutPanelLeft className="mr-2 h-3.5 w-3.5" />
              )}
              Mật độ: {density === "compact" ? "Gọn (Compact)" : "Rộng (Comfortable)"}
            </DropdownMenuItem>
          )}


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
            <LogOutIcon className="mr-2 h-3.5 w-3.5" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button asChild size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 border-none shadow-sm shadow-primary/20">
      <Link to="/auth">
        <LogIn className="mr-2 h-3.5 w-3.5" />
        Đăng nhập
      </Link>
    </Button>
  );
}

export function TourButton() {
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
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[#0074e2]/10 hover:text-[#0074e2]"
          aria-label="Hướng dẫn sử dụng"
        >
          <LifeBuoy className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Hướng dẫn sử dụng</TooltipContent>
    </Tooltip>
  );
}

export const TOUR_STEPS: TourStep[] = [
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
