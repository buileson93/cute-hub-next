// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import { LienKetGroups, thieuDuPhong } from "../HeThongLienKetTab";
import type { DoThiRow } from "@/lib/mirats/system-graph";

afterEach(() => cleanup());

function makeRow(over: Partial<DoThiRow>): DoThiRow {
  return {
    id: "e-1",
    nguon_id: "ht-1",
    nguon_ten: "VHF",
    nguon_nhom: null,
    nguon_don_vi: null,
    dich_id: "ht-2",
    dich_ten: "VCCS",
    dich_nhom: null,
    dich_don_vi: null,
    loai_lien_ket_id: "l-1",
    loai_ma: "LUONG_TIN_HIEU",
    loai_ten: "Luồng tín hiệu",
    mau_sac: "#2563eb",
    kieu_net: "solid",
    lop: "logic",
    huong: "mot_chieu",
    vai_tro_du_phong: null,
    giao_dien_nguon: null,
    giao_dien_dich: null,
    giao_thuc: null,
    trang_thai: "hoat_dong",
    don_vi_id_snapshot: null,
    ...over,
  };
}

describe("thieuDuPhong — quy tắc thuần", () => {
  it("liên kết chính không có dự phòng tương ứng => thiếu", () => {
    const chinh = makeRow({ id: "e-1", vai_tro_du_phong: "chinh" });
    expect(thieuDuPhong(chinh, "ht-1", [chinh])).toBe(true);
  });

  it("có dự phòng cùng loại cùng phía => không thiếu", () => {
    const chinh = makeRow({ id: "e-1", vai_tro_du_phong: "chinh" });
    const duPhong = makeRow({
      id: "e-2",
      dich_id: "ht-3",
      dich_ten: "VCCS-BK",
      vai_tro_du_phong: "du_phong",
    });
    expect(thieuDuPhong(chinh, "ht-1", [chinh, duPhong])).toBe(false);
  });

  it("liên kết không phải 'chinh' thì không xét thiếu dự phòng", () => {
    const thuong = makeRow({ id: "e-1", vai_tro_du_phong: null });
    expect(thieuDuPhong(thuong, "ht-1", [thuong])).toBe(false);
  });
});

describe("LienKetGroups — nhóm Đi ra / Đi vào + badge thiếu dự phòng", () => {
  it("phân nhóm đúng theo hướng nguồn/đích", () => {
    const diRa = makeRow({ id: "e-1", nguon_id: "ht-1", dich_id: "ht-2", dich_ten: "VCCS" });
    const diVao = makeRow({ id: "e-2", nguon_id: "ht-9", nguon_ten: "RADAR", dich_id: "ht-1" });
    render(<LienKetGroups heThongId="ht-1" rows={[diRa, diVao]} />);

    const secRa = screen.getByRole("region", { name: /liên kết đi ra/i });
    expect(within(secRa).getByText("VCCS")).toBeTruthy();

    const secVao = screen.getByRole("region", { name: /liên kết đi vào/i });
    expect(within(secVao).getByText("RADAR")).toBeTruthy();
  });

  it("hiện badge 'Thiếu dự phòng' cho liên kết chính không có dự phòng", () => {
    const chinh = makeRow({ id: "e-1", vai_tro_du_phong: "chinh" });
    render(<LienKetGroups heThongId="ht-1" rows={[chinh]} />);
    expect(screen.getByText(/thiếu dự phòng/i)).toBeTruthy();
  });

  it("trạng thái rỗng khi không có liên kết", () => {
    render(<LienKetGroups heThongId="ht-1" rows={[]} />);
    expect(screen.getByText(/chưa có liên kết nào/i)).toBeTruthy();
  });
});
