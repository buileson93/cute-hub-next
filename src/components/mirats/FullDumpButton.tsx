import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DatabaseBackup, Loader2, StopCircle, FolderDown, FileArchive } from "lucide-react";
import { toast } from "sonner";
import { zipSync, strToU8 } from "fflate";
import { useServerFn } from "@tanstack/react-start";
import {
  fullDumpManifest, fullDumpTableChunk, fullDumpAuthUsers, fullDumpFileUrls,
} from "@/lib/full-dump.functions";

type Log = { t: string; ok?: boolean };

/** Nhãn thời gian dùng cho tên thư mục / tên tệp .zip: 20260728-1530 */
export function tsName(prefix = "mirats-dump") {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${prefix}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
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

type Mode = "folder" | "zip";

export function FullDumpButton() {
  const manifestFn = useServerFn(fullDumpManifest);
  const chunkFn = useServerFn(fullDumpTableChunk);
  const usersFn = useServerFn(fullDumpAuthUsers);
  const urlsFn = useServerFn(fullDumpFileUrls);

  const [running, setRunning] = useState<Mode | null>(null);
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState("");
  const [logs, setLogs] = useState<Log[]>([]);
  const [kemTep, setKemTep] = useState(false);
  const cancelRef = useRef(false);

  const supported = typeof window !== "undefined" && "showDirectoryPicker" in window;

  function addLog(t: string, ok = true) {
    setLogs((l) => [{ t, ok }, ...l].slice(0, 200));
  }

  async function run(mode: Mode) {
    if (mode === "folder" && !supported) {
      toast.error("Trình duyệt không hỗ trợ chọn thư mục. Hãy dùng Chrome/Edge trên máy tính.");
      return;
    }

    // Đích ghi: thư mục thật, hoặc bộ nhớ tạm để nén .zip
    let root: any = null;
    const zipEntries: Record<string, Uint8Array> = {};
    const goiTep = mode === "folder" || kemTep; // .zip chỉ kèm tệp khi người dùng chọn

    if (mode === "folder") {
      try {
        root = await (window as any).showDirectoryPicker({ mode: "readwrite" });
      } catch {
        return; // người dùng huỷ
      }
    }

    const stamp = tsName();
    const put = async (path: string, data: Blob | string) => {
      if (mode === "folder") return writeFile(root, path, data);
      const bytes =
        typeof data === "string" ? strToU8(data) : new Uint8Array(await data.arrayBuffer());
      zipEntries[path] = bytes;
    };

    cancelRef.current = false;
    setRunning(mode);
    setLogs([]);
    setPct(0);
    setMsg("Đang kiểm kê dữ liệu…");

    try {
      if (mode === "folder") root = await root.getDirectoryHandle(stamp, { create: true });
      const manifest = await manifestFn({ data: {} } as any);
      await put("manifest.json", JSON.stringify(manifest, null, 2));
      await put("schema.json", JSON.stringify(manifest.schema, null, 2));
      addLog(`Kiểm kê: ${manifest.tables.length} bảng · ${manifest.storage.length} tệp Cloud · ${manifest.r2.length} tệp R2`);

      const soTep = goiTep ? manifest.storage.length + manifest.r2.length : 0;
      const totalSteps = manifest.tables.length + soTep + 1;
      let done = 0;
      const tick = () => setPct(Math.min(99, Math.round((++done / totalSteps) * 100)));

      // 1) Dữ liệu từng bảng — đồng thời gom vào data.json để phục hồi 1 chạm
      const data: Record<string, any[]> = {};
      let tongDong = 0;
      for (const t of manifest.tables as { name: string; rows: number }[]) {
        if (cancelRef.current) throw new Error("Đã dừng theo yêu cầu");
        setMsg(`Bảng ${t.name} (${t.rows} dòng)`);
        const rows: any[] = [];
        const LIMIT = 1000;
        for (let off = 0; ; off += LIMIT) {
          const r = await chunkFn({ data: { table: t.name, offset: off, limit: LIMIT } });
          rows.push(...r.rows);
          if (r.rows.length < LIMIT) break;
        }
        await put(`database/${t.name}.json`, JSON.stringify(rows, null, 1));
        data[t.name] = rows;
        tongDong += rows.length;
        addLog(`database/${t.name}.json — ${rows.length} dòng`);
        tick();
      }

      // Gói dữ liệu chuẩn để phục hồi (tương thích tệp backup .zip của hệ thống)
      await put(
        "data.json",
        JSON.stringify({
          meta: { created_at: new Date().toISOString(), tables: Object.keys(data).length, rows: tongDong },
          data,
        }),
      );

      // 2) Tài khoản
      setMsg("Danh sách tài khoản…");
      try {
        const u = await usersFn({ data: {} } as any);
        await put("auth/users.json", JSON.stringify(u.users, null, 1));
        addLog(`auth/users.json — ${u.users.length} tài khoản`);
      } catch (e: any) {
        addLog("Không lấy được auth/users.json: " + e.message, false);
      }
      tick();

      if (goiTep) {
        // 3) Tệp trong Lovable Cloud Storage
        const byBucket = new Map<string, string[]>();
        for (const f of manifest.storage as { bucket: string; path: string; size: number }[]) {
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
                await put(`files/storage/${bucket}/${it.path}`, await res.blob());
              } catch (e: any) {
                addLog(`Bỏ qua ${bucket}/${it.path}: ${e.message}`, false);
              }
              tick();
            }
          }
        }

        // 4) Tệp trong Cloudflare R2
        const r2keys = (manifest.r2 as { key: string }[]).map((r) => r.key);
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
              await put(`files/r2/${it.path}`, await res.blob());
            } catch (e: any) {
              addLog(`Bỏ qua R2 ${it.path}: ${e.message}`, false);
            }
            tick();
          }
        }
      }

      await put(
        "README.txt",
        [
          "MIRATS 2.0 — Bản dump toàn bộ",
          `Tạo lúc: ${new Date().toISOString()}`,
          "",
          "manifest.json      — kiểm kê bảng/tệp",
          "schema.json        — lược đồ CSDL (cột, kiểu, khoá)",
          "data.json          — TOÀN BỘ dữ liệu (dùng để PHỤC HỒI)",
          "database/*.json    — dữ liệu từng bảng (dễ tra cứu)",
          "auth/users.json    — danh sách tài khoản (không có mật khẩu)",
          "files/storage/**   — tệp & hình ảnh trong Lovable Cloud Storage",
          "files/r2/**        — tệp & hình ảnh trong Cloudflare R2",
          "",
          "PHỤC HỒI: vào Quản trị → Lưu trữ tệp → “Phục hồi CSDL từ gói .zip” và chọn chính tệp .zip này.",
        ].join("\n"),
      );

      if (mode === "zip") {
        setMsg("Đang nén gói .zip…");
        const zipped = zipSync(zipEntries, { level: 6 });
        const blob = new Blob([zipped as unknown as BlobPart], { type: "application/zip" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${stamp}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        addLog(`${stamp}.zip — ${(blob.size / 1048576).toFixed(1)} MB`);
        toast.success(`Đã tải ${stamp}.zip về máy (${(blob.size / 1048576).toFixed(1)} MB).`);
      } else {
        toast.success("Đã dump toàn bộ dữ liệu vào thư mục đã chọn.");
      }

      setPct(100);
      setMsg("Hoàn tất");
    } catch (e: any) {
      toast.error("Dump dừng: " + e.message);
      setMsg("Dừng: " + e.message);
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => run("zip")} disabled={!!running} className="gap-1.5">
          {running === "zip" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileArchive className="h-4 w-4" />}
          Tải .zip dump về máy
        </Button>
        <Button variant="outline" onClick={() => run("folder")} disabled={!!running} className="gap-1.5">
          {running === "folder" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderDown className="h-4 w-4" />}
          Dump ra thư mục
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

      <div className="flex items-center gap-2">
        <Checkbox id="dump-kem-tep" checked={kemTep} onCheckedChange={(v) => setKemTep(v === true)} disabled={!!running} />
        <Label htmlFor="dump-kem-tep" className="text-xs font-normal text-muted-foreground">
          Gói .zip kèm cả tệp đính kèm & hình ảnh (Cloud Storage + R2) — dung lượng lớn hơn nhiều
        </Label>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Tên tệp gồm ngày giờ tạo, ví dụ <code>mirats-dump-20260728-153012.zip</code>. Gói .zip này dùng lại được
        ở mục “Phục hồi CSDL từ gói .zip” bên dưới.
      </p>

      {!supported && (
        <p className="text-xs text-amber-600">
          Trình duyệt hiện tại không hỗ trợ ghi thẳng vào thư mục — hãy dùng nút “Tải .zip dump về máy”.
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
