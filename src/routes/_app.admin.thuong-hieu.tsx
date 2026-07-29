import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImageUp, Loader2, RotateCcw, ShieldAlert, Info, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/mirats/PageHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { AccessDenied } from "@/components/mirats/AccessDenied";
import {
  useBranding,
  validateLogoFile,
  fileToDataUri,
  LOGO_FULL_KEY,
  LOGO_COMPACT_KEY,
  LOGO_RULES,
} from "@/lib/mirats/branding";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/admin/thuong-hieu")({
  head: () => ({
    meta: [
      { title: "Thương hiệu & Logo — Quản trị MIRATS" },
      { name: "description", content: "Thay đổi logo hiển thị trên toàn hệ thống MIRATS." },
    ],
  }),
  component: ThuongHieuPage,
});

function ThuongHieuPage() {
  const { hasRole } = useSession();
  if (!hasRole("admin")) return <AccessDenied backTo="/" backLabel="Về trang chủ" />;
  return <ThuongHieuContent />;
}

type Slot = {
  key: string;
  title: string;
  desc: string;
  preview: string;
  hasCustom: boolean;
  bg: string;
};

function ThuongHieuContent() {
  const { data, isLoading } = useBranding();
  const qc = useQueryClient();
  const { user } = useSession();
  const [saving, setSaving] = useState<string | null>(null);

  const slots: Slot[] = [
    {
      key: LOGO_FULL_KEY,
      title: "Logo đầy đủ",
      desc: "Hiển thị ở trang đăng nhập. Nên dùng logo ngang có chữ.",
      preview: data?.logoFull ?? "",
      hasCustom: data?.hasCustomFull ?? false,
      bg: "bg-background",
    },
    {
      key: LOGO_COMPACT_KEY,
      title: "Logo thu gọn",
      desc: "Hiển thị ở thanh bên (sidebar). Nên dùng biểu tượng gọn.",
      preview: data?.logoCompact ?? "",
      hasCustom: data?.hasCustomCompact ?? false,
      bg: "bg-sidebar",
    },
  ];

  async function upload(key: string, file: File) {
    const err = validateLogoFile(file);
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(key);
    try {
      const dataUri = await fileToDataUri(file);
      const { error } = await supabase
        .from("app_cai_dat")
        .upsert(
          { khoa: key, gia_tri: dataUri, updated_by: user?.id ?? null, updated_at: new Date().toISOString() },
          { onConflict: "khoa" },
        );
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["app-branding"] });
      toast.success("Đã cập nhật logo. Áp dụng ngay trên toàn hệ thống.");
    } catch (e) {
      toast.error("Lưu logo thất bại: " + (e as Error).message);
    } finally {
      setSaving(null);
    }
  }

  async function reset(key: string) {
    setSaving(key);
    try {
      const { error } = await supabase.from("app_cai_dat").delete().eq("khoa", key);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["app-branding"] });
      toast.success("Đã khôi phục logo mặc định.");
    } catch (e) {
      toast.error("Khôi phục thất bại: " + (e as Error).message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Thương hiệu & Logo"
        subtitle="Tải logo tuỳ chỉnh, áp dụng ngay trên toàn hệ thống."
        help={<>Áp dụng cho thanh bên và trang đăng nhập.</>}
      />




      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {slots.map((s) => (
            <LogoSlot key={s.key} slot={s} saving={saving === s.key} onUpload={upload} onReset={reset} />
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        Chỉ tài khoản quản trị mới thay đổi được logo. Logo lưu trực tiếp trong cơ sở dữ liệu và hiển thị đồng bộ ở
        mọi tài sản ngay sau khi lưu (không cần đăng xuất).
      </div>
    </div>
  );
}

function Req({ label, value }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
      <span>
        <span className="font-medium text-foreground">{label}:</span> {value}
      </span>
    </div>
  );
}

function LogoSlot({
  slot,
  saving,
  onUpload,
  onReset,
}: {
  slot: Slot;
  saving: boolean;
  onUpload: (key: string, file: File) => void;
  onReset: (key: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{slot.title}</CardTitle>
        <CardDescription>{slot.desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={cn("flex h-28 items-center justify-center rounded-md border p-4", slot.bg)}>
          {slot.preview ? (
            <img src={slot.preview} alt={slot.title} className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-xs text-muted-foreground">Chưa có logo</span>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(slot.key, f);
            e.target.value = "";
          }}
        />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
            Tải logo lên
          </Button>
          {slot.hasCustom && (
            <Button size="sm" variant="outline" onClick={() => onReset(slot.key)} disabled={saving} className="gap-1.5">
              <RotateCcw className="h-4 w-4" /> Mặc định
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
