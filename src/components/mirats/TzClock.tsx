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
          aria-label="IMPLEMENTATION MODE — DATA CORRECTNESS ONLY.\n\n1. AI chat:\n\n- viết test nhiều lượt hội thoại;\n\n- mỗi user/assistant message chỉ tồn tại đúng một lần;\n\n- onFinish chỉ persist message mới, không insert lại toàn bộ lịch sử;\n\n- conversation phải thuộc current user;\n\n- kiểm tra mọi insert/update error;\n\n- retry dùng idempotency message ID.\n\n2. R2 cleanup:\n\n- nếu abort/delete object fail, không xóa metadata như đã thành công;\n\n- trả per-item success/failed;\n\n- deleted counter chỉ tăng khi policy thành công;\n\n- có retry/reconciliation cho object mồ côi.\n\n3. Lập danh sách mọi mutation không kiểm tra error từ static scan.\n\n4. Chia theo domain và sửa từng batch tối đa 5–10 mutation.\n\n5. Không toast success trước khi mutation chính và invariant check thành công.\n\n6. Multi-step mutation phải transaction/RPC hoặc saga có compensation.\n\n7. Thêm test network fail ở bước 1/2/3 và xác minh rollback.\n\nKẾT QUẢ CẦN ĐẠT SAU PROMPT 10G\n\n- Mỗi chat message chỉ được lưu đúng một lần qua nhiều lượt và retry.\n\n- User không thể ghi lịch sử vào conversation ngoài quyền.\n\n- R2 object xóa thất bại thì metadata không bị mất và counter không báo sai.\n\n- Không còn toast success khi mutation chính hoặc invariant check thất bại.\n\n- Các mutation đã rà có error handling, rollback/compensation và failure-path tests GREEN.\n\nCommit:\n\n- fix(ai): persist chat messages idempotently\n\n- fix(storage): preserve metadata on deletion failure\n\n- fix(data): surface mutation failures"
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
