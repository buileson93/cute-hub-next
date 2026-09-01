// Hợp đồng cuộn của vùng bảng dùng chung (StandardTable).
// Mục tiêu: chống tái phát lỗi "một scroller cho mỗi trục" từng làm hỏng
// sticky header, thanh cuộn ngang và thanh cuộn dọc trên nhiều trang.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const src = readFileSync(
  resolve(process.cwd(), "src/components/mirats/StandardTable.tsx"),
  "utf8",
);
const skin = readFileSync(
  resolve(process.cwd(), "src/styles/astryx-component-skins.css"),
  "utf8",
);

describe("StandardTable — hợp đồng vùng cuộn", () => {
  it("chỉ có một scroll container và nó sở hữu cả hai trục", () => {
    expect(src).toContain("mirats-table-scroll-container");
    expect(src).toContain("overflow-auto");
    // Không được tách trục: overflow-x hidden / overflow-y visible lồng nhau.
    expect(src).not.toMatch(/overflowX:\s*'hidden'/);
    expect(src).not.toContain("overflow-y-visible");
  });

  it("không tạo containing block phá position: sticky", () => {
    expect(src).not.toMatch(/transform:\s*'translate3d/);
    expect(src).not.toMatch(/contain:\s*'content'/);
  });

  it("không còn thanh cuộn ngang tự chế điều khiển scrollLeft", () => {
    expect(src).not.toContain("<HorizontalScrollRail");
  });

  it("prop maxHeightClass được áp dụng thực sự", () => {
    const uses = src.match(/maxHeightClass/g) ?? [];
    // khai báo type + destructure + sử dụng trong className
    expect(uses.length).toBeGreaterThanOrEqual(3);
  });

  it("lớp skin không ép overflow lên khung bảng", () => {
    const block = skin.slice(
      skin.indexOf(".astryx-table-container"),
      skin.indexOf(".astryx-table-header"),
    );
    expect(block).not.toMatch(/^\s*overflow:/m);
  });
});
