import { expect, test, describe } from "vitest";
import { buildTree } from "../src/components/mirats/he-thong-cay/utils";
import type { DbDevice, DbTaxonomy } from "../src/lib/mirats/db-taxonomy";

describe("Taxonomy Label Regression Characterization", () => {
  const plList: DbTaxonomy["plList"] = [
    { id: "PL01", ten: "Phân loại 01", tone: "", thu_tu: 1 },
  ];

  const devices: any[] = [
    {
      id: "dev-uuid-1",
      ma_thiet_bi: "TB01",
      ten: "Thiết bị 01",
      phan_loai_id: "PL01",
      nhom_he_thong_id: "nhom-uuid-1", // UUID reference
      he_thong_id: "ht-uuid-1",       // UUID reference
      _pl: "PL01",
      _nhKey: "nhom-uuid-1",
      _htId: "ht-uuid-1",
    },
    {
      id: "dev-uuid-2",
      ma_thiet_bi: "TB02",
      ten: "Thiết bị 02",
      phan_loai_id: "PL01",
      nhom_he_thong_id: "NH02",        // Code reference
      he_thong_id: "HT02",            // Code reference
      _pl: "PL01",
      _nhKey: "NH02",
      _htId: "HT02",
    }
  ];

  // Mock taxonomy maps that would be in DbTaxonomy
  const nhomNameMap = new Map([
    ["nhom-uuid-1", "Nhóm Hệ Thống 01"],
    ["NH02", "Nhóm Hệ Thống 02"]
  ]);

  const htNameMap = new Map([
    ["ht-uuid-1", "Hệ Thống Kỹ Thuật 01"],
    ["HT02", "Hệ Thống Kỹ Thuật 02"]
  ]);

  // Current fallback logic simulation
  const htLabel = (ma: string) => {
    // ma is constructed as `${nhKey}::${sysId}`
    const parts = ma.split("::");
    const sysId = parts.length > 1 ? parts[1] : parts[0];
    return htNameMap.get(sysId) || sysId;
  };

  const nhLabel = (ma: string) => {
    return nhomNameMap.get(ma) || ma;
  };

  test("buildTree labels should be human readable, not UUIDs", () => {
    const { tree } = buildTree(
      devices as DbDevice[],
      plList,
      htLabel,
      nhLabel,
      false,
      [],
      () => 0,
      () => 0,
      () => "",
      [],
      () => null,
      []
    );

    const plNode = tree[0];
    expect(plNode.ten).toBe("Phân loại 01");

    const groups = plNode.fields[0].groups;
    
    // Group 1 (UUID based)
    const g1 = groups.find(g => g.ma === "nhom-uuid-1");
    expect(g1?.ten).toBe("Nhóm Hệ Thống 01"); // Should NOT be "nhom-uuid-1"

    // Group 2 (Code based)
    const g2 = groups.find(g => g.ma === "NH02");
    expect(g2?.ten).toBe("Nhóm Hệ Thống 02");

    // System 1 (UUID based)
    const s1 = g1?.systems.find(s => s.ma.includes("ht-uuid-1"));
    expect(s1?.ten).toBe("Hệ Thống Kỹ Thuật 01"); // Should NOT be "ht-uuid-1"
  });
});
