import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";
import { createAdminStorage } from "@/lib/storage/server";

const BUCKET = "database-backups";
const GATEWAY = "https://connector-gateway.lovable.dev";
/** Không sao lưu chính bucket chứa backup để tránh lồng nhau vô hạn */
const SKIP_BUCKETS = new Set(["database-backups"]);
/** Giới hạn tổng dung lượng tệp trong Storage đưa vào backup (2 GB — bao toàn bộ tài liệu/hình ảnh) */
const MAX_STORAGE_BYTES = 2 * 1024 * 1024 * 1024;

type Col = { name: string; type: string; udt: string; nullable: boolean; default: string | null; is_pk?: boolean };
type SchemaInfo = { tables: { table_name: string; columns: Col[] }[]; foreign_keys: any[] };

/** Sự kiện tiến trình gửi về giao diện */
export type BackupProgress = {
  phase: "tables" | "sql" | "storage" | "zip" | "upload" | "sync" | "history" | "done";
  message: string;
  current?: number;
  total?: number;
  pct?: number; // 0-100 tổng thể
};
export type ProgressFn = (p: BackupProgress) => void | Promise<void>;

/** Đọc toàn bộ dữ liệu tất cả bảng public (kể cả bảng nhạy cảm) → { meta, data } */
export async function exportAllTables(supabaseAdmin: any, onProgress?: ProgressFn) {
  const { data: tblRows, error } = await supabaseAdmin.rpc("admin_list_backup_tables");
  if (error) throw new Error("Không lấy được danh sách bảng: " + error.message);
  const tables: string[] = (tblRows ?? []).map((r: any) => r.table_name);

  const data: Record<string, any[]> = {};
  let totalRows = 0;
  let idx = 0;
  for (const t of tables) {
    const rows: any[] = [];
    let from = 0;
    const page = 1000;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: chunk, error: e } = await supabaseAdmin.from(t).select("*").range(from, from + page - 1);
      if (e) throw new Error(`Lỗi đọc bảng ${t}: ${e.message}`);
      rows.push(...(chunk ?? []));
      if (!chunk || chunk.length < page) break;
      from += page;
    }
    data[t] = rows;
    totalRows += rows.length;
    idx++;
    await onProgress?.({
      phase: "tables",
      message: `Đọc bảng ${t} (${rows.length} dòng)`,
      current: idx,
      total: tables.length,
      pct: Math.round((idx / tables.length) * 40),
    });
  }
  return {
    meta: { version: 2, created_at: new Date().toISOString(), tables: tables.length, rows: totalRows, source: "MIRATS" },
    data,
  };
}

// ==================== SINH TỆP .SQL (DUMP CƠ SỞ DỮ LIỆU) ====================

function qStr(s: any): string {
  return "'" + String(s).replace(/'/g, "''") + "'";
}
function baseType(u: string): string {
  const m: Record<string, string> = {
    text: "text", varchar: "varchar", bpchar: "char", bool: "boolean",
    int2: "smallint", int4: "integer", int8: "bigint", float4: "real",
    float8: "double precision", numeric: "numeric", uuid: "uuid",
    timestamptz: "timestamptz", timestamp: "timestamp", timetz: "timetz",
    time: "time", date: "date", jsonb: "jsonb", json: "json", bytea: "bytea", inet: "inet",
  };
  return m[u] ?? u; // enum/domain giữ nguyên tên kiểu
}
function ddlType(udt: string): string {
  if (udt.startsWith("_")) return baseType(udt.slice(1)) + "[]";
  return baseType(udt);
}
function sqlScalar(v: any, udt: string): string {
  if (v === null || v === undefined) return "NULL";
  if (udt === "jsonb" || udt === "json") return qStr(JSON.stringify(v)) + "::" + udt;
  if (["int2", "int4", "int8", "float4", "float8", "numeric"].includes(udt)) {
    return Number.isFinite(Number(v)) ? String(v) : qStr(v);
  }
  if (udt === "bool") return v === true || v === "true" || v === "t" ? "true" : "false";
  if (typeof v === "object") return qStr(JSON.stringify(v)) + "::jsonb";
  return qStr(v);
}
function sqlVal(v: any, udt: string): string {
  if (v === null || v === undefined) return "NULL";
  if (udt.startsWith("_")) {
    const base = udt.slice(1);
    if (!Array.isArray(v)) return qStr(typeof v === "string" ? v : JSON.stringify(v)) + "::" + baseType(base) + "[]";
    if (v.length === 0) return "'{}'::" + baseType(base) + "[]";
    return "ARRAY[" + v.map((e) => sqlScalar(e, base)).join(",") + "]::" + baseType(base) + "[]";
  }
  return sqlScalar(v, udt);
}

/** Sinh tệp SQL đầy đủ: DDL (best-effort) + toàn bộ dữ liệu dưới dạng INSERT — khôi phục được vào Postgres/Supabase */
export function buildSqlDump(dump: { meta: any; data: Record<string, any[]> }, schema: SchemaInfo): string {
  const schemaMap = new Map<string, Col[]>();
  for (const t of schema?.tables ?? []) schemaMap.set(t.table_name, t.columns);

  const out: string[] = [];
  out.push(`-- MIRATS — Bản sao lưu cơ sở dữ liệu (Supabase / PostgreSQL)`);
  out.push(`-- Tạo lúc: ${dump.meta.created_at}`);
  out.push(`-- Số bảng: ${dump.meta.tables} · Số dòng: ${dump.meta.rows}`);
  out.push(`-- Khôi phục: psql "$DATABASE_URL" -f database.sql`);
  out.push(``);
  out.push(`SET statement_timeout = 0;`);
  out.push(`SET client_encoding = 'UTF8';`);
  out.push(`SET standard_conforming_strings = on;`);
  out.push(`BEGIN;`);
  out.push(`SET session_replication_role = replica; -- tạm tắt kiểm tra khoá ngoại`);
  out.push(``);

  const tableNames = Object.keys(dump.data);

  // 1) DDL best-effort (an toàn với DB hiện có nhờ IF NOT EXISTS)
  for (const t of tableNames) {
    const cols = schemaMap.get(t);
    if (!cols || cols.length === 0) continue;
    const lines = cols.map((c) => {
      let l = `  "${c.name}" ${ddlType(c.udt)}`;
      if (!c.nullable) l += " NOT NULL";
      if (c.default) l += " DEFAULT " + c.default;
      return l;
    });
    const pk = cols.filter((c) => c.is_pk).map((c) => `"${c.name}"`);
    if (pk.length) lines.push(`  PRIMARY KEY (${pk.join(", ")})`);
    out.push(`CREATE TABLE IF NOT EXISTS public."${t}" (\n${lines.join(",\n")}\n);`);
  }
  out.push(``);

  // 2) Dữ liệu — xoá sạch rồi chèn lại
  for (const t of tableNames) {
    const rows = dump.data[t] ?? [];
    const cols = schemaMap.get(t);
    const colNames = cols?.map((c) => c.name) ?? Object.keys(rows[0] ?? {});
    if (colNames.length === 0) continue;
    const udtByName = new Map<string, string>((cols ?? []).map((c) => [c.name, c.udt]));

    out.push(`-- ============ public.${t} (${rows.length} dòng) ============`);
    out.push(`DELETE FROM public."${t}";`);
    if (rows.length === 0) { out.push(``); continue; }

    const colList = colNames.map((c) => `"${c}"`).join(", ");
    const CHUNK = 200;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      const valuesSql = slice
        .map((r) => "(" + colNames.map((c) => sqlVal(r[c], udtByName.get(c) ?? "text")).join(", ") + ")")
        .join(",\n");
      out.push(`INSERT INTO public."${t}" (${colList}) VALUES\n${valuesSql};`);
    }
    out.push(``);
  }

  out.push(`SET session_replication_role = origin;`);
  out.push(`COMMIT;`);
  out.push(``);
  return out.join("\n");
}

// ==================== XUẤT TỆP TRONG STORAGE ====================

/** Duyệt đệ quy toàn bộ tệp trong tất cả bucket (trừ bucket backup), trả về map path → bytes */
export async function exportStorage(supabaseAdmin: any, onProgress?: ProgressFn) {
  const files: Record<string, Uint8Array> = {};
  const manifest: { bucket: string; path: string; size: number }[] = [];
  let totalBytes = 0;
  let skipped = 0;
  let count = 0;

  const storage = createAdminStorage(supabaseAdmin);
  const { data: buckets, error } = await storage.listBuckets();
  if (error || !buckets) return { files, manifest, totalBytes, skipped, buckets: 0 };

  const usableBuckets = buckets.filter((b: any) => !SKIP_BUCKETS.has(b.name));

  for (const b of usableBuckets) {
    const walk = async (prefix: string) => {
      let offset = 0;
      const limit = 100;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data: items, error: le } = await storage
          .from(b.name)
          .list(prefix, { limit, offset, sortBy: { column: "name", order: "asc" } });
        if (le || !items || items.length === 0) break;
        for (const it of items) {
          const full = prefix ? `${prefix}/${it.name}` : it.name;
          if (it.id === null || it.id === undefined) {
            // thư mục → duyệt tiếp
            await walk(full);
          } else {
            if (totalBytes >= MAX_STORAGE_BYTES) { skipped++; continue; }
            try {
              const { data: blob, error: de } = await storage.from(b.name).download(full);
              if (de || !blob) { skipped++; continue; }
              const bytes = new Uint8Array(await blob.arrayBuffer());
              files[`${b.name}/${full}`] = bytes;
              manifest.push({ bucket: b.name, path: full, size: bytes.length });
              totalBytes += bytes.length;
              count++;
              if (count % 5 === 0) {
                await onProgress?.({
                  phase: "storage",
                  message: `Gom tệp Storage: ${count} tệp (${(totalBytes / 1048576).toFixed(1)} MB)`,
                  current: count,
                  pct: 40 + Math.min(35, Math.round(totalBytes / MAX_STORAGE_BYTES * 35)),
                });
              }
            } catch { skipped++; }
          }
        }
        if (items.length < limit) break;
        offset += limit;
      }
    };
    await walk("");
  }

  await onProgress?.({
    phase: "storage",
    message: `Đã gom ${count} tệp Storage (${(totalBytes / 1048576).toFixed(1)} MB)` + (skipped ? `, bỏ qua ${skipped}` : ""),
    current: count,
    pct: 75,
  });

  return { files, manifest, totalBytes, skipped, buckets: usableBuckets.length };
}

// ==================== ĐỒNG BỘ ĐÁM MÂY ====================

export async function syncGoogleDrive(fileName: string, bytes: Uint8Array): Promise<{ ok: boolean; msg: string }> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const gdKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!lovableKey || !gdKey) return { ok: false, msg: "Chưa kết nối Google Drive" };
  try {
    const boundary = "mirats" + Math.random().toString(36).slice(2);
    const metadata = JSON.stringify({ name: fileName });
    const head = new TextEncoder().encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
      `--${boundary}\r\nContent-Type: application/zip\r\n\r\n`
    );
    const tail = new TextEncoder().encode(`\r\n--${boundary}--`);
    const body = new Uint8Array(head.length + bytes.length + tail.length);
    body.set(head, 0);
    body.set(bytes, head.length);
    body.set(tail, head.length + bytes.length);
    const res = await fetch(`${GATEWAY}/google_drive/upload/drive/v3/files?uploadType=multipart`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": gdKey,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: body as unknown as BodyInit,
    });
    if (!res.ok) return { ok: false, msg: `Google Drive lỗi [${res.status}]` };
    const j: any = await res.json();
    return { ok: true, msg: `Đã tải lên Google Drive (id: ${j.id ?? "?"})` };
  } catch (e: any) {
    return { ok: false, msg: "Google Drive: " + (e?.message ?? "lỗi") };
  }
}

export async function syncS3(fileName: string, bytes: Uint8Array): Promise<{ ok: boolean; msg: string }> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const s3Key = process.env.AWS_S3_API_KEY;
  if (!lovableKey || !s3Key) return { ok: false, msg: "Chưa kết nối Amazon S3" };
  try {
    const signRes = await fetch(`${GATEWAY}/api/v1/sign_storage_url?provider=aws_s3&mode=write`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": s3Key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ object_path: `mirats-backups/${fileName}` }),
    });
    if (!signRes.ok) return { ok: false, msg: `S3 ký URL lỗi [${signRes.status}]` };
    const { url } = await signRes.json();
    const put = await fetch(url, { method: "PUT", body: bytes as unknown as BodyInit });
    if (!put.ok) return { ok: false, msg: `S3 upload lỗi [${put.status}]` };
    return { ok: true, msg: "Đã tải lên Amazon S3" };
  } catch (e: any) {
    return { ok: false, msg: "S3: " + (e?.message ?? "lỗi") };
  }
}

// ==================== QUY TRÌNH SAO LƯU TOÀN BỘ ====================

/** Đọc dữ liệu + sinh SQL + gom tệp Storage → nén ZIP → lưu bucket → đồng bộ → ghi lịch sử */
export async function performBackup(
  supabaseAdmin: any,
  opts: {
    loai: "thu_cong" | "tu_dong";
    dich: ("storage" | "gdrive" | "s3")[];
    ghi_chu?: string | null;
    userId?: string | null;
    userName?: string | null;
    schema?: SchemaInfo | null;
    includeStorage?: boolean;
    onProgress?: ProgressFn;
  }
) {
  const onProgress = opts.onProgress;
  await onProgress?.({ phase: "tables", message: "Bắt đầu đọc toàn bộ bảng dữ liệu…", pct: 2 });

  const dump = await exportAllTables(supabaseAdmin, onProgress);

  await onProgress?.({ phase: "sql", message: "Sinh tệp database.sql…", pct: 40 });
  const sql = opts.schema ? buildSqlDump(dump, opts.schema) : "-- (không có thông tin lược đồ để sinh SQL)\n";

  // Gom tệp Storage (tài liệu + hình ảnh)
  let storage = { files: {} as Record<string, Uint8Array>, manifest: [] as any[], totalBytes: 0, skipped: 0, buckets: 0 };
  if (opts.includeStorage !== false) {
    await onProgress?.({ phase: "storage", message: "Gom toàn bộ tài liệu & hình ảnh trong Storage…", pct: 42 });
    try {
      storage = await exportStorage(supabaseAdmin, onProgress);
    } catch {
      // bỏ qua lỗi storage, vẫn giữ backup dữ liệu
    }
  }

  const manifest = {
    ...dump.meta,
    contents: ["data.json", "database.sql", "storage/**"],
    storage: {
      buckets: storage.buckets,
      files: storage.manifest.length,
      bytes: storage.totalBytes,
      skipped: storage.skipped,
      list: storage.manifest,
    },
  };

  await onProgress?.({ phase: "zip", message: "Nén gói .zip…", pct: 80 });
  const zipEntries: Record<string, Uint8Array> = {
    "manifest.json": strToU8(JSON.stringify(manifest, null, 2)),
    "data.json": strToU8(JSON.stringify(dump)),
    "database.sql": strToU8(sql),
  };
  for (const [p, bytes] of Object.entries(storage.files)) zipEntries[`storage/${p}`] = bytes;

  const zipped = zipSync(zipEntries, { level: 6 });
  const bytes = new Uint8Array(zipped);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `backup-${stamp}.zip`;

  await onProgress?.({ phase: "upload", message: `Lưu tệp ${fileName} (${(bytes.length / 1048576).toFixed(1)} MB)…`, pct: 88 });
  const { error: upErr } = await createAdminStorage(supabaseAdmin)
    .from(BUCKET)
    .upload(fileName, bytes, { contentType: "application/zip", upsert: true });
  if (upErr) throw new Error("Lưu tệp backup lỗi: " + upErr.message);

  const dongBo: Record<string, { ok: boolean; msg: string }> = {};
  if (opts.dich.includes("gdrive")) {
    await onProgress?.({ phase: "sync", message: "Đồng bộ Google Drive…", pct: 92 });
    dongBo.gdrive = await syncGoogleDrive(fileName, bytes);
  }
  if (opts.dich.includes("s3")) {
    await onProgress?.({ phase: "sync", message: "Đồng bộ Amazon S3…", pct: 94 });
    dongBo.s3 = await syncS3(fileName, bytes);
  }

  const dich = Array.from(new Set(["storage", ...opts.dich]));
  const storageNote = storage.manifest.length
    ? `Kèm ${storage.manifest.length} tệp Storage (${(storage.totalBytes / 1048576).toFixed(1)} MB)` +
      (storage.skipped ? `, bỏ qua ${storage.skipped}` : "")
    : "Không có tệp Storage";
  const ghiChu = [opts.ghi_chu, storageNote].filter(Boolean).join(" · ");

  await onProgress?.({ phase: "history", message: "Ghi lịch sử sao lưu…", pct: 97 });
  const { data: rec, error: recErr } = await supabaseAdmin
    .from("backup_lich_su")
    .insert({
      loai: opts.loai,
      trang_thai: "hoan_thanh",
      so_bang: dump.meta.tables,
      so_dong: dump.meta.rows,
      dung_luong: bytes.length,
      file_path: fileName,
      dich,
      dong_bo: dongBo,
      ghi_chu: ghiChu || null,
      tao_boi: opts.userId ?? null,
      tao_boi_ten: opts.userName ?? null,
    })
    .select()
    .single();
  if (recErr) throw new Error("Ghi lịch sử backup lỗi: " + recErr.message);

  await onProgress?.({
    phase: "done",
    message: `Hoàn tất: ${dump.meta.tables} bảng · ${dump.meta.rows} dòng · ${storage.manifest.length} tệp`,
    pct: 100,
  });
  return { record: rec, dongBo, storage: manifest.storage };
}

/** Trích dữ liệu JSON từ một tệp backup (hỗ trợ .zip mới, .json.gz và .json cũ) */
export async function extractDumpData(fileName: string, buf: Uint8Array): Promise<any> {
  if (fileName.endsWith(".zip")) {
    const files = unzipSync(buf);
    const dataFile = files["data.json"];
    if (!dataFile) throw new Error("Tệp ZIP không chứa data.json");
    return JSON.parse(strFromU8(dataFile));
  }
  if (fileName.endsWith(".gz")) {
    const { gunzipSync } = await import("zlib");
    return JSON.parse(gunzipSync(buf as any).toString("utf-8"));
  }
  return JSON.parse(strFromU8(buf));
}
