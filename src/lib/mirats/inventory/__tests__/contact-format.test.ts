import { describe, it, expect } from "vitest";
import {
  buildContacts,
  buildMetaItems,
  formatContactsForExport,
  toDisplayString,
} from "../contact-format";

describe("contact-format", () => {
  it("bỏ giá trị rỗng và trùng lặp khi dựng danh sách liên hệ", () => {
    expect(buildContacts({})).toEqual([]);
    const contacts = buildContacts({
      donViQuanLy: "  Đài CRA  ",
      nhaCungCap: "đài cra",
      nhaSanXuat: "Thales",
    });
    expect(contacts.map((c) => c.role)).toEqual(["Đơn vị quản lý", "Hãng sản xuất"]);
    expect(contacts[0].name).toBe("Đài CRA");
    expect(formatContactsForExport(contacts)).toBe(
      "Đơn vị quản lý: Đài CRA; Hãng sản xuất: Thales",
    );
  });

  it("không render [object Object] với dữ liệu quan hệ/mảng", () => {
    expect(toDisplayString({ ten: "Công ty A" })).toBe("Công ty A");
    expect(toDisplayString([{ ten: "A" }, { ten: "B" }])).toBe("A; B");
    expect(toDisplayString(null)).toBe("");
  });

  it("metadata bỏ dòng rỗng và không lặp giá trị đang hiển thị", () => {
    const items = buildMetaItems(
      [
        { label: "Model", value: "RDR-2000" },
        { label: "P/N", value: "" },
        { label: "Hãng SX", value: "Thales" },
      ],
      ["rdr-2000"],
    );
    expect(items).toEqual([{ label: "Hãng SX", value: "Thales" }]);
  });
});
