import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { useEffect, useMemo } from "react";
import {
  Loader2, QrCode, ArrowLeft, AlertTriangle, BookOpen, Wrench, FileBadge, MapPin, WifiOff, History, Camera, Check,
} from "lucide-react";
import { CompletenessRing } from "@/components/mirats/CompletenessRing";
import { calculateCompleteness } from "@/lib/mirats/completeness";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCache, putCache, pushRecentQr, listRecentQr } from "@/lib/mirats/offline-cache";
import { VoiceQuickLog } from "@/components/mirats/VoiceQuickLog";

// N7 — Landing card mobile cho quét QR: /q/:maThietBi
// - Buộc đăng nhập; nếu chưa auth → chuyển /auth?redirect=/q/<ma>.
// - RLS quyết định thấy tài sản hay không. Không phân biệt "không có" vs "không quyền" ở UI.
// - Không auto-redirect sang lý lịch — hiển thị hành động chính, đặc biệt "Báo sự cố".
export const Route = createFileRoute("/q/$maThietBi")({
  head: ({ params }) => ({
    meta: [
      { title: `Quét QR ${params.maThietBi} — MIRATS 2.0` },
      { name: "description", content: `Tra cứu nhanh tài sản ${params.maThietBi} qua QR: xem lý lịch, báo sự cố, tra bảo trì.` },
      { name: "robots", content: "noindex" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
    ],
  }),
  component: QuetQrLanding,
});

interface ScanRow {
  id: string;
  ma_thiet_bi: string;
  ten: string | null;
  trang_thai: string | null;
  don_vi_ten: string | null;
  he_thong_ten: string | null;
  vi_tri_ten: string | null;
}

function QuetQrLanding() {
  const { maThietBi } = Route.useParams();
  const navigate = useNavigate();
  const { loading: authLoading, user } = useSession();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const redirect = `/q/${encodeURIComponent(maThietBi)}`;
      void navigate({ to: "/auth", search: { redirect } as never, replace: true });
    }
  }, [authLoading, user, maThietBi, navigate]);

  const cacheKey = `qr:${maThietBi}`;
  // Đọc cache 1 lần khi mount — dùng làm fallback nếu offline hoặc query lỗi.
  const cached = useMemo(() => getCache<ScanRow>(cacheKey), [cacheKey]);
  const recent = useMemo(() => listRecentQr(), []);

  const enabled = !authLoading && !!user;
  const { data: fresh, isLoading, isError } = useQuery<ScanRow | null>({
    queryKey: ["qr-landing", maThietBi],
    enabled,
    retry: false,
    // Có bản cached → không cần loading spinner, hiển thị ngay dữ liệu cũ.
    placeholderData: cached?.data ?? undefined,
    queryFn: async () => {
      const { data: tb, error } = await supabase
        .from("thiet_bi")
        .select("id, ma_thiet_bi, ten_thiet_bi, don_vi_id, vi_tri_id, trang_thai_id, he_thong_id, ma_serial, model_id, nam_san_xuat")
        .eq("ma_thiet_bi", maThietBi)
        .maybeSingle();
      if (error) throw error;
      if (!tb) return null;

      const [dvRes, vtRes, ttRes, htRes] = await Promise.all([
        tb.don_vi_id
          ? supabase.from("dm_don_vi").select("ten").eq("id", tb.don_vi_id).maybeSingle()
          : Promise.resolve({ data: null as { ten: string } | null }),
        tb.vi_tri_id
          ? supabase.from("dm_vi_tri").select("ten").eq("id", tb.vi_tri_id).maybeSingle()
          : Promise.resolve({ data: null as { ten: string } | null }),
        tb.trang_thai_id
          ? supabase.from("dm_trang_thai_thiet_bi").select("ten").eq("id", tb.trang_thai_id).maybeSingle()
          : Promise.resolve({ data: null as { ten: string } | null }),
        tb.he_thong_id
          ? supabase.from("dm_he_thong").select("ten").eq("id", tb.he_thong_id).maybeSingle()
          : Promise.resolve({ data: null as { ten: string } | null }),
      ]);

      const row: ScanRow = {
        id: tb.id,
        ma_thiet_bi: tb.ma_thiet_bi,
        ten: tb.ten_thiet_bi ?? null,
        trang_thai: (ttRes as { data: { ten: string } | null }).data?.ten ?? null,
        don_vi_ten: (dvRes as { data: { ten: string } | null }).data?.ten ?? null,
        vi_tri_ten: (vtRes as { data: { ten: string } | null }).data?.ten ?? null,
        he_thong_ten: (htRes as { data: { ten: string } | null }).data?.ten ?? null,
      };
      // Ghi cache + đẩy vào danh sách QR gần đây để mở lại offline.
      putCache(cacheKey, row);
      pushRecentQr({ ma: row.ma_thiet_bi, ten: row.ten });
      return row;
    },
  });

  // Ưu tiên dữ liệu server; fallback về cache khi lỗi hoặc chưa có kết quả.
  const data = fresh ?? cached?.data ?? null;
  const fromCache = !fresh && !!cached?.data;


  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-600 text-base">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang xác thực…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 p-4 flex items-start justify-center">
      <div className="w-full max-w-[480px] space-y-3">
        {isLoading && !data && (
          <Card><CardContent className="p-6 flex items-center gap-2 text-slate-600 text-base">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tra mã tài sản…
          </CardContent></Card>
        )}

        {fromCache && (
          <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
            <WifiOff className="h-3.5 w-3.5" />
            <span>Đang xem bản lưu offline (lưu lúc {new Date(cached!.savedAt).toLocaleString("vi-VN")}). Dữ liệu có thể chưa cập nhật.</span>
          </div>
        )}

        {!isLoading && !data && (
          <Card><CardContent className="p-6 space-y-3 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <QrCode className="h-6 w-6 text-slate-500" />
            </div>
            <h1 className="text-lg font-semibold">Không có quyền xem hoặc tài sản không tồn tại</h1>
            <p className="text-sm text-slate-600">
              Mã <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{maThietBi}</span> không truy cập được với tài khoản hiện tại.
            </p>
            {isError && <p className="text-xs text-red-600">Có lỗi kết nối. Kiểm tra mạng và thử lại — nếu bạn đã từng mở mã này, có thể tra cứu bản lưu offline ở danh sách bên dưới.</p>}
            <div className="pt-2"><Button asChild variant="outline" size="sm">
              <Link to="/"><ArrowLeft className="h-4 w-4 mr-1.5" /> Về trang chủ</Link>
            </Button></div>
          </CardContent></Card>
        )}

        {!data && recent.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <History className="h-3.5 w-3.5" /> QR gần đây (mở lại được khi offline)
              </div>
              <div className="flex flex-col gap-1">
                {recent.slice(0, 8).map((r) => (
                  <Link
                    key={r.ma}
                    to="/q/$maThietBi"
                    params={{ maThietBi: r.ma }}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-slate-100"
                  >
                    <span className="font-mono text-primary truncate">{r.ma}</span>
                    <span className="text-xs text-slate-500 truncate ml-2">{r.ten ?? ""}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <QrCode className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-sm text-primary">{data.ma_thiet_bi}</div>
                    <h1 className="text-base font-semibold leading-tight truncate">{data.ten ?? "—"}</h1>
                  </div>
                  {data.trang_thai && <Badge variant="secondary" className="shrink-0">{data.trang_thai}</Badge>}
                </div>

                <div className="grid grid-cols-1 gap-1.5 text-sm text-slate-700 pt-1">
                  {data.don_vi_ten && <div><span className="text-slate-500">Đơn vị: </span>{data.don_vi_ten}</div>}
                  {data.he_thong_ten && <div><span className="text-slate-500">Hệ thống: </span>{data.he_thong_ten}</div>}
                  {data.vi_tri_ten && <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />{data.vi_tri_ten}
                  </div>}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button asChild size="lg" className="h-16 text-lg font-bold shadow-md active:scale-95 transition-transform bg-red-600 hover:bg-red-700">
                <Link to="/su-co/moi" search={{ thietBi: data.ma_thiet_bi, from: "qr" } as never}>
                  <AlertTriangle className="h-6 w-6 mr-2" /> Báo sự cố
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="h-16 text-lg font-bold shadow-md active:scale-95 transition-transform border-2 border-primary/20">
                <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: data.ma_thiet_bi }} search={{ tab: "van-hanh" }}>
                  <Wrench className="h-6 w-6 mr-2" /> Ghi bảo trì
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 text-base shadow-sm">
                <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: data.ma_thiet_bi }} search={{ tab: "tong-quan" }}>
                  <BookOpen className="h-5 w-5 mr-2" /> Xem lý lịch
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 text-base shadow-sm">
                <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: data.ma_thiet_bi }} search={{ tab: "ho-so" }}>
                  <FileBadge className="h-5 w-5 mr-2" /> Giấy phép / Chứng chỉ
                </Link>
              </Button>
            </div>

            <Card className="mt-4 border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CompletenessRing value={calculateCompleteness("thiet_bi", fresh || ({} as any))} showText size={48} />
                  <div>
                    <h3 className="text-sm font-bold">Góp dữ liệu tài sản</h3>
                    <p className="text-[10px] text-muted-foreground uppercase">Giúp hệ thống hoàn thiện dữ liệu</p>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline" className="border-emerald-500/50 text-emerald-700 hover:bg-emerald-100">
                  <Link to="/gop-gach">Bắt đầu</Link>
                </Button>
              </CardContent>
            </Card>

            <VoiceQuickLog maThietBi={data.ma_thiet_bi} />
          </>
        )}
      </div>
    </div>
  );
}
