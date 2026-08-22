import { describe, expect, it } from "vitest";
import {
  pickBienPhapForComponents,
  pickLastKipTruc,
  type SuCoJson,
} from "@/lib/mirats/prefill-suggestions";

describe("pickLastKipTruc", () => {
  it("returns first non-empty kip_truc", () => {
    const rows: SuCoJson[] = [
      { bao_cao_ban_dau: { kip_truc: [] } },
      {
        bao_cao_ban_dau: {
          kip_truc: [{ ho_ten: "A", chuc_vu: "KTV", nang_dinh: "N1" }],
        },
      },
    ];
    expect(pickLastKipTruc(rows)?.[0].ho_ten).toBe("A");
  });

  it("returns null when nothing usable", () => {
    expect(pickLastKipTruc([])).toBeNull();
    expect(
      pickLastKipTruc([
        { bao_cao_ban_dau: { kip_truc: [{ ho_ten: "  ", chuc_vu: "", nang_dinh: "" }] } },
      ]),
    ).toBeNull();
  });
});

describe("pickBienPhapForComponents", () => {
  const rows: SuCoJson[] = [
    {
      bien_phap_xu_ly: "Khởi động lại nguồn",
      bao_cao_ban_dau: { thanh_phan_list: [{ id: "tp1" }] },
    },
    {
      bien_phap_xu_ly: "Khởi động lại nguồn",
      bao_cao_ban_dau: { thanh_phan_list: [{ id: "tp2" }] },
    },
    {
      bien_phap_xu_ly: "Thay module thu",
      bao_cao_ban_dau: { thanh_phan_list: [{ id: "tp1" }] },
    },
    {
      bien_phap_xu_ly: "Không liên quan",
      bao_cao_ban_dau: { thanh_phan_list: [{ id: "tpX" }] },
    },
  ];

  it("picks most frequent biện pháp matching selected components", () => {
    expect(pickBienPhapForComponents(rows, ["tp1", "tp2"])).toBe("Khởi động lại nguồn");
  });

  it("filters out unrelated components", () => {
    expect(pickBienPhapForComponents(rows, ["tp1"])).toMatch(/Khởi động lại nguồn|Thay module thu/);
  });

  it("returns null when nothing matches", () => {
    expect(pickBienPhapForComponents(rows, ["tpZ"])).toBeNull();
    expect(pickBienPhapForComponents(rows, [])).toBeNull();
  });
});
