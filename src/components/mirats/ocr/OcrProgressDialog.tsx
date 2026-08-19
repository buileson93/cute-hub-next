import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Pause, Play, XCircle } from "lucide-react";

export interface OcrProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  currentPage: number;
  totalPages: number;
  status: string;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export function OcrProgressDialog({
  open,
  onOpenChange,
  fileName,
  currentPage,
  totalPages,
  status,
  isPaused,
  onPause,
  onResume,
  onCancel,
}: OcrProgressDialogProps) {
  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-base">Đang trích xuất nội dung</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <p className="text-xs font-medium truncate" title={fileName}>
              Tệp: {fileName}
            </p>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Trang {currentPage} / {totalPages}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3 text-xs">
            {status.includes("OCR") || status.includes("Đang") ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full bg-blue-500" />
            )}
            <span className="flex-1">{status}</span>
          </div>
        </div>
        <DialogFooter className="flex-row justify-center gap-2 sm:justify-center">
          {isPaused ? (
            <Button variant="outline" size="sm" onClick={onResume} className="flex-1 gap-1.5">
              <Play className="h-3.5 w-3.5" /> Tiếp tục
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onPause} className="flex-1 gap-1.5">
              <Pause className="h-3.5 w-3.5" /> Tạm dừng
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50">
            <XCircle className="h-3.5 w-3.5" /> Hủy bỏ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
