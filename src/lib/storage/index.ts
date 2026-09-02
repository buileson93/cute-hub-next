/**
 * Instance Storage Adapter dùng ở phía trình duyệt (client).
 *
 * Mọi component/route nên import `storage` từ đây thay vì gọi trực tiếp
 * `supabase.storage`. Khi cần đổi backend lưu trữ, chỉ sửa dòng khởi tạo này.
 *
 *   import { storage } from "@/lib/storage";
 *   const { data, error } = await storage.from("avatars").upload(path, file, { upsert: true });
 */
import { supabase } from "@/integrations/backend/client";
import { createSupabaseStorageAdapter } from "./adapter";

export type {
  StorageAdapter,
  BucketApi,
  StorageResult,
  UploadOptions,
  ListOptions,
  StorageFileObject,
} from "./adapter";

import type { StorageAdapter } from "./adapter";
import { mirrorToR2 } from "./mirror-r2";

const base = createSupabaseStorageAdapter(supabase);

/**
 * Bọc adapter để mỗi lần upload thành công sẽ nhân bản sang Cloudflare R2 nếu
 * admin đã bật chế độ có R2. Bản Lovable Cloud vẫn là bản chính nên URL đang
 * lưu trong CSDL và cách render ảnh KHÔNG thay đổi.
 */
export const storage: StorageAdapter = {
  listBuckets: () => base.listBuckets(),
  from(bucket: string) {
    const api = base.from(bucket);
    return {
      ...api,
      async upload(path, file, options) {
        const res = await api.upload(path, file, options);
        if (!res.error && typeof Blob !== "undefined" && file instanceof Blob) {
          void mirrorToR2(bucket, res.data?.path ?? path, file);
        }
        return res;
      },
    };
  },
};
