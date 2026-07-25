import { useServerFn } from "@tanstack/react-start";
import {
  r2GetUploadUrl, r2GetDownloadUrl, r2DeleteObject, r2MarkReady,
  r2MultipartInit, r2MultipartSign, r2MultipartFinish, r2MultipartCancel, r2MultipartListParts,
  r2ListMyFiles,
} from "./r2.functions";

const MULTIPART_THRESHOLD = 50 * 1024 * 1024; // 50MB
const PART_SIZE = 8 * 1024 * 1024; // 8MB
const PART_BATCH = 20; // xin presigned URL theo lô
const SESSION_STORE_KEY = "r2:resumable-sessions:v1";

export type UploadProgress = { loaded: number; total: number; percent: number };
export type UploadOptions = { keyHint?: string; onProgress?: (p: UploadProgress) => void; signal?: AbortSignal };
export type UploadResult = { key: string; size: number; category: string };

export type ResumableSession = {
  fingerprint: string;
  fileName: string;
  fileSize: number;
  fileLastModified: number;
  contentType: string;
  key: string;
  uploadId: string;
  partSize: number;
  createdAt: number;
  uploadedBytes?: number;
  percent?: number;
  updatedAt?: number;
};

export function fileFingerprint(file: File): string {
  return `${file.name}|${file.size}|${file.lastModified}`;
}

function loadSessions(): ResumableSession[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(SESSION_STORE_KEY) || "[]"); } catch { return []; }
}
function saveSessions(list: ResumableSession[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(SESSION_STORE_KEY, JSON.stringify(list)); } catch {}
}
export function listResumableSessions(): ResumableSession[] {
  // xoá session cũ quá 24h
  const now = Date.now();
  const kept = loadSessions().filter((s) => now - s.createdAt < 24 * 3600 * 1000);
  if (kept.length !== loadSessions().length) saveSessions(kept);
  return kept.sort((a, b) => b.createdAt - a.createdAt);
}
export function removeResumableSession(fingerprint: string) {
  saveSessions(loadSessions().filter((s) => s.fingerprint !== fingerprint));
}
function upsertSession(s: ResumableSession) {
  const list = loadSessions().filter((x) => x.fingerprint !== s.fingerprint);
  list.push(s);
  saveSessions(list);
}
function patchSession(fingerprint: string, patch: Partial<ResumableSession>) {
  const list = loadSessions();
  const i = list.findIndex((x) => x.fingerprint === fingerprint);
  if (i < 0) return;
  list[i] = { ...list[i], ...patch, updatedAt: Date.now() };
  saveSessions(list);
}

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
  const mpList = useServerFn(r2MultipartListParts);

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

    // ---- Multipart (resumable) ----
    const fp = fileFingerprint(file);
    const existing = loadSessions().find((s) => s.fingerprint === fp);
    let key: string; let uploadId: string; let category: string;
    const alreadyDone = new Map<number, { ETag: string; Size: number }>();

    if (existing) {
      const listed = await mpList({ data: { key: existing.key, uploadId: existing.uploadId } });
      if (listed.valid) {
        key = existing.key; uploadId = existing.uploadId; category = "other";
        for (const p of listed.parts) alreadyDone.set(p.PartNumber, { ETag: p.ETag, Size: p.Size });
      } else {
        removeResumableSession(fp);
        const init = await mpInit({ data: { key: keyHint, contentType: ct, size: file.size, originalName: file.name } });
        key = init.key; uploadId = init.uploadId; category = init.category;
      }
    } else {
      const init = await mpInit({ data: { key: keyHint, contentType: ct, size: file.size, originalName: file.name } });
      key = init.key; uploadId = init.uploadId; category = init.category;
    }

    upsertSession({
      fingerprint: fp, fileName: file.name, fileSize: file.size, fileLastModified: file.lastModified,
      contentType: ct, key, uploadId, partSize: PART_SIZE, createdAt: Date.now(),
      uploadedBytes: 0, percent: 0, updatedAt: Date.now(),
    });

    try {
      const partCount = Math.ceil(file.size / PART_SIZE);
      const uploadedByPart = new Map<number, number>();
      // seed progress từ các part đã có sẵn trên R2
      for (const [n, meta] of alreadyDone) uploadedByPart.set(n, meta.Size || Math.min(PART_SIZE, file.size - (n - 1) * PART_SIZE));
      const totalLoaded = () => Array.from(uploadedByPart.values()).reduce((a, b) => a + b, 0);
      const parts: { PartNumber: number; ETag: string }[] = [];
      for (const [n, meta] of alreadyDone) parts.push({ PartNumber: n, ETag: meta.ETag });
      {
        const tl = totalLoaded();
        const pct = Math.min(99, Math.round((tl / file.size) * 100));
        opts.onProgress?.({ loaded: tl, total: file.size, percent: pct });
        patchSession(fp, { uploadedBytes: tl, percent: pct });
      }

      for (let batchStart = 1; batchStart <= partCount; batchStart += PART_BATCH) {
        const batchNums: number[] = [];
        for (let n = batchStart; n < batchStart + PART_BATCH && n <= partCount; n++) {
          if (!alreadyDone.has(n)) batchNums.push(n);
        }
        if (!batchNums.length) continue;
        const { urls } = await mpSign({ data: { key, uploadId, partNumbers: batchNums } });
        for (const { partNumber, url } of urls) {
          const start = (partNumber - 1) * PART_SIZE;
          const end = Math.min(start + PART_SIZE, file.size);
          const chunk = file.slice(start, end);
          const { etag } = await putWithProgress(url, chunk, undefined, (loaded) => {
            uploadedByPart.set(partNumber, loaded);
            const tl = totalLoaded();
            const pct = Math.min(99, Math.round((tl / file.size) * 100));
            opts.onProgress?.({ loaded: tl, total: file.size, percent: pct });
            patchSession(fp, { uploadedBytes: tl, percent: pct });
          }, opts.signal);
          if (!etag) throw new Error(`Part ${partNumber} không nhận được ETag`);
          parts.push({ PartNumber: partNumber, ETag: etag });
          patchSession(fp, { uploadedBytes: totalLoaded(), percent: Math.min(99, Math.round((totalLoaded() / file.size) * 100)) });
        }
      }
      await mpFinish({ data: { key, uploadId, parts, size: file.size } });
      removeResumableSession(fp);
      opts.onProgress?.({ loaded: file.size, total: file.size, percent: 100 });
      return { key, size: file.size, category };
    } catch (err) {
      // KHÔNG abort — giữ session để user tiếp tục sau khi refresh / kết nối lại
      throw err;
    }
  };
}

/** Xoá hẳn 1 phiên multipart dở dang trên R2 (dọn rác). */
export function useR2AbortResumable() {
  const mpCancel = useServerFn(r2MultipartCancel);
  return async (s: ResumableSession) => {
    try { await mpCancel({ data: { key: s.key, uploadId: s.uploadId } }); } catch {}
    removeResumableSession(s.fingerprint);
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
