import { createFileRoute, useRouter, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ThanhPhanTable } from "@/components/mirats/ThanhPhanTable";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Pencil, Check, GitFork, Activity, ClipboardList, ListTree, LayoutGrid } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCan } from "@/hooks/use-permissions";
import { useUserPref } from "@/hooks/use-user-pref";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { PageSection } from "@/components/mirats/layout/PageSection";
import { AppTooltip } from "@/components/mirats/AppTooltip";

export const Route = createFileRoute("/_app/he-thong/thanh-phan")({
  head: () => ({
    meta: [
      { title: "Thành phần & Tài sản — MIRATS" },
      {
        name: "description",
        content: "Bảng quản lý chi tiết thành phần và tài sản hệ thống kỹ thuật.",
      },
    ],
  }),
  component: ThanhPhanListPage,
  errorComponent: ThanhPhanErrorView,
});

function ThanhPhanListPage() {
  const nav = useNavigate();
  const canManage = useCan("he-thong", "manage") || useCan("admin", "manage");
  const [editMode, setEditMode] = useUserPref<boolean>("he-thong:edit-mode", false);

  const handleDisplayChange = (v: string) => {
    if (v === "table") return;
    nav({ to: "/he-thong/cay", search: { view: v } as any });
  };

  return (
    <PageFrame density="compact">
      <PageHeader
        icon={GitFork}
        title="Thành phần & Tài sản"
        subtitle="Quản lý chi tiết danh mục kỹ thuật"
        breadcrumbs={[
          { label: "Hệ thống", to: "/he-thong/cay" },
          { label: "Thành phần & Tài sản" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            {canManage && (
              <AppTooltip noiDung={editMode ? "Hoàn tất" : "Chỉnh sửa nhanh"}>
                <Button
                  variant={editMode ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                </Button>
              </AppTooltip>
            )}
          </div>
        }
      />

      <PageSection className="px-4 py-2 border-b bg-background/30 backdrop-blur-sm z-10 shrink-0">
        <Tabs value="table" onValueChange={handleDisplayChange}>
          <TabsList className="h-8 bg-muted/50 p-0.5">
            <TabsTrigger value="table" className="h-7 gap-2 px-3 text-[11px] font-medium tracking-tight">
              <LayoutGrid className="h-3 w-3" />
              <span>DANH SÁCH</span>
            </TabsTrigger>
            <TabsTrigger value="tree" className="h-7 gap-2 px-3 text-[11px] font-medium tracking-tight">
              <ListTree className="h-3.5 w-3.5" />
              <span>CÂY PHÂN CẤP</span>
            </TabsTrigger>
            <TabsTrigger value="mindmap" className="h-7 gap-2 px-3 text-[11px] font-medium tracking-tight">
              <GitFork className="h-3.5 w-3.5" />
              <span>SƠ ĐỒ TỔNG THỂ</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="h-7 gap-2 px-3 text-[11px] font-medium tracking-tight">
              <Activity className="h-3.5 w-3.5" />
              <span>SỨC KHỎE</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="h-7 gap-2 px-3 text-[11px] font-medium tracking-tight">
              <ClipboardList className="h-3.5 w-3.5" />
              <span>NHẬT KÝ</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </PageSection>

      <PageBody noPadding className="relative flex flex-col bg-muted/5 overflow-hidden">
        <ThanhPhanTable externalEditMode={editMode} />
      </PageBody>
    </PageFrame>
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
          <div className="font-medium text-destructive">đang bị lỗi này xem thử lý do</div>
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
