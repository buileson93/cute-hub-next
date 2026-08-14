import { Outlet, createFileRoute, useNavigate, useLocation, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/mirats/app-shell/AppShell";
import { PageTransition } from "@/components/mirats/PageTransition";
import { Toaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/sonner";
import { useSession } from "@/hooks/use-session";
import { useIdleLogout } from "@/hooks/use-idle-logout";
import { ScopeProvider } from "@/lib/mirats/scope";
import { useGlobalRealtime } from "@/lib/realtime/useGlobalRealtime";
import { decideAccess, type TrangThaiPhien } from "@/lib/mirats/auth/access";
import { canAccessRoute } from "@/lib/mirats/nav-contract";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const nav = useNavigate();
  const location = useLocation();
  // Chế độ nhúng: khi được mở trong iframe (Tác nghiệp nhanh của Sổ lý lịch), bỏ khung AppShell.
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const embed = search?.embed === "1" || search?.embed === 1 || search?.embed === true;
  const { loading, session, profile, roles } = useSession();
  useGlobalRealtime(!!session && !!profile?.active);
  useIdleLogout(!!session);

  const phien: TrangThaiPhien = loading
    ? { kieu: "dang_tai" }
    : !session
      ? { kieu: "chua_dang_nhap" }
      : { kieu: "da_dang_nhap", is_active_user: !!profile?.active };

  const qd = decideAccess(phien, location.pathname);

  // Route-level RBAC: chặn user không đủ quyền vào các route giới hạn.
  const rbacBlocked =
    qd.hanh_dong === "cho_phep" &&
    phien.kieu === "da_dang_nhap" &&
    phien.is_active_user &&
    !canAccessRoute(location.pathname, roles);

  useEffect(() => {
    if (qd.hanh_dong === "chuyen_huong") {
      nav({ to: qd.toi, replace: true });
    } else if (rbacBlocked) {
      toast.error("Bạn không có quyền truy cập trang này");
      nav({ to: "/", replace: true });
    }
  }, [qd, rbacBlocked, nav]);

  if (qd.hanh_dong !== "cho_phep") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span className="text-sm">Đang kiểm tra phiên đăng nhập…</span>
      </div>
    );
  }

  if (rbacBlocked) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <div className="text-lg font-semibold">Không có quyền truy cập</div>
        <div className="max-w-md text-sm text-muted-foreground">
          Trang này yêu cầu vai trò cao hơn. Đang chuyển bạn về Trang chủ…
        </div>
      </div>
    );
  }


  return (
    <ScopeProvider roles={roles} donViCode={profile?.don_vi ?? null}>
      {embed ? (
        <div className="min-h-dvh bg-background">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      ) : (
        <AppShell>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </AppShell>
      )}
      <Toaster position="top-right" closeButton richColors />
    </ScopeProvider>
  );
}
