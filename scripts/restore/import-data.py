#!/usr/bin/env python3
"""Import CSV dump nhiều lượt để tự giải quyết thứ tự khoá ngoại."""
import csv
import io
import subprocess
import sys
from pathlib import Path

DATA = Path("supabase/dump/data")
MAX_PASSES = 6
SKIP_TABLES = {"_dbg_tmp", "schema_migrations"}


def psql(sql: str):
    return subprocess.run(
        ["psql", "-v", "ON_ERROR_STOP=1", "-q", "-c", sql],
        capture_output=True,
        text=True,
    )


def bypass_rls(enable: bool):
    verb = "BYPASSRLS" if enable else "NOBYPASSRLS"
    res = psql(
        f"SELECT public.__restore_exec(format('ALTER ROLE %I {verb}', current_user));"
    )
    if res.returncode != 0:
        print(f"  (bỏ qua {verb}: {res.stderr.strip().splitlines()[-1:]})")


def table_exists(name: str) -> bool:
    res = subprocess.run(
        ["psql", "-tAc", f"SELECT to_regclass('public.{name}') IS NOT NULL"],
        capture_output=True,
        text=True,
    )
    return res.stdout.strip() == "t"


def copy_csv(path: Path, table: str):
    with path.open(newline="") as fh:
        header = next(csv.reader(fh), None)
    if not header:
        return True, "rỗng"
    cols = ", ".join(f'"{c}"' for c in header)
    sql = f'\\copy public."{table}" ({cols}) FROM \'{path}\' WITH (FORMAT csv, HEADER true)'
    res = subprocess.run(
        ["psql", "-v", "ON_ERROR_STOP=1", "-q", "-c", sql],
        capture_output=True,
        text=True,
    )
    if res.returncode == 0:
        return True, "ok"
    err = res.stderr.strip().splitlines()[-1] if res.stderr.strip() else "unknown"
    return False, err


def main():
    if not DATA.is_dir():
        sys.exit(f"Không tìm thấy {DATA}")
    files = sorted(p for p in DATA.glob("*.csv") if p.stem not in SKIP_TABLES)
    pending = [p for p in files if table_exists(p.stem)]
    missing = [p.stem for p in files if p not in pending]
    if missing:
        print(f"Bỏ qua {len(missing)} bảng chưa tồn tại trong schema: {', '.join(missing)}")

    bypass_rls(True)
    try:
        for p in range(1, MAX_PASSES + 1):
            if not pending:
                break
            print(f"\n--- Lượt {p}: {len(pending)} bảng ---")
            still = []
            for path in pending:
                ok, msg = copy_csv(path, path.stem)
                if ok:
                    print(f"  ✓ {path.stem}")
                else:
                    still.append(path)
                    print(f"  … {path.stem}: {msg[:110]}")
            if len(still) == len(pending):
                pending = still
                print("Không tiến triển thêm, dừng.")
                break
            pending = still
    finally:
        bypass_rls(False)

    if pending:
        print("\nCÒN LỖI:", ", ".join(x.stem for x in pending))
        sys.exit(1)
    print("\nImport dữ liệu hoàn tất.")


if __name__ == "__main__":
    main()
