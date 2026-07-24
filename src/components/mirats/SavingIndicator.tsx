// ============================================================================
// SavingIndicator — pill "Đang lưu…" hiện ở góc phải-trên khi có mutation.
// Dựa vào `useIsMutating` của React Query → bao trọn mọi useMutation trong app.
// ============================================================================
import { useIsMutating } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export function SavingIndicator() {
  const count = useIsMutating();
  if (count <= 0) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-4 z-[100] flex items-center gap-2 rounded-full border bg-background/95 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur"
    >
      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
      Đang lưu{count > 1 ? ` (${count})` : ""}…
    </div>
  );
}
