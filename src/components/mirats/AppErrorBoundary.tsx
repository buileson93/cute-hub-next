import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "./ErrorState";
import { captureError } from "@/lib/observability/capture";

// Task 39 — Ranh giới lỗi cấp ứng dụng cho các khối con.
// Khác với `errorComponent` của TanStack Router (bắt lỗi loader), lớp này bắt
// lỗi render/effect của cây React con — tránh trắng cả trang khi 1 widget hỏng.

interface Props {
  children: ReactNode;
  /** Nhãn để phân biệt log giữa các boundary trong cùng trang. */
  boundary?: string;
  /** UI thay thế; mặc định dùng ErrorState với nút thử lại. */
  fallback?: (opts: { error: Error; reset: () => void }) => ReactNode;
}

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureError(error, {
      boundary: this.props.boundary ?? "AppErrorBoundary",
      componentStack: info.componentStack,
    });
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback({ error: this.state.error, reset: this.reset });
      }
      return (
        <ErrorState
          title="Khối giao diện gặp sự cố"
          message={this.state.error.message}
          onRetry={this.reset}
        />
      );
    }
    return this.props.children;
  }
}
