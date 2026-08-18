import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { useAllocationHistory, useTelemetry, useLifecycle, useTrangThaiMap } from "@/lib/mirats/db-smart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History as HistoryIcon, Activity, Move, RefreshCw } from "lucide-react";

export function TelemetryPanel({ thietBiId }: { thietBiId: string }) {
  const { data: metrics, isLoading } = useTelemetry(thietBiId);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Activity className="h-4 w-4" />
        <span>Thông số kỹ thuật & Đo đạc</span>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời điểm</TableHead>
              <TableHead>Chỉ số</TableHead>
              <TableHead>Giá trị</TableHead>
              <TableHead>Đơn vị</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Đang tải dữ liệu...</TableCell></TableRow>
            ) : !metrics?.length ? (
              <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Chưa có dữ liệu đo đạc.</TableCell></TableRow>
            ) : metrics.map((m, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs font-mono">{new Date(m.thoi_diem).toLocaleString("vi-VN")}</TableCell>
                <TableCell>{m.chi_so}</TableCell>
                <TableCell className="font-semibold">{m.gia_tri}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.don_vi_do}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function AllocationPanel({ thietBiId, donViTenMap = {} }: { thietBiId: string; donViTenMap?: Record<string, string> }) {
  const { data: history, isLoading } = useAllocationHistory(thietBiId);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Move className="h-4 w-4" />
        <span>Lịch sử cấp phát & Điều chuyển</span>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời điểm</TableHead>
              <TableHead>Hành động</TableHead>
              <TableHead>Người giữ</TableHead>
              <TableHead>Đơn vị sử dụng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Đang tải dữ liệu...</TableCell></TableRow>
            ) : !history?.length ? (
              <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Chưa có lịch sử cấp phát.</TableCell></TableRow>
            ) : history.map((h, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs font-mono">{new Date(h.thoi_diem).toLocaleString("vi-VN")}</TableCell>
                <TableCell>
                  <Badge variant={h.hanh_dong === "cap_phat" ? "default" : "secondary"} className={h.hanh_dong === "cap_phat" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}>
                    {h.hanh_dong === "cap_phat" ? "Cấp phát" : "Thu hồi"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{h.nguoi_giu || "—"}</TableCell>
                <TableCell className="text-sm">{h.don_vi_giu_id ? (donViTenMap[h.don_vi_giu_id] || h.don_vi_giu_id) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function LifecyclePanel({ thietBiId }: { thietBiId: string }) {
  const { data: statusMap } = useTrangThaiMap();
  const { data: lifecycle, isLoading } = useLifecycle(thietBiId);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <RefreshCw className="h-4 w-4" />
        <span>Vòng đời & Trạng thái kỹ thuật</span>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời điểm</TableHead>
              <TableHead>Trạng thái mới</TableHead>
              <TableHead>Lý do</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">Đang tải dữ liệu...</TableCell></TableRow>
            ) : !lifecycle?.length ? (
              <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">Chưa có bản ghi vòng đời.</TableCell></TableRow>
            ) : lifecycle.map((l, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs font-mono">{new Date(l.thoi_diem).toLocaleString("vi-VN")}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{statusMap?.get(l.den_trang_thai_id || "") || l.den_trang_thai_id || "—"}</Badge>
                </TableCell>
                <TableCell className="text-sm italic">{l.ly_do || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
