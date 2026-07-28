import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DatabaseBackup, Loader2, StopCircle, FolderDown } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  fullDumpManifest, fullDumpTableChunk, fullDumpAuthUsers, fullDumpFileUrls,
} from "@/lib/full-dump.functions";

type Log = { t: string; ok?: boolean };

function tsName() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `mirats-dump-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

/** Ghi tệp vào thư mục người dùng chọn (File System Access API) */
async function ensureDir(root: any, parts: string[]) {
  let dir = root;
  for (const p of parts) dir = await dir.getDirectoryHandle(p.replace(/[\\/:*?"<>|]/g, "_"), { create: true });
  return dir;
}
async function writeFile(root: any, path: string, data: Blob | string) {
  const parts = path.split("/");
  const name = parts.pop()!;
  const dir = await ensureDir(root, parts);
  const fh = await dir.getFileHandle(name.replace(/[\\:*?"<>|]/g, "_"), { create: true });
  const w = await fh.createWritable();
  await w.write(data);
  await w.close();
}

export function FullDumpButton() {
  const manifestFn = useServerFn(fullDumpManifest);
  const chunkFn = useServerFn(fullDumpTableChunk);
  const usersFn = useServerFn(fullDumpAuthUsers);
  const urlsFn = useServerFn(fullDumpFileUrls);

  const [running, setRunning] = useState(false);
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState("");
  const [logs, setLogs] = useState<Log[]>([]);
  const cancelRef = useRef(false);

  const supported = typeof window !== "undefined" && "showDirectoryPicker" in window;

  function addLog(t: string, ok = true) {
    setLogs((l) => [{ t, ok }, ...l].slice(0, 200));
  }

  async function run() {
    if (!supported) {
      toast.error("Trình duyệt không hỗ trợ chọn thư mục. Hãy dùng Chrome/Edge trên máy tính.");
      return;
    }
    let root: any;
    try {
      root = await (window as any).showDirectoryPicker({ mode: "readwrite" });
    } catch {
      return; // người dùng huỷ
    }

    cancelRef.current = false;
    setRunning(true);
    setLogs([]);
    setPct(0);
    setMsg("Đang kiểm kê dữ liệu…");

    try {
      const base = await root.getDirectoryHandle(tsName(), { create: true });
      const manifest = await manifestFn({ data: {} } as any);
      await writeFile(base, "manifest.json", JSON.stringify(manifest, null, 2));
      await writeFile(base, "schema.json", JSON.stringify(manifest.schema, null, 2));
      addLog(`Kiểm kê: ${manifest.tables.length} bảng · ${manifest.storage.length} tệp Cloud · ${manifest.r2.length} tệp R2`);

      const totalSteps = manifest.tables.length + manifest.storage.length + manifest.r2.length + 1;
      let done = 0;
      const tick = () => setPct(Math.min(99, Math.round((++done / totalSteps) * 100)));

      // 1) Dữ liệu từng bảng
      for (const t of manifest.tables) {
        if (cancelRef.current) throw new Error("Đã dừng theo yêu cầu");
        setMsg(`Bảng ${t.name} (${t.rows} dòng)`);
        const rows: any[] = [];
        const LIMIT = 1000;
        for (let off = 0; ; off += LIMIT) {
          const r = await chunkFn({ data: { table: t.name, offset: off, limit: LIMIT } });
          rows.push(...r.rows);
          if (r.rows.length < LIMIT) break;
        }
        await writeFile(base, `database/${t.name}.json`, JSON.stringify(rows, null, 1));
        addLog(`database/${t.name}.json — ${rows.length} dòng`);
        tick();
      }

      // 2) Tài khoản
      setMsg("Danh sách tài khoản…");
      try {
        const u = await usersFn({ data: {} } as any);
        await writeFile(base, "auth/users.json", JSON.stringify(u.users, null, 1));
        addLog(`auth/users.json — ${u.users.length} tài khoản`);
      } catch (e: any) {
        addLog("Không lấy được auth/users.json: " + e.message, false);
      }
      tick();

      // 3) Tệp trong Lovable Cloud Storage
      const byBucket = new Map<string, string[]>();
      for (const f of manifest.storage) {
        if (!byBucket.has(f.bucket)) byBucket.set(f.bucket, []);
        byBucket.get(f.bucket)!.push(f.path);
      }
      for (const [bucket, paths] of byBucket) {
        for (let i = 0; i < paths.length; i += 50) {
          if (cancelRef.current) throw new Error("Đã dừng theo yêu cầu");
          const batch = paths.slice(i, i + 50);
          setMsg(`Tệp ${bucket} (${i + 1}/${paths.length})`);
          const { urls } = await urlsFn({ data: { source: "storage", bucket, paths: batch } });
          for (const it of urls) {
            try {
              if (!it.url) throw new Error("không tạo được liên kết");
              const res = await fetch(it.url);
              if (!res.ok) throw new Error("HTTP " + res.status);
              await writeFile(base, `files/storage/${bucket}/${it.path}`, await res.blob());
            } catch (e: any) {
              addLog(`Bỏ qua ${bucket}/${it.path}: ${e.message}`, false);
            }
            tick();
          }
        }
      }

      // 4) Tệp trong Cloudflare R2
      const r2keys = manifest.r2.map((r) => r.key);
      for (let i = 0; i < r2keys.length; i += 50) {
        if (cancelRef.current) throw new Error("Đã dừng theo yêu cầu");
        const batch = r2keys.slice(i, i + 50);
        setMsg(`Tệp R2 (${i + 1}/${r2keys.length})`);
        const { urls } = await urlsFn({ data: { source: "r2", paths: batch } });
        for (const it of urls) {
          try {
            if (!it.url) throw new Error("không tạo được liên kết");
            const res = await fetch(it.url);
            if (!res.ok) throw new Error("HTTP " + res.status);
            await writeFile(base, `files/r2/${it.path}`, await res.blob());
          } catch (e: any) {
            addLog(`Bỏ qua R2 ${it.path}: ${e.message}`, false);
          }
          tick();
        }
      }

      await writeFile(
        base,
        "README.txt",
        [
          "MIRATS 2.0 — Bản dump toàn bộ",
          `Tạo lúc: ${new Date().toISOString()}`,
          "",
          "manifest.json      — kiểm kê bảng/tệp",
          "schema.json        — lược đồ CSDL (cột, kiểu, khoá)",
          "database/*.json    — toàn bộ dữ liệu từng bảng",
          "auth/users.json    — danh sách tài khoản (không có mật khẩu)",
          "files/storage/**   — tệp & hình ảnh trong Lovable Cloud Storage",
          "files/r2/**        — tệp & hình ảnh trong Cloudflare R2",
        ].join("\n")
      );

      setPct(100);
      setMsg("Hoàn tất");
      toast.success("Đã dump toàn bộ dữ liệu vào thư mục đã chọn.");
    } catch (e: any) {
      toast.error("Dump dừng: " + e.message);
      setMsg("Dừng: " + e.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={run} disabled={running} className="gap-1.5">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderDown className="h-4 w-4" />}
          Dump toàn bộ ra thư mục
        </Button>
        {running && (
          <Button variant="outline" onClick={() => (cancelRef.current = true)} className="gap-1.5">
            <StopCircle className="h-4 w-4" /> Dừng
          </Button>
        )}
        <Badge variant="outline" className="gap-1">
          <DatabaseBackup className="h-3 w-3" /> Chỉ Admin
        </Badge>
      </div>

      {!supported && (
        <p className="text-xs text-amber-600">
          Trình duyệt hiện tại không hỗ trợ ghi vào thư mục. Dùng Chrome hoặc Edge trên máy tính để chạy tính năng này.
        </p>
      )}

      {(running || pct > 0) && (
        <div className="space-y-1">
          <Progress value={pct} />
          <p className="text-xs text-muted-foreground">{pct}% — {msg}</p>
        </div>
      )}

      {logs.length > 0 && (
        <div className="max-h-56 overflow-auto rounded-md border bg-muted/30 p-2 text-[11px] leading-5">
          {logs.map((l, i) => (
            <div key={i} className={l.ok ? "text-muted-foreground" : "text-destructive"}>{l.t}</div>
          ))}
        </div>
      )}
    </div>
  );
}
