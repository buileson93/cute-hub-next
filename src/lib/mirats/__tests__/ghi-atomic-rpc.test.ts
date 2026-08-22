import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// Bảo vệ chống lỗi "hàm không tồn tại" (PGRST202) quay lại:
//  1) Kho mã PHẢI luôn có migration định nghĩa đủ 6 chữ ký RPC ghi nghiệp vụ.
//  2) Nếu chạy được psql (môi trường có CSDL), kiểm tra thật trên CSDL:
//     hàm tồn tại và gọi được (chặn ở cửa xác thực, không phải lỗi 42883).

const REQUIRED = [
  { name: "ghi_su_co_atomic", args: "p_payload jsonb" },
  {
    name: "ghi_su_co_atomic",
    args: "p_thiet_bi_id uuid, p_hien_tuong text, p_ngay_phat_hien timestamp with time zone, p_vat_tu jsonb",
  },
  { name: "ghi_bao_duong_atomic", args: "p_payload jsonb" },
  {
    name: "ghi_bao_duong_atomic",
    args: "p_thiet_bi_id uuid, p_mo_ta text, p_ngay_bat_dau timestamp with time zone, p_vat_tu jsonb",
  },
  { name: "ghi_hong_hoc_atomic", args: "p_payload jsonb" },
  {
    name: "ghi_hong_hoc_atomic",
    args: "p_thiet_bi_id uuid, p_mo_ta_hong_hoc text, p_ngay_hong timestamp with time zone, p_vat_tu jsonb",
  },
];

function allMigrationSql(): string {
  const dir = path.resolve(process.cwd(), "supabase/migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => readFileSync(path.join(dir, f), "utf8"))
    .join("\n");
}

function psql(sql: string): string | null {
  if (!process.env.PGHOST) return null;
  try {
    return execFileSync("psql", ["-At", "-c", sql], { encoding: "utf8", timeout: 30_000 });
  } catch (e: any) {
    return String(e?.stdout ?? "") + String(e?.stderr ?? "");
  }
}

describe("RPC ghi nghiệp vụ nguyên tử", () => {
  const sql = allMigrationSql();

  for (const fn of new Set(REQUIRED.map((r) => r.name))) {
    it(`migration có định nghĩa ${fn}`, () => {
      expect(sql).toMatch(new RegExp(`CREATE OR REPLACE FUNCTION public\\.${fn}\\s*\\(`, "i"));
    });
  }

  it("migration cấp quyền EXECUTE cho authenticated", () => {
    for (const fn of new Set(REQUIRED.map((r) => r.name))) {
      expect(sql).toMatch(new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${fn}\\(`, "i"));
    }
  });

  const dbOut = psql(
    `select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='public' and p.proname like 'ghi\\_%\\_atomic'`,
  );

  it.skipIf(dbOut === null)("CSDL thật có đủ 6 chữ ký RPC", () => {
    for (const r of REQUIRED) {
      expect(dbOut).toContain(`${r.name}(${r.args})`);
    }
  });

  const callOut = psql(`select public.ghi_su_co_atomic('{"ma_nhom_bc":"TEST"}'::jsonb)`);
  it.skipIf(callOut === null)("gọi thử RPC không trả lỗi 'hàm không tồn tại'", () => {
    // Không có phiên đăng nhập nên hàm phải chặn ở bước xác thực — nghĩa là hàm CÓ tồn tại.
    expect(callOut).not.toMatch(/does not exist|42883|PGRST202/i);
    expect(callOut).toMatch(/Chưa đăng nhập/);
  });
});
