import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QualityProfile } from "@/lib/mirats/document-ocr/provider";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { Info } from "lucide-react";

export interface OcrSettingsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  quality: QualityProfile | "auto";
  onQualityChange: (quality: QualityProfile | "auto") => void;
  deviceTier?: string;
  autoReason?: string;
}

export function OcrSettings({
  enabled,
  onEnabledChange,
  quality,
  onQualityChange,
  deviceTier,
  autoReason,
}: OcrSettingsProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="ocr-enabled"
          checked={enabled}
          onCheckedChange={(checked) => onEnabledChange(checked === true)}
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="ocr-enabled"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Trích xuất nội dung để tìm kiếm (OCR)
          </Label>
          <p className="text-xs text-muted-foreground">
            Tự động nhận diện chữ viết trong PDF scan hoặc ảnh để tìm kiếm sau này.
          </p>
        </div>
      </div>

      {enabled && (
        <div className="grid gap-2 pl-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="ocr-quality" className="text-xs">
                Chế độ xử lý:
              </Label>
              <AppTooltip noiDung="Chất lượng cao hơn sẽ tốn nhiều tài nguyên hơn và lâu hơn.">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </AppTooltip>
            </div>
            <Select
              value={quality}
              onValueChange={(v) => onQualityChange(v as QualityProfile | "auto")}
            >
              <SelectTrigger id="ocr-quality" className="h-8 w-[140px] text-xs">
                <SelectValue placeholder="Chọn chất lượng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Tự động (Khuyên dùng)</SelectItem>
                <SelectItem value="eco">Tiết kiệm (Nhanh)</SelectItem>
                <SelectItem value="balanced">Cân bằng</SelectItem>
                <SelectItem value="quality">Chất lượng cao</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {quality === "auto" && deviceTier && (
            <p className="text-[10px] text-muted-foreground italic">
              * Tự động chọn dựa trên thiết bị ({deviceTier}). {autoReason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
