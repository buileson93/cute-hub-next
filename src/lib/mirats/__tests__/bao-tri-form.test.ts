import { describe, it, expect } from "vitest";
import {
  filterBaoTriTemplates,
  findMissingRequired,
  buildSubmissionInsert,
  buildBaoTriRows,
  fmtFieldValue,
  buildContentPairs,
  type BaoTriTemplateJoinRow,
  type MatchedTemplate,
  type SubmissionDeviceLite,
} from "../bao-tri-form";

function tpl(p: Partial<BaoTriTemplateJoinRow["form_template"]> & { id: string }) {
  return {
    form_template: {
      id: p.id,
      code: p.code ?? "BD-01",
      ten: p.ten ?? "Mẫu " + p.id,
      mo_ta: p.mo_ta ?? null,
      version: p.version ?? 1,
      active: p.active ?? true,
      nhom: p.nhom ?? "bao_duong",
    },
  } as BaoTriTemplateJoinRow;
}

const MATCHED: MatchedTemplate = {
  id: "t1",
  code: "BD-VHF",
  ten: "Phiếu BD VHF",
  mo_ta: null,
  version: 2,
};

// ============================================================================
// #1 — Chọn hệ thống lọc đúng mẫu
// ============================================================================
describe("filterBaoTriTemplates — chỉ mẫu active + nhóm bao_duong", () => {
  it("giữ mẫu bảo dưỡng đang kích hoạt", () => {
    const out = filterBaoTriTemplates([tpl({ id: "a" }), tpl({ id: "b" })]);
    expect(out.map((t) => t.id)).toEqual(["a", "b"]);
    expect(out[0]).toEqual({ id: "a", code: "BD-01", ten: "Mẫu a", mo_ta: null, version: 1 });
  });

  it("loại mẫu không thuộc nhóm bao_duong (vd bien_ban)", () => {
    const out = filterBaoTriTemplates([tpl({ id: "a", nhom: "bien_ban" }), tpl({ id: "b" })]);
    expect(out.map((t) => t.id)).toEqual(["b"]);
  });

  it("loại mẫu đã tắt (active=false)", () => {
    const out = filterBaoTriTemplates([tpl({ id: "a", active: false }), tpl({ id: "b" })]);
    expect(out.map((t) => t.id)).toEqual(["b"]);
  });

  it("bỏ qua dòng form_template null và mảng rỗng/null", () => {
    expect(filterBaoTriTemplates([{ form_template: null }])).toEqual([]);
    expect(filterBaoTriTemplates(null)).toEqual([]);
    expect(filterBaoTriTemplates(undefined)).toEqual([]);
  });
});

// ============================================================================
// Trường bắt buộc
// ============================================================================
describe("findMissingRequired", () => {
  const fields = [
    { key: "a", label: "Trường A", required: true },
    { key: "b", label: "Trường B", required: false },
    { key: "c", label: "Trường C", required: true },
  ];
  it("null khi đủ trường bắt buộc", () => {
    expect(findMissingRequired(fields, { a: "x", c: "y" })).toBeNull();
  });
  it("trả nhãn trường bắt buộc đầu tiên còn thiếu", () => {
    expect(findMissingRequired(fields, { a: "", c: "y" })).toBe("Trường A");
    expect(findMissingRequired(fields, { a: "x", c: null })).toBe("Trường C");
  });
  it("mảng rỗng tính là thiếu, mảng có phần tử là đủ", () => {
    expect(findMissingRequired([{ key: "m", label: "M", required: true }], { m: [] })).toBe("M");
    expect(
      findMissingRequired([{ key: "m", label: "M", required: true }], { m: ["x"] }),
    ).toBeNull();
  });
  it("bỏ qua trường không bắt buộc dù rỗng", () => {
    expect(findMissingRequired([{ key: "b", label: "B", required: false }], {})).toBeNull();
  });
});

// ============================================================================
// #2 — Lưu tạo submission + liên kết bao_tri
// ============================================================================
describe("buildSubmissionInsert", () => {
  it("dựng bản khai form gắn hệ thống và tiêu đề ghép", () => {
    const s = buildSubmissionInsert({
      template: MATCHED,
      heThongId: "ht1",
      heThongTen: "Đài VHF Sơn Trà",
      userId: "u1",
      values: { tinh_trang: "Tốt" },
      submittedAt: "2026-07-13T00:00:00.000Z",
    });
    expect(s).toEqual({
      template_id: "t1",
      template_code: "BD-VHF",
      template_version: 2,
      template_snapshot: {
        template: {
          id: "t1",
          code: "BD-VHF",
          ten: "Phiếu BD VHF",
          version: 2,
          require_signature: false,
          thiet_bi_mode: "none",
        },
        fields: [],
      },
      he_thong_id: "ht1",
      created_by: "u1",
      status: "submitted",
      submitted_at: "2026-07-13T00:00:00.000Z",
      tieu_de: "Phiếu BD VHF — Đài VHF Sơn Trà",
      data: { tinh_trang: "Tốt" },
    });
  });

  it("ghim snapshot cấu trúc field vào phiếu để bảo vệ lịch sử", () => {
    const s = buildSubmissionInsert({
      template: MATCHED,
      heThongId: "ht1",
      heThongTen: "Đài VHF Sơn Trà",
      userId: "u1",
      values: {},
      submittedAt: "2026-07-13T00:00:00.000Z",
      fields: [
        {
          key: "tinh_trang",
          label: "Tình trạng",
          kind: "select",
          options: ["Tốt", "Xấu"],
          required: true,
          position: 0,
        },
        { key: "ghi_chu", label: "Ghi chú", position: 1 },
      ],
    });
    expect(s.template_snapshot.fields.map((f) => f.key)).toEqual(["tinh_trang", "ghi_chu"]);
    expect(s.template_snapshot.fields[0].options).toEqual(["Tốt", "Xấu"]);
    expect(s.template_snapshot.fields[0].label).toBe("Tình trạng");
  });
});

describe("buildBaoTriRows — mỗi tài sản 1 phiếu, liên kết submission", () => {
  const devices: SubmissionDeviceLite[] = [
    { id: "d1", ma_thiet_bi: "TB-001", ten: "Máy VHF 1", don_vi: "ĐV A" },
    { id: "d2", ma_thiet_bi: "TB-002", ten: "Máy VHF 2", don_vi: null },
  ];
  const base = {
    submissionId: "sub1",
    devices,
    template: MATCHED,
    heThongId: "ht1",
    heThongTen: "Đài VHF",
    userId: "u1",
    loaiBaoTri: "Định kỳ",
    trangThai: "Hoàn thành",
    ngayBatDau: "2026-07-01",
    ngayHoanThanh: "2026-07-02",
    ketQua: "Đạt",
    nguoiThucHien: "Nam, Bình ,  ",
    donViThucHien: "Phòng KT",
    maBase: "BD-TEST",
  };

  it("tạo đúng số dòng, mã tăng dần, liên kết submission", () => {
    const rows = buildBaoTriRows(base);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.ma_bao_tri)).toEqual(["BD-TEST-01", "BD-TEST-02"]);
    expect(rows.every((r) => r.form_submission_id === "sub1")).toBe(true);
    expect(rows.every((r) => r.mo_ta_cong_viec === "Phiếu BD VHF")).toBe(true);
  });

  it("map tài sản, hệ thống, đơn vị đúng theo từng tài sản", () => {
    const rows = buildBaoTriRows(base);
    expect(rows[0]).toMatchObject({
      thiet_bi: "TB-001",
      thiet_bi_id: "d1",
      he_thong: "Đài VHF",
      he_thong_id: "ht1",
      don_vi: "ĐV A",
    });
    expect(rows[1].don_vi).toBeNull();
  });

  it("tách người thực hiện theo dấu phẩy, bỏ khoảng trắng và phần rỗng", () => {
    const rows = buildBaoTriRows(base);
    expect(rows[0].nguoi_thuc_hien).toEqual(["Nam", "Bình"]);
  });

  it("ngày hoàn thành / kết quả rỗng chuyển thành null", () => {
    const rows = buildBaoTriRows({ ...base, ngayHoanThanh: null, ketQua: null });
    expect(rows[0].ngay_hoan_thanh).toBeNull();
    expect(rows[0].ket_qua).toBeNull();
  });
});

// ============================================================================
// #3 — Mẫu phẳng cũ vẫn render / xuất Word
// ============================================================================
describe("fmtFieldValue — định dạng giá trị cho biên bản Word", () => {
  it("null/undefined -> rỗng", () => {
    expect(fmtFieldValue(null)).toBe("");
    expect(fmtFieldValue(undefined)).toBe("");
  });
  it("mảng nối bằng dấu phẩy", () => {
    expect(fmtFieldValue(["A", "B"])).toBe("A, B");
  });
  it("boolean -> Có/Không", () => {
    expect(fmtFieldValue(true)).toBe("Có");
    expect(fmtFieldValue(false)).toBe("Không");
  });
  it("object -> JSON, số/chuỗi -> String", () => {
    expect(fmtFieldValue({ x: 1 })).toBe('{"x":1}');
    expect(fmtFieldValue(42)).toBe("42");
    expect(fmtFieldValue("abc")).toBe("abc");
  });
});

describe("buildContentPairs — nhãn/giá trị theo thứ tự field của mẫu", () => {
  const fields = [
    { key: "tinh_trang", label: "Tình trạng" },
    { key: "hang_muc", label: "Hạng mục" },
    { key: "ghi_chu", label: "Ghi chú" },
  ];
  it("giữ đúng thứ tự và map giá trị", () => {
    const pairs = buildContentPairs(fields, { tinh_trang: "Tốt", hang_muc: ["Vệ sinh", "Đo"] });
    expect(pairs).toEqual([
      { label: "Tình trạng", value: "Tốt" },
      { label: "Hạng mục", value: "Vệ sinh, Đo" },
      { label: "Ghi chú", value: "" },
    ]);
  });
  it("data null trả tất cả giá trị rỗng", () => {
    expect(buildContentPairs(fields, null).every((p) => p.value === "")).toBe(true);
  });
});
