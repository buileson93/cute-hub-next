// Test THUẦN: từ hạng mục KHÔNG ĐẠT quyết định & dựng dữ liệu tạo sự cố.
// Idempotent guard (su_co_id) và tách "hành động xác nhận riêng".
import { describe, it, expect } from "vitest";
import {
  isActionableFail,
  alreadyHasIncident,
  canCreateIncident,
  buildSuCoDraft,
  type FailItemResult,
} from "../fail-action";

const item = (p: Partial<FailItemResult> & { id: string }): FailItemResult => ({
  id: p.id,
  submission_id: p.submission_id ?? "sub",
  item_code: p.item_code ?? "IT1",
  ten: p.ten ?? "Điện áp acquy",
  ket_qua: p.ket_qua ?? null,
  gia_tri_so: p.gia_tri_so ?? null,
  don_vi: p.don_vi ?? null,
  tieu_chuan: p.tieu_chuan ?? null,
  ghi_chu: p.ghi_chu ?? null,
  hanh_dong: p.hanh_dong ?? null,
  su_co_id: p.su_co_id ?? null,
});

describe("isActionableFail", () => {
  it("không đạt + có hành động ⇒ actionable", () => {
    expect(isActionableFail(item({ id: "1", ket_qua: "khong_dat", hanh_dong: "Thay acquy" }))).toBe(
      true,
    );
  });
  it("đạt ⇒ không actionable", () => {
    expect(isActionableFail(item({ id: "1", ket_qua: "dat", hanh_dong: "x" }))).toBe(false);
  });
  it("không đạt nhưng thiếu hành động ⇒ không actionable", () => {
    expect(isActionableFail(item({ id: "1", ket_qua: "khong_dat", hanh_dong: "  " }))).toBe(false);
  });
});

describe("idempotent guard", () => {
  it("đã có su_co_id ⇒ alreadyHasIncident", () => {
    expect(alreadyHasIncident(item({ id: "1", su_co_id: "SC1" }))).toBe(true);
    expect(alreadyHasIncident(item({ id: "1" }))).toBe(false);
  });
  it("canCreateIncident chỉ khi actionable & chưa tạo", () => {
    expect(canCreateIncident(item({ id: "1", ket_qua: "khong_dat", hanh_dong: "Thay" }))).toBe(
      true,
    );
    expect(
      canCreateIncident(
        item({ id: "1", ket_qua: "khong_dat", hanh_dong: "Thay", su_co_id: "SC1" }),
      ),
    ).toBe(false);
    expect(canCreateIncident(item({ id: "1", ket_qua: "dat" }))).toBe(false);
  });
});

describe("buildSuCoDraft", () => {
  it("gộp tên + giá trị đo + tiêu chuẩn + ghi chú vào hiện tượng", () => {
    const d = buildSuCoDraft(
      item({
        id: "1",
        ten: "Điện áp acquy",
        ket_qua: "khong_dat",
        gia_tri_so: 10.5,
        don_vi: "V",
        tieu_chuan: "≥ 12V",
        ghi_chu: "sụt áp",
        hanh_dong: "Thay acquy",
      }),
      {
        thiet_bi_id: "TB1",
        he_thong_id: "HT1",
        he_thong: "UPS",
        thiet_bi: "TB-01",
        don_vi: "CRA",
        ngay: "2026-06-01",
      },
    );
    expect(d.hien_tuong).toContain("Điện áp acquy");
    expect(d.hien_tuong).toContain("10.5 V");
    expect(d.hien_tuong).toContain("≥ 12V");
    expect(d.hien_tuong).toContain("sụt áp");
    expect(d.bien_phap_xu_ly).toBe("Thay acquy");
    expect(d.thiet_bi_id).toBe("TB1");
    expect(d.he_thong_id).toBe("HT1");
    expect(d.don_vi).toBe("CRA");
    expect(d.ngay_phat_hien).toBe("2026-06-01");
    expect(d.trang_thai).toBe("Mới");
  });

  it("giá trị số 0 vẫn hiển thị (không bị bỏ vì falsy)", () => {
    const d = buildSuCoDraft(
      item({ id: "1", gia_tri_so: 0, don_vi: "V", hanh_dong: "x", ket_qua: "khong_dat" }),
      {},
    );
    expect(d.hien_tuong).toContain("0 V");
  });
});
