// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePersistentCollapse } from "@/hooks/use-persistent-collapse";

describe("usePersistentCollapse — GĐ1-03", () => {
  beforeEach(() => window.localStorage.clear());

  it("mặc định trả defaultOpen khi chưa có key", () => {
    const { result } = renderHook(() => usePersistentCollapse("f", "s1", false));
    expect(result.current[0]).toBe(false);
  });

  it("ghi vào localStorage khi setOpen", () => {
    const { result } = renderHook(() => usePersistentCollapse("su-co", "sec-4"));
    act(() => result.current[1](true));
    expect(window.localStorage.getItem("mirats:form:su-co:sec-4")).toBe("open");
    act(() => result.current[1](false));
    expect(window.localStorage.getItem("mirats:form:su-co:sec-4")).toBe("closed");
  });

  it("khôi phục state từ localStorage khi mount", () => {
    window.localStorage.setItem("mirats:form:su-co:sec-5", "open");
    const { result } = renderHook(() => usePersistentCollapse("su-co", "sec-5", false));
    expect(result.current[0]).toBe(true);
  });
});
