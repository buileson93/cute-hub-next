import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";

/**
 * Cấu hình lớp lưu trữ tệp cho toàn hệ thống.
 *
 * Lưu trong `app_cai_dat` (key/value JSON string) để admin có thể đổi mà không
 * phải deploy lại. Đọc bằng React Query với staleTime nhẹ để mọi nơi đồng bộ.
 *
 *   primary     — "supabase" | "r2"  (nơi ĐỌC & là nguồn chính khi hiển thị)
 *   dual_write  — true/false          (khi ghi file mới, ghi song song sang bên còn lại)
 */

export const MAX_MB = 20;

export const STORAGE_CONFIG_KEY = "storage.config";

export type StoragePrimary = "supabase" | "r2";
/** Chế độ lưu trữ hiển thị cho admin: chỉ Cloud, chỉ R2, hoặc ghi cả hai. */
export type StorageMode = "cloud" | "r2" | "dual";

export type StorageConfig = {
  primary: StoragePrimary;
  dualWrite: boolean;
  /**
   * Khi backend đang chọn bị lỗi, tự động ghi tạm sang backend còn lại thay vì
   * để tệp không được ghi vào đâu cả (kèm cảnh báo cho người dùng).
   */
  autoFallback: boolean;
};

export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  primary: "supabase",
  dualWrite: true,
  autoFallback: true,
};

export function toMode(cfg: StorageConfig): StorageMode {
  if (cfg.dualWrite) return "dual";
  return cfg.primary === "r2" ? "r2" : "cloud";
}

export function fromMode(mode: StorageMode, autoFallback: boolean): StorageConfig {
  if (mode === "dual") return { primary: "supabase", dualWrite: true, autoFallback };
  return { primary: mode === "r2" ? "r2" : "supabase", dualWrite: false, autoFallback };
}

export const MODE_LABEL: Record<StorageMode, string> = {
  cloud: "Chỉ dùng Lovable Cloud",
  r2: "Chỉ dùng Cloudflare R2",
  dual: "Ghi song song cả hai",
};

function parse(raw: string | null | undefined): StorageConfig {
  if (!raw) return DEFAULT_STORAGE_CONFIG;
  try {
    const j = JSON.parse(raw);
    return {
      primary: j.primary === "r2" ? "r2" : "supabase",
      dualWrite: j.dualWrite !== false,
      autoFallback: j.autoFallback !== false,
    };
  } catch {
    return DEFAULT_STORAGE_CONFIG;
  }
}

export async function fetchStorageConfig(): Promise<StorageConfig> {
  const { data } = await supabase
    .from("app_cai_dat")
    .select("gia_tri")
    .eq("khoa", STORAGE_CONFIG_KEY)
    .maybeSingle();
  return parse(data?.gia_tri ?? null);
}

export function useStorageConfig() {
  return useQuery({
    queryKey: ["storage-config"],
    queryFn: fetchStorageConfig,
    staleTime: 60 * 1000,
  });
}

export function useSaveStorageConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cfg: StorageConfig) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("app_cai_dat").upsert(
        {
          khoa: STORAGE_CONFIG_KEY,
          gia_tri: JSON.stringify(cfg),
          updated_by: u.user?.id ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "khoa" },
      );
      if (error) throw error;
      return cfg;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["storage-config"] }),
  });
}
