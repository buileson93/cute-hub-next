// @vitest-environment jsdom
// Task 30 — Tests cho useDetailPanel + pure logic.
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  parseDetail, serializeDetail, useDetailPanel, type UrlAdapter,
} from "@/lib/mirats/ui/detail-panel";

function mockAdapter(initial: Record<string, string> = {}): UrlAdapter & {
  values: Record<string, string | null>;
} {
  const values: Record<string, string | null> = { ...initial };
  const listeners = new Set<() => void>();
  return {
    values,
    get: (p) => values[p] ?? null,
    set: (p, v) => {
      values[p] = v;
      listeners.forEach((cb) => cb());
    },
    subscribe: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}

describe("parseDetail / serializeDetail", () => {
  it("parse hợp lệ", () => {
    expect(parseDetail("thiet_bi:TB_123")).toEqual({
      loai: "thiet_bi", moId: "TB_123",
    });
  });
  it("parse rỗng / invalid → null", () => {
    expect(parseDetail(null)).toEqual({ loai: null, moId: null });
    expect(parseDetail("")).toEqual({ loai: null, moId: null });
    expect(parseDetail("khongco")).toEqual({ loai: null, moId: null });
    expect(parseDetail(":abc")).toEqual({ loai: null, moId: null });
    expect(parseDetail("abc:")).toEqual({ loai: null, moId: null });
  });
  it("serialize", () => {
    expect(serializeDetail("su_co", "SC_1")).toBe("su_co:SC_1");
    expect(serializeDetail(null, "x")).toBeNull();
    expect(serializeDetail("thiet_bi", null)).toBeNull();
  });
  it("id chứa dấu ':' vẫn parse phần đầu làm loai", () => {
    // Chỉ chia tại dấu ':' đầu tiên.
    expect(parseDetail("thiet_bi:TB:xyz")).toEqual({
      loai: "thiet_bi", moId: "TB:xyz",
    });
  });
});

describe("useDetailPanel", () => {
  it("khởi tạo từ URL param", () => {
    const adp = mockAdapter({ xem: "thiet_bi:TB_A" });
    const { result } = renderHook(() => useDetailPanel("xem", adp));
    expect(result.current.loai).toBe("thiet_bi");
    expect(result.current.moId).toBe("TB_A");
  });

  it("open cập nhật state + URL", () => {
    const adp = mockAdapter();
    const { result } = renderHook(() => useDetailPanel("xem", adp));
    expect(result.current.moId).toBeNull();

    act(() => result.current.open("su_co", "SC_9"));
    expect(result.current.loai).toBe("su_co");
    expect(result.current.moId).toBe("SC_9");
    expect(adp.values.xem).toBe("su_co:SC_9");
  });

  it("close xoá state + URL", () => {
    const adp = mockAdapter({ xem: "vat_tu:VT_1" });
    const { result } = renderHook(() => useDetailPanel("xem", adp));
    expect(result.current.moId).toBe("VT_1");

    act(() => result.current.close());
    expect(result.current.loai).toBeNull();
    expect(result.current.moId).toBeNull();
    expect(adp.values.xem).toBeNull();
  });

  it("thay đổi URL ngoài (share link) → cập nhật state qua subscribe", () => {
    const adp = mockAdapter();
    const { result } = renderHook(() => useDetailPanel("xem", adp));
    act(() => adp.set("xem", "thiet_bi:TB_X"));
    expect(result.current.loai).toBe("thiet_bi");
    expect(result.current.moId).toBe("TB_X");
  });

  it("param tuỳ biến", () => {
    const adp = mockAdapter({ chitiet: "giay_phep:GP_1" });
    const { result } = renderHook(() => useDetailPanel("chitiet", adp));
    expect(result.current.moId).toBe("GP_1");
  });
});
