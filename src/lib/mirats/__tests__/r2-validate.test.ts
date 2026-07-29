import { describe, it, expect } from "vitest";
import { validateR2Config, hasBlockingIssue } from "../r2-validate";
import { describeRpcError, rpcErrorToast } from "../rpc-error";

const base = {
  enabled: true,
  endpoint: "https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com",
  accountId: "0123456789abcdef0123456789abcdef",
  bucketName: "mirats-files",
  keyPrefix: "mirats/",
  publicBaseUrl: "",
  accessKeyId: "AK123",
  secretAccessKey: "SK123",
};

describe("validateR2Config", () => {
  it("cấu hình đúng thì không có lỗi chặn", () => {
    expect(hasBlockingIssue(validateR2Config(base))).toBe(false);
  });

  it("chặn endpoint không phải https / có đường dẫn", () => {
    expect(hasBlockingIssue(validateR2Config({ ...base, endpoint: "http://x.r2.cloudflarestorage.com" }))).toBe(true);
    expect(hasBlockingIssue(validateR2Config({ ...base, endpoint: base.endpoint + "/mirats-files" }))).toBe(true);
    expect(hasBlockingIssue(validateR2Config({ ...base, endpoint: "khong-phai-url" }))).toBe(true);
  });

  it("chặn tên bucket sai định dạng và thiếu khoá", () => {
    expect(hasBlockingIssue(validateR2Config({ ...base, bucketName: "Bucket_Sai" }))).toBe(true);
    expect(hasBlockingIssue(validateR2Config({ ...base, secretAccessKey: "", hasStoredSecret: false }))).toBe(true);
    expect(hasBlockingIssue(validateR2Config({ ...base, secretAccessKey: "", hasStoredSecret: true }))).toBe(false);
  });

  it("khi R2 tắt thì thiếu tham số chỉ là cảnh báo", () => {
    const issues = validateR2Config({ ...base, enabled: false, endpoint: "", bucketName: "", accessKeyId: "", secretAccessKey: "" });
    expect(hasBlockingIssue(issues)).toBe(false);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("cảnh báo prefix không kết thúc bằng /", () => {
    const issues = validateR2Config({ ...base, keyPrefix: "mirats" });
    expect(issues.some((i) => i.field === "keyPrefix" && i.level === "warning")).toBe(true);
  });
});

describe("describeRpcError", () => {
  it("nhận diện hàm không tồn tại và nêu đủ mã lỗi, tên hàm, payload", () => {
    const info = describeRpcError("ghi_su_co_atomic", { p_payload: { ma_nhom_bc: "X" } }, {
      code: "PGRST202",
      message: "Could not find the function public.ghi_su_co_atomic(p_payload) in the schema cache",
      hint: "Perhaps you meant ghi_kiem_ke",
      details: null,
    });
    expect(info.missingFunction).toBe(true);
    expect(info.code).toBe("PGRST202");
    expect(info.text).toContain("ghi_su_co_atomic");
    expect(info.text).toContain("p_payload");
    expect(info.text).toContain("ma_nhom_bc");
  });

  it("che giá trị nhạy cảm trong payload", () => {
    const info = describeRpcError("f", { secret_access_key: "abcdef123456" }, { code: "42501", message: "denied" });
    expect(info.text).not.toContain("abcdef123456");
    expect(info.missingFunction).toBe(false);
  });

  it("tách tiêu đề/mô tả cho toast", () => {
    const t = rpcErrorToast(new Error("Dòng 1\nDòng 2\nDòng 3"));
    expect(t.title).toBe("Dòng 1");
    expect(t.description).toContain("Dòng 3");
  });
});
