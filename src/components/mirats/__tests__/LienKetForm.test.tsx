// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { LienKetForm, kiemTraLienKet, type LienKetFormValues } from "../LienKetForm";
import type { LoaiLienKet } from "@/lib/mirats/lien-ket";
import type { DoThiRow } from "@/lib/mirats/system-graph";
import type { ComboOption } from "@/components/mirats/Combobox";

afterEach(() => cleanup());

const htOptions: ComboOption[] = [
  { value: "ht-1", label: "VHF (VHF-01)" },
  { value: "ht-2", label: "VCCS (VCCS-01)" },
];

const loaiList: LoaiLienKet[] = [
  {
    id: "l-1",
    ma: "LUONG_TIN_HIEU",
    ten: "Luồng tín hiệu",
    mo_ta: null,
    mau_sac: "#2563eb",
    kieu_net: "solid",
    thu_tu: 1,
  },
];

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

const base: LienKetFormValues = {
  nguonId: "",
  dichId: "",
  loaiId: "",
  lop: "logic",
  huong: "mot_chieu",
  gdNguon: "",
  gdDich: "",
  giaoThuc: "",
  vaiTro: "",
  moTa: "",
  ghiChu: "",
};

describe("kiemTraLienKet — validate thuần", () => {
  it("chặn khi nguồn === đích", () => {
    const { loi } = kiemTraLienKet({ ...base, nguonId: "ht-1", dichId: "ht-1", loaiId: "l-1" }, []);
    expect(loi).toBeTruthy();
  });

  it("không lỗi khi nguồn ≠ đích", () => {
    const { loi } = kiemTraLienKet({ ...base, nguonId: "ht-1", dichId: "ht-2", loaiId: "l-1" }, []);
    expect(loi).toBeNull();
  });

  it("cảnh báo khi trùng cạnh đang hiệu lực", () => {
    const existing = [makeRow({})];
    const { loi, canhBao } = kiemTraLienKet(
      { ...base, nguonId: "ht-1", dichId: "ht-2", loaiId: "l-1" },
      existing,
    );
    expect(loi).toBeNull();
    expect(canhBao).toBeTruthy();
  });
});

describe("LienKetForm — render + validate nguồn≠đích", () => {
  it("nút lưu bị vô hiệu khi chưa đủ trường bắt buộc", () => {
    render(
      <LienKetForm
        heThongOptions={htOptions}
        loaiList={loaiList}
        existingEdges={[]}
        onSubmit={vi.fn()}
      />,
    );
    const submit = screen.getByRole("button", { name: /lưu liên kết/i });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
  });

  it("hiện lỗi khi chọn cùng một hệ thống cho nguồn và đích", () => {
    render(
      <LienKetForm
        heThongOptions={htOptions}
        loaiList={loaiList}
        existingEdges={[]}
        onSubmit={vi.fn()}
        defaultValues={{ nguonId: "ht-1", dichId: "ht-1", loaiId: "l-1" }}
      />,
    );
    expect(screen.getByRole("alert").textContent).toMatch(/chính nó/i);
    const submit = screen.getByRole("button", { name: /lưu liên kết/i });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
  });

  it("submit gọi onSubmit với dữ liệu hợp lệ", () => {
    const onSubmit = vi.fn();
    render(
      <LienKetForm
        heThongOptions={htOptions}
        loaiList={loaiList}
        existingEdges={[]}
        onSubmit={onSubmit}
        defaultValues={{ nguonId: "ht-1", dichId: "ht-2", loaiId: "l-1" }}
      />,
    );
    const submit = screen.getByRole("button", { name: /lưu liên kết/i });
    expect((submit as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      he_thong_nguon_id: "ht-1",
      he_thong_dich_id: "ht-2",
      loai_lien_ket_id: "l-1",
    });
  });
});
