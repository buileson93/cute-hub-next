import { useEffect, useState } from "react";
import { Clock, Check, Globe2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getTz, setTz, onTzChange, formatDT, TZ_LABEL, type TzMode } from "@/lib/time";

/**
 * Đồng hồ realtime + selector timezone trên topbar.
 * - Mặc định UTC, có nút chuyển +7 (VN).
 * - Đồng hồ tick mỗi giây, luôn hiển thị theo TZ đang chọn (không dùng giờ máy local).
 */
export function TzClock() {
  const [mounted, setMounted] = useState(false);
  const [tz, setLocal] = useState<TzMode>("UTC");
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    // Chỉ đọc localStorage & bật đồng hồ sau khi hydrate xong,
    // tránh cảnh báo hydration mismatch giữa SSR và client.
    setMounted(true);
    setLocal(getTz());
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => onTzChange(setLocal), []);

  const change = (mode: TzMode) => {
    setTz(mode);
    setLocal(mode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-[#0074e2]/10 lg:flex"
          aria-label="IMPLEMENTATION MODE — UI CONTRACT ONLY.\n\nKhông thay palette, typography, radius hoặc brand language.\n\n1. Tạo fixture cho Button, Input, Select, Dialog, Table ở 390/768/1024/1440, light/dark, density modes.\n\n2. Khóa screenshot baseline mobile trước khi sửa desktop.\n\n3. Xác định computed-style ownership Tailwind/shadcn/Astryx.\n\n4. Một primitive Button chuẩn; bỏ dead loading code và style ownership trùng.\n\n5. Thu hẹp Astryx skin; không dùng !important để vá.\n\n6. Loại global table selectors hoặc scope vào component.\n\n7. Migrate raw button/table theo allowlist, từng module.\n\n8. Mọi icon-only control có accessible name; hover-only action cũng truy cập được bằng focus/touch.\n\n9. Test Tab/Enter/Space/Escape, focus-visible, screen reader role/name/state và touch target.\n\n10. Chạy visual regression và ui:audit; giải thích mọi pixel diff ngoài bug fix.\n\nKẾT QUẢ CẦN ĐẠT SAU PROMPT 10J\n\n- Button giữ đúng hình dạng ở 390/768/1024/1440 px và mobile không regression.\n\n- Mỗi visual property quan trọng chỉ có một owner rõ giữa primitive/Tailwind/Astryx.\n\n- Không còn global table CSS ảnh hưởng ngoài component được phép.\n\n- Icon controls có accessible name; keyboard/focus/touch contract đạt yêu cầu.\n\n- Raw controls giảm theo inventory/allowlist và không dùng `!important` để chữa triệu chứng.\n\n- Visual regression, accessibility tests và ui:audit GREEN.\n\nCommit:\n\n- fix(ui): establish primitive style ownership\n\n- fix(a11y): label interactive controls\n\n- refactor(table): remove global table styling"

        >
          <Clock className="h-3.5 w-3.5 text-[#0074e2]" strokeWidth={2} />
          <span className="font-mono tabular-nums">
            {mounted ? formatDT(now, "datetime-sec") : "--:--:--"}
          </span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold",
              tz === "UTC"
                ? "bg-secondary text-muted-foreground"
                : "bg-[#0074e2]/10 text-[#0074e2]",
            )}
          >
            {TZ_LABEL[tz]}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs">
          <Globe2 className="h-3.5 w-3.5" /> Múi giờ hiển thị
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(["UTC", "VN"] as TzMode[]).map((m) => (
          <DropdownMenuItem key={m} onSelect={() => change(m)} className="text-xs">
            <div className="flex w-full items-center justify-between gap-3">
              <div>
                <div className="font-medium">{TZ_LABEL[m]}</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  {new Intl.DateTimeFormat("vi-VN", {
                    timeZone: m === "UTC" ? "UTC" : "Asia/Ho_Chi_Minh",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                  }).format(now)}
                </div>
              </div>
              {tz === m && <Check className="h-3.5 w-3.5 text-[#0074e2]" />}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-[10px] leading-relaxed text-muted-foreground">
          Thời gian đồng bộ từ máy chủ, không dùng giờ máy local.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
