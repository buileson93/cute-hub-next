import { Outlet, createFileRoute, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "@/hooks/use-session";
import { canAccessRoute } from "@/lib/mirats/nav-contract";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const nav = useNavigate();
  const location = useLocation();
  const { loading, session, profile, roles } = useSession();

  const ready = !loading && !!session && !!profile?.active;
  const blocked = ready && !canAccessRoute(location.pathname, roles);

  useEffect(() => {
    if (!loading && !session) {
      nav({ to: "/auth", replace: true });
      return;
    }
    if (blocked) {
      toast.error("Bạn không có quyền truy cập trang quản trị");
      nav({ to: "/", replace: true });
    }
  }, [loading, session, blocked, nav]);

  if (loading || !session || !profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span className="text-sm">Đang kiểm tra phiên đăng nhập…</span>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <div className="text-lg font-semibold">Không có quyền truy cập</div>
        <div className="max-w-md text-sm text-muted-foreground">
          Khu vực quản trị yêu cầu vai trò Admin. Đang chuyển bạn về Trang chủ…
        </div>
      </div>
    );
  }

  return <Outlet />;
}
