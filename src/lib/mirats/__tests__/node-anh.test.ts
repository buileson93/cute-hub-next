import { describe, expect, it } from "vitest";
import { nodeAnhKey, validateNodeAnh, NODE_ANH_MAX_BYTES } from "../node-anh";

describe("node-anh", () => {
  it("tạo khoá node theo kind:ma", () => {
    expect(nodeAnhKey("ht", "HT-01")).toBe("ht:HT-01");
  });

  it("chấp nhận ảnh hợp lệ", () => {
    expect(validateNodeAnh({ type: "image/png", size: 1024 })).toBeNull();
  });

  it("từ chối tệp không phải ảnh", () => {
    expect(validateNodeAnh({ type: "application/pdf", size: 10 })).toMatch(/Chỉ chấp nhận/);
  });

  it("từ chối ảnh quá 10MB", () => {
    expect(validateNodeAnh({ type: "image/jpeg", size: NODE_ANH_MAX_BYTES + 1 })).toMatch(/10MB/);
  });

  it("từ chối tệp rỗng", () => {
    expect(validateNodeAnh({ type: "image/jpeg", size: 0 })).toMatch(/rỗng/);
  });
});
