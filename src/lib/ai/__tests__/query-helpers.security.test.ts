import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  ident,
  lit,
  buildListSql,
  buildGetRowSql,
  buildCountSql,
  KNOWN_TABLES,
} from "../query-helpers";
import { getKnownTableNames } from "../data-dictionary";

/**
 * Các test bảo vệ tầng dựng SQL cho tool AI. Mọi tool generic chỉ thao tác trên
 * bảng/cột đã kiểm định; giá trị luôn được escape; LIMIT luôn bị cưỡng bức.
 * (Tầng RPC ai_run_select có test SQL riêng ở supabase/tests.)
 */
describe("query-helpers – an toàn định danh & giá trị", () => {
  it("ident chấp nhận tên hợp lệ và bọc nháy kép", () => {
    expect(ident("thiet_bi")).toBe('"thiet_bi"');
    expect(ident("ngay_het_han")).toBe('"ngay_het_han"');
  });

  it("ident từ chối tên có ký tự lạ / SQL injection", () => {
    for (const bad of [
      'thiet_bi"; drop table x; --',
      "col; select",
      "col with space",
      "UPPER",
      "1col",
      "col-1",
      "*",
      "public.thiet_bi",
    ]) {
      expect(() => ident(bad)).toThrow();
    }
  });

  it("lit nhân đôi dấu nháy đơn để chặn thoát chuỗi", () => {
    expect(lit("O'Brien")).toBe("'O''Brien'");
    expect(lit("'; drop table x; --")).toBe("'''; drop table x; --'");
    expect(lit(42)).toBe("42");
    expect(lit(true)).toBe("true");
  });

  it("buildListSql luôn kèm LIMIT và kẹp trong [1,500]", () => {
    expect(buildListSql("thiet_bi")).toContain("LIMIT 50");
    expect(buildListSql("thiet_bi", { limit: 99999 })).toContain("LIMIT 500");
    expect(buildListSql("thiet_bi", { limit: 0 })).toContain("LIMIT 1");
    expect(buildListSql("thiet_bi", { limit: -5 })).toContain("LIMIT 1");
  });

  it("buildListSql chỉ sinh 1 câu SELECT (không có ';' giữa câu)", () => {
    const sql = buildListSql("su_co", {
      columns: ["ma_su_co", "muc_do"],
      filters: [{ column: "trang_thai", op: "eq", value: "moi" }],
      order_by: "ngay_phat_hien",
    });
    expect(sql.startsWith("SELECT ")).toBe(true);
    expect(sql.slice(0, -1).includes(";")).toBe(false);
    expect(sql).toContain('FROM public."su_co"');
  });

  it("buildListSql từ chối cột không hợp lệ", () => {
    expect(() => buildListSql("thiet_bi", { columns: ["ten_thiet_bi", "x; drop"] })).toThrow();
    expect(() =>
      buildListSql("thiet_bi", { filters: [{ column: "a b", op: "eq", value: "1" }] }),
    ).toThrow();
  });

  it("filter 'like' escape giá trị và bọc %…%", () => {
    const sql = buildListSql("thiet_bi", {
      filters: [{ column: "ten_thiet_bi", op: "like", value: "a'b" }],
    });
    expect(sql).toContain("ILIKE '%a''b%'");
  });

  it("buildGetRowSql & buildCountSql escape giá trị và giới hạn", () => {
    expect(buildGetRowSql("thiet_bi", "id", "x'y")).toContain("= 'x''y'");
    expect(buildCountSql("thiet_bi", "trang_thai_id")).toContain("GROUP BY");
    expect(buildCountSql("thiet_bi")).toContain("count(*)");
  });
});

describe("allowlist bảng cho tool generic (table/cột ngoài allowlist)", () => {
  const tableEnum = z.enum(KNOWN_TABLES);

  it("KNOWN_TABLES đồng bộ 1-1 với từ điển dữ liệu", () => {
    expect([...KNOWN_TABLES].sort()).toEqual(getKnownTableNames().sort());
  });

  it("chấp nhận bảng nghiệp vụ trong allowlist", () => {
    for (const t of ["thiet_bi", "su_co", "bao_tri", "giay_phep", "dm_don_vi"]) {
      expect(tableEnum.safeParse(t).success).toBe(true);
    }
  });

  it("từ chối bảng ngoài allowlist (auth/nội bộ/không tồn tại)", () => {
    for (const t of ["auth.users", "user_roles_secret", "pg_shadow", "khong_ton_tai", ""]) {
      expect(tableEnum.safeParse(t).success).toBe(false);
    }
  });
});
