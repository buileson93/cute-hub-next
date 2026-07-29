import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  DatabaseBackup, Download, Upload, RotateCcw, Trash2, Loader2, ShieldAlert,
  HardDriveDownload, Cloud, Server, CheckCircle2, XCircle, Clock, CalendarClock, Info,
} from "lucide-react";
import { AppShell } from "@/components/mirats/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/backend/client";
import {
  listBackups, getBackupDownloadUrl, deleteBackup, restoreFromBackup,
  restoreFromUpload, getCloudStatus,
} from "@/lib/backup.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/backup")({
  head: () => ({
    meta: [
      { title: "Sao lưu & Khôi phục — MIRATS 2.0" },
      { name: "description", content: "Sao lưu toàn bộ cơ sở dữ liệu, đồng bộ lên đám mây và khôi phục dữ liệu an toàn." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BackupPage,
});

function fmtBytes(n: number) {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
}
function fmtDate(s: string) {
  const d = new Date(s);
  return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
}

const DICH_LABEL: Record<string, string> = {
  storage: "Đám mây (nội bộ)", gdrive: "Google Drive", s3: "Amazon S3", sftp: "SFTP/SMB",
};

function BackupPage() {
  const nav = useNavigate();
  const { loading, session, hasRole } = useSession();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !session) nav({ to: "/auth", search: { next: "/admin/backup" } as never });
  }, [loading, session, nav]);

  const isAdmin = hasRole("admin");

  const listFn = useServerFn(listBackups);
  const dlFn = useServerFn(getBackupDownloadUrl);
  const delFn = useServerFn(deleteBackup);
  const restoreFn = useServerFn(restoreFromBackup);
  const restoreUploadFn = useServerFn(restoreFromUpload);
  const cloudFn = useServerFn(getCloudStatus);

  const [destStorage] = useState(true);
  const [destGdrive, setDestGdrive] = useState(false);
  const [destS3, setDestS3] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState<{ id: string; label: string } | null>(null);
  const [confirmUpload, setConfirmUpload] = useState<{ content: string; filename: string; encoding: "text" | "base64" } | null>(null);
  const [prog, setProg] = useState<{ running: boolean; pct: number; msg: string }>({ running: false, pct: 0, msg: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  const backups = useQuery({ queryKey: ["backups"], queryFn: () => listFn(), enabled: isAdmin });
  const cloud = useQuery({ queryKey: ["cloud-status"], queryFn: () => cloudFn(), enabled: isAdmin });

  // Sao lưu qua endpoint streaming — hiển thị tiến trình theo thời gian thực
  async function streamBackup(): Promise<any> {
    const dich: ("storage" | "gdrive" | "s3")[] = ["storage"];
    if (destGdrive) dich.push("gdrive");
    if (destS3) dich.push("s3");

    const { data: { session: sess } } = await supabase.auth.getSession();
    const token = sess?.access_token;
    if (!token) throw new Error("Chưa đăng nhập");

    setProg({ running: true, pct: 0, msg: "Bắt đầu sao lưu…" });
    const resp = await fetch("/api/backup-run", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ dich }),
    });
    if (!resp.ok || !resp.body) {
      let msg = "Sao lưu lỗi";
      try { const j = await resp.json(); msg = j.error ?? msg; } catch { /* ignore */ }
      throw new Error(msg);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let final: any = null;
    let errMsg: string | null = null;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        let obj: any;
        try { obj = JSON.parse(line); } catch { continue; }
        if (obj.error) errMsg = obj.error;
        else if (obj.done) { final = obj; setProg((p) => ({ ...p, pct: 100, msg: "Hoàn tất" })); }
        else setProg({ running: true, pct: obj.pct ?? 0, msg: obj.message ?? "" });
      }
    }
    if (errMsg) throw new Error(errMsg);
    if (!final) throw new Error("Không nhận được kết quả sao lưu");
    return final;
  }

  const clearProgSoon = () => setTimeout(() => setProg({ running: false, pct: 0, msg: "" }), 1500);

  const doBackup = useMutation({
    mutationFn: () => streamBackup(),
    onSuccess: (res: any) => {
      toast.success(`Đã sao lưu ${res.record.so_bang} bảng · ${res.record.so_dong} dòng`);
      const db = res.dongBo ?? {};
      Object.entries(db).forEach(([_k, v]: any) => {
        if (v.ok) toast.success(v.msg); else toast.warning(v.msg);
      });
      qc.invalidateQueries({ queryKey: ["backups"] });
      clearProgSoon();
    },
    onError: (e: any) => { toast.error(e.message ?? "Sao lưu lỗi"); setProg({ running: false, pct: 0, msg: "" }); },
  });

  const doDownload = useMutation({
    mutationFn: (id: string) => dlFn({ data: { id } }),
    onSuccess: (res: any) => { window.open(res.url, "_blank"); },
    onError: (e: any) => toast.error(e.message ?? "Tải xuống lỗi"),
  });

  const doBackupDownload = useMutation({
    mutationFn: async () => {
      const res: any = await streamBackup();
      const id = res?.record?.id;
      if (!id) throw new Error("Không lấy được bản backup vừa tạo");
      const dl: any = await dlFn({ data: { id } });
      return { res, url: dl.url };
    },
    onSuccess: ({ res, url }: any) => {
      toast.success(`Đã sao lưu ${res.record.so_bang} bảng · đang tải tệp .zip về máy`);
      window.open(url, "_blank");
      qc.invalidateQueries({ queryKey: ["backups"] });
      clearProgSoon();
    },
    onError: (e: any) => { toast.error(e.message ?? "Sao lưu & tải về lỗi"); setProg({ running: false, pct: 0, msg: "" }); },
  });

  const doDelete = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Đã xoá bản backup"); qc.invalidateQueries({ queryKey: ["backups"] }); },
    onError: (e: any) => toast.error(e.message ?? "Xoá lỗi"),
  });

  const doRestore = useMutation({
    mutationFn: (id: string) => restoreFn({ data: { id } }),
    onSuccess: (res: any) => {
      const n = Object.keys(res?.restored ?? {}).length;
      toast.success(`Đã khôi phục ${n} bảng dữ liệu`);
      setConfirmRestore(null);
    },
    onError: (e: any) => { toast.error(e.message ?? "Khôi phục lỗi"); setConfirmRestore(null); },
  });

  const doRestoreUpload = useMutation({
    mutationFn: (p: { content: string; filename: string; encoding: "text" | "base64" }) =>
      restoreUploadFn({ data: p }),
    onSuccess: (res: any) => {
      const n = Object.keys(res?.restored ?? {}).length;
      toast.success(`Đã khôi phục ${n} bảng từ tệp tải lên`);
      setConfirmUpload(null);
    },
    onError: (e: any) => { toast.error(e.message ?? "Khôi phục lỗi"); setConfirmUpload(null); },
  });

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const name = f.name.toLowerCase();
    try {
      if (name.endsWith(".zip") || name.endsWith(".gz")) {
        const bytes = new Uint8Array(await f.arrayBuffer());
        let bin = "";
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        const b64 = btoa(bin);
        setConfirmUpload({ content: b64, filename: f.name, encoding: "base64" });
      } else {
        const text = await f.text();
        setConfirmUpload({ content: text, filename: f.name, encoding: "text" });
      }
    } finally {
      e.target.value = "";
    }
  }


  if (loading) {
    return <AppShell><div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></AppShell>;
  }
  if (!isAdmin) {
    return (
      <AppShell>
        <div className="mx-auto mt-16 max-w-md text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-rose-500" />
          <h2 className="mt-4 text-lg font-semibold">Chỉ Admin được truy cập</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tính năng sao lưu & khôi phục dành riêng cho quản trị viên.</p>
        </div>
      </AppShell>
    );
  }

  const c = cloud.data ?? { gdrive: false, s3: false };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Tạo backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseBackup className="h-5 w-5 text-primary" /> Sao lưu cơ sở dữ liệu
            </CardTitle>
            <CardDescription>Tạo gói sao lưu <b>.zip</b> chứa <b>toàn bộ dữ liệu</b>: mọi bảng (kể cả tài khoản, phân quyền, nhật ký), tệp <code>database.sql</code> (khôi phục được), <code>data.json</code> và <b>toàn bộ tài liệu &amp; hình ảnh</b> trong Storage — rồi đồng bộ lên các đích đã chọn.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <DestCard icon={Cloud} label="Đám mây nội bộ" desc="Luôn bật · lưu an toàn" active checked disabled />
              <DestCard
                icon={HardDriveDownload} label="Google Drive"
                desc={c.gdrive ? "Đã kết nối" : "Chưa kết nối"}
                active={c.gdrive} checked={destGdrive} onToggle={() => c.gdrive ? setDestGdrive((v) => !v) : toast.info("Vào Kết nối để bật Google Drive")}
              />
              <DestCard
                icon={Cloud} label="Amazon S3"
                desc={c.s3 ? "Đã kết nối" : "Chưa kết nối"}
                active={c.s3} checked={destS3} onToggle={() => c.s3 ? setDestS3((v) => !v) : toast.info("Vào Kết nối để bật Amazon S3")}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => doBackup.mutate()} disabled={doBackup.isPending || doBackupDownload.isPending}>
                {doBackup.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseBackup className="mr-2 h-4 w-4" />}
                Sao lưu ngay
              </Button>
              <Button variant="outline" onClick={() => doBackupDownload.mutate()} disabled={doBackup.isPending || doBackupDownload.isPending}>
                {doBackupDownload.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HardDriveDownload className="mr-2 h-4 w-4" />}
                Sao lưu & tải .zip về máy
              </Button>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" /> Tự động chạy hằng ngày lúc 02:00
              </div>
            </div>

            {/* Tiến trình sao lưu theo thời gian thực */}
            {prog.running && (
              <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    {prog.msg || "Đang xử lý…"}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{prog.pct}%</span>
                </div>
                <Progress value={prog.pct} className="h-2" />
                <p className="text-[11px] text-muted-foreground">
                  Đang sao lưu <b>toàn bộ</b>: mọi bảng (kể cả tài khoản, phân quyền, nhật ký), tài liệu và hình ảnh trong Storage.
                </p>
              </div>
            )}
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <Server className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <b>SFTP / SMB v3:</b> hạ tầng chạy serverless nên không kết nối trực tiếp được. Hãy tải bản backup về máy
                (nút <Download className="inline h-3 w-3" /> bên dưới) rồi đẩy lên SFTP/SMB bằng một tác vụ tại chỗ, hoặc dùng Google Drive / S3.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Khôi phục từ tệp tải lên */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4 text-primary" /> Khôi phục từ tệp
            </CardTitle>
            <CardDescription>Tải lên tệp backup <b>.zip</b> (gói đầy đủ), <b>.json.gz</b> hoặc <b>.json</b> để khôi phục dữ liệu (chỉ áp dụng cho các bảng nghiệp vụ, bỏ qua tài khoản & phân quyền).</CardDescription>
          </CardHeader>
          <CardContent>
            <input ref={fileRef} type="file" accept=".zip,.gz,.json,application/zip,application/gzip,application/json" hidden onChange={onPickFile} />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Chọn tệp .zip / .gz / .json để khôi phục
            </Button>
          </CardContent>
        </Card>

        {/* Lịch sử backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" /> Lịch sử sao lưu
            </CardTitle>
            <CardDescription>100 bản backup gần nhất. Có thể tải xuống hoặc khôi phục.</CardDescription>
          </CardHeader>
          <CardContent>
            {backups.isLoading ? (
              <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (backups.data ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Chưa có bản backup nào. Bấm “Sao lưu ngay” để tạo bản đầu tiên.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Nội dung</TableHead>
                      <TableHead>Dung lượng</TableHead>
                      <TableHead>Đích</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(backups.data as any[]).map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="whitespace-nowrap text-sm">{fmtDate(b.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={b.loai === "tu_dong" ? "border-sky-200 bg-sky-50 text-sky-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
                            {b.loai === "tu_dong" ? "Tự động" : "Thủ công"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{b.so_bang} bảng · {b.so_dong} dòng</TableCell>
                        <TableCell className="text-sm">{fmtBytes(b.dung_luong)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(b.dich ?? []).map((d: string) => {
                              const sync = b.dong_bo?.[d];
                              const ok = d === "storage" ? true : sync?.ok;
                              return (
                                <Badge key={d} variant="outline" className="gap-1 text-[11px]">
                                  {d !== "storage" && (ok ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <XCircle className="h-3 w-3 text-rose-500" />)}
                                  {DICH_LABEL[d] ?? d}
                                </Badge>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <IconBtn tip="Tải xuống" onClick={() => doDownload.mutate(b.id)} loading={doDownload.isPending && doDownload.variables === b.id}>
                              <Download className="h-4 w-4" />
                            </IconBtn>
                            <IconBtn tip="Khôi phục" onClick={() => setConfirmRestore({ id: b.id, label: fmtDate(b.created_at) })}>
                              <RotateCcw className="h-4 w-4 text-amber-600" />
                            </IconBtn>
                            <IconBtn tip="Xoá" onClick={() => doDelete.mutate(b.id)} loading={doDelete.isPending && doDelete.variables === b.id}>
                              <Trash2 className="h-4 w-4 text-rose-500" />
                            </IconBtn>
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
      </div>

      {/* Xác nhận khôi phục từ danh sách */}
      <Dialog open={!!confirmRestore} onOpenChange={(o) => !o && setConfirmRestore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><RotateCcw className="h-5 w-5 text-amber-600" /> Xác nhận khôi phục</DialogTitle>
            <DialogDescription>
              Khôi phục dữ liệu từ bản backup <b>{confirmRestore?.label}</b>. Thao tác này sẽ <b>ghi đè toàn bộ dữ liệu hiện tại</b> của các bảng nghiệp vụ.
              Tài khoản, phân quyền và nhật ký sẽ được giữ nguyên. Không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRestore(null)}>Huỷ</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => confirmRestore && doRestore.mutate(confirmRestore.id)} disabled={doRestore.isPending}>
              {doRestore.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Khôi phục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Xác nhận khôi phục từ tệp */}
      <Dialog open={!!confirmUpload} onOpenChange={(o) => !o && setConfirmUpload(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-amber-600" /> Khôi phục từ tệp tải lên</DialogTitle>
            <DialogDescription>
              Khôi phục từ tệp <b>{confirmUpload?.filename}</b>. Thao tác này sẽ <b>ghi đè dữ liệu hiện tại</b> bằng nội dung trong tệp. Tài khoản & phân quyền được giữ nguyên. Không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUpload(null)}>Huỷ</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => confirmUpload && doRestoreUpload.mutate(confirmUpload)} disabled={doRestoreUpload.isPending}>
              {doRestoreUpload.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Khôi phục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function DestCard({ icon: Icon, label, desc, active, checked, onToggle, disabled }: {
  icon: any; label: string; desc: string; active?: boolean; checked?: boolean; onToggle?: () => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
        checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
      } ${disabled ? "cursor-default opacity-90" : ""}`}
    >
      <span
        aria-hidden
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${
          checked ? "border-primary bg-primary text-primary-foreground" : "border-input"
        }`}
      >
        {checked ? <CheckCircle2 className="h-3 w-3" /> : null}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-medium"><Icon className="h-4 w-4 text-primary" /> {label}</div>
        <div className={`text-xs ${active ? "text-emerald-600" : "text-muted-foreground"}`}>{desc}</div>
      </div>
    </button>
  );
}

function IconBtn({ tip, onClick, loading, children }: { tip: string; onClick: () => void; loading?: boolean; children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClick} disabled={loading} aria-label="Đang tải">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
