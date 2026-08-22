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
          aria-label={`IMPLEMENTATION MODE — TABLE COLOR STATES ONLY.

Không sửa data loading, virtualization hoặc horizontal scroll trong prompt này.

Phạm vi:

- src/styles.css

- src/styles/astryx-component-skins.css

- src/components/ui/table.tsx

- StandardTable/DataTableCore/RawTableWrapper chỉ khi cần bỏ class trùng.

Nguyên nhân đã xác nhận:

- [data-astryx-theme="df3"] --color-accent light = #262626;

- .astryx-table-row:hover dùng var(--color-accent) !important;

- rule này thắng hover muted/primary tint của component và làm row gần đen.

Các bước:

1. Viết visual/DOM test RED cho light và dark:

- default;

- hover;

- selected;

- selected + hover;

- keyboard focus;

- expanded;

- disabled/non-clickable.

2. Không dùng semantic --color-accent của Astryx làm nền row. Tạo token table riêng, ví dụ:

- --table-row-hover;

- --table-row-selected;

- --table-row-selected-hover;

- --table-row-focus-ring.

Các token phải map tới muted/primary tint phù hợp light/dark.

3. Xóa !important khỏi hover row. Chỉ một layer sở hữu row background; không định nghĩa cùng state ở styles.css, skin và component.

4. Đảm bảo text/cell/badge/link/icon giữ contrast tối thiểu WCAG AA ở hover và selected.

5. Sticky cells dùng cùng background state với row; không tạo mảng màu trắng/đen tách khỏi row.

6. Row không clickable không dùng cursor pointer hoặc active scale. Clickable row có focus-visible rõ nhưng không đổi layout.

7. Hover chỉ là enhancement; selected không phụ thuộc hover để nhận biết.

8. Kiểm tra raw table, StandardTable và DataTableCore để không có implementation nào quay lại nền đen.

KẾT QUẢ CẦN ĐẠT SAU PROMPT 10M

- Light mode hover là tint nhẹ, chữ vẫn tối và dễ đọc; không còn nền đen.

- Dark mode hover sáng hơn nền vừa đủ, không lóa và không mất chữ.

- Selected, selected-hover, focus và expanded phân biệt rõ ràng.

- Sticky cells đồng màu với toàn row.

- Không còn .astryx-table-row:hover sử dụng var(--color-accent) !important.

- Contrast tests và visual regression GREEN tại 390/768/1024/1440px.

Commit:

- test(ui): reproduce black table row hover

- fix(ui): define accessible table row states`}
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
