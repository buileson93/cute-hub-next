import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ThanhPhanTable } from "@/components/mirats/ThanhPhanTable";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Puzzle, List, ListTree, GitFork, Activity, ClipboardList } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/mirats/PageHeader";


export const Route = createFileRoute("/_app/he-thong/thanh-phan")({
  head: () => ({
    meta: [
      { title: "Hệ thống — Thành phần & tài sản — MIRATS 2.0" },
      {
        name: "description",
        content:
          "Bảng hệ thống mức thành phần: nhóm — hệ thống — thành phần — tài sản đang lắp (kế thừa serial, model, chủng loại, NSX, NCC) — vị trí — trạng thái.",
      },
    ],
  }),
  component: ThanhPhanListPage,
  errorComponent: ThanhPhanErrorView,
});

function ThanhPhanListPage() {
  const nav = useNavigate();
  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b flex items-center justify-between bg-background z-10 shrink-0">
        <div className="flex items-center gap-4">
          <PageHeader
            title="Bảng thành phần & tài sản"
            icon={Puzzle}
            description="Quản lý chi tiết từng vị trí lắp đặt và tài sản tương ứng trong hệ thống kỹ thuật."
          />
          <Tabs value="table" onValueChange={(v) => v !== "table" && nav({ to: "/he-thong/cay", search: { display: v } as any })}>
            <TabsList>
              <TabsTrigger value="table" className="gap-2"><List className="h-4 w-4"/>Bảng</TabsTrigger>
              <TabsTrigger value="tree" className="gap-2"><ListTree className="h-4 w-4"/>Cây</TabsTrigger>
              <TabsTrigger value="mindmap" className="gap-2"><GitFork className="h-4 w-4"/>Sơ đồ</TabsTrigger>
              <TabsTrigger value="health" className="gap-2"><Activity className="h-4 w-4"/>Sức khỏe</TabsTrigger>
              <TabsTrigger value="history" className="gap-2"><ClipboardList className="h-4 w-4"/>Nhật ký</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <ThanhPhanTable />
      </div>
    </div>
  );
}

/**
 * Boundary lỗi cho tab Bảng — hiển thị nguyên nhân chi tiết + gợi ý cách thử
 * lại. Ghi log client-side kèm route và tên channel realtime nếu là lỗi
 * subscription để dễ truy vết khi page không load.
 */
function ThanhPhanErrorView({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const message = error instanceof Error ? error.message : String(error ?? "");
  const isRealtimeIssue = /postgres_changes|channel|subscribe|realtime/i.test(message);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[he-thong/thanh-phan] error boundary", {
      route: "/he-thong/thanh-phan",
      realtime: isRealtimeIssue,
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }, [error, message, isRealtimeIssue]);

  const handleRetry = () => {
    reset();
    router.invalidate();
  };

  return (
    <div className="mx-auto max-w-2xl p-6" role="alert">
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="font-medium text-destructive">Không tải được bảng thành phần</div>
          <div className="break-words text-sm text-muted-foreground">{message || "Lỗi không xác định"}</div>
          {isRealtimeIssue ? (
            <div className="text-xs text-muted-foreground">
              Có vẻ là lỗi khi đăng ký realtime (Supabase channel). Thử tải lại tab — nếu vẫn lỗi hãy mở
              Console (F12) và tìm log <code className="rounded bg-muted px-1">[realtime-taxonomy]</code> để
              xem tên channel và route bị lỗi.
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Kiểm tra kết nối mạng, sau đó bấm "Thử lại". Nếu vẫn lỗi hãy mở Console (F12) để xem chi tiết.
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Thử lại
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/he-thong/cay">Sang tab Cây</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
