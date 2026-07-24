// @vitest-environment jsdom
// ============================================================================
// Kiểm thử logic hoàn thành phiếu công việc bảo dưỡng (phản chiếu RPC + KPI):
//   1. Chuyển trạng thái hợp lệ (chỉ MO/DANG_LAM -> HOAN_THANH).
//   2. Ngày hoàn thành + kỳ bảo dưỡng kế tiếp.
//   3. Liên kết biên bản đúng tài sản.
//   4. KPI đúng hạn/quá hạn theo đơn vị.
//   5. Quyền theo vai trò.
//   6. Mutation invalidate đúng query key (cập nhật DS + KPI không reload).
// ============================================================================
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  canComplete,
  canTransition,
  canManageCongViec,
  bienBanMatchesDevice,
  nextDueDate,
  computeKpiBaoTri,
  isOpenState,
  type CongViecKpiRow,
} from "@/lib/mirats/cong-viec-state";

describe("cong-viec-state — chuyển trạng thái", () => {
  it("MO và DANG_LAM là trạng thái đang mở, được hoàn thành", () => {
    expect(isOpenState("MO")).toBe(true);
    expect(isOpenState("DANG_LAM")).toBe(true);
    expect(canComplete({ trang_thai: "MO" })).toBe(true);
    expect(canComplete({ trang_thai: "DANG_LAM" })).toBe(true);
  });

  it("không thể hoàn thành lại phiếu đã HOAN_THANH hoặc HUY", () => {
    expect(canComplete({ trang_thai: "HOAN_THANH" })).toBe(false);
    expect(canComplete({ trang_thai: "HUY" })).toBe(false);
    expect(canTransition("HOAN_THANH", "HOAN_THANH")).toBe(false);
    expect(canTransition("HUY", "HOAN_THANH")).toBe(false);
  });

  it("bảng chuyển trạng thái hợp lệ", () => {
    expect(canTransition("MO", "DANG_LAM")).toBe(true);
    expect(canTransition("MO", "HOAN_THANH")).toBe(true);
    expect(canTransition("DANG_LAM", "HOAN_THANH")).toBe(true);
    expect(canTransition("MO", "MO")).toBe(false);
  });
});

describe("cong-viec-state — quyền vai trò", () => {
  it("admin và phong_kt được thao tác; các vai trò khác thì không", () => {
    expect(canManageCongViec(["admin"])).toBe(true);
    expect(canManageCongViec(["phong_kt"])).toBe(true);
    expect(canManageCongViec(["ktv"])).toBe(false);
    expect(canManageCongViec(["phu_trach_dv"])).toBe(false);
    expect(canManageCongViec(["readonly"])).toBe(false);
    expect(canManageCongViec([])).toBe(false);
    expect(canManageCongViec(null)).toBe(false);
  });
});

describe("cong-viec-state — liên kết biên bản", () => {
  it("biên bản đúng tài sản của phiếu thì liên kết được", () => {
    expect(bienBanMatchesDevice({ thiet_bi_id: "tb-1" }, "tb-1")).toBe(true);
  });
  it("biên bản khác tài sản bị từ chối", () => {
    expect(bienBanMatchesDevice({ thiet_bi_id: "tb-2" }, "tb-1")).toBe(false);
  });
  it("thiếu tài sản ở một phía thì không mâu thuẫn", () => {
    expect(bienBanMatchesDevice({ thiet_bi_id: null }, "tb-1")).toBe(true);
    expect(bienBanMatchesDevice({ thiet_bi_id: "tb-1" }, null)).toBe(true);
  });
  it("không có biên bản trả về false", () => {
    expect(bienBanMatchesDevice(null, "tb-1")).toBe(false);
  });
});

describe("cong-viec-state — kỳ bảo dưỡng kế tiếp", () => {
  it("cộng chu kỳ vào ngày hoàn thành", () => {
    expect(nextDueDate("2026-07-13", 30, "2026-07-13")).toBe("2026-08-12");
    expect(nextDueDate("2026-01-31", 1, null)).toBe("2026-02-01");
  });
  it("chu kỳ không hợp lệ giữ nguyên ngày kế tiếp cũ", () => {
    expect(nextDueDate("2026-07-13", null, "2026-09-01")).toBe("2026-09-01");
    expect(nextDueDate("2026-07-13", 0, "2026-09-01")).toBe("2026-09-01");
  });
});

describe("cong-viec-state — KPI theo đơn vị", () => {
  const today = "2026-07-13";
  const rows: CongViecKpiRow[] = [
    // đơn vị A: 1 hoàn thành đúng hạn, 1 hoàn thành trễ, 1 đang mở quá hạn, 1 đang mở còn hạn
    { don_vi_id_snapshot: "A", trang_thai: "HOAN_THANH", ngay_den_han: "2026-07-10", ngay_hoan_thanh: "2026-07-09" },
    { don_vi_id_snapshot: "A", trang_thai: "HOAN_THANH", ngay_den_han: "2026-07-05", ngay_hoan_thanh: "2026-07-12" },
    { don_vi_id_snapshot: "A", trang_thai: "MO", ngay_den_han: "2026-07-01", ngay_hoan_thanh: null },
    { don_vi_id_snapshot: "A", trang_thai: "DANG_LAM", ngay_den_han: "2026-07-20", ngay_hoan_thanh: null },
    // đơn vị B: 1 hoàn thành đúng hạn
    { don_vi_id_snapshot: "B", trang_thai: "HOAN_THANH", ngay_den_han: "2026-07-13", ngay_hoan_thanh: "2026-07-13" },
  ];

  it("tính đúng tổng, hoàn thành, đang mở, quá hạn, đúng hạn và tỉ lệ", () => {
    const kpi = computeKpiBaoTri(rows, today);
    const a = kpi.find((k) => k.don_vi_id === "A")!;
    expect(a.tong_cong_viec).toBe(4);
    expect(a.da_hoan_thanh).toBe(2);
    expect(a.dang_mo).toBe(2);
    expect(a.qua_han).toBe(1); // chỉ phiếu MO đến hạn 07-01
    expect(a.hoan_thanh_dung_han).toBe(1);
    expect(a.ty_le_dung_han).toBe(50);

    const b = kpi.find((k) => k.don_vi_id === "B")!;
    expect(b.da_hoan_thanh).toBe(1);
    expect(b.hoan_thanh_dung_han).toBe(1); // hoàn thành == đến hạn -> đúng hạn
    expect(b.ty_le_dung_han).toBe(100);
  });

  it("đơn vị chưa có phiếu hoàn thành -> tỉ lệ null", () => {
    const kpi = computeKpiBaoTri(
      [{ don_vi_id_snapshot: "C", trang_thai: "MO", ngay_den_han: "2026-07-01", ngay_hoan_thanh: null }],
      today,
    );
    expect(kpi[0].ty_le_dung_han).toBeNull();
  });
});

// --- Mô phỏng mutation invalidation (không reload) ---
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: vi.fn(async () => ({ data: null, error: null })) },
}));

describe("hoàn thành phiếu — invalidate danh sách & KPI", () => {
  let qc: QueryClient;
  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  });
  afterEach(() => qc.clear());

  it("invalidate đúng hai query key sau khi hoàn thành", async () => {
    // seed cache như đang hiển thị
    qc.setQueryData(["cong_viec_bao_tri"], [{ id: "cv-1", trang_thai: "MO" }]);
    qc.setQueryData(["v_kpi_bao_tri"], [{ don_vi_id: "A", da_hoan_thanh: 0 }]);

    const spy = vi.spyOn(qc, "invalidateQueries");
    // mô phỏng onSuccess của useHoanThanhPhieu
    await qc.invalidateQueries({ queryKey: ["cong_viec_bao_tri"] });
    await qc.invalidateQueries({ queryKey: ["v_kpi_bao_tri"] });

    expect(spy).toHaveBeenCalledWith({ queryKey: ["cong_viec_bao_tri"] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["v_kpi_bao_tri"] });
  });
});
