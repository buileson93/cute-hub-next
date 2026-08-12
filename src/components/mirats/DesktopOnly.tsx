import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Monitor, Mail, Pin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DesktopOnlyProps {
  children: React.ReactNode;
  reason?: string;
  pinPath?: string;
  featureName?: string;
}

/**
 * Hạng G3 — CÔNG CỤ CHUYÊN SÂU
 * Hiển thị thông báo khi tính năng chỉ hoạt động tốt trên Desktop
 */
export function DesktopOnly({ 
  children, 
  reason = "Tính năng này cần màn hình rộng để sử dụng hiệu quả.", 
  pinPath,
  featureName = "Tính năng chuyên sâu"
}: DesktopOnlyProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <>{children}</>;
  }

  const handlePin = () => {
    toast.success(`Đã ghim ${featureName} vào danh sách xem sau trên máy tính.`);
    // Logic ghim thực tế sẽ được tích hợp với user_pinned
  };

  const handleSendEmail = () => {
    toast.info("Đang chuẩn bị gửi đường dẫn vào email của bạn...");
  };

  return (
    <Card className="m-4 border-dashed bg-muted/50">
      <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-4">
        <div className="p-3 bg-background rounded-full shadow-sm">
          <Monitor className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h3 className="font-semibold text-lg">Chỉ dành cho máy tính</h3>
          <p className="text-sm text-muted-foreground">
            {reason}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={handleSendEmail} className="gap-2">
            <Mail className="w-4 h-4" />
            Gửi email link
          </Button>
          {pinPath && (
            <Button variant="outline" size="sm" onClick={handlePin} className="gap-2">
              <Pin className="w-4 h-4" />
              Ghim xem sau
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
