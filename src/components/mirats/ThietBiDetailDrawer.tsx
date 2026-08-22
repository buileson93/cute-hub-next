// ============================================================================
// NGĂN (drawer) CHI TIẾT THIẾT BỊ — mở khi bấm vào một dòng trong Danh mục.
// Hiển thị tóm tắt (ảnh mẫu, trạng thái, hệ thống, thông tin chính), toàn bộ
// trường dữ liệu, và cho phép GÁN / CHUYỂN / GỠ hệ thống ngay tại ngăn.
// ============================================================================
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  HardDrive,
  Package,
  PackagePlus,
  PackageMinus,
  PackageOpen,
  ExternalLink,
  History,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { AppTooltip } from "@/components/mirats/AppTooltip";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { CodeBadge } from "@/components/mirats/CodeBadge";
import { Button } from "@/components/ui/button";
import { ThietBiAllFields } from "@/components/mirats/ThietBiAllFields";
import { DeviceMovementHistoryList } from "@/components/mirats/DeviceMovementHistory";
import { LayerSectionHeader } from "@/lib/mirats/layer-vocab";
import { useVaiTroThietBi } from "@/lib/mirats/he-thong-thanh-phan";
import { storage } from "@/lib/storage";
import { supabase } from "@/integrations/backend/client";
import { type DbDevice } from "@/lib/mirats/db-taxonomy";
import { sortDacTinh, type DacTinh } from "@/lib/mirats/dac-tinh";
import { MauChip } from "@/components/mirats/MauChip";
import { cn } from "@/lib/utils";

import { StatusBadge } from "@/components/mirats/StatusBadge";

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 break-words font-medium">{children}</span>
    </div>
  );
}

/** Dòng "Nhãn tài sản": chip đa trị kế thừa từ Mẫu qua view v_thiet_bi_dac_tinh. */
function DacTinhRow({ deviceId }: { deviceId: string }) {
  const { data } = useQuery({
    queryKey: ["thiet_bi_dac_tinh_row", deviceId],
    enabled: !!deviceId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: links, error: e1 } = await supabase
        .from("v_thiet_bi_dac_tinh")
        .select("dac_tinh_id")
        .eq("thiet_bi_id", deviceId);
      if (e1) throw e1;
      const ids = (links ?? []).map((r) => r.dac_tinh_id).filter((x): x is string => !!x);
      if (!ids.length) return [] as DacTinh[];
      const { data: tags, error: e2 } = await supabase
        .from("dm_dac_tinh")
        .select("ma, ten, thu_tu, mau")
        .in("id", ids);
      if (e2) throw e2;
      return (tags ?? []) as DacTinh[];
    },
  });
  const tags = sortDacTinh(data ?? []);
  if (!tags.length) {
    return (
      <SummaryRow label="Nhãn tài sản">
        <span className="text-muted-foreground">—</span>
      </SummaryRow>
    );
  }
  return (
    <SummaryRow label="Nhãn tài sản">
      <div className="flex flex-wrap gap-1">
        {tags.map((t) => (
          <MauChip key={t.ma} ten={t.ten} mau={t.mau ?? null} title={t.ten} />
        ))}
      </div>
    </SummaryRow>
  );
}

/** Chip Chủng loại có màu theo dm_loai_thiet_bi.mau. */
function LoaiChip({ loaiId, ten }: { loaiId: string | null | undefined; ten: string }) {
  const { data } = useQuery({
    queryKey: ["dm_loai_thiet_bi_mau", loaiId],
    enabled: !!loaiId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dm_loai_thiet_bi")
        .select("mau")
        .eq("id", loaiId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.mau ?? null) as string | null;
    },
  });
  return <MauChip ten={ten} mau={data ?? null} />;
}

function TuongThichSection({ deviceId }: { deviceId: string }) {
  const { data } = useQuery({
    queryKey: ["thiet_bi_tuong_thich_detail", deviceId],
    enabled: !!deviceId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thiet_bi_he_thong_tuong_thich")
        .select(
          `
          phan_loai,
          danh_gia,
          he_thong:he_thong_id (ten, ma)
        `,
        )
        .eq("thiet_bi_id", deviceId);
      if (error) throw error;
      return data;
    },
  });

  if (!data?.length) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
        <ShieldCheck className="h-3 w-3 text-emerald-600" /> Hệ thống có thể thay thế
      </div>
      <div className="space-y-1.5 rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-2.5">
        {data.map((item: any, idx: number) => (
          <div
            key={idx}
            className="flex flex-col gap-0.5 border-b border-emerald-500/10 pb-1.5 last:border-0 last:pb-0"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                {(item.he_thong as any)?.ten || "Hệ thống"}
              </span>
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
                {item.phan_loai}
              </Badge>
            </div>
            {item.danh_gia && (
              <p className="text-[11px] italic text-muted-foreground line-clamp-1">
                “{item.danh_gia}”
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/** LỚP 2 — Thành phần hệ thống: tài sản đang lắp vào vai trò nào (kế thừa vị trí/trạng thái). */

function ThanhPhanSection({ device }: { device: DbDevice }) {
  const { data: vaiTroList = [], isLoading } = useVaiTroThietBi(device.id);
  const installed = vaiTroList.length > 0 || !!device._htId;
  const multi = vaiTroList.length >= 2;
  return (
    <section className="space-y-2">
      <LayerSectionHeader layer="tp" />
      {!installed ? (
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-600">
          <PackageOpen className="h-3.5 w-3.5" /> Chưa lắp vào thành phần nào (tài sản đang rảnh).
        </div>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      ) : (
        <div className="space-y-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
          <SummaryRow
            label={multi ? `Đang đảm nhận (${vaiTroList.length} vai trò)` : "Đang đảm nhận"}
          >
            {vaiTroList.length === 0 ? (
              "—"
            ) : (
              <div className="flex flex-col gap-1">
                {vaiTroList.map((r) => (
                  <div key={r.gan_id} className="flex flex-wrap items-baseline gap-1.5">
                    <span className="font-medium">{r.ten_thanh_phan}</span>
                    {r.ma_thanh_phan && (
                      <span className="font-mono text-[11px] font-normal text-muted-foreground">
                        {r.ma_thanh_phan}
                      </span>
                    )}
                    {r.ten_he_thong && (
                      <span className="text-[11px] text-muted-foreground">· {r.ten_he_thong}</span>
                    )}
                  </div>
                ))}
                {multi && (
                  <div className="mt-1 rounded border border-amber-400/50 bg-amber-50 px-2 py-1 text-[11px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                    Tài sản đang đảm nhận đồng thời {vaiTroList.length} vai trò trong các hệ thống
                    khác nhau.
                  </div>
                )}
              </div>
            )}
          </SummaryRow>
          <SummaryRow label="Vị trí">{device._viTriTen || device.vi_tri || "—"}</SummaryRow>
          <SummaryRow label="Trạng thái">
            <StatusBadge domain="thiet_bi" code={device.trang_thai} />
          </SummaryRow>
        </div>
      )}
    </section>
  );
}

export function ThietBiDetailDrawer({
  device,
  open,
  onOpenChange,
  canManage,
  deviceName,
  systemLabel,
  systemNameById,
  onAssign,
  onRemove,
  onEdit,
}: {
  device: DbDevice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  deviceName: (d: DbDevice) => string;
  systemLabel: (d: DbDevice) => string;
  /** UUID hệ thống → nhãn hiển thị (dùng cho phần Lịch sử). */
  systemNameById: (id: string | null) => string;
  onAssign: (d: DbDevice) => void;
  onRemove: (d: DbDevice) => void;
  /** Mở dialog sửa nhanh ngay tại Danh mục (tuỳ chọn). */
  onEdit?: (d: DbDevice) => void;
}) {
  const { data: imgUrl } = useQuery({
    queryKey: ["drawer_model_img", device?._modelAnh],
    enabled: open && !!device?._modelAnh,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await storage
        .from("model-anh")
        .createSignedUrl(device!._modelAnh, 315360000);
      return data?.signedUrl ?? null;
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        {device && (
          <>
            <SheetHeader className="space-y-0 border-b px-5 py-4 text-left">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-primary">
                  <HardDrive className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate text-base leading-tight">
                    {deviceName(device)}
                  </SheetTitle>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <CodeBadge
                      code={device.ma_thiet_bi}
                      title={`Mã tài sản: ${device.ma_thiet_bi}`}
                    />
                    {device.serial && (
                      <span className="font-mono text-[11px] text-muted-foreground">
                        S/N: {device.serial}
                      </span>
                    )}
                    <StatusBadge domain="thiet_bi" code={device.trang_thai} />
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4">
              {/* ── LỚP 1: Tài sản vật lý (máy cụ thể) ── */}
              <section className="space-y-2">
                <LayerSectionHeader layer="tb" />
                <div className="grid gap-4 sm:grid-cols-[132px_1fr]">
                  <div className="rounded-lg border bg-muted/20 p-2 overflow-hidden">
                    <AspectRatio ratio={4 / 3}>
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={device._modelTen}
                          className="h-full w-full rounded object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground">
                          <Package className="h-6 w-6 opacity-40" />
                          Chưa có hình ảnh
                        </div>
                      )}
                    </AspectRatio>
                  </div>
                  <div className="space-y-1.5">
                    <SummaryRow label="Model">{device._modelTen || "—"}</SummaryRow>
                    <SummaryRow label="Chủng loại">
                      {device._loaiTbTen ? (
                        <LoaiChip loaiId={device._loaiTbId} ten={device._loaiTbTen} />
                      ) : (
                        "—"
                      )}
                    </SummaryRow>
                    <DacTinhRow deviceId={device.id} />
                    <SummaryRow label="Số serial">{device.serial || "—"}</SummaryRow>
                  </div>
                </div>
              </section>

              {/* ── LỚP 2: Thành phần hệ thống (vai trò đang đảm nhận) ── */}
              <ThanhPhanSection device={device} />

              {/* ── Khả năng thay thế tương thích ── */}
              <TuongThichSection deviceId={device.id} />

              {/* ── LỚP 3: Hệ thống (ngữ cảnh cấp cao) ── */}

              {device._htId && (
                <section className="space-y-2">
                  <LayerSectionHeader layer="ht" />
                  <div className="space-y-1.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
                    <SummaryRow label="Hệ thống">{systemLabel(device)}</SummaryRow>
                    <SummaryRow label="Nhóm hệ thống">{device._nhTen || "—"}</SummaryRow>
                    <SummaryRow label="Phân loại">{device._plTen || "—"}</SummaryRow>
                    <SummaryRow label="Đơn vị">{device.don_vi || "—"}</SummaryRow>
                  </div>
                </section>
              )}

              {/* Toàn bộ trường dữ liệu */}
              <ThietBiAllFields maThietBi={device.ma_thiet_bi} />

              {/* Lịch sử gán / chuyển / gỡ khỏi hệ thống (ai làm, lúc nào, trước → sau) */}
              <div className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold">
                  <History className="h-4 w-4 text-primary" /> Lịch sử gán / chuyển / gỡ hệ thống
                </h4>
                <DeviceMovementHistoryList
                  deviceMa={device.ma_thiet_bi}
                  systemName={systemNameById}
                />
              </div>
            </div>

            {/* Thanh hành động — gán / chuyển / gỡ + mở trang chi tiết đầy đủ */}
            <div className="flex flex-wrap items-center gap-2 border-t bg-muted/20 px-5 py-3">
              {canManage && (
                <>
                  {onEdit ? (
                    <AppTooltip noiDung="Sửa nhanh thông tin tài sản">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-8 w-8 p-0"
                        onClick={() => onEdit(device)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Sửa nhanh</span>
                      </Button>
                    </AppTooltip>
                  ) : (
                    <AppTooltip noiDung="Sửa thông tin tài sản trong cây hệ thống">
                      <Button asChild size="sm" variant="default" className="h-8 w-8 p-0">
                        <Link to="/he-thong/cay" search={{ editTb: device.ma_thiet_bi }}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Sửa thông tin</span>
                        </Link>
                      </Button>
                    </AppTooltip>
                  )}
                  <AppTooltip
                    noiDung={
                      device._htId
                        ? "Chuyển tài sản sang hệ thống khác"
                        : "Gán tài sản vào hệ thống"
                    }
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => onAssign(device)}
                    >
                      <PackagePlus className="h-4 w-4" />
                      <span className="sr-only">
                        {device._htId ? "Chuyển hệ thống" : "Gán vào hệ thống"}
                      </span>
                    </Button>
                  </AppTooltip>
                  {device._htId && (
                    <AppTooltip noiDung="Gỡ tài sản khỏi hệ thống hiện tại">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-amber-600"
                        onClick={() => onRemove(device)}
                      >
                        <PackageMinus className="h-4 w-4" />
                        <span className="sr-only">Gỡ khỏi hệ thống</span>
                      </Button>
                    </AppTooltip>
                  )}
                </>
              )}
              <AppTooltip noiDung="Mở trang hồ sơ chi tiết đầy đủ của tài sản">
                <Button asChild size="sm" variant="ghost" className="ml-auto h-8 w-8 p-0">
                  <Link
                    to="/thiet-bi/$maThietBi"
                    params={{ maThietBi: device.ma_thiet_bi }}
                    search={{ tab: "tong-quan", doc: undefined, q: undefined }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">Mở trang chi tiết</span>
                  </Link>
                </Button>
              </AppTooltip>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
