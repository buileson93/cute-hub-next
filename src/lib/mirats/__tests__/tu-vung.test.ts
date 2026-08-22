import { describe, it, expect } from "vitest";
import { NHAN, KHAI_NIEM, nhanTao, nhanSua, nhanXoa } from "@/lib/mirats/tu-vung";

describe("tu-vung: NHAN & KHAI_NIEM", () => {
  it("nhãn hành động cốt lõi khớp yêu cầu Task 26", () => {
    expect(NHAN.tao).toBe("Thêm mới");
    expect(NHAN.sua).toBe("Sửa");
    expect(NHAN.xoa).toBe("Xoá");
    expect(NHAN.hoanThanh).toBe("Hoàn thành");
    expect(NHAN.dong).toBe("Đóng hồ sơ");
    expect(NHAN.chiTietDoc).toBe("Chỉ tra cứu");
  });

  it("khái niệm nghiệp vụ có đủ các nhóm chính", () => {
    const keys = Object.keys(KHAI_NIEM);
    for (const k of [
      "thiet_bi",
      "thanh_phan",
      "su_co",
      "van_de",
      "cong_viec",
      "bien_ban",
      "ban_giao",
      "giay_phep",
    ]) {
      expect(keys).toContain(k);
    }
  });

  it("tiêu đề tổ hợp dùng viết thường cho danh từ", () => {
    expect(nhanTao("thiet_bi")).toBe("Thêm mới tài sản");
    expect(nhanSua("su_co")).toBe("Sửa sự cố");
    expect(nhanXoa("giay_phep")).toBe("Xoá giấy phép");
  });
});
