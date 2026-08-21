import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { LogIn, Loader2, ScanFace, UserPlus } from "lucide-react";
import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { supabase } from "@/integrations/backend/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import vatmLogoFull from "@/assets/vatm-mirats-full-v2.svg.asset.json";
const vatmLogoFullSrc = vatmLogoFull.url;
import { getAuthenticationOptions, verifyAuthentication } from "@/lib/passkey.functions";
import { AtcTowerScene } from "@/components/mirats/AtcTowerScene";
import { markActivityNow } from "@/lib/mirats/auth/activity";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Đăng nhập — MIRATS" },
      { name: "description", content: "Đăng nhập vào hệ thống quản lý tài sản kỹ thuật MIRATS." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const { next } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setPasskeySupported(browserSupportsWebAuthn());
    // Chỉ hiển thị passkey trên thiết bị di động
    const mobile =
      typeof window !== "undefined" &&
      (window.matchMedia("(pointer: coarse)").matches ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
    setIsMobile(mobile);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: (next as never) ?? "/" });
    });
  }, [navigate, next]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const parsed = z.object({
        email: z.string().trim().email("Email không hợp lệ"),
        password: z.string().min(1, "Nhập mật khẩu"),
      }).safeParse({ email, password });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) {
        toast.error(error.message === "Invalid login credentials"
          ? "Sai email hoặc mật khẩu"
          : error.message);
        return;
      }
      // Server đã xác nhận phiên mới — reset đồng hồ idle ngay tại đây
      // để không bị hook đọc timestamp cũ từ phiên trước và tự đăng xuất.
      markActivityNow();
      toast.success("Đăng nhập thành công");
      navigate({ to: (next as never) ?? "/" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const parsed = z.object({
        fullName: z.string().trim().min(2, "Nhập họ tên"),
        email: z.string().trim().email("Email không hợp lệ"),
        password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
      }).safeParse({ fullName, email, password });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: parsed.data.fullName },
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Đăng ký thành công. Vui lòng chờ quản trị viên duyệt.");
      setMode("signin");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasskey() {
    setPasskeyLoading(true);
    try {
      const optionsJSON = await getAuthenticationOptions();
      let asseResp;
      try {
        asseResp = await startAuthentication({ optionsJSON });
      } catch (e) {
        const err = e as Error;
        if (err.name === "NotAllowedError") {
          toast.info("Đã hủy hoặc không tìm thấy passkey trên thiết bị này.");
        } else {
          toast.error("Không thể quét sinh trắc học", { description: err.message });
        }
        return;
      }
      const result = await verifyAuthentication({ data: { response: asseResp } });
      if (!result.success) {
        toast.error(result.error ?? "Đăng nhập thất bại");
        return;
      }
      const { error } = await supabase.auth.verifyOtp({
        token_hash: result.tokenHash,
        type: "magiclink",
      });
      if (error) {
        toast.error("Không tạo được phiên đăng nhập", { description: error.message });
        return;
      }
      markActivityNow();
      toast.success("Đăng nhập thành công");
      navigate({ to: (next as never) ?? "/" });
    } finally {
      setPasskeyLoading(false);
    }
  }

  const busy = loading || passkeyLoading;
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const enter = !mounted || reduce
    ? {}
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };
  const showPasskey = passkeySupported && isMobile;

  return (
    <div className="min-h-dvh bg-[#f8fafc] p-4 lg:p-10 flex items-center justify-center">
      <div className="w-full max-w-[1280px] grid min-h-[800px] overflow-hidden rounded-[32px] bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] ring-1 ring-black/5 lg:grid-cols-2">
        {/* Left: form */}
        <div className="flex flex-col justify-center p-8 sm:p-16 lg:p-20">
          <motion.div
            {...enter}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full max-w-[420px]"
          >
            <motion.div
              {...enter}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="mb-12"
            >
              <img
                src={vatmLogoFullSrc}
                alt="VATM MIRATS"
                className="h-16 w-auto object-contain"
              />
            </motion.div>

            {/* Tabs */}
            <div className="relative mb-10 flex rounded-2xl bg-[#f1f5f9] p-1.5">
              <motion.div
                aria-hidden
                className="absolute inset-y-1.5 w-[calc(50%-4.5px)] rounded-xl bg-white shadow-sm ring-1 ring-black/5"
                animate={{ x: mode === "signin" ? "6px" : "calc(100% - 3px)" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`relative z-10 flex-1 flex items-center justify-center rounded-xl py-3 text-[15px] font-semibold transition-colors ${
                    mode === m ? "text-[#0074e2]" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "signin" ? "Đăng nhập" : "Đăng ký"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {mode === "signin" ? (
                <motion.form
                  key="signin"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleSignIn}
                >
                  <div className="space-y-6">
                    <Field id="email" label="Email" type="email" autoComplete="email"
                      value={email} onChange={setEmail} disabled={busy} placeholder="ten@example.com" />
                    <Field id="password" label="Mật khẩu" type="password" autoComplete="current-password"
                      value={password} onChange={setPassword} disabled={busy}
                      rightSlot={
                        <a href="/forgot-password" data-command-ignore className="text-xs font-medium text-muted-foreground hover:text-[#0074e2]">
                          Quên mật khẩu?
                        </a>
                      } />
                    <button
                      type="submit"
                      disabled={busy}
                      style={{ 
                        display: 'flex', 
                        height: '56px', 
                        width: '100%', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#0074e2',
                        color: 'white',
                        fontSize: '17px',
                        fontWeight: 'bold',
                        borderRadius: '16px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 20px 25px -5px rgba(0, 116, 226, 0.2), 0 8px 10px -6px rgba(0, 116, 226, 0.2)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0066c7'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0074e2'}
                      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {loading ? (
                        <Loader2 className="mr-3 h-5.5 w-5.5 animate-spin" />
                      ) : (
                        <LogIn className="mr-3 h-5.5 w-5.5 transition-transform group-hover:translate-x-1" />
                      )}
                      Đăng nhập
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleSignUp}
                >
                  <div className="space-y-6">
                    <Field id="fullName" label="Họ và tên" type="text" autoComplete="name"
                      value={fullName} onChange={setFullName} disabled={busy} placeholder="Nguyễn Văn A" />
                    <Field id="email" label="Email" type="email" autoComplete="email"
                      value={email} onChange={setEmail} disabled={busy} placeholder="ten@example.com" />
                    <Field id="password" label="Mật khẩu" type="password" autoComplete="new-password"
                      value={password} onChange={setPassword} disabled={busy} placeholder="Tối thiểu 8 ký tự" />
                    <button
                      type="submit"
                      disabled={busy}
                      style={{ 
                        display: 'flex', 
                        height: '56px', 
                        width: '100%', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#0074e2',
                        color: 'white',
                        fontSize: '17px',
                        fontWeight: 'bold',
                        borderRadius: '16px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 20px 25px -5px rgba(0, 116, 226, 0.2), 0 8px 10px -6px rgba(0, 116, 226, 0.2)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0066c7'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0074e2'}
                      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {loading ? (
                        <Loader2 className="mr-3 h-5.5 w-5.5 animate-spin" />
                      ) : (
                        <UserPlus className="mr-3 h-5.5 w-5.5 transition-transform group-hover:scale-110" />
                      )}
                      Đăng ký
                    </button>
                    <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
                      Tài khoản mới sẽ ở trạng thái <b className="text-foreground">chờ duyệt</b>. Quản trị viên sẽ kích hoạt và gán vai trò.
                    </p>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {showPasskey && mode === "signin" && (
              <>
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">HOẶC</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="group h-12 w-full rounded-xl border-border transition-all hover:border-primary/50 hover:bg-primary/5"
                  onClick={handlePasskey}
                  disabled={busy}
                >
                  {passkeyLoading
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <ScanFace className="mr-2 h-5 w-5 text-[#0074e2] transition-transform group-hover:scale-110" />}
                  Đăng nhập bằng FaceID / Vân tay
                </Button>
              </>
            )}
          </motion.div>
        </div>

        {/* Right: animated ATC scene */}
        <div className="relative hidden overflow-hidden lg:block">
          <AtcTowerScene />
        </div>
      </div>
    </div>
  );
}

function Field({
  id, label, type, value, onChange, disabled, placeholder, autoComplete, rightSlot,
}: {
  id: string; label: string; type: string; value: string;
  onChange: (v: string) => void; disabled?: boolean;
  placeholder?: string; autoComplete?: string; rightSlot?: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        <Label htmlFor={id} className="text-[15px] font-bold text-foreground/90">{label}</Label>
        {rightSlot}
      </div>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="!h-13 !rounded-2xl border-slate-200 bg-slate-50/30 px-5 text-[15px] transition-all focus-within:!ring-4 focus-within:!ring-[#0074e2]/10 focus-within:!border-[#0074e2]/40 focus-within:!bg-white focus-within:!outline-none"
      />
    </div>
  );
}
