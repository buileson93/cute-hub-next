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
          aria-label="dùng superpower https://github.com/obra/superpowers IMPLEMENTATION MODE — DEAD CONTROLS / RBAC ONLY. Không redesign. Kiểm tra và xử lý từng control: - Khôi phục/Cá nhân hóa trang Sự cố; - Chia sẻ sơ đồ liên kết; - Chạy Benchmark OCR; - Retry OCR ở ThietBiTepDinhKem và ModelTaiLieu; - Tải Browser Extension; - canManage=true tại trang liên kết hệ thống. 1. Tạo control inventory: label, expected action, handler, permission, loading, success, error, test. 2. Viết test RED for mỗi control không hoạt động. 3. Nếu tính năng đã có backend/API: nối handler thật, loading/error/toast và invalidate đúng query. 4. Nếu chưa có feature contract/backend: - ẩn control khỏi production hoặc disabled with giải thích rõ; - không giữ decorative button có vẻ click được. 5. Thay canManage hard-code bằng permission hook/role contract hiện có; server/RLS vẫn là nguồn bảo mật. 6. Mọi icon-only control có aria-label; thao tác phá hủy có confirmation. 7. Test từng role admin/phong_kt/ktv/readonly. 8. Test desktop/mobile và keyboard. KẾT QUẢ CẦN ĐẠT SAU PROMPT 10F - Không còn production control trông có thể bấm nhưng không có hành vi. - Mỗi control hoặc hoạt động đầy đủ, hoặc bị ẩn/disabled with lý do rõ. - canManage lấy từ permission contract; readonly/unauthorized không thấy hoặc không chạy được mutation. - OCR retry/benchmark, chia sẻ, cá nhân hóa và khôi phục có loading/success/error đúng. - Tất cả control dùng được bằng keyboard, có accessible name và role tests GREEN."
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
