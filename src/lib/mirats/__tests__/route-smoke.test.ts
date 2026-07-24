import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { workspaces, routeTitles, type NavItem } from "../nav-contract";

// ============================================================================
// Route smoke test — Task 8.
// Bảo đảm MỌI đích điều hướng trong menu và MỌI khoá breadcrumb đều trỏ tới một
// file route có thật trong src/routes. Đây là hàng rào chống "menu trỏ vào route
// đã bị xoá/đổi tên" khi refactor về sau.
// ============================================================================

const ROUTES_DIR = resolve(process.cwd(), "src/routes");

/** Chuyển tên file route (flat, dot-separated) sang đường dẫn URL tĩnh. */
function fileToUrl(file: string): string | null {
  let n = file.replace(/\.(tsx|ts)$/i, "");
  // Bỏ layout pathless "_app"
  if (n === "_app") return null;
  if (n.startsWith("_app.")) n = n.slice("_app.".length);
  else if (n.startsWith("_app")) n = n.slice("_app".length);
  // Bỏ file layout / gốc / non-page
  if (["__root", "index"].includes(n)) {
    return n === "index" ? "/" : null;
  }
  // Route động / splat / server / well-known — không phải đích menu tĩnh
  if (n.includes("$") || n.startsWith(".") || n.includes("[")) return null;
  const parts = n.split(".");
  if (parts[parts.length - 1] === "index") parts.pop();
  const url = "/" + parts.join("/");
  return url === "/" ? "/" : url;
}

function buildStaticUrlSet(): Set<string> {
  const files = readdirSync(ROUTES_DIR).filter((f) => /\.(tsx|ts)$/i.test(f));
  const set = new Set<string>();
  for (const f of files) {
    const url = fileToUrl(f);
    if (url) set.add(url);
  }
  return set;
}

function allNavItems(): NavItem[] {
  const out: NavItem[] = [];
  for (const ws of workspaces) {
    for (const g of ws.groups) {
      for (const it of g.items) {
        out.push(it);
        for (const c of it.children ?? []) out.push(c);
      }
    }
  }
  return out;
}

describe("route smoke", () => {
  const urls = buildStaticUrlSet();

  it("có ít nhất các route lõi", () => {
    for (const core of ["/", "/su-co", "/bao-tri", "/vat-tu", "/kiem-ke", "/he-thong/cay"]) {
      expect(urls.has(core)).toBe(true);
    }
  });

  it("mọi đích menu trỏ tới route có thật", () => {
    const missing = allNavItems()
      .filter((i) => !i.divider && !i.to.startsWith("#"))
      .map((i) => i.to)
      .filter((to) => !urls.has(to));
    expect(missing).toEqual([]);
  });


  it("mọi khoá breadcrumb tĩnh trỏ tới route có thật", () => {
    const missing = Object.keys(routeTitles).filter((k) => !urls.has(k));
    expect(missing).toEqual([]);
  });
});
