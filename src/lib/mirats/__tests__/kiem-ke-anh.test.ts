import { describe, it, expect, vi } from "vitest";
import { ghiKiemKeVoiAnh, type KiemKeVoiAnhDeps } from "../kiem-ke";

function makeDeps(over: Partial<KiemKeVoiAnhDeps> = {}): KiemKeVoiAnhDeps {
  return {
    upload: vi.fn(async () => "kiem-ke/tb-1/anh.jpg"),
    rpc: vi.fn(async () => ({ id: "kk-1" })),
    remove: vi.fn(async () => {}),
    ...over,
  };
}

const file = { name: "anh.jpg", type: "image/jpeg" } as unknown as File;

describe("ghiKiemKeVoiAnh — điều phối upload + RPC + dọn file mồ côi", () => {
  it("thành công: upload rồi ghi kiểm kê với anh_url, không xoá file", async () => {
    const deps = makeDeps();
    await ghiKiemKeVoiAnh("tb-1", { tinhTrang: "Bình thường" }, file, deps);
    expect(deps.upload).toHaveBeenCalledTimes(1);
    expect(deps.rpc).toHaveBeenCalledWith(
      expect.objectContaining({ thietBiId: "tb-1", anhUrl: "kiem-ke/tb-1/anh.jpg" }),
    );
    expect(deps.remove).not.toHaveBeenCalled();
  });

  it("RPC lỗi sau khi đã upload → xoá file mồ côi rồi ném lỗi", async () => {
    const deps = makeDeps({
      rpc: vi.fn(async () => {
        throw new Error("RLS chặn");
      }),
    });
    await expect(ghiKiemKeVoiAnh("tb-1", { tinhTrang: "Bình thường" }, file, deps)).rejects.toThrow(
      "RLS chặn",
    );
    expect(deps.remove).toHaveBeenCalledWith("kiem-ke/tb-1/anh.jpg");
  });

  it("không có ảnh: không upload, không xoá, vẫn ghi kiểm kê với anh_url null", async () => {
    const deps = makeDeps();
    await ghiKiemKeVoiAnh("tb-1", { tinhTrang: "Cần theo dõi" }, null, deps);
    expect(deps.upload).not.toHaveBeenCalled();
    expect(deps.remove).not.toHaveBeenCalled();
    expect(deps.rpc).toHaveBeenCalledWith(expect.objectContaining({ anhUrl: null }));
  });

  it("RPC lỗi nhưng xoá file cũng lỗi → vẫn ném lỗi gốc của RPC", async () => {
    const deps = makeDeps({
      rpc: vi.fn(async () => {
        throw new Error("lỗi gốc");
      }),
      remove: vi.fn(async () => {
        throw new Error("xoá lỗi");
      }),
    });
    await expect(ghiKiemKeVoiAnh("tb-1", { tinhTrang: "Bình thường" }, file, deps)).rejects.toThrow(
      "lỗi gốc",
    );
  });
});
