// ============================================================================
// Hook dùng chung điều phối luồng xử lý tệp: kiểm tra → nhận diện PDF scan →
// OCR trên thiết bị (tesseract.js WASM, chạy trong worker của thư viện) →
// tải lên (do call-site cung cấp) → xác nhận nhà cung cấp lưu trữ thực tế.
//
// Tái sử dụng hạ tầng sẵn có: PdfExtractor (pdfjs-dist) và TesseractProvider
// trong src/lib/mirats/document-ocr. Không thêm dependency mới.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchStorageConfig } from "@/lib/mirats/storage-config";
import {
  OCR_MAX_PAGES,
  isPdf,
  needsOcr,
  resolveStorageProvider,
  validateFile,
  type FileProcessState,
  type OcrOutcome,
  type ValidationRules,
} from "./file-process";

export interface UseFileProcessOptions {
  rules: ValidationRules;
  /** Thực hiện tải lên; ném lỗi nếu thất bại. */
  upload: (file: File, ctx: { ocrText: string | null }) => Promise<void>;
  onCompleted?: (file: File) => void;
}

interface Entry {
  state: FileProcessState;
  file: File;
}

export function useFileProcess({ rules, upload, onCompleted }: UseFileProcessOptions) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const cancelled = useRef(new Set<string>());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // Huỷ mọi tác vụ đang chạy khi component unmount.
      cancelled.current = new Set(["*"]);
    };
  }, []);

  const patch = useCallback((id: string, next: Partial<FileProcessState>) => {
    if (!mounted.current) return;
    setEntries((prev) =>
      prev.map((e) => (e.state.id === id ? { ...e, state: { ...e.state, ...next } } : e)),
    );
  }, []);

  const isCancelled = (id: string) => cancelled.current.has("*") || cancelled.current.has(id);

  const runOcr = useCallback(
    async (id: string, file: File): Promise<OcrOutcome> => {
      const { PdfExtractor } = await import("@/lib/mirats/document-ocr/pdf-extractor");
      const extractor = new PdfExtractor();
      let canvas: HTMLCanvasElement | null = null;
      let provider: import("@/lib/mirats/document-ocr/providers/tesseract-provider").TesseractProvider | null =
        null;
      try {
        const pageCount = await extractor.load(file);
        if (pageCount <= 0) return { kind: "failed", message: "PDF không có trang nào" };

        // Đọc text layer của tối đa OCR_MAX_PAGES trang để phân loại.
        const probe = Math.min(pageCount, OCR_MAX_PAGES);
        let chars = 0;
        const texts: string[] = [];
        for (let p = 1; p <= probe; p += 1) {
          if (isCancelled(id)) return { kind: "failed", message: "Đã huỷ" };
          const page = await extractor.getPage(p);
          texts.push(page.text ?? "");
          chars += (page.text ?? "").trim().length;
        }

        if (!needsOcr(chars, probe)) {
          return { kind: "not-needed" };
        }

        patch(id, { phase: "ocr", progress: 0 });

        const { TesseractProvider } = await import(
          "@/lib/mirats/document-ocr/providers/tesseract-provider"
        );
        provider = new TesseractProvider();

        canvas = document.createElement("canvas");
        const out: string[] = [];
        for (let p = 1; p <= probe; p += 1) {
          if (isCancelled(id)) return { kind: "failed", message: "Đã huỷ" };
          const page = await extractor.getPage(p);
          await page.render(canvas, 150);
          const res = await provider.recognize(canvas, {
            language: "vie+eng",
            onProgress: (v: number) => patch(id, { progress: (p - 1 + v) / probe }),
          });
          out.push(res.normalizedText || res.rawText || "");
          patch(id, { progress: p / probe });
        }

        return {
          kind: "extracted",
          text: out.join("\n\n").trim(),
          pages: probe,
          truncated: pageCount > probe,
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/password|encrypt/i.test(msg))
          return { kind: "failed", message: "PDF có mật khẩu, không đọc được" };
        return { kind: "failed", message: msg };
      } finally {
        await provider?.dispose().catch(() => {});
        await extractor.close().catch(() => {});
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
      }
    },
    [patch],
  );

  const process = useCallback(
    async (id: string, file: File) => {
      cancelled.current.delete(id);
      patch(id, { phase: "validating", progress: 0, errorMessage: null });

      const valid = validateFile(file, rules);
      if (!valid.ok) {
        patch(id, { phase: "failed", errorMessage: valid.message });
        return;
      }

      let ocr: OcrOutcome | null = null;
      if (isPdf(file)) {
        patch(id, { phase: "detecting" });
        if (file.size > 40 * 1024 * 1024) {
          ocr = { kind: "skipped-limit", reason: "tệp quá lớn để OCR trên trình duyệt" };
        } else {
          ocr = await runOcr(id, file);
        }
        if (isCancelled(id)) {
          patch(id, { phase: "cancelled", ocr });
          return;
        }
        patch(id, { ocr });
      }

      // OCR lỗi KHÔNG chặn upload.
      patch(id, { phase: "uploading", progress: 0 });
      try {
        await upload(file, { ocrText: ocr?.kind === "extracted" ? ocr.text : null });
      } catch (e) {
        patch(id, {
          phase: "failed",
          errorMessage: e instanceof Error ? e.message : String(e),
        });
        return;
      }
      if (!mounted.current) return;

      patch(id, { phase: "verifying", progress: 1 });
      let provider: ReturnType<typeof resolveStorageProvider> = null;
      try {
        provider = resolveStorageProvider(await fetchStorageConfig());
      } catch {
        provider = null; // Không xác định được ⇒ hiển thị nhãn trung tính.
      }
      patch(id, { phase: "completed", storageProvider: provider });
      onCompleted?.(file);
    },
    [patch, rules, runOcr, upload, onCompleted],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      const created = files.map<Entry>((file) => ({
        file,
        state: {
          id: crypto.randomUUID(),
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          phase: "selected",
          progress: 0,
          ocr: null,
          storageProvider: null,
          errorMessage: null,
        },
      }));
      setEntries((prev) => [...created, ...prev]);
      for (const e of created) void process(e.state.id, e.file);
    },
    [process],
  );

  const retry = useCallback(
    (id: string) => {
      const entry = entries.find((e) => e.state.id === id);
      if (entry) void process(id, entry.file);
    },
    [entries, process],
  );

  const cancel = useCallback(
    (id: string) => {
      cancelled.current.add(id);
      patch(id, { phase: "cancelled" });
    },
    [patch],
  );

  const dismiss = useCallback((id: string) => {
    cancelled.current.add(id);
    setEntries((prev) => prev.filter((e) => e.state.id !== id));
  }, []);

  return {
    items: entries.map((e) => e.state),
    addFiles,
    retry,
    cancel,
    dismiss,
    busy: entries.some(
      (e) => !["completed", "failed", "cancelled"].includes(e.state.phase),
    ),
  };
}
