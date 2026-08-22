// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act, render, screen, fireEvent } from "@testing-library/react";
import { AutoFilledBadge, useAmbientApply } from "@/components/mirats/AutoFilledBadge";

const isEmptyStr = (v: string | null | undefined) => !v || !v.trim();

describe("useAmbientApply", () => {
  it("applies suggestion once when field is empty", () => {
    let value: string = "";
    const apply = vi.fn((v: string) => {
      value = v;
    });
    const clear = vi.fn(() => {
      value = "";
    });

    const { result, rerender } = renderHook(
      ({ suggested, currentValue }: { suggested: string | null; currentValue: string }) =>
        useAmbientApply<string>({ suggested, isEmpty: isEmptyStr, currentValue, apply, clear }),
      { initialProps: { suggested: null as string | null, currentValue: "" } },
    );

    expect(result.current.isAuto).toBe(false);
    rerender({ suggested: "gợi ý", currentValue: "" });
    expect(apply).toHaveBeenCalledWith("gợi ý");
    expect(result.current.isAuto).toBe(true);
  });

  it("does not overwrite when user already typed", () => {
    const apply = vi.fn();
    const clear = vi.fn();
    const { result } = renderHook(() =>
      useAmbientApply<string>({
        suggested: "gợi ý",
        isEmpty: isEmptyStr,
        currentValue: "đã gõ",
        apply,
        clear,
      }),
    );
    expect(apply).not.toHaveBeenCalled();
    expect(result.current.isAuto).toBe(false);
  });

  it("undo clears value and turns off auto", () => {
    const apply = vi.fn();
    const clear = vi.fn();
    const { result } = renderHook(() =>
      useAmbientApply<string>({
        suggested: "x",
        isEmpty: isEmptyStr,
        currentValue: "",
        apply,
        clear,
      }),
    );
    expect(result.current.isAuto).toBe(true);
    act(() => result.current.undo());
    expect(clear).toHaveBeenCalled();
    expect(result.current.isAuto).toBe(false);
  });
});

describe("AutoFilledBadge", () => {
  it("renders and fires onUndo", () => {
    const onUndo = vi.fn();
    render(<AutoFilledBadge onUndo={onUndo} />);
    expect(screen.getByTestId("auto-badge")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Hoàn tác gợi ý"));
    expect(onUndo).toHaveBeenCalled();
  });
});
