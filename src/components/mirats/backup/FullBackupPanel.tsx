import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { zipSync, strToU8 } from "fflate";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  FileArchive,
  Loader2,
  Lock,
  ShieldCheck,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fullDumpAuthUsers,
  fullDumpDdl,
  fullDumpManifest,
  fullDumpTableChunk,
} from "@/lib/full-dump.functions";
import {
  DUMP_LIMITATIONS,
  DUMP_SCOPE,
  buildLimitationsDoc,
  buildRestoreReadme,
  dumpFolderName,
  restoreOrder,
  type DumpArtifact,
  type DumpManifestFile,
} from "@/lib/mirats/backup/dump-artifacts";

/**
 * ponytail: gói được nén trong bộ nhớ trình duyệt (fflate) nên phù hợp tới ~1–2 GB dữ liệu bảng.
 * Vượt ngưỡng đó nên chuyển sang dump phía máy chủ theo luồng (streaming) hoặc `supabase db dump`.
 */
const MAX_ROWS_WARN = 2_000_000;
const CHUNK = 1000;

type Step = { t: string; ok: boolean };

const SCOPE_ICON = {
  full: { Icon: CheckCircle2, cls: "text-emerald-600", label: "Xuất đầy đủ" },
  partial: { Icon: AlertTriangle, cls: "text-amber-600", label: "Xuất một phần" },
  blocked: { Icon: Lock, cls: "text-rose-600", label: "Không thể xuất" },
} as const;

export function FullBackupPanel() {
  const manifestFn = useServerFn(fullDumpManifest);
  const chunkFn = useServerFn(fullDumpTableChunk);
  const usersFn = useServerFn(fullDumpAuthUsers);
  const ddlFn = useServerFn(fullDumpDdl);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [ketQua, setKetQua] = useState<{
    ten: string;
    bytes: number;
    luc: string;
    artifacts: DumpArtifact[];
  } | null>(null);
  const cancelRef = useRef(false);

  const log = (t: string, ok = true) => setSteps((s) => [{ t, ok }, ...s].slice(0, 300));

  async function run() {
    setConfirmOpen(false);
    cancelRef.current = false;
    setRunning(true);
    setSteps([]);
    setKetQua(null);
    setPct(0);
    setMsg("Đang kiểm kê…");

    const files: Record<string, Uint8Array> = {};
    const artifacts: DumpArtifact[] = [];
    const stamp = dumpFolderName();
    const put = (path: string, text: string, a: Omit<DumpArtifact, "path" | "bytes">) => {
      const bytes = strToU8(text);
      files[`${stamp}/${path}`] = bytes;
      artifacts.push({ path, bytes: bytes.length, ...a });
    };

    try {
      const inv = await manifestFn({ data: {} } as any);
      const tables = (inv.tables ?? []) as { name: string; rows: number }[];
      const tongDong = tables.reduce((s, t) => s + t.rows, 0);
      if (tongDong > MAX_ROWS_WARN)
        toast.warning(
          `Dữ liệu rất lớn (${tongDong.toLocaleString("vi-VN")} dòng). Nên dùng supabase CLI để dump.`,
        );
      const fks = ((inv.schema as any)?.foreign_keys ?? []) as {
        from_table: string;
        to_table: string;
      }[];
      const order = restoreOrder(
        tables.map((t) => t.name),
        fks,
      );
      log(`Kiểm kê ${tables.length} bảng · ${tongDong.toLocaleString("vi-VN")} dòng`);

      const total = tables.length + 4;
      let done = 0;
      const tick = () => setPct(Math.min(98, Math.round((++done / total) * 100)));

      // 1) DDL: schema / rls / grants
      setMsg("Xuất cấu trúc, RLS và phân quyền…");
      let ddlCounts = { policies: 0, views: 0, functions: 0 };
      try {
        const d = await ddlFn({ data: {} } as any);
        ddlCounts = {
          policies: d['counts']?.policies ?? 0,
          views: d['counts']?.views ?? 0,
          functions: d['counts']?.functions ?? 0,
        };
        put(
          "schema.sql",
          [
            "-- MIRATS schema dump (public)",
            "-- Thứ tự: enum → bảng → ràng buộc → index → view → function → trigger",
            "",
            d['enums'],
            "",
            d['tables'],
            "",
            d['constraints'],
            "",
            d['indexes'],
            "",
            d['views'],
            "",
            d['functions'],
            "",
            d['triggers'],
            "",
          ].join("\n"),
          { kind: "schema", status: "ok" },
        );
        put("rls-policies.sql", [d['rls'], "", d['policies'], ""].join("\n"), {
          kind: "rls",
          status: "ok",
        });
        put("grants.sql", [d['grants'], "", d['sequence_grants'], ""].join("\n"), {
          kind: "grants",
          status: "ok",
        });
        log("schema.sql · rls-policies.sql · grants.sql");
      } catch (e: any) {
        artifacts.push({ path: "schema.sql", kind: "schema", status: "failed", note: e.message });
        log("Không xuất được DDL: " + e.message, false);
      }
      tick();

      // 2) Dữ liệu theo thứ tự phục hồi
      let rowsAll = 0;
      for (const name of order) {
        if (cancelRef.current) throw new Error("Đã dừng theo yêu cầu");
        setMsg(`Bảng ${name}…`);
        try {
          const rows: any[] = [];
          for (let off = 0; ; off += CHUNK) {
            const r = await chunkFn({ data: { table: name, offset: off, limit: CHUNK } });
            rows.push(...r.rows);
            if (r.rows.length < CHUNK) break;
          }
          put(`data/${name}.json`, JSON.stringify(rows), {
            kind: "data",
            status: "ok",
            rows: rows.length,
          });
          rowsAll += rows.length;
        } catch (e: any) {
          artifacts.push({ path: `data/${name}.json`, kind: "data", status: "failed", note: e.message });
          log(`Lỗi bảng ${name}: ${e.message}`, false);
        }
        tick();
      }
      log(`data/*.json — ${rowsAll.toLocaleString("vi-VN")} dòng`);

      // 3) Tài khoản & quyền ứng dụng
      setMsg("Metadata tài khoản…");
      try {
        const u = await usersFn({ data: {} } as any);
        const safe = (u.users ?? []).map((x: any) => ({
          id: x.id,
          email: x.email ?? null,
          phone: x.phone ?? null,
          created_at: x.created_at,
          last_sign_in_at: x.last_sign_in_at ?? null,
          email_confirmed_at: x.email_confirmed_at ?? null,
          app_metadata: x.app_metadata ?? null,
          user_metadata: x.user_metadata ?? null,
          providers: x.app_metadata?.providers ?? null,
        }));
        put("auth/users-metadata.json", JSON.stringify(safe, null, 1), {
          kind: "auth",
          status: "partial",
          rows: safe.length,
          note: "không gồm mật khẩu băm / identities secret",
        });
        log(`auth/users-metadata.json — ${safe.length} tài khoản`);
      } catch (e: any) {
        artifacts.push({
          path: "auth/users-metadata.json",
          kind: "auth",
          status: "failed",
          note: e.message,
        });
        log("Không lấy được danh sách tài khoản: " + e.message, false);
      }
      tick();

      // 4) Storage / R2 metadata
      setMsg("Metadata Storage…");
      put(
        "storage/metadata-and-policies.json",
        JSON.stringify({ storage: inv.storage ?? [], r2: inv.r2 ?? [] }, null, 1),
        {
          kind: "storage",
          status: "partial",
          note: "chỉ metadata; nội dung tệp tải riêng ở mục Dump toàn bộ",
        },
      );
      tick();

      const manifest: DumpManifestFile = {
        formatVersion: 1,
        createdAt: new Date().toISOString(),
        environment:
          typeof window !== "undefined" ? window.location.hostname : "unknown",
        generator: "mirats-admin-backup",
        counts: {
          tables: tables.length,
          rows: rowsAll,
          policies: ddlCounts.policies,
          views: ddlCounts.views,
          functions: ddlCounts.functions,
        },
        restoreOrder: order,
        artifacts,
        limitations: DUMP_LIMITATIONS,
      };
      put("README-RESTORE.md", buildRestoreReadme(manifest), { kind: "doc", status: "ok" });
      put("limitations.md", buildLimitationsDoc(manifest), { kind: "doc", status: "ok" });
      files[`${stamp}/manifest.json`] = strToU8(JSON.stringify(manifest, null, 2));

      setMsg("Đang nén gói .zip…");
      const zipped = zipSync(files, { level: 6 });
      const blob = new Blob([zipped as unknown as BlobPart], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${stamp}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setKetQua({
        ten: `${stamp}.zip`,
        bytes: blob.size,
        luc: new Date().toLocaleString("vi-VN"),
        artifacts,
      });
      setPct(100);
      setMsg("Hoàn tất");
      toast.success(`Đã tải ${stamp}.zip (${(blob.size / 1048576).toFixed(1)} MB).`);
    } catch (e: any) {
      setMsg("Dừng: " + e.message);
      toast.error("Sao lưu dừng: " + e.message);
    } finally {
      setRunning(false);
    }
  }

  const failed = ketQua?.artifacts.filter((a) => a.status === "failed") ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" /> Sao lưu toàn diện (Database &amp; RLS)
        </CardTitle>
        <CardDescription>
          Gói <code>supbase-dump-…</code> gồm cấu trúc CSDL, dữ liệu bảng, RLS/policies, grants,
          metadata tài khoản &amp; Storage, kèm manifest và hướng dẫn phục hồi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="grid gap-2 sm:grid-cols-2">
          {DUMP_SCOPE.map((s) => {
            const { Icon, cls, label } = SCOPE_ICON[s.level];
            return (
              <li key={s.label} className="flex gap-2 rounded-lg border border-border p-3">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cls}`} aria-hidden />
                <div className="min-w-0">
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                  <span className="sr-only">{label}</span>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setConfirmOpen(true)} disabled={running}>
            {running ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileArchive className="mr-2 h-4 w-4" />
            )}
            Tạo và tải backup
          </Button>
          {running && (
            <Button
              variant="outline"
              onClick={() => (cancelRef.current = true)}
              aria-label="Dừng sao lưu"
            >
              <StopCircle className="mr-2 h-4 w-4" /> Dừng
            </Button>
          )}
          <Badge variant="outline" className="gap-1">
            <DatabaseBackup className="h-3 w-3" /> Chỉ Admin
          </Badge>
        </div>

        {running && (
          <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center justify-between text-sm">
              <span>{msg}</span>
              <span className="font-mono text-xs text-muted-foreground">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2" aria-label="Tiến trình sao lưu" />
          </div>
        )}

        {ketQua && (
          <div className="rounded-lg border border-border p-3 text-sm">
            <div className="font-medium">{ketQua.ten}</div>
            <div className="text-xs text-muted-foreground">
              {ketQua.luc} · {(ketQua.bytes / 1048576).toFixed(1)} MB ·{" "}
              {ketQua.artifacts.length} thành phần
              {failed.length > 0 ? ` · ${failed.length} phần lỗi` : " · tất cả thành công"}
            </div>
            {failed.length > 0 && (
              <ul className="mt-2 space-y-0.5 text-xs text-rose-600">
                {failed.map((f) => (
                  <li key={f.path}>
                    {f.path} — {f.note}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {steps.length > 0 && (
          <ul className="max-h-40 space-y-0.5 overflow-auto rounded-lg border border-border p-2 text-xs">
            {steps.map((s, i) => (
              <li key={i} className={s.ok ? "text-muted-foreground" : "text-rose-600"}>
                {s.t}
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-muted-foreground">
          Không xuất mật khẩu, secret, service key hay cấu hình nền tảng. Xem{" "}
          <code>limitations.md</code> trong gói để biết phần phải sao lưu bằng Dashboard/CLI.
        </p>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo bản sao lưu toàn diện?</DialogTitle>
            <DialogDescription>
              Gói backup chứa dữ liệu thật, bao gồm thông tin cá nhân và nhật ký hệ thống. Chỉ lưu
              trên thiết bị được mã hoá và không chia sẻ công khai.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            <span>
              Thao tác chỉ đọc, không thay đổi cơ sở dữ liệu. Với dữ liệu rất lớn, quá trình có thể
              mất vài phút — không đóng tab trong lúc chạy.
            </span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={run} disabled={running}>
              Tôi hiểu, tạo backup
            </Button>
          </DialogFooter>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
