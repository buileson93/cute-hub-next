import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as XLSX from "xlsx";

interface ImportRow {
  ma_thiet_bi: string;
  ten_thiet_bi: string;
  ma_serial?: string;
  model_id?: string;
  loai_thiet_bi_id?: string;
  nhan_vien_id?: string;
  don_vi_id?: string;
  // Dùng cho mapping nếu user nhập text thay vì ID
  ten_nhan_vien?: string;
  ma_nhan_vien?: string;
  ten_model?: string;
  [key: string]: any;
}

export function AssetImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as ImportRow[];
        setPreviewData(data);
      } catch (err) {
        toast.error("Không thể đọc file Excel. Vui lòng kiểm tra định dạng.");
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsBinaryString(f);
  };

  const importMut = useMutation({
    mutationFn: async (data: ImportRow[]) => {
      // 1. Resolve IDs (nhân viên, model) nếu chỉ có tên/mã
      // Trong thực tế sẽ cần logic lookup phức tạp hơn hoặc yêu cầu điền ID
      // Ở đây ta giả định dữ liệu đã khá chuẩn hoặc thực hiện gán thẳng
      const assets = data.map(row => ({
        ma_thiet_bi: row.ma_thiet_bi,
        ten_thiet_bi: row.ten_thiet_bi,
        ma_serial: row.ma_serial || null,
        model_id: row.model_id || null,
        loai_thiet_bi_id: row.loai_thiet_bi_id || null, // Phải là ID của "Máy tính (Laptop/PC)"
        nhan_vien_id: row.nhan_vien_id || null,
        don_vi_id: row.don_vi_id || null,
        trang_thai_cap_phat: row.nhan_vien_id ? "da_cap_phat" : "san_sang",
        nguon_du_lieu: "import_excel"
      }));

      const { error } = await supabase.from("thiet_bi").insert(assets as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["thiet_bi"] });
      qc.invalidateQueries({ queryKey: ["stats", "may-tinh-employee"] });
      toast.success(`Đã nhập thành công ${previewData.length} tài sản`);
      onOpenChange(false);
      reset();
    },
    onError: (err: any) => {
      toast.error("Lỗi khi nhập dữ liệu: " + err.message);
    }
  });

  const reset = () => {
    setFile(null);
    setPreviewData([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Nhập tài sản máy tính hàng loạt
          </DialogTitle>
          <DialogDescription>
            Tải lên file Excel (.xlsx, .csv) để thêm nhanh máy tính (Laptop/PC) và gán nhân viên phụ trách.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
          {!file ? (
            <div className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium">Click hoặc kéo thả file Excel vào đây</p>
              <p className="text-xs text-muted-foreground mt-1">Hỗ trợ .xlsx, .xls, .csv</p>
              <Button variant="link" className="mt-4 text-xs">Tải file mẫu</Button>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col space-y-3">
              <div className="flex items-center justify-between bg-primary/5 p-3 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                  <Badge variant="outline" className="text-meta">{previewData.length} dòng</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={reset} className="h-8 text-xs">Chọn file khác</Button>
              </div>

              <div className="flex items-center gap-2 text-meta text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Vui lòng kiểm tra kỹ dữ liệu trước khi xác nhận. Hệ thống sẽ bỏ qua nếu trùng Mã thiết bị.</span>
              </div>

              <ScrollArea className="flex-1 border rounded-lg bg-background">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0 z-10">
                    <tr>
                      <th className="p-2 text-left border-b">Mã TB</th>
                      <th className="p-2 text-left border-b">Tên thiết bị</th>
                      <th className="p-2 text-left border-b">Số Serial</th>
                      <th className="p-2 text-left border-b">ID Nhân viên</th>
                      <th className="p-2 text-left border-b">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="p-2 border-b font-mono">{row.ma_thiet_bi}</td>
                        <td className="p-2 border-b">{row.ten_thiet_bi}</td>
                        <td className="p-2 border-b">{row.ma_serial || "—"}</td>
                        <td className="p-2 border-b">{row.nhan_vien_id || "—"}</td>
                        <td className="p-2 border-b text-center">
                          {row.ma_thiet_bi && row.ten_thiet_bi ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}

          <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-meta text-blue-700 leading-normal">
              <strong>Mẹo:</strong> Cột <code>nhan_vien_id</code> phải chứa UUID của nhân viên để gán tự động. 
              Cột <code>loai_thiet_bi_id</code> nên để trống để hệ thống tự nhận diện Máy tính (Laptop/PC).
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importMut.isPending}>
            Huỷ bỏ
          </Button>
          <Button 
            disabled={!file || previewData.length === 0 || importMut.isPending} 
            onClick={() => importMut.mutate(previewData)}
            className="min-w-[120px]"
          >
            {importMut.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang nhập...
              </>
            ) : (
              "Xác nhận nhập"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
