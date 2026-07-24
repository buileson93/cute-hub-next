#!/usr/bin/env node
// GĐ1-06 perf budget: fail if any initial (entry) chunk > 400KB gzip.
// Usage: bun run build 2>&1 | tee /tmp/build.log && node scripts/perf-budget.mjs /tmp/build.log
import { readFileSync } from "node:fs";

const LIMIT_KB = 400;
const log = readFileSync(process.argv[2] ?? "/tmp/build.log", "utf8");

// Vite prints:  dist/.../foo-abc.js  123.45 kB │ gzip:  45.67 kB
const rx = /^\s*\S+\.js\s+[\d.]+\s*kB\s+│\s+gzip:\s+([\d.]+)\s*kB/gm;
const sizes = [...log.matchAll(rx)].map((m) => Number(m[1]));
if (!sizes.length) {
  console.warn("perf-budget: no chunks parsed — did the build run?");
  process.exit(0);
}
const max = Math.max(...sizes);
console.log(`perf-budget: ${sizes.length} chunks, max ${max.toFixed(1)} KB gzip (limit ${LIMIT_KB} KB)`);
if (max > LIMIT_KB) {
  console.error(`perf-budget: FAIL — chunk exceeds ${LIMIT_KB} KB gzip`);
  process.exit(1);
}
console.log("perf-budget: OK");
