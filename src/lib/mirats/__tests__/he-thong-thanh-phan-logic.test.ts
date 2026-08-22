import { describe, it, expect } from "vitest";
import { rankEligibleDevices, rankChonDevices } from "../he-thong-thanh-phan";

describe("he-thong-thanh-phan logic", () => {
  it("rankEligibleDevices matches loaiYeuCau", () => {
    const ranh = [
      { id: "1", loai_thiet_bi_id: "A" },
      { id: "2", loai_thiet_bi_id: "B" },
    ];
    const ranked = rankEligibleDevices(ranh, "A");
    expect(ranked[0].id).toBe("1");
    expect(ranked[0].khopLoai).toBe(true);
    expect(ranked[1].khopLoai).toBe(false);
  });

  it("rankChonDevices prioritizes non-dangLap", () => {
    const list = [
      { id: "1", loai_thiet_bi_id: "A", dangLap: true },
      { id: "2", loai_thiet_bi_id: "A", dangLap: false },
    ];
    const ranked = rankChonDevices(list, "A");
    expect(ranked[0].id).toBe("2");
  });
});
