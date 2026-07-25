/* eslint-disable no-console */
// ============================================================================
// Đo tỷ lệ bóc tách GPKT của Tầng-1 (regex) trên bộ PDF mẫu.
// Usage:
//   bunx tsx scripts/test-gpkt-parser.ts <folder-chứa-pdf> [--ai]
//   npm run test:gpkt -- /tmp/gpkt
//
// - Không dùng --ai: chỉ đo regex (offline, không tốn credit).
// - Kèm --ai: cho biết các file regex thất bại có cần fallback AI không
//   (in ra danh sách, không gọi AI thật).
// ============================================================================
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, resolve, extname } from "node:path";
import { linesFromItems, normalizeWgs84 } from "../src/lib/mirats/gpkt-pdf-parse";
import { parseGpktText } from "../src/lib/mirats/gpkt-regex-parser";
// pdfjs "legacy" build chạy được trong Node
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || name === "__MACOSX") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (extname(p).toLowerCase() === ".pdf") out.push(p);
  }
  return out;
}

async function extractNodePdfText(path: string): Promise<string> {
  const buf = readFileSync(path);
  const bytes = new Uint8Array(buf);
  const task = pdfjs.getDocument({ data: bytes, disableWorker: true });
  const pdf = await task.promise;
  const pages: string[] = [];
  const n = Math.min(pdf.numPages, 8);
  for (let i = 1; i <= n; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    pages.push(linesFromItems(tc.items));
  }
  return normalizeWgs84(pages.join("\n\n"));
}

interface Report {
  file: string;
  ok: boolean;
  filled: number;
  needsCheck: number;
  gp_so: string;
  method: "regex" | "fallback-ai";
  reason?: string;
}

async function main() {
  const args = process.argv.slice(2);
  const dir = args.find((a) => !a.startsWith("--"));
  if (!dir) {
    console.error("Usage: bunx tsx scripts/test-gpkt-parser.ts <folder> [--ai]");
    process.exit(1);
  }
  const root = resolve(dir);
  const files = walk(root);
  if (!files.length) {
    console.error(`Không thấy PDF trong ${root}`);
    process.exit(1);
  }
  console.log(`Quét ${files.length} PDF trong ${root}\n`);

  const reports: Report[] = [];
  for (const f of files) {
    const rel = f.replace(root + "/", "");
    try {
      const txt = await extractNodePdfText(f);
      if (!txt || txt.length < 100) {
        reports.push({ file: rel, ok: false, filled: 0, needsCheck: 0, gp_so: "", method: "fallback-ai", reason: "PDF không có text (scan)" });
        continue;
      }
      const r = parseGpktText(txt);
      const needsCheck = Object.values(r.perField).filter((m) => m.needsCheck).length;
      const ok = !!r.fields.gp_so && r.filledCount >= 8;
      reports.push({
        file: rel, ok, filled: r.filledCount, needsCheck,
        gp_so: r.fields.gp_so, method: ok ? "regex" : "fallback-ai",
        reason: ok ? undefined : (!r.fields.gp_so ? "Không tìm thấy số GP" : `Chỉ bóc được ${r.filledCount}/17`),
      });
    } catch (e) {
      reports.push({ file: rel, ok: false, filled: 0, needsCheck: 0, gp_so: "", method: "fallback-ai", reason: (e as Error).message });
    }
  }

  // In bảng
  const pad = (s: string, n: number) => s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
  console.log(pad("FILE", 48), pad("SỐ GP", 16), pad("FILLED", 8), pad("NEEDCHECK", 10), "METHOD");
  console.log("-".repeat(100));
  for (const r of reports) {
    console.log(
      pad(r.file, 48),
      pad(r.gp_so || "-", 16),
      pad(`${r.filled}/17`, 8),
      pad(String(r.needsCheck), 10),
      r.method + (r.reason ? `  (${r.reason})` : ""),
    );
  }
  const okCount = reports.filter((r) => r.ok).length;
  const total = reports.length;
  const rate = total ? ((okCount / total) * 100).toFixed(1) : "0";
  const avgFilled = total ? (reports.reduce((s, r) => s + r.filled, 0) / total).toFixed(1) : "0";
  const avgNeed = total ? (reports.reduce((s, r) => s + r.needsCheck, 0) / total).toFixed(1) : "0";
  console.log("-".repeat(100));
  console.log(`Tổng: ${total} tệp · Regex OK: ${okCount} (${rate}%) · Cần AI fallback: ${total - okCount}`);
  console.log(`Trung bình: ${avgFilled}/17 trường bóc được · ${avgNeed} trường cần kiểm tra`);
  if (args.includes("--ai")) {
    console.log("\nDanh sách sẽ fallback AI:");
    reports.filter((r) => !r.ok).forEach((r) => console.log("  ·", r.file, "→", r.reason));
  }
  // exit code phản ánh kết quả để CI check được
  process.exit(okCount === total ? 0 : 2);
}

main().catch((e) => { console.error(e); process.exit(1); });