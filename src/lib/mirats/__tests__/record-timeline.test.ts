import { describe, it, expect } from "vitest";
import { buildRecordTimeline } from "@/lib/mirats/record-timeline";
import type { SuCo, BaoTri, HongHocThayThe, BanGiao } from "@/lib/mirats/types";

function bt(over: Partial<BaoTri> = {}): BaoTri {
  return {
    ma_bao_tri: "BT-1",
    thiet_bi: "TB-1",
    thiet_bi_id: "id-1",
    he_thong: "HT",
    he_thong_id: null,
    don_vi: "DV",
    loai_bao_tri: "Định kỳ",
    ke_hoach: null,
    ngay_bat_dau: "2026-01-10",
    ngay_hoan_thanh: null,
    mo_ta_cong_viec: "Vệ sinh",
    ket_qua: "Tốt",
    chi_phi: 0,
    nguoi_thuc_hien: [],
    don_vi_thuc_hien: "",
    trang_thai: "Hoàn thành",
    file_bien_ban: null,
    ...over,
  };
}
function sc(over: Partial<SuCo> = {}): SuCo {
  return {
    ma_su_co: "SC-1",
    thiet_bi: "TB-1",
    thiet_bi_id: "id-1",
    he_thong: "HT",
    he_thong_id: null,
    don_vi: "DV",
    ngay_phat_hien: "2026-02-15",
    nguoi_bao_cao: "",
    muc_do: "Nghiêm trọng",
    anh_huong_dhb: "",
    hien_tuong: "Mất tín hiệu",
    nguyen_nhan: null,
    bien_phap_xu_ly: "Khởi động lại",
    thoi_diem_khac_phuc: null,
    thoi_gian_gian_doan: null,
    nguoi_xu_ly: [],
    trang_thai: "Đã xử lý",
    lien_ket_hong_hoc: null,
    file_dinh_kem: null,
    bao_cao_ban_dau: null,
    ma_nhom_bc: null,
    van_de_id: null,
    ...over,
  };
}
function hh(over: Partial<HongHocThayThe> = {}): HongHocThayThe {
  return {
    id: "hh-1",
    thanh_phan_id: null,
    ma_hong_hoc: "HH-1",
    thiet_bi_hong: "TB-1",
    thiet_bi_hong_id: "id-1",
    su_co: null,
    ngay_hong: "2026-03-01",
    bo_phan_hong: "Nguồn",
    mo_ta_hong_hoc: "Cháy nguồn",
    phuong_an: "Thay mới",
    thiet_bi_thay_the: null,
    thiet_bi_thay_the_id: null,
    vat_tu_su_dung: [],
    chi_phi: 0,
    nguoi_thuc_hien: [],
    don_vi_thuc_hien: "",
    ket_qua: null,
    ngay_hoan_thanh: null,
    trang_thai: "Hoàn thành",
    file_dinh_kem: null,
    ...over,
  };
}
function bg(over: Partial<BanGiao> = {}): BanGiao {
  return {
    ma_ban_giao: "BG-1",
    thiet_bi: "TB-1",
    loai_ban_giao: "Điều chuyển",
    nguoi_giao: "A",
    nguoi_nhan: "B",
    don_vi_nhan: "DV2",
    ngay_nhan: "2026-04-20",
    ngay_tra: null,
    tinh_trang_khi_nhan: "Tốt",
    tinh_trang_khi_tra: null,
    file_bien_ban: null,
    trang_thai: "Hoàn thành",
    ghi_chu: null,
    ...over,
  };
}

describe("buildRecordTimeline", () => {
  it("gộp tất cả nguồn và sắp xếp mới nhất trước", () => {
    const items = buildRecordTimeline({
      baoTri: [bt()],
      suCo: [sc()],
      hongHoc: [hh()],
      banGiao: [bg()],
    });
    expect(items).toHaveLength(4);
    // bàn giao 04-20 mới nhất, bảo dưỡng 01-10 cũ nhất
    expect(items[0].kind).toBe("bg");
    expect(items[items.length - 1].kind).toBe("bt");
  });

  it("map đúng nội dung từng loại", () => {
    const [item] = buildRecordTimeline({ suCo: [sc()] });
    expect(item.kind).toBe("sc");
    expect(item.title).toBe("Mất tín hiệu");
    expect(item.label).toBe("Nghiêm trọng");
    expect(item.desc).toBe("Khởi động lại");
    expect(item.tag).toBe("Đã xử lý");
  });

  it("thêm sự kiện chỉnh sửa dữ liệu", () => {
    const items = buildRecordTimeline({
      changeEvents: [
        {
          at: "2026-05-01",
          action: "update",
          userName: "Admin",
          changesCount: 2,
          changesText: "A: x → y",
        },
        { at: "2026-05-02", action: "insert", userName: "Admin" },
      ],
    });
    expect(items[0].kind).toBe("cd");
    expect(items[0].title).toBe("Tạo mới bản ghi");
    expect(items[1].title).toBe("Cập nhật 2 trường");
    expect(items[1].desc).toBe("A: x → y");
  });

  it("gắn nhãn tài sản: ưu tiên live rồi fallback snapshot", () => {
    const getLive = (id: string) =>
      id === "id-1" ? { ma_thiet_bi: "TB-1", ten: "Máy A" } : undefined;
    const items = buildRecordTimeline({
      baoTri: [bt({ thiet_bi_id: "id-1" })],
      suCo: [
        sc({
          thiet_bi_id: "id-gone",
          snapshot_ma_thiet_bi: "TB-OLD",
          snapshot_ten_thiet_bi: "Máy cũ",
        }),
      ],
      withDeviceLabel: true,
      getLive,
    });
    const btItem = items.find((i) => i.kind === "bt")!;
    const scItem = items.find((i) => i.kind === "sc")!;
    expect(btItem.deviceSource).toBe("live");
    expect(btItem.device).toBe("TB-1 — Máy A");
    expect(scItem.deviceSource).toBe("snapshot");
    expect(scItem.device).toBe("TB-OLD — Máy cũ");
  });

  it("bỏ qua nguồn rỗng/không truyền", () => {
    expect(buildRecordTimeline({})).toEqual([]);
  });

  // P9 — cây edit đi qua `mapChangeEventForLayer` phải hoà vào timeline `cd`.
  it("hoà thay đổi cây (mapChangeEventForLayer) vào timeline sổ lý lịch", async () => {
    const { mapChangeEventForLayer } = await import("@/lib/mirats/so-ly-lich");
    const cd = mapChangeEventForLayer(
      {
        id: "a1",
        at: "2026-07-10T00:00:00Z",
        action: "update",
        userName: "KT",
        changes: [{ key: "ma_serial", label: "Số serial", from: "S1", to: "S2" }],
      },
      "ht", // xem sổ ở layer HỆ THỐNG mà field thuộc layer TÀI SẢN
    );
    const items = buildRecordTimeline({ changeEvents: [cd] });
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe("cd");
    expect(items[0].title).toMatch(/Cập nhật 1 trường/);
    expect(items[0].desc).toMatch(/^\[chỉ đọc từ layer khác\]/);
  });
});
