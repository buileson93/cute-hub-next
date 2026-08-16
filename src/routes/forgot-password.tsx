import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Satellite, Mail, Loader2, ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
import { requestPasswordReset, issuePasswordResetChallenge } from "@/lib/password-reset.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Quên mật khẩu — MIRATS 2.0" },
      { name: "description", content: "Yêu cầu đặt lại mật khẩu tài khoản MIRATS 2.0." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [challenge, setChallenge] = useState<{ token: string; question: string } | null>(null);
  const [answer, setAnswer] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const submit = useServerFn(requestPasswordReset);
  const issue = useServerFn(issuePasswordResetChallenge);

  async function loadChallenge() {
    setRefreshing(true);
    try {
      const c = await issue();
      setChallenge({ token: c.token, question: c.question });
      setAnswer("");
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }

  // Nạp challenge một lần khi mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void loadChallenge(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().trim().email("Email không hợp lệ").safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!challenge) { toast.error("Chưa có mã CAPTCHA, thử làm mới."); return; }
    const ansParsed = z.coerce.number().int().safeParse(answer);
    if (!ansParsed.success) { toast.error("Đáp án CAPTCHA phải là số."); return; }

    setLoading(true);
    try {
      const res = await submit({
        data: {
          email: parsed.data,
          redirectTo: `${window.location.origin}/reset-password`,
          challengeToken: challenge.token,
          challengeAnswer: ansParsed.data,
        },
      });
      if (!res.ok) {
        toast.error("Xác nhận CAPTCHA sai hoặc đã hết hạn. Vui lòng thử lại.");
        await loadChallenge();
        return;
      }
      setSent(true);
      toast.success("Nếu email hợp lệ, link đặt lại mật khẩu đã được gửi");
    } catch (err) {
      toast.error("Không gửi được yêu cầu. Vui lòng thử lại sau.");
      console.error(err);
      await loadChallenge();
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
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Khôi phục mật khẩu</div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Quên mật khẩu</CardTitle>
            <CardDescription>
              Nhập email tài khoản và giải CAPTCHA. Hệ thống chỉ gửi link cho tài khoản đã được duyệt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <div className="rounded-md border bg-emerald-50 p-4 text-sm text-emerald-800">
                  Nếu <b>{email}</b> khớp một tài khoản đang hoạt động, link đặt lại mật khẩu đã được gửi vào hộp thư. Vui lòng kiểm tra Inbox và Spam. Link có hiệu lực trong thời gian giới hạn và chỉ dùng được 1 lần.
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/auth">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại đăng nhập
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email" type="email" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="ten@example.com" disabled={loading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="captcha" className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Xác nhận: bạn không phải bot
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm">
                      {challenge?.question ?? "…"}
                    </div>
                    <Input
                      id="captcha" inputMode="numeric" required
                      value={answer} onChange={(e) => setAnswer(e.target.value)}
                      placeholder="?" disabled={loading || !challenge}
                      className="w-24"
                    />
                    <Button
                      type="button" variant="outline" size="icon"
                      onClick={loadChallenge} disabled={refreshing || loading}
                      aria-label="Làm mới CAPTCHA"
                    >
                      <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading || !challenge}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  Gửi link đặt lại mật khẩu
                </Button>
                <div className="text-center">
                  <Link to="/auth" className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
                    <ArrowLeft className="mr-1 inline h-3 w-3" /> Quay lại đăng nhập
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
