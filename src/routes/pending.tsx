import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Satellite, Clock, LogOut, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pending")({
  head: () => ({
    meta: [
      { title: "Chờ duyệt — MIRATS 2.0" },
      { name: "description", content: "Tài khoản đang chờ quản trị viên duyệt." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PendingPage,
});

function PendingPage() {
  const nav = useNavigate();
  const { loading, session, profile, refresh } = useSession();

  useEffect(() => {
    if (loading) return;
    if (!session) nav({ to: "/auth" });
    else if (profile?.active) nav({ to: "/" });
  }, [loading, session, profile, nav]);

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-slate-50 via-background to-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Satellite className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">MIRATS 2.0</div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">TÀI KHOẢN CHỜ DUYỆT</div>
          </div>
        </div>

        <Card>
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Clock className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl">Đang chờ quản trị viên duyệt</CardTitle>
            <CardDescription>
              Đăng ký của bạn đã được ghi nhận. Quản trị hệ thống sẽ kiểm tra và cấp quyền truy cập trong thời gian sớm nhất.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm">
              <div className="text-muted-foreground text-[11px] uppercase tracking-wider">Tài khoản</div>
              <div className="font-medium">{profile?.ho_ten ?? profile?.email}</div>
              <div className="text-xs text-muted-foreground">{profile?.email}</div>
            </div>
            <div className="text-xs leading-relaxed text-muted-foreground">
              Sau khi được duyệt, bạn có thể đăng nhập lại để bắt đầu sử dụng hệ thống.
              Nếu cần hỗ trợ nhanh, liên hệ <b>Phòng Kỹ thuật</b> hoặc quản trị viên qua email nội bộ.
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={refresh}>
                <RefreshCw className="mr-2 h-4 w-4" /> Kiểm tra lại
              </Button>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
              </Button>
            </div>
            <div className="text-center">
              <Link to="/auth" className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
                Về trang đăng nhập
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
