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
          aria-label={`IMPLEMENTATION MODE — TABS VISUAL CONTRACT ONLY.

Thực hiện sau Prompt 10O. Không đổi điều hướng, nội dung tab hoặc ngôn ngữ thiết kế.

Hiện tượng từ screenshot:

- tab “Ma trận quyền” đang active nhưng nền chuyển thành màu trắng;

- chữ/icon vẫn nhận màu \`primary-foreground\` sáng nên gần như biến mất;

- hình dạng active không đồng bộ với các cụm tab khác.

Nguyên nhân source đã xác nhận:

- primitive \`src/components/ui/tabs.tsx\` quy định active bằng \`bg-primary text-primary-foreground\`;

- riêng \`src/routes/_app.phan-quyen.tsx\` lại thêm \`data-[state=active]:bg-background\` cho cả 4 TabsTrigger;

- local class đổi nền active thành trắng nhưng không đổi lại màu chữ, tạo tổ hợp trắng trên trắng;

- ứng dụng hiện có 34 file dùng TabsTrigger và nhiều kiểu tab riêng: segmented/pill, underline và panel tabs. Thiếu variant contract nên route tự ghi đè từng thuộc tính active.

KẾT QUẢ CẦN ĐẠT SAU PROMPT 10P

- Tab active ở trang Phân quyền không còn nền trắng/chữ trắng; label và icon đọc rõ.

- Các tab cùng loại dùng cùng một active contract trên toàn ứng dụng.

- Segmented tabs và underline tabs được phân biệt bằng variant chính thức, không bằng class route tùy ý.

- Active, inactive, hover, focus và disabled rõ ràng ở light/dark.

- Không còn local override \`data-[state=active]:bg-background\` tại \`_app.phan-quyen.tsx\`.`}
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
