import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2, ShieldCheck, X } from "lucide-react";
import { supabase } from "@/integrations/backend/client";
import { Button } from "@/components/ui/button";

type AuthorizationDetails = {
  client?: { name?: string | null; logo_uri?: string | null } | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
  scope?: string | null;
} | null;

// Local typed wrapper for the beta supabase.auth.oauth namespace.
type OauthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
};
const oauth = (supabase.auth as unknown as { oauth: OauthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Thiếu authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } as never });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate } as never);
    return data;
  },
  component: ConsentPage,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md p-8 text-sm text-destructive">
      Không tải được yêu cầu uỷ quyền: {String((error as Error)?.message ?? error)}
    </main>
  ),
});

function ConsentPage() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "Ứng dụng bên ngoài";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorization_id)
      : await oauth.denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("Máy chủ uỷ quyền không trả về URL chuyển hướng."); return; }
    window.location.href = target;
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center p-8">
      <div className="w-full space-y-5 rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold">Kết nối với MIRATS AI</h1>
            <p className="text-xs text-muted-foreground">Uỷ quyền truy cập dữ liệu qua MCP</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <div className="font-medium text-foreground">{clientName}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            muốn kết nối đến tài khoản MIRATS của bạn và sử dụng các tool đọc dữ liệu <b>với quyền của bạn</b> (RLS đơn vị vẫn áp dụng).
          </div>
        </div>

        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Chỉ đọc — không thể sửa/xoá</li>
          <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Có thể huỷ kết nối bất cứ lúc nào</li>
        </ul>

        {error && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
            <X className="mr-1.5 h-4 w-4" /> Từ chối
          </Button>
          <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
            {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-1.5 h-4 w-4" />}
            Đồng ý kết nối
          </Button>
        </div>
      </div>
    </main>
  );
}
