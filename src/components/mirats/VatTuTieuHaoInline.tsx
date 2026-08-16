/**
 * Task 15 — Form nhỏ "Vật tư sử dụng" tái dùng cho Công việc bảo dưỡng /
 * Hỏng hóc / Sự cố. Mỗi dòng {vật tư, kho, số lượng, ghi chú} → gọi RPC
 * `kho_xuat` với đúng khoá liên kết → bảng `kho_giao_dich` phát sinh bút
 * toán XUẤT, tồn kho & chi phí phản ánh tiêu hao thực.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/backend/client";
import { ghiTieuHao, type DongTieuHao, type LienKetTieuHao } from "@/lib/mirats/kho-tieu-hao";
import { toast } from "sonner";

interface Props {
  lienKet: LienKetTieuHao;
  /** Gọi khi người dùng đã ghi xong xuất kho. Trả về danh sách id kho_giao_dich đã tạo. */
  onXong?: (ids: string[]) => void;
  /** Ẩn phần tiêu đề khi nhúng trong dialog khác. */
  hideTitle?: boolean;
}

interface DongForm extends DongTieuHao {
  key: string;
}

const _newRow = (): DongForm => ({ key: crypto.randomUUID(), vat_tu_id: "", kho_id: "", so_luong: 1 });

export function VatTuTieuHaoInline({ lienKet, onXong, hideTitle }: Props) {
  const [rows, setRows] = useState<DongForm[]>([_newRow()]);
  const [busy, setBusy] = useState(false);
  const { data: tonKhoModel } = useQuery({
    queryKey: ["view_ton_kho_model"],
    queryFn: async () => {
      const { data, error } = await supabase.from("view_ton_kho_model").select("*");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });


  const { data: vatTuList } = useQuery({
    queryKey: ["vat_tu", "pick"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vat_tu")
        .select("id, ma_vat_tu, ten, don_vi_tinh, don_gia, model_id")
        .eq("kich_hoat", true)
        .order("ten");
      if (error) throw error;
      return data ?? [];
    },

    staleTime: 60_000,
  });
  const { data: khoList } = useQuery({
    queryKey: ["kho", "pick"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kho")
        .select("id, ma_kho, ten")
        .eq("kich_hoat", true)
        .order("ten");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const validRows = useMemo(
    () => rows.filter((r) => r.vat_tu_id && r.kho_id && r.so_luong > 0),
    [rows],
  );

  function update(key: string, patch: Partial<DongForm>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function remove(key: string) {
    setRows((prev) => (prev.length <= 1 ? [_newRow()] : prev.filter((r) => r.key !== key)));
  }
  function add() {
    setRows((prev) => [...prev, _newRow()]);
  }

  async function submit() {
    if (validRows.length === 0) {
      onXong?.([]);
      return;
    }
    setBusy(true);
    try {
      const ids = await ghiTieuHao(validRows, lienKet);
      toast.success(`Đã ghi ${ids.length} bút toán xuất kho`);
      setRows([_newRow()]);
      onXong?.(ids);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không ghi được xuất kho");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {!hideTitle && (
        <div className="flex items-center gap-2 text-sm font-medium">
          <Package className="h-4 w-4" /> Vật tư sử dụng
        </div>
      )}
      <div className="space-y-2">
        {rows.map((r) => {
          const vt = vatTuList?.find((v) => v.id === r.vat_tu_id);
          return (
            <div key={r.key} className="grid grid-cols-[1fr_1fr_90px_36px] items-end gap-2">
              <div>
                <Label className="text-[11px] text-muted-foreground">Vật tư</Label>
                <Select value={r.vat_tu_id} onValueChange={(v) => update(r.key, { vat_tu_id: v, don_gia: vatTuList?.find((x) => x.id === v)?.don_gia ?? undefined })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Chọn vật tư" /></SelectTrigger>
                  <SelectContent>
                    {(vatTuList ?? []).map((v) => {
                      const stk = tonKhoModel?.find(t => t.model_id === v.model_id);
                      const tonText = stk ? ` (Còn ${stk.combined_total})` : "";
                      return (
                        <SelectItem key={v.id} value={v.id}>
                          <span className="font-mono text-xs mr-1">{v.ma_vat_tu}</span> {v.ten}{tonText}
                        </SelectItem>
                      );
                    })}

                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Kho xuất</Label>
                <Select value={r.kho_id} onValueChange={(v) => update(r.key, { kho_id: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Chọn kho" /></SelectTrigger>
                  <SelectContent>
                    {(khoList ?? []).map((k) => (
                      <SelectItem key={k.id} value={k.id}>{k.ten}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">SL{vt?.don_vi_tinh ? ` (${vt.don_vi_tinh})` : ""}</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  className="h-9"
                  value={r.so_luong}
                  onChange={(e) => update(r.key, { so_luong: Number(e.target.value) })}
                />
              </div>
              <Button type="button" size="icon" variant="ghost" className="h-9 w-9" onClick={() => remove(r.key)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button type="button" size="sm" variant="outline" onClick={add}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Thêm dòng
        </Button>
        <Button type="button" size="sm" disabled={busy} onClick={submit}>
          {validRows.length > 0 ? `Ghi xuất ${validRows.length} dòng` : "Bỏ qua"}
        </Button>
      </div>
    </div>
  );
}
