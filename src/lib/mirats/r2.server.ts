import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type R2Settings = {
  enabled: boolean;
  endpoint: string | null;
  accountId: string | null;
  bucketName: string | null;
  keyPrefix: string | null;
  publicBaseUrl: string | null;
  accessKeyId: string | null;
  secretAccessKey: string | null;
  source: "db" | "env";
};

const EMPTY: R2Settings = {
  enabled: false,
  endpoint: null,
  accountId: null,
  bucketName: null,
  keyPrefix: null,
  publicBaseUrl: null,
  accessKeyId: null,
  secretAccessKey: null,
  source: "env",
};

function envSettings(): R2Settings {
  return {
    enabled: !!(
      process.env.R2_ENDPOINT &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY
    ),
    endpoint: process.env.R2_ENDPOINT || null,
    accountId: process.env.R2_ACCOUNT_ID || null,
    bucketName: process.env.R2_BUCKET_NAME || null,
    keyPrefix: process.env.R2_KEY_PREFIX || null,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL || null,
    accessKeyId: process.env.R2_ACCESS_KEY_ID || null,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || null,
    source: "env",
  };
}

let _cache: { at: number; value: R2Settings } | null = null;
const CACHE_MS = 30_000;

/** Đọc tham số R2: ưu tiên bảng `r2_cau_hinh` (admin cấu hình trong app), fallback biến môi trường. */
export async function getR2Settings(force = false): Promise<R2Settings> {
  if (!force && _cache && Date.now() - _cache.at < CACHE_MS) return _cache.value;
  const env = envSettings();
  let value = env;
  try {
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    const { data } = await supabaseAdmin
      .from("r2_cau_hinh")
      .select(
        "enabled, endpoint, account_id, bucket_name, key_prefix, public_base_url, access_key_id, secret_access_key",
      )
      .eq("id", 1)
      .maybeSingle();
    if (data && (data as any).endpoint) {
      const d = data as any;
      value = {
        enabled: d.enabled !== false,
        endpoint: d.endpoint || env.endpoint,
        accountId: d.account_id || env.accountId,
        bucketName: d.bucket_name || env.bucketName,
        keyPrefix: d.key_prefix || env.keyPrefix,
        publicBaseUrl: d.public_base_url || env.publicBaseUrl,
        accessKeyId: d.access_key_id || env.accessKeyId,
        secretAccessKey: d.secret_access_key || env.secretAccessKey,
        source: "db",
      };
    }
  } catch {
    value = env;
  }
  _cache = { at: Date.now(), value };
  return value;
}

/** Xoá cache sau khi admin lưu cấu hình mới. */
export function resetR2Cache() {
  _cache = null;
  _client = null;
  _clientKey = "";
}

let _client: S3Client | null = null;
let _clientKey = "";

export async function getR2Client(): Promise<S3Client> {
  const s = await getR2Settings();
  if (!s.endpoint || !s.accessKeyId || !s.secretAccessKey) {
    throw new Error("R2 chưa được cấu hình (thiếu Endpoint / Access Key ID / Secret Access Key)");
  }
  const key = `${s.endpoint}|${s.accessKeyId}|${s.secretAccessKey}`;
  if (_client && _clientKey === key) return _client;
  _client = new S3Client({
    region: "auto",
    endpoint: s.endpoint,
    credentials: { accessKeyId: s.accessKeyId, secretAccessKey: s.secretAccessKey },
    forcePathStyle: true,
  });
  _clientKey = key;
  return _client;
}

export async function getR2Bucket(): Promise<string> {
  const s = await getR2Settings();
  if (!s.bucketName) throw new Error("Tên bucket R2 chưa được cấu hình");
  return s.bucketName;
}

export async function getR2PublicBase(): Promise<string | null> {
  return (await getR2Settings()).publicBaseUrl;
}

export const EMPTY_R2_SETTINGS = EMPTY;

export async function r2PresignPut(key: string, contentType?: string, expiresIn = 900) {
  const cmd = new PutObjectCommand({
    Bucket: await getR2Bucket(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(await getR2Client(), cmd, { expiresIn });
}

export async function r2PresignGet(key: string, expiresIn = 900) {
  const cmd = new GetObjectCommand({ Bucket: await getR2Bucket(), Key: key });
  return getSignedUrl(await getR2Client(), cmd, { expiresIn });
}

export async function r2Delete(key: string) {
  await (
    await getR2Client()
  ).send(new DeleteObjectCommand({ Bucket: await getR2Bucket(), Key: key }));
}

export async function r2Head(key: string) {
  try {
    const res = await (
      await getR2Client()
    ).send(new HeadObjectCommand({ Bucket: await getR2Bucket(), Key: key }));
    return { exists: true, size: res.ContentLength ?? 0, contentType: res.ContentType ?? null };
  } catch {
    return { exists: false, size: 0, contentType: null };
  }
}

export async function r2PublicUrl(key: string): Promise<string | null> {
  const base = await getR2PublicBase();
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}

// ---- Multipart helpers ----
export async function r2MultipartCreate(key: string, contentType?: string) {
  const res = await (
    await getR2Client()
  ).send(
    new CreateMultipartUploadCommand({
      Bucket: await getR2Bucket(),
      Key: key,
      ContentType: contentType,
    }),
  );
  return res.UploadId!;
}

export async function r2MultipartSignPart(
  key: string,
  uploadId: string,
  partNumber: number,
  expiresIn = 900,
) {
  const cmd = new UploadPartCommand({
    Bucket: await getR2Bucket(),
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });
  return getSignedUrl(await getR2Client(), cmd, {
    expiresIn,
    unhoistableHeaders: new Set(["x-amz-content-sha256"]),
  });
}

export async function r2MultipartComplete(
  key: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[],
) {
  await (
    await getR2Client()
  ).send(
    new CompleteMultipartUploadCommand({
      Bucket: await getR2Bucket(),
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber) },
    }),
  );
}

export async function r2MultipartAbort(key: string, uploadId: string) {
  await (
    await getR2Client()
  ).send(
    new AbortMultipartUploadCommand({
      Bucket: await getR2Bucket(),
      Key: key,
      UploadId: uploadId,
    }),
  );
}

export async function r2MultipartList(key: string, uploadId: string) {
  const parts: { PartNumber: number; ETag: string; Size: number }[] = [];
  let marker: number | undefined;
  do {
    const res: any = await (
      await getR2Client()
    ).send(
      new ListPartsCommand({
        Bucket: await getR2Bucket(),
        Key: key,
        UploadId: uploadId,
        PartNumberMarker: marker ? String(marker) : undefined,
      }),
    );
    for (const p of res.Parts ?? []) {
      if (p.PartNumber != null && p.ETag)
        parts.push({ PartNumber: p.PartNumber, ETag: p.ETag.replace(/"/g, ""), Size: p.Size ?? 0 });
    }
    marker = res.IsTruncated ? Number(res.NextPartNumberMarker) : undefined;
  } while (marker);
  return parts;
}
