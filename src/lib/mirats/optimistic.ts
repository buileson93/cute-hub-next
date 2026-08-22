/**
 * useOptimisticMutation – cập nhật UI TRƯỚC khi server trả lời.
 *
 * Ví dụ (đổi tên hệ thống):
 *   const mut = useOptimisticMutation({
 *     mutationFn: (v) => supabase.from("dm_he_thong").update({ ten: v.ten }).eq("id", v.id),
 *     queryKey: ["dm_he_thong"],
 *     applyOptimistic: (old: any[] | undefined, v) =>
 *       old?.map((r) => (r.id === v.id ? { ...r, ten: v.ten } : r)),
 *     successMessage: "Đã đổi tên",
 *     invalidates: [["dm_he_thong"]],
 *   });
 *
 * - onMutate: snapshot + patch cache theo `queryKey` (hoặc `queryKeys`).
 * - onError: rollback + toast lỗi.
 * - onSuccess: (nếu có) toast thành công.
 * - onSettled: KHÔNG global-invalidate; chỉ refetch `invalidates` khai rõ.
 */
import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

export interface OptimisticOptions<TData, TVars, TQueryData> extends Omit<
  UseMutationOptions<TData, Error, TVars, { snapshots: Array<{ key: QueryKey; data: unknown }> }>,
  "onMutate" | "onError" | "onSettled"
> {
  /** Cache cần cập nhật lạc quan. Chấp nhận 1 hoặc nhiều key. */
  queryKey?: QueryKey;
  queryKeys?: QueryKey[];
  /**
   * Hàm patch cho từng key. Nếu chỉ dùng 1 `queryKey`, chữ ký cũ vẫn tương thích:
   *   (old, vars) => newOld
   * Nếu dùng nhiều `queryKeys`, hàm được gọi cho từng key:
   *   (old, vars, key) => newOld
   */
  applyOptimistic: (
    old: TQueryData | undefined,
    vars: TVars,
    key: QueryKey,
  ) => TQueryData | undefined;
  /** Refetch sau khi mutation kết thúc — chỉ những key liên quan trực tiếp. */
  invalidates?: QueryKey[];
  successMessage?: string;
  errorMessage?: string;
}

export function useOptimisticMutation<TData, TVars, TQueryData = unknown>(
  opts: OptimisticOptions<TData, TVars, TQueryData>,
) {
  const qc = useQueryClient();
  const {
    queryKey,
    queryKeys,
    applyOptimistic,
    invalidates,
    successMessage,
    errorMessage,
    ...rest
  } = opts;

  const keys: QueryKey[] = queryKeys ?? (queryKey ? [queryKey] : []);

  return useMutation<TData, Error, TVars, { snapshots: Array<{ key: QueryKey; data: unknown }> }>({
    ...rest,
    // Optimistic mutation tự lo toast/rollback → tắt auto-meta ở router.tsx.
    meta: { silent: true },
    onMutate: async (vars) => {
      const snapshots: Array<{ key: QueryKey; data: unknown }> = [];
      for (const k of keys) {
        await qc.cancelQueries({ queryKey: k });
        snapshots.push({ key: k, data: qc.getQueryData(k) });
        qc.setQueryData<TQueryData>(k, (old) => applyOptimistic(old, vars, k));
      }
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshots) {
        for (const s of ctx.snapshots) qc.setQueryData(s.key, s.data);
      }
      toast.error(errorMessage ?? "Không thể lưu, đã hoàn tác thay đổi");
    },
    onSuccess: (_data, _vars) => {
      if (successMessage) toast.success(successMessage);
    },
    onSettled: () => {
      // Chỉ refetch những key khai rõ — tránh nhấp nháy do global invalidate.
      const toRefetch = invalidates ?? keys;
      for (const k of toRefetch) qc.invalidateQueries({ queryKey: k });
    },
  });
}
