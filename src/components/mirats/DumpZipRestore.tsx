// ============================================================================
// DumpZipRestore — phục hồi CSDL từ chính gói .zip đã dump/sao lưu.
//  • Đọc & giải nén tệp .zip ngay trên trình duyệt (data.json hoặc database/*.json).
//  • Xem trước danh sách bảng + số dòng trước khi ghi đè.
//  • Nạp theo từng bảng, từng lô 500 dòng → tránh lỗi request quá lớn.
// ============================================================================

import { useMemo, useRef, useState } from "react";
import { unzipSync, strFromU8 } from "fflate";
import { Loader2, RotateCcw, Upload, FileArchive, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  restoreDumpChunk,
  restoreDumpBegin,
  restoreDumpFinish,
  canRestoreDump,
} from "@/lib/dump-restore.functions";
import { useSession } from "@/hooks/use-session";

type Goi = { filename: string; data: Record<string, any[]> };

const LO = 500;

/** Rút dữ liệu bảng từ gói .zip (hỗ trợ cả gói dump mới lẫn backup cũ). */
function docGoiZip(filename: string, buf: Uint8Array): Goi {
  const files = unzipSync(buf);
  const data: Record<string, any[]> = {};

  const dataJson = files["data.json"];
  if (dataJson) {
    const parsed = JSON.parse(strFromU8(dataJson));
    const src = parsed?.data ?? parsed;
    for (const [k, v] of Object.entries(src ?? {})) if (Array.isArray(v)) data[k] = v as any[];
  }

  if (Object.keys(data).length === 0) {
    for (const [path, bytes] of Object.entries(files)) {
      const m = /^database\/(.+)\.json$/.exec(path);
      if (!m) continue;
      const rows = JSON.parse(strFromU8(bytes));
      if (Array.isArray(rows)) data[m[1]] = rows;
    }
  }

  if (Object.keys(data).length === 0) {
    throw new Error("Gói .zip không chứa dữ liệu CSDL (thiếu data.json hoặc database/*.json)");
  }
  return { filename, data };
}

export function DumpZipRestore() {
  const chunkFn = useServerFn(restoreDumpChunk);
  const beginFn = useServerFn(restoreDumpBegin);
  const finishFn = useServerFn(restoreDumpFinish);
  const canFn = useServerFn(canRestoreDump);
  const { hasRole, loading: loadingSession } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [goi, setGoi] = useState<Goi | null>(null);
  const [running, setRunning] = useState(false);
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState("");
  const [logs, setLogs] = useState<{ t: string; ok: boolean }[]>([]);

  // Quyền: kiểm tra ở máy chủ (nguồn sự thật) + vai trò trong phiên (hiển thị nhanh).
  const quyen = useQuery({
    queryKey: ["dump-restore", "can"],
    queryFn: () => canFn() as Promise<{ allowed: boolean }>,
    staleTime: 60_000,
  });
  const laAdmin = quyen.data?.allowed ?? (!loadingSession && hasRole("admin"));
  const dangKiemTraQuyen = quyen.isLoading || loadingSession;

  const bang = useMemo(
    () =>
      goi
        ? Object.entries(goi.data)
            .map(([name, rows]) => ({ name, rows: rows.length }))
            .sort((a, b) => a.name.localeCompare(b.name))
        : [],
    [goi],
  );
  const tongDong = bang.reduce((s, b) => s + b.rows, 0);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!laAdmin) {
      toast.error("Bạn không có quyền phục hồi CSDL — chỉ tài khoản Admin được thực hiện.");
      return;
    }
    if (!f.name.toLowerCase().endsWith(".zip")) {
      toast.error("Vui lòng chọn tệp .zip do chức năng dump/sao lưu tạo ra.");
      return;
    }
    try {
      setGoi(docGoiZip(f.name, new Uint8Array(await f.arrayBuffer())));
    } catch (err: any) {
      toast.error("Không đọc được gói .zip: " + (err?.message ?? ""));
    }
  }

  async function phucHoi() {
    if (!goi) return;
    if (!laAdmin) {
      toast.error("Bạn không có quyền phục hồi CSDL — chỉ tài khoản Admin được thực hiện.");
      return;
    }
    setRunning(true);
    setLogs([]);
    setPct(0);
    let daXong = 0;
    let tongNap = 0;
    const boQua: string[] = [];
    let runId = "";
    try {
      // Máy chủ xác thực quyền Admin và mở nhật ký "ai phục hồi" trước khi ghi đè.
      const b: any = await beginFn({
        data: { filename: goi.filename, tables: bang.length, rows: tongDong },
      });
      runId = b?.runId ?? "";

      for (const t of bang) {
        setMsg(`Bảng ${t.name} (${t.rows} dòng)…`);
        const rows = goi.data[t.name] ?? [];
        let napBang = 0;
        let bogua: string | null = null;
        if (rows.length === 0) {
          const r: any = await chunkFn({
            data: { table: t.name, rows: [], truncate: true, runId },
          });
          if (r?.skipped) bogua = r.reason ?? "bỏ qua";
        }
        for (let i = 0; i < rows.length; i += LO) {
          const r: any = await chunkFn({
            data: { table: t.name, rows: rows.slice(i, i + LO), truncate: i === 0, runId },
          });
          if (r?.skipped) {
            bogua = r.reason ?? "bỏ qua";
            break;
          }
          napBang += r?.rows ?? 0;
          setMsg(`Bảng ${t.name}: ${Math.min(i + LO, rows.length)}/${rows.length} dòng`);
        }
        tongNap += napBang;
        if (bogua) boQua.push(t.name);
        setLogs((l) => [
          bogua
            ? {
                t: `${t.name} — bỏ qua (bảng được bảo vệ: tài khoản/phân quyền/nhật ký)`,
                ok: false,
              }
            : { t: `${t.name} — nạp ${napBang} dòng`, ok: true },
          ...l,
        ]);
        setPct(Math.round((++daXong / bang.length) * 100));
      }
      setMsg("Hoàn tất");
      await finishFn({
        data: {
          runId,
          ok: true,
          filename: goi.filename,
          tables: bang.length,
          rows: tongNap,
          skipped: boQua,
        },
      });
      toast.success(`Đã phục hồi ${bang.length} bảng · ${tongNap.toLocaleString("vi-VN")} dòng.`);
      setGoi(null);
    } catch (e: any) {
      const loi = e?.message ?? "";
      toast.error("Phục hồi dừng: " + loi);
      setMsg("Dừng: " + loi);
      if (runId) {
        await finishFn({
          data: {
            runId,
            ok: false,
            filename: goi.filename,
            tables: daXong,
            rows: tongNap,
            skipped: boQua,
            error: String(loi).slice(0, 1000),
          },
        }).catch(() => {});
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept=".zip,application/zip" hidden onChange={onPick} />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() => fileRef.current?.click()}
          disabled={running || dangKiemTraQuyen || !laAdmin}
          title={
            !laAdmin && !dangKiemTraQuyen ? "Chỉ tài khoản Admin được phục hồi CSDL" : undefined
          }
        >
          {!laAdmin && !dangKiemTraQuyen ? (
            <Lock className="h-4 w-4" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Chọn gói .zip để phục hồi
        </Button>
        <Badge variant="outline" className="gap-1">
          <FileArchive className="h-3 w-3" /> Chỉ Admin
        </Badge>
      </div>

      {!dangKiemTraQuyen && !laAdmin && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Tài khoản của bạn không có vai trò <b>Admin</b> nên không thể phục hồi CSDL. Hãy liên hệ
            quản trị viên hệ thống nếu cần thực hiện thao tác này.
          </span>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Chấp nhận gói <code>.zip</code> do “Tải .zip dump về máy” hoặc trang Sao lưu tạo ra. Tài
        khoản, phân quyền, nhật ký và tin nhắn luôn được giữ nguyên (không ghi đè). Mọi lần phục hồi
        đều được ghi vào nhật ký kiểm toán (ai thực hiện, tệp nào, bảng nào, lúc nào).
      </p>

      {running && (
        <div className="space-y-1">
          <Progress value={pct} />
          <p className="text-xs text-muted-foreground">
            {pct}% — {msg}
          </p>
        </div>
      )}

      {logs.length > 0 && (
        <div className="max-h-56 overflow-auto rounded-md border bg-muted/30 p-2 text-[11px] leading-5">
          {logs.map((l, i) => (
            <div key={i} className={l.ok ? "text-muted-foreground" : "text-amber-600"}>
              {l.t}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!goi && !running} onOpenChange={(o) => !o && setGoi(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-600" /> Xác nhận phục hồi CSDL
            </DialogTitle>
            <DialogDescription>
              Từ tệp <b>{goi?.filename}</b> — <b>{bang.length}</b> bảng ·{" "}
              <b>{tongDong.toLocaleString("vi-VN")}</b> dòng.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-52 overflow-auto rounded-md border p-2 text-xs">
            {bang.map((b) => (
              <div key={b.name} className="flex justify-between py-0.5">
                <span className="font-mono">{b.name}</span>
                <span className="text-muted-foreground">{b.rows.toLocaleString("vi-VN")} dòng</span>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Dữ liệu hiện tại của các bảng nghiệp vụ trên sẽ bị <b>xoá và ghi đè</b> bằng nội dung
              trong gói. Thao tác <b>không thể hoàn tác</b> — nên tạo một bản dump mới trước khi
              phục hồi.
            </span>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGoi(null)}>
              Huỷ
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={phucHoi}
              disabled={running}
            >
              {running && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Phục hồi ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
