#!/usr/bin/env node
// Data-driven grants verifier. Đọc scripts/grants-matrix.json và assert từng cell.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const matrix = JSON.parse(readFileSync(join(here, "grants-matrix.json"), "utf8"));

/** @type {{kind:'table'|'function', name:string, role:string, priv:string}[]} */
const CHECKS = [];
for (const [name, roles] of Object.entries(matrix.tables ?? {})) {
  for (const [role, privs] of Object.entries(roles)) {
    for (const priv of privs) CHECKS.push({ kind: "table", name, role, priv });
  }
}
for (const [name, roles] of Object.entries(matrix.functions ?? {})) {
  for (const role of roles) CHECKS.push({ kind: "function", name, role, priv: "EXECUTE" });
}

if (!process.env.PGHOST) {
  console.log("⊘ Bỏ qua verify-grants: không có PGHOST");
  process.exit(0);
}

const RESET = "\x1b[0m",
  RED = "\x1b[31m",
  GRN = "\x1b[32m",
  YLW = "\x1b[33m",
  DIM = "\x1b[2m";
const esc = (s) => s.replace(/'/g, "''");

let ddlTriggerState = "missing";
try {
  ddlTriggerState =
    execSync(
      `psql -Atqc "select coalesce(max(evtenabled::text), 'missing') from pg_event_trigger where evtname = 'mirats_auto_public_grants'"`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 10_000 },
    ).trim() || "missing";
} catch {
  ddlTriggerState = "unknown";
}

const unions = CHECKS.map((c, i) => {
  const lookup = c.kind === "table" ? "to_regclass" : "to_regprocedure";
  const priv = c.kind === "table" ? "has_table_privilege" : "has_function_privilege";
  return `SELECT ${i} AS i,
    ${lookup}('${esc(c.name)}') IS NOT NULL AS exists,
    COALESCE(${priv}('${esc(c.role)}', '${esc(c.name)}', '${c.priv}'), false) AS ok`;
}).join("\nUNION ALL\n");

const sql = `WITH r AS (${unions}) SELECT i || '|' || exists || '|' || ok FROM r ORDER BY i;`;
const sqlFile = join(mkdtempSync(join(tmpdir(), "vg-")), "q.sql");
writeFileSync(sqlFile, sql);

let out;
try {
  out = execSync(`psql -Atqf ${sqlFile}`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
  }).trim();
} catch (e) {
  console.error(`${RED}psql lỗi:${RESET} ${e.message.split("\n").slice(0, 3).join(" | ")}`);
  process.exit(2);
}

const rows = out.split("\n").map((l) => {
  const [i, exists, ok] = l.split("|");
  return {
    i: Number(i),
    exists: exists === "t" || exists === "true",
    ok: ok === "t" || ok === "true",
  };
});

let pass = 0,
  fail = 0,
  missing = 0;
const failures = [];
for (const r of rows) {
  const c = CHECKS[r.i];
  const label = `${(c.kind === "table" ? "TABLE" : "RPC  ").padEnd(5)} ${c.role.padEnd(14)} ${c.priv.padEnd(11)} ${c.name}`;
  if (!r.exists) {
    console.log(`${YLW}○ MISSING${RESET} ${DIM}${label}${RESET}`);
    missing++;
  } else if (r.ok) {
    pass++;
  } else {
    console.log(`${RED}✗ DENIED ${RESET} ${label}`);
    failures.push(c);
    fail++;
  }
}

console.log(
  `\n${pass} ok · ${fail ? RED : ""}${fail} thiếu quyền${RESET} · ${missing} chưa tồn tại (tổng ${CHECKS.length})`,
);

// ── Materialized views phải luôn có dữ liệu sau deploy ─────────────────────
const REQUIRED_MVS = ["mv_asset_anomaly", "mv_dashboard_overview"];
let mvFail = 0;
try {
  const mvOut = execSync(
    `psql -Atqc "select matviewname || '|' || ispopulated from pg_matviews where schemaname = 'public'"`,
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 15_000 },
  ).trim();
  const state = new Map(
    mvOut
      ? mvOut.split("\n").map((l) => {
          const [n, p] = l.split("|");
          return [n, p === "t" || p === "true"];
        })
      : [],
  );
  for (const mv of REQUIRED_MVS) {
    if (!state.has(mv)) {
      console.log(`${YLW}○ MISSING${RESET} ${DIM}MVIEW ${mv}${RESET}`);
      continue;
    }
    if (state.get(mv)) {
      console.log(`${GRN}✓ MVIEW${RESET}   ${mv} đã có dữ liệu`);
    } else {
      console.log(`${RED}✗ MVIEW${RESET}   ${mv} chưa được nạp dữ liệu`);
      mvFail++;
    }
  }
} catch (e) {
  console.log(`${YLW}⚠ Không kiểm tra được materialized view:${RESET} ${e.message.split("\n")[0]}`);
}

if (ddlTriggerState === "A" || ddlTriggerState === "O") {
  console.log(
    `\n${YLW}⚠ mirats_auto_public_grants đang bật (${ddlTriggerState}).${RESET} ` +
      "Event trigger này sweep toàn schema sau mỗi DDL; audit đã xác nhận nó có thể làm migration timeout trước khi SQL mới chạy.",
  );
  console.log(
    `${DIM}Khuyến nghị: thay bằng baseline/postmigrate + audit nhẹ, hoặc cần owner postgres/Lovable Cloud để drop trigger.${RESET}`,
  );
}

if (mvFail) {
  console.log(
    `\n${YLW}Fix:${RESET} chạy \`psql -c "REFRESH MATERIALIZED VIEW public.<ten_mv>;"\` ` +
      "(hoặc RPC refresh_mv_asset_anomaly) rồi verify lại.",
  );
}

if (fail || mvFail) {
  if (fail) {
    console.log(
      `\n${YLW}Fix:${RESET} chạy \`bun run apply:grants\` (hoặc psql -f scripts/grants-baseline.sql)`,
    );
  }
  for (const c of failures.slice(0, 10)) {
    const stmt =
      c.kind === "table"
        ? `GRANT ${c.priv} ON ${c.name} TO ${c.role};`
        : `GRANT EXECUTE ON FUNCTION ${c.name} TO ${c.role};`;
    console.log(`  ${DIM}${stmt}${RESET}`);
  }
  process.exit(1);
}
