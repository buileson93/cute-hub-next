#!/usr/bin/env node
/**
 * MIRATS - Tải toàn bộ file trong Supabase Storage về local
 * ==========================================================
 * Duyệt qua mọi bucket, tải mọi object về ./storage-dump/<bucket>/<path>
 *
 * YÊU CẦU BIẾN MÔI TRƯỜNG:
 *   SUPABASE_URL                  (vd: https://xxx.supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY     (LẤY TỪ project cũ - KHÔNG commit)
 *
 * CHẠY:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/download-storage.mjs
 *
 * Sau đó nén ./storage-dump vào file ZIP backup:
 *   zip -r /mnt/documents/mirats-storage-$(date +%Y%m%d).zip storage-dump
 */
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OUT = process.env.OUT_DIR || "./storage-dump";

if (!URL || !KEY) {
  console.error("❌ Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
  console.error("   Lấy service role key ở project cũ (chỉ dùng lần chuyển).");
  process.exit(1);
}

const sb = createClient(URL, KEY, { auth: { persistSession: false } });

async function walk(bucket, prefix = "") {
  const files = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await sb.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        // folder → đệ quy
        const nested = await walk(bucket, path);
        files.push(...nested);
      } else {
        files.push(path);
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return files;
}

async function main() {
  const { data: buckets, error } = await sb.storage.listBuckets();
  if (error) throw error;
  console.log(`==> Tìm thấy ${buckets.length} bucket`);

  let total = 0;
  let ok = 0;
  let fail = 0;

  for (const bk of buckets) {
    console.log(`\n== Bucket: ${bk.name} (${bk.public ? "public" : "private"})`);
    const paths = await walk(bk.name);
    console.log(`   ${paths.length} file`);
    total += paths.length;

    for (const p of paths) {
      const dest = join(OUT, bk.name, p);
      try {
        const { data, error: dlErr } = await sb.storage.from(bk.name).download(p);
        if (dlErr) throw dlErr;
        await mkdir(dirname(dest), { recursive: true });
        const buf = Buffer.from(await data.arrayBuffer());
        await writeFile(dest, buf);
        ok++;
        if (ok % 25 === 0) console.log(`   ...${ok}/${total}`);
      } catch (e) {
        fail++;
        console.error(`   ❌ ${bk.name}/${p}: ${e.message}`);
      }
    }
  }

  console.log(`\n✅ Xong. Thành công: ${ok} | Lỗi: ${fail} | Tổng: ${total}`);
  console.log(`   Thư mục: ${OUT}`);
  console.log(`   Nén ZIP: zip -r mirats-storage.zip ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
