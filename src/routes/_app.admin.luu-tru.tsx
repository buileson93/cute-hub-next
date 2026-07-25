import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HardDrive, Cloud, Loader2, Save, ShieldAlert, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/mirats/PageHeader";
import { AccessDenied } from "@/components/mirats/AccessDenied";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import {
  useStorageConfig, useSaveStorageConfig,
  DEFAULT_STORAGE_CONFIG, type StoragePrimary,
} from "@/lib/mirats/storage-config";

export const Route = createFileRoute("/_app/admin/luu-tru")({
  head: () => ({
    meta: [
      { title: "Lưu trữ tệp — Quản trị MIRATS" },
      { name: "description", content: "Cấu hình backend lưu trữ (Lovable Cloud & Cloudflare R2) chạy song song." },
    ],
  }),
  component: Page,
});

function Page() {
  const { hasRole } = useSession();
  if (!hasRole("admin")) return <AccessDenied backTo="/" backLabel="Về trang chủ" />;
  return <Content />;
}

function Content() {
  const { data, isLoading } = useStorageConfig();
  const save = useSaveStorageConfig();
  const [primary, setPrimary] = useState<StoragePrimary>(DEFAULT_STORAGE_CONFIG.primary);
  const [dualWrite, setDualWrite] = useState(DEFAULT_STORAGE_CONFIG.dualWrite);

  useEffect(() => {
    if (data) { setPrimary(data.primary); setDualWrite(data.dualWrite); }
  }, [data]);

  const dirty = !!data && (data.primary !== primary || data.dualWrite !== dualWrite);

  async function onSave() {
    try {
      await save.mutateAsync({ primary, dualWrite });
      toast.success("Đã lưu cấu hình lưu trữ. Áp dụng cho các lượt upload tiếp theo.");
    } catch (e: any) {
      toast.error("Lưu thất bại: " + e.message);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Lưu trữ tệp"
        subtitle="Chọn backend chính và bật ghi song song để chuyển đổi mượt giữa Lovable Cloud & Cloudflare R2."
      />

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải cấu hình…
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Backend chính (nguồn đọc)</CardTitle>
              <CardDescription>
                Nơi ứng dụng lấy đường dẫn/URL để hiển thị và tải xuống. Có thể đổi bất cứ lúc nào.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={primary} onValueChange={(v) => setPrimary(v as StoragePrimary)} className="grid gap-3 md:grid-cols-2">
                <BackendOption
                  value="supabase" checked={primary === "supabase"}
                  icon={<Cloud className="h-5 w-5" />}
                  title="Lovable Cloud"
                  desc="Supabase Storage tích hợp sẵn, RLS + public URL, không tốn cấu hình."
                  active={data?.primary === "supabase"}
                />
                <BackendOption
                  value="r2" checked={primary === "r2"}
                  icon={<HardDrive className="h-5 w-5" />}
                  title="Cloudflare R2"
                  desc="Kho object riêng, presigned URL, chi phí thấp cho tệp lớn/nhiều."
                  active={data?.primary === "r2"}
                />
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ghi song song (dual-write)</CardTitle>
              <CardDescription>
                Bật để mỗi tệp mới được ghi sang CẢ hai backend. Nếu backend chính lỗi tạm thời, bản sao ở backend còn
                lại vẫn có sẵn — an toàn khi chuyển đổi hoặc thử nghiệm.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="dualWrite" className="text-sm font-medium">
                  Ghi song song sang cả Lovable Cloud & R2
                </Label>
                <p className="text-xs text-muted-foreground">
                  Khi tắt: chỉ ghi sang backend chính. Khi bật: ghi cả hai, đọc từ backend chính.
                </p>
              </div>
              <Switch id="dualWrite" checked={dualWrite} onCheckedChange={setDualWrite} />
            </CardContent>
          </Card>

          <div className="flex items-center gap-2">
            <Button onClick={onSave} disabled={!dirty || save.isPending} className="gap-1.5">
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Lưu cấu hình
            </Button>
            {dirty && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Sẽ đổi:</span>
                {data?.primary !== primary && (
                  <Badge variant="outline" className="gap-1">
                    Primary: {data?.primary} <ArrowRight className="h-3 w-3" /> {primary}
                  </Badge>
                )}
                {data?.dualWrite !== dualWrite && (
                  <Badge variant="outline">Dual-write: {dualWrite ? "Bật" : "Tắt"}</Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="space-y-1">
              <p>Cấu hình này chỉ ảnh hưởng các luồng upload đã tích hợp <code>dualUpload()</code>. Các luồng cũ vẫn ghi trực tiếp về Supabase Storage — sẽ chuyển dần theo lộ trình.</p>
              <p>Trong giai đoạn thử nghiệm, khuyến nghị: <strong>primary = Lovable Cloud</strong> + <strong>dual-write = Bật</strong>. Khi đủ tin cậy, chuyển primary sang R2 và có thể tắt dual-write để tiết kiệm.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BackendOption({
  value, checked, icon, title, desc, active,
}: { value: string; checked: boolean; icon: React.ReactNode; title: string; desc: string; active?: boolean }) {
  return (
    <label
      htmlFor={`bk-${value}`}
      className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition ${
        checked ? "border-primary bg-primary/5" : "hover:bg-muted/40"
      }`}
    >
      <RadioGroupItem id={`bk-${value}`} value={value} className="mt-1" />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-sm font-medium">{title}</span>
          {active && <Badge variant="secondary" className="text-[10px]">Đang dùng</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </label>
  );
}
