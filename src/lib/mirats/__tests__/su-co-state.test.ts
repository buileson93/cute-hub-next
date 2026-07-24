import { describe, it, expect } from "vitest";
import {
  SU_CO_STATES,
  OPEN_STATES,
  CLOSED_STATES,
  ALLOWED_TRANSITIONS,
  isOpenState,
  isClosedState,
  canTransition,
  canManageSuCoState,
  canClose,
  canCloseFrom,
  canFinalize,
  canReopen,
  countOpenIncidents,
  openIncidents,
  type SuCoState,
} from "@/lib/mirats/su-co-state";
import type { AppRole } from "@/hooks/use-session";
import type { SuCo } from "@/lib/mirats/types";

function mkSuCo(over: Partial<SuCo> = {}): SuCo {
  return {
    ma_su_co: "SC-001",
    thiet_bi: "TB-001",
    thiet_bi_id: "id-1",
    he_thong: "HT-001",
    he_thong_id: "hid-1",
    don_vi: "CRA",
    ngay_phat_hien: "2026-07-01",
    nguoi_bao_cao: "A",
    muc_do: "Cao",
    anh_huong_dhb: "Không ảnh hưởng",
    hien_tuong: "Lỗi",
    nguyen_nhan: null,
    bien_phap_xu_ly: null,
    thoi_diem_khac_phuc: null,
    thoi_gian_gian_doan: null,
    nguoi_xu_ly: [],
    trang_thai: "Mới",
    lien_ket_hong_hoc: null,
    file_dinh_kem: null,
    bao_cao_ban_dau: null,
    ma_nhom_bc: null,
    snapshot_ma_thiet_bi: null,
    snapshot_ten_thiet_bi: null,
    snapshot_he_thong: null,
    snapshot_don_vi: null,
    snapshot_vi_tri: null,
    ...over,
  } as SuCo;
}

describe("su-co-state — phân loại trạng thái", () => {
  it("Mới & Đang xử lý là trạng thái đang mở", () => {
    expect(isOpenState("Mới")).toBe(true);
    expect(isOpenState("Đang xử lý")).toBe(true);
    expect(OPEN_STATES.has("Mới")).toBe(true);
  });

  it("Đã khắc phục & Đóng là trạng thái đã kết thúc (không mở)", () => {
    expect(isOpenState("Đã khắc phục")).toBe(false);
    expect(isOpenState("Đóng")).toBe(false);
    expect(isClosedState("Đã khắc phục")).toBe(true);
    expect(isClosedState("Đóng")).toBe(true);
    expect(CLOSED_STATES.has("Đóng")).toBe(true);
  });

  it("chuỗi rỗng / null không phải trạng thái mở hay đóng", () => {
    expect(isOpenState("")).toBe(false);
    expect(isOpenState(null)).toBe(false);
    expect(isClosedState(undefined)).toBe(false);
  });

  it("mọi trạng thái đều thuộc đúng một nhóm mở/đóng", () => {
    for (const st of SU_CO_STATES) {
      expect(isOpenState(st) !== isClosedState(st)).toBe(true);
    }
  });
});

describe("su-co-state — chuyển trạng thái hợp lệ", () => {
  it("bám đúng bản đồ ALLOWED_TRANSITIONS", () => {
    for (const from of SU_CO_STATES) {
      for (const to of SU_CO_STATES) {
        const expected = from !== to && ALLOWED_TRANSITIONS[from].includes(to as SuCoState);
        expect(canTransition(from, to)).toBe(expected);
      }
    }
  });

  it("cho phép các bước vòng đời chính", () => {
    expect(canTransition("Mới", "Đang xử lý")).toBe(true);
    expect(canTransition("Đang xử lý", "Đã khắc phục")).toBe(true);
    expect(canTransition("Đã khắc phục", "Đóng")).toBe(true);
  });

  it("cho phép mở lại từ trạng thái đã kết thúc về Đang xử lý", () => {
    expect(canTransition("Đóng", "Đang xử lý")).toBe(true);
    expect(canTransition("Đã khắc phục", "Đang xử lý")).toBe(true);
  });

  it("chặn chuyển vô lý & tự chuyển về chính nó", () => {
    expect(canTransition("Đóng", "Mới")).toBe(false);
    expect(canTransition("Mới", "Mới")).toBe(false);
    expect(canTransition("Đã khắc phục", "Mới")).toBe(false);
    expect(canTransition("khác", "Đóng")).toBe(false);
    expect(canTransition("Mới", "xyz")).toBe(false);
  });
});

describe("su-co-state — quyền đóng / mở lại (đồng bộ can_manage_equipment)", () => {
  const manager: AppRole[] = ["phong_kt"];
  const adminRoles: AppRole[] = ["admin"];
  const unitUser: AppRole[] = ["phu_trach_dv", "ktv"];

  it("chỉ admin / phong_kt được chỉnh trạng thái", () => {
    expect(canManageSuCoState(adminRoles)).toBe(true);
    expect(canManageSuCoState(manager)).toBe(true);
    expect(canManageSuCoState(unitUser)).toBe(false);
    expect(canManageSuCoState([])).toBe(false);
    expect(canManageSuCoState(null)).toBe(false);
  });

  it("người quản lý đóng được sự cố đang mở, không đóng sự cố đã kết thúc", () => {
    expect(canCloseFrom(manager, "Mới")).toBe(true);
    expect(canCloseFrom(manager, "Đang xử lý")).toBe(true);
    expect(canCloseFrom(manager, "Đóng")).toBe(false);
  });

  it("người dùng đơn vị KHÔNG được đóng dù sự cố đang mở", () => {
    expect(canCloseFrom(unitUser, "Mới")).toBe(false);
  });

  it("mở lại chỉ áp dụng cho trạng thái đã kết thúc & người quản lý", () => {
    expect(canReopen(manager, "Đóng")).toBe(true);
    expect(canReopen(manager, "Đã khắc phục")).toBe(true);
    expect(canReopen(manager, "Mới")).toBe(false);
    expect(canReopen(unitUser, "Đóng")).toBe(false);
  });
});

describe("su-co-state — ràng buộc thoi_diem_khac_phuc & đóng hồ sơ", () => {
  const manager: AppRole[] = ["phong_kt"];
  const adminRoles: AppRole[] = ["admin"];
  const unitUser: AppRole[] = ["phu_trach_dv", "ktv"];

  it("canClose: chỉ true khi row đã có thoi_diem_khac_phuc", () => {
    expect(canClose(mkSuCo({ thoi_diem_khac_phuc: null }))).toBe(false);
    expect(canClose(mkSuCo({ thoi_diem_khac_phuc: "" }))).toBe(false);
    expect(canClose(mkSuCo({ thoi_diem_khac_phuc: "   " }))).toBe(false);
    expect(canClose(mkSuCo({ thoi_diem_khac_phuc: "2026-07-01T10:00" }))).toBe(true);
    expect(canClose(null)).toBe(false);
    expect(canClose(undefined)).toBe(false);
  });

  it("canFinalize: chỉ true khi đang 'Đã khắc phục' & có quyền quản lý", () => {
    const dkp = mkSuCo({ trang_thai: "Đã khắc phục", thoi_diem_khac_phuc: "2026-07-01T10:00" });
    expect(canFinalize(dkp, adminRoles)).toBe(true);
    expect(canFinalize(dkp, manager)).toBe(true);
    expect(canFinalize(dkp, unitUser)).toBe(false);
    expect(canFinalize(dkp, [])).toBe(false);
    expect(canFinalize(dkp, null)).toBe(false);
    // Sai trạng thái
    expect(canFinalize(mkSuCo({ trang_thai: "Mới" }), adminRoles)).toBe(false);
    expect(canFinalize(mkSuCo({ trang_thai: "Đang xử lý" }), adminRoles)).toBe(false);
    expect(canFinalize(mkSuCo({ trang_thai: "Đóng" }), adminRoles)).toBe(false);
    expect(canFinalize(null, adminRoles)).toBe(false);
  });
});

describe("su-co-state — bộ đếm dùng chung cho badge & Dashboard", () => {
  const list = [
    mkSuCo({ ma_su_co: "A", trang_thai: "Mới" }),
    mkSuCo({ ma_su_co: "B", trang_thai: "Đang xử lý" }),
    mkSuCo({ ma_su_co: "C", trang_thai: "Đã khắc phục" }),
    mkSuCo({ ma_su_co: "D", trang_thai: "Đóng" }),
  ];

  it("đếm đúng số sự cố đang mở", () => {
    expect(countOpenIncidents(list)).toBe(2);
    expect(openIncidents(list).map((s) => s.ma_su_co)).toEqual(["A", "B"]);
  });

  it("Đóng KHÔNG bị tính là đang mở (khác cách so sánh cũ)", () => {
    // Cách cũ dùng `trang_thai !== "Đã khắc phục"` sẽ đếm cả "Đóng" → 3 (sai).
    const legacyOpen = list.filter((s) => s.trang_thai !== "Đã khắc phục").length;
    expect(legacyOpen).toBe(3);
    expect(countOpenIncidents(list)).toBe(2);
  });
});
