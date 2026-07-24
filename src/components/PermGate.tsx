import type { ReactNode } from "react";
import { useCan } from "@/hooks/use-permissions";

type Props = {
  module: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Ẩn/hiện UI theo ma trận quyền role_permission.
 * <PermGate module="thiet_bi" action="delete">…nút Xóa…</PermGate>
 */
export function PermGate({ module, action, children, fallback = null }: Props) {
  const allowed = useCan(module, action);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
