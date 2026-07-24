/**
 * Instance Storage Adapter dùng ở phía trình duyệt (client).
 *
 * Mọi component/route nên import `storage` từ đây thay vì gọi trực tiếp
 * `supabase.storage`. Khi cần đổi backend lưu trữ, chỉ sửa dòng khởi tạo này.
 *
 *   import { storage } from "@/lib/storage";
 *   const { data, error } = await storage.from("avatars").upload(path, file, { upsert: true });
 */
import { supabase } from "@/integrations/supabase/client";
import { createSupabaseStorageAdapter } from "./adapter";

export type {
  StorageAdapter,
  BucketApi,
  StorageResult,
  UploadOptions,
  ListOptions,
  StorageFileObject,
} from "./adapter";

export const storage = createSupabaseStorageAdapter(supabase);
