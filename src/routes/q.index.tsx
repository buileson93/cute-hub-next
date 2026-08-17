import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { QRScanner } from "@/components/mirats/QRScanner";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/q/")({
  head: () => ({
    meta: [
      { title: "Quét QR thiết bị — MIRATS" },
      { name: "description", content: "Quét mã QR trực tiếp trong app để mở nhanh lý lịch thiết bị, báo sự cố, tra bảo trì." },
      { name: "robots", content: "noindex" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
    ],
  }),
  component: QuetQrIndex,
});

function QuetQrIndex() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-md p-4">
      <h1 className="mb-3 text-lg font-semibold">Quét QR thiết bị</h1>
      <Card>
        <CardContent className="p-4">
          <QRScanner onDetect={(ma) => navigate({ to: "/q/$maThietBi", params: { maThietBi: ma } })} />
        </CardContent>
      </Card>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Ưu tiên camera sau. Nếu trình duyệt chặn, hãy nhập mã ở ô bên dưới.
      </p>
    </div>
  );
}
