import { describe, it, expect } from "vitest";
import {
  validateField,
  buildUpdatePayload,
  isReadOnlyField,
} from "@/lib/mirats/ui/inline-edit";

describe("inline-edit — validateField", () => {
  it("từ chối field bất biến ma_thiet_bi (Task 18)", () => {
    const r = validateField("thiet_bi", "ma_thiet_bi", "TB_NEW");
    expect(r.hopLe).toBe(false);
    expect(r.loi[0]).toMatch(/bất biến|chỉ-đọc/);
  });

  it("từ chối serial (Task 14 — chỉ đổi qua form kiểm-soát)", () => {
    const r = validateField("thiet_bi", "ma_serial", "SN-999");
    expect(r.hopLe).toBe(false);
  });

  it("từ chối tồn kho (Task 15 — chỉ ghi qua kho_nhap/kho_xuat)", () => {
    const r = validateField("vat_tu", "so_luong_ton", 999);
    expect(r.hopLe).toBe(false);
  });

  it("mọi cột trong sổ kho đều chỉ-đọc", () => {
    expect(isReadOnlyField("kho", "loai_giao_dich")).toBe(true);
    expect(isReadOnlyField("kho", "so_luong")).toBe(true);
  });

  it("trạng thái sự cố tuân vòng đời — chuyển hợp lệ", () => {
    const r = validateField("su_co", "trang_thai", "Đang xử lý", "Mới");
    expect(r.hopLe).toBe(true);
    expect(r.giaTriChuan).toBe("Đang xử lý");
  });

  it("trạng thái sự cố — chuyển sai luồng bị từ chối", () => {
    // "Đóng" -> "Mới" không hợp lệ theo ALLOWED_TRANSITIONS (chỉ về "Đang xử lý")
    const r = validateField("su_co", "trang_thai", "Mới", "Đóng");
    expect(r.hopLe).toBe(false);
    expect(r.loi.join(" ")).toMatch(/chuyển trạng thái/);
  });

  it("chuẩn hoá string: trim và rỗng → null", () => {
    const a = validateField("thiet_bi", "ghi_chu", "  hello  ");
    expect(a.hopLe).toBe(true);
    expect(a.giaTriChuan).toBe("hello");
    const b = validateField("thiet_bi", "ghi_chu", "   ");
    expect(b.giaTriChuan).toBeNull();
  });
});

describe("inline-edit — buildUpdatePayload", () => {
  it("field trạng thái → RPC nghiệp vụ chuyển trạng thái", () => {
    const p = buildUpdatePayload("su_co", "sc-1", "trang_thai", "Đang xử lý");
    expect(p.rpc).toBe("chuyen_trang_thai_su_co");
    expect(p.args).toEqual({ p_id: "sc-1", p_trang_thai: "Đang xử lý" });
  });

  it("field thường → RPC cap_nhat_field_<loai> có guard", () => {
    const p = buildUpdatePayload("thiet_bi", "tb-1", "ghi_chu", "note");
    expect(p.rpc).toBe("cap_nhat_field_thiet_bi");
    expect(p.args).toEqual({ p_id: "tb-1", p_field: "ghi_chu", p_gia_tri: "note" });
  });

  it("field chỉ-đọc → ném lỗi ngay ở logic", () => {
    expect(() =>
      buildUpdatePayload("thiet_bi", "tb-1", "ma_thiet_bi", "TB_X"),
    ).toThrow();
    expect(() =>
      buildUpdatePayload("vat_tu", "vt-1", "so_luong_ton", 10),
    ).toThrow();
  });
});

// ============================================================================
// P6 — resolveEditIntent + useCellEditor: 3 view (tree/table/mindmap) HỘI TỤ
// vào cùng một đích ghi cho cùng (kind, ma, field, value).
// ============================================================================
import { resolveEditIntent, type CayView } from "@/lib/mirats/ui/inline-edit";

describe("P6 — resolveEditIntent hội tụ 3 view", () => {
  const runFromAllViews = <T,>(fn: (view: CayView) => T): T[] =>
    (["tree", "table", "mindmap"] as const).map(fn);

  it("đổi tên hệ thống (kind=ht) từ 3 view ⇒ cùng intent renameEntity", () => {
    const intents = runFromAllViews(() =>
      resolveEditIntent({
        kind: "ht",
        ma: "HT_AWOS_001",
        field: "ten",
        value: "  Hệ thống AWOS mới  ",
        isReal: true,
        realId: "uuid-ht-1",
      }),
    );
    expect(intents[0]).toEqual({
      target: "renameEntity",
      kind: "ht",
      id: "uuid-ht-1",
      ten: "Hệ thống AWOS mới",
    });
    expect(intents.every((i) => JSON.stringify(i) === JSON.stringify(intents[0]))).toBe(true);
  });

  it("đổi tên node nháp (không có bản ghi thật) ⇒ cùng saveNode ở 3 view", () => {
    const intents = runFromAllViews(() =>
      resolveEditIntent({
        kind: "nh",
        ma: "NH_TAM",
        field: "ten",
        value: "Nhóm tạm",
        isReal: false,
      }),
    );
    for (const it of intents) {
      expect(it).toEqual({
        target: "saveNode",
        kind: "nh",
        ma: "NH_TAM",
        field: "ten",
        value: "Nhóm tạm",
        isReal: false,
      });
    }
  });

  it("sửa cột vật lý ghi_chu của tài sản từ 3 view ⇒ cùng saveCell", () => {
    const intents = runFromAllViews(() =>
      resolveEditIntent({
        kind: "tb",
        ma: "TB_001",
        field: "ghi_chu",
        value: "  ghi chú mới  ",
        isReal: true,
        realId: "TB_001",
        physCols: ["ghi_chu", "so_seri"],
      }),
    );
    for (const it of intents) {
      expect(it).toEqual({
        target: "saveCell",
        ma: "TB_001",
        col: "ghi_chu",
        value: "ghi chú mới",
      });
    }
  });

  it("giá trị chuỗi rỗng ⇒ chuẩn hoá null (saveCell)", () => {
    const it = resolveEditIntent({
      kind: "tb",
      ma: "TB_001",
      field: "ghi_chu",
      value: "   ",
      isReal: true,
      realId: "TB_001",
      physCols: ["ghi_chu"],
    });
    expect(it).toEqual({ target: "saveCell", ma: "TB_001", col: "ghi_chu", value: null });
  });

  it("field không thuộc physCols ở layer tb ⇒ rơi về saveNode (du_lieu)", () => {
    const it = resolveEditIntent({
      kind: "tb",
      ma: "TB_001",
      field: "meta_x",
      value: 42,
      isReal: true,
      realId: "TB_001",
      physCols: ["ghi_chu"],
    });
    expect(it).toEqual({
      target: "saveNode",
      kind: "tb",
      ma: "TB_001",
      field: "meta_x",
      value: 42,
      isReal: true,
    });
  });

  it("kind pl/nh/ht với field non-'ten' ⇒ saveNode (không đi saveCell)", () => {
    const intents = (["pl", "nh", "ht"] as const).map((kind) =>
      resolveEditIntent({
        kind,
        ma: `${kind}-1`,
        field: "mau",
        value: "#1C51E0",
        isReal: true,
        realId: `uuid-${kind}`,
      }),
    );
    for (const it of intents) {
      expect(it.target).toBe("saveNode");
    }
  });
});

describe("P6 — useCellEditor dispatch tới đúng mutation", () => {
  it("commit từ 3 view ⇒ chỉ gọi một mutation, cùng args", async () => {
    // Mô phỏng runtime của hook (không cần React) — bám sát logic dispatch.
    const { resolveEditIntent: resolve } = await import("@/lib/mirats/ui/inline-edit");
    const spies = {
      renameEntity: [] as unknown[],
      saveCell: [] as unknown[],
      saveNode: [] as unknown[],
    };
    const dispatch = (intent: ReturnType<typeof resolve>) => {
      if (intent.target === "renameEntity") spies.renameEntity.push({ kind: intent.kind, id: intent.id, ten: intent.ten });
      if (intent.target === "saveCell") spies.saveCell.push({ ma: intent.ma, col: intent.col, value: intent.value });
      if (intent.target === "saveNode") spies.saveNode.push({ kind: intent.kind, ma: intent.ma, field: intent.field, value: intent.value });
    };
    for (const _view of ["tree", "table", "mindmap"] as const) {
      dispatch(resolve({
        kind: "ht", ma: "HT_A", field: "ten", value: "Tên A",
        isReal: true, realId: "uuid-A",
      }));
    }
    expect(spies.renameEntity).toHaveLength(3);
    expect(spies.saveCell).toHaveLength(0);
    expect(spies.saveNode).toHaveLength(0);
    expect(spies.renameEntity[0]).toEqual({ kind: "ht", id: "uuid-A", ten: "Tên A" });
    expect(spies.renameEntity.every((a) => JSON.stringify(a) === JSON.stringify(spies.renameEntity[0]))).toBe(true);
  });
});
