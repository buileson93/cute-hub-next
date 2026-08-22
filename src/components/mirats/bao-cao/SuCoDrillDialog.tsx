// ============================================================================
// Hộp thoại "khoan sâu" danh sách sự cố — dùng chung cho 4 điểm drill-down của
// trang Độ tin cậy (theo hệ thống, theo giờ×thứ, theo mức độ, theo mốc thời gian).
// ============================================================================
import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/mirats/EmptyState";

export type SuCoDrillRow = {
  ma_su_co: string;
  hien_tuong?: string | null;
  ngay_phat_hien?: string | null;
  trang_thai?: string | null;
  muc_do?: string | null;
};

export function SuCoDrillDialog({
  open,
  onClose,
  title,
  description,
  rows,
  isLoading,
  showMucDo = true,
  emptyDescription = "Không có sự cố trong phạm vi này.",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description: React.ReactNode;
  rows: SuCoDrillRow[] | undefined;
  isLoading: boolean;
  showMucDo?: boolean;
  emptyDescription?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : !rows?.length ? (
          <EmptyState title="Không có sự cố" description={emptyDescription} />
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Mã SC</TableHead>
                  <TableHead>Hiện tượng</TableHead>
                  <TableHead className="w-40">Phát hiện</TableHead>
                  {showMucDo && <TableHead className="w-24">Mức</TableHead>}
                  <TableHead className="w-28">Trạng thái</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => (
                  <TableRow key={s.ma_su_co}>
                    <TableCell className="font-mono text-xs">{s.ma_su_co}</TableCell>
                    <TableCell className="max-w-[24rem] truncate">{s.hien_tuong ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {s.ngay_phat_hien ? new Date(s.ngay_phat_hien).toLocaleString("vi-VN") : "—"}
                    </TableCell>
                    {showMucDo && (
                      <TableCell>
                        <Badge variant="outline">{s.muc_do ?? "—"}</Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="secondary">{s.trang_thai ?? "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        to="/su-co/$maSuCo"
                        params={{ maSuCo: s.ma_su_co }}
                        className="inline-flex items-center text-primary hover:underline"
                        onClick={onClose}
                        aria-label={`Mở sự cố ${s.ma_su_co}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
