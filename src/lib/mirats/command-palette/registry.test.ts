import { describe, it, expect } from "vitest";
import {
  buildCommands,
  filterByRole,
  groupCommands,
  normalizeText,
  pushRecentId,
  rankCommands,
  readRecentIds,
  scoreCommand,
  type AppCommand,
} from "./registry";

const all = buildCommands();

describe("buildCommands", () => {
  it("không sinh lệnh trùng id và không có route rỗng", () => {
    const ids = all.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of all) {
      if (c.target.kind === "navigate") expect(c.target.to.startsWith("/")).toBe(true);
    }
  });

  it("loại lệnh trỏ tới route không tồn tại khi có knownRoutes", () => {
    const limited = buildCommands({ knownRoutes: new Set(["/kiem-ke"]) });
    const navTargets = limited.filter((c) => c.target.kind === "navigate");
    expect(
      navTargets.every((c) => c.target.kind === "navigate" && c.target.to === "/kiem-ke"),
    ).toBe(true);
    // Lệnh hành động (QR, đăng xuất) không phụ thuộc route nên vẫn còn.
    expect(limited.some((c) => c.id === "action:qr-scan")).toBe(true);
  });
});

describe("filterByRole", () => {
  it("ẩn lệnh yêu cầu quyền mà người dùng không có", () => {
    const cmds = all.filter((c) => c.roles?.length);
    expect(cmds.length).toBeGreaterThan(0);
    const none = filterByRole(all, () => false);
    expect(none.some((c) => c.roles?.length)).toBe(false);
    const admin = filterByRole(all, (r) => r === "admin");
    expect(admin.length).toBeGreaterThan(none.length);
  });
});

describe("ranking", () => {
  it("bỏ dấu tiếng Việt khi tìm kiếm", () => {
    expect(normalizeText("Đăng xuất")).toBe("dang xuat");
    expect(rankCommands(all, "dang xuat").some((c) => c.id === "system:logout")).toBe(true);
  });

  it("ưu tiên khớp chính xác rồi tới tiền tố rồi tới keyword", () => {
    const cmd = (over: Partial<AppCommand>): AppCommand => ({
      id: "x",
      title: "Kiểm kê tài sản",
      group: "create",
      icon: all[0].icon,
      target: { kind: "navigate", to: "/x" },
      ...over,
    });
    expect(scoreCommand(cmd({ title: "qr" }), "qr")).toBe(100);
    expect(scoreCommand(cmd({ title: "QR thiết bị" }), "qr")).toBe(80);
    expect(scoreCommand(cmd({ title: "Quét mã QR" }), "qr")).toBe(60);
    expect(scoreCommand(cmd({ keywords: ["barcode"] }), "barcode")).toBe(40);
    expect(scoreCommand(cmd({}), "zzzz")).toBe(-1);
  });

  it("query rỗng trả về danh sách gốc bị cắt theo limit", () => {
    expect(rankCommands(all, "  ", 3)).toHaveLength(3);
  });
});

describe("recent", () => {
  it("đẩy lên đầu, khử trùng lặp và giới hạn 5", () => {
    let ids: string[] = [];
    for (const id of ["a", "b", "c", "d", "e", "f"]) ids = pushRecentId(ids, id);
    expect(ids).toEqual(["f", "e", "d", "c", "b"]);
    expect(pushRecentId(ids, "b")[0]).toBe("b");
    expect(pushRecentId(ids, "b")).toHaveLength(5);
  });

  it("dữ liệu hỏng hoặc storage lỗi không làm vỡ palette", () => {
    expect(readRecentIds({ getItem: () => "{oops" })).toEqual([]);
    expect(
      readRecentIds({
        getItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toEqual([]);
    expect(readRecentIds(null)).toEqual([]);
  });
});

describe("groupCommands", () => {
  it("bỏ nhóm rỗng và giữ thứ tự nhóm", () => {
    const groups = groupCommands(all.filter((c) => c.group === "create"));
    expect(groups.map((g) => g.group)).toEqual(["create"]);
    expect(groupCommands([])).toEqual([]);
  });
});
