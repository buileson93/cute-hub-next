import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");
const DOC = resolve(ROOT, "docs/UI_GUIDELINES.md");

/**
 * Bộ luật UI chỉ hữu ích khi mọi đường dẫn nó trích dẫn đều tồn tại thật.
 * Test này chống trôi tài liệu khi code được di chuyển/đổi tên.
 */
describe("docs/UI_GUIDELINES.md", () => {
  const content = existsSync(DOC) ? readFileSync(DOC, "utf8") : "";

  it("tồn tại và có đủ các mục bắt buộc", () => {
    expect(existsSync(DOC)).toBe(true);
    for (const heading of [
      "## 2. Nguồn chuẩn",
      "## 6. Trạng thái bắt buộc",
      "## 8. Accessibility",
      "## 10. Checklist trước khi merge",
    ]) {
      expect(content).toContain(heading);
    }
  });

  it("mọi đường dẫn file được trích dẫn đều tồn tại trong repository", () => {
    const paths = new Set(
      [...content.matchAll(/`((?:src|docs|supabase)\/[A-Za-z0-9_./-]+\.[a-z]{2,4})`/g)].map(
        (m) => m[1]!,
      ),
    );
    const missing = [...paths].filter((p) => !existsSync(resolve(ROOT, p)));
    expect(missing).toEqual([]);
  });

  it("được tham chiếu từ AGENTS.md để mọi thay đổi UI đều phải tuân thủ", () => {
    const agents = readFileSync(resolve(ROOT, "AGENTS.md"), "utf8");
    expect(agents).toContain("docs/UI_GUIDELINES.md");
  });
});
