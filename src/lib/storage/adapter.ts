/**
 * Storage Adapter — lớp trừu tượng cho toàn bộ thao tác lưu trữ tệp.
 *
 * Mục tiêu: gom mọi lời gọi `supabase.storage` về MỘT chỗ duy nhất để sau này
 * muốn đổi nhà cung cấp lưu trữ (Supabase → S3 / MinIO / R2...) chỉ cần viết
 * một implementation khác của `StorageAdapter` và đổi dòng khởi tạo bên dưới,
 * KHÔNG phải sửa hàng chục file gọi rải rác trong ứng dụng.
 *
 * Hành vi hiện tại giữ NGUYÊN như gọi trực tiếp Supabase Storage: mọi hàm trả
 * về cùng shape `{ data, error }` để các call-site không phải đổi logic.
 */

export type StorageResult<T> = { data: T | null; error: Error | null };

export interface UploadOptions {
  upsert?: boolean;
  contentType?: string;
  cacheControl?: string;
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  sortBy?: { column: string; order: "asc" | "desc" };
}

export interface StorageFileObject {
  name: string;
  id?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface SignedUrlOptions {
  /** Tên tệp khi tải xuống (Content-Disposition: attachment). */
  download?: string | boolean;
}

export interface StorageBucketInfo {
  id: string;
  name: string;
  public?: boolean;
}

/** Thao tác trên một bucket cụ thể. */
export interface BucketApi {
  upload(
    path: string,
    file: File | Blob | ArrayBuffer | Uint8Array,
    options?: UploadOptions,
  ): Promise<StorageResult<{ path: string }>>;
  remove(paths: string[]): Promise<StorageResult<unknown>>;
  createSignedUrl(
    path: string,
    expiresIn: number,
    options?: SignedUrlOptions,
  ): Promise<StorageResult<{ signedUrl: string }>>;
  createSignedUrls(
    paths: string[],
    expiresIn: number,
  ): Promise<StorageResult<Array<{ path: string | null; signedUrl: string; error: string | null }>>>;
  getPublicUrl(path: string): { data: { publicUrl: string } };
  download(path: string): Promise<StorageResult<Blob>>;
  list(prefix?: string, options?: ListOptions): Promise<StorageResult<StorageFileObject[]>>;
}

/** Giao diện chung của một adapter lưu trữ. */
export interface StorageAdapter {
  from(bucket: string): BucketApi;
  /** Liệt kê tất cả bucket (chủ yếu dùng cho backup phía server). */
  listBuckets(): Promise<StorageResult<StorageBucketInfo[]>>;
}

/** Kiểu tối thiểu của một Supabase client cần cho storage (client browser hoặc admin). */
interface SupabaseLikeStorage {
  storage: {
    listBuckets(): Promise<{ data: unknown; error: unknown }>;
    from(bucket: string): {
      upload(path: string, file: unknown, options?: unknown): Promise<{ data: unknown; error: unknown }>;
      remove(paths: string[]): Promise<{ data: unknown; error: unknown }>;
      createSignedUrl(path: string, expiresIn: number, options?: unknown): Promise<{ data: unknown; error: unknown }>;
      createSignedUrls(paths: string[], expiresIn: number): Promise<{ data: unknown; error: unknown }>;
      getPublicUrl(path: string): { data: { publicUrl: string } };
      download(path: string): Promise<{ data: unknown; error: unknown }>;
      list(prefix?: string, options?: unknown): Promise<{ data: unknown; error: unknown }>;
    };
  };
}

/**
 * Bọc một Supabase client thành StorageAdapter. Đây là implementation mặc định.
 * Muốn đổi sang S3/MinIO: viết một hàm createXxxStorageAdapter() trả về cùng
 * interface `StorageAdapter` rồi thay ở nơi khởi tạo (client.ts / server helper).
 */
export function createSupabaseStorageAdapter(client: SupabaseLikeStorage): StorageAdapter {
  return {
    async listBuckets() {
      const r = await client.storage.listBuckets();
      return { data: r.data as StorageBucketInfo[] | null, error: r.error as Error | null };
    },
    from(bucket: string): BucketApi {
      const b = client.storage.from(bucket);
      return {
        async upload(path, file, options) {
          const r = await b.upload(path, file as unknown, options);
          return { data: r.data as { path: string } | null, error: r.error as Error | null };
        },
        async remove(paths) {
          const r = await b.remove(paths);
          return { data: r.data, error: r.error as Error | null };
        },
        async createSignedUrl(path, expiresIn, options) {
          const r = await b.createSignedUrl(path, expiresIn, options);
          return { data: r.data as { signedUrl: string } | null, error: r.error as Error | null };
        },
        async createSignedUrls(paths, expiresIn) {
          const r = await b.createSignedUrls(paths, expiresIn);
          return {
            data: r.data as Array<{ path: string | null; signedUrl: string; error: string | null }> | null,
            error: r.error as Error | null,
          };
        },
        getPublicUrl(path) {
          return b.getPublicUrl(path);
        },
        async download(path) {
          const r = await b.download(path);
          return { data: r.data as Blob | null, error: r.error as Error | null };
        },
        async list(prefix, options) {
          const r = await b.list(prefix, options);
          return { data: r.data as StorageFileObject[] | null, error: r.error as Error | null };
        },
      };
    },
  };
}
