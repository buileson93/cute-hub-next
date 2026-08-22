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
          aria-label="sửa lại IMPLEMENTATION MODE — TAXONOMY LABEL REGRESSION ONLY.\n\nDùng systematic-debugging. Không sửa CSS bảng trong prompt này.\n\nPhạm vi chính:\n\n- src/routes/_app.he-thong.cay.tsx\n\n- src/components/mirats/he-thong-cay/CayMindMap.tsx\n\n- src/components/mirats/he-thong-cay/utils.ts\n\n- src/lib/mirats/db-taxonomy.ts\n\n- tests taxonomy/tree/mindmap hiện có.\n\nHiện tượng: các node trong “CÂY PHÂN CẤP / SƠ ĐỒ TỔNG THỂ” hiển thị UUID hoặc mã nghiệp vụ thay vì tên người dùng đọc được.\n\nGiả thuyết đã có bằng chứng source:\n\n- device query gán `_nhKey = nhom_he_thong_id` và `_htId = he_thong_id` — đây thường là UUID;\n\n- realSystems dùng `nhom.ma` và `h.ma` — đây là mã nghiệp vụ;\n\n- buildTree trộn các khóa này trong cùng Set/Map;\n\n- useNhMind/useHtMind fallback trả raw key khi lookup không khớp.\n\nCác bước bắt buộc:\n\n1. Viết characterization test RED với fixture có đầy đủ:\n\n- phân loại `{id, ma, ten}`;\n\n- nhóm `{id UUID, ma, ten}`;\n\n- hệ thống `{id UUID, ma, ten}`;\n\n- thiết bị tham chiếu bằng UUID;\n\n- override tham chiếu bằng mã/composite key.\n\nTest phải dựng cả tree view và mindmap node data rồi chứng minh label hiện tại rơi về UUID/mã.\n\n2. Log có kiểm soát trong DEV hoặc dùng unit fixture để xác định chính xác namespace tại từng tầng; không log dữ liệu nhạy cảm ở production.\n\n3. Tạo resolver thuần, typed, một nguồn sự thật:\n\n- resolvePhanLoai(ref);\n\n- resolveNhom(ref);\n\n- resolveHeThong(ref/compositeRef);\n\n- resolveThietBi(device).\n\nMỗi resolver index theo cả `id` và `ma`, trả `{id, ma, label}`; không đoán bằng format UUID nếu có thể dùng map.\n\n4. Chuẩn hóa tree model trước `buildTree`: dùng canonical ID để quan hệ, dùng `label` để hiển thị, giữ `ma` riêng cho CodeBadge/search/export.\n\n5. Không gọi `htLabel(ma)` hai lần qua composite key đã biến đổi. Tránh tạo duplicate node cho cùng entity do một nhánh dùng UUID, nhánh khác dùng mã.\n\n6. UI node luôn hiển thị `label`; mã chỉ ở CodeBadge/tooltip/detail phụ. Sửa TruncatedNodeLabel để tooltip thật sự render cả tên và mã khi có `code` — biến `content` hiện được tạo nhưng không được dùng.\n\n7. Nếu danh mục thiếu tên thật:\n\n- hiển thị “Chưa có tên” + mã ở secondary text;\n\n- ghi diagnostic có entity kind/ref;\n\n- không dùng UUID làm primary label.\n\n8. Kiểm tra rename, search focus, expand/collapse, move, export CSV và NodeEditor vẫn dùng đúng canonical ID.\n\n9. Test các trường hợp orphan reference, deleted catalog, NONE_HT, HT_KHAC và override draft.\n\nKẾT QUẢ CẦN ĐẠT SAU PROMPT 10L\n\n- Cây phân cấp và mindmap hiển thị tên tiếng Việt ở mọi tầng có dữ liệu tên.\n\n- UUID không xuất hiện như primary label.\n\n- Mã nghiệp vụ chỉ xuất hiện ở tooltip/CodeBadge/secondary metadata.\n\n- Không còn node trùng do cùng entity được tham chiếu bằng UUID và mã.\n\n- Rename một node cập nhật nhất quán tree, table và mindmap sau invalidate.\n\n- Characterization, resolver, tree, mindmap và rename regression tests GREEN.\n\n- Có screenshot ở 1440px chứng minh tên đọc được và tooltip tên+mã đúng.\n\nCommit:\n\n- test(taxonomy): reproduce mindmap label fallback\n\n- fix(taxonomy): normalize entity references and labels"

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
