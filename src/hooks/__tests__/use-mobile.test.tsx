/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsMobile, useBreakpoint } from "../use-mobile";
import { MOBILE_BREAKPOINT_PX, TABLET_BREAKPOINT_PX } from "@/lib/mirats/ui/responsive-scope";

// Manual mock for matchMedia since setup.ts might not be loaded properly in this environment
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("use-mobile hooks", () => {
  const setWidth = (width: number) => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: width,
    });
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
