// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnomalyBadge } from "@/components/mirats/AnomalyBadge";

describe("AnomalyBadge", () => {
  it("hides badge when z_score < 2", () => {
    const { container } = render(<AnomalyBadge score={0.5} count90d={1} />);
    expect(container.textContent?.trim()).toBe("");
  });

  it("renders badge with count and aria label when z_score >= 2", () => {
    render(<AnomalyBadge score={2.3} count90d={5} />);
    const el = screen.getByLabelText(/5 sự cố \/ 90 ngày.*cao bất thường/i);
    expect(el).toBeTruthy();
    expect(el.textContent).toContain("5");
  });

  it("ignores non-finite score", () => {
    const { container } = render(<AnomalyBadge score={NaN} count90d={9} />);
    expect(container.textContent?.trim()).toBe("");
  });
});
