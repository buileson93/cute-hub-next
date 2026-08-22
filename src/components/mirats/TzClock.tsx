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
          aria-label="VERIFICATION MODE ONLY. Không sửa thêm tính năng mới.\n\n1. Thu thập bug register từ Prompt 10A–10J.\n\n2. Mỗi bug phải có severity, reproduction, test, fix commit, trạng thái và bằng chứng GREEN.\n\n3. Chạy fresh:\n\n- secret/PII scan;\n\n- unit tests;\n\n- integration/route tests;\n\n- Supabase RLS/RPC tests;\n\n- npm test;\n\n- npm run typecheck;\n\n- npm run lint;\n\n- npm run build;\n\n- npm run ui:audit;\n\n- npm run code:audit;\n\n- Playwright critical journeys theo role/viewport.\n\n4. Kiểm tra không còn:\n\n- private key/data dump trong source/artifact/history đang phát hành;\n\n- public privileged endpoint dùng anon key;\n\n- eval/new Function;\n\n- API cross-project write;\n\n- wrong-record table action;\n\n- dead production control;\n\n- silent success khi mutation fail.\n\n5. Báo BLOCKED nếu thiếu DB test env, dependency, Git metadata hoặc quyền rotate production key.\n\n6. Chỉ đóng P0/P1 khi test tái hiện ban đầu GREEN và có output exit 0.\n\n7. Xuất release checklist, rollback plan và danh sách risk còn lại P2/P3.\n\nKẾT QUẢ CẦN ĐẠT SAU PROMPT 10K\n\n- Mọi P0/P1 có reproduction ban đầu, regression test GREEN và commit truy vết được.\n\n- Secret/PII scan, RLS/RPC tests, test, typecheck, lint, build và audits đều có output fresh exit 0.\n\n- Critical journeys pass theo từng role và viewport.\n\n- Có release checklist, migration order, rollback plan và người chịu trách nhiệm.\n\n- Không còn hạng mục “đã xong” nhưng thiếu bằng chứng; phần chưa xác minh phải ghi BLOCKED hoặc remaining risk.\n\n- Bug register đóng đúng trạng thái và P2/P3 được đưa vào backlog có ưu tiên."

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
