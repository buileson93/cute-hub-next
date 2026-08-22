import { describe, it, expect, vi } from "vitest";
import { TYPO_STATUS, LEGACY_NAME_TO_MA, getStatusToken, getWarningCount } from "../status-tokens";

describe("Hệ thống Trạng thái (Status System)", () => {
  it("mỗi token phải có đủ 3 kênh: color, icon, label", () => {
    Object.values(TYPO_STATUS).forEach((token) => {
      expect(token).toHaveProperty("color");
      expect(token).toHaveProperty("icon");
      expect(token).toHaveProperty("label");
      // Không được dùng màu palette Tailwind cứng
      expect(token.color).not.toMatch(/bg-(emerald|red|blue|amber|slate|orange|sky|violet)-/);
    });
  });

  it("không còn tên màu palette nào trong file token (quét chuỗi)", () => {
    // Các màu semantic hợp lệ trong Astryx skins
    const validSemanticPrefixes = [
      "astryx-status-",
      "bg-success",
      "bg-warning",
      "bg-info",
      "bg-destructive",
      "bg-muted",
    ];
    Object.values(TYPO_STATUS).forEach((token: any) => {
      const hasSemanticColor = validSemanticPrefixes.some((p) => token.color.includes(p));
      expect(hasSemanticColor).toBe(true);
    });
  });

  it("mã lạ làm tăng bộ đệm cảnh báo", () => {
    const initialCount = getWarningCount();
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    getStatusToken("thiet_bi", "MA_KHONG_TON_TAI");

    expect(getWarningCount()).toBe(initialCount + 1);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("tra cứu bằng mã và bằng tên legacy cho ra cùng kết quả", () => {
    // Ví dụ với thiết bị
    const tokenByMa = getStatusToken("thiet_bi", "DANG_KHAI_THAC");
    const legacyName = Object.keys(LEGACY_NAME_TO_MA).find(
      (key) => LEGACY_NAME_TO_MA[key] === "DANG_KHAI_THAC",
    );

    if (legacyName) {
      const tokenByName = getStatusToken("thiet_bi", legacyName);
      expect(tokenByName).toEqual(tokenByMa);
    }
  });
});
