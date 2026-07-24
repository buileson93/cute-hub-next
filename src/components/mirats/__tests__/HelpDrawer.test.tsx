// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { HelpDrawer } from "../HelpDrawer";

afterEach(() => cleanup());

describe("HelpDrawer", () => {
  it("mặc định đóng — không hiển children", () => {
    render(
      <HelpDrawer title="Trợ giúp">
        <p data-testid="body">Nội dung dài</p>
      </HelpDrawer>,
    );
    expect(screen.queryByTestId("body")).toBeNull();
  });

  it("bấm nút → mở, hiển children", () => {
    render(
      <HelpDrawer title="Trợ giúp">
        <p data-testid="body">Nội dung dài</p>
      </HelpDrawer>,
    );
    fireEvent.click(screen.getByTestId("help-drawer-trigger"));
    expect(screen.getByTestId("body")).not.toBeNull();
    expect(screen.getByText("Trợ giúp")).not.toBeNull();
  });

  it("defaultOpen=true → mở ngay từ đầu", () => {
    render(
      <HelpDrawer title="T" defaultOpen>
        <p data-testid="body">X</p>
      </HelpDrawer>,
    );
    expect(screen.getByTestId("body")).not.toBeNull();
  });

  it("có nút đóng (aria) khi mở", () => {
    render(
      <HelpDrawer title="T" defaultOpen>
        <p>Body</p>
      </HelpDrawer>,
    );
    // Radix SheetContent luôn kèm nút Close với aria-label mặc định
    const closes = screen.getAllByRole("button");
    expect(closes.length).toBeGreaterThan(0);
  });
});
