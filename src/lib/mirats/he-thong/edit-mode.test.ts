import { describe, it, expect } from "vitest";
import {
  resolveEditMode,
  guardMutation,
  LY_DO_KHONG_QUYEN,
  LY_DO_CHUA_BAT_EDIT,
} from "./edit-mode";

describe("he-thong edit mode", () => {
  it("mặc định là view mode", () => {
    expect(resolveEditMode(true, false)).toBe(false);
  });

  it("không có quyền thì không bao giờ vào được edit mode", () => {
    expect(resolveEditMode(false, true)).toBe(false);
  });

  it("có quyền + bật thì vào edit mode", () => {
    expect(resolveEditMode(true, true)).toBe(true);
  });

  it("chặn mutation khi thiếu quyền", () => {
    expect(guardMutation(false, true)).toEqual({ ok: false, lyDo: LY_DO_KHONG_QUYEN });
  });

  it("chặn mutation khi đang ở view mode", () => {
    expect(guardMutation(true, false)).toEqual({ ok: false, lyDo: LY_DO_CHUA_BAT_EDIT });
  });

  it("cho phép mutation khi đủ quyền và đang edit", () => {
    expect(guardMutation(true, true)).toEqual({ ok: true });
  });
});
