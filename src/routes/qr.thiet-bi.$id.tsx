import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { Loader2, QrCode, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

// N7 — Alias legacy: /qr/thiet-bi/<uuid> → tra `ma_thiet_bi` rồi redirect /q/<ma>.
// Buộc đăng nhập; RLS quyết định thấy hay không (không leak PII).
export const Route = createFileRoute("/qr/thiet-bi/$id")({
  head: () => ({
    meta: [
      { title: "Quét QR (legacy) — MIRATS" },
      { name: "robots", content: "noindex" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
    ],
  }),
  component: LegacyQrRedirect,
});

function LegacyQrRedirect() {
  const { id } = Route.useParams();
  const { loading: authLoading, user } = useSession();

  const { data, isLoading, isError } = useQuery<{ ma_thiet_bi: string } | null>({
    queryKey: ["qr-legacy", id],
    enabled: !authLoading && !!user,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thiet_bi")
        .select("ma_thiet_bi")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!authLoading && !user) {
    return <Navigate to="/auth" search={{ redirect: `/qr/thiet-bi/${id}` } as never} replace />;
  }
  if (authLoading || isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tra mã…
        </div>
      </div>
    );
  }
  if (data?.ma_thiet_bi) {
    return <Navigate to="/q/$maThietBi" params={{ maThietBi: data.ma_thiet_bi }} replace />;
  }
  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50 p-6">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 space-y-3 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
            <QrCode className="h-6 w-6 text-slate-500" />
          </div>
          <h1 className="text-lg font-semibold">Không có quyền xem hoặc tài sản không tồn tại</h1>
          <p className="text-sm text-slate-600">
            Mã tham chiếu <span className="font-mono">{id}</span> không truy cập được.
          </p>
          {isError && (
            <p className="text-xs text-red-600">Có lỗi kết nối. Kiểm tra mạng và thử lại.</p>
          )}
          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Về trang chủ
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
