import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { HongHocMoiForm } from "@/components/mirats/quick/HongHocMoiForm";

export const Route = createFileRoute("/_app/hong-hoc/moi")({
  head: () => ({
    meta: [
      { title: "Tạo phiếu hỏng hóc — MIRATS" },
      { name: "description", content: "Lập phiếu hỏng hóc–thay thế mới, gắn với sự cố nguồn và vị trí lắp đặt để khép vòng lý lịch tài sản." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { suCo?: string; heThong?: string; thietBi?: string } => ({
    suCo: typeof s.suCo === "string" ? s.suCo : undefined,
    heThong: typeof s.heThong === "string" ? s.heThong : undefined,
    thietBi: typeof s.thietBi === "string" ? s.thietBi : undefined,
  }),
  component: Page,
});

function Page() {
  const sp = Route.useSearch();
  const nav = useNavigate();
  return (
    <HongHocMoiForm
      defaultSuCo={sp.suCo}
      defaultHeThongId={sp.heThong}
      defaultThietBi={sp.thietBi}
      onDone={() => nav({ to: "/hong-hoc" })}
    />
  );
}
