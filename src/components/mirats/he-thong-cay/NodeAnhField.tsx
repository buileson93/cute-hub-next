// ============================================================================
// Ảnh đại diện của node Cây/Sơ đồ hệ thống.
// Tải lên bucket riêng tư `thiet-bi-hinh-anh`, đường dẫn lưu ở
// `cay_node_edit.du_lieu.anh_url` (không thêm bảng/cột mới).
// ============================================================================
import { useRef, useState } from "react";
import { ImageOff, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  nodeAnhKey,
  useNodeAnhMap,
  useNodeAnhMutations,
  validateNodeAnh,
  type NodeAnhKind,
} from "@/lib/mirats/node-anh";
import { thongDiepLoi } from "@/lib/mirats/errors";

interface Props {
  kind: NodeAnhKind;
  ma: string;
  ten?: string | null;
  canManage: boolean;
}

export function NodeAnhField({ kind, ma, ten, canManage }: Props) {
  const { data: map, isLoading, error } = useNodeAnhMap();
  const { upload, remove } = useNodeAnhMutations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [anhLoi, setAnhLoi] = useState(false);

  const url = map?.get(nodeAnhKey(kind, ma)) ?? null;
  const dangXuLy = upload.isPending || remove.isPending;

  function chon(file: File | undefined) {
    if (!file) return;
    const loi = validateNodeAnh(file);
    if (loi) {
      toast.error(loi);
      return;
    }
    setAnhLoi(false);
    upload.mutate(
      { kind, ma, ten, file },
      {
        onSuccess: () => toast.success("Đã cập nhật ảnh"),
        onError: (e) => toast.error(thongDiepLoi(e, "Không thao tác được với ảnh")),
      },
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted/40">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : url && !anhLoi ? (
          <img
            src={url}
            alt={`Ảnh của ${ten ?? ma}`}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setAnhLoi(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-6 w-6" aria-hidden="true" />
            <span className="sr-only">Chưa có ảnh</span>
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-2">
        <p className="text-mini text-muted-foreground">
          {error
            ? "Không tải được ảnh. Thử lại sau."
            : "Ảnh JPG/PNG/WEBP, tối đa 10MB. Ảnh hiển thị trên sơ đồ tổng thể."}
        </p>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Chọn ảnh cho node"
              onChange={(e) => {
                chon(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={dangXuLy}
              onClick={() => inputRef.current?.click()}
            >
              {upload.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="mr-1 h-4 w-4" aria-hidden="true" />
              )}
              {url ? "Đổi ảnh" : "Tải ảnh lên"}
            </Button>
            {url && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={dangXuLy}
                onClick={() =>
                  remove.mutate(
                    { kind, ma },
                    {
                      onSuccess: () => toast.success("Đã gỡ ảnh"),
                      onError: (e) => toast.error(thongDiepLoi(e, "Không thao tác được với ảnh")),
                    },
                  )
                }
              >
                {remove.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />
                )}
                Gỡ ảnh
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
