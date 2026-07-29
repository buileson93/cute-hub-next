import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// Task: nguy cơ xoá tài sản trong cây — tài sản ĐÃ CÓ LỊCH SỬ không thể bị xoá.
// Kỳ vọng: dịch vụ xoá an toàn KHÔNG xoá trực tiếp tài sản có lịch sử; thay vào
// đó chuyển "Ngừng khai thác" để giữ hồ sơ. Tài sản nhập nhầm (sạch) mới bị xoá.
// ============================================================================

const rpc = vi.fn();
const from = vi.fn();

vi.mock("@/integrations/backend/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpc(...args),
    from: (...args: unknown[]) => from(...args),
  },
}));

import { xoaThietBiAnToan, partitionByHistory } from "../cay-delete";

beforeEach(() => {
  rpc.mockReset();
  from.mockReset();
});

describe("partitionByHistory", () => {
  it("chia đúng theo tập có lịch sử", () => {
    const r = partitionByHistory(["A", "B", "C"], new Set(["B"]));
    expect(r.coLichSu).toEqual(["B"]);
    expect(r.sach).toEqual(["A", "C"]);
  });
});

describe("xoaThietBiAnToan — an toàn dữ liệu", () => {
  it("tài sản CÓ lịch sử KHÔNG bị xoá mà được chuyển Ngừng khai thác", async () => {
    // purge_thiet_bi từ chối tài sản có lịch sử → trả về trong bo_qua.
    rpc.mockImplementation((fn: string) => {
      if (fn === "purge_thiet_bi") {
        return Promise.resolve({ data: { da_xoa: [], bo_qua: ["TB_HIST"] }, error: null });
      }
      if (fn === "ngung_khai_thac_thiet_bi") {
        return Promise.resolve({ data: { so_thiet_bi: 1, trang_thai: "Ngừng khai thác" }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const res = await xoaThietBiAnToan(["TB_HIST"]);

    expect(res.purged).toEqual([]);
    expect(res.retired).toEqual(["TB_HIST"]);

    // KHÔNG được có bất kỳ lời gọi xoá trực tiếp bảng thiet_bi.
    expect(from).not.toHaveBeenCalled();
    // Phải gọi retire cho đúng tài sản có lịch sử.
    const retireCall = rpc.mock.calls.find((c) => c[0] === "ngung_khai_thac_thiet_bi");
    expect(retireCall).toBeTruthy();
    expect((retireCall![1] as { _mas: string[] })._mas).toEqual(["TB_HIST"]);
  });

  it("tài sản SẠCH (nhập nhầm) bị xoá vĩnh viễn, không retire", async () => {
    rpc.mockImplementation((fn: string) => {
      if (fn === "purge_thiet_bi") {
        return Promise.resolve({ data: { da_xoa: ["TB_CLEAN"], bo_qua: [] }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const res = await xoaThietBiAnToan(["TB_CLEAN"]);

    expect(res.purged).toEqual(["TB_CLEAN"]);
    expect(res.retired).toEqual([]);
    expect(rpc.mock.calls.some((c) => c[0] === "ngung_khai_thac_thiet_bi")).toBe(false);
  });

  it("danh sách rỗng: không gọi RPC nào", async () => {
    const res = await xoaThietBiAnToan([]);
    expect(res).toEqual({ purged: [], retired: [] });
    expect(rpc).not.toHaveBeenCalled();
  });
});
