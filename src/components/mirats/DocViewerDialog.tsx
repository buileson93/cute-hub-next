// ============================================================================
// DocViewerDialog — Xem trực tiếp PDF / DOCX / ảnh trong app, không cần tải về.
// - PDF, ảnh: render bằng <iframe>/<img> (trình duyệt hỗ trợ sẵn).
// - DOCX / XLSX / PPTX: dùng Microsoft Office Online Viewer (yêu cầu URL công khai
//   truy cập được từ Internet — signed URL của Supabase Storage đủ điều kiện).
// ============================================================================
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
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
  open, onOpenChange, url, fileName, mimeType,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string | null;
  fileName: string;
  mimeType?: string | null;
}) {
  const kind = detectKind(fileName, mimeType);
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
          {!url ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Đang tải…</div>
          ) : kind === "pdf" ? (
            <iframe src={url} title={fileName} className="h-full w-full" />
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