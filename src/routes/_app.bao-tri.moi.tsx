import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BaoTriMoiForm } from "@/components/mirats/quick/BaoTriMoiForm";

export const Route = createFileRoute("/_app/bao-tri/moi")({
  head: () => ({
    meta: [
      { title: "Tạo phiếu bảo dưỡng — MIRATS 2.0" },
      { name: "description", content: "Lập phiếu bảo dưỡng theo mẫu của từng hệ thống, ghi vào sổ lý lịch tài sản và hệ thống." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { heThong?: string; version?: string; congViec?: string } => ({
    heThong: typeof s.heThong === "string" ? s.heThong : undefined,
    version: typeof s.version === "string" ? s.version : undefined,
    congViec: typeof s.congViec === "string" ? s.congViec : undefined,
  }),
  component: Page,
});

function Page() {
  const sp = Route.useSearch();
  const nav = useNavigate();
  return (
    <BaoTriMoiForm
      defaultHeThongId={sp.heThong}
      defaultVersion={sp.version}
      defaultCongViec={sp.congViec}
      onDone={() => nav({ to: "/bao-tri" })}
    />
  );
}
