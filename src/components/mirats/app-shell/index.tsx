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
                Lộ trình di chuyển Astryx
              </div>
              <ScrollArea className="h-[300px] w-full rounded-md border bg-muted/30 p-2 font-mono text-[10px] leading-relaxed">
                <div className="whitespace-pre-wrap text-muted-foreground">
                  Bạn đang thực hiện Astryx Exact Parity cho MIRATS. Không thay component hàng loạt và không sửa nghiệp vụ trong prompt này.{"\n\n"}
                  UPSTREAM ĐÃ PIN:{"\n"}
                  - Repo: https://github.com/facebook/astryx{"\n"}
                  - Commit: 683015aa9b3f4ba258dc7e4c8f2cc274afce46a5{"\n"}
                  - Package source version tại commit: 0.4.5{"\n"}
                  - License: MIT; phải giữ LICENSE/NOTICE khi vendor hoặc swizzle source.{"\n\n"}
                  BƯỚC 1 — COMPATIBILITY REPORT:{"\n"}
                  1. Xác định React/React DOM thực tế; Astryx yêu cầu React 19+.{"\n"}
                  2. Chạy dependency tree để tìm duplicate React.{"\n"}
                  3. Kiểm tra @astryxdesign/core, CLI, theme và @stylexjs/stylex có khớp version/peer dependency.{"\n"}
                  4. Xác định MIRATS đang resolve Astryx từ dist hay raw src.{"\n"}
                  5. Xác định Vite/TanStack Start/SSR import path và lỗi hydration/browser API.{"\n"}
                  6. Kiểm tra CSS layer, reset, Tailwind preflight và custom skin.{"\n"}
                  7. Kiểm tra `.astryx-control` đang ghi đè variant nào.{"\n"}
                  8. Xác định lỗi cũ đến từ React, package mismatch, SSR, CSS cascade hay thiếu StyleX compiler; không đoán.{"\n\n"}
                  Thêm package script ổn định nếu chưa có:{"\n"}
                  "scripts": {"{"}{"\n"}
                    "astryx": "node node_modules/@astryxdesign/cli/clients/cli/bin/astryx.mjs"{"\n"}
                  {"}"}}{"\n\n"}
                  Chạy:{"\n"}
                  - npm run astryx -- doctor{"\n"}
                  - npm run astryx -- component --list{"\n"}
                  - npm run astryx -- docs migration --dense{"\n"}
                  - npm run astryx -- docs styling --dense{"\n"}
                  - npm run astryx -- docs tokens --dense{"\n"}
                  - npm run astryx -- docs theme --dense{"\n\n"}
                  Không dùng bare `npx astryx` trước khi CLI chính thức được cài vì có thể resolve nhầm package.{"\n\n"}
                  BƯỚC 2 — CHỌN MỘT MODE CHO TỪNG COMPONENT:{"\n\n"}
                  MODE A — OFFICIAL DIST, ƯU TIÊN:{"\n"}
                  - Import component từ public subpath của @astryxdesign/core.{"\n"}
                  - Import reset.css, astryx.css và đúng một theme CSS theo canonical layer order.{"\n"}
                  - Dùng precompiled dist; không alias về packages/core/src.{"\n"}
                  - Pin core, CLI và theme cùng một exact version.{"\n\n"}
                  MODE B — SWIZZLE/VENDOR SOURCE:{"\n"}
                  - Chỉ dùng khi official dist không đáp ứng integration nhưng source có thể compile.{"\n"}
                  - Lấy source bằng CLI `astryx swizzle {"<"}Component{">"}` hoặc từ commit đã pin.{"\n"}
                  - Đặt source bất biến tại src/vendor/astryx-v0.4.5/.{"\n"}
                  - Cấu hình StyleX compiler đúng bundler; không để stylex.create/defineVars chạy thô ở runtime.{"\n"}
                  - Đặt router, Supabase và business integration tại src/components/astryx-adapters/; không nhét logic MIRATS vào vendor source.{"\n\n"}
                  MODE C — CSS COMPATIBILITY:{"\n"}
                  - Giữ behavior shadcn/Radix nếu official component còn gây regression.{"\n"}
                  - Dùng cùng semantic tokens, anatomy, spacing, radius và state visuals.{"\n"}
                  - Target selector bằng component class + data attribute; không đặt background chung lên mọi control.{"\n"}
                  - Mode này chỉ được ghi “visual compatibility”; không gọi là exact behavior parity nếu DOM/ARIA/keyboard khác upstream.{"\n\n"}
                  BƯỚC 3 — THỨ TỰ THỬ NGHIỆM:{"\n"}
                  1. Theme, Text, Heading, Divider, StatusDot, Token, Badge.{"\n"}
                  2. Button, IconButton, Tooltip.{"\n"}
                  3. TextInput, TextArea, Switch, CheckboxInput.{"\n"}
                  4. Dialog, Popover, MoreMenu, BottomSheet.{"\n"}
                  5. AppShell, TopNav, SideNav, MobileNav, TabList.{"\n"}
                  6. Layout, LayoutPanel, List, MetadataList, Table, EmptyState.{"\n\n"}
                  Không chuyển nhóm tiếp theo nếu nhóm trước chưa qua build, SSR, interaction và screenshot test.{"\n\n"}
                  BƯỚC 4 — ADAPTER MAP:{"\n"}
                  - shadcn Button → Astryx Button/IconButton adapter.{"\n"}
                  - Input → TextInput/NumberInput adapter.{"\n"}
                  - Textarea → TextArea adapter.{"\n"}
                  - Select/Combobox → Selector/Typeahead adapter.{"\n"}
                  - Switch → Switch adapter.{"\n"}
                  - Checkbox → CheckboxInput/CheckboxList adapter.{"\n"}
                  - Tabs điều hướng → TabList adapter kết nối router.{"\n"}
                  - Dialog/AlertDialog → Astryx Dialog/AlertDialog adapter.{"\n"}
                  - Dropdown action → MoreMenu/DropdownMenu adapter.{"\n"}
                  - Card-like list row → Item/List row.{"\n"}
                  - Metadata pair → MetadataList.{"\n"}
                  - Dense records → Table/List.{"\n"}
                  - Status → StatusDot/Token; Badge chỉ cho count/enumerated state.{"\n\n"}
                  Mỗi adapter phải giữ nguyên business-facing callback hiện tại trong giai đoạn chuyển đổi và có typed deprecation path.
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
