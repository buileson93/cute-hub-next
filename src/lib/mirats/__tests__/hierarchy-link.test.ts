import { describe, expect, it } from "vitest";

import {
  dedupeLinks,
  descendantIds,
  hasLink,
  isValidParent,
  otherContexts,
  validParentOptions,
} from "../hierarchy-link";

const nodes = [
  { id: "a", parentId: null },
  { id: "b", parentId: "a" },
  { id: "c", parentId: "b" },
  { id: "d", parentId: null },
];

describe("hierarchy-link", () => {
  it("liệt kê đúng hậu duệ", () => {
    expect([...descendantIds(nodes, "a")].sort()).toEqual(["b", "c"]);
    expect([...descendantIds(nodes, "c")]).toEqual([]);
  });

  it("chặn vòng lặp khi chọn node cha", () => {
    expect(isValidParent(nodes, "a", "a")).toBe(false);
    expect(isValidParent(nodes, "a", "c")).toBe(false);
    expect(isValidParent(nodes, "a", "d")).toBe(true);
    expect(isValidParent(nodes, "a", null)).toBe(true);
  });

  it("không treo với dữ liệu vòng lặp sẵn có", () => {
    const cyclic = [
      { id: "x", parentId: "y" },
      { id: "y", parentId: "x" },
    ];
    expect([...descendantIds(cyclic, "x")].sort()).toEqual(["y"]);
  });

  it("lọc danh sách cha hợp lệ", () => {
    expect(validParentOptions(nodes, "a").map((n) => n.id)).toEqual(["d"]);
    expect(validParentOptions(nodes, null)).toHaveLength(4);
  });

  it("chống trùng liên kết trong cùng ngữ cảnh", () => {
    const links = [
      { contextId: "tp1", targetId: "ts1" },
      { contextId: "tp1", targetId: "ts1" },
      { contextId: "tp2", targetId: "ts1" },
    ];
    expect(dedupeLinks(links)).toHaveLength(2);
    expect(hasLink(links, "tp1", "ts1")).toBe(true);
    expect(hasLink(links, "tp3", "ts1")).toBe(false);
    expect(otherContexts(links, "ts1", "tp1")).toEqual(["tp2"]);
  });
});
