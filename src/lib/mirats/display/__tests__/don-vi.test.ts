import { describe, it, expect } from "vitest";
import {
  donViLabel,
  donViLabelDayDu,
  laMaKyThuat,
  DON_VI_FALLBACK,
} from "@/lib/mirats/display/don-vi";

const DS = [{ id: "8b408897-b25d-4ece-91ba-d97dfacec283", ma: "PLK", ten: "Đài KSKL Pleiku" }];

describe("hiển thị Đơn vị quản lý", () => {
  it("nhận diện UUID là mã kỹ thuật", () => {
    expect(laMaKyThuat("8b408897-b25d-4ece-91ba-d97dfacec283")).toBe(true);
    expect(laMaKyThuat("PLK")).toBe(false);
    expect(laMaKyThuat("")).toBe(false);
  });

  it("đổi UUID thành tên đơn vị", () => {
    expect(donViLabel("8b408897-b25d-4ece-91ba-d97dfacec283", DS)).toBe("Đài KSKL Pleiku");
    expect(donViLabel("PLK", DS)).toBe("Đài KSKL Pleiku");
    expect(donViLabelDayDu("8b408897-b25d-4ece-91ba-d97dfacec283", DS)).toBe(
      "PLK — Đài KSKL Pleiku",
    );
  });

  it("không bao giờ render UUID khi thiếu dữ liệu liên quan", () => {
    expect(donViLabel("8b408897-b25d-4ece-91ba-d97dfacec283", [])).toBe(DON_VI_FALLBACK);
    expect(donViLabel("11111111-2222-3333-4444-555555555555", undefined)).toBe(DON_VI_FALLBACK);
    expect(donViLabelDayDu(undefined, DS, "Đơn vị không còn tồn tại")).toBe(
      "Đơn vị không còn tồn tại",
    );
  });

  it("giữ mã nghiệp vụ khi chưa nạp được danh mục", () => {
    expect(donViLabel("PLK", undefined)).toBe("PLK");
  });
});
