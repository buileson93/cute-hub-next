import { QueryClient, type QueryKey } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { routeTree } from "./routeTree.gen";
import { nenRetry, tinhTreRetry } from "./lib/mirats/ui/retry-policy";

/**
 * Quy ước `meta` chuẩn cho MỌI useMutation trong dự án:
 *
 *   useMutation({
 *     mutationFn: ...,
 *     meta: {
 *       // Chỉ những key liên quan trực tiếp mới bị refetch (tránh nhấp nháy).
 *       // Nếu bỏ trống -> KHÔNG refetch gì cả (dành cho hook đã tự invalidate).
 *       invalidates: [["dm_he_thong"], ["v_do_thi_he_thong"]],
 *       successMessage: "Đã lưu thay đổi",  // tuỳ chọn: toast thành công
 *       errorMessage: "Không lưu được",     // tuỳ chọn: prefix cho toast lỗi
 *     },
 *   });
 *
 * Trạng thái "Đang lưu…" hiển thị tự động qua `SavingIndicator`
 * (dùng `useIsMutating`) — không cần hook nào tự lo.
 *
 * Nếu hook KHÔNG khai `meta`, hệ thống giữ hành vi cũ (không auto toast /
 * không auto invalidate — hook cũ đã tự quản lý).
 */
export interface MutationMetaLovable extends Record<string, unknown> {
  invalidates?: QueryKey[];
  successMessage?: string;
  errorMessage?: string;
  /** Ẩn toast (dùng cho các mutation optimistic đã tự lo UX). */
  silent?: boolean;
}

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: MutationMetaLovable;
  }
}

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // T47: Giảm staleTime xuống 15s nếu chưa có dữ liệu danh mục để UI nhanh nhạy hơn.
        // Dữ liệu danh mục sẽ được ghi đè bên dưới.
        staleTime: 15_000,
        gcTime: 2 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        // Task 39 — retry có backoff, bỏ qua lỗi 4xx.
        retry: (soLan, err) => nenRetry(soLan, err),
        retryDelay: (soLan) => tinhTreRetry(soLan),
        networkMode: "online",
      },
      mutations: {
        onSuccess: (_data, _vars, _ctx, mutation) => {
          const meta = mutation?.meta as MutationMetaLovable | undefined;
          if (meta?.invalidates?.length) {
            for (const key of meta.invalidates) {
              queryClient.invalidateQueries({ queryKey: key });
            }
          }
          if (meta && !meta.silent && meta.successMessage) {
            toast.success(meta.successMessage);
          }
        },
        onError: (err, _vars, _ctx, mutation) => {
          const meta = mutation?.meta as MutationMetaLovable | undefined;
          if (meta && !meta.silent) {
            const msg = meta.errorMessage
              ? `${meta.errorMessage}: ${(err as Error).message}`
              : (err as Error).message;
            toast.error(msg);
          }
        },
      },
    },
  });

  // Task 41 — staleTime theo loại dữ liệu.
  // Danh mục (dm_*, taxonomy) ít thay đổi → cache lâu để tránh refetch không cần thiết.
  // Realtime đã có `useGlobalRealtime` invalidate khi CSDL đổi, nên tăng staleTime an toàn.
  const DM_STALE = 5 * 60_000; // 5 phút
  const DM_GC = 30 * 60_000; // 30 phút
  for (const key of [
    "dm_don_vi",
    "dm_he_thong",
    "dm_loai_giay_phep",
    "dm_loai_lien_ket",
    "dm_loai_thiet_bi",
    "dm_model",
    "dm_nha_cung_cap",
    "dm_nha_san_xuat",
    "dm_nhom_he_thong",
    "dm_noi_cap",
    "dm_phan_loai",
    "dm_to_chuc",
    "dm_trang_thai_thiet_bi",
    "dm_vi_tri",
    "dm_danh_gia_nien_han",
    "taxonomy",
    "branding",
    "app_cai_dat",
    "role_permission",
    "field_set",
    "form_template",
  ] as const) {
    queryClient.setQueryDefaults([key], { staleTime: DM_STALE, gcTime: DM_GC });
  }
  // Dashboard tổng hợp / list nghiệp vụ — vẫn tươi trong 30s (giữ mặc định).
  // Dữ liệu ít đổi kiểu "config user" — cache dài hơn:
  for (const key of ["permissions", "user_scope", "profiles", "nav-badges"] as const) {
    queryClient.setQueryDefaults([key], { staleTime: 60_000, gcTime: 10 * 60_000 });
  }

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  return router;
};
