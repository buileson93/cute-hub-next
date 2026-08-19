// ============================================================================
// DocViewerDialog — Xem trực tiếp PDF / DOCX / ảnh trong app, không cần tải về.
// - PDF, ảnh: render bằng <iframe>/<img> (trình duyệt hỗ trợ sẵn).
// - DOCX / XLSX / PPTX: dùng Microsoft Office Online Viewer (yêu cầu URL công khai
//   truy cập được từ Internet — signed URL của Supabase Storage đủ điều kiện).
// ============================================================================
import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useCanDownloadAttachments } from "@/hooks/use-can-download";

type Kind = "pdf" | "image" | "office" | "other";

function detectKind(fileName: string, mimeType?: string | null): Kind {
  const n = fileName.toLowerCase();
  const m = (mimeType ?? "").toLowerCase();
  if (m === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (m.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/.test(n)) return "image";
  if (/\.(docx?|xlsx?|pptx?)$/.test(n) || m.includes("officedocument") || m.includes("msword") || m.includes("ms-excel") || m.includes("ms-powerpoint")) return "office";
  return "other";
}

export function DocViewerDialog({
  open, onOpenChange, url, fileName, mimeType, isLoading, error, onRetry, initialPage, query,
  tepId, sourceType, sourceId
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string | null;
  fileName: string;
  mimeType?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  initialPage?: number;
  query?: string;
  tepId?: string;
  sourceType?: string;
  sourceId?: string;
}) {

  const kind = detectKind(fileName, mimeType);
  
  const finalUrl = useMemo(() => {
    if (!url) return null;
    if (kind !== "pdf" || !initialPage) return url;
    return `${url}#page=${initialPage}`;
  }, [url, kind, initialPage]);

  const officeSrc = url ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}` : null;
  const canDownload = useCanDownloadAttachments();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-0 sm:max-w-6xl">
        <DialogHeader className="flex flex-row items-center justify-between gap-2 border-b p-3">
          <DialogTitle className="truncate text-sm">{fileName}</DialogTitle>
          <div className="flex items-center gap-1 pr-6">
            {url && (
              <>
                <Button asChild size="sm" variant="ghost" title="Mở tab mới">
                  <a href={url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                </Button>
                {canDownload && (
                  <Button asChild size="sm" variant="ghost" title="Tải xuống">
                    <a href={url} download={fileName}><Download className="h-4 w-4" /></a>
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogHeader>
        <div className="h-[80vh] w-full overflow-auto bg-muted/30">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="max-w-md space-y-1">
                <div className="font-medium text-red-700">Không tải được file giấy phép</div>
                <p className="text-xs text-muted-foreground">{error}</p>
                <p className="text-xs text-muted-foreground">Có thể do lỗi mạng hoặc bạn không có quyền truy cập file này.</p>
              </div>
              {onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
                </Button>
              )}
            </div>
          ) : isLoading || !url ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Đang tải file…</span>
            </div>
          ) : kind === "pdf" ? (
            <div className="flex flex-col h-full">
              {initialPage && (
                <div className="bg-blue-50 border-b border-blue-100 px-4 py-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-blue-700">
                    Kết quả tìm thấy tại Trang {initialPage}
                  </span>
                  <span className="text-[10px] text-blue-500 italic">
                    (Cuộn xuống nếu trình duyệt không tự nhảy trang)
                  </span>
                </div>
              )}
              <iframe src={finalUrl || url || ''} title={fileName} className="flex-1 w-full" />
            </div>
          ) : kind === "image" ? (
            <div className="flex h-full items-center justify-center p-4">
              <img src={url} alt={fileName} className="max-h-full max-w-full object-contain" />
            </div>
          ) : kind === "office" && officeSrc ? (
            <iframe src={officeSrc} title={fileName} className="h-full w-full" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
              <p>Loại tệp này chưa hỗ trợ xem trực tiếp trong ứng dụng.</p>
              {canDownload ? (
                <Button asChild size="sm">
                  <a href={url} download={fileName}><Download className="mr-2 h-4 w-4" /> Tải xuống</a>
                </Button>
              ) : (
                <p className="text-xs">Tài khoản của bạn không có quyền tải tệp này.</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}