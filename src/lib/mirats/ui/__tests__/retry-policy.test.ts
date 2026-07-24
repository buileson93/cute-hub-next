import { describe, it, expect } from "vitest";
import { nenRetry, tinhTreRetry, docMaHttp, laLoiMang } from "../retry-policy";

describe("retry-policy", () => {
  it("không retry lỗi 4xx", () => {
    expect(nenRetry(0, { status: 400 })).toBe(false);
    expect(nenRetry(0, { status: 401 })).toBe(false);
    expect(nenRetry(0, { status: 403 })).toBe(false);
    expect(nenRetry(0, { status: 404 })).toBe(false);
  });

  it("retry lỗi 5xx đến giới hạn", () => {
    expect(nenRetry(0, { status: 500 })).toBe(true);
    expect(nenRetry(2, { status: 503 })).toBe(true);
    expect(nenRetry(3, { status: 503 })).toBe(false);
  });

  it("retry lỗi mạng (Failed to fetch)", () => {
    expect(nenRetry(0, new TypeError("Failed to fetch"))).toBe(true);
    expect(nenRetry(1, new Error("NetworkError when attempting"))).toBe(true);
  });

  it("map mã Supabase permission → 403", () => {
    expect(docMaHttp({ code: "42501" })).toBe(403);
    expect(docMaHttp({ code: "PGRST301" })).toBe(403);
  });

  it("phát hiện lỗi mạng qua message", () => {
    expect(laLoiMang(new Error("Load failed"))).toBe(true);
    expect(laLoiMang(new Error("something else"))).toBe(false);
  });

  it("lỗi không rõ mã: chỉ retry 1 lần", () => {
    expect(nenRetry(0, new Error("boom"))).toBe(true);
    expect(nenRetry(1, new Error("boom"))).toBe(false);
  });

  it("backoff mũ và bị chặn trên", () => {
    expect(tinhTreRetry(0)).toBe(1000);
    expect(tinhTreRetry(1)).toBe(2000);
    expect(tinhTreRetry(2)).toBe(4000);
    expect(tinhTreRetry(10)).toBe(15_000);
  });
});
