import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("layout scroll contract", () => {
  it("giữ AppShell trong viewport và co main đúng theo flex", () => {
    const appShell = source("src/components/mirats/app-shell/AppShell.tsx");

    expect(appShell).toContain("flex h-dvh w-full overflow-hidden");
    expect(appShell).toContain("relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden");
  });

  it("không để wrapper chuyển trang phá chuỗi chiều cao", () => {
    const transition = source("src/components/mirats/PageTransition.tsx");

    expect(transition).toContain("flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto");
    expect(transition).not.toContain('className="min-h-full"');
  });

  it("dùng PageFrame theo chiều cao parent và PageBody làm scroll owner", () => {
    const frame = source("src/components/mirats/layout/PageFrame.tsx");
    const body = source("src/components/mirats/PageBody.tsx");

    expect(frame).toContain("h-full min-h-0 min-w-0");
    expect(frame).not.toContain("h-dvh overflow-hidden");
    expect(body).toContain("min-h-0 min-w-0");
    expect(body).toContain("overflow-y-auto overscroll-contain");
  });
});