#!/usr/bin/env node
// GĐ1-05 A11y lint: check icon-only buttons, imgs, and h-screen usage.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const violations = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (p.endsWith(".tsx") || p.endsWith(".ts")) check(p);
  }
}

function check(file) {
  const txt = readFileSync(file, "utf8");

  // h-screen check
  if (/\bh-screen\b|\bmin-h-screen\b/.test(txt)) {
    violations.push(`${file}: uses h-screen (prefer h-dvh)`);
  }

  // <img> without alt
  for (const m of txt.matchAll(/<img\b[^>]*?\/?>/gs)) {
    if (!/\balt=/.test(m[0])) {
      const line = txt.slice(0, m.index).split("\n").length;
      violations.push(`${file}:${line}: <img> missing alt`);
    }
  }

  // <Button size="icon"> without aria-label and empty text
  for (const m of txt.matchAll(/<Button\b([^>]*?)>(.*?)<\/Button>/gs)) {
    const attrs = m[1];
    const inner = m[2];
    if (!/size="icon"/.test(attrs)) continue;
    if (/aria-label/.test(attrs)) continue;
    const stripped = inner.replace(/<[^>]+\/?>/g, "").replace(/\{[^}]*\}/g, "").trim();
    if (!stripped) {
      const line = txt.slice(0, m.index).split("\n").length;
      violations.push(`${file}:${line}: icon-only <Button> missing aria-label`);
    }
  }
}

walk("src");

if (violations.length) {
  console.error(`A11y lint: ${violations.length} violation(s)`);
  for (const v of violations) console.error("  " + v);
  process.exit(1);
} else {
  console.log("A11y lint: OK (0 violations)");
}
