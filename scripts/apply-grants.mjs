#!/usr/bin/env node
// Chạy scripts/grants-baseline.sql qua psql. Idempotent.
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const sqlFile = join(here, "grants-baseline.sql");
if (!existsSync(sqlFile)) {
  console.error("✗ grants-baseline.sql không tồn tại");
  process.exit(2);
}
if (!process.env.PGHOST) {
  console.log("⊘ Bỏ qua apply-grants: không có PGHOST (không phải sandbox có DB access)");
  process.exit(0);
}
try {
  execSync(`psql -v ON_ERROR_STOP=1 -f ${sqlFile}`, {
    stdio: ["ignore", "inherit", "inherit"],
    timeout: 60_000,
  });
  console.log("✓ grants-baseline áp dụng xong");
} catch (e) {
  console.error(`✗ apply-grants thất bại: ${e.message.split("\n").slice(0, 3).join(" | ")}`);
  process.exit(1);
}
