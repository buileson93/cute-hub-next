// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { InfoGrid } from "../InfoGrid";
import { EntityHoverCard } from "../EntityHoverCard";
import type { RenderedField } from "@/lib/mirats/display/types";

afterEach(() => cleanup());

describe("InfoGrid — highlight khác biệt so với field thường", () => {
  const fields: RenderedField[] = [
    { nhan: "Mã tài sản", giaTri: "TB_ABC12345", highlight: true },
    { nhan: "Model", giaTri: "AWOS-3", highlight: false },
  ];

  it("field highlight có data-highlight='true' và class font-semibold", () => {
    const { container } = render(<InfoGrid fields={fields} />);
    const highlighted = container.querySelectorAll('[data-highlight="true"]');
    // 1 dt + 1 dd cho field highlight = 2 phần tử
    expect(highlighted.length).toBe(2);
    // dd highlight có background nhấn
    const dd = Array.from(highlighted).find((el) => el.tagName === "DD") as HTMLElement;
    expect(dd.className).toMatch(/bg-accent/);
    expect(dd.className).toMatch(/font-bold/);
  });

  it("field thường KHÔNG có data-highlight", () => {
    const { container } = render(<InfoGrid fields={fields} />);
    const normal = Array.from(container.querySelectorAll("dd")).find((el) =>
      el.textContent?.includes("AWOS-3"),
    ) as HTMLElement;
    expect(normal.getAttribute("data-highlight")).toBeNull();
    expect(normal.className).not.toMatch(/bg-accent/);
  });

  it("rỗng → không render dl", () => {
    const { container } = render(<InfoGrid fields={[]} />);
    expect(container.querySelector("dl")).toBeNull();
  });
});

describe("EntityHoverCard — hợp đồng cơ bản", () => {
  it("row null → chỉ render trigger, không có HoverCard", () => {
    const { getByText, container } = render(
      <EntityHoverCard loai="thiet_bi" row={null}>
        <span>TB_X</span>
      </EntityHoverCard>,
    );
    expect(getByText("TB_X")).toBeTruthy();
    // Không có trigger interactive (Radix) khi row null.
    expect(container.querySelector("[data-state]")).toBeNull();
  });

  it("row có dữ liệu → trigger focusable (a11y bàn phím)", () => {
    const { container } = render(
      <EntityHoverCard loai="thiet_bi" row={{ ma_thiet_bi: "TB_A", ten_thiet_bi: "AWOS" }}>
        <span>TB_A</span>
      </EntityHoverCard>,
    );
    const trigger = container.querySelector('[tabindex="0"]');
    expect(trigger).toBeTruthy();
    expect(trigger?.textContent).toContain("TB_A");
  });
});
