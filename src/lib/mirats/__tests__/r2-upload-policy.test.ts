import { describe, it, expect } from "vitest";
import { assertUploadAllowed, withKeyPrefix, MAX_SIZE } from "../r2-upload-policy";
import { mirrorKey, shouldMirror } from "@/lib/storage/mirror-r2";

describe("assertUploadAllowed", () => {
  it("cho phép ảnh JPEG hợp lệ", () => {
    expect(() =>
      assertUploadAllowed({
        category: "image",
        contentType: "image/jpeg",
        size: 1024,
        originalName: "anh.jpg",
        key: "uploads/anh.jpg",
      }),
    ).not.toThrow();
  });

  it("chặn MIME ngoài allowlist", () => {
    expect(() =>
      assertUploadAllowed({
        category: "image",
        contentType: "image/tiff",
        size: 10,
        originalName: "a.tif",
        key: "uploads/a.tif",
      }),
    ).toThrow(/không được hỗ trợ/i);
  });

  it("chặn tệp thực thi dù MIME sạch", () => {
    expect(() =>
      assertUploadAllowed({
        category: "other",
        contentType: "application/octet-stream",
        size: 10,
        originalName: "virus.exe",
        key: "uploads/virus.exe",
      }),
    ).toThrow(/\.exe/);
  });

  it("chặn tệp rỗng và tệp vượt hạn mức", () => {
    expect(() =>
      assertUploadAllowed({ category: "image", size: 0, key: "uploads/a.png" }),
    ).toThrow(/rỗng/);
    expect(() =>
      assertUploadAllowed({
        category: "image",
        contentType: "image/png",
        size: MAX_SIZE.image + 1,
        key: "uploads/a.png",
      }),
    ).toThrow(/giới hạn/);
  });
});

describe("withKeyPrefix", () => {
  it("ghép tiền tố và idempotent", () => {
    expect(withKeyPrefix("mirats/", "uploads/a.png")).toBe("mirats/uploads/a.png");
    expect(withKeyPrefix("mirats", "mirats/uploads/a.png")).toBe("mirats/uploads/a.png");
    expect(withKeyPrefix("", "uploads/a.png")).toBe("uploads/a.png");
    expect(withKeyPrefix(null, "/uploads/a.png")).toBe("uploads/a.png");
  });
});

describe("mirror R2", () => {
  it("chỉ nhân bản khi chế độ có R2", () => {
    expect(shouldMirror({ primary: "supabase", dualWrite: true, autoFallback: true })).toBe(true);
    expect(shouldMirror({ primary: "r2", dualWrite: false, autoFallback: true })).toBe(true);
    expect(shouldMirror({ primary: "supabase", dualWrite: false, autoFallback: true })).toBe(false);
  });

  it("khoá nhân bản an toàn, không path traversal", () => {
    expect(mirrorKey("avatars", "u1/a.png")).toBe("attachments/avatars/u1/a.png");
    expect(mirrorKey("avatars", "../../etc/passwd")).toBe("attachments/avatars/etc/passwd");
  });
});
