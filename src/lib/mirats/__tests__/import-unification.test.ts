// Test chốt: mọi cột XUẤT MẪU phải tồn tại trong import-config.ts (nguồn sự
// thật duy nhất). Nếu ai đó thêm cột vào bảng/mẫu mà quên khai trong
// import-config, test này sẽ đỏ → không thể lệch giữa Xuất và Nhập hàng loạt.

import { describe, it, expect } from "vitest";
import { entityById, fieldKeySet } from "@/lib/mirats/import-config";
import {
  TABLE_COLS,
  DEVICE_EXPORT_FIXED_HEADERS,
  deviceExportHeaderKeys,
} from "@/lib/mirats/thiet-bi-columns";
import { FIELD_NOTES } from "@/lib/mirats/export-template";

const tbKeys = fieldKeySet(entityById("thiet_bi"));

describe("Hợp nhất Nhập/Xuất — tài sản bám import-config", () => {
  it("mọi `imp` của TABLE_COLS là một trường hợp lệ của entity thiet_bi", () => {
    const bad = TABLE_COLS.filter((c) => c.imp && !tbKeys.has(c.imp)).map((c) => c.imp);
    expect(bad, `Cột xuất không có trong import-config: ${bad.join(", ")}`).toEqual([]);
  });

  it("header cố định của model đều tồn tại trong import-config", () => {
    const bad = DEVICE_EXPORT_FIXED_HEADERS.filter((h) => !tbKeys.has(h));
    expect(bad, `Header cố định thiếu: ${bad.join(", ")}`).toEqual([]);
  });

  it("toàn bộ header xuất mẫu (cố định + imp) đều hợp lệ", () => {
    const bad = deviceExportHeaderKeys().filter((h) => !tbKeys.has(h));
    expect(bad, `Header xuất mẫu không hợp lệ: ${bad.join(", ")}`).toEqual([]);
  });

  it("mọi ghi chú FIELD_NOTES gắn với một trường có thật (không lệch tên)", () => {
    const bad = Object.keys(FIELD_NOTES).filter((k) => !tbKeys.has(k));
    expect(bad, `FIELD_NOTES trỏ tới trường không tồn tại: ${bad.join(", ")}`).toEqual([]);
  });
});
