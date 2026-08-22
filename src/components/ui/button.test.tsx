import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";
import React from "react";

describe("Button Component Contract", () => {
  it("should render children correctly", () => {
    const { unmount } = render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeDefined();
    unmount();
  });

  it("should show loader and be disabled when loading", () => {
    const { container, unmount } = render(<Button loading>Submit</Button>);
    const button = container.querySelector('button');
    expect(button?.hasAttribute('disabled')).toBe(true);
    expect(container.querySelector('.animate-spin')).toBeDefined();
    unmount();
  });

  it("should apply variant classes correctly", () => {
    const { container, unmount } = render(<Button variant="destructive">Delete</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-destructive');
    unmount();
  });

  it("should have aria-label when size is icon", () => {
    const { unmount } = render(<Button size="icon" aria-label="Search" />);
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toBe('Search');
    unmount();
  });
});
