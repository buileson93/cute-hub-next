#!/usr/bin/env python3
"""Áp schema.sql của dump qua helper __restore_exec, lọc các câu lệnh gây lỗi."""
import re
import subprocess
import sys
from pathlib import Path

SCHEMA = Path("supabase/dump/schema.sql")

SKIP_PREFIXES = (
    "SET ",
    "SELECT pg_catalog.set_config",
    "CREATE SCHEMA public",
    "COMMENT ON SCHEMA public",
    "CREATE EXTENSION",
    "COMMENT ON EXTENSION",
    "\\",
)
SKIP_PATTERNS = (
    re.compile(r"^ALTER\s+.*\bOWNER\s+TO\b", re.I | re.S),
    re.compile(r"^GRANT\s+.*\bTO\s+(postgres|supabase_admin)\b", re.I | re.S),
)


def split_statements(sql: str):
    """Tách theo dấu ; ở ngoài chuỗi và ngoài dollar-quote."""
    out, buf, i, n = [], [], 0, len(sql)
    dollar = None
    quote = None
    while i < n:
        ch = sql[i]
        if dollar:
            if sql.startswith(dollar, i):
                buf.append(dollar)
                i += len(dollar)
                dollar = None
                continue
        elif quote:
            if ch == quote:
                quote = None
        else:
            m = re.match(r"\$[A-Za-z_0-9]*\$", sql[i:])
            if m:
                dollar = m.group(0)
                buf.append(dollar)
                i += len(dollar)
                continue
            if ch in "'\"":
                quote = ch
            elif ch == "-" and sql.startswith("--", i):
                j = sql.find("\n", i)
                i = n if j == -1 else j + 1
                continue
            elif ch == ";":
                out.append("".join(buf).strip())
                buf = []
                i += 1
                continue
        buf.append(ch)
        i += 1
    if "".join(buf).strip():
        out.append("".join(buf).strip())
    return [s for s in out if s]


def keep(stmt: str) -> bool:
    s = stmt.lstrip()
    if not s or s.startswith("--"):
        return False
    if s.upper().startswith(tuple(p.upper() for p in SKIP_PREFIXES)):
        return False
    return not any(p.match(s) for p in SKIP_PATTERNS)


def run(stmt: str):
    payload = stmt.replace("$restore$", "$restore_esc$")
    sql = f"SELECT public.__restore_exec($restore${payload}$restore$);"
    return subprocess.run(
        ["psql", "-v", "ON_ERROR_STOP=1", "-q", "-c", sql],
        capture_output=True,
        text=True,
    )


def main():
    if not SCHEMA.exists():
        sys.exit(f"Không tìm thấy {SCHEMA}")
    stmts = [s for s in split_statements(SCHEMA.read_text()) if keep(s)]
    print(f"Áp {len(stmts)} câu lệnh từ {SCHEMA}")
    failed = []
    for idx, stmt in enumerate(stmts, 1):
        res = run(stmt)
        if res.returncode != 0:
            err = res.stderr.strip().splitlines()[-1] if res.stderr.strip() else "unknown"
            if "already exists" in err or "duplicate" in err.lower():
                continue
            failed.append((idx, stmt[:120].replace("\n", " "), err))
    print(f"Xong. Lỗi: {len(failed)}")
    for idx, head, err in failed:
        print(f"  [{idx}] {head} -> {err}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
