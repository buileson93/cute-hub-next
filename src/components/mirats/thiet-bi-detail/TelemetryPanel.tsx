import React from "react";
import { Activity, History, LineChart, AlertCircle } from "lucide-react";
import { useTelemetry } from "@/lib/mirats/db-smart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TelemetryPanel({
  thietBiId,
  canManage,
}: {
  thietBiId: string;
  canManage?: boolean;
}) {
  const { data = [], isLoading, error } = useTelemetry(thietBiId);

  if (isLoading)
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Đang tải dữ liệu đo đạc...
      </div>
    );
  if (error)
    return <div className="py-8 text-center text-sm text-destructive">Lỗi tải dữ liệu đo đạc.</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <LineChart className="h-4 w-4" /> Biểu đồ xu hướng (Sparkline)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-32 flex items-center justify-center border-t bg-muted/10">
          <span className="text-xs text-muted-foreground italic">
            Biểu đồ đang được tối ưu hóa...
          </span>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[150px]">Thời điểm</TableHead>
              <TableHead>Chỉ số</TableHead>
              <TableHead className="text-right">Giá trị</TableHead>
              <TableHead>Đơn vị</TableHead>
              <TableHead>Ghi chú</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Chưa có dữ liệu đo đạc cho thiết bị này.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">
                    {row.thoi_diem ? new Date(row.thoi_diem).toLocaleString("vi-VN") : "—"}
                  </TableCell>
                  <TableCell className="font-medium">{row.chi_so}</TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {row.gia_tri !== null ? row.gia_tri.toLocaleString("vi-VN") : "—"}
                  </TableCell>
                  <TableCell>{row.don_vi_do || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.ghi_chu || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
