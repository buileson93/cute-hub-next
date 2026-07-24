/**
 * Task 15 — Xem vật tư đã tiêu hao cho một liên kết nghiệp vụ. Đọc
 * `kho_giao_dich` (loại XUAT) join `vat_tu`, `kho`.
 */
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { fmtVND } from "@/lib/mirats/format";

type LienKetCot = "lien_ket_cong_viec_id" | "lien_ket_su_co_id" | "lien_ket_hong_hoc_id";

interface Props {
  cot: LienKetCot;
  id: string | null | undefined;
  empty?: React.ReactNode;
}

export function VatTuTieuHaoView({ cot, id, empty }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["kho_giao_dich", cot, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kho_giao_dich")
        .select("id, loai, so_luong, don_gia, ngay, ghi_chu, vat_tu:vat_tu_id ( ma_vat_tu, ten, don_vi_tinh ), kho:kho_id ( ten )")
        .eq(cot, id!)
        .order("ngay", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

  if (!id) return null;
  if (isLoading) return <div className="text-sm text-muted-foreground">Đang tải…</div>;
  if (!data || data.length === 0) return <>{empty ?? <p className="text-sm text-muted-foreground">Chưa có bút toán vật tư nào.</p>}</>;

  const tong = data
    .filter((r) => r.loai === "XUAT" || r.loai === "xuat")
    .reduce((s, r) => s + Number(r.so_luong) * Number(r.don_gia ?? 0), 0);

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ngày</TableHead>
              <TableHead>Vật tư</TableHead>
              <TableHead>Kho</TableHead>
              <TableHead className="text-right">SL</TableHead>
              <TableHead className="text-right">Đơn giá</TableHead>
              <TableHead className="text-right">Thành tiền</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r) => {
              const vt = r.vat_tu as { ma_vat_tu?: string; ten?: string; don_vi_tinh?: string } | null;
              const kho = r.kho as { ten?: string } | null;
              return (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground">{r.ngay?.slice(0, 10)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono text-xs">{vt?.ma_vat_tu}</span>
                      <span className="text-sm">· {vt?.ten}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{kho?.ten ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(r.so_luong)}{vt?.don_vi_tinh ? ` ${vt.don_vi_tinh}` : ""}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtVND(Number(r.don_gia ?? 0))}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtVND(Number(r.so_luong) * Number(r.don_gia ?? 0))}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="text-right text-sm text-muted-foreground">Chi phí vật tư xuất: <strong className="text-foreground">{fmtVND(tong)} đ</strong></div>
    </div>
  );
}
