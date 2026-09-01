import { describe, it, expect } from "vitest";
import {
  WIDGET_GROUPS,
  WIDGET_GROUP_LABEL,
  normalizeWidgetGroup,
} from "./widget-registry";

describe("widget groups", () => {
  it("có nhãn cho mọi nhóm và tab mặc định là Tổng quan", () => {
    expect(WIDGET_GROUPS[0]).toBe("tong-quan");
    for (const g of WIDGET_GROUPS) expect(WIDGET_GROUP_LABEL[g]).toBeTruthy();
  });

  it("chuẩn hóa giá trị tab không hợp lệ về nhóm đầu tiên", () => {
    expect(normalizeWidgetGroup("cong-viec")).toBe("cong-viec");
    expect(normalizeWidgetGroup("khong-ton-tai")).toBe("tong-quan");
    expect(normalizeWidgetGroup(undefined)).toBe("tong-quan");
  });
});
