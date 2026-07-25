import { createFileRoute } from "@tanstack/react-router";
import { SuCoMoiForm } from "@/components/mirats/quick/SuCoMoiForm";

export const Route = createFileRoute("/_app/su-co/moi")({
  head: () => ({
    meta: [
      { title: "Báo cáo ban đầu sự cố — MIRATS 2.0" },
      { name: "description", content: "Lập biên bản báo cáo ban đầu về sự cố kỹ thuật, ghi vào sổ lý lịch tài sản và hệ thống, xuất Word theo mẫu." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { heThong?: string; thietBi?: string; from?: string; voice?: string } => ({
    heThong: typeof s.heThong === "string" ? s.heThong : undefined,
    thietBi: typeof s.thietBi === "string" ? s.thietBi : undefined,
    from: typeof s.from === "string" ? s.from : undefined,
    voice: typeof s.voice === "string" ? s.voice : undefined,
  }),
  component: Page,
});

function Page() {
  const sp = Route.useSearch();
  return (
    <SuCoMoiForm
      defaultHeThongId={sp.heThong}
      defaultThietBi={sp.thietBi}
      defaultFrom={sp.from}
      defaultVoice={sp.voice}
    />
  );
}
