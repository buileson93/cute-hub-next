import { ReactNode, useEffect, useState, Suspense, lazy } from "react";
import { Search, Activity, Wifi, WifiOff, Loader2, Command as CommandIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouterState } from "@tanstack/react-router";
import { NotificationBell } from "../NotificationBell";
import { CommandPaletteButton } from "../CommandPaletteButton";
import { QrScanButton } from "../QrScanButton";
import { TzClock } from "../TzClock";
import { RecentPinnedRailButton } from "../RecentPinnedRailButton";
import { useRealtimeStatus } from "@/hooks/use-realtime-status";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { cn } from "@/lib/utils";

const PowerSearch = lazy(() =>
  import("../search/PowerSearch").then((m) => ({ default: m.PowerSearch })),
);

export function TopBar({ renderMobileMenu }: { renderMobileMenu?: ReactNode }) {
  const [isMac, setIsMac] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/i.test(navigator.platform));
  }, []);

  const handleOpenSearch = () => {
    setOpen(true);
  };

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleToggle = () => setOpen((prev) => !prev);

    window.addEventListener("mirats:open-command-palette", handleOpen);
    window.addEventListener("mirats:toggle-command-palette", handleToggle);

    return () => {
      window.removeEventListener("mirats:open-command-palette", handleOpen);
      window.removeEventListener("mirats:toggle-command-palette", handleToggle);
    };
  }, []);

  return (
    <div className="flex h-full items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {renderMobileMenu}

        <div className="relative w-full sm:max-w-sm group" data-tour="search">
          <button
            id="powersearch-trigger"
            type="button"
            className="h-8 w-full flex items-center justify-between rounded-full bg-[#0074e2]/5 px-3 text-[13px] font-normal text-muted-foreground border border-[#0074e2]/10 hover:bg-[#0074e2]/10 hover:text-[#0074e2] transition-all active:scale-[0.98] cursor-pointer group/search shadow-sm"
            onClick={handleOpenSearch}
            aria-label="Mở tìm kiếm PowerSearch"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden pointer-events-none">
              <Search className="h-4 w-4 text-[#0074e2] shrink-0 transition-transform group-hover/search:scale-110" />
              <span className="truncate text-left min-w-0 font-medium">
                Tìm tài sản, hệ thống, biên bản...
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-[#0074e2]/20 bg-background/50 backdrop-blur-sm px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#0074e2]/60 shrink-0 self-center ml-2">
              <CommandIcon className="h-2.5 w-2.5" />
              <span>K</span>
            </div>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <RealtimeStatusIndicator />
        <CommandPaletteButton />
        <QrScanButton />

        <div className="hidden md:block">
          <RecentPinnedRailButton />
        </div>

        <NotificationBell />

        <div className="hidden md:block" title={`IMPLEMENTATION MODE — DEAD CONTROLS / RBAC ONLY.

Không redesign.

Kiểm tra và xử lý từng control:

- Khôi phục/Cá nhân hóa trang Sự cố;

- Chia sẻ sơ đồ liên kết;

- Chạy Benchmark OCR;

- Retry OCR ở ThietBiTepDinhKem và ModelTaiLieu;

- Tải Browser Extension;

- canManage=true tại trang liên kết hệ thống.

1. Tạo control inventory: label, expected action, handler, permission, loading, success, error, test.

2. Viết test RED cho mỗi control không hoạt động.

3. Nếu tính năng đã có backend/API: nối handler thật, loading/error/toast và invalidate đúng query.

4. Nếu chưa có feature contract/backend:

- ẩn control khỏi production hoặc disabled với giải thích rõ;

- không giữ decorative button có vẻ click được.

5. Thay canManage hard-code bằng permission hook/role contract hiện có; server/RLS vẫn là nguồn bảo mật.

6. Mọi icon-only control có aria-label; thao tác phá hủy có confirmation.

7. Test từng role admin/phong_kt/ktv/readonly.

8. Test desktop/mobile và keyboard.

KẾT QUẢ CẦN ĐẠT SAU PROMPT 10F

- Không còn production control trông có thể bấm nhưng không có hành vi.

- Mỗi control hoặc hoạt động đầy đủ, hoặc bị ẩn/disabled với lý do rõ.

- \`canManage\` lấy từ permission contract; readonly/unauthorized không thấy hoặc không chạy được mutation.

- OCR retry/benchmark, chia sẻ, cá nhân hóa và khôi phục có loading/success/error đúng.

- Tất cả control dùng được bằng keyboard, có accessible name và role tests GREEN.

Commit từng nhóm:

- fix(incident): wire personalization controls

- fix(ocr): implement retry and benchmark actions

- fix(graph): enforce link management permission

- fix(integration): remove placeholder extension link`}>
          <TzClock />
        </div>
      </div>

      <Suspense fallback={null}>
        <PowerSearch open={open} onOpenChange={setOpen} />
      </Suspense>
    </div>
  );
}

function RealtimeStatusIndicator() {
  const { status } = useRealtimeStatus();

  const config = {
    connecting: {
      icon: Loader2,
      color: "text-muted-foreground animate-spin",
      label: "Đang kết nối realtime...",
    },
    connected: { icon: Wifi, color: "text-emerald-500", label: "Realtime trực tuyến" },
    disconnected: {
      icon: WifiOff,
      color: "text-orange-500",
      label: "Realtime ngoại tuyến (đang dùng fallback)",
    },
    error: { icon: Activity, color: "text-destructive", label: "Lỗi kết nối Realtime" },
  }[status];

  const Icon = config.icon;

  return (
    <AppTooltip noiDung={<p className="text-xs font-medium">{config.label}</p>} ben="bottom">
      <div className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#0074e2]/10 cursor-help transition-mirats-fast active:scale-[var(--scale-active)]">
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
    </AppTooltip>
  );
}
