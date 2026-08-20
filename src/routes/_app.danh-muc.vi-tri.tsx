import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CatalogTable } from "@/components/mirats/CatalogTable";
import { ViTriMediaViewer } from "@/components/mirats/ViTriMediaViewer";

export const Route = createFileRoute("/_app/danh-muc/vi-tri")({
  head: () => ({
    meta: [
      { title: "Vị trí — Danh mục MIRATS" },
      { name: "description", content: "Danh mục vị trí địa lý theo phân cấp (Đài, phòng…) đọc trực tiếp từ cơ sở dữ liệu." },
    ],
  }),
  component: ViTriPage,
});

function ViTriPage() {
  // Vị trí đang mở trình xem ảnh / 360° / 3D.
  const [media, setMedia] = useState<{ ma: string; ten: string } | null>(null);

  return (
    <>
      <CatalogTable
        table="dm_vi_tri"
        usageColumn="vi_tri_id"
        title="Vị trí"
        singular="Vị trí"
        description=""
        icon={MapPin}
        namePlaceholder="VD: Đài KSKL Phú Bài, Phòng Tài sản…"
        hiddenCols={["ma", "mo_ta", "active"]}
        
        extraRowActions={(r) => (
          <Button
            size="icon"
            variant="ghost"
            aria-label="Xem ảnh/3D vị trí"
            className="h-7 w-7"
            title="Xem ảnh / 360° / 3D vị trí"
            onClick={() => setMedia({ ma: r.ma ?? "", ten: r.ten })}
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </Button>
        )}
      />

      <ViTriMediaViewer
        open={!!media}
        onOpenChange={(v) => !v && setMedia(null)}
        viTriMa={media?.ma ?? ""}
        viTriTen={media?.ten ?? ""}
      />
    </>
  );
}
