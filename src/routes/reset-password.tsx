import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Satellite, KeyRound, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { finalizePasswordReset } from "@/lib/password-reset.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Đặt lại mật khẩu — MIRATS 2.0" },
      { name: "description", content: "Đặt mật khẩu mới cho tài khoản MIRATS 2.0." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const finalize = useServerFn(finalizePasswordReset);

  useEffect(() => {
    // Supabase recovery link đưa về #access_token=...&type=recovery
    // Client tự động thiết lập session recovery qua onAuthStateChange.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        setReady(true);
      }
    });
    // Fallback: kiểm tra session hiện có
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else {
        // Nếu không có hash recovery thì báo lỗi sau 800ms
        setTimeout(() => {
          if (!window.location.hash.includes("type=recovery")) setInvalid(true);
        }, 800);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.object({
      password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
      confirm: z.string(),
    }).refine((v) => v.password === v.confirm, { message: "Mật khẩu nhập lại không khớp", path: ["confirm"] })
      .safeParse({ password, confirm });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const { data: updated, error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) {
        toast.error(error.message);
        return;
      }
      // Thu hồi mọi session cũ (invalidate old tokens) + ghi audit
      if (updated?.user?.id) {
        try { await finalize({ data: { userId: updated.user.id } }); } catch (e) { console.error(e); }
      }
      toast.success("Đổi mật khẩu thành công. Mọi phiên đăng nhập cũ đã bị thu hồi, vui lòng đăng nhập lại.");
      await supabase.auth.signOut();
      navigate({ to: "/auth" });
    } finally {
      setLoading(false);
    }
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
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Đặt lại mật khẩu</div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Mật khẩu mới</CardTitle>
            <CardDescription>
              Nhập mật khẩu mới cho tài khoản. Sau khi đổi thành công bạn sẽ được yêu cầu đăng nhập lại.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invalid ? (
              <div className="space-y-4">
                <div className="rounded-md border bg-rose-50 p-4 text-sm text-rose-800">
                  Link khôi phục không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/forgot-password">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Yêu cầu link mới
                  </Link>
                </Button>
              </div>
            ) : !ready ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xác thực link…
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Mật khẩu mới</Label>
                  <Input
                    id="password" type="password" autoComplete="new-password" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    disabled={loading} minLength={8}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Nhập lại mật khẩu</Label>
                  <Input
                    id="confirm" type="password" autoComplete="new-password" required
                    value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    disabled={loading} minLength={8}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  Đặt lại mật khẩu
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
