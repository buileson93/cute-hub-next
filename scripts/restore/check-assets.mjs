#!/usr/bin/env node
// Kiểm tra asset ngoài (src/assets/*.asset.json) có khớp project hiện tại không.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/assets";

function currentProjectId() {
  if (!existsSync(".env")) return null;
  const m = readFileSync(".env", "utf8").match(/^VITE_LOVABLE_PROJECT_ID=(.+)$/m);
  return m ? m[1].trim() : null;
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".asset.json"));
const current = currentProjectId();
const ids = new Set();
const problems = [];

for (const f of files) {
  let meta;
  try {
    meta = JSON.parse(readFileSync(join(DIR, f), "utf8"));
  } catch {
    problems.push(`${f}: JSON hỏng`);
    continue;
  }
  if (!meta.url || !meta.asset_id) problems.push(`${f}: thiếu url/asset_id`);
  if (meta.project_id) ids.add(meta.project_id);
}

console.log(`Asset ngoài: ${files.length} file .asset.json trong ${DIR}`);
console.log(`project_id xuất hiện: ${[...ids].join(", ") || "(không có)"}`);
if (current) console.log(`project hiện tại: ${current}`);

if (ids.size > 1) {
  problems.push(`Nhiều project_id khác nhau (${ids.size}) — asset trộn từ nhiều project.`);
}
if (current && ids.size && !ids.has(current)) {
  problems.push(
    `Asset thuộc project khác project hiện tại → ảnh trang login sẽ 404. Upload lại ảnh vào project này.`,
  );
}

const binaries = readdirSync(DIR).filter((f) => /\.(png|jpe?g|svg|webp)$/i.test(f));
console.log(`Ảnh nhị phân có sẵn: ${binaries.length ? binaries.join(", ") : "(không có)"}`);

if (problems.length) {
  console.log("\nCẦN XỬ LÝ:");
  for (const p of problems) console.log("  - " + p);
  process.exitCode = 1;
} else {
  console.log("\nOK: asset hợp lệ.");
}
