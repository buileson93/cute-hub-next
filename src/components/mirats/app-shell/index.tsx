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
                  Sửa nền tảng Astryx trước khi chỉnh bất kỳ màn hình nào.{"\n\n"}
                  MỤC TIÊU:{"\n"}
                  Chỉ còn một nguồn theme rõ ràng, CSS layer đúng theo version Astryx đang cài và utility override hoạt động có chủ đích.{"\n\n"}
                  YÊU CẦU:{"\n"}
                  1. Đọc Migration Guide và dùng chính snippet Tailwind v4 phù hợp package hiện tại.{"\n"}
                  2. Khai báo canonical @layer order một lần trước mọi import.{"\n"}
                  3. Import Astryx reset/core/theme và Tailwind preflight/utilities đúng layer.{"\n"}
                  4. Audit tất cả global/reset stylesheet; không để reset unlayered ghi đè component.{"\n"}
                  5. Loại bỏ hoặc hạ layer custom reset/skin xung đột.{"\n"}
                  6. `.astryx-control` không được đặt cứng background/border làm mất variant.{"\n"}
                  7. App utility nằm ở utilities layer và thắng có chủ đích.{"\n"}
                  8. Không dùng `!important` để vá cascade.{"\n\n"}
                  CHỌN MỘT NGUỒN THEME:{"\n"}
                  - Hoặc theme Stone chính thức + override qua defineTheme.{"\n"}
                  - Hoặc df3Theme hoàn chỉnh dựa trên Astryx token API.{"\n"}
                  - Không đồng thời dùng theme Stone, root token viết tay và component skin như ba theme độc lập.{"\n\n"}
                  THEME:{"\n"}
                  - Dùng defineTheme/accent family theo API thực tế.{"\n"}
                  - Không chỉ override `--color-accent` rồi bỏ stale `--color-on-accent`.{"\n"}
                  - Dùng token semantic cho body/surface/card/text/border/status.{"\n"}
                  - Kiểm tra contrast light/dark.{"\n\n"}
                  PROVIDER:{"\n"}
                  - Kiểm tra cách SSR-safe được Astryx version hiện tại hỗ trợ.{"\n"}
                  - Không bỏ Theme khỏi SSR chỉ để né browser API nếu có cách import/build đúng.{"\n"}
                  - Loại bỏ comment/lazy logic không đúng thực tế.{"\n"}
                  - Không tạo flash đổi theme sau hydration.{"\n\n"}
                  TẠO FOUNDATION SMOKE TEST:{"\n"}
                  - Official Astryx Button primary.{"\n"}
                  - IconButton.{"\n"}
                  - TextInput.{"\n"}
                  - Card.{"\n"}
                  - Table/List.{"\n"}
                  - TabList.{"\n"}
                  - Dialog.{"\n"}
                  - Light/dark toggle.{"\n\n"}
                  ASSERT:{"\n"}
                  - Button có padding khác 0.{"\n"}
                  - Primary fill đúng.{"\n"}
                  - Input/card/list có spacing/border đúng.{"\n"}
                  - Focus ring đúng.{"\n"}
                  - Không có hydration mismatch.{"\n\n"}
                  Chỉ khi foundation test đạt mới chuyển sang Prompt 2.
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
