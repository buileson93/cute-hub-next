// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { InfoHint } from "../InfoHint";

afterEach(() => cleanup());

describe("InfoHint", () => {
  it("nút có aria-label 'Hướng dẫn' và không chiếm layout khi idle (không render tooltip content)", () => {
    render(<InfoHint>Nội dung tooltip</InfoHint>);
    expect(screen.getByRole("button", { name: "Hướng dẫn" })).not.toBeNull();
    // Nội dung tooltip chưa xuất hiện khi chưa hover/focus
    expect(screen.queryByText("Nội dung tooltip")).toBeNull();
  });

  it("focus vào nút → hiển tooltip content", async () => {
    render(<InfoHint>Nội dung tooltip</InfoHint>);
    const btn = screen.getByRole("button", { name: "Hướng dẫn" });
    fireEvent.focus(btn);
    // Radix render tooltip content sau focus
    const found = await screen.findAllByText("Nội dung tooltip");
    expect(found.length).toBeGreaterThan(0);
  });
});
