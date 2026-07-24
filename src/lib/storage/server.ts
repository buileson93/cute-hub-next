/**
 * Storage Adapter phía server (đặc quyền — service role).
 *
 * Dùng cho backup/restore/cron. Bọc `supabaseAdmin` bằng CÙNG một
 * `StorageAdapter` như phía client, nên sau này muốn đổi backend lưu trữ
 * (S3 / MinIO / R2) chỉ cần viết một implementation khác và đổi ở đây.
 *
 *   const storage = createAdminStorage(supabaseAdmin);
 *   await storage.from("database-backups").upload(name, bytes, { upsert: true });
 */
import { createSupabaseStorageAdapter, type StorageAdapter } from "./adapter";

export type { StorageAdapter, BucketApi, StorageResult } from "./adapter";

/** Tạo adapter lưu trữ từ một Supabase admin client (service role). */
export function createAdminStorage(supabaseAdmin: unknown): StorageAdapter {
  return createSupabaseStorageAdapter(supabaseAdmin as never);
}
