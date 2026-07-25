import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let _client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (_client) return _client;
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 chưa được cấu hình (thiếu R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)");
  }
  _client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  return _client;
}

export function getR2Bucket(): string {
  const b = process.env.R2_BUCKET_NAME;
  if (!b) throw new Error("R2_BUCKET_NAME chưa được cấu hình");
  return b;
}

export function getR2PublicBase(): string | null {
  return process.env.R2_PUBLIC_BASE_URL || null;
}

export async function r2PresignPut(key: string, contentType?: string, expiresIn = 900) {
  const cmd = new PutObjectCommand({
    Bucket: getR2Bucket(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getR2Client(), cmd, { expiresIn });
}

export async function r2PresignGet(key: string, expiresIn = 900) {
  const cmd = new GetObjectCommand({ Bucket: getR2Bucket(), Key: key });
  return getSignedUrl(getR2Client(), cmd, { expiresIn });
}

export async function r2Delete(key: string) {
  await getR2Client().send(new DeleteObjectCommand({ Bucket: getR2Bucket(), Key: key }));
}

export async function r2Head(key: string) {
  try {
    const res = await getR2Client().send(new HeadObjectCommand({ Bucket: getR2Bucket(), Key: key }));
    return { exists: true, size: res.ContentLength ?? 0, contentType: res.ContentType ?? null };
  } catch {
    return { exists: false, size: 0, contentType: null };
  }
}

export function r2PublicUrl(key: string): string | null {
  const base = getR2PublicBase();
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}