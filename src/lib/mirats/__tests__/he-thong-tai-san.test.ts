import { describe, expect, it } from "vitest";
import {
  demTaiSanTheoHeThong,
  locHeThongCoTheXoa,
  sinhMaHeThong,
  taiSanCuaHeThong,
  ungVienGanVaoHeThong,
  type TaiSanRef,
} from "@/lib/mirats/he-thong-tai-san";

const rows: TaiSanRef[] = [
  { id: "1", ma: "TSHT001", ten: "Máy phát điện", heThongId: "ht1" },
  { id: "2", ma: "TSHT002", ten: "Bộ lưu điện", heThongId: "ht1" },
  { id: "3", ma: "TSHT003", ten: "Ăng-ten VHF", heThongId: "ht2" },
  { id: "4", ma: "TSHT004", ten: "Tủ nguồn dự phòng", heThongId: null },
];

describe("quan hệ tài sản ↔ hệ thống", () => {
  it("đếm đúng số tài sản theo hệ thống", () => {
    const m = demTaiSanTheoHeThong(rows);
    expect(m.get("ht1")).toBe(2);
    expect(m.get("ht2")).toBe(1);
    expect(m.get("ht3")).toBeUndefined();
  });

  it("lọc tài sản đang thuộc hệ thống theo từ khoá không dấu", () => {
    expect(taiSanCuaHeThong(rows, "ht1").map((r) => r.ma)).toEqual(["TSHT001", "TSHT002"]);
    expect(taiSanCuaHeThong(rows, "ht1", "luu dien").map((r) => r.ma)).toEqual(["TSHT002"]);
  });

  it("ứng viên loại tài sản đã thuộc hệ thống và ưu tiên tài sản độc lập", () => {
    const out = ungVienGanVaoHeThong(rows, "ht1", "TSHT");
    expect(out.map((r) => r.ma)).toEqual(["TSHT004", "TSHT003"]);
  });

  it("sinh mã hệ thống duy nhất, tránh trùng", () => {
    expect(sinhMaHeThong("NAV", "Đài dẫn đường", [])).toBe("NAV_DAI_DAN_DUONG");
    expect(sinhMaHeThong("NAV", "Đài dẫn đường", ["NAV_DAI_DAN_DUONG"])).toBe(
      "NAV_DAI_DAN_DUONG_2",
    );
  });
});

describe("chốt chặn xoá hệ thống", () => {
  const list = [{ id: "a" }, { id: "b" }, { id: "c" }];
  it("chặn hệ thống còn tài sản, cho xoá phần còn lại", () => {
    const kq = locHeThongCoTheXoa(list, new Set(["b"]));
    expect(kq.removable.map((r) => r.id)).toEqual(["a", "c"]);
    expect(kq.blocked).toBe(1);
  });
  it("chặn toàn bộ khi mọi hệ thống đều còn tài sản", () => {
    expect(locHeThongCoTheXoa(list, new Set(["a", "b", "c"])).removable).toHaveLength(0);
  });
});
