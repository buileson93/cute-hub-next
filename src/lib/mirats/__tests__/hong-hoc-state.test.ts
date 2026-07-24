import { describe, it, expect } from "vitest";
import {
  HONG_HOC_STATES,
  canManageHongHoc,
  canCompleteHongHoc,
  isHongHocOpen,
  isHongHocClosed,
} from "@/lib/mirats/hong-hoc-state";
import type { AppRole } from "@/hooks/use-session";

describe("hong-hoc-state — hằng số trạng thái", () => {
  it("có đủ 4 mã theo hợp đồng", () => {
    expect(HONG_HOC_STATES).toEqual(["moi", "dang_xu_ly", "hoan_thanh", "huy"]);
  });
  it("hoan_thanh/huy là đóng, còn lại đang mở", () => {
    expect(isHongHocClosed("hoan_thanh")).toBe(true);
    expect(isHongHocClosed("huy")).toBe(true);
    expect(isHongHocOpen("moi")).toBe(true);
    expect(isHongHocOpen("dang_xu_ly")).toBe(true);
    // nhãn VN vẫn phân loại đúng nhờ normalizeLegacy
    expect(isHongHocClosed("Hoàn thành")).toBe(true);
    expect(isHongHocOpen("Đang xử lý")).toBe(true);
  });
});

describe("canManageHongHoc", () => {
  const cases: Array<[AppRole[], boolean]> = [
    [["admin"], true],
    [["phong_kt"], true],
    [["ktv"], true],
    [["phu_trach_dv"], false],
    [[], false],
  ];
  it.each(cases)("roles=%j → %s", (roles, expected) => {
    expect(canManageHongHoc(roles)).toBe(expected);
  });
});

describe("canCompleteHongHoc — quy tắc hoàn thành theo phương án", () => {
  it("thay_the yêu cầu thiet_bi_thay_the_id != null", () => {
    expect(canCompleteHongHoc({ phuong_an: "thay_the", thiet_bi_thay_the_id: null })).toBe(false);
    expect(canCompleteHongHoc({ phuong_an: "thay_the", thiet_bi_thay_the_id: "TB_1" })).toBe(true);
  });
  it("nhãn VN 'Thay thế' cũng được chuẩn hoá", () => {
    expect(canCompleteHongHoc({ phuong_an: "Thay thế", thiet_bi_thay_the_id: null })).toBe(false);
    expect(canCompleteHongHoc({ phuong_an: "Thay thế", thiet_bi_thay_the_id: "TB_2" })).toBe(true);
  });
  it("sua_chua / thanh_ly không cần tài sản thay thế", () => {
    expect(canCompleteHongHoc({ phuong_an: "sua_chua", thiet_bi_thay_the_id: null })).toBe(true);
    expect(canCompleteHongHoc({ phuong_an: "Sửa chữa", thiet_bi_thay_the_id: null })).toBe(true);
    expect(canCompleteHongHoc({ phuong_an: "thanh_ly", thiet_bi_thay_the_id: null })).toBe(true);
  });
  it("phương án trống không hoàn thành được", () => {
    expect(canCompleteHongHoc({ phuong_an: "", thiet_bi_thay_the_id: null })).toBe(false);
  });
});
