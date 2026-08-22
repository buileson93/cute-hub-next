import { describe, it, expect } from "vitest";
import { resolveDeviceIdentity, type LiveDeviceInfo } from "@/lib/mirats/record-snapshot";

describe("resolveDeviceIdentity", () => {
  const live: Record<string, LiveDeviceInfo> = {
    "id-1": {
      ma_thiet_bi: "TB-001",
      ten: "Máy tính A",
      he_thong: "HT Radar",
      don_vi: "Đơn vị 1",
      vi_tri: "Phòng 101",
    },
  };
  const getLive = (id: string) => live[id];

  it("ưu tiên liên kết hiện tại (live) khi tài sản còn", () => {
    const r = resolveDeviceIdentity(
      {
        deviceId: "id-1",
        snapshot_ma_thiet_bi: "TB-OLD",
        snapshot_ten_thiet_bi: "Tên cũ",
      },
      getLive,
    );
    expect(r.source).toBe("live");
    expect(r.ma).toBe("TB-001");
    expect(r.ten).toBe("Máy tính A");
    expect(r.heThong).toBe("HT Radar");
  });

  it("dự phòng bằng snapshot khi liên kết đã mất", () => {
    const r = resolveDeviceIdentity(
      {
        deviceId: "id-missing",
        snapshot_ma_thiet_bi: "TB-002",
        snapshot_ten_thiet_bi: "Switch B",
        snapshot_he_thong: "HT Mạng",
        snapshot_don_vi: "Đơn vị 2",
        snapshot_vi_tri: "Tủ rack 3",
      },
      getLive,
    );
    expect(r.source).toBe("snapshot");
    expect(r.ma).toBe("TB-002");
    expect(r.viTri).toBe("Tủ rack 3");
  });

  it("dùng snapshot khi không có hàm tra live", () => {
    const r = resolveDeviceIdentity({
      deviceId: "id-1",
      snapshot_ma_thiet_bi: "TB-003",
    });
    expect(r.source).toBe("snapshot");
    expect(r.ma).toBe("TB-003");
  });

  it("fallback text lịch sử khi không có id và snapshot", () => {
    const r = resolveDeviceIdentity({ deviceText: "TB-LEGACY" }, getLive);
    expect(r.source).toBe("text");
    expect(r.ma).toBe("TB-LEGACY");
  });

  it("trả unknown khi không có gì", () => {
    const r = resolveDeviceIdentity({}, getLive);
    expect(r.source).toBe("unknown");
    expect(r.ma).toBe("");
  });

  it("bỏ qua live rỗng và rơi xuống snapshot", () => {
    const r = resolveDeviceIdentity(
      { deviceId: "id-empty", snapshot_ma_thiet_bi: "TB-004" },
      () => ({ ma_thiet_bi: "", ten: "" }),
    );
    expect(r.source).toBe("snapshot");
    expect(r.ma).toBe("TB-004");
  });
});
