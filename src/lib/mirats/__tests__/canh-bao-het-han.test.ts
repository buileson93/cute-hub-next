import { describe, it, expect } from "vitest";
import {
  VN_TZ,
  NGUONG_CANH_BAO,
  ngayTheoMuiGio,
  soNgayConLai,
  nguongCho,
  khoaChongTrung,
  locCanhBao,
  type CanhBaoInput,
} from "../canh-bao-het-han";

describe("ngayTheoMuiGio — phần ngày theo Asia/Ho_Chi_Minh (UTC+7)", () => {
  it("22:00Z (23-06) rơi sang 05:00 ngày 24-06 giờ VN", () => {
    expect(ngayTheoMuiGio("2026-06-23T22:00:00.000Z")).toBe("2026-06-24");
  });

  it("16:59Z vẫn là cùng ngày VN (23:59), 17:00Z sang ngày kế", () => {
    expect(ngayTheoMuiGio("2026-06-23T16:59:00.000Z")).toBe("2026-06-23");
    expect(ngayTheoMuiGio("2026-06-23T17:00:00.000Z")).toBe("2026-06-24");
  });

  it("nhận Date object và ném lỗi với chuỗi sai", () => {
    expect(ngayTheoMuiGio(new Date("2026-01-01T00:00:00.000Z"))).toBe("2026-01-01");
    expect(() => ngayTheoMuiGio("khong-phai-ngay")).toThrow();
  });
});

describe("soNgayConLai — chênh lệch ngày lịch theo giờ VN", () => {
  it("cùng ngày VN → 0 dù lệch giờ UTC", () => {
    // now = 23:30 giờ VN ngày 20-07 (tức 16:30Z), hạn 20-07 → 0 ngày
    expect(soNgayConLai("2026-07-20", "2026-07-20T16:30:00.000Z")).toBe(0);
  });

  it("biên qua nửa đêm VN: 17:00Z là 00:00 ngày kế", () => {
    // 17:00Z ngày 19-07 = 00:00 ngày 20-07 giờ VN; hạn 20-07 → 0 ngày
    expect(soNgayConLai("2026-07-20", "2026-07-19T17:00:00.000Z")).toBe(0);
    // 16:59Z ngày 19-07 = 23:59 ngày 19-07 giờ VN; hạn 20-07 → 1 ngày
    expect(soNgayConLai("2026-07-20", "2026-07-19T16:59:00.000Z")).toBe(1);
  });

  it("hạn đã qua → số âm", () => {
    expect(soNgayConLai("2026-07-10", "2026-07-20T03:00:00.000Z")).toBe(-10);
  });
});

describe("nguongCho — xếp ngày còn lại vào ngưỡng 30/60/90", () => {
  it("các biên chính xác", () => {
    expect(nguongCho(0)).toBe(30);
    expect(nguongCho(30)).toBe(30);
    expect(nguongCho(31)).toBe(60);
    expect(nguongCho(60)).toBe(60);
    expect(nguongCho(61)).toBe(90);
    expect(nguongCho(90)).toBe(90);
  });

  it("ngoài phạm vi → null", () => {
    expect(nguongCho(91)).toBeNull();
    expect(nguongCho(-1)).toBeNull();
  });

  it("chỉ có 3 ngưỡng, tăng dần", () => {
    expect([...NGUONG_CANH_BAO]).toEqual([30, 60, 90]);
  });
});

describe("khoaChongTrung — khoá chống notification trùng", () => {
  it("cùng mục + cùng ngưỡng → cùng khoá (job chạy lại không tạo trùng)", () => {
    const a = khoaChongTrung("bao_hanh", "tb-1", "2026-08-01", 30);
    const b = khoaChongTrung("bao_hanh", "tb-1", "2026-08-01T00:00:00Z", 30);
    expect(a).toBe(b);
  });

  it("khác ngưỡng → khác khoá (escalation 90→60→30)", () => {
    expect(khoaChongTrung("bao_hanh", "tb-1", "2026-08-01", 60)).not.toBe(
      khoaChongTrung("bao_hanh", "tb-1", "2026-08-01", 30),
    );
  });

  it("thiet_bi_id null vẫn tạo khoá ổn định", () => {
    expect(khoaChongTrung("giay_phep", null, "2026-08-01", 90)).toBe(
      "giay_phep|-|2026-08-01|90",
    );
  });
});

describe("locCanhBao — chọn mục cần báo + gán ngưỡng, khử trùng theo khoá", () => {
  const rows: CanhBaoInput[] = [
    { loai: "bao_hanh", thiet_bi_id: "tb-1", ten: "Máy A", ngay_het_han: "2026-07-25" }, // 5 ngày → 30
    { loai: "giay_phep", thiet_bi_id: "tb-2", ten: "GP B", ngay_het_han: "2026-09-10" }, // 52 → 60
    { loai: "bao_hanh", thiet_bi_id: "tb-3", ten: "Máy C", ngay_het_han: "2027-01-01" }, // xa → null (bỏ)
    { loai: "giay_phep", thiet_bi_id: "tb-4", ten: "GP D", ngay_het_han: "2026-07-01" }, // quá hạn → bỏ
  ];
  const now = "2026-07-20T03:00:00.000Z"; // 20-07 giờ VN

  it("chỉ giữ mục trong ngưỡng và gán đúng ngưỡng", () => {
    const out = locCanhBao(rows, { now });
    expect(out.map((r) => [r.thiet_bi_id, r.nguong, r.so_ngay_con_lai])).toEqual([
      ["tb-1", 30, 5],
      ["tb-2", 60, 52],
    ]);
  });

  it("khử trùng khi có sẵn khoá đã báo", () => {
    const daBao = new Set([khoaChongTrung("bao_hanh", "tb-1", "2026-07-25", 30)]);
    const out = locCanhBao(rows, { now, daBao });
    expect(out.map((r) => r.thiet_bi_id)).toEqual(["tb-2"]);
  });

  it("idempotent: chạy 2 lần liên tiếp với cùng dữ liệu → lần 2 không sinh mục nào", () => {
    // Task 40 — mô phỏng job cron chạy 2 lần trong cùng ngày:
    // sau lần 1, mọi khoá đã báo được ghi vào `daBao`; lần 2 phải rỗng.
    const lan1 = locCanhBao(rows, { now });
    expect(lan1.length).toBeGreaterThan(0);
    const daBao = new Set(lan1.map((r) => r.khoa));
    const lan2 = locCanhBao(rows, { now, daBao });
    expect(lan2).toEqual([]);
  });

  it("cùng tài sản + cùng ngưỡng trong cùng kỳ → chỉ một khoá (khoaChongTrung)", () => {
    const trung: CanhBaoInput[] = [
      { loai: "bao_hanh", thiet_bi_id: "tb-x", ten: "X", ngay_het_han: "2026-07-25" },
      { loai: "bao_hanh", thiet_bi_id: "tb-x", ten: "X", ngay_het_han: "2026-07-25" },
    ];
    const out = locCanhBao(trung, { now });
    const uniqKhoa = new Set(out.map((r) => r.khoa));
    expect(uniqKhoa.size).toBe(1);
    expect(locCanhBao(trung, { now, daBao: uniqKhoa }).length).toBe(0);
  });

  it("VN_TZ là Asia/Ho_Chi_Minh", () => {
    expect(VN_TZ).toBe("Asia/Ho_Chi_Minh");
  });
});
