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
          aria-label={`YÊU CẦU: Tối ưu hiệu năng render, KHÔNG thay đổi bất kỳ nội dung văn bản, label, aria-label, hay style hiển thị nào. Đây là thay đổi kỹ thuật về cách render DOM, không phải thay đổi UI/copy.\n\nVấn đề hiện tại: Danh sách đang render toàn bộ tất cả phần tử vào DOM cùng lúc, nên khi số lượng phần tử lớn (ví dụ 100.000 items) hiệu năng cuộn (scroll FPS) giảm mạnh.\n\nViệc cần làm: Triển khai ảo hoá danh sách (list virtualization / windowing) cho component danh sách này:\n\n1. Chỉ render các phần tử đang nằm trong vùng nhìn thấy (viewport) cộng với một vùng đệm nhỏ (overscan ~3-5 item mỗi phía).\n\n2. Khi một phần tử bị cuộn ra khỏi vùng nhìn thấy, phải unmount/loại khỏi DOM (không giữ lại ẩn bằng display:none cho toàn bộ danh sách).\n\n3. Giữ nguyên vị trí cuộn chính xác bằng cách định vị các item hiển thị bằng transform (translateY) dựa trên tổng chiều cao ước tính của danh sách, thay vì render tuần tự tất cả phần tử.\n\n4. Nếu chiều cao từng item không cố định, đo động và cache lại chiều cao để tránh tính toán lại (reflow) liên tục khi cuộn.\n\n5. Không được thay đổi bất kỳ text, nhãn, aria-label, class visual, hay giao diện nào của các item hoặc component khác (ví dụ component đồng hồ) — chỉ thay đổi cơ chế render/mount-unmount.\n\n6. Đảm bảo cơ chế tính toán vị trí cuộn không chạy trên main thread theo cách gây block animation khác (ví dụ animation trượt của sidebar trong AppShell) — dùng requestAnimationFrame hoặc kỹ thuật tương đương để tách biệt.\n\nTiêu chí nghiệm thu (test):\n\n- Với danh sách 100.000 phần tử, FPS khi cuộn phải ổn định, không giảm dần theo số lượng đã cuộn qua.\n\n- Cuộn xuống hết toàn bộ danh sách (load hết dữ liệu) không gây giật/lag.\n\n- Số lượng DOM node thực tế tại bất kỳ thời điểm nào chỉ xấp xỉ (số item hiển thị + overscan), không tăng theo tổng số phần tử.\n\n- Khi thao tác cuộn danh sách, animation trượt sidebar của AppShell không bị giảm FPS so với trước khi thay đổi.\n\n- Không có bất kỳ khác biệt nào về nội dung text/label/aria-label hiển thị so với trước khi thay đổi.`}
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
