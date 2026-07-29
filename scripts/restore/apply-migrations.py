#!/usr/bin/env python3
"""Chạy toàn bộ migration trong supabase/migrations qua helper __restore_exec.

Idempotent: bỏ qua các lỗi 'already exists' / 'does not exist' khi drop.
"""
import subprocess
import sys
from pathlib import Path

MIG = Path("supabase/migrations")
IGNORABLE = (
    "already exists",
    "duplicate object",
    "duplicate_object",
    "does not exist, skipping",
)


def apply(path: Path):
    sql = path.read_text().replace("$restore$", "$restore_esc$")
    stmt = f"SELECT public.__restore_exec($restore${sql}$restore$);"
    return subprocess.run(
        ["psql", "-v", "ON_ERROR_STOP=1", "-q", "-c", stmt],
        capture_output=True,
        text=True,
    )


def main():
    if not MIG.is_dir():
        sys.exit(f"Không tìm thấy {MIG}")
    files = sorted(MIG.glob("*.sql"))
    print(f"Có {len(files)} migration")
    failed = []
    for f in files:
        res = apply(f)
        if res.returncode == 0:
            print(f"  ✓ {f.name}")
            continue
        err = res.stderr.strip().splitlines()[-1] if res.stderr.strip() else "unknown"
        if any(tok in err.lower() for tok in IGNORABLE):
            print(f"  ~ {f.name} (đã áp trước đó)")
            continue
        failed.append((f.name, err))
        print(f"  ✗ {f.name}: {err[:160]}")
    if failed:
        print(f"\n{len(failed)} migration lỗi — xử lý thủ công rồi chạy lại.")
        sys.exit(1)
    print("\nMigration hoàn tất.")


if __name__ == "__main__":
    main()
