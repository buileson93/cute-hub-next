import React from "react";
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Loader2, 
  PauseCircle, 
  PlayCircle, 
  RotateCcw 
} from "lucide-react";
import { OcrStatus } from "@/lib/mirats/document-ocr/types";
import { Badge } from "@/components/ui/badge";
import { AppTooltip } from "@/components/mirats/AppTooltip";

export interface OcrStatusBadgeProps {
  status: OcrStatus;
  processedPages?: number;
  totalPages?: number;
  className?: string;
}

export function OcrStatusBadge({ status, processedPages, totalPages, className }: OcrStatusBadgeProps) {
  const progressText = totalPages ? ` (${processedPages}/${totalPages})` : "";

  switch (status) {
    case "completed":
      return (
        <Badge variant="outline" className={`bg-green-50 text-green-700 border-green-200 gap-1 ${className}`}>
          <CheckCircle2 className="h-3 w-3" /> Hoàn tất
        </Badge>
      );
    case "partial":
      return (
        <Badge variant="outline" className={`bg-yellow-50 text-yellow-700 border-yellow-200 gap-1 ${className}`}>
          <PauseCircle className="h-3 w-3" /> Một phần{progressText}
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className={`bg-red-50 text-red-700 border-red-200 gap-1 ${className}`}>
          <AlertCircle className="h-3 w-3" /> Thất bại
        </Badge>
      );
    case "ocr_running":
    case "extracting":
      return (
        <Badge variant="outline" className={`bg-blue-50 text-blue-700 border-blue-200 gap-1 ${className}`}>
          <Loader2 className="h-3 w-3 animate-spin" /> Đang xử lý{progressText}
        </Badge>
      );
    case "queued":
      return (
        <Badge variant="outline" className={`bg-gray-50 text-gray-600 border-gray-200 gap-1 ${className}`}>
          <Circle className="h-3 w-3" /> Chờ xử lý
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className={`bg-gray-100 text-gray-500 border-gray-200 gap-1 ${className}`}>
          <PauseCircle className="h-3 w-3" /> Đã hủy
        </Badge>
      );
    default:
      return null;
  }
}
