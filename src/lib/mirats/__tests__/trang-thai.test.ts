import { describe, it, expect } from "vitest";
import {
  statuses,
  phaseOf,
  isOpen,
  labelOf,
  normalizeLegacy,
  storedValuesFor,
  type Domain,
} from "@/lib/mirats/trang-thai";

const ALL: Domain[] = ["su_co", "van_de", "cong_viec", "hong_hoc", "ban_giao", "bao_tri"];

describe("trang-thai — statuses / phaseOf / isOpen / labelOf", () => {
  it("mọi domain đều khai báo ít nhất 1 trạng thái open và 1 closed/cancelled", () => {
    for (const d of ALL) {
      const list = statuses(d);
      expect(list.length).toBeGreaterThan(0);
      const hasOpen = list.some((s) => s.phase === "open" || s.phase === "in_progress");
      const hasEnd = list.some((s) => s.phase === "closed" || s.phase === "cancelled");
      expect(hasOpen).toBe(true);
      expect(hasEnd).toBe(true);
    }
  });

  it("phaseOf trả về đúng cho mã đã biết, null cho mã lạ", () => {
    expect(phaseOf("su_co", "moi")).toBe("open");
    expect(phaseOf("su_co", "dang_xu_ly")).toBe("in_progress");
    expect(phaseOf("su_co", "da_khac_phuc")).toBe("closed");
    expect(phaseOf("su_co", "dong")).toBe("closed");
    expect(phaseOf("cong_viec", "huy")).toBe("cancelled");
    expect(phaseOf("su_co", "khong-ton-tai")).toBeNull();
  });

  it("isOpen = true khi phase là open/in_progress; false khi closed/cancelled", () => {
    expect(isOpen("su_co", "dang_xu_ly")).toBe(true);
    expect(isOpen("su_co", "moi")).toBe(true);
    expect(isOpen("su_co", "da_khac_phuc")).toBe(false);
    expect(isOpen("su_co", "dong")).toBe(false);
    expect(isOpen("cong_viec", "huy")).toBe(false);
    expect(isOpen("van_de", "dong")).toBe(false);
    expect(isOpen("van_de", "dang_phan_tich")).toBe(true);
    expect(isOpen("su_co", "unknown")).toBe(false);
  });

  it("labelOf trả về nhãn VN cho mã chuẩn", () => {
    expect(labelOf("su_co", "da_khac_phuc")).toBe("Đã khắc phục");
    expect(labelOf("cong_viec", "hoan_thanh")).toBe("Hoàn thành");
    expect(labelOf("ban_giao", "da_tra")).toBe("Đã trả");
  });
});

describe("trang-thai — normalizeLegacy ánh xạ mọi biến thể stored", () => {
  it("su_co: nhãn VN → code chuẩn", () => {
    expect(normalizeLegacy("su_co", "Đã khắc phục")).toBe("da_khac_phuc");
    expect(normalizeLegacy("su_co", "Mới")).toBe("moi");
    expect(normalizeLegacy("su_co", "Đang xử lý")).toBe("dang_xu_ly");
    expect(normalizeLegacy("su_co", "Đóng")).toBe("dong");
  });

  it("cong_viec: UPPER_SNAKE → code chuẩn", () => {
    expect(normalizeLegacy("cong_viec", "HOAN_THANH")).toBe("hoan_thanh");
    expect(normalizeLegacy("cong_viec", "MO")).toBe("mo");
    expect(normalizeLegacy("cong_viec", "DANG_LAM")).toBe("dang_lam");
    expect(normalizeLegacy("cong_viec", "HUY")).toBe("huy");
  });

  it("van_de: giữ nguyên code snake_case đã chuẩn", () => {
    expect(normalizeLegacy("van_de", "dong")).toBe("dong");
    expect(normalizeLegacy("van_de", "dang_phan_tich")).toBe("dang_phan_tich");
    // VN biến thể vẫn chuẩn hoá được
    expect(normalizeLegacy("van_de", "Đóng")).toBe("dong");
  });

  it("hong_hoc & ban_giao ánh xạ đúng", () => {
    expect(normalizeLegacy("hong_hoc", "Hoàn thành")).toBe("hoan_thanh");
    expect(normalizeLegacy("hong_hoc", "Đang xử lý")).toBe("dang_xu_ly");
    expect(normalizeLegacy("hong_hoc", "Mới")).toBe("moi");
    expect(normalizeLegacy("ban_giao", "Đang mượn")).toBe("dang_muon");
    expect(normalizeLegacy("ban_giao", "Đang giữ")).toBe("dang_giu");
    expect(normalizeLegacy("ban_giao", "Đã trả")).toBe("da_tra");
  });

  it("chuỗi rỗng → chuỗi rỗng; chuỗi lạ giữ nguyên", () => {
    expect(normalizeLegacy("su_co", "")).toBe("");
    expect(normalizeLegacy("su_co", "  ")).toBe("");
    expect(normalizeLegacy("su_co", "khong-biet")).toBe("khong-biet");
  });

  it("case-insensitive fallback (an toàn nếu DB có biến thể chữ)", () => {
    expect(normalizeLegacy("cong_viec", "hoan_thanh")).toBe("hoan_thanh");
    expect(normalizeLegacy("cong_viec", "Hoan_Thanh")).toBe("hoan_thanh");
  });
});

describe("trang-thai — storedValuesFor (dùng để derive OPEN/CLOSED_STATES)", () => {
  it("gom mọi biến thể stored theo phase", () => {
    const openSuCo = storedValuesFor("su_co", ["open", "in_progress"]);
    expect(openSuCo.has("Mới")).toBe(true);
    expect(openSuCo.has("Đang xử lý")).toBe(true);
    expect(openSuCo.has("Đã khắc phục")).toBe(false);

    const closedCv = storedValuesFor("cong_viec", ["closed", "cancelled"]);
    expect(closedCv.has("HOAN_THANH")).toBe(true);
    expect(closedCv.has("HUY")).toBe(true);
    expect(closedCv.has("MO")).toBe(false);
  });
});
