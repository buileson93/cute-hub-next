import { describe, it, expect } from "vitest";
import {
  buildSteps,
  needsOcr,
  ocrSummary,
  resolveStorageProvider,
  storageProviderLabel,
  validateFile,
  type FileProcessState,
} from "./file-process";

function makeState(over: Partial<FileProcessState> = {}): FileProcessState {
  return {
    id: "f1",
    fileName: "scan.pdf",
    fileSize: 1024,
    fileType: "application/pdf",
    phase: "selected",
    progress: 0,
    ocr: null,
    storageProvider: null,
    errorMessage: null,
    ...over,
  };
}

describe("validateFile", () => {
  it("chặn tệp rỗng và tệp quá lớn", () => {
    expect(validateFile({ name: "a.pdf", size: 0, type: "" }, { maxBytes: 10 }).ok).toBe(false);
    expect(validateFile({ name: "a.pdf", size: 20, type: "" }, { maxBytes: 10 }).ok).toBe(false);
  });

  it("kiểm tra đuôi tệp không phụ thuộc MIME của trình duyệt", () => {
    const rules = { maxBytes: 100, accept: [".pdf"] } as const;
    expect(validateFile({ name: "a.PDF", size: 10, type: "" }, rules).ok).toBe(true);
    expect(validateFile({ name: "a.exe", size: 10, type: "application/pdf" }, rules).ok).toBe(false);
  });
});

describe("needsOcr", () => {
  it("chỉ bật OCR khi PDF gần như không có văn bản", () => {
    expect(needsOcr(5, 3)).toBe(true);
    expect(needsOcr(5000, 3)).toBe(false);
    expect(needsOcr(0, 0)).toBe(false);
  });
});

describe("resolveStorageProvider", () => {
  it("ánh xạ đúng theo cấu hình thực tế, không bịa provider", () => {
    expect(resolveStorageProvider({ primary: "supabase", dualWrite: false })).toBe("supabase");
    expect(resolveStorageProvider({ primary: "r2", dualWrite: false })).toBe("r2");
    expect(resolveStorageProvider({ primary: "supabase", dualWrite: true })).toBe("dual");
    expect(resolveStorageProvider(null)).toBeNull();
    expect(storageProviderLabel(null)).toBe("Đã lưu trữ thành công");
  });
});

describe("buildSteps", () => {
  it("bỏ bước PDF cho tệp không phải PDF", () => {
    const steps = buildSteps(makeState({ fileName: "a.png", fileType: "image/png" }));
    expect(steps.some((s) => s.key === "ocr")).toBe(false);
  });

  it("đánh dấu OCR là skipped khi PDF có text layer", () => {
    const steps = buildSteps(makeState({ phase: "uploading", ocr: { kind: "not-needed" } }));
    expect(steps.find((s) => s.key === "ocr")?.state).toBe("skipped");
    expect(steps.find((s) => s.key === "uploading")?.state).toBe("active");
  });

  it("OCR lỗi chỉ là cảnh báo, upload vẫn tiếp tục", () => {
    const state = makeState({ phase: "uploading", ocr: { kind: "failed", message: "worker lỗi" } });
    expect(buildSteps(state).find((s) => s.key === "ocr")?.state).toBe("warning");
    expect(ocrSummary(state.ocr)).toContain("OCR thất bại");
  });

  it("pha failed đánh dấu đúng bước đang lỗi", () => {
    const steps = buildSteps(makeState({ phase: "failed", errorMessage: "mất mạng" }));
    expect(steps.find((s) => s.key === "done")?.state).toBe("failed");
  });

  it("hoàn tất thì mọi bước chính đều completed", () => {
    const steps = buildSteps(
      makeState({ phase: "completed", ocr: { kind: "extracted", text: "x", pages: 2, truncated: false } }),
    );
    expect(steps.filter((s) => s.state === "pending")).toHaveLength(0);
  });
});
