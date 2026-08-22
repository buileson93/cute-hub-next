import { createFileRoute } from "@tanstack/react-router";
import { ThietBiDetail } from "@/components/mirats/thiet-bi-detail";
import { useDbTaxonomy } from "@/lib/mirats/db-taxonomy";
import { useOperationsData } from "@/lib/mirats/db-operations";

export const Route = createFileRoute("/_app/thiet-bi/$maThietBi")({
  component: ThietBiDetailRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string | undefined) || undefined,
    doc: (search.doc as string | undefined) || undefined,
    q: (search.q as string | undefined) || undefined,
  }),
});

function ThietBiDetailRoute() {
  const { maThietBi: ma } = Route.useParams();
  const { tab, doc: initialDocId } = Route.useSearch();

  const { data: taxonomy } = useDbTaxonomy();
  const asset = taxonomy?.devices.find((d) => d.ma_thiet_bi === ma);

  const { ops, isLoading } = useOperationsData();
  const { suCo, baoTri, hongHoc } = ops;

  if (isLoading)
    return <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>;
  if (!asset) {
    return (
      <div className="p-8 text-center text-muted-foreground">Không tìm thấy thiết bị "{ma}"</div>
    );
  }

  return (
    <ThietBiDetail
      asset={asset}
      operations={{
        suCo: suCo || [],
        baoTri: baoTri || [],
        hongHoc: hongHoc || [],
      }}
      isLoading={isLoading}
      initialTab={tab || "tong-quan"}
      initialDocId={initialDocId || null}
    />
  );
}
