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
    if (loading) return;

    if (!session) {
      toast.error("Vui lòng đăng nhập để truy cập trang quản trị");
      nav({ to: "/auth", search: { redirect: location.pathname } });
      return;
    }

    if (blocked) {
      toast.error("Bạn không có quyền truy cập trang này");
      nav({ to: "/" });
    }
  }, [loading, session, blocked, nav, location.pathname]);

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
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <h1 className="text-xl font-bold">Không có quyền truy cập</h1>
          <p className="text-sm text-muted-foreground">
            Tài khoản {profile.email} không được cấp quyền quản trị.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <Outlet />
    </div>
  );
}
