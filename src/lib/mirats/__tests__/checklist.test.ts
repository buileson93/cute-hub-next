// Test THUẦN cho logic checklist: section "Cảm biến" / "Tủ phụ trợ" và các
// hạng mục có tên, hướng dẫn, result_kind, giá trị đo, đơn vị, tiêu chuẩn,
// kết quả, ghi chú, hành động. Bao phủ 2 quy tắc chính:
//   • KHÔNG ĐẠT ⇒ bắt buộc hành động.
//   • Giá trị số phải lưu NUMBER, không lưu chuỗi.
import { describe, it, expect } from "vitest";
import {
  buildItemResult,
  buildItemResults,
  coerceNumber,
  findChecklistError,
  validateItemInput,
  type ChecklistItem,
  type ChecklistSection,
} from "../checklist";
import { buildSections, sectionsFromResults, inputsFromResults } from "../checklist-repo";

function item(p: Partial<ChecklistItem> & { item_code: string }): ChecklistItem {
  return {
    item_code: p.item_code,
    ten: p.ten ?? p.item_code,
    huong_dan: p.huong_dan ?? null,
    result_kind: p.result_kind ?? "text",
    don_vi: p.don_vi ?? null,
    tieu_chuan: p.tieu_chuan ?? null,
    tuy_chon: p.tuy_chon ?? null,
    bat_buoc: p.bat_buoc ?? false,
    position: p.position ?? 0,
  };
}

// Mẫu điển hình: "Cảm biến" + "Tủ phụ trợ"
const CAM_BIEN: ChecklistSection = {
  ma_section: "CB",
  ten: "Cảm biến",
  mo_ta: "Kiểm tra khối cảm biến",
  position: 0,
  items: [
    item({
      item_code: "CB-DIEN-AP",
      ten: "Điện áp cảm biến",
      huong_dan: "Đo bằng đồng hồ vạn năng",
      result_kind: "so",
      don_vi: "V",
      tieu_chuan: "4.5–5.5",
      bat_buoc: true,
    }),
    item({
      item_code: "CB-TINH-TRANG",
      ten: "Tình trạng vật lý",
      result_kind: "dat_khong_dat",
      position: 1,
    }),
  ],
};

const TU_PHU_TRO: ChecklistSection = {
  ma_section: "TPT",
  ten: "Tủ phụ trợ",
  mo_ta: null,
  position: 1,
  items: [
    item({
      item_code: "TPT-QUAT",
      ten: "Quạt làm mát",
      result_kind: "chon",
      tuy_chon: ["Chạy tốt", "Kêu to", "Không chạy"],
    }),
  ],
};

const SECTIONS = [CAM_BIEN, TU_PHU_TRO];

describe("checklist — validate", () => {
  it("Không đạt BẮT BUỘC phải có hành động", () => {
    const err = validateItemInput(item({ item_code: "x", ten: "X", result_kind: "dat_khong_dat" }), {
      ket_qua: "khong_dat",
    });
    expect(err).toContain("hành động");
  });

  it("Không đạt + có hành động ⇒ hợp lệ", () => {
    const err = validateItemInput(item({ item_code: "x", result_kind: "dat_khong_dat" }), {
      ket_qua: "khong_dat",
      hanh_dong: "Thay cảm biến",
    });
    expect(err).toBeNull();
  });

  it("giá trị đo phải là SỐ (chuỗi không phải số ⇒ lỗi)", () => {
    const err = validateItemInput(CAM_BIEN.items[0], { gia_tri_so: "abc" });
    expect(err).toContain("phải là số");
  });

  it("số hợp lệ (chấp nhận dấu phẩy) ⇒ không lỗi", () => {
    expect(validateItemInput(CAM_BIEN.items[0], { gia_tri_so: "5,0" })).toBeNull();
  });

  it("bắt buộc nhập giá trị đo khi để trống", () => {
    const err = validateItemInput(CAM_BIEN.items[0], { gia_tri_so: "" });
    expect(err).toContain("bắt buộc");
  });

  it("findChecklistError trả lỗi đầu tiên", () => {
    const err = findChecklistError(SECTIONS, {
      "CB-DIEN-AP": { gia_tri_so: "5" },
      "CB-TINH-TRANG": { ket_qua: "khong_dat" }, // thiếu hành động
    });
    expect(err).toContain("hành động");
  });

  it("checklist đủ điều kiện ⇒ không lỗi", () => {
    const err = findChecklistError(SECTIONS, {
      "CB-DIEN-AP": { gia_tri_so: "5" },
      "CB-TINH-TRANG": { ket_qua: "dat" },
      "TPT-QUAT": { gia_tri_text: "Chạy tốt", ket_qua: "dat" },
    });
    expect(err).toBeNull();
  });
});

describe("checklist — coerceNumber & lưu số", () => {
  it("ép chuỗi số về number, rỗng ⇒ null, sai ⇒ NaN", () => {
    expect(coerceNumber("5.5")).toBe(5.5);
    expect(coerceNumber("5,5")).toBe(5.5);
    expect(coerceNumber("")).toBeNull();
    expect(coerceNumber(null)).toBeNull();
    expect(Number.isNaN(coerceNumber("x") as number)).toBe(true);
  });

  it("buildItemResult lưu gia_tri_so dạng NUMBER (không lưu chuỗi)", () => {
    const r = buildItemResult("sub1", CAM_BIEN, CAM_BIEN.items[0], { gia_tri_so: "5,2" });
    expect(typeof r.gia_tri_so).toBe("number");
    expect(r.gia_tri_so).toBe(5.2);
    expect(r.gia_tri_text).toBeNull();
    // snapshot đơn vị/tiêu chuẩn
    expect(r.don_vi).toBe("V");
    expect(r.tieu_chuan).toBe("4.5–5.5");
    expect(r.section_code).toBe("CB");
  });

  it("kiểu chọn/text lưu gia_tri_text, gia_tri_so = null", () => {
    const r = buildItemResult("sub1", TU_PHU_TRO, TU_PHU_TRO.items[0], { gia_tri_text: "Kêu to" });
    expect(r.gia_tri_so).toBeNull();
    expect(r.gia_tri_text).toBe("Kêu to");
  });

  it("buildItemResults giữ đúng thứ tự section → item và mang hành động", () => {
    const rows = buildItemResults("sub9", SECTIONS, {
      "CB-DIEN-AP": { gia_tri_so: "4.9" },
      "CB-TINH-TRANG": { ket_qua: "khong_dat", hanh_dong: "Vệ sinh" },
      "TPT-QUAT": { gia_tri_text: "Chạy tốt" },
    });
    expect(rows.map((r) => r.item_code)).toEqual(["CB-DIEN-AP", "CB-TINH-TRANG", "TPT-QUAT"]);
    expect(rows[0].gia_tri_so).toBe(4.9);
    expect(rows[1].hanh_dong).toBe("Vệ sinh");
    expect(rows.every((r) => r.submission_id === "sub9")).toBe(true);
  });
});

describe("checklist-repo — mapper thuần", () => {
  it("buildSections gộp item vào section theo id, sắp xếp position", () => {
    const secs = buildSections(
      [
        { id: "s2", ma_section: "TPT", ten: "Tủ phụ trợ", position: 1 },
        { id: "s1", ma_section: "CB", ten: "Cảm biến", position: 0 },
      ],
      [
        { id: "i2", section_id: "s1", item_code: "CB-2", ten: "B", result_kind: "text", position: 1 },
        { id: "i1", section_id: "s1", item_code: "CB-1", ten: "A", result_kind: "so", position: 0 },
        { id: "i3", section_id: "s2", item_code: "TPT-1", ten: "Quạt", result_kind: "chon" },
      ],
    );
    expect(secs.map((s) => s.ma_section)).toEqual(["CB", "TPT"]);
    expect(secs[0].items.map((i) => i.item_code)).toEqual(["CB-1", "CB-2"]);
    expect(secs[0].items[0].result_kind).toBe("so");
  });

  it("round-trip: kết quả đã lưu dựng lại section + input để xem chi tiết", () => {
    const results = [
      {
        section_code: "CB", section_ten: "Cảm biến", item_code: "CB-DIEN-AP", ten: "Điện áp",
        result_kind: "so", gia_tri_so: 5.1, don_vi: "V", tieu_chuan: "4.5–5.5", ket_qua: "dat", position: 0,
      },
      {
        section_code: "CB", section_ten: "Cảm biến", item_code: "CB-TT", ten: "Tình trạng",
        result_kind: "dat_khong_dat", ket_qua: "khong_dat", hanh_dong: "Thay", position: 1,
      },
    ];
    const secs = sectionsFromResults(results);
    const inputs = inputsFromResults(results);
    expect(secs).toHaveLength(1);
    expect(secs[0].items.map((i) => i.item_code)).toEqual(["CB-DIEN-AP", "CB-TT"]);
    expect(inputs["CB-DIEN-AP"].gia_tri_so).toBe(5.1);
    expect(inputs["CB-TT"].hanh_dong).toBe("Thay");
  });
});
