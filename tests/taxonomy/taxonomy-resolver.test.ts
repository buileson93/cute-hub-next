
import { 
  resolveDeviceDisplayIdentity, 
  type DbDevice 
} from "@/lib/mirats/db-taxonomy";
import { describe, it, expect } from "vitest";

describe("resolveDeviceDisplayIdentity", () => {
  const mockDevice = (overrides: Partial<DbDevice> = {}): DbDevice => ({
    id: "device-uuid",
    ma_thiet_bi: "TB_001",
    ten: "Asset Name",
    _thanhPhanId: "tp-uuid",
    _thanhPhanMa: "TP_001",
    _thanhPhanTen: "Component Name",
    _modelTen: "Model X",
    _loaiTbTen: "Type Y",
    ...overrides
  } as DbDevice);

  it("prioritizes component name as primary label", () => {
    const d = mockDevice();
    const identity = resolveDeviceDisplayIdentity(d);
    expect(identity.primaryLabel).toBe("Component Name");
    expect(identity.source).toBe("component");
  });

  it("falls back to asset name if component name is missing", () => {
    const d = mockDevice({ _thanhPhanTen: "" });
    const identity = resolveDeviceDisplayIdentity(d);
    expect(identity.primaryLabel).toBe("Asset Name");
    expect(identity.source).toBe("asset");
  });

  it("falls back to model name if asset name is missing", () => {
    const d = mockDevice({ _thanhPhanTen: "", ten: "" });
    const identity = resolveDeviceDisplayIdentity(d);
    expect(identity.primaryLabel).toBe("Model X");
    expect(identity.source).toBe("model");
  });

  it("falls back to type name if model name is missing", () => {
    const d = mockDevice({ _thanhPhanTen: "", ten: "", _modelTen: "" });
    const identity = resolveDeviceDisplayIdentity(d);
    expect(identity.primaryLabel).toBe("Type Y");
    expect(identity.source).toBe("type");
  });

  it("returns 'Chưa có tên' if all fallbacks fail", () => {
    const d = mockDevice({ _thanhPhanTen: "", ten: "", _modelTen: "", _loaiTbTen: "" });
    const identity = resolveDeviceDisplayIdentity(d);
    expect(identity.primaryLabel).toBe("Chưa có tên");
    expect(identity.source).toBe("missing");
  });

  it("ignores UUID-like strings as primary labels", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const d = mockDevice({ _thanhPhanTen: uuid, ten: "Real Asset Name" });
    const identity = resolveDeviceDisplayIdentity(d);
    expect(identity.primaryLabel).toBe("Real Asset Name");
    expect(identity.source).toBe("asset");
  });
});
