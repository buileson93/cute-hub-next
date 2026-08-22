// ============================================================================
// Dialog xác nhận THÁO tài sản khỏi thành phần hệ thống.
// DEPRECATED: Vui lòng sử dụng OperationDialog để có trải nghiệm thống nhất.
// Giữ lại interface để tương thích ngược tạm thời.
// ============================================================================
import { OperationDialog } from "@/components/mirats/OperationDialog";

export interface ThaoTaiSanTarget {
  heThongId: string;
  thanhPhanId: string;
  maThanhPhan: string | null;
  tenThanhPhan: string;
  /** Vị trí HIỆN TẠI của thành phần (nguồn để hiển thị "từ đâu"). */
  viTriHienTaiId?: string | null;
  viTriHienTaiTen?: string | null;
}

export function ThaoTaiSanDialog({
  target,
  onClose,
}: {
  target: ThaoTaiSanTarget | null;
  onClose: () => void;
}) {
  if (!target) return null;

  return (
    <OperationDialog
      mode="thao"
      target={{
        heThongId: target.heThongId,
        thanhPhanId: target.thanhPhanId,
        maThanhPhan: target.maThanhPhan,
        tenThanhPhan: target.tenThanhPhan,
        viTriId: target.viTriHienTaiId,
      }}
      onClose={onClose}
      onSuccess={onClose}
    />
  );
}
