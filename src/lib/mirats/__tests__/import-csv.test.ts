// ============================================================================
// Kiểm thử phần LÕI phân tích/kết xuất CSV và cấu hình trường (import-config).
// Đây là các hàm THUẦN (không CSDL) dùng chung cho MỌI luồng nhập/xuất:
//   parseCsv / toCsv / csvCell / noAccent  và  entity field mapping.
// Bao phủ: xem-trước (parse), kết xuất (toCsv round-trip), ánh xạ/mặc định
// (fieldMap/fieldKeySet/csvHeaders), cảnh báo trùng (dedupe theo khóa).
// ============================================================================

import { describe, it, expect } from "vitest";
import {
  parseCsv,
  toCsv,
  csvCell,
  noAccent,
  csvHeaders,
  fieldMap,
  fieldKeySet,
  entityById,
  catalogEntity,
  findEntity,
  CATALOG_TABLES,
  ENTITIES,
} from "@/lib/mirats/import-config";

describe("parseCsv — xem trước file", () => {
  it("bỏ BOM ở đầu và tách header/row", () => {
    const { headers, rows } = parseCsv("\ufeffma,ten\r\nTB1,Máy A\r\nTB2,Máy B");
    expect(headers).toEqual(["ma", "ten"]);
    expect(rows).toEqual([
      { ma: "TB1", ten: "Máy A" },
      { ma: "TB2", ten: "Máy B" },
    ]);
  });

  it("hiểu ô có dấu phẩy/xuống dòng bọc trong ngoặc kép", () => {
    const csv = 'ma,ghi_chu\r\nTB1,"Hà Nội, Việt Nam"\r\nTB2,"Dòng 1\nDòng 2"';
    const { rows } = parseCsv(csv);
    expect(rows[0].ghi_chu).toBe("Hà Nội, Việt Nam");
    // Xuống dòng trong ô được gộp về một dấu cách (cleanCell).
    expect(rows[1].ghi_chu).toBe("Dòng 1 Dòng 2");
  });

  it('giải mã ngoặc kép thoát ("" → ")', () => {
    const { rows } = parseCsv('ma,ten\r\nTB1,"Loa 12"" bass"');
    expect(rows[0].ten).toBe('Loa 12" bass');
  });

  it("bỏ qua dòng rỗng hoàn toàn, gộp khoảng trắng thừa", () => {
    const { rows } = parseCsv("ma,ten\r\n\r\nTB1,   Máy   A  \r\n\r\n");
    expect(rows).toHaveLength(1);
    expect(rows[0].ten).toBe("Máy A");
  });

  it("file rỗng → headers/rows rỗng", () => {
    expect(parseCsv("")).toEqual({ headers: [], rows: [] });
    expect(parseCsv("\ufeff")).toEqual({ headers: [], rows: [] });
  });

  it("thiếu ô ở cuối dòng → điền chuỗi rỗng theo header", () => {
    const { rows } = parseCsv("ma,ten,ghi_chu\r\nTB1,Máy A");
    expect(rows[0]).toEqual({ ma: "TB1", ten: "Máy A", ghi_chu: "" });
  });
});

describe("toCsv — kết xuất & round-trip", () => {
  it("thêm BOM và nối dòng bằng CRLF", () => {
    const out = toCsv(["ma", "ten"], [{ ma: "TB1", ten: "A" }]);
    expect(out.startsWith("\ufeff")).toBe(true);
    expect(out).toBe("\ufeffma,ten\r\nTB1,A");
  });

  it("bọc ô chứa phẩy/ngoặc kép/xuống dòng", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('x"y')).toBe('"x""y"');
    expect(csvCell("dòng\nmới")).toBe('"dòng\nmới"');
    expect(csvCell(null)).toBe("");
    expect(csvCell(42)).toBe("42");
  });

  it("parseCsv(toCsv(x)) khôi phục dữ liệu đơn giản", () => {
    const headers = ["ma", "ten", "ghi_chu"];
    const rows = [
      { ma: "TB1", ten: "Máy, A", ghi_chu: 'Có "trích dẫn"' },
      { ma: "TB2", ten: "Máy B", ghi_chu: "" },
    ];
    const { headers: h2, rows: r2 } = parseCsv(toCsv(headers, rows));
    expect(h2).toEqual(headers);
    expect(r2).toEqual(rows);
  });
});

describe("noAccent — chuẩn hoá khớp tên (chống trùng)", () => {
  it("bỏ dấu, đổi đ→d, hạ chữ thường, cắt khoảng trắng", () => {
    expect(noAccent("  Đài Thông Tin  ")).toBe("dai thong tin");
    expect(noAccent("VHF")).toBe("vhf");
    expect(noAccent("Nhà Sản Xuất")).toBe("nha san xuat");
  });

  it("cùng khóa chuẩn hoá → phát hiện trùng bất kể dấu/hoa-thường", () => {
    expect(noAccent("Máy UHF")).toBe(noAccent("may uhf"));
  });
});

describe("import-config — ánh xạ trường & mặc định (nguồn sự thật)", () => {
  it("csvHeaders = danh sách key theo đúng thứ tự fields", () => {
    for (const ent of ENTITIES) {
      expect(csvHeaders(ent)).toEqual(ent.fields.map((f) => f.key));
    }
  });

  it("fieldMap tra được mọi key; fieldKeySet chứa đủ key", () => {
    const ent = entityById("thiet_bi");
    const fm = fieldMap(ent);
    const set = fieldKeySet(ent);
    for (const f of ent.fields) {
      expect(fm[f.key]).toBe(f);
      expect(set.has(f.key)).toBe(true);
    }
    expect(set.size).toBe(ent.fields.length);
  });

  it("mỗi entity có khóa tự nhiên nằm trong tập trường (để upsert)", () => {
    for (const ent of ENTITIES) {
      const keys = fieldKeySet(ent);
      expect(keys.has(ent.keyHeader)).toBe(true);
      // naturalKey là cột CSDL: hoặc trùng keyHeader, hoặc là col của một field.
      const cols = new Set(ent.fields.map((f) => f.col ?? f.key));
      expect(cols.has(ent.naturalKey)).toBe(true);
    }
  });

  it("mọi ref field khai đủ table/by/idCol", () => {
    for (const ent of ENTITIES) {
      for (const f of ent.fields) {
        if (f.kind !== "ref") continue;
        expect(f.ref, `${ent.id}.${f.key} thiếu ref`).toBeTruthy();
        expect(f.ref!.by.length).toBeGreaterThan(0);
        expect(f.ref!.idCol).toBeTruthy();
        expect(f.ref!.table).toBeTruthy();
      }
    }
  });

  it("inheritFromRef trỏ tới một ref field có thật và map non-empty", () => {
    for (const ent of ENTITIES) {
      if (!ent.inheritFromRef) continue;
      const f = ent.fields.find((x) => x.key === ent.inheritFromRef!.field);
      expect(f, `${ent.id}: inherit field không tồn tại`).toBeTruthy();
      expect(f!.kind).toBe("ref");
      expect(Object.keys(ent.inheritFromRef.map).length).toBeGreaterThan(0);
    }
  });

  it("catalogEntity dựng entity danh mục nền với khóa 'ma' + trường bắt buộc", () => {
    for (const c of CATALOG_TABLES) {
      const ent = catalogEntity(c.table);
      expect(ent.table).toBe(c.table);
      expect(ent.naturalKey).toBe("ma");
      const set = fieldKeySet(ent);
      expect(set.has("ma")).toBe(true);
      expect(set.has("ten")).toBe(true);
    }
  });

  it("findEntity: 'danh_muc' → theo catTable; id thường → entity tương ứng", () => {
    expect(findEntity("danh_muc", "dm_vi_tri")!.table).toBe("dm_vi_tri");
    expect(findEntity("thiet_bi")!.id).toBe("thiet_bi");
    expect(findEntity("khong_ton_tai")).toBeNull();
  });
});

describe("Cảnh báo trùng — dedupe theo khóa chuẩn hoá (mô phỏng UI CatalogTools)", () => {
  // UI gộp trùng ngay trong file theo noAccent(ma): giữ dòng ĐẦU, bỏ các dòng sau.
  function dedupeByMa(rows: Array<{ ma: string; ten: string }>) {
    const seen = new Set<string>();
    const kept: typeof rows = [];
    let duplicates = 0;
    for (const r of rows) {
      const k = noAccent(r.ma);
      if (seen.has(k)) {
        duplicates++;
        continue;
      }
      seen.add(k);
      kept.push(r);
    }
    return { kept, duplicates };
  }

  it("giữ dòng đầu, đếm số dòng trùng", () => {
    const { kept, duplicates } = dedupeByMa([
      { ma: "NCC1", ten: "Công ty A" },
      { ma: "ncc1", ten: "Công ty A (trùng)" },
      { ma: "NCC2", ten: "Công ty B" },
    ]);
    expect(kept.map((r) => r.ma)).toEqual(["NCC1", "NCC2"]);
    expect(duplicates).toBe(1);
  });
});
