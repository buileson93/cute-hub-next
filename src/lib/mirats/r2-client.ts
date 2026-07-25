import { useServerFn } from "@tanstack/react-start";
import {
  r2GetUploadUrl, r2GetDownloadUrl, r2DeleteObject, r2MarkReady,
  r2MultipartInit, r2MultipartSign, r2MultipartFinish, r2MultipartCancel,
  r2ListMyFiles,
} from "./r2.functions";

const MULTIPART_THRESHOLD = 50 * 1024 * 1024; // 50MB
const PART_SIZE = 8 * 1024 * 1024; // 8MB
const PART_BATCH = 20; // xin presigned URL theo lô

export type UploadProgress = { loaded: number; total: number; percent: number };
export type UploadOptions = { keyHint?: string; onProgress?: (p: UploadProgress) => void; signal?: AbortSignal };
export type UploadResult = { key: string; size: number; category: string };

function putWithProgress(url: string, body: Blob, contentType: string | undefined, onProgress: (loaded: number) => void, signal?: AbortSignal): Promise<{ etag: string | null }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    if (contentType) xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag");
        resolve({ etag: etag ? etag.replace(/"/g, "") : null });
      } else reject(new Error(`Upload R2 lỗi ${xhr.status}: ${xhr.responseText || xhr.statusText}`));
    };
    xhr.onerror = () => reject(new Error("Lỗi mạng khi upload"));
    xhr.onabort = () => reject(new Error("Upload bị hủy"));
    if (signal) signal.addEventListener("abort", () => xhr.abort());
    xhr.send(body);
  });
}

export function useR2Upload() {
  const getUploadUrl = useServerFn(r2GetUploadUrl);
  const markReady = useServerFn(r2MarkReady);
  const mpInit = useServerFn(r2MultipartInit);
  const mpSign = useServerFn(r2MultipartSign);
  const mpFinish = useServerFn(r2MultipartFinish);
  const mpCancel = useServerFn(r2MultipartCancel);

  return async (file: File, opts: UploadOptions = {}): Promise<UploadResult> => {
    const safeName = file.name.replace(/[^\w.\-]/g, "_");
    const keyHint = opts.keyHint ?? `uploads/${Date.now()}-${safeName}`;
    const ct = file.type || "application/octet-stream";

    // ---- Small file: single PUT with progress ----
    if (file.size < MULTIPART_THRESHOLD) {
      const { key, url, category } = await getUploadUrl({
        data: { key: keyHint, contentType: ct, size: file.size, originalName: file.name },
      });
      await putWithProgress(url, file, ct, (loaded) => {
        opts.onProgress?.({ loaded, total: file.size, percent: Math.min(100, Math.round((loaded / file.size) * 100)) });
      }, opts.signal);
      await markReady({ data: { key, size: file.size } });
      opts.onProgress?.({ loaded: file.size, total: file.size, percent: 100 });
      return { key, size: file.size, category };
    }

    // ---- Multipart ----
    const { key, uploadId, category } = await mpInit({
      data: { key: keyHint, contentType: ct, size: file.size, originalName: file.name },
    });
    try {
      const partCount = Math.ceil(file.size / PART_SIZE);
      const uploadedByPart = new Map<number, number>();
      const totalLoaded = () => Array.from(uploadedByPart.values()).reduce((a, b) => a + b, 0);
      const parts: { PartNumber: number; ETag: string }[] = [];

      for (let batchStart = 1; batchStart <= partCount; batchStart += PART_BATCH) {
        const batchNums = [];
        for (let n = batchStart; n < batchStart + PART_BATCH && n <= partCount; n++) batchNums.push(n);
        const { urls } = await mpSign({ data: { key, uploadId, partNumbers: batchNums } });
        for (const { partNumber, url } of urls) {
          const start = (partNumber - 1) * PART_SIZE;
          const end = Math.min(start + PART_SIZE, file.size);
          const chunk = file.slice(start, end);
          const { etag } = await putWithProgress(url, chunk, undefined, (loaded) => {
            uploadedByPart.set(partNumber, loaded);
            const tl = totalLoaded();
            opts.onProgress?.({ loaded: tl, total: file.size, percent: Math.min(99, Math.round((tl / file.size) * 100)) });
          }, opts.signal);
          if (!etag) throw new Error(`Part ${partNumber} không nhận được ETag`);
          parts.push({ PartNumber: partNumber, ETag: etag });
        }
      }
      await mpFinish({ data: { key, uploadId, parts, size: file.size } });
      opts.onProgress?.({ loaded: file.size, total: file.size, percent: 100 });
      return { key, size: file.size, category };
    } catch (err) {
      try { await mpCancel({ data: { key, uploadId } }); } catch {}
      throw err;
    }
  };
}

export function useR2Download() {
  const getUrl = useServerFn(r2GetDownloadUrl);
  return async (key: string) => {
    const { url, expiresIn } = await getUrl({ data: { key } });
    return { url, expiresIn };
  };
}

export function useR2Delete() {
  const del = useServerFn(r2DeleteObject);
  return async (key: string) => { await del({ data: { key } }); };
}

export function useR2ListMyFiles() {
  return useServerFn(r2ListMyFiles);
}
