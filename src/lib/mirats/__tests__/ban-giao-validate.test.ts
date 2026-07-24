import { describe, it, expect } from "vitest";
import { detectHoldingConflict } from "../ban-giao-validate";

describe("detectHoldingConflict", () => {
  const dangLap = [
    { thiet_bi_id: "TB_ABC", ten_vi_tri: "TPHT_VOR/DVOR-01", nguoi_giu: "Nguyen A" },
    { thiet_bi_id: "TB_XYZ", ten_vi_tri: "TPHT_UHF-02" },
  ];

  it("trả null khi tài sản không đang lắp", () => {
    expect(
      detectHoldingConflict(
        { thiet_bi_id: "TB_NEW", ngay_nhan: "2026-07-14" },
        dangLap,
      ),
    ).toBeNull();
  });

  it("phát hiện xung đột khi tài sản đang lắp tại vị trí chức năng", () => {
    const c = detectHoldingConflict(
      { thiet_bi_id: "TB_ABC", ngay_nhan: "2026-07-14" },
      dangLap,
    );
    expect(c).not.toBeNull();
    expect(c!.viTri).toBe("TPHT_VOR/DVOR-01");
    expect(c!.nguoiGiu).toBe("Nguyen A");
  });

  it("bỏ qua đối soát khi is_return = true (phiếu Thu hồi)", () => {
    expect(
      detectHoldingConflict(
        { thiet_bi_id: "TB_ABC", ngay_nhan: "2026-07-14", is_return: true },
        dangLap,
      ),
    ).toBeNull();
  });

  it("chuẩn hoá nguoiGiu = '' khi không có dữ liệu người giữ", () => {
    const c = detectHoldingConflict(
      { thiet_bi_id: "TB_XYZ", ngay_nhan: "2026-07-14" },
      dangLap,
    );
    expect(c).not.toBeNull();
    expect(c!.nguoiGiu).toBe("");
  });

  it("trả null với thiet_bi_id rỗng", () => {
    expect(
      detectHoldingConflict({ thiet_bi_id: "", ngay_nhan: "2026-07-14" }, dangLap),
    ).toBeNull();
  });
});
