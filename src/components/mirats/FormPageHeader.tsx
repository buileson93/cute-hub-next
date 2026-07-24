import type * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "./PageHeader";

export interface FormPageHeaderProps {
  /** Route để quay lại danh sách. */
  backTo: string;
  /** Nhãn nút quay lại (VD: "Nhật ký sự cố", "Danh sách"). */
  backLabel: string;
  title: string;
  description?: React.ReactNode;
  help?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  /** Slot bổ sung bên phải tiêu đề (badge trạng thái, nút phụ…). */
  actions?: React.ReactNode;
}

/**
 * Header chuẩn cho các trang *.moi (form tạo mới): nút "Quay lại" giữ nguyên
 * flow điều hướng, bên dưới là PageHeader thống nhất (icon + title + description).
 */
export function FormPageHeader({
  backTo,
  backLabel,
  title,
  description,
  help,
  icon,
  actions,
}: FormPageHeaderProps) {
  return (
    <div className="space-y-2">
      <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 gap-1 text-muted-foreground hover:text-foreground">
        <Link to={backTo}>
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
      </Button>
      <PageHeader
        icon={icon}
        title={title}
        description={description}
        help={help}
        actions={actions}
      />
    </div>
  );
}
