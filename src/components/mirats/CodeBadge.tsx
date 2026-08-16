import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Nhãn "mã định danh" dùng chung — hiển thị mã tài sản / mã thành phần một cách
 * DỄ NHẬN BIẾT (monospace, có viền + nền + icon #) thay vì chữ mờ chìm.
 * Mã là định danh vật lý ổn định của tài sản nên cần nổi bật, không lẫn với tên.
 */
export function CodeBadge({
  code,
  className,
  title,
  showIcon = true,
}: {
  code?: string | null;
  className?: string;
  title?: string;
  showIcon?: boolean;
}) {
  const c = (code ?? "").trim();
  if (!c) return null;
  return (
    <span
      title={title ?? `Mã: ${c}`}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded border border-primary/25 bg-primary/10 px-1 py-0 font-mono text-[9px] font-bold leading-4 text-primary align-middle",
        className,
      )}
    >
      {showIcon && <Hash className="h-2.5 w-2.5 shrink-0 opacity-70" />}
      {c}
    </span>
  );
}
