import { type ReactNode } from "react";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { TableSkeleton, ListSkeleton, CardGridSkeleton, DrawerSkeleton } from "./Skeletons";

type SkeletonType = "table" | "list" | "card" | "drawer" | "none";

interface DataStateProps {
  /**
   * Trạng thái hiện tại của dữ liệu.
   * 'success' sẽ hiển thị children.
   */
  state: "loading" | "empty" | "error" | "success";
  
  /** 
   * Loại skeleton hiển thị khi loading. 
   * Mặc định là 'none' (dùng LoadingState truyền thống).
   */
  loadingType?: SkeletonType;
  
  /** Tiêu đề cho trạng thái rỗng hoặc lỗi. */
  title?: string;
  
  /** Chi tiết thông báo (cho cả empty và error). */
  description?: string;
  
  /** Hàm gọi lại khi bấm nút "Thử lại" ở trạng thái lỗi. */
  onRetry?: () => void;
  
  /** Action bổ sung (thường là nút) hiển thị ở trạng thái rỗng. */
  emptyAction?: ReactNode;
  
  /** Component con hiển thị khi state === 'success'. */
  children: ReactNode;
  
  /** Class CSS bổ sung cho container bao ngoài. */
  className?: string;
}

/**
 * Component dùng chung để quản lý các trạng thái dữ liệu (Loading, Empty, Error).
 * Task T29 - MIRATS 2.0.
 */
export function DataState({
  state,
  loadingType = "none",
  title,
  description,
  onRetry,
  emptyAction,
  children,
  className,
}: DataStateProps) {
  if (state === "loading") {
    switch (loadingType) {
      case "table":
        return <TableSkeleton className={className} />;
      case "list":
        return <ListSkeleton className={className} />;
      case "card":
        return <CardGridSkeleton className={className} />;
      case "drawer":
        return <DrawerSkeleton className={className} />;
      default:
        return <LoadingState label={title} className={className} />;
    }
  }

  if (state === "error") {
    return (
      <ErrorState
        title={title || "Đã xảy ra lỗi"}
        message={description}
        onRetry={onRetry}
        className={className}
      />
    );
  }

  if (state === "empty") {
    return (
      <EmptyState
        title={title || "Không có dữ liệu"}
        description={description}
        action={emptyAction}
        className={className}
        live="polite"
      />
    );
  }

  return <>{children}</>;
}
