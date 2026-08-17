import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HardDrive, Cloud, Loader2, Save, ShieldAlert, ArrowRight, Eye, EyeOff, PlugZap, History, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Input } from "@/components/ui/input";
import { getR2Config, saveR2Config, testR2Config } from "@/lib/mirats/r2-config.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/mirats/PageHeader";
import { AccessDenied } from "@/components/mirats/AccessDenied";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageBody } from "@/components/mirats/PageBody";
import { PageSection } from "@/components/mirats/layout/PageSection";
import { StartPanel } from "@/components/mirats/layout/PageLayouts";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import { FullDumpButton } from "@/components/mirats/FullDumpButton";
import { DumpZipRestore } from "@/components/mirats/DumpZipRestore";
import { r2Ping } from "@/lib/mirats/r2.functions";
import { runStorageHealthCheck, listStorageHealthChecks } from "@/lib/mirats/health-check.functions";
import { validateR2Config, hasBlockingIssue, type R2ValidationIssue } from "@/lib/mirats/r2-validate";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useStorageConfig, useSaveStorageConfig, toMode, fromMode, MODE_LABEL,
  DEFAULT_STORAGE_CONFIG, type StorageMode,
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
  const ping = useServerFn(r2Ping);
  const [mode, setMode] = useState<StorageMode>(toMode(DEFAULT_STORAGE_CONFIG));
  const [autoFallback, setAutoFallback] = useState(DEFAULT_STORAGE_CONFIG.autoFallback);

  useEffect(() => {
    if (data) { setMode(toMode(data)); setAutoFallback(data.autoFallback); }
  }, [data]);

  const currentMode = data ? toMode(data) : null;
  const dirty = !!data && (currentMode !== mode || data.autoFallback !== autoFallback);
  const usesR2 = currentMode === "r2" || currentMode === "dual";

  const health = useQuery({
    queryKey: ["r2-health", currentMode],
    enabled: usesR2,
    retry: false,
    staleTime: 30_000,
    queryFn: async () => {
      try {
        const r = await ping(undefined);
        if (!r.ok) return { ok: false as const, message: (r as any).error ?? "R2 chưa sẵn sàng" };
        return { ok: true as const, message: `R2 sẵn sàng (bucket: ${r.bucket})` };
      } catch (e: any) {
        return { ok: false as const, message: e?.message ?? String(e) };
      }
    },
  });

  async function onSave() {
    try {
      await save.mutateAsync(fromMode(mode, autoFallback));
      toast.success("Đã lưu cấu hình lưu trữ. Áp dụng cho các lượt upload tiếp theo.");
    } catch (e: any) {
      toast.error("Lưu thất bại: " + e.message);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Lưu trữ tệp"
        subtitle="Bật/tắt kho lưu trữ: chỉ Lovable Cloud, chỉ Cloudflare R2, hoặc ghi song song cả hai."
      />

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải cấu hình…
        </div>
      ) : (
        <>
          {usesR2 && health.data && !health.data.ok && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">Cloudflare R2 đang lỗi — tệp mới có thể không ghi được.</p>
                <p className="text-xs text-muted-foreground">{health.data.message}</p>
                <p className="text-xs text-muted-foreground">
                  Chuyển sang <strong>Chỉ dùng Lovable Cloud</strong> bên dưới để hệ thống tiếp tục hoạt động bình thường.
                </p>
                <Button size="sm" variant="outline" className="mt-1" onClick={() => setMode("cloud")}>
                  Chọn “Chỉ dùng Lovable Cloud”
                </Button>
              </div>
            </div>
          )}
          {usesR2 && health.data?.ok && (
            <p className="text-xs text-emerald-600">{health.data.message}</p>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chế độ lưu trữ</CardTitle>
              <CardDescription>
                Chọn kho lưu trữ đang bật. Chế độ “chỉ một kho” sẽ ghi và đọc hoàn toàn ở kho đó.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as StorageMode)} className="grid gap-3 md:grid-cols-3">
                <BackendOption
                  value="cloud" checked={mode === "cloud"}
                  icon={<Cloud className="h-5 w-5" />}
                  title={MODE_LABEL.cloud}
                  desc="Supabase Storage tích hợp sẵn, không cần cấu hình thêm. An toàn nhất khi R2 lỗi."
                  active={currentMode === "cloud"}
                />
                <BackendOption
                  value="r2" checked={mode === "r2"}
                  icon={<HardDrive className="h-5 w-5" />}
                  title={MODE_LABEL.r2}
                  desc="Kho object riêng, presigned URL, chi phí thấp cho tệp lớn/nhiều."
                  active={currentMode === "r2"}
                />
                <BackendOption
                  value="dual" checked={mode === "dual"}
                  icon={<HardDrive className="h-5 w-5" />}
                  title={MODE_LABEL.dual}
                  desc="Mỗi tệp mới ghi sang cả hai kho — dùng khi đang chuyển đổi."
                  active={currentMode === "dual"}
                />
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tự động dự phòng khi kho đang chọn lỗi</CardTitle>
              <CardDescription>
                Nếu kho đang bật báo lỗi, hệ thống ghi tạm tệp sang kho còn lại và hiện cảnh báo, thay vì để tệp không
                được ghi vào đâu cả. Nếu cả hai kho đều lỗi, người dùng nhận thông báo rõ ràng để chuyển chế độ.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="autoFallback" className="text-sm font-medium">Bật dự phòng tự động</Label>
                <p className="text-xs text-muted-foreground">
                  Khi tắt: kho đang chọn lỗi thì thao tác tải lên sẽ báo lỗi ngay, không ghi sang kho khác.
                </p>
              </div>
              <Switch id="autoFallback" checked={autoFallback} onCheckedChange={setAutoFallback} />
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
                {currentMode !== mode && (
                  <Badge variant="outline" className="gap-1">
                    {currentMode ? MODE_LABEL[currentMode] : "—"} <ArrowRight className="h-3 w-3" /> {MODE_LABEL[mode]}
                  </Badge>
                )}
                {data?.autoFallback !== autoFallback && (
                  <Badge variant="outline">Dự phòng: {autoFallback ? "Bật" : "Tắt"}</Badge>
                )}
              </div>
            )}
          </div>


          <R2ParamsCard />

          <HealthHistoryCard />

          <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="space-y-1">
              <p>Cấu hình này chỉ ảnh hưởng các luồng upload đã tích hợp <code>dualUpload()</code>. Các luồng cũ vẫn ghi trực tiếp về Supabase Storage — sẽ chuyển dần theo lộ trình.</p>
              <p>Trong giai đoạn thử nghiệm, khuyến nghị: <strong>primary = Lovable Cloud</strong> + <strong>dual-write = Bật</strong>. Khi đủ tin cậy, chuyển primary sang R2 và có thể tắt dual-write để tiết kiệm.</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dump toàn bộ dữ liệu</CardTitle>
              <CardDescription>
                Tải 100% dữ liệu về máy — dạng gói <b>.zip có ngày giờ</b> hoặc ghi ra một thư mục: toàn bộ bảng CSDL,
                lược đồ, danh sách tài khoản và (tuỳ chọn) mọi tệp đính kèm/hình ảnh ở cả Lovable Cloud Storage lẫn
                Cloudflare R2. Chỉ tài khoản Admin thực hiện được.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FullDumpButton />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Phục hồi CSDL từ gói .zip</CardTitle>
              <CardDescription>
                Nạp lại dữ liệu từ chính gói <b>.zip</b> đã dump/sao lưu. Hệ thống nạp lần lượt từng bảng theo lô nhỏ,
                có xem trước số bảng/số dòng và cảnh báo trước khi ghi đè.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DumpZipRestore />
            </CardContent>
          </Card>

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

function R2ParamsCard() {
  const qc = useQueryClient();
  const fetchCfg = useServerFn(getR2Config);
  const saveCfg = useServerFn(saveR2Config);
  const testCfg = useServerFn(testR2Config);

  const { data: cfg, isLoading } = useQuery({
    queryKey: ["r2-config"],
    queryFn: () => fetchCfg(),
    staleTime: 30_000,
  });

  const [form, setForm] = useState({
    enabled: false, endpoint: "", accountId: "", bucketName: "",
    keyPrefix: "", publicBaseUrl: "", accessKeyId: "", secretAccessKey: "",
  });
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; steps?: { ten: string; ok: boolean; message: string }[] } | null>(null);
  const [confirmIssues, setConfirmIssues] = useState<R2ValidationIssue[] | null>(null);

  const liveIssues = validateR2Config({ ...form, hasStoredSecret: !!cfg?.hasSecret });

  useEffect(() => {
    if (!cfg) return;
    setForm({
      enabled: cfg.enabled,
      endpoint: cfg.endpoint,
      accountId: cfg.accountId,
      bucketName: cfg.bucketName,
      keyPrefix: cfg.keyPrefix,
      publicBaseUrl: cfg.publicBaseUrl,
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: "",
    });
  }, [cfg]);

  const mSave = useMutation({
    mutationFn: (force?: boolean) => saveCfg({ data: { ...form, force: !!force } }),
    onSuccess: async () => {
      toast.success("Đã lưu tham số Cloudflare R2.");
      setForm((f) => ({ ...f, secretAccessKey: "" }));
      await qc.invalidateQueries({ queryKey: ["r2-config"] });
    },
    onError: (e: any) => toast.error("Lưu thất bại: " + e.message),
  });

  function onSaveClick() {
    if (liveIssues.length > 0) { setConfirmIssues(liveIssues); return; }
    mSave.mutate(false);
  }

  async function onTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await testCfg(undefined);
      setTestResult(r);
      await qc.invalidateQueries({ queryKey: ["storage-health-log"] });
      r.ok ? toast.success(r.message) : toast.error(r.message);
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message });
      toast.error(e.message);
    } finally {
      setTesting(false);
    }
  }

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Tham số Cloudflare R2</CardTitle>
            <CardDescription>
              Nhập thông tin kết nối R2 tại đây. Khi để trống, hệ thống dùng biến môi trường của máy chủ.
            </CardDescription>
          </div>
          {cfg && (
            <Badge variant={cfg.source === "db" ? "secondary" : "outline"} className="text-[10px]">
              Nguồn: {cfg.source === "db" ? "Cấu hình trong ứng dụng" : "Biến môi trường"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải tham số…
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 rounded-md border p-3">
              <div className="space-y-1">
                <Label htmlFor="r2Enabled" className="text-sm font-medium">Kích hoạt R2</Label>
                <p className="text-xs text-muted-foreground">Tắt sẽ bỏ qua mọi thao tác ghi/đọc trên R2.</p>
              </div>
              <Switch id="r2Enabled" checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                id="r2Endpoint" label="Endpoint (S3 API)" value={form.endpoint}
                onChange={(v) => set("endpoint", v)}
                placeholder="https://<account_id>.r2.cloudflarestorage.com"
                hint="Lấy trong Cloudflare → R2 → Settings → S3 API."
              />
              <Field
                id="r2Account" label="Account ID" value={form.accountId}
                onChange={(v) => set("accountId", v)} placeholder="32 ký tự hex"
                hint="Tuỳ chọn — dùng để hiển thị/đối chiếu."
              />
              <Field
                id="r2Bucket" label="Tên bucket" value={form.bucketName}
                onChange={(v) => set("bucketName", v)} placeholder="mirats-files"
                hint="Bucket lưu tệp của hệ thống."
              />
              <Field
                id="r2Prefix" label="Tiền tố thư mục (prefix)" value={form.keyPrefix}
                onChange={(v) => set("keyPrefix", v)} placeholder="mirats/"
                hint="Tuỳ chọn — dùng khi chia sẻ bucket với ứng dụng khác."
              />
              <Field
                id="r2AccessKey" label="Access Key ID" value={form.accessKeyId}
                onChange={(v) => set("accessKeyId", v)} placeholder="R2 API Token — Access Key ID"
              />
              <div className="space-y-1.5">
                <Label htmlFor="r2Secret" className="text-sm">Secret Access Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="r2Secret"
                    type={showSecret ? "text" : "password"}
                    value={form.secretAccessKey}
                    onChange={(e) => set("secretAccessKey", e.target.value)}
                    placeholder={cfg?.hasSecret ? `Đang lưu: ${cfg.secretMasked} — để trống nếu giữ nguyên` : "R2 API Token — Secret Access Key"}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowSecret((s) => !s)} aria-label="Hiện/ẩn khoá bí mật">
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Khoá bí mật không bao giờ được trả về trình duyệt; để trống để giữ giá trị cũ.</p>
              </div>
              <Field
                id="r2PublicBase" label="URL công khai (tuỳ chọn)" value={form.publicBaseUrl}
                onChange={(v) => set("publicBaseUrl", v)} placeholder="https://files.example.com"
                hint="Domain public/custom domain của bucket; bỏ trống sẽ dùng presigned URL."
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={onSaveClick} disabled={mSave.isPending} className="gap-1.5">
                {mSave.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu tham số R2
              </Button>
              <Button variant="outline" onClick={onTest} disabled={testing} className="gap-1.5">
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
                Kiểm tra kết nối
              </Button>
              {testResult && (
                <span className={`text-xs ${testResult.ok ? "text-emerald-600" : "text-destructive"}`}>
                  {testResult.message}
                </span>
              )}
            </div>

            {testResult?.steps?.length ? (
              <ul className="space-y-1 rounded-md border bg-muted/30 p-3 text-xs">
                {testResult.steps.map((st) => (
                  <li key={st.ten} className="flex items-start gap-2">
                    {st.ok ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                           : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />}
                    <span><strong>{st.ten}:</strong> {st.message}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {liveIssues.length > 0 && (
              <ul className="space-y-1 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
                {liveIssues.map((i, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertTriangle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${i.level === "error" ? "text-destructive" : "text-amber-500"}`} />
                    <span className={i.level === "error" ? "text-destructive" : ""}>{i.message}</span>
                  </li>
                ))}
              </ul>
            )}

            <AlertDialog open={!!confirmIssues} onOpenChange={(o) => !o && setConfirmIssues(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {confirmIssues && hasBlockingIssue(confirmIssues) ? "Cấu hình R2 có lỗi" : "Cấu hình R2 có cảnh báo"}
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-2 text-left">
                      <p>Kiểm tra lại trước khi lưu — lưu cấu hình sai có thể khiến tệp mới không ghi được:</p>
                      <ul className="list-disc space-y-1 pl-5">
                        {confirmIssues?.map((i, idx) => (
                          <li key={idx} className={i.level === "error" ? "text-destructive" : ""}>
                            <strong>{i.level === "error" ? "Lỗi" : "Cảnh báo"}:</strong> {i.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Quay lại sửa</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => { const force = !!confirmIssues && hasBlockingIssue(confirmIssues); setConfirmIssues(null); mSave.mutate(force); }}
                  >
                    Vẫn lưu
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Field({
  id, label, value, onChange, placeholder, hint,
}: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function HealthHistoryCard() {
  const qc = useQueryClient();
  const runCheck = useServerFn(runStorageHealthCheck);
  const listChecks = useServerFn(listStorageHealthChecks);
  const [filter, setFilter] = useState<"all" | "cloud" | "r2">("all");
  const [openDetail, setOpenDetail] = useState<string | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["storage-health-log", filter],
    queryFn: () => listChecks({ data: { backend: filter, limit: 50 } }),
    staleTime: 10_000,
  });

  const mRun = useMutation({
    mutationFn: () => runCheck({ data: { backend: "both", nguon: "manual" } }),
    onSuccess: async (r) => {
      const bad = r.results.filter((x) => !x.ok);
      if (bad.length === 0) toast.success("Cả hai kho lưu trữ đều hoạt động bình thường.");
      else bad.forEach((x) => toast.error(`${x.backend === "cloud" ? "Lovable Cloud" : "Cloudflare R2"}: ${x.message}`, { duration: 12000 }));
      await qc.invalidateQueries({ queryKey: ["storage-health-log"] });
    },
    onError: (e: any) => toast.error("Không chạy được kiểm tra: " + e.message),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" /> Lịch sử kiểm tra sức khoẻ kho lưu trữ
            </CardTitle>
            <CardDescription>
              Thời điểm, kho được kiểm tra, kết quả, thời gian phản hồi và lỗi chi tiết của cả Lovable Cloud lẫn Cloudflare R2.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroup value={filter} onValueChange={(v) => setFilter(v as any)} className="flex items-center gap-3">
              {(["all", "cloud", "r2"] as const).map((v) => (
                <label key={v} htmlFor={`flt-${v}`} className="flex cursor-pointer items-center gap-1.5 text-xs">
                  <RadioGroupItem id={`flt-${v}`} value={v} />
                  {v === "all" ? "Tất cả" : v === "cloud" ? "Lovable Cloud" : "Cloudflare R2"}
                </label>
              ))}
            </RadioGroup>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => mRun.mutate()} disabled={mRun.isPending}>
              {mRun.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Kiểm tra ngay
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải lịch sử…
          </div>
        ) : !rows?.length ? (
          <p className="text-sm text-muted-foreground">Chưa có lần kiểm tra nào. Bấm “Kiểm tra ngay” để ghi bản ghi đầu tiên.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Thời điểm</TableHead>
                  <TableHead>Kho</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead className="whitespace-nowrap">Phản hồi</TableHead>
                  <TableHead>Thông báo / lỗi chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="align-top">
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(r.created_at).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="gap-1">
                        {r.backend === "cloud" ? <Cloud className="h-3 w-3" /> : <HardDrive className="h-3 w-3" />}
                        {r.backend === "cloud" ? "Lovable Cloud" : "Cloudflare R2"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.ok ? (
                        <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Đạt</span>
                      ) : (
                        <span className="flex items-center gap-1 text-destructive"><XCircle className="h-3.5 w-3.5" /> Lỗi</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {r.latency_ms != null ? `${r.latency_ms} ms` : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="space-y-1">
                        {r.error_code && <Badge variant="destructive" className="text-[10px]">{r.error_code}</Badge>}
                        <p className={r.ok ? "text-muted-foreground" : "text-destructive"}>{r.message}</p>
                        {r.detail != null && (
                          <>
                            <button
                              type="button"
                              className="text-[11px] underline text-muted-foreground"
                              onClick={() => setOpenDetail(openDetail === r.id ? null : r.id)}
                            >
                              {openDetail === r.id ? "Ẩn chi tiết kỹ thuật" : "Xem chi tiết kỹ thuật"}
                            </button>
                            {openDetail === r.id && (
                              <pre className="max-w-[520px] overflow-x-auto rounded bg-muted p-2 text-[11px]">
                                {JSON.stringify(r.detail, null, 2)}
                              </pre>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
