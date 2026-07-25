import { useServerFn } from "@tanstack/react-start";
import { r2GetUploadUrl, r2GetDownloadUrl, r2DeleteObject } from "./r2.functions";

export function useR2Upload() {
  const getUploadUrl = useServerFn(r2GetUploadUrl);
  return async (file: File, keyHint?: string) => {
    const key = keyHint ?? `uploads/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const { key: finalKey, url, publicUrl } = await getUploadUrl({
      data: { key, contentType: file.type || "application/octet-stream" },
    });
    const res = await fetch(url, {
      method: "PUT",
      body: file,
      headers: file.type ? { "Content-Type": file.type } : undefined,
    });
    if (!res.ok) throw new Error(`Upload R2 thất bại [${res.status}]: ${await res.text()}`);
    return { key: finalKey, publicUrl, size: file.size };
  };
}

export function useR2Download() {
  const getUrl = useServerFn(r2GetDownloadUrl);
  return async (key: string) => {
    const { url } = await getUrl({ data: { key } });
    return url;
  };
}

export function useR2Delete() {
  const del = useServerFn(r2DeleteObject);
  return async (key: string) => {
    await del({ data: { key } });
  };
}