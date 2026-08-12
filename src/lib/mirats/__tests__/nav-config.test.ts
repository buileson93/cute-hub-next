import { describe, it, expect } from "vitest";
import { navGroups, isActive, type NavItem } from "../nav/nav-config";

describe("nav-config — navGroups()", () => {
  const groups = navGroups();

  it("có ít nhất 1 nhóm và không trùng key nhóm", () => {
    expect(groups.length).toBeGreaterThan(0);
    const keys = groups.map((g) => g.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("thuTu tăng dần theo thứ tự khai báo", () => {
    for (let i = 0; i < groups.length; i++) expect(groups[i].thuTu).toBe(i);
  });

  it("mọi item có nhan, icon, route, và nhom trỏ về nhóm chứa nó", () => {
    for (const g of groups) {
      for (const it of g.items) {
        expect(it.nhan).toBeTruthy();
        expect(it.icon).toBeTruthy();
        // Cho phép divider dùng hash-anchor (#...) làm neo trong-trang.
        const isAnchor = it.route.startsWith("#");
        expect(isAnchor || it.route.startsWith("/")).toBe(true);
        expect(it.nhom).toBe(g.key);
      }
    }
  });


  it("badgeKey chỉ nhận giá trị hợp lệ (nếu có)", () => {
    const allowed = new Set(["su_co_mo", "sap_het_han", "hong_hoc_mo", "kd_hc_sap_het_han"]);
    for (const g of groups) {
      for (const it of g.items) {
        if (it.badgeKey) expect(allowed.has(it.badgeKey)).toBe(true);
      }
    }
  });

  it("gắn badge cho /su-co, /hong-hoc, /giay-phep", () => {
    const flat = groups.flatMap((g) => g.items);
    expect(flat.find((i) => i.route === "/su-co")?.badgeKey).toBe("su_co_mo");
    expect(flat.find((i) => i.route === "/hong-hoc")?.badgeKey).toBe("hong_hoc_mo");
    expect(flat.find((i) => i.route === "/giay-phep")?.badgeKey).toBe("sap_het_han");
  });

  it("giữ nguyên trường roles từ nav-contract", () => {
    const flat = groups.flatMap((g) => g.items);
    // Kiểm tra mục /phan-quyen vốn có roles: MANAGER_ROLES trong contract
    const phanQuyen = flat.find((i) => i.route === "/phan-quyen");
    expect(phanQuyen?.roles).toBeDefined();
    expect(Array.isArray(phanQuyen?.roles)).toBe(true);
    expect(phanQuyen?.roles?.includes("admin")).toBe(true);
  });
});

describe("nav-config — isActive()", () => {
  const item = (route: string, exact = false): NavItem => ({
    key: route, nhan: "x", icon: "Circle", route, nhom: "g", exact,
  });

  it("khớp chính xác khi cùng đường dẫn", () => {
    expect(isActive("/thiet-bi", item("/thiet-bi"))).toBe(true);
  });

  it("khớp mục cha khi đang ở route con", () => {
    expect(isActive("/thiet-bi/TB_ABC12345", item("/thiet-bi"))).toBe(true);
    expect(isActive("/bao-tri/cong-viec", item("/bao-tri"))).toBe(true);
  });

  it("không khớp khi chỉ trùng prefix chuỗi (không phải segment)", () => {
    expect(isActive("/thiet-bi-khac", item("/thiet-bi"))).toBe(false);
  });

  it("exact=true chỉ khớp đúng đường dẫn", () => {
    expect(isActive("/", item("/", true))).toBe(true);
    expect(isActive("/thiet-bi", item("/", true))).toBe(false);
  });
});
