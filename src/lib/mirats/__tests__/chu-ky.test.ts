import { describe, it, expect } from "vitest";
import {
  isValidSignatureDataUrl,
  dataUrlToBlob,
  buildChuKyPath,
  CHU_KY_BUCKET,
} from "../chu-ky";

// PNG 1x1 trong suốt (base64 hợp lệ)
const PNG_1x1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

describe("isValidSignatureDataUrl", () => {
  it("nhận dataURL ảnh PNG hợp lệ", () => {
    expect(isValidSignatureDataUrl(PNG_1x1)).toBe(true);
  });
  it("nhận PNG/JPEG", () => {
    expect(isValidSignatureDataUrl("data:image/jpeg;base64,AAAA")).toBe(true);
  });
  it("từ chối chuỗi rỗng / null / văn bản thường", () => {
    expect(isValidSignatureDataUrl("")).toBe(false);
    expect(isValidSignatureDataUrl(null)).toBe(false);
    expect(isValidSignatureDataUrl(undefined)).toBe(false);
    expect(isValidSignatureDataUrl("xin chào")).toBe(false);
    expect(isValidSignatureDataUrl("data:text/plain;base64,AAAA")).toBe(false);
  });
});

describe("dataUrlToBlob", () => {
  it("chuyển dataURL PNG thành Blob đúng mime và có dữ liệu", () => {
    const blob = dataUrlToBlob(PNG_1x1);
    expect(blob.type).toBe("image/png");
    expect(blob.size).toBeGreaterThan(0);
  });
  it("ném lỗi khi dataURL không hợp lệ", () => {
    expect(() => dataUrlToBlob("không phải dataurl")).toThrow();
  });
});

describe("buildChuKyPath", () => {
  it("gom theo thư mục tài sản và có đuôi .png", () => {
    const p = buildChuKyPath("tb-123");
    expect(p.startsWith("tb-123/")).toBe(true);
    expect(p.endsWith(".png")).toBe(true);
  });
  it("mỗi lần gọi cho một đường dẫn khác nhau", () => {
    expect(buildChuKyPath("tb-1")).not.toBe(buildChuKyPath("tb-1"));
  });
  it("có giá trị mặc định khi thiếu id", () => {
    expect(buildChuKyPath("")).toMatch(/^unknown\/.+\.png$/);
  });
});

describe("CHU_KY_BUCKET", () => {
  it("đặt tên bucket chữ ký", () => {
    expect(CHU_KY_BUCKET).toBe("chu-ky");
  });
});
