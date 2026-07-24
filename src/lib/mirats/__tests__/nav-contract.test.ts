import { describe, it, expect } from "vitest";
import {
  workspaces,
  routeTitles,
  isItemActive,
  itemMatchScore,
  resolveActiveWorkspace,
  firstItemOf,
  flattenWorkspaceItems,
  resolveRouteMeta,
  isWorkspaceVisible,
  type NavItem,
  type Workspace,
} from "../nav-contract";
import type { AppRole } from "@/hooks/use-session";

// ============================================================================
// Test đặc tả (characterization) cho HỢP ĐỒNG ĐIỀU HƯỚNG FRONT END — Task 8.
// Mục tiêu: khoá lại route, menu, breadcrumb và quyền hiển thị HIỆN TẠI để các
// nâng cấp sau không vô tình làm mất. Nếu một thay đổi có chủ đích, phải sửa
// snapshot bên dưới một cách rõ ràng.
// ============================================================================

const roleChecker = (roles: AppRole[]) => (r: AppRole) => roles.includes(r);
const admin = roleChecker(["admin"]);
const phongKt = roleChecker(["phong_kt"]);
const ktv = roleChecker(["ktv"]);
const readonly = roleChecker(["readonly"]);

function allItems(ws: Workspace): NavItem[] {
  const out: NavItem[] = [];
  for (const g of ws.groups) {
    for (const it of g.items) {
      if (it.divider) continue;
      out.push(it);
      for (const c of it.children ?? []) {
        if (c.divider) continue;
        out.push(c);
      }
    }
  }
  return out;
}

function everyNavItem(): NavItem[] {
  return workspaces.flatMap(allItems);
}

describe("workspace contract", () => {
  it("giữ đúng thứ tự và id các phân hệ", () => {
    expect(workspaces.map((w) => w.id)).toEqual([
      "van-hanh",
      "so-ly-lich",
      "danh-muc",
      "du-an",
      "trao-doi",
      "tai-san",
      "he-thong",
    ]);
  });

  it("chỉ Danh mục & Hệ thống bị giới hạn theo vai trò", () => {
    const restricted = workspaces.filter((w) => w.roles).map((w) => w.id);
    expect(restricted).toEqual(["danh-muc", "he-thong"]);
  });

  it("phân hệ Vận hành mở cho mọi vai trò", () => {
    const vanHanh = workspaces.find((w) => w.id === "van-hanh")!;
    expect(isWorkspaceVisible(vanHanh, readonly)).toBe(true);
    expect(isWorkspaceVisible(vanHanh, ktv)).toBe(true);
  });
});

describe("route visibility theo vai trò", () => {
  it("admin thấy toàn bộ phân hệ", () => {
    const visible = workspaces.filter((w) => isWorkspaceVisible(w, admin)).map((w) => w.id);
    expect(visible).toHaveLength(workspaces.length);
  });

  it("phong_kt thấy Danh mục & Hệ thống (manager)", () => {
    expect(isWorkspaceVisible(workspaces.find((w) => w.id === "danh-muc")!, phongKt)).toBe(true);
    expect(isWorkspaceVisible(workspaces.find((w) => w.id === "he-thong")!, phongKt)).toBe(true);
  });

  it("ktv/readonly KHÔNG thấy Danh mục & Hệ thống", () => {
    for (const check of [ktv, readonly]) {
      expect(isWorkspaceVisible(workspaces.find((w) => w.id === "danh-muc")!, check)).toBe(false);
      expect(isWorkspaceVisible(workspaces.find((w) => w.id === "he-thong")!, check)).toBe(false);
    }
  });

  it("mục chỉ-admin không lộ cho phong_kt", () => {
    const heThong = workspaces.find((w) => w.id === "he-thong")!;
    const forPhongKt = flattenWorkspaceItems(heThong, phongKt).map((i) => i.to);
    expect(forPhongKt).not.toContain("/admin/users");
    expect(forPhongKt).not.toContain("/admin/audit");
    // manager vẫn thấy chính sách bảo dưỡng & phân quyền
    expect(forPhongKt).toContain("/phan-quyen");
  });
});

describe("Overview là route gốc và exact", () => {
  it("mục Overview trỏ '/' và exact", () => {
    const overview = workspaces[0].groups[0].items[0];
    expect(overview.label).toBe("Overview");
    expect(overview.to).toBe("/");
    expect(overview.exact).toBe(true);
  });

  it("'/' không nuốt các route con", () => {
    const overview = workspaces[0].groups[0].items[0];
    expect(isItemActive(overview, "/")).toBe(true);
    expect(isItemActive(overview, "/thiet-bi")).toBe(false);
  });
});

describe("resolveActiveWorkspace bám đúng phân hệ", () => {
  const cases: Array<[string, string]> = [
    ["/", "van-hanh"],
    ["/he-thong/cay", "van-hanh"],
    ["/su-co", "so-ly-lich"],
    ["/bao-tri/cong-viec", "so-ly-lich"],
    ["/du-an", "du-an"],
    ["/du-an/abc", "du-an"],
    ["/tickets", "trao-doi"],
    ["/messages", "trao-doi"],
    ["/vat-tu", "tai-san"],
    ["/kiem-ke", "tai-san"],
    ["/forms", "tai-san"],
    ["/danh-muc/model", "danh-muc"],
    ["/admin/users", "he-thong"],
    ["/admin/schema", "he-thong"],
  ];
  it.each(cases)("%s -> %s", (path, ws) => {
    expect(resolveActiveWorkspace(path)).toBe(ws);
  });
});

describe("itemMatchScore ưu tiên prefix dài nhất", () => {
  it("khớp prefix có ranh giới '/'", () => {
    const item: NavItem = { to: "/bao-tri", label: "x", icon: workspaces[0].icon };
    expect(itemMatchScore(item, "/bao-tri")).toBe("/bao-tri".length);
    expect(itemMatchScore(item, "/bao-tri/cong-viec")).toBe("/bao-tri".length);
    // không khớp nhầm route khác cùng tiền tố chuỗi
    expect(itemMatchScore(item, "/bao-tri-khac")).toBe(-1);
  });
});

describe("breadcrumb & tiêu đề trang", () => {
  const cases: Array<[string, string, string]> = [
    ["/", "Bảng điều khiển", "Tổng quan hệ thống"],
    ["/he-thong/cay", "Tài sản", "Hệ thống"],
    ["/su-co", "Sổ lý lịch", "Sự cố"],
    ["/bao-tri", "Sổ lý lịch", "Bảo dưỡng"],
    ["/van-de", "Sổ lý lịch", "Vấn đề (RCA)"],
    ["/vat-tu", "Kho", "Vật tư & Kho"],
    ["/kiem-ke", "Tài sản", "Kiểm kê tài sản"],
    ["/admin/audit", "Hệ thống", "Nhật ký hệ thống"],
  ];
  it.each(cases)("%s -> %s / %s", (path, crumb, title) => {
    const meta = resolveRouteMeta(path);
    expect(meta.crumb).toBe(crumb);
    expect(meta.title).toBe(title);
  });

  it("route con dùng breadcrumb của route cha (prefix)", () => {
    expect(resolveRouteMeta("/su-co/SC-001").crumb).toBe("Sổ lý lịch");
    expect(resolveRouteMeta("/thiet-bi/TB-001").title).toBe("Sổ lý lịch");
  });

  it("đường dẫn lạ có fallback an toàn", () => {
    expect(resolveRouteMeta("/khong-ton-tai")).toEqual({ crumb: "MIRATS", title: "" });
  });
});

describe("firstItemOf tôn trọng quyền", () => {
  it("trả về mục đầu tiên user được xem", () => {
    const heThong = workspaces.find((w) => w.id === "he-thong")!;
    // admin: mục đầu là /phan-quyen (manager role)
    expect(firstItemOf(heThong, admin)).toBe("/phan-quyen");
  });
});

describe("flattenWorkspaceItems cho giao diện điện thoại", () => {
  it("loại bỏ mục hideOnMobile", () => {
    const taiSan = workspaces.find((w) => w.id === "tai-san")!;
    const mobile = flattenWorkspaceItems(taiSan, admin).map((i) => i.to);
    expect(mobile).not.toContain("/nhan"); // In nhãn QR chỉ desktop
    expect(mobile).toContain("/vat-tu");
    expect(mobile).toContain("/kiem-ke");
  });

  it("gộp cả mục con của Sổ lý lịch", () => {
    const soLyLich = workspaces.find((w) => w.id === "so-ly-lich")!;
    const mobile = flattenWorkspaceItems(soLyLich, admin).map((i) => i.to);
    expect(mobile).toContain("/thiet-bi");
    expect(mobile).toContain("/su-co");
    expect(mobile).toContain("/bao-tri");
  });
});

describe("tính toàn vẹn của contract", () => {
  it("mọi mục điều hướng có icon và nhãn không rỗng", () => {
    for (const it of everyNavItem()) {
      expect(it.to.startsWith("/")).toBe(true);
      expect(it.label.trim().length).toBeGreaterThan(0);
      expect(typeof it.icon).toBe("object");
    }
  });

  it("không có 'to' trùng lặp giữa các mục điều hướng", () => {
    const tos = everyNavItem().map((i) => i.to);
    const dupes = tos.filter((t, i) => tos.indexOf(t) !== i);
    expect(dupes).toEqual([]);
  });

  it("mọi key trong routeTitles là đường dẫn tuyệt đối", () => {
    for (const key of Object.keys(routeTitles)) {
      expect(key.startsWith("/")).toBe(true);
    }
  });
});
