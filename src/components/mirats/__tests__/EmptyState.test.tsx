// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/mirats/EmptyState";

describe("EmptyState — GĐ1-04", () => {
  it("render title + role=status", () => {
    render(<EmptyState title="Không có gì" description="mô tả" />);
    const el = screen.getByRole("status");
    expect(el).toBeTruthy();
    expect(screen.getByText("Không có gì")).toBeTruthy();
    expect(screen.getByText("mô tả")).toBeTruthy();
  });

  it("render CTA action", () => {
    render(<EmptyState title="X" action={<button>Tạo mới</button>} />);
    expect(screen.getByText("Tạo mới")).toBeTruthy();
  });
});
