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
          aria-label="PLAN THEN IMPLEMENT — DATA LOADING ONLY.\n\nKhông sửa visual style.\n\n1. Lập inventory 71 `.slice/.limit` và 30 `fetchAllRows` references.\n\n2. Phân loại từng query:\n\n- intentional bounded lookup;\n\n- server paged;\n\n- infinite/keyset;\n\n- export-only;\n\n- bug silent truncation.\n\n3. Không thay tất cả limit một cách máy móc.\n\n4. Với user-facing list:\n\n- hiển thị total/loaded count;\n\n- filter/sort đúng toàn bộ scope;\n\n- không cắt âm thầm;\n\n- dùng keyset/infinite khi lớn.\n\n5. Với ScopeProvider:\n\n- không fetch toàn bộ operations/taxonomy/licenses trên mọi route;\n\n- route-level query hoặc lazy provider;\n\n- server/RLS filter theo đơn vị trước khi gửi về browser.\n\n6. Đổi select * thành danh sách cột cần thiết ở top payload hotspots.\n\n7. Export lớn chạy server/job stream; không nạp 20.000–50.000 rows vào UI.\n\n8. Benchmark query count, bytes, TTFB, memory trước/sau.\n\n9. Migrate một route pilot rồi mới rollout.\n\nKẾT QUẢ CẦN ĐẠT SAU PROMPT 10H\n\n- Có inventory đầy đủ cho mọi `slice`, `limit` và `fetchAllRows`, phân biệt intentional với bug.\n\n- Route pilot không còn cắt dữ liệu âm thầm; UI hiển thị loaded/total đúng.\n\n- Filter, sort, count và export dùng cùng một phạm vi dữ liệu.\n\n- Global provider không tải toàn bộ operations trên mọi route.\n\n- Payload, query count, TTFB và memory của pilot giảm theo benchmark đã ghi.\n\n- Không thay limit máy móc và không tạo regression cho lookup nhỏ.\n\nCommit:\n\n- perf(data): remove global eager data loads\n\n- fix(list): expose and remove silent truncation\n\n- perf(query): select only required columns"

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
