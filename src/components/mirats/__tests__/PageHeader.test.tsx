// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PageHeader } from "../PageHeader";

afterEach(() => cleanup());

describe("PageHeader", () => {
  it("render title", () => {
    render(<PageHeader title="Danh mục tài sản" />);
    expect(screen.getByTestId("page-header-title").textContent).toBe(
      "Danh mục tài sản",
    );
  });

  it("subtitle rỗng → không render phần tử subtitle", () => {
    render(<PageHeader title="X" subtitle="" />);
    expect(screen.queryByTestId("page-header-subtitle")).toBeNull();
  });

  it("subtitle có giá trị → render 1 dòng", () => {
    render(<PageHeader title="X" subtitle="Mô tả ngắn" />);
    const el = screen.getByTestId("page-header-subtitle");
    expect(el.textContent).toBe("Mô tả ngắn");
    expect(el.className).toMatch(/truncate/);
  });

  it("có help → hiện nút InfoHint (aria-label 'Hướng dẫn')", () => {
    render(<PageHeader title="X" help={<span>Trợ giúp</span>} />);
    expect(
      screen.getByRole("button", { name: "Hướng dẫn" }),
    ).not.toBeNull();

  });

  it("không có help → không có nút Hướng dẫn", () => {
    render(<PageHeader title="X" />);
    expect(screen.queryByRole("button", { name: "Hướng dẫn" })).toBeNull();
  });

  it("actions render trong slot bên phải", () => {
    render(
      <PageHeader
        title="X"
        actions={<button data-testid="act">Thêm</button>}
      />,
    );
    const slot = screen.getByTestId("page-header-actions");
    expect(slot.querySelector('[data-testid="act"]')).not.toBeNull();
  });
});
