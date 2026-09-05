import { describe, it, expect } from "vitest";
import { flattenHierarchy } from "../HierarchyTable";

const pl = (over: any = {}) => ({
  id: "PL1",
  ten: "Phân loại 1",
  tone: "",
  count: 1,
  fields: [],
  ...over,
});

describe("flattenHierarchy", () => {
  it("trả về mảng rỗng với dữ liệu rỗng", () => {
    expect(flattenHierarchy([] as any, new Set())).toEqual([]);
  });

  it("bỏ qua node thiếu mã và node trùng ID", () => {
    const rows = flattenHierarchy(
      [pl(), pl(), pl({ id: "" })] as any,
      new Set(),
    );
    expect(rows.map((r) => r.ma)).toEqual(["PL1"]);
  });

  it("chỉ mở rộng khi node nằm trong tập expanded", () => {
    const tree = [
      pl({
        fields: [
          {
            id: "LV1",
            ten: "Lĩnh vực",
            count: 1,
            groups: [{ ma: "NH1", ten: "Nhóm", count: 1, systems: [] }],
          },
        ],
      }),
    ] as any;
    expect(flattenHierarchy(tree, new Set()).length).toBe(1);
    const open = flattenHierarchy(tree, new Set(["pl:PL1"]));
    expect(open.map((r) => r.kind)).toEqual(["pl", "lv"]);
  });

  it("không kẹt khi thiếu con hoặc dữ liệu null", () => {
    const tree = [
      pl({ fields: [{ id: "LV1", ten: "LV", count: 0, groups: null }] }),
    ] as any;
    expect(() => flattenHierarchy(tree, new Set(["pl:PL1", "pl:PL1/lv:LV1"]))).not.toThrow();
  });
  it("gán đúng cha trực tiếp: gốc là null, con lấy tên cha", () => {
    const tree = [
      pl({
        fields: [
          {
            id: "LV1",
            ten: "Lĩnh vực",
            count: 1,
            groups: [{ ma: "NH1", ten: "Nhóm", count: 1, systems: [] }],
          },
        ],
      }),
    ] as any;
    const rows = flattenHierarchy(tree, new Set(["pl:PL1", "pl:PL1/lv:LV1"]));
    expect(rows[0].parentTen).toBeNull();
    expect(rows[1].parentTen).toBe(rows[0].ten);
    expect(rows[2].parentTen).toBe("Lĩnh vực");
  });
});

describe("flattenHierarchy — expandAll", () => {
  const tree = [
    pl({
      fields: [
        {
          id: "LV1",
          ten: "Lĩnh vực",
          count: 1,
          groups: [
            {
              ma: "NH1",
              ten: "Nhóm",
              count: 1,
              systems: [
                {
                  ma: "HT1",
                  ten: "Hệ thống",
                  count: 1,
                  devices: [{ tb: { ma_thiet_bi: "TB1", ten_thiet_bi: "Tài sản 1" }, children: [] }],
                },
              ],
            },
          ],
        },
      ],
    }),
  ] as any;

  it("mở toàn bộ cây mà không cần tập expanded", () => {
    const rows = flattenHierarchy(tree, new Set(), { expandAll: true });
    expect(rows.map((r) => r.kind)).toEqual(["pl", "lv", "nh", "ht", "tb"]);
    expect(rows.at(-1)?.ten).toBe("Tài sản 1");
    expect(rows.at(-1)?.parentTen).toBe("Hệ thống");
  });

  it("không mở gì khi expandAll = false và expanded rỗng", () => {
    expect(flattenHierarchy(tree, new Set(), { expandAll: false })).toHaveLength(1);
  });
});
