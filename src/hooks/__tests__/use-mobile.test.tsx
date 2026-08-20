import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile, useBreakpoint } from "../use-mobile";
import { MOBILE_BREAKPOINT_PX, TABLET_BREAKPOINT_PX } from "@/lib/mirats/ui/responsive-scope";

describe("use-mobile hooks", () => {
  const setWidth = (width: number) => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: width,
    });
    // Trigger matchMedia update if necessary (setup.ts mock is simple, so we rely on updateBreakpoint call)
    window.dispatchEvent(new Event("resize"));
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useIsMobile", () => {
    it("should return true when width is below mobile breakpoint", () => {
      setWidth(MOBILE_BREAKPOINT_PX - 10);
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it("should return false when width is at or above mobile breakpoint", () => {
      setWidth(MOBILE_BREAKPOINT_PX);
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });
  });

  describe("useBreakpoint", () => {
    it("should return 'mobile' for small screens", () => {
      setWidth(MOBILE_BREAKPOINT_PX - 1);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe("mobile");
    });

    it("should return 'tablet' for medium screens", () => {
      setWidth(MOBILE_BREAKPOINT_PX + 10);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe("tablet");
    });

    it("should return 'desktop' for large screens", () => {
      setWidth(TABLET_BREAKPOINT_PX + 10);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe("desktop");
    });
  });
});
